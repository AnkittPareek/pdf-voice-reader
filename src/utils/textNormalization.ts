/**
 * PDF Voice Reader — Text Normalization
 *
 * Spec reference: Section 9.1 (Normalization rules)
 *
 * The normalizer should:
 * - normalize Unicode whitespace
 * - remove excessive blank lines
 * - preserve paragraph boundaries
 * - avoid blindly joining lines inside lists
 * - remove repeated headers/footers only when repetition is strongly established
 * - avoid deleting meaningful numbers
 * - avoid changing quoted content
 * - retain page/chunk metadata for resume
 */

/**
 * Normalize Unicode whitespace to standard ASCII spaces.
 */
export function normalizeWhitespace(text: string): string {
  // Normalize Windows/PDF line endings and various Unicode whitespace characters
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\t/g, ' ');
}

/**
 * Remove excessive blank lines while preserving paragraph boundaries.
 * Multiple blank lines are collapsed to a single paragraph break.
 */
export function normalizeBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Join broken lines that appear to be part of the same sentence.
 * Preserves list items (lines starting with - * • or numbered lists).
 * Preserves paragraph boundaries (double newlines).
 */
export function joinBrokenLines(text: string): string {
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split('\n');
      const joined: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;

        // Check if this line is a list item
        const isListItem = /^[-*•●]\s/.test(line) || /^\d+[.)]\s/.test(line);

        if (isListItem || joined.length === 0) {
          joined.push(line);
        } else {
          const prevLine = joined[joined.length - 1];

          // If the previous line ends with sentence-ending punctuation, keep separate
          if (/[.!?:]\s*$/.test(prevLine)) {
            joined.push(line);
          } else {
            // Join with a space (line was likely broken by PDF layout)
            joined[joined.length - 1] = `${prevLine} ${line}`;
          }
        }
      }

      return joined.join('\n');
    })
    .join('\n\n');
}

/**
 * Remove obvious standalone page numbers.
 * Only removes numbers that appear on a line by themselves and look like page numbers.
 * Avoids deleting meaningful numbers.
 */
export function removePageNumbers(text: string): string {
  // Remove lines that are just a number (potentially with whitespace)
  return text.replace(/^\s*\d{1,4}\s*$/gm, '');
}

/**
 * Detect and remove repeated headers/footers.
 * Only removes when the same text appears at the start/end of multiple pages.
 * Conservative: requires at least 3 repetitions to establish a pattern.
 */
export function detectAndRemoveHeadersFooters(
  pageTexts: string[],
  minRepetitions = 3
): string[] {
  if (pageTexts.length < minRepetitions) return pageTexts;

  // Extract first and last lines from each page
  const firstLines: Map<string, number> = new Map();
  const lastLines: Map<string, number> = new Map();

  for (const text of pageTexts) {
    const lines = text.trim().split('\n');
    if (lines.length > 0) {
      const first = lines[0].trim();
      if (first.length > 0 && first.length < 100) {
        firstLines.set(first, (firstLines.get(first) ?? 0) + 1);
      }
    }
    if (lines.length > 1) {
      const last = lines[lines.length - 1].trim();
      if (last.length > 0 && last.length < 100) {
        lastLines.set(last, (lastLines.get(last) ?? 0) + 1);
      }
    }
  }

  // Find repeated headers (appear in > 50% of pages and at least minRepetitions)
  const threshold = Math.max(minRepetitions, pageTexts.length * 0.5);
  const repeatedHeaders = new Set<string>();
  const repeatedFooters = new Set<string>();

  for (const [line, count] of firstLines) {
    if (count >= threshold) repeatedHeaders.add(line);
  }
  for (const [line, count] of lastLines) {
    if (count >= threshold) repeatedFooters.add(line);
  }

  // Remove detected headers/footers
  return pageTexts.map((text) => {
    const lines = text.trim().split('\n');
    const filtered = lines.filter((line, index) => {
      const trimmed = line.trim();
      if (index === 0 && repeatedHeaders.has(trimmed)) return false;
      if (index === lines.length - 1 && repeatedFooters.has(trimmed)) return false;
      return true;
    });
    return filtered.join('\n');
  });
}

/**
 * Run the full normalization pipeline on a single page's text.
 */
export function normalizePage(text: string): string {
  let result = text;
  result = normalizeWhitespace(result);
  result = removePageNumbers(result);
  result = normalizeBlankLines(result);
  result = joinBrokenLines(result);
  return result.trim();
}

/**
 * Split text into sentences using basic English punctuation rules.
 * Handles common abbreviations (Mr., Mrs., Dr., etc.)
 */
export function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting — split on sentence-ending punctuation followed by space and capital letter
  const sentences: string[] = [];
  let current = '';

  // Common abbreviations that don't end sentences
  const abbreviations = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|etc|vs|vol|Rev|Gen|Sgt|Corp|Inc|Ltd|Co|No|Fig|pp|ed|tr|approx)\.\s*$/i;

  const chars = text.split('');
  for (let i = 0; i < chars.length; i++) {
    current += chars[i];

    if ((chars[i] === '.' || chars[i] === '!' || chars[i] === '?') && i < chars.length - 1) {
      // Check if next character starts a new sentence (capital letter after space)
      const remaining = text.slice(i + 1);
      if (/^\s+[A-Z]/.test(remaining) && !abbreviations.test(current)) {
        sentences.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim().length > 0) {
    sentences.push(current.trim());
  }

  return sentences.filter((s) => s.length > 0);
}
