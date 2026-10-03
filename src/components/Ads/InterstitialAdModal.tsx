/**
 * PDF Voice Reader — Interstitial Ad Modal
 *
 * Full-screen interstitial displayed ONLY at natural break points (exiting Reader after reading).
 * Complies strictly with Google Play Ad Policy:
 * - Clear, immediate close button (✕).
 * - Never displayed while speech audio is playing or paused in background.
 * - Enforces minimum 8-minute cooldown between displays.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import { adService } from '../../application/AdService';

interface InterstitialAdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InterstitialAdModal({ visible, onClose }: InterstitialAdModalProps) {
  const theme = useTheme();

  const handleClose = async () => {
    await adService.recordInterstitialShown();
    onClose();
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Ad Header */}
        <View style={styles.topBar}>
          <View style={[styles.adBadge, { backgroundColor: theme.colors.accentSoft }]}>
            <Text style={[styles.adBadgeText, { color: theme.colors.accent }]}>SPONSORED AD</Text>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}
            accessibilityRole="button"
            accessibilityLabel="Close advertisement"
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.textPrimary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Ad Body */}
        <View style={styles.content}>
          <View
            style={[
              styles.adCreativeCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <Text style={styles.adArt}>🎧</Text>
            <Text style={[styles.adHeadline, { color: theme.colors.textPrimary }]}>
              Discover Unlimited Audiobooks
            </Text>
            <Text style={[styles.adBodyText, { color: theme.colors.textSecondary }]}>
              Explore thousands of bestsellers, podcasts, and audio stories. Start your free trial today.
            </Text>

            <TouchableOpacity
              onPress={handleClose}
              style={[styles.ctaButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={styles.ctaButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Google AdMob Interstitial · Test Unit ID: 1033173712
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCreativeCard: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  adArt: {
    fontSize: 64,
    marginBottom: 18,
  },
  adHeadline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  adBodyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 11,
  },
});
