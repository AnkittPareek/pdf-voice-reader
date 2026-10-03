/**
 * PDF Voice Reader — Speech Orchestrator
 *
 * Application layer: Coordinates the speech playback lifecycle.
 * Spec reference: Section 7 (HLD — SpeechOrchestrator), Section 10 (Playback state machine)
 *
 * Responsibilities:
 * - Coordinate between the PDF text pipeline and the speech engine
 * - Manage chunk advancement
 * - Manage page transitions
 * - Persist position at appropriate intervals
 * - Communicate state to the UI layer and foreground service
 */

import { SpeechChunk, SpeechOptions, ResumePosition } from '../domain/speech/types';
import { PlaybackState } from '../domain/playback/types';
import { defaultPdfEngine, PdfEngine } from '../infrastructure/native/PdfEngine';
import { defaultSpeechEngine, SpeechEngine } from '../infrastructure/native/SpeechEngine';
import { defaultPlaybackService, PlaybackService } from '../infrastructure/native/PlaybackService';
import { DocumentRepository } from '../infrastructure/repositories/DocumentRepository';
import { ReaderService } from './ReaderService';
import { usePlaybackStore } from '../state/playbackStore';
import { getDocumentDisplayName } from '../utils/formatters';

export interface SpeechOrchestratorConfig {
  documentId: string;
  pageCount: number;
  startPosition?: ResumePosition;
  speechOptions: SpeechOptions;
  onStateChange?: (state: PlaybackState) => void;
  onPositionChange?: (page: number, chunk: number, progress: number) => void;
  onChunkChange?: (chunk: SpeechChunk) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

/**
 * Positions to persist progress on (spec section 10):
 * - pause
 * - stop
 * - chunk completion
 * - page transition
 * - app background
 * - service shutdown
 *
 * Do not write to SQLite on every character-level TTS callback.
 */
export function shouldPersistPosition(event: string): boolean {
  const persistEvents = new Set([
    'pause',
    'stop',
    'chunk_complete',
    'page_transition',
    'app_background',
    'service_shutdown',
  ]);
  return persistEvents.has(event);
}

export class SpeechOrchestrator {
  private pdfEngine: PdfEngine;
  private speechEngine: SpeechEngine;
  private playbackService: PlaybackService;

  private activeDocumentId: string | null = null;
  private currentPageIndex = 0;
  private currentChunkIndex = 0;
  private totalPages = 0;
  private currentChunks: SpeechChunk[] = [];
  private isRunning = false;
  private isPaused = false;
  private unsubAction: (() => void) | null = null;
  private unsubRange: (() => void) | null = null;
  private docTitle = 'PDF Voice Reader';

  constructor(
    pdfEngine: PdfEngine = defaultPdfEngine,
    speechEngine: SpeechEngine = defaultSpeechEngine,
    playbackService: PlaybackService = defaultPlaybackService
  ) {
    this.pdfEngine = pdfEngine;
    this.speechEngine = speechEngine;
    this.playbackService = playbackService;
  }

  /**
   * Start playback for a document at the specified page and chunk.
   */
  async start(
    documentId: string,
    startPageIndex = 0,
    startChunkIndex = 0
  ): Promise<void> {
    this.stopInternal();

    const doc = await DocumentRepository.getById(documentId);
    if (!doc) {
      usePlaybackStore.getState().setError('Document not found');
      return;
    }

    this.activeDocumentId = documentId;
    this.currentPageIndex = startPageIndex;
    this.currentChunkIndex = startChunkIndex;
    this.totalPages = doc.pageCount ?? 1;
    this.docTitle = getDocumentDisplayName(doc.title, doc.fileName);
    this.isRunning = true;
    this.isPaused = false;

    usePlaybackStore.getState().startPlayback(documentId, startPageIndex, startChunkIndex);

    // Bind foreground service notification action listener
    this.unsubAction?.();
    this.unsubAction = this.playbackService.onAction((action) => {
      switch (action) {
        case 'play':
          this.resume();
          break;
        case 'pause':
          this.pause();
          break;
        case 'stop':
          this.stop();
          break;
        case 'next':
          this.nextChunk();
          break;
        case 'prev':
          this.previousChunk();
          break;
      }
    });

    try {
      // Start foreground service
      await this.playbackService.start(
        this.docTitle,
        `Page ${this.currentPageIndex + 1} of ${this.totalPages}`,
        true
      );

      // Initialize TTS
      await this.speechEngine.initialize();

      // Subscribe to range events for real-time word highlighting
      this.unsubRange?.();
      if (this.speechEngine.onRange) {
        this.unsubRange = this.speechEngine.onRange((event) => {
          usePlaybackStore.getState().setCurrentRange({ start: event.start, end: event.end });
        });
      }

      // Ensure PDF session is open in native PdfEngine
      await this.pdfEngine.open(doc.uri, doc.id);

      // Begin playback loop
      await this.playCurrentChunk();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start playback';
      usePlaybackStore.getState().setError(errorMsg);
      await this.playbackService.stop();
    }
  }

