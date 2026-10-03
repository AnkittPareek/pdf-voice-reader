/**
 * PDF Voice Reader — Theme System
 *
 * Provides a React context-based theme with light/dark mode support.
 * Uses system preference by default (userInterfaceStyle: "automatic" in app.json).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorTokens } from './colors';
import { typography, type TypographyTokens } from './typography';
import { spacing, radii, type SpacingTokens } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: typeof radii;
}

function createTheme(mode: 'light' | 'dark'): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    typography,
    spacing,
    radii,
  };
}

const ThemeContext = createContext<Theme>(createTheme('light'));

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedMode?: 'light' | 'dark';
}

export function ThemeProvider({ children, forcedMode }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolvedMode = forcedMode ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo(() => createTheme(resolvedMode), [resolvedMode]);

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export { lightColors, darkColors, typography, spacing, radii };
