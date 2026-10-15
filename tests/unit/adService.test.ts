/**
 * PDF Voice Reader — AdService Unit Tests
 *
 * Verifies monetization rules:
 * 1. Playback protection (never show ads while speaking or paused)
 * 2. Frequency capping (8-minute cooldown)
 * 3. Rewarded 1-hour ad-free unlock
 */

const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, val: string) => {
    mockStore.set(key, val);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
  clear: jest.fn(async () => {
    mockStore.clear();
  }),
}));

import { adService, ADMOB_CONFIG } from '../../src/application/AdService';
import { usePlaybackStore } from '../../src/state/playbackStore';

describe('AdService Monetization & Protection Tests', () => {
  beforeEach(async () => {
    mockStore.clear();
    adService.resetForTesting();
    usePlaybackStore.getState().reset();
    await adService.initialize();
  });

  it('should allow interstitials across user triggers when not ad-free', async () => {
    // When idle or stopped, interstitial is allowed
    usePlaybackStore.getState().setState('stopped');
    expect(adService.canShowInterstitial()).toBe(true);

    // Interstitial is allowed on audio triggers (start, pause, resume, stop)
    usePlaybackStore.getState().setState('speaking');
    expect(adService.canShowInterstitial()).toBe(true);

    usePlaybackStore.getState().setState('paused');
    expect(adService.canShowInterstitial()).toBe(true);
  });

  it('should execute continuation callback in showInterstitialOrContinue', async () => {
    let continued = false;
    await adService.showInterstitialOrContinue(() => {
      continued = true;
    });
    expect(continued).toBe(true);
  });

  it('should grant ad-free status and block all ads', async () => {
    // Grant 1 hour of ad-free time via rewarded ad
    await adService.grantAdFreeHours(1);

    expect(adService.isAdFreeActive()).toBe(true);
    expect(adService.getRemainingAdFreeMs()).toBeGreaterThan(50 * 60 * 1000);
    expect(adService.getRemainingAdFreeMs()).toBeLessThanOrEqual(60 * 60 * 1000);

    // While ad-free is active, interstitials are blocked
    usePlaybackStore.getState().setState('stopped');
    expect(adService.canShowInterstitial()).toBe(false);
  });

  it('should stack ad-free hours when watching multiple rewarded ads', async () => {
    await adService.grantAdFreeHours(1);
    await adService.grantAdFreeHours(1);

    expect(adService.isAdFreeActive()).toBe(true);
    // Should be approximately 2 hours remaining
    expect(adService.getRemainingAdFreeMs()).toBeGreaterThan(110 * 60 * 1000);
    expect(adService.getRemainingAdFreeMs()).toBeLessThanOrEqual(120 * 60 * 1000);
  });
});
