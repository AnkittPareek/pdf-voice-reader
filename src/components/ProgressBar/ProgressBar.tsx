/**
 * PDF Voice Reader — ProgressBar Component
 *
 * A simple progress indicator for document reading progress.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/theme';

interface ProgressBarProps {
  progress: number; // 0.0 – 1.0
  height?: number;
}

export function ProgressBar({ progress, height = 4 }: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.divider,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clampedProgress * 100),
      }}
    >
      <View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: theme.colors.accent,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
