/**
 * PDF Voice Reader — Chunking Tests
 *
 * Spec reference: Section 22.1 (chunking tests)
 * Target chunk: ~500–1500 characters
 */

import { chunkPageText } from '../../src/utils/chunking';

describe('chunkPageText', () => {
  const defaultOptions = {
    documentId: 'test-doc',
    pageIndex: 0,
  };

  it('should return empty array for empty text', () => {
    const chunks = chunkPageText('', defaultOptions);
    expect(chunks).toHaveLength(0);
  });

  it('should return empty array for whitespace-only text', () => {
    const chunks = chunkPageText('   \n\n  ', defaultOptions);
    expect(chunks).toHaveLength(0);
  });

  it('should create a single chunk for short text', () => {
    const text = 'This is a short paragraph that should fit in one chunk.';
    const chunks = chunkPageText(text, defaultOptions);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].documentId).toBe('test-doc');
    expect(chunks[0].pageIndex).toBe(0);
    expect(chunks[0].sequence).toBe(0);
  });

  it('should split long text into multiple chunks', () => {
    // Create text longer than MAX_CHUNK_SIZE (1500 chars)
    const paragraph = 'This is a sentence. '.repeat(100); // ~2000 chars
    const chunks = chunkPageText(paragraph, defaultOptions);
    expect(chunks.length).toBeGreaterThan(1);
    
    // Each chunk should be within limits
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(2000);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it('should prefer paragraph boundaries', () => {
    const text = 'A'.repeat(800) + '\n\n' + 'B'.repeat(800);
    const chunks = chunkPageText(text, defaultOptions);
    expect(chunks.length).toBe(2);
    expect(chunks[0].text).toContain('A');
    expect(chunks[1].text).toContain('B');
  });

  it('should set sequential chunk IDs', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = chunkPageText(text, defaultOptions);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].sequence).toBe(i);
    }
  });

  it('should respect startSequence', () => {
    const text = 'Some text.';
    const chunks = chunkPageText(text, { ...defaultOptions, startSequence: 5 });
    expect(chunks[0].sequence).toBe(5);
  });

  it('should handle text with only single newlines', () => {
    const text = 'Line one\nLine two\nLine three';
    const chunks = chunkPageText(text, defaultOptions);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should set correct offsets', () => {
    const text = 'Short text chunk.';
    const chunks = chunkPageText(text, defaultOptions);
    expect(chunks[0].startOffset).toBe(0);
    expect(chunks[0].endOffset).toBe(text.length);
  });
});
