/**
 * PDF Voice Reader — Banner Ad Component
 *
 * Renders official Google AdMob Banner anchored at the bottom of the Library screen.
 * - Automatically hides when the user has active Ad-Free time.
 * - Tapping "Remove" triggers the Rewarded Ad modal to grant 1h Ad-Free time.
 * - Fits seamlessly into both Light and Dark themes.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../../theme/theme';
import { adService, ADMOB_CONFIG } from '../../application/AdService';

interface BannerAdViewProps {
  onPressRemoveAds?: () => void;
}

export function BannerAdView({ onPressRemoveAds }: BannerAdViewProps) {
  const theme = useTheme();
  const [isAdFree, setIsAdFree] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    adService.initialize().then(() => {
      setIsAdFree(adService.isAdFreeActive());
    });
  }, []);

  if (isAdFree) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
        },
      ]}
      accessibilityLabel="Sponsor advertisement banner"
    >
      <View style={styles.adHeader}>
        <View style={[styles.adBadge, { backgroundColor: theme.colors.accentSoft }]}>
          <Text style={[styles.adBadgeText, { color: theme.colors.accent }]}>AD</Text>
        </View>

        <Text style={[styles.sponsorTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          Sponsor
        </Text>

        {onPressRemoveAds && (
          <TouchableOpacity
            onPress={onPressRemoveAds}
            style={[styles.removeButton, { borderColor: theme.colors.divider }]}
            accessibilityRole="button"
            accessibilityLabel="Remove ads for 1 hour"
          >
            <Text style={[styles.removeButtonText, { color: theme.colors.accent }]}>
              Remove (1h)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bannerWrapper}>
        <BannerAd
          unitId={ADMOB_CONFIG.BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdFailed(false);
          }}
          onAdFailedToLoad={(error) => {
            console.warn('AdMob Banner notice:', error?.message || error);
            setAdFailed(true);
          }}
        />
      </View>

      {adFailed && (
        <Text style={[styles.fallbackCopy, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          Listen to PDF audiobooks offline with natural speech voice.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sponsorTitle: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fallbackCopy: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
