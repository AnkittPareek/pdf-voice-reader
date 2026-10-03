/**
 * PDF Voice Reader — Ad Service & Monetization Orchestrator
 *
 * Revenue & UX Architecture:
 * 1. Rewarded Ads (Highest eCPM: $15–$35, Zero Annoyance):
 *    Users voluntarily watch a 15–30s sponsor video to unlock 24 hours of Ad-Free reading & Pro perks.
 * 2. Natural-Break Interstitials (High eCPM: $6–$12, Strictly Frequency Capped):
 *    Shown ONLY upon returning from Reader to Library after at least 60s of reading.
 *    Strict 8-minute cooldown. NEVER shown while speech is active or paused.
 * 3. Bottom Library Banner (Steady Base eCPM: $1–$2):
 *    Unobtrusively anchored at the bottom of the Library screen only.
 *    Hidden immediately when user has active Ad-Free time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlaybackStore } from '../state/playbackStore';

const AD_FREE_UNTIL_KEY = '@pdf_voice_reader_ad_free_until';
const LAST_INTERSTITIAL_KEY = '@pdf_voice_reader_last_interstitial';

const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : process.env.NODE_ENV !== 'production';

// Google AdMob Configuration
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-1897406819003628~4977435362',
  BANNER_ID: isDev
    ? 'ca-app-pub-3940256099942544/6300978111'
    : 'ca-app-pub-1897406819003628/1939285049',
  INTERSTITIAL_ID: isDev
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'ca-app-pub-1897406819003628/9519315607',
  REWARDED_ID: isDev
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-1897406819003628/6893152261',
  PRODUCTION_BANNER_ID: 'ca-app-pub-1897406819003628/1939285049',
  PRODUCTION_INTERSTITIAL_ID: 'ca-app-pub-1897406819003628/9519315607',
  PRODUCTION_REWARDED_ID: 'ca-app-pub-1897406819003628/6893152261',
  MIN_INTERSTITIAL_COOLDOWN_MS: 8 * 60 * 1000, // 8 minutes minimum between interstitials
  MIN_READING_DURATION_FOR_AD_MS: 45 * 1000, // User must read for at least 45 seconds
};

export class AdService {
  private adFreeUntil: number | null = null;
  private lastInterstitialTimestamp = 0;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const [savedAdFree, savedLastAd] = await Promise.all([
        AsyncStorage.getItem(AD_FREE_UNTIL_KEY),
        AsyncStorage.getItem(LAST_INTERSTITIAL_KEY),
      ]);

      if (savedAdFree) {
        this.adFreeUntil = parseInt(savedAdFree, 10);
      }
      if (savedLastAd) {
        this.lastInterstitialTimestamp = parseInt(savedLastAd, 10);
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('AdService initialization error:', e);
    }
  }

  /**
   * Check if user currently has active Ad-Free status.
   */
  isAdFreeActive(): boolean {
    if (!this.adFreeUntil) return false;
    return Date.now() < this.adFreeUntil;
  }

  /**
   * Get remaining Ad-Free duration in milliseconds.
   */
  getRemainingAdFreeMs(): number {
    if (!this.adFreeUntil) return 0;
    const remaining = this.adFreeUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Grant user Ad-Free time (e.g. after watching a rewarded video or IAP unlock).
   */
  async grantAdFreeHours(hours: number): Promise<void> {
    const currentBase = this.isAdFreeActive() && this.adFreeUntil ? this.adFreeUntil : Date.now();
    const newUntil = currentBase + hours * 60 * 60 * 1000;
    this.adFreeUntil = newUntil;
    try {
      await AsyncStorage.setItem(AD_FREE_UNTIL_KEY, newUntil.toString());
    } catch (e) {
      console.warn('Failed to save ad free until:', e);
    }
  }

  /**
   * Check if an interstitial can be safely shown without annoying the user.
   * Rules:
   * 1. User must NOT have active Ad-Free status.
   * 2. Active speech playback must NOT be playing or paused (never interrupts listening).
   * 3. At least 8 minutes must have passed since the previous interstitial.
   */
  canShowInterstitial(): boolean {
    if (this.isAdFreeActive()) {
      return false;
    }

    const playbackState = usePlaybackStore.getState().state;
    // CRITICAL: NEVER show interstitial if speech is active or paused!
    if (playbackState === 'speaking' || playbackState === 'paused' || playbackState === 'loading') {
      return false;
    }

    const elapsedSinceLastAd = Date.now() - this.lastInterstitialTimestamp;
    return elapsedSinceLastAd >= ADMOB_CONFIG.MIN_INTERSTITIAL_COOLDOWN_MS;
  }

  /**
   * Record that an interstitial was displayed to reset the 8-minute cooldown.
   */
  async recordInterstitialShown(): Promise<void> {
    const now = Date.now();
    this.lastInterstitialTimestamp = now;
    try {
      await AsyncStorage.setItem(LAST_INTERSTITIAL_KEY, now.toString());
    } catch {}
  }
}

export const adService = new AdService();
