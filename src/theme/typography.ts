/**
 * PDF Voice Reader — Typography Tokens
 *
 * Spec reference: Section 5.3 Typography
 * Application UI text styles.
 */

import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0,
  },
  secondary: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.2,
  },
} as const;

export type TypographyTokens = typeof typography;
