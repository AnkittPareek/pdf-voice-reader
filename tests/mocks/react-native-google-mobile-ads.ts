export const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER',
  WIDE_SKYSCRAPER: 'WIDE_SKYSCRAPER',
};

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

export const AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  CLOSED: 'closed',
  CLICKED: 'clicked',
};

export const RewardedAdEventType = {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
};

export const BannerAd = () => null;

export const InterstitialAd = {
  createForAdRequest: jest.fn(() => ({
    load: jest.fn(),
    show: jest.fn().mockResolvedValue(undefined),
    addAdEventListener: jest.fn((_event, cb) => {
      return () => {};
    }),
    removeAllListeners: jest.fn(),
  })),
};

export const RewardedAd = {
  createForAdRequest: jest.fn(() => ({
    load: jest.fn(),
    show: jest.fn().mockResolvedValue(undefined),
    addAdEventListener: jest.fn((_event, cb) => {
      return () => {};
    }),
    removeAllListeners: jest.fn(),
  })),
};

const mobileAds = () => ({
  initialize: jest.fn().mockResolvedValue([]),
  setRequestConfiguration: jest.fn().mockResolvedValue(undefined),
});

export default mobileAds;