  /**
   * Pause playback.
   */
  async pause(): Promise<void> {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    await this.speechEngine.pause();
    usePlaybackStore.getState().setState('paused');

    await this.playbackService.update(
      this.docTitle,
      `Paused · Page ${this.currentPageIndex + 1} of ${this.totalPages}`,
      false
    );

    if (this.activeDocumentId && shouldPersistPosition('pause')) {
      const progress = ReaderService.calculateProgress(this.currentPageIndex + 1, this.totalPages);
      await DocumentRepository.updateProgress(
        this.activeDocumentId,
        this.currentPageIndex,
        this.currentChunkIndex,
        progress
      );
    }
  }

  /**
   * Resume playback.
   */
  async resume(): Promise<void> {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    usePlaybackStore.getState().setState('speaking');

    await this.playbackService.update(
      this.docTitle,
      `Page ${this.currentPageIndex + 1} of ${this.totalPages}`,
      true
    );

    await this.speechEngine.resume();
  }

  /**
   * Stop playback completely.
   */
  async stop(): Promise<void> {
    if (this.activeDocumentId && shouldPersistPosition('stop')) {
      const progress = ReaderService.calculateProgress(this.currentPageIndex + 1, this.totalPages);
      await DocumentRepository.updateProgress(
        this.activeDocumentId,
        this.currentPageIndex,
        this.currentChunkIndex,
        progress
      );
    }

    this.stopInternal();
    await this.speechEngine.stop();
    await this.playbackService.stop();
    usePlaybackStore.getState().setState('stopped');
  }

  /**
   * Skip to next chunk.
   */
  async nextChunk(): Promise<void> {
    if (!this.isRunning) return;

    await this.speechEngine.stop();

    if (this.currentChunkIndex + 1 < this.currentChunks.length) {
      this.currentChunkIndex++;
      await this.playCurrentChunk();
    } else if (this.currentPageIndex + 1 < this.totalPages) {
      this.currentPageIndex++;
      this.currentChunkIndex = 0;
      this.currentChunks = [];
      await this.playCurrentChunk();
    } else {
      await this.handleCompletion();
    }
  }

  /**
   * Skip to previous chunk.
   */
  async previousChunk(): Promise<void> {
    if (!this.isRunning) return;

    await this.speechEngine.stop();

    if (this.currentChunkIndex > 0) {
      this.currentChunkIndex--;
      await this.playCurrentChunk();
    } else if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.currentChunks = [];
      this.currentChunkIndex = 0;
      await this.playCurrentChunk();
    } else {
      await this.playCurrentChunk();
    }
  }

  /**
   * Jump directly to a chunk and start reading aloud immediately.
   * Enables ReadEra-style "tap to read from here" in Reader view.
   */
  async jumpToChunk(pageIndex: number, chunkIndex: number, documentId?: string): Promise<void> {
    const targetDocId = documentId || this.activeDocumentId;
    if (!targetDocId) return;

    if (targetDocId !== this.activeDocumentId || !this.isRunning) {
      await this.start(targetDocId, pageIndex, chunkIndex);
      return;
    }

    await this.speechEngine.stop();
    usePlaybackStore.getState().setCurrentRange(undefined);

    if (this.currentPageIndex !== pageIndex) {
      this.currentPageIndex = pageIndex;
      this.currentChunks = [];
    }
    this.currentChunkIndex = chunkIndex;
    this.isPaused = false;
    await this.playCurrentChunk();
  }

  /**
   * Change speech rate dynamically.
   */
  async setRate(rate: number): Promise<void> {
    usePlaybackStore.getState().setRate(rate);
    if (this.isRunning && !this.isPaused && usePlaybackStore.getState().state === 'speaking') {
      await this.speechEngine.stop();
      await this.playCurrentChunk();
    }
  }

