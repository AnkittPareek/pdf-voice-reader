/**
 * PDF Voice Reader — Library Service
 *
 * Application layer: Use cases for the document library.
 * Spec reference: Section 7 (HLD — Application Layer)
 */

import { Document, DocumentStatus } from '../domain/documents/types';
import { DocumentRepository } from '../infrastructure/repositories/DocumentRepository';
import { generateId } from '../utils/formatters';

export const LibraryService = {
  /**
   * Import a PDF from a user-selected URI.
   * Does not scan the device — only processes explicitly selected files.
   * Spec reference: Section 13 (File handling)
   */
  async importPdf(uri: string, fileName: string, fileSize?: number): Promise<Document> {
    const doc: Document = {
      id: generateId(),
      uri,
      fileName,
      fileSize,
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
      lastPositionPage: 0,
      lastPositionChunk: 0,
      progress: 0,
      status: 'importing',
    };

    await DocumentRepository.insert(doc);
    return doc;
  },

  /**
   * Mark a document as ready after successful opening.
   */
  async markReady(
    id: string,
    info: { pageCount?: number; title?: string; author?: string }
  ): Promise<void> {
    const doc = await DocumentRepository.getById(id);
    if (!doc) return;

    const updated: Document = {
      ...doc,
      pageCount: info.pageCount ?? doc.pageCount,
      title: info.title ?? doc.title,
      author: info.author ?? doc.author,
      status: 'ready',
    };

    await DocumentRepository.insert(updated);
  },

  /**
   * Mark a document with an error status.
   * Spec reference: Section 17 (Error states)
   */
  async markError(id: string, status: DocumentStatus): Promise<void> {
    await DocumentRepository.updateStatus(id, status);
  },

  /**
   * Update a document's reading position.
   */
  async updatePosition(
    id: string,
    page: number,
    chunk: number,
    progress: number
  ): Promise<void> {
    await DocumentRepository.updateProgress(id, page, chunk, progress);
  },

  /**
   * Remove a document from the library.
   */
  async removeDocument(id: string): Promise<void> {
    await DocumentRepository.delete(id);
  },

  /**
   * Get all documents sorted by most recently opened.
   */
  async getLibrary(): Promise<Document[]> {
    return DocumentRepository.getAll();
  },
};
