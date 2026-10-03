/**
 * PDF Voice Reader — Formatter Tests
 */

import {
  formatProgress,
  formatFileSize,
  formatDuration,
  formatRate,
  estimateReadingTime,
  getDocumentDisplayName,
} from '../../src/utils/formatters';

describe('formatters', () => {
  it('formats progress as rounded percentage', () => {
    expect(formatProgress(0.254)).toBe('25%');
    expect(formatProgress(1)).toBe('100%');
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats duration', () => {
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('formats rate', () => {
    expect(formatRate(1.5)).toBe('1.5x');
  });

  it('estimates reading time', () => {
    expect(estimateReadingTime(1500)).toBe(2);
  });

  describe('getDocumentDisplayName', () => {
    it('returns custom title when valid', () => {
      expect(getDocumentDisplayName('The Great Gatsby', 'doc.pdf')).toBe('The Great Gatsby');
    });

    it('ignores generic placeholder titles', () => {
      expect(getDocumentDisplayName('(anonymous)', 'The_Art_of_Mindful_Reading.pdf')).toBe(
        'The Art of Mindful Reading'
      );
      expect(getDocumentDisplayName('Untitled', 'my-notes.pdf')).toBe('my notes');
      expect(getDocumentDisplayName('unknown', 'chapter_1.epub')).toBe('chapter 1');
      expect(getDocumentDisplayName('', 'document.txt')).toBe('document');
    });

    it('falls back to Document if no filename', () => {
      expect(getDocumentDisplayName('(anonymous)')).toBe('Document');
      expect(getDocumentDisplayName()).toBe('Document');
    });
  });
});
