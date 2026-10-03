/**
 * PDF Voice Reader — Text Normalization Tests
 *
 * Spec reference: Section 22.1
 * Tests: whitespace normalization, line joining, repeated header detection,
 *        page-number removal, sentence splitting
 */

import {
  normalizeWhitespace,
  normalizeBlankLines,
  joinBrokenLines,
  removePageNumbers,
  detectAndRemoveHeadersFooters,
  normalizePage,
  splitIntoSentences,
} from '../../src/utils/textNormalization';

describe('normalizeWhitespace', () => {
  it('should replace non-breaking spaces with regular spaces', () => {
    expect(normalizeWhitespace('hello\u00A0world')).toBe('hello world');
  });

  it('should replace various Unicode whitespace', () => {
    expect(normalizeWhitespace('a\u2000b\u2003c\u3000d')).toBe('a b c d');
  });

  it('should replace tabs with spaces', () => {
    expect(normalizeWhitespace('a\tb\tc')).toBe('a b c');
  });

  it('should normalize CRLF and CR to LF', () => {
    expect(normalizeWhitespace('hello\r\nworld\rtest')).toBe('hello\nworld\ntest');
  });

  it('should preserve regular spaces', () => {
    expect(normalizeWhitespace('hello world')).toBe('hello world');
  });
});

describe('normalizeBlankLines', () => {
  it('should collapse 3+ blank lines into double newline', () => {
    expect(normalizeBlankLines('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('should preserve double newlines (paragraph boundaries)', () => {
    expect(normalizeBlankLines('a\n\nb')).toBe('a\n\nb');
  });

  it('should preserve single newlines', () => {
    expect(normalizeBlankLines('a\nb')).toBe('a\nb');
  });
});

describe('joinBrokenLines', () => {
  it('should join lines that appear to be broken mid-sentence', () => {
    const input = 'This is a sentence that\nwas broken across lines';
    const result = joinBrokenLines(input);
    expect(result).toBe('This is a sentence that was broken across lines');
  });

  it('should preserve list items', () => {
    const input = '- Item one\n- Item two\n- Item three';
    const result = joinBrokenLines(input);
    expect(result).toContain('- Item one');
    expect(result).toContain('- Item two');
    expect(result).toContain('- Item three');
  });

  it('should preserve numbered list items', () => {
    const input = '1. First item\n2. Second item';
    const result = joinBrokenLines(input);
    expect(result).toContain('1. First item');
    expect(result).toContain('2. Second item');
  });

  it('should keep separate lines that end with sentence punctuation', () => {
    const input = 'First sentence.\nSecond sentence.';
    const result = joinBrokenLines(input);
    expect(result).toContain('First sentence.');
    expect(result).toContain('Second sentence.');
  });

  it('should preserve paragraph boundaries', () => {
    const input = 'Paragraph one.\n\nParagraph two.';
    const result = joinBrokenLines(input);
    expect(result).toContain('Paragraph one.');
    expect(result).toContain('Paragraph two.');
    expect(result).toContain('\n\n');
  });
});

describe('removePageNumbers', () => {
  it('should remove standalone page numbers', () => {
    const input = 'Some text\n42\nMore text';
    expect(removePageNumbers(input)).toBe('Some text\n\nMore text');
  });

  it('should not remove numbers embedded in text', () => {
    const input = 'There are 42 items in the list';
    expect(removePageNumbers(input)).toBe(input);
  });

  it('should remove page numbers with surrounding whitespace', () => {
    const input = 'Text\n  123  \nMore text';
    expect(removePageNumbers(input)).toBe('Text\n\nMore text');
  });

  it('should not remove large numbers (> 4 digits)', () => {
    const input = 'Text\n12345\nMore text';
    expect(removePageNumbers(input)).toBe(input);
  });
});

describe('detectAndRemoveHeadersFooters', () => {
  it('should remove repeated headers appearing in >50% of pages', () => {
    const pages = [
      'Chapter 1\nContent page 1',
      'Chapter 1\nContent page 2',
      'Chapter 1\nContent page 3',
      'Chapter 1\nContent page 4',
    ];
    const result = detectAndRemoveHeadersFooters(pages);
    result.forEach((page) => {
      expect(page).not.toContain('Chapter 1');
    });
  });

  it('should not remove headers below threshold', () => {
    const pages = [
      'Header A\nContent 1',
      'Header B\nContent 2',
      'Header C\nContent 3',
      'Header D\nContent 4',
    ];
    const result = detectAndRemoveHeadersFooters(pages);
    expect(result[0]).toContain('Header A');
  });

  it('should return pages unchanged if fewer than minRepetitions', () => {
    const pages = ['Page 1', 'Page 2'];
    const result = detectAndRemoveHeadersFooters(pages);
    expect(result).toEqual(pages);
  });
});

describe('splitIntoSentences', () => {
  it('should split on period followed by capital letter', () => {
    const result = splitIntoSentences('First sentence. Second sentence.');
    expect(result.length).toBe(2);
    expect(result[0]).toBe('First sentence.');
    expect(result[1]).toBe('Second sentence.');
  });

  it('should handle question marks and exclamation points', () => {
    const result = splitIntoSentences('Is this right? Yes! It is.');
    expect(result.length).toBe(3);
  });

  it('should not split on common abbreviations', () => {
    const result = splitIntoSentences('Dr. Smith went to the store.');
    expect(result.length).toBe(1);
  });

  it('should handle empty string', () => {
    const result = splitIntoSentences('');
    expect(result.length).toBe(0);
  });
});

describe('normalizePage (full pipeline)', () => {
  it('should run the full normalization pipeline', () => {
    const input = 'Hello\u00A0world\n\n\n\n42\n\nThis is a test\nof the pipeline.';
    const result = normalizePage(input);
    expect(result).not.toContain('\u00A0');
    expect(result).not.toMatch(/^\s*42\s*$/m);
    expect(result.length).toBeGreaterThan(0);
  });
});
