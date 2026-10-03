/**
 * PDF Voice Reader — ListenButton Component
 *
 * The primary CTA for starting/stopping speech playback.
 * Spec: "Do not bury Play/Pause inside settings."
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/theme';
import { MIN_TOUCH_TARGET } from '../../theme/spacing';
import { PlayIcon, PauseIcon } from '../AudioIcons/AudioIcons';

interface ListenButtonProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'normal' | 'large';
}

export function ListenButton({
  isPlaying,
  isPaused,
  onPress,
  disabled = false,
  size = 'normal',
}: ListenButtonProps) {
  const theme = useTheme();

  const labelText = isPlaying
    ? 'Pause'
    : isPaused
      ? 'Resume'
      : 'Listen';

  const accessibilityLabel = isPlaying
    ? 'Pause listening'
    : isPaused
      ? 'Resume listening'
      : 'Start listening';

  const isLarge = size === 'large';
  const iconColor = disabled ? theme.colors.textSecondary : '#FFFFFF';
  const iconSize = isLarge ? 20 : 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      style={[
        styles.button,
        isLarge && styles.buttonLarge,
        {
          backgroundColor: disabled
            ? theme.colors.divider
            : theme.colors.accent,
          minHeight: MIN_TOUCH_TARGET,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconWrapper}>
          {isPlaying ? (
            <PauseIcon size={iconSize} color={iconColor} />
          ) : (
            <PlayIcon size={iconSize} color={iconColor} />
          )}
        </View>
        <Text
          style={[
            isLarge ? theme.typography.title : theme.typography.body,
            {
              color: iconColor,
              fontWeight: '600',
              letterSpacing: 0.2,
            },
          ]}
        >
          {labelText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonLarge: {
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 18,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

