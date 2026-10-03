/**
 * PDF Voice Reader — Full Pipeline Integration Tests
 *
 * Spec reference: Section 22.2 (Integration test)
 *
 * Tests the complete flow:
 * open PDF → extract page → normalize → create chunks → start speech
 * → receive completion → advance chunk → advance page → persist position
 */

import { defaultPdfEngine } from '../../src/infrastructure/native/PdfEngine';
import { defaultSpeechEngine } from '../../src/infrastructure/native/SpeechEngine';
import { defaultPlaybackService } from '../../src/infrastructure/native/PlaybackService';
import { ReaderService } from '../../src/application/ReaderService';
import { SpeechOrchestrator } from '../../src/application/SpeechOrchestrator';
import { DocumentRepository } from '../../src/infrastructure/repositories/DocumentRepository';
import { usePlaybackStore } from '../../src/state/playbackStore';
import { Document } from '../../src/domain/documents/types';

describe('PDF Voice Reader Pipeline Integration', () => {
  const testDoc: Document = {
    id: 'test_doc_pipeline_1',
    uri: 'content://media/external/file/1234',
    fileName: 'sample_book.pdf',
    title: 'Sample Audiobook Title',
    author: 'Author Name',
    pageCount: 3,
    fileSize: 102400,
    createdAt: Date.now(),
    lastOpenedAt: Date.now(),
    lastPositionPage: 0,
    lastPositionChunk: 0,
    progress: 0,
    status: 'ready',
  };

  beforeEach(async () => {
    usePlaybackStore.getState().reset();
    await DocumentRepository.insert(testDoc);
  });

  afterEach(async () => {
    await DocumentRepository.delete(testDoc.id);
  });

  it('should successfully open PDF and retrieve metadata', async () => {
    const info = await defaultPdfEngine.open(testDoc.uri);
    expect(info).toBeDefined();
    expect(info.fileName).toBeDefined();
    expect(info.pageCount).toBeGreaterThan(0);
  });

  it('should extract and process page into normalized speech chunks', async () => {
    const pageText = await defaultPdfEngine.getPageText(testDoc.id, 0);
    expect(pageText.hasText).toBe(true);
    expect(pageText.text.length).toBeGreaterThan(0);

    const chunks = ReaderService.processPage(pageText, testDoc.id, 0);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].documentId).toBe(testDoc.id);
    expect(chunks[0].pageIndex).toBe(0);
    expect(chunks[0].sequence).toBe(0);
    expect(chunks[0].text.length).toBeGreaterThan(0);
  });

  it('should manage playback state transitions (speaking -> paused -> resumed -> stopped)', async () => {
    let resolveSpeak: () => void = () => {};
    const controlledSpeechEngine = {
      initialize: async () => {},
      getVoices: async () => [],
      speak: () => new Promise<void>((resolve) => {
        resolveSpeak = resolve;
      }),
      stop: async () => {
        resolveSpeak();
      },
      pause: async () => {},
      resume: async () => {},
      isSpeaking: async () => true,
    };

    const orchestrator = new SpeechOrchestrator(
      defaultPdfEngine,
      controlledSpeechEngine,
      defaultPlaybackService
    );

    const startPromise = orchestrator.start(testDoc.id, 0, 0);

    // Wait a tick for start to enter speaking state
    await new Promise((r) => setTimeout(r, 10));

    const state = usePlaybackStore.getState();
    expect(state.documentId).toBe(testDoc.id);
    expect(state.state).toBe('speaking');
    expect(state.pageIndex).toBe(0);
    expect(state.currentText).toBeDefined();

    await orchestrator.pause();
    expect(usePlaybackStore.getState().state).toBe('paused');

    await orchestrator.resume();
    expect(usePlaybackStore.getState().state).toBe('speaking');

    await orchestrator.stop();
    expect(usePlaybackStore.getState().state).toBe('stopped');

    await startPromise;
  });

  it('should advance through chunks and reach completion', async () => {
    const orchestrator = new SpeechOrchestrator(
      defaultPdfEngine,
      defaultSpeechEngine,
      defaultPlaybackService
    );

    await orchestrator.start(testDoc.id, 0, 0);

    // With instant speech engine, orchestrator advances through all chunks/pages to completion
    const state = usePlaybackStore.getState();
    expect(state.state).toBe('completed');
  });

  it('should handle scanned PDF with no selectable text per Spec Section 17', async () => {
    const mockEmptyPdfEngine = {
      open: async () => ({ id: 'scanned', pageCount: 1, fileName: 'scanned.pdf' }),
      getPageText: async () => ({ pageIndex: 0, text: '', hasText: false }),
      renderPage: async () => '',
      close: async () => {},
    };

    const orchestrator = new SpeechOrchestrator(
      mockEmptyPdfEngine,
      defaultSpeechEngine,
      defaultPlaybackService
    );

    await orchestrator.start(testDoc.id, 0, 0);

    const state = usePlaybackStore.getState();
    expect(state.state).toBe('error');
    expect(state.error).toBe('This PDF does not contain selectable text.');
  });
});
