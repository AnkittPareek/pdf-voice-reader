/**
 * PDF Voice Reader — Ad Service & Monetization Orchestrator
 *
 * Revenue & UX Architecture:
 * 1. Rewarded Ads (Highest eCPM: $15–$35, Zero Annoyance):
 *    Users voluntarily watch a 15–30s sponsor video to unlock 1 hour of Ad-Free reading & Pro perks.
 * 2. Natural-Break Interstitials (High eCPM: $6–$12, Strictly Frequency Capped):
 *    Shown ONLY upon returning from Reader to Library after at least 45s of reading.
 *    Strict 8-minute cooldown. NEVER shown while speech is active or paused.
 * 3. Bottom Library Banner (Steady Base eCPM: $1–$2):
 *    Unobtrusively anchored at the bottom of the Library screen only.
 *    Hidden immediately when user has active Ad-Free time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePlaybackStore } from '../state/playbackStore';

const AD_FREE_UNTIL_KEY = '@pdf_voice_reader_ad_free_until';
const LAST_INTERSTITIAL_KEY = '@pdf_voice_reader_last_interstitial';

const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : process.env.NODE_ENV !== 'production';

// Google AdMob Configuration
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-1897406819003628~4977435362',
  PRODUCTION_BANNER_ID: 'ca-app-pub-1897406819003628/1939285049',
  PRODUCTION_INTERSTITIAL_ID: 'ca-app-pub-1897406819003628/9519315607',
  PRODUCTION_REWARDED_ID: 'ca-app-pub-1897406819003628/6893152261',
  TEST_BANNER_ID: TestIds.BANNER,
  TEST_INTERSTITIAL_ID: TestIds.INTERSTITIAL,
  TEST_REWARDED_ID: TestIds.REWARDED,
  // By default in development, TestIds are used to avoid AdMob invalid click account suspension.
  // In production builds, live production ad units are used.
  BANNER_ID: isDev ? TestIds.BANNER : 'ca-app-pub-1897406819003628/1939285049',
  INTERSTITIAL_ID: isDev ? TestIds.INTERSTITIAL : 'ca-app-pub-1897406819003628/9519315607',
  REWARDED_ID: isDev ? TestIds.REWARDED : 'ca-app-pub-1897406819003628/6893152261',
  MIN_INTERSTITIAL_COOLDOWN_MS: 8 * 60 * 1000, // 8 minutes minimum between interstitials
  MIN_READING_DURATION_FOR_AD_MS: 45 * 1000, // User must read for at least 45 seconds
};

export class AdService {
  private adFreeUntil: number | null = null;
  private lastInterstitialTimestamp = 0;
  private isInitialized = false;
  private interstitial: InterstitialAd | null = null;
  private isInterstitialLoaded = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await mobileAds().initialize();
    } catch (e) {
      console.warn('AdMob SDK initialization warning:', e);
    }

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
      this.preloadInterstitial();
    } catch (e) {
      console.warn('AdService initialization error:', e);
    }
  }

  /**
   * Reset internal state for test isolation.
   */
  resetForTesting(): void {
    this.adFreeUntil = null;
    this.lastInterstitialTimestamp = 0;
    this.isInitialized = false;
    this.isInterstitialLoaded = false;
    this.interstitial = null;
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
   * Grant user Ad-Free time (e.g. after watching a rewarded video).
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
   * 2. Active speech playback must NOT be playing, paused, or loading (never interrupts listening).
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

  /**
   * Preload an interstitial ad in the background.
   */
  preloadInterstitial(): void {
    if (this.isAdFreeActive()) return;
    if (this.isInterstitialLoaded || this.interstitial) return;

    try {
      const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.isInterstitialLoaded = true;
      });

      const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.isInterstitialLoaded = false;
        this.interstitial = null;
        this.recordInterstitialShown();
        unsubLoaded();
        unsubClosed();
        unsubError();
        setTimeout(() => this.preloadInterstitial(), ADMOB_CONFIG.MIN_INTERSTITIAL_COOLDOWN_MS);
      });

      const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn('AdMob Interstitial load notice:', err);
        this.isInterstitialLoaded = false;
        this.interstitial = null;
        unsubLoaded();
        unsubClosed();
        unsubError();
      });

      this.interstitial = interstitial;
      interstitial.load();
    } catch (e) {
      console.warn('Failed to instantiate InterstitialAd:', e);
    }
  }

  /**
   * Present an interstitial ad if eligible and loaded.
   */
  async showInterstitial(): Promise<boolean> {
    if (!this.canShowInterstitial()) {
      return false;
    }

    if (this.interstitial && this.isInterstitialLoaded) {
      try {
        await this.interstitial.show();
        return true;
      } catch (e) {
        console.warn('AdMob Interstitial display notice:', e);
        this.isInterstitialLoaded = false;
        this.interstitial = null;
        this.preloadInterstitial();
        return false;
      }
    }

    this.preloadInterstitial();
    return false;
  }

  /**
   * Request and present a Google AdMob Rewarded Ad.
   * When video finishes, reward callback is executed and 1 hour of ad-free reading is granted.
   */
  async showRewardedAd(
    onRewardEarned: () => void,
    onClosed?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      const rewarded = RewardedAd.createForAdRequest(ADMOB_CONFIG.REWARDED_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      let cleanups: (() => void)[] = [];
      const cleanupAll = () => {
        cleanups.forEach((c) => {
          try {
            c();
          } catch {}
        });
        cleanups = [];
      };

      const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show().catch((err) => {
          cleanupAll();
          onError?.(err);
        });
      });
      cleanups.push(unsubLoaded);

      const unsubReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
        await this.grantAdFreeHours(1);
        onRewardEarned();
      });
      cleanups.push(unsubReward);

      const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanupAll();
        onClosed?.();
      });
      cleanups.push(unsubClosed);

      const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('AdMob Rewarded ad notice:', error);
        cleanupAll();
        onError?.(error);
      });
      cleanups.push(unsubError);

      rewarded.load();
    } catch (err) {
      console.warn('Failed to create RewardedAd:', err);
      onError?.(err);
    }
  }
}

export const adService = new AdService();
