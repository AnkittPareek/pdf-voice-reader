/**
 * PDF Voice Reader — PdfEngine Interface & Native Adapter
 *
 * Spec reference: Section 8.1
 * The exact native implementation may change after benchmarking.
 * This interface abstracts the rendering/extraction layer.
 */

import { PdfDocumentInfo, PdfPageText } from '../../domain/documents/types';
import NativePdfEngine from '../../../modules/pdf-engine';

export interface PdfEngine {
  /**
   * Open a PDF document from a content URI.
   * Optionally binds the session to a custom document ID.
   * Returns document metadata without extracting all text.
   */
  open(uri: string, documentId?: string): Promise<PdfDocumentInfo>;

  /**
   * Extract text from a single page.
   * Must run off the UI thread.
   */
  getPageText(documentId: string, pageIndex: number): Promise<PdfPageText>;

  /**
   * Render a page to an image (returns the file path to the rendered image).
   * width is in density-independent pixels.
   */
  renderPage(
    documentId: string,
    pageIndex: number,
    width: number
  ): Promise<string>;

  /**
   * Release resources associated with the document.
   */
  close(documentId: string): Promise<void>;
}

/**
 * Mock fallback for non-native environments (Jest tests, web preview).
 */
class FallbackPdfEngine implements PdfEngine {
  private docs = new Map<string, { uri: string; pageCount: number; fileName: string }>();

  async open(uri: string, documentId?: string): Promise<PdfDocumentInfo> {
    const id = documentId || ('mock_doc_' + Math.random().toString(36).substring(7));
    const fileName = uri.split('/').pop() || 'sample.pdf';
    this.docs.set(id, { uri, pageCount: 10, fileName });
    return {
      id,
      fileName,
      pageCount: 10,
      title: fileName.replace(/\.pdf$/i, ''),
    };
  }

  async getPageText(documentId: string, pageIndex: number): Promise<PdfPageText> {
    return {
      pageIndex,
      text: `This is page ${pageIndex + 1} content. PDF Voice Reader provides offline reading for your documents.`,
      hasText: true,
    };
  }

  async renderPage(_documentId: string, _pageIndex: number, _width: number): Promise<string> {
    return '';
  }

  async close(documentId: string): Promise<void> {
    this.docs.delete(documentId);
  }
}

class DefaultPdfEngine implements PdfEngine {
  private fallback = new FallbackPdfEngine();
  private docUris = new Map<string, string>();
  private activeDocIds = new Map<string, string>();

  async open(uri: string, documentId?: string): Promise<PdfDocumentInfo> {
    if (NativePdfEngine?.openWithId && documentId) {
      try {
        const info = await NativePdfEngine.openWithId(uri, documentId);
        this.docUris.set(documentId, uri);
        this.activeDocIds.set(documentId, info.id || documentId);
        return info;
      } catch {
        // Fallback to standard open if openWithId fails
      }
    }

    if (NativePdfEngine?.open) {
      const info = await NativePdfEngine.open(uri);
      if (documentId) {
        this.docUris.set(documentId, uri);
        this.activeDocIds.set(documentId, info.id);
      }
      this.activeDocIds.set(info.id, info.id);
      this.docUris.set(info.id, uri);
      return info;
    }
    return this.fallback.open(uri, documentId);
  }

  async getPageText(documentId: string, pageIndex: number): Promise<PdfPageText> {
    const targetId = this.activeDocIds.get(documentId) || documentId;
    if (NativePdfEngine?.getPageText) {
      try {
        return await NativePdfEngine.getPageText(targetId, pageIndex);
      } catch (err: any) {
        // Attempt recovery if session expired or documentId wasn't opened yet
        const uri = this.docUris.get(documentId);
        if (uri) {
          await this.open(uri, documentId);
          const recoveredId = this.activeDocIds.get(documentId) || documentId;
          return await NativePdfEngine.getPageText(recoveredId, pageIndex);
        }
        throw err;
      }
    }
    return this.fallback.getPageText(targetId, pageIndex);
  }

  async renderPage(documentId: string, pageIndex: number, width: number): Promise<string> {
    const targetId = this.activeDocIds.get(documentId) || documentId;
    if (NativePdfEngine?.renderPage) {
      try {
        return await NativePdfEngine.renderPage(targetId, pageIndex, width);
      } catch (err: any) {
        // Attempt recovery if session expired or documentId wasn't opened yet
        const uri = this.docUris.get(documentId);
        if (uri) {
          await this.open(uri, documentId);
          const recoveredId = this.activeDocIds.get(documentId) || documentId;
          return await NativePdfEngine.renderPage(recoveredId, pageIndex, width);
        }
        throw err;
      }
    }
    return this.fallback.renderPage(targetId, pageIndex, width);
  }

  async close(documentId: string): Promise<void> {
    const targetId = this.activeDocIds.get(documentId) || documentId;
    this.activeDocIds.delete(documentId);
    this.docUris.delete(documentId);
    if (NativePdfEngine?.close) {
      return NativePdfEngine.close(targetId);
    }
    return this.fallback.close(targetId);
  }
}

export const defaultPdfEngine: PdfEngine = new DefaultPdfEngine();
