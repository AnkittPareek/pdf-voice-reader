/**
 * PDF Voice Reader — Background Playback Exit Modal
 *
 * Shown when the user presses back while audio is active.
 * Lets user choose to continue hearing in background or stop playing.
 * - Hear in background: Keeps playback active and navigates back with zero ads.
 * - Stop playing: Stops speech, presents an interstitial ad, and exits.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';

interface BackgroundPlaybackExitModalProps {
  visible: boolean;
  documentTitle?: string;
  isPlaying?: boolean;
  onContinueInBackground: () => void;
  onStopAndExit: () => void;
  onCancel: () => void;
}

export function BackgroundPlaybackExitModal({
  visible,
  documentTitle,
  isPlaying = true,
  onContinueInBackground,
  onStopAndExit,
  onCancel,
}: BackgroundPlaybackExitModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
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
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.accentSoft }]}>
            <Text style={styles.iconEmoji}>🎧</Text>
          </View>

          <Text
            style={[
              theme.typography.title,
              { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 8 },
            ]}
          >
            {isPlaying ? 'Audio is Playing' : 'Playback is Paused'}
          </Text>

          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
            ]}
          >
            {documentTitle
              ? `Would you like to keep listening to "${documentTitle}" in the background, or stop playback?`
              : 'Would you like to keep listening in the background, or stop playback?'}
          </Text>

          {/* Primary Option: Keep Listening */}
          <TouchableOpacity
            onPress={onContinueInBackground}
            accessibilityLabel="Continue listening in background"
            accessibilityRole="button"
            activeOpacity={0.8}
            style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={styles.primaryButtonText}>🎧 Hear in Background</Text>
          </TouchableOpacity>

          {/* Secondary Option: Stop Playing */}
          <TouchableOpacity
            onPress={onStopAndExit}
            accessibilityLabel="Stop playing audio and exit"
            accessibilityRole="button"
            activeOpacity={0.8}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.error || '#EF4444' }]}>
              ⏹ Stop Playing
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onCancel}
            accessibilityLabel="Cancel and stay on reader"
            accessibilityRole="button"
            style={styles.cancelButton}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
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
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 30,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
