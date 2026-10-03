/**
 * PDF Voice Reader — Speech Chunking
 *
 * Spec reference: Section 9.2
 *
 * Target chunk: ~500–1500 characters
 * Boundary preference: paragraph > sentence > clause > hard character limit
 *
 * Do not send an entire PDF to TTS.
 */

import { SpeechChunk } from '../domain/speech/types';
import { generateId } from './formatters';
import { splitIntoSentences } from './textNormalization';

const MIN_CHUNK_SIZE = 200;
const MAX_CHUNK_SIZE = 1500;
const HARD_LIMIT = 2000;

interface ChunkOptions {
  documentId: string;
  pageIndex: number;
  startSequence?: number;
}

/**
 * Split normalized page text into speech chunks.
 *
 * Boundary preference:
 * 1. paragraph
 * 2. sentence
 * 3. clause (comma, semicolon)
 * 4. hard character limit
 */
export function chunkPageText(
  text: string,
  options: ChunkOptions
): SpeechChunk[] {
  const { documentId, pageIndex, startSequence = 0 } = options;

  if (text.trim().length === 0) return [];

  const rawParagraphs = text.split(/\n\n+|\n(?=[-•*●]|\d+[.)])/);
  const chunks: SpeechChunk[] = [];
  let sequence = startSequence;
  let currentText = '';
  let currentStartOffset = 0;
  let globalOffset = 0;

  function flushChunk() {
    if (currentText.trim().length === 0) return;

    chunks.push({
      id: generateId(),
      documentId,
      pageIndex,
      sequence: sequence++,
      text: currentText.trim(),
      startOffset: currentStartOffset,
      endOffset: currentStartOffset + currentText.trim().length,
    });

    currentText = '';
  }

  for (const paragraph of rawParagraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) {
      globalOffset += paragraph.length + 2; // +2 for boundary
      continue;
    }

    // If accumulated chunk is already substantial (>= 150 chars), flush before starting new paragraph
    if (currentText.length >= 150) {
      flushChunk();
    }

    if (currentText.length === 0) {
      currentStartOffset = globalOffset;
    }

    // If adding this paragraph keeps us under MAX_CHUNK_SIZE, accumulate
    if (currentText.length + trimmed.length + 1 <= MAX_CHUNK_SIZE) {
      currentText += (currentText.length > 0 ? '\n\n' : '') + trimmed;
    } else {
      if (currentText.length > 0) {
        flushChunk();
      }

      // If the paragraph itself is too large, split by sentences
      if (trimmed.length > MAX_CHUNK_SIZE) {
        const sentenceChunks = splitBySentences(
          trimmed,
          documentId,
          pageIndex,
          globalOffset,
          sequence
        );
        chunks.push(...sentenceChunks);
        sequence += sentenceChunks.length;
        currentText = '';
      } else {
        currentStartOffset = globalOffset;
        currentText = trimmed;
      }
    }

    globalOffset += paragraph.length + 2;
  }

  // Flush remaining
  flushChunk();

  return chunks;
}

/**
 * Split text by sentences when a paragraph is too large.
 */
function splitBySentences(
  text: string,
  documentId: string,
  pageIndex: number,
  baseOffset: number,
  startSequence: number
): SpeechChunk[] {
  const sentences = splitIntoSentences(text);
  const chunks: SpeechChunk[] = [];
  let current = '';
  let sequence = startSequence;
  let sentenceOffset = 0;

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 <= MAX_CHUNK_SIZE) {
      current += (current.length > 0 ? ' ' : '') + sentence;
    } else {
      if (current.length > 0) {
        chunks.push({
          id: generateId(),
          documentId,
          pageIndex,
          sequence: sequence++,
          text: current.trim(),
          startOffset: baseOffset + sentenceOffset,
          endOffset: baseOffset + sentenceOffset + current.trim().length,
        });
        sentenceOffset += current.length + 1;
        current = '';
      }

      // If a single sentence exceeds the hard limit, force-split
      if (sentence.length > HARD_LIMIT) {
        const hardChunks = hardSplitText(
          sentence,
          documentId,
          pageIndex,
          baseOffset + sentenceOffset,
          sequence
        );
        chunks.push(...hardChunks);
        sequence += hardChunks.length;
        sentenceOffset += sentence.length + 1;
      } else {
        current = sentence;
      }
    }
  }

  if (current.trim().length > 0) {
    chunks.push({
      id: generateId(),
      documentId,
      pageIndex,
      sequence: sequence++,
      text: current.trim(),
      startOffset: baseOffset + sentenceOffset,
      endOffset: baseOffset + sentenceOffset + current.trim().length,
    });
  }

  return chunks;
}

/**
 * Hard split text at clause boundaries (commas, semicolons) or
 * at MAX_CHUNK_SIZE as a last resort.
 */
function hardSplitText(
  text: string,
  documentId: string,
  pageIndex: number,
  baseOffset: number,
  startSequence: number
): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  let remaining = text;
  let sequence = startSequence;
  let offset = 0;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_SIZE) {
      chunks.push({
        id: generateId(),
        documentId,
        pageIndex,
        sequence: sequence++,
        text: remaining.trim(),
        startOffset: baseOffset + offset,
        endOffset: baseOffset + offset + remaining.trim().length,
      });
      break;
    }

    // Try to split at a clause boundary
    let splitIndex = -1;
    const searchRange = remaining.slice(MIN_CHUNK_SIZE, MAX_CHUNK_SIZE);

    // Look for comma, semicolon, or colon
    const clauseMatch = searchRange.lastIndexOf(', ');
    const semiMatch = searchRange.lastIndexOf('; ');
    const colonMatch = searchRange.lastIndexOf(': ');

    splitIndex = Math.max(clauseMatch, semiMatch, colonMatch);

    if (splitIndex >= 0) {
      splitIndex += MIN_CHUNK_SIZE + 2; // +2 to include the delimiter and space
    } else {
      // Fall back to space
      const spaceMatch = searchRange.lastIndexOf(' ');
      splitIndex =
        spaceMatch >= 0 ? MIN_CHUNK_SIZE + spaceMatch + 1 : MAX_CHUNK_SIZE;
    }

    const chunk = remaining.slice(0, splitIndex);
    chunks.push({
      id: generateId(),
      documentId,
      pageIndex,
      sequence: sequence++,
      text: chunk.trim(),
      startOffset: baseOffset + offset,
      endOffset: baseOffset + offset + chunk.trim().length,
    });

    offset += splitIndex;
    remaining = remaining.slice(splitIndex);
  }

  return chunks;
}
