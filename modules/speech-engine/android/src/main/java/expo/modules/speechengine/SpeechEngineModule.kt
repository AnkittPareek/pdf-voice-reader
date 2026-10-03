package expo.modules.speechengine

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.UUID

class SpeechEngineModule : Module() {
  private var tts: TextToSpeech? = null
  private var isInitialized = false
  private var currentUtterancePromise: Promise? = null
  private var currentUtteranceId: String? = null
  private var isPaused = false
  private var pausedText: String? = null
  private var pausedOptions: Map<String, Any?>? = null
  private var pausedCharOffset: Int = 0

  private val context: Context
    get() = appContext.reactContext ?: throw CodedException("Context is not available", null)

  private val initLock = Any()
  private val pendingCallbacks = mutableListOf<Pair<(TextToSpeech) -> Unit, (Throwable) -> Unit>>()
  private var isInitializing = false

  private fun ensureInitialized(onReady: (TextToSpeech) -> Unit, onError: (Throwable) -> Unit) {
    synchronized(initLock) {
      val existing = tts
      if (isInitialized && existing != null) {
        onReady(existing)
        return
      }

      pendingCallbacks.add(Pair(onReady, onError))

      if (isInitializing) {
        return
      }

      isInitializing = true
      try {
        tts = TextToSpeech(context) { status ->
          synchronized(initLock) {
            isInitializing = false
            if (status == TextToSpeech.SUCCESS) {
              isInitialized = true
              setupProgressListener()
              val readyTts = tts
              if (readyTts != null) {
                val callbacks = pendingCallbacks.toList()
                pendingCallbacks.clear()
                callbacks.forEach { it.first(readyTts) }
              } else {
                val err = CodedException("TTS_UNAVAILABLE", "TextToSpeech instance is null.", null)
                val callbacks = pendingCallbacks.toList()
                pendingCallbacks.clear()
                callbacks.forEach { it.second(err) }
              }
            } else {
              isInitialized = false
              val err = CodedException("TTS_UNAVAILABLE", "Text-to-speech initialization failed.", null)
              val callbacks = pendingCallbacks.toList()
              pendingCallbacks.clear()
              callbacks.forEach { it.second(err) }
            }
          }
        }
      } catch (e: Exception) {
        isInitializing = false
        val err = CodedException("TTS_UNAVAILABLE", e.message, e)
        val callbacks = pendingCallbacks.toList()
        pendingCallbacks.clear()
        callbacks.forEach { it.second(err) }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("SpeechEngine")

    Events("onSpeechStart", "onSpeechDone", "onSpeechError", "onSpeechRange")

    AsyncFunction("initialize") { promise: Promise ->
      ensureInitialized(
        onReady = { promise.resolve(true) },
        onError = { err -> promise.reject(CodedException("TTS_UNAVAILABLE", err.message, err)) }
      )
    }

    AsyncFunction("getVoices") { promise: Promise ->
      ensureInitialized(
        onReady = { currentTts ->
          CoroutineScope(Dispatchers.IO).launch {
            val voicesList = mutableListOf<Map<String, Any?>>()

            try {
              val voices = currentTts.voices
              if (voices != null) {
                for (voice in voices) {
                  voicesList.add(
                    mapOf(
                      "id" to voice.name,
                      "name" to voice.name,
                      "locale" to voice.locale.toLanguageTag(),
                      "quality" to voice.quality,
                      "requiresNetwork" to voice.isNetworkConnectionRequired
                    )
                  )
                }
              }
            } catch (_: Exception) {
              val defLocale = currentTts.defaultVoice?.locale ?: Locale.getDefault()
              voicesList.add(
                mapOf(
                  "id" to "system_default",
                  "name" to "System Default (${defLocale.displayLanguage})",
                  "locale" to defLocale.toLanguageTag(),
                  "quality" to 300,
                  "requiresNetwork" to false
                )
              )
            }

            promise.resolve(voicesList)
          }
        },
        onError = {
          promise.resolve(emptyList<Map<String, Any?>>())
        }
      )
    }

    AsyncFunction("speak") { text: String, options: Map<String, Any?>?, promise: Promise ->
      ensureInitialized(
        onReady = { currentTts ->
          val rate = (options?.get("rate") as? Number)?.toFloat() ?: 1.0f
          currentTts.setSpeechRate(rate.coerceIn(0.5f, 2.5f))

          val voiceId = options?.get("voiceId") as? String
          val localeTag = options?.get("locale") as? String

          if (!voiceId.isNullOrBlank()) {
            try {
              val matchingVoice = currentTts.voices?.find { it.name == voiceId }
              if (matchingVoice != null) {
                currentTts.voice = matchingVoice
              }
            } catch (_: Exception) {}
          } else if (!localeTag.isNullOrBlank()) {
            try {
              val targetLocale = Locale.forLanguageTag(localeTag)
              currentTts.language = targetLocale
            } catch (_: Exception) {}
          }

          val utteranceId = UUID.randomUUID().toString()
          currentUtteranceId = utteranceId
          currentUtterancePromise = promise
          isPaused = false
          pausedText = text
          pausedOptions = options
          pausedCharOffset = 0

          val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
          }

          val result = currentTts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
          if (result != TextToSpeech.SUCCESS) {
            currentUtterancePromise = null
            currentUtteranceId = null
            promise.reject(CodedException("SPEAK_ERROR", "Failed to queue speech in TTS engine.", null))
          }
        },
        onError = { err ->
          promise.reject(CodedException("TTS_UNAVAILABLE", err.message, err))
        }
      )
    }

    AsyncFunction("stop") {
      tts?.stop()
      currentUtterancePromise?.resolve(false)
      currentUtterancePromise = null
      currentUtteranceId = null
      isPaused = false
      pausedText = null
      pausedOptions = null
      pausedCharOffset = 0
      true
    }

    AsyncFunction("pause") {
      if (tts?.isSpeaking == true) {
        isPaused = true
        tts?.stop()
        currentUtterancePromise?.resolve(false)
        currentUtterancePromise = null
        true
      } else {
        false
      }
    }

    AsyncFunction("resume") { promise: Promise ->
      if (isPaused && pausedText != null) {
        val remainingText = if (pausedCharOffset > 0 && pausedCharOffset < pausedText!!.length) {
          pausedText!!.substring(pausedCharOffset)
        } else {
          pausedText!!
        }

        ensureInitialized(
          onReady = { currentTts ->
            val utteranceId = UUID.randomUUID().toString()
            currentUtteranceId = utteranceId
            currentUtterancePromise = promise
            isPaused = false

            val params = Bundle().apply {
              putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            }

            val result = currentTts.speak(remainingText, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            if (result != TextToSpeech.SUCCESS) {
              currentUtterancePromise = null
              currentUtteranceId = null
              promise.reject(CodedException("SPEAK_ERROR", "Failed to resume speech in TTS engine.", null))
            }
          },
          onError = { err ->
            promise.reject(CodedException("TTS_UNAVAILABLE", err.message, err))
          }
        )
      } else {
        promise.resolve(false)
      }
    }

    AsyncFunction("isSpeaking") {
      tts?.isSpeaking == true
    }

    OnDestroy {
      try {
        tts?.stop()
        tts?.shutdown()
      } catch (_: Exception) {}
      tts = null
      isInitialized = false
    }
  }

  private fun setupProgressListener() {
    tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) {
        sendEvent("onSpeechStart", mapOf("utteranceId" to (utteranceId ?: "")))
      }

      override fun onDone(utteranceId: String?) {
        sendEvent("onSpeechDone", mapOf("utteranceId" to (utteranceId ?: "")))
        if (utteranceId == currentUtteranceId) {
          currentUtterancePromise?.resolve(true)
          currentUtterancePromise = null
          currentUtteranceId = null
          isPaused = false
          pausedText = null
          pausedOptions = null
        }
      }

      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String?) {
        onError(utteranceId, TextToSpeech.ERROR)
      }

      override fun onError(utteranceId: String?, errorCode: Int) {
        val errorMsg = "TTS error code: $errorCode"
        sendEvent(
          "onSpeechError",
          mapOf("utteranceId" to (utteranceId ?: ""), "error" to errorMsg)
        )
        if (utteranceId == currentUtteranceId) {
          currentUtterancePromise?.reject(CodedException("TTS_ERROR", errorMsg, null))
          currentUtterancePromise = null
          currentUtteranceId = null
          isPaused = false
        }
      }

      override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
        pausedCharOffset = start
        sendEvent(
          "onSpeechRange",
          mapOf(
            "utteranceId" to (utteranceId ?: ""),
            "start" to start,
            "end" to end
          )
        )
      }
    })
  }
}
