/**
 * PDF Voice Reader — Speech Domain Models
 *
 * Spec reference: Section 8.2 (SpeechEngine contract), Section 9.2 (Chunking)
 */

export interface SpeechVoice {
  id: string;
  name: string;
  locale: string;
  quality?: number;
  requiresNetwork?: boolean;
}

export interface SpeechOptions {
  rate: number;
  voiceId?: string;
  locale?: string;
}

/**
 * Speech chunk model.
 * Spec reference: Section 9.2
 *
 * Target chunk: ~500–1500 characters
 * Boundary preference: paragraph > sentence > clause > hard character limit
 */
export interface SpeechChunk {
  id: string;
  documentId: string;
  pageIndex: number;
  sequence: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

/**
 * Resume position model.
 * Spec reference: Section 12
 */
export interface ResumePosition {
  documentId: string;
  pageIndex: number;
  chunkSequence: number;
  characterOffset: number;
}

/**
 * Playback settings (persisted).
 * Spec reference: Section 11.2
 */
export interface PlaybackSettings {
  id: number;
  speechRate: number;
  voiceId?: string;
  locale?: string;
  skipHeaders: boolean;
  skipFooters: boolean;
  updatedAt: number;
}

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  id: 1,
  speechRate: 1.0,
  skipHeaders: true,
  skipFooters: true,
  updatedAt: Date.now(),
};

/** Supported speed presets (Spec: 0.75x – 2.0x) */
export const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
