/**
 * PDF Voice Reader — Playback State Tests
 *
 * Spec reference: Section 22.1 (playback state transitions, progress calculations)
 * Tests the state machine transitions and progress calculations.
 */

import { INITIAL_PLAYER_STATE } from '../../src/domain/playback/types';
import { shouldPersistPosition } from '../../src/application/SpeechOrchestrator';

describe('INITIAL_PLAYER_STATE', () => {
  it('should start in idle state', () => {
    expect(INITIAL_PLAYER_STATE.state).toBe('idle');
  });

  it('should have zero progress', () => {
    expect(INITIAL_PLAYER_STATE.progress).toBe(0);
  });

  it('should have default rate of 1.0', () => {
    expect(INITIAL_PLAYER_STATE.rate).toBe(1.0);
  });

  it('should start at page 0', () => {
    expect(INITIAL_PLAYER_STATE.pageIndex).toBe(0);
  });

  it('should start at chunk 0', () => {
    expect(INITIAL_PLAYER_STATE.chunkIndex).toBe(0);
  });
});

describe('shouldPersistPosition', () => {
  it('should persist on pause', () => {
    expect(shouldPersistPosition('pause')).toBe(true);
  });

  it('should persist on stop', () => {
    expect(shouldPersistPosition('stop')).toBe(true);
  });

  it('should persist on chunk completion', () => {
    expect(shouldPersistPosition('chunk_complete')).toBe(true);
  });

  it('should persist on page transition', () => {
    expect(shouldPersistPosition('page_transition')).toBe(true);
  });

  it('should persist on app background', () => {
    expect(shouldPersistPosition('app_background')).toBe(true);
  });

  it('should persist on service shutdown', () => {
    expect(shouldPersistPosition('service_shutdown')).toBe(true);
  });

  it('should not persist on arbitrary events', () => {
    expect(shouldPersistPosition('character_progress')).toBe(false);
  });

  it('should not persist on speak events', () => {
    expect(shouldPersistPosition('speak')).toBe(false);
  });
});
