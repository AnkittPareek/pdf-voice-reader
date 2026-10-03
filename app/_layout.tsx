import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/theme';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.errorCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
          },
        ]}
      >
        <View
          style={[
            styles.errorIconCircle,
            { backgroundColor: theme.colors.accentSoft },
          ]}
        >
          <Text style={[styles.errorIconText, { color: theme.colors.accent }]}>
            !
          </Text>
        </View>

        <Text
          style={[
            theme.typography.title,
            { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 16 },
          ]}
        >
          Something went wrong
        </Text>

        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
            },
          ]}
        >
          An unexpected problem occurred. Your reading positions and documents remain safely saved on your device.
        </Text>

        {__DEV__ && error?.message ? (
          <View
            style={[
              styles.debugBox,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.error },
              ]}
              numberOfLines={3}
            >
              {error.message}
            </Text>
          </View>
        ) : null}

        <View style={styles.errorActionRow}>
          <TouchableOpacity
            onPress={retry}
            style={[styles.retryBtn, { backgroundColor: theme.colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={[
              styles.homeBtn,
              { borderColor: theme.colors.divider, backgroundColor: theme.colors.surface },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to Library"
          >
            <Text
              style={[
                styles.homeBtnText,
                { color: theme.colors.textPrimary },
              ]}
            >
              Go to Library
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="listening" />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    fontSize: 26,
    fontWeight: '800',
  },
  debugBox: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  homeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
