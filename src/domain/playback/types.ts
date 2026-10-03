/**
 * PDF Voice Reader — Playback Domain Models
 *
 * Spec reference: Section 10 (Playback state machine), Section 21 (State management)
 */

export type PlaybackState =
  | 'idle'
  | 'initializing'
  | 'loading'
  | 'speaking'
  | 'paused'
  | 'stopped'
  | 'completed'
  | 'error';

export interface PlayerState {
  documentId?: string;
  state: PlaybackState;
  pageIndex: number;
  chunkIndex: number;
  progress: number;
  rate: number;
  voiceId?: string;
  error?: string;
  currentText?: string;
  currentRange?: { start: number; end: number };
}

export const INITIAL_PLAYER_STATE: PlayerState = {
  state: 'idle',
  pageIndex: 0,
  chunkIndex: 0,
  progress: 0,
  rate: 1.0,
};
