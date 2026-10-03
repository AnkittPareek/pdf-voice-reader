/**
 * PDF Voice Reader — Playback Store
 *
 * State management for playback.
 * Spec reference: Section 21 (State management)
 *
 * Avoids putting extracted document text into global React state.
 */

import { create } from 'zustand';
import { PlayerState, INITIAL_PLAYER_STATE, PlaybackState } from '../domain/playback/types';

interface PlaybackStore extends PlayerState {
  /** Transition to a new playback state */
  setState: (state: PlaybackState) => void;

  /** Start playback for a document */
  startPlayback: (documentId: string, pageIndex?: number, chunkIndex?: number) => void;

  /** Update the current position */
  updatePosition: (pageIndex: number, chunkIndex: number, progress: number, currentText?: string) => void;

  /** Set the speech rate */
  setRate: (rate: number) => void;

  /** Set the active voice */
  setVoice: (voiceId: string) => void;

  /** Set an error */
  setError: (error: string) => void;

  /** Set the current speaking range within the active chunk */
  setCurrentRange: (currentRange?: { start: number; end: number }) => void;

  /** Reset to idle */
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  ...INITIAL_PLAYER_STATE,

  setState: (state: PlaybackState) =>
    set({ state, error: state === 'error' ? undefined : undefined }),

  startPlayback: (documentId: string, pageIndex = 0, chunkIndex = 0) =>
    set({
      documentId,
      state: 'initializing',
      pageIndex,
      chunkIndex,
      progress: 0,
      error: undefined,
    }),

  updatePosition: (pageIndex: number, chunkIndex: number, progress: number, currentText?: string) =>
    set({ pageIndex, chunkIndex, progress, currentText }),

  setRate: (rate: number) => set({ rate }),

  setVoice: (voiceId: string) => set({ voiceId }),

  setError: (error: string) => set({ state: 'error', error }),

  setCurrentRange: (currentRange?: { start: number; end: number }) => set({ currentRange }),

  reset: () => set(INITIAL_PLAYER_STATE),
}));
