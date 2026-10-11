/**
 * PDF Voice Reader — Rewarded Ad Modal
 *
 * Voluntary opt-in ad mechanism (Highest eCPM: $15–$35).
 * Allows users to watch a short sponsor video in exchange for 1 hour of 100% ad-free reading.
 * Powered by Google Mobile Ads (AdMob) Rewarded Ads.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/theme';
import { adService } from '../../application/AdService';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardGranted?: () => void;
}

export function RewardedAdModal({ visible, onClose, onRewardGranted }: RewardedAdModalProps) {
  const theme = useTheme();
  const [isWatching, setIsWatching] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleWatchAd = async () => {
    setIsWatching(true);
    setErrorMessage(null);

    await adService.showRewardedAd(
      () => {
        // Reward earned successfully!
        setIsWatching(false);
        setRewardClaimed(true);
        onRewardGranted?.();

        setTimeout(() => {
          setRewardClaimed(false);
          onClose();
        }, 1600);
      },
      () => {
        // Ad closed
        setIsWatching(false);
      },
      (error) => {
        console.warn('Rewarded ad failed:', error);
        setIsWatching(false);
        setErrorMessage('Sponsor video is temporarily unavailable. Please try again in a moment.');
      }
    );
  };

  const handleDismiss = () => {
    setErrorMessage(null);
    setIsWatching(false);
    setRewardClaimed(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.divider,
            },
          ]}
        >
          {isWatching ? (
            <View style={styles.watchingContainer}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={[styles.watchingTitle, { color: theme.colors.textPrimary }]}>
                Loading Sponsor Video...
              </Text>
              <Text style={[styles.watchingDesc, { color: theme.colors.textSecondary }]}>
                Completing the video unlocks 1 hour of ad-free reading
              </Text>
            </View>
          ) : rewardClaimed ? (
            <View style={styles.rewardSuccessContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Ad-Free Unlocked!
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Enjoy 1 hour of completely uninterrupted reading and listening.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.giftEmoji}>🎁</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Get 1 Hour Ad-Free
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Watch a short sponsor video to support PDF Voice Reader and remove all ads for the next 1 hour.
              </Text>

              {errorMessage && (
                <View style={[styles.errorBanner, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={[styles.cancelButton, { borderColor: theme.colors.divider }]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                    Maybe Later
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWatchAd}
                  style={[styles.watchButton, { backgroundColor: theme.colors.accent }]}
                  accessibilityRole="button"
                >
                  <Text style={styles.watchButtonText}>Watch Video</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  giftEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBanner: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  watchButton: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  watchingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  watchingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  watchingDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  rewardSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  successEmoji: {
    fontSize: 44,
  },
});
