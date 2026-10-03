/**
 * PDF Voice Reader — Reader Service
 *
 * Application layer: Use cases for PDF reading.
 * Spec reference: Section 7 (HLD — Application Layer)
 */

import { PdfPageText } from '../domain/documents/types';
import { SpeechChunk } from '../domain/speech/types';
import { normalizePage } from '../utils/textNormalization';
import { chunkPageText } from '../utils/chunking';

// The PdfEngine will be provided via dependency injection
// once the native module is implemented.

export const ReaderService = {
  /**
   * Extract and normalize text from a single page, then create speech chunks.
   * Runs incrementally — does not process the entire document at once.
   * Spec reference: Section 9 (PDF text pipeline)
   */
  processPage(
    pageText: PdfPageText,
    documentId: string,
    startSequence = 0
  ): SpeechChunk[] {
    if (!pageText.hasText || pageText.text.trim().length === 0) {
      return [];
    }

    // 1. Normalize the raw extracted text
    const normalizedText = normalizePage(pageText.text);

    if (normalizedText.length === 0) return [];

    // 2. Create speech chunks
    const chunks = chunkPageText(normalizedText, {
      documentId,
      pageIndex: pageText.pageIndex,
      startSequence,
    });

    return chunks;
  },

  /**
   * Calculate overall document progress.
   */
  calculateProgress(
    currentPage: number,
    totalPages: number
  ): number {
    if (totalPages <= 0) return 0;
    return Math.min(1, currentPage / totalPages);
  },
};
