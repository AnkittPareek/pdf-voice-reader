/**
 * PDF Voice Reader — Color Tokens
 *
 * Spec reference: Section 5.2 Color tokens
 * Never hard-code these values in components. Use theme tokens.
 */

export const lightColors = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  textPrimary: '#171717',
  textSecondary: '#6B6B6B',
  divider: '#E6E6E3',
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  error: '#B42318',
  errorSoft: '#FEF3F2',
  success: '#059669',
  successSoft: '#ECFDF5',
} as const;

export const darkColors = {
  background: '#101114',
  surface: '#181A1F',
  textPrimary: '#F5F5F5',
  textSecondary: '#A7A9B0',
  divider: '#2B2E35',
  accent: '#818CF8',
  accentSoft: '#22254A',
  error: '#F97066',
  errorSoft: '#3B1A1A',
  success: '#34D399',
  successSoft: '#0D2818',
} as const;

export type ColorTokens = {
  readonly background: string;
  readonly surface: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly divider: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly error: string;
  readonly errorSoft: string;
  readonly success: string;
  readonly successSoft: string;
};
