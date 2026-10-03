/**
 * PDF Voice Reader — Rewarded Ad Modal
 *
 * Voluntary opt-in ad mechanism (Highest eCPM: $15–$35).
 * Allows users to watch a short sponsor video in exchange for 24 hours of 100% ad-free reading.
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

  const handleWatchAd = async () => {
    setIsWatching(true);

    // Simulate standard rewarded ad playback (3 seconds test simulation)
    setTimeout(async () => {
      await adService.grantAdFreeHours(24);
      setIsWatching(false);
      setRewardClaimed(true);
      onRewardGranted?.();

      setTimeout(() => {
        setRewardClaimed(false);
        onClose();
      }, 1500);
    }, 2800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                Playing Sponsor Video...
              </Text>
              <Text style={[styles.watchingDesc, { color: theme.colors.textSecondary }]}>
                Reward grants 24 hours of ad-free reading
              </Text>
            </View>
          ) : rewardClaimed ? (
            <View style={styles.rewardSuccessContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Ad-Free Unlocked!
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Enjoy 24 hours of completely uninterrupted reading and listening.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.giftEmoji}>🎁</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Get 24 Hours Ad-Free
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Watch a short sponsor video to support PDF Voice Reader and remove all ads for the next 24 hours.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onClose}
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
                  <Text style={styles.watchButtonText}>Watch Sponsor (15s)</Text>
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
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  watchButton: {
    flex: 1.5,
    height: 46,
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
    fontSize: 13,
    fontWeight: '700',
  },
  watchingContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  watchingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  watchingDesc: {
    fontSize: 11,
    marginTop: 6,
  },
  rewardSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
});
