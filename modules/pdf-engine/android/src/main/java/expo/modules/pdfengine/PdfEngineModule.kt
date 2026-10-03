package expo.modules.pdfengine

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.encryption.InvalidPasswordException
import com.tom_roush.pdfbox.text.PDFTextStripper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.zip.ZipInputStream

private data class PdfSession(
  val id: String,
  val uri: Uri,
  val pfd: ParcelFileDescriptor?,
  val renderer: PdfRenderer?,
  val pdDoc: PDDocument?,
  val pageCount: Int,
  val fileName: String,
  val title: String?,
  val author: String?,
  val textPages: List<String>? = null
)

class PdfEngineModule : Module() {
  private val sessions = ConcurrentHashMap<String, PdfSession>()
  private var isPdfBoxInitialized = false

  private val context: Context
    get() = appContext.reactContext ?: throw CodedException("Context is not available", null)

  override fun definition() = ModuleDefinition {
    Name("PdfEngine")

    AsyncFunction("open") { uriString: String, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          val session = openInternal(uriString, null)
          promise.resolve(
            mapOf(
              "id" to session.id,
              "pageCount" to session.pageCount,
              "title" to session.title,
              "author" to session.author,
              "fileName" to session.fileName
            )
          )
        } catch (e: Exception) {
          promise.reject(CodedException(e.message, e))
        }
      }
    }

    AsyncFunction("openWithId") { uriString: String, documentId: String, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          val session = openInternal(uriString, documentId)
          promise.resolve(
            mapOf(
              "id" to session.id,
              "pageCount" to session.pageCount,
              "title" to session.title,
              "author" to session.author,
              "fileName" to session.fileName
            )
          )
        } catch (e: Exception) {
          promise.reject(CodedException(e.message, e))
        }
      }
    }

    AsyncFunction("getPageText") { documentId: String, pageIndex: Int, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          val session = resolveSession(documentId)
            ?: throw CodedException("NOT_FOUND", "PDF session not found for document ID: $documentId", null)

          if (pageIndex < 0 || pageIndex >= session.pageCount) {
            throw CodedException("INDEX_OUT_OF_BOUNDS", "Page index $pageIndex is out of bounds", null)
          }

          if (session.textPages != null && pageIndex < session.textPages.size) {
            val text = session.textPages[pageIndex]
            promise.resolve(
              mapOf(
                "pageIndex" to pageIndex,
                "text" to text,
                "hasText" to text.trim().isNotEmpty()
              )
            )
            return@launch
          }

          val pdDoc = session.pdDoc
          if (pdDoc == null) {
            promise.resolve(
              mapOf(
                "pageIndex" to pageIndex,
                "text" to "",
                "hasText" to false
              )
            )
            return@launch
          }

          val stripper = PDFTextStripper().apply {
            startPage = pageIndex + 1
            endPage = pageIndex + 1
            sortByPosition = true
          }
          val text = stripper.getText(pdDoc) ?: ""
          val trimmed = text.trim()

          promise.resolve(
            mapOf(
              "pageIndex" to pageIndex,
              "text" to text,
              "hasText" to trimmed.isNotEmpty()
            )
          )
        } catch (e: Exception) {
          promise.reject(CodedException(e.message, e))
        }
      }
    }

    AsyncFunction("renderPage") { documentId: String, pageIndex: Int, width: Int, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          val session = resolveSession(documentId)
            ?: throw CodedException("NOT_FOUND", "PDF session not found for document ID: $documentId", null)

          val renderer = session.renderer
          if (renderer == null) {
            // Ebook/Text documents use reflow mode
            promise.resolve(null)
            return@launch
          }

          if (pageIndex < 0 || pageIndex >= session.pageCount) {
            throw CodedException("INDEX_OUT_OF_BOUNDS", "Page index $pageIndex is out of bounds", null)
          }

          val page = renderer.openPage(pageIndex)
          try {
            val originalWidth = page.width
            val originalHeight = page.height

            val targetWidth = if (width > 0) width else originalWidth
            val targetHeight = (targetWidth.toFloat() / originalWidth.toFloat() * originalHeight).toInt().coerceAtLeast(1)

            val bitmap = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            canvas.drawColor(Color.WHITE)

            val matrix = Matrix()
            val scale = targetWidth.toFloat() / originalWidth.toFloat()
            matrix.postScale(scale, scale)

            page.render(bitmap, null, matrix, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

            val cacheDir = context.cacheDir
            val safeId = session.id.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            val outputFile = File(cacheDir, "pdf_render_${safeId}_page_${pageIndex}.png")
            FileOutputStream(outputFile).use { out ->
              bitmap.compress(Bitmap.CompressFormat.PNG, 95, out)
            }
            bitmap.recycle()

            promise.resolve("file://${outputFile.absolutePath}")
          } finally {
            page.close()
          }
        } catch (e: Exception) {
          promise.reject(CodedException(e.message, e))
        }
      }
    }

    AsyncFunction("close") { documentId: String, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        val session = sessions.remove(documentId)
        session?.let {
          try {
            it.renderer?.close()
          } catch (_: Exception) {}
          try {
            it.pdDoc?.close()
          } catch (_: Exception) {}
          try {
            it.pfd?.close()
          } catch (_: Exception) {}
        }
        promise.resolve(null)
      }
    }
  }

  private fun resolveSession(documentId: String): PdfSession? {
    sessions[documentId]?.let { return it }
    sessions.values.firstOrNull { it.uri.toString() == documentId }?.let { return it }
    if (documentId.startsWith("content://") || documentId.startsWith("file://") || documentId.startsWith("/")) {
      return try {
        openInternal(documentId, null)
      } catch (_: Exception) {
        null
      }
    }
    return null
  }

  private fun openInternal(uriString: String, documentId: String?): PdfSession {
    if (!documentId.isNullOrBlank()) {
      sessions[documentId]?.let { return it }
    }
    sessions[uriString]?.let { return it }

    val uri = Uri.parse(uriString)
    val fileName = getFileName(uri)
    val docId = if (!documentId.isNullOrBlank()) documentId else UUID.randomUUID().toString()

    // 1. Check for EPUB ebook
    if (fileName.endsWith(".epub", ignoreCase = true)) {
      val inputStream: InputStream = if (uri.scheme == "content") {
        context.contentResolver.openInputStream(uri)
      } else {
        File(uri.path ?: uriString).inputStream()
      } ?: throw CodedException("READ_ERROR", "Failed to open EPUB input stream", null)

      val chapterPages = mutableListOf<String>()
      try {
        ZipInputStream(inputStream).use { zip ->
          var entry = zip.nextEntry
          while (entry != null) {
            val name = entry.name.lowercase()
            if (!entry.isDirectory && (name.endsWith(".html") || name.endsWith(".xhtml") || name.endsWith(".htm"))) {
              val raw = zip.bufferedReader(Charsets.UTF_8).readText()
              val stripped = raw
                .replace(Regex("<style[^>]*>.*?</style>", RegexOption.DOT_MATCHES_ALL), "")
                .replace(Regex("<script[^>]*>.*?</script>", RegexOption.DOT_MATCHES_ALL), "")
                .replace(Regex("<[^>]+>"), " ")
                .replace(Regex("&nbsp;"), " ")
                .replace(Regex("&amp;"), "&")
                .replace(Regex("&lt;"), "<")
                .replace(Regex("&gt;"), ">")
                .replace(Regex("&quot;"), "\"")
                .replace(Regex("\\s+"), " ")
                .trim()
              if (stripped.length > 50) {
                chapterPages.add(stripped)
              }
            }
            entry = zip.nextEntry
          }
        }
      } catch (e: Exception) {
        throw CodedException("EPUB_PARSE_ERROR", "Failed to parse EPUB ebook: ${e.message}", e)
      }

      if (chapterPages.isEmpty()) {
        chapterPages.add("No readable text found in this EPUB.")
      }

      val title = fileName.replace(Regex("\\.epub$", RegexOption.IGNORE_CASE), "")
      val session = PdfSession(
        id = docId,
        uri = uri,
        pfd = null,
        renderer = null,
        pdDoc = null,
        pageCount = chapterPages.size,
        fileName = fileName,
        title = title,
        author = null,
        textPages = chapterPages
      )
      sessions[docId] = session
      if (!documentId.isNullOrBlank()) sessions[documentId] = session
      sessions[uriString] = session
      return session
    }

    // 2. Check for Plain Text / Markdown ebook
    if (fileName.endsWith(".txt", ignoreCase = true) || fileName.endsWith(".text", ignoreCase = true) || fileName.endsWith(".md", ignoreCase = true)) {
      val inputStream: InputStream = if (uri.scheme == "content") {
        context.contentResolver.openInputStream(uri)
      } else {
        File(uri.path ?: uriString).inputStream()
      } ?: throw CodedException("READ_ERROR", "Failed to open text file stream", null)

      val allText = inputStream.use { it.bufferedReader(Charsets.UTF_8).readText() }
      val textPages = paginateText(allText)
      val title = fileName.replace(Regex("\\.(txt|text|md)$", RegexOption.IGNORE_CASE), "")

      val session = PdfSession(
        id = docId,
        uri = uri,
        pfd = null,
        renderer = null,
        pdDoc = null,
        pageCount = textPages.size,
        fileName = fileName,
        title = title,
        author = null,
        textPages = textPages
      )
      sessions[docId] = session
      if (!documentId.isNullOrBlank()) sessions[documentId] = session
      sessions[uriString] = session
      return session
    }

    // 3. Otherwise treat as PDF
    initPdfBoxIfNeeded()

    val pfd: ParcelFileDescriptor = try {
      if (uri.scheme == "content") {
        context.contentResolver.openFileDescriptor(uri, "r")
          ?: throw CodedException("CORRUPT_PDF", "Could not open file descriptor for URI", null)
      } else {
        val file = File(uri.path ?: uriString)
        ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
      }
    } catch (e: Exception) {
      throw CodedException("CORRUPT_PDF", "We couldn't open this PDF: ${e.message}", e)
    }

    var renderer: PdfRenderer? = null
    try {
      renderer = PdfRenderer(pfd)
    } catch (_: Exception) {
      // Native PdfRenderer may fail on some non-standard PDFs
    }

    var pdDoc: PDDocument? = null
    try {
      val inputStream: InputStream = if (uri.scheme == "content") {
        context.contentResolver.openInputStream(uri)
      } else {
        val file = File(uri.path ?: uriString)
        file.inputStream()
      } ?: throw CodedException("CORRUPT_PDF", "Failed to open input stream", null)

      pdDoc = inputStream.use { PDDocument.load(it) }
    } catch (e: InvalidPasswordException) {
      pfd.close()
      renderer?.close()
      throw CodedException("PASSWORD_PROTECTED", "This PDF is password protected and cannot be read aloud.", e)
    } catch (e: Exception) {
      if (renderer == null) {
        // Fallback: If not a valid PDF, try reading as plain text
        try {
          val fallbackStream = if (uri.scheme == "content") context.contentResolver.openInputStream(uri) else File(uri.path ?: uriString).inputStream()
          val fallbackText = fallbackStream?.use { it.bufferedReader(Charsets.UTF_8).readText() } ?: ""
          if (fallbackText.isNotBlank()) {
            pfd.close()
            val textPages = paginateText(fallbackText)
            val session = PdfSession(
              id = docId,
              uri = uri,
              pfd = null,
              renderer = null,
              pdDoc = null,
              pageCount = textPages.size,
              fileName = fileName,
              title = fileName,
              author = null,
              textPages = textPages
            )
            sessions[docId] = session
            if (!documentId.isNullOrBlank()) sessions[documentId] = session
            sessions[uriString] = session
            return session
          }
        } catch (_: Exception) {}

        pfd.close()
        throw CodedException("CORRUPT_PDF", "We couldn't open this PDF: ${e.message}", e)
      }
    }

    val pageCount = renderer?.pageCount ?: pdDoc?.numberOfPages ?: 0
    if (pageCount == 0) {
      pdDoc?.close()
      renderer?.close()
      pfd.close()
      throw CodedException("EMPTY_PDF", "This PDF does not contain any pages.", null)
    }

    val docInfo = pdDoc?.documentInformation
    val title = docInfo?.title?.takeIf { it.isNotBlank() } ?: fileName
    val author = docInfo?.author?.takeIf { it.isNotBlank() }

    val session = PdfSession(
      id = docId,
      uri = uri,
      pfd = pfd,
      renderer = renderer,
      pdDoc = pdDoc,
      pageCount = pageCount,
      fileName = fileName,
      title = title,
      author = author
    )

    sessions[docId] = session
    if (!documentId.isNullOrBlank()) {
      sessions[documentId] = session
    }
    sessions[uriString] = session
    return session
  }

  private fun paginateText(text: String, pageSize: Int = 2000): List<String> {
    if (text.isBlank()) return listOf("Empty document.")
    val pages = mutableListOf<String>()
    var start = 0
    while (start < text.length) {
      var end = (start + pageSize).coerceAtMost(text.length)
      if (end < text.length) {
        val paragraphBreak = text.indexOf("\n\n", (start + pageSize * 0.7).toInt())
        if (paragraphBreak in (start + 1)..end) {
          end = paragraphBreak + 2
        } else {
          val sentenceBreak = text.indexOf(". ", (start + pageSize * 0.7).toInt())
          if (sentenceBreak in (start + 1)..end) {
            end = sentenceBreak + 2
          }
        }
      }
      val pageContent = text.substring(start, end).trim()
      if (pageContent.isNotEmpty()) {
        pages.add(pageContent)
      }
      start = end
    }
    return if (pages.isEmpty()) listOf(text) else pages
  }

  private fun initPdfBoxIfNeeded() {
    if (!isPdfBoxInitialized) {
      PDFBoxResourceLoader.init(context)
      isPdfBoxInitialized = true
    }
  }

  private fun getFileName(uri: Uri): String {
    if (uri.scheme == "content") {
      val cursor = context.contentResolver.query(uri, null, null, null, null)
      cursor?.use {
        if (it.moveToFirst()) {
          val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
          if (nameIndex != -1) {
            val name = it.getString(nameIndex)
            if (!name.isNullOrBlank()) return name
          }
        }
      }
    }
    return uri.lastPathSegment ?: "document.pdf"
  }
}
