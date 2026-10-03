/**
 * PDF Voice Reader — AdService Unit Tests
 *
 * Verifies monetization rules:
 * 1. Playback protection (never show ads while speaking or paused)
 * 2. Frequency capping (8-minute cooldown)
 * 3. Rewarded 24-hour ad-free unlock
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, val: string) => {
      store.set(key, val);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

import { adService, ADMOB_CONFIG } from '../../src/application/AdService';
import { usePlaybackStore } from '../../src/state/playbackStore';

describe('AdService Monetization & Protection Tests', () => {
  beforeEach(async () => {
    usePlaybackStore.getState().reset();
    await adService.initialize();
  });

  it('should not allow interstitials while speech playback is active', async () => {
    // When stopped or idle, eligible for interstitial if cooldown elapsed
    usePlaybackStore.getState().setState('stopped');
    expect(adService.canShowInterstitial()).toBe(true);

    // CRITICAL: When speaking, must NEVER allow interstitial
    usePlaybackStore.getState().setState('speaking');
    expect(adService.canShowInterstitial()).toBe(false);

    // CRITICAL: When paused in background, must NEVER allow interstitial
    usePlaybackStore.getState().setState('paused');
    expect(adService.canShowInterstitial()).toBe(false);

    // CRITICAL: When loading next chunk, must NEVER allow interstitial
    usePlaybackStore.getState().setState('loading');
    expect(adService.canShowInterstitial()).toBe(false);

    // Once completed/stopped, can be eligible again
    usePlaybackStore.getState().setState('completed');
    expect(adService.canShowInterstitial()).toBe(true);
  });

  it('should enforce 8-minute cooldown between interstitials', async () => {
    usePlaybackStore.getState().setState('stopped');
    expect(adService.canShowInterstitial()).toBe(true);

    // Record an interstitial display
    await adService.recordInterstitialShown();

    // Immediately after, interstitial MUST be blocked by cooldown
    expect(adService.canShowInterstitial()).toBe(false);
  });

  it('should grant ad-free status and block all ads', async () => {
    // Grant 24 hours of ad-free time via rewarded ad
    await adService.grantAdFreeHours(24);

    expect(adService.isAdFreeActive()).toBe(true);
    expect(adService.getRemainingAdFreeMs()).toBeGreaterThan(23 * 60 * 60 * 1000);

    // While ad-free is active, interstitials are blocked
    usePlaybackStore.getState().setState('stopped');
    expect(adService.canShowInterstitial()).toBe(false);
  });
});
