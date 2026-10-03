/**
 * PDF Voice Reader — AudioIcons Component
 *
 * Pixel-perfect, pure React Native vector icons for media playback.
 * Eliminates Unicode glyph alignment/font inconsistencies across Android devices.
 * Guarantees mathematical and optical centering inside circular/pill audio buttons.
 */

import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';

export interface AudioIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Optically centered Play triangle.
 * Compensates for triangular center-of-mass to sit perfectly dead-center in circular buttons.
 */
export function PlayIcon({ size = 22, color = '#FFFFFF', style }: AudioIconProps) {
  const height = size;
  const width = Math.round(size * 0.88);
  const halfH = height / 2;
  // Optical centroid compensation: triangle centroid is at 1/3 width, so shift right
  const opticalShift = Math.max(1, Math.round(width * 0.16));

  return (
    <View style={[styles.centerContainer, { width: size, height: size }, style]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftWidth: width,
          borderTopWidth: halfH,
          borderBottomWidth: halfH,
          borderLeftColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          marginLeft: opticalShift,
        }}
      />
    </View>
  );
}

/**
 * Symmetrical twin-pill Pause bars with balanced spacing and rounded caps.
 */
export function PauseIcon({ size = 20, color = '#FFFFFF', style }: AudioIconProps) {
  const barWidth = Math.max(3, Math.round(size * 0.28));
  const gap = Math.max(3, Math.round(size * 0.26));
  const radius = Math.max(1.5, Math.round(barWidth / 2));

  return (
    <View style={[styles.rowCenter, { width: size, height: size, gap }, style]}>
      <View
        style={{
          width: barWidth,
          height: size,
          backgroundColor: color,
          borderRadius: radius,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: size,
          backgroundColor: color,
          borderRadius: radius,
        }}
      />
    </View>
  );
}

/**
 * Previous Track / Paragraph icon (vertical stop bar + left triangle).
 */
export function PrevTrackIcon({ size = 18, color = '#171717', style }: AudioIconProps) {
  const barWidth = Math.max(2, Math.round(size * 0.16));
  const triWidth = Math.round(size * 0.62);
  const halfH = Math.round((size * 0.82) / 2);

  return (
    <View style={[styles.rowCenter, { width: size, height: size }, style]}>
      <View
        style={{
          width: barWidth,
          height: size * 0.82,
          backgroundColor: color,
          borderRadius: 1,
          marginRight: 2,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderRightWidth: triWidth,
          borderTopWidth: halfH,
          borderBottomWidth: halfH,
          borderRightColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
    </View>
  );
}

/**
 * Next Track / Paragraph icon (right triangle + vertical stop bar).
 */
export function NextTrackIcon({ size = 18, color = '#171717', style }: AudioIconProps) {
  const barWidth = Math.max(2, Math.round(size * 0.16));
  const triWidth = Math.round(size * 0.62);
  const halfH = Math.round((size * 0.82) / 2);

  return (
    <View style={[styles.rowCenter, { width: size, height: size }, style]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftWidth: triWidth,
          borderTopWidth: halfH,
          borderBottomWidth: halfH,
          borderLeftColor: color,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          marginRight: 2,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: size * 0.82,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

/**
 * Solid square Stop icon with refined rounded corners.
 */
export function StopIcon({ size = 16, color = '#171717', style }: AudioIconProps) {
  const corner = Math.max(2, Math.round(size * 0.18));
  const innerSize = Math.round(size * 0.82);

  return (
    <View style={[styles.centerContainer, { width: size, height: size }, style]}>
      <View
        style={{
          width: innerSize,
          height: innerSize,
          backgroundColor: color,
          borderRadius: corner,
        }}
      />
    </View>
  );
}

/**
 * Minimalist fullscreen / expand icon with four corner brackets.
 */
export function ExpandIcon({ size = 16, color = '#171717', style }: AudioIconProps) {
  const arm = Math.max(3, Math.round(size * 0.36));
  const th = 2;

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      {/* Top Left */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: arm, height: th, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: th, height: arm, backgroundColor: color }} />
      {/* Top Right */}
      <View style={{ position: 'absolute', top: 0, right: 0, width: arm, height: th, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: th, height: arm, backgroundColor: color }} />
      {/* Bottom Left */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: arm, height: th, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: th, height: arm, backgroundColor: color }} />
      {/* Bottom Right */}
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: arm, height: th, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: th, height: arm, backgroundColor: color }} />
    </View>
  );
}

/**
 * Centered clean close / dismiss icon.
 */
export function CloseIcon({ size = 14, color = '#171717', style }: AudioIconProps) {
  const barH = size;
  const barW = 2;

  return (
    <View style={[styles.centerContainer, { width: size, height: size }, style]}>
      <View
        style={{
          position: 'absolute',
          width: barW,
          height: barH,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: barW,
          height: barH,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
