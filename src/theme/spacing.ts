/**
 * PDF Voice Reader — Spacing Tokens
 *
 * Spec reference: Section 5.4 Shape and interaction
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
} as const;

export const radii = {
  /** 8px — compact controls */
  sm: 8,
  /** 12px — cards/sheets */
  md: 12,
  /** 16px — large cards */
  lg: 16,
  /** 9999px — pill shapes (use sparingly) */
  full: 9999,
} as const;

/**
 * Minimum touch target: 44–48 dp
 * Per spec section 5.4 and accessibility requirements
 */
export const MIN_TOUCH_TARGET = 48;

export type SpacingTokens = typeof spacing;
