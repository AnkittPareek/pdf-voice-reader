/**
 * PDF Voice Reader — Banner Ad Component
 *
 * Placed unobtrusively at the bottom of the Library screen.
 * - Automatically hides when the user has active Ad-Free time.
 * - Tapping "Remove" triggers the Rewarded Ad modal to grant 24h Ad-Free time.
 * - Fits seamlessly into both Light and Dark themes.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import { adService } from '../../application/AdService';

interface BannerAdViewProps {
  onPressRemoveAds?: () => void;
}

export function BannerAdView({ onPressRemoveAds }: BannerAdViewProps) {
  const theme = useTheme();
  const [isAdFree, setIsAdFree] = useState(false);

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
          Sponsored Partner
        </Text>

        {onPressRemoveAds && (
          <TouchableOpacity
            onPress={onPressRemoveAds}
            style={[styles.removeButton, { borderColor: theme.colors.divider }]}
            accessibilityRole="button"
            accessibilityLabel="Remove ads for 24 hours"
          >
            <Text style={[styles.removeButtonText, { color: theme.colors.accent }]}>
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.adCopy, { color: theme.colors.textSecondary }]} numberOfLines={1}>
        Listen to audiobooks offline with crystal clear voice quality.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontSize: 13,
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
  adCopy: {
    fontSize: 11,
    marginTop: 4,
  },
});
