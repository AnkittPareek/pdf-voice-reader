/**
 * PDF Voice Reader — Theme System
 *
 * Provides a React context-based theme with light/dark mode support.
 * Default view of the app is Light mode.
 * Supports persistent runtime theme toggling between Light and Dark mode.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type ColorTokens } from './colors';
import { typography, type TypographyTokens } from './typography';
import { spacing, radii, type SpacingTokens } from './spacing';

export const THEME_STORAGE_KEY = '@pdf_voice_theme_mode';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: typeof radii;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

function createTheme(
  mode: 'light' | 'dark',
  setThemeMode: (m: 'light' | 'dark') => void = () => {},
  toggleTheme: () => void = () => {}
): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    typography,
    spacing,
    radii,
    setThemeMode,
    toggleTheme,
  };
}

const defaultTheme = createTheme('light');
const ThemeContext = createContext<Theme>(defaultTheme);

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedMode?: 'light' | 'dark';
}

export function ThemeProvider({ children, forcedMode }: ThemeProviderProps) {
  // Default view of app is light mode
  const [persistedMode, setPersistedMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let isMounted = true;
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (saved === 'dark' || saved === 'light')) {
          setPersistedMode(saved);
        }
      } catch {
        // Fallback to light
      }
    }

    loadSavedTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeMode = forcedMode ?? persistedMode;

  const setThemeMode = useCallback((newMode: 'light' | 'dark') => {
    setPersistedMode(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(activeMode === 'dark' ? 'light' : 'dark');
  }, [activeMode, setThemeMode]);

  const theme = useMemo(
    () => createTheme(activeMode, setThemeMode, toggleTheme),
    [activeMode, setThemeMode, toggleTheme]
  );

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export { lightColors, darkColors, typography, spacing, radii };

