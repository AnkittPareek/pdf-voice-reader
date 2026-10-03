/**
 * PDF Voice Reader — Welcome & Onboarding Screen
 *
 * Explains what PDF Voice Reader is, how offline voice reading works,
 * key features (background playback, automatic progress saving),
 * and privacy guarantees.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/theme';
import { MIN_TOUCH_TARGET } from '../src/theme/spacing';

export const HAS_SEEN_WELCOME_KEY = '@pdf_voice_has_seen_welcome';

interface StepItem {
  number: string;
  badge: string;
  title: string;
  description: string;
  detail: string;
}

const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    badge: 'IMPORT',
    title: 'Select Any PDF',
    description:
      'Add ebooks, research papers, lecture notes, or work reports from your device.',
    detail: '100% on-device · No uploads · No account needed',
  },
  {
    number: '02',
    badge: 'LISTEN',
    title: 'Natural Voice Playback',
    description:
      'Tap Listen on any page. Our native speech engine reads sentence-by-sentence with visual word tracking.',
    detail: 'Adjust reading speed (0.75x – 2.0x) · Multiple voices',
  },
  {
    number: '03',
    badge: 'MULTITASK',
    title: 'Background Audio',
    description:
      'Turn off your screen or switch to other apps. Your reading continues uninterrupted in your headphones.',
    detail: 'Lock-screen controls · Progress saved to the second',
  },
];

const HIGHLIGHTS = [
  {
    icon: '🔒',
    title: 'Total Privacy',
    desc: 'Your files never touch the cloud or remote servers.',
  },
  {
    icon: '⚡',
    title: 'Zero Latency',
    desc: 'Instant native rendering and on-device text extraction.',
  },
  {
    icon: '🎯',
    title: 'Always Resumes',
    desc: 'Picks up right where you stopped, even days later.',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleGetStarted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
    } catch {}
    router.replace('/');
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandPill, { backgroundColor: theme.colors.accentSoft }]}>
            <Text style={[styles.brandPillText, { color: theme.colors.accent }]}>PDF VOICE</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleGetStarted}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip welcome walkthrough"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary, fontWeight: '500' }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[theme.typography.display, styles.heroTitle, { color: theme.colors.textPrimary }]}>
            Read with your ears.
          </Text>
          <Text style={[theme.typography.body, styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            Convert your documents into a calm, focused listening experience. Completely offline, private, and designed for long-form reading.
          </Text>
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.secondary,
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            How it works
          </Text>

          <View style={styles.stepsContainer}>
            {HOW_IT_WORKS_STEPS.map((step) => (
              <View
                key={step.number}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.divider,
                  },
                ]}
              >
                <View style={styles.stepCardHeader}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: theme.colors.accentSoft }]}>
                    <Text style={[styles.stepNumberText, { color: theme.colors.accent }]}>
                      {step.number}
                    </Text>
                  </View>
                  <View style={[styles.stepTypePill, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.stepTypePillText, { color: theme.colors.textSecondary }]}>
                      {step.badge}
                    </Text>
                  </View>
                </View>

                <Text style={[theme.typography.title, styles.stepTitle, { color: theme.colors.textPrimary }]}>
                  {step.title}
                </Text>

                <Text style={[theme.typography.body, styles.stepDescription, { color: theme.colors.textSecondary }]}>
                  {step.description}
                </Text>

                <View style={[styles.stepDivider, { backgroundColor: theme.colors.divider }]} />

                <Text style={[theme.typography.caption, { color: theme.colors.accent, fontWeight: '600' }]}>
                  {step.detail}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Highlights Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.secondary,
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            Why you’ll love it
          </Text>

          <View
            style={[
              styles.highlightsCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {HIGHLIGHTS.map((item, idx) => (
              <View key={item.title}>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightIcon}>{item.icon}</Text>
                  <View style={styles.highlightTextContainer}>
                    <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                      {item.title}
                    </Text>
                    <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
                {idx < HIGHLIGHTS.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleGetStarted}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Get Started with PDF Voice Reader"
        >
          <Text style={[theme.typography.body, styles.primaryButtonText]}>
            Get Started
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            theme.typography.caption,
            styles.bottomNote,
            { color: theme.colors.textSecondary },
          ]}
        >
          100% on-device · No accounts · Always private
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroSection: {
    marginBottom: 28,
  },
  heroTitle: {
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  stepsContainer: {
    gap: 14,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  stepDivider: {
    height: 1,
    marginBottom: 10,
  },
  highlightsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  highlightIcon: {
    fontSize: 22,
    marginRight: 14,
    marginTop: 2,
  },
  highlightTextContainer: {
    flex: 1,
  },
  separator: {
    height: 1,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: MIN_TOUCH_TARGET,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomNote: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
  },
});