  /**
   * Change TTS voice.
   */
  async setVoice(voiceId: string): Promise<void> {
    usePlaybackStore.getState().setVoice(voiceId);
  }

  private async playCurrentChunk(): Promise<void> {
    if (!this.isRunning || !this.activeDocumentId) return;

    // Load and chunk page text if not cached
    if (this.currentChunks.length === 0) {
      usePlaybackStore.getState().setState('loading');

      try {
        const pageText = await this.pdfEngine.getPageText(
          this.activeDocumentId,
          this.currentPageIndex
        );

        if (!pageText.hasText || pageText.text.trim().length === 0) {
          // Scanned PDF or empty page per Spec Section 17
          usePlaybackStore
            .getState()
            .setError('This PDF does not contain selectable text.');
          await this.playbackService.stop();
          this.stopInternal();
          return;
        }

        this.currentChunks = ReaderService.processPage(
          pageText,
          this.activeDocumentId,
          0
        );

        if (this.currentChunks.length === 0) {
          usePlaybackStore
            .getState()
            .setError('This PDF does not contain selectable text.');
          await this.playbackService.stop();
          this.stopInternal();
          return;
        }
      } catch (err: any) {
        usePlaybackStore
          .getState()
          .setError(err?.message || "We couldn't extract readable text from this PDF.");
        await this.playbackService.stop();
        this.stopInternal();
        return;
      }
    }

    if (this.currentChunkIndex >= this.currentChunks.length) {
      this.currentChunkIndex = 0;
    }

    const chunk = this.currentChunks[this.currentChunkIndex];
    if (!chunk) return;

    const progress = ReaderService.calculateProgress(
      this.currentPageIndex + 1,
      this.totalPages
    );

    usePlaybackStore.getState().updatePosition(
      this.currentPageIndex,
      this.currentChunkIndex,
      progress,
      chunk.text
    );
    usePlaybackStore.getState().setState('speaking');

    await this.playbackService.update(
      this.docTitle,
      `Page ${this.currentPageIndex + 1} of ${this.totalPages}`,
      true
    );

    const store = usePlaybackStore.getState();
    const rate = store.rate;
    const voiceId = store.voiceId;

    try {
      await this.speechEngine.speak(chunk.text, { rate, voiceId });

      if (this.isRunning && !this.isPaused) {
        await this.onChunkDone();
      }
    } catch (err: any) {
      if (this.isRunning && !this.isPaused) {
        usePlaybackStore
          .getState()
          .setError(err?.message || 'Error occurred during speech playback');
      }
    }
  }

  private async onChunkDone(): Promise<void> {
    if (!this.isRunning || this.isPaused || !this.activeDocumentId) return;

    if (this.currentChunkIndex + 1 < this.currentChunks.length) {
      // Advance to next chunk
      this.currentChunkIndex++;

      if (shouldPersistPosition('chunk_complete')) {
        const progress = ReaderService.calculateProgress(
          this.currentPageIndex + 1,
          this.totalPages
        );
        await DocumentRepository.updateProgress(
          this.activeDocumentId,
          this.currentPageIndex,
          this.currentChunkIndex,
          progress
        );
      }

      await this.playCurrentChunk();
    } else if (this.currentPageIndex + 1 < this.totalPages) {
      // Advance to next page
      this.currentPageIndex++;
      this.currentChunkIndex = 0;
      this.currentChunks = [];

      if (shouldPersistPosition('page_transition')) {
        const progress = ReaderService.calculateProgress(
          this.currentPageIndex + 1,
          this.totalPages
        );
        await DocumentRepository.updateProgress(
          this.activeDocumentId,
          this.currentPageIndex,
          0,
          progress
        );
      }

      await this.playCurrentChunk();
    } else {
      // Completed reading document
      await this.handleCompletion();
    }
  }

  private async handleCompletion(): Promise<void> {
    if (this.activeDocumentId) {
      await DocumentRepository.updateProgress(
        this.activeDocumentId,
        this.totalPages - 1,
        0,
        1.0
      );
    }

    this.stopInternal();
    await this.playbackService.stop();
    usePlaybackStore.getState().setState('completed');
  }

  private stopInternal(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.currentChunks = [];
    this.unsubAction?.();
    this.unsubAction = null;
    this.unsubRange?.();
    this.unsubRange = null;
    usePlaybackStore.getState().setCurrentRange(undefined);
  }

  cleanup(): void {
    this.stopInternal();
  }
}

export const speechOrchestrator = new SpeechOrchestrator();
