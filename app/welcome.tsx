/**
 * PDF Voice Reader — Interactive Multi-Step First-Time Setup & Onboarding
 *
 * Steps:
 * 1. Appearance: Interactive Light Mode (Default) vs Dark Mode toggle
 * 2. TTS Voice: Live voice preview with native speech engine and selection
 * 3. Reading Speed: Select default speed with live "Test Speed" audio sample
 * 4. Supported Formats & Privacy: PDF, EPUB, TXT, MD format showcase & offline guarantees
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/theme';
import { MIN_TOUCH_TARGET } from '../src/theme/spacing';
import { usePlaybackStore } from '../src/state/playbackStore';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';
import { defaultSpeechEngine } from '../src/infrastructure/native/SpeechEngine';
import { SpeechVoice } from '../src/domain/speech/types';
import {
  getAvailableVoiceLanguages,
  filterVoicesByLanguage,
  getPreviewSampleText,
} from '../src/utils/languageDetector';

export const HAS_SEEN_WELCOME_KEY = '@pdf_voice_has_seen_welcome';

const TOTAL_STEPS = 4;

const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const FORMAT_ITEMS = [
  {
    ext: 'PDF',
    title: 'PDF Documents (.pdf)',
    desc: 'Ebooks, academic papers, reports & scanned pages',
    color: '#EF4444',
  },
  {
    ext: 'EPUB',
    title: 'EPUB Ebooks (.epub)',
    desc: 'Reflowable digital books & publications',
    color: '#3B82F6',
  },
  {
    ext: 'TXT',
    title: 'Plain Text (.txt, .text)',
    desc: 'Notes, transcripts, articles & raw text',
    color: '#10B981',
  },
  {
    ext: 'MD',
    title: 'Markdown (.md)',
    desc: 'Documentation, study guides & notes',
    color: '#8B5CF6',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [isPreviewingSpeed, setIsPreviewingSpeed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const selectedVoiceId = usePlaybackStore((s) => s.voiceId);
  const setVoice = usePlaybackStore((s) => s.setVoice);
  const rate = usePlaybackStore((s) => s.rate);
  const setRate = usePlaybackStore((s) => s.setRate);

  const availableLanguages = useMemo(() => getAvailableVoiceLanguages(voices), [voices]);

  const filteredVoices = useMemo(() => {
    const list = filterVoicesByLanguage(voices, selectedLanguage);
    if (selectedLanguage === 'all') {
      return [{ id: '', name: 'System Default', locale: 'Natural device voice' }, ...list];
    }
    return list;
  }, [voices, selectedLanguage]);

  // Load available voices on mount
  useEffect(() => {
    let isMounted = true;
    async function loadVoices() {
      try {
        await defaultSpeechEngine.initialize();
        const availableVoices = await defaultSpeechEngine.getVoices();
        if (isMounted) {
          setVoices(availableVoices);
        }
      } catch (e) {
        console.warn('Failed to load voices in welcome setup:', e);
      }
    }
    loadVoices();

    return () => {
      isMounted = false;
      defaultSpeechEngine.stop().catch(() => {});
    };
  }, []);

  // Stop any playing speech when switching steps
  const stopAudio = useCallback(async () => {
    try {
      await defaultSpeechEngine.stop();
    } catch {}
    setPreviewingVoiceId(null);
    setIsPreviewingSpeed(false);
  }, []);

  const handleCompleteSetup = useCallback(async () => {
    await stopAudio();
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
    } catch {}
    router.replace('/');
  }, [router, stopAudio]);

  const handleNext = useCallback(async () => {
    await stopAudio();
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleCompleteSetup();
    }
  }, [currentStep, handleCompleteSetup, stopAudio]);

  const handleBack = useCallback(async () => {
    await stopAudio();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, stopAudio]);

  // Voice preview handler
  const handlePreviewVoice = useCallback(
    async (voiceId: string) => {
      const voiceKey = voiceId || 'system_default';
      try {
        if (previewingVoiceId === voiceKey) {
          await defaultSpeechEngine.stop();
          setPreviewingVoiceId(null);
          return;
        }

        await defaultSpeechEngine.stop();
        setPreviewingVoiceId(voiceKey);
        setIsPreviewingSpeed(false);

        const targetVoice = voices.find((v) => v.id === voiceId);
        const sampleText = getPreviewSampleText(targetVoice?.locale || selectedLanguage);
        await defaultSpeechEngine.speak(sampleText, {
          voiceId: voiceId && voiceId !== 'system_default' ? voiceId : undefined,
          rate: rate || 1.0,
        });
        setPreviewingVoiceId(null);
      } catch (e) {
        console.warn('Voice preview error in setup:', e);
        setPreviewingVoiceId(null);
      }
    },
    [previewingVoiceId, rate, voices, selectedLanguage]
  );

  // Voice selection handler
  const handleSelectVoice = useCallback(
    async (voiceId: string) => {
      setVoice(voiceId);
      await speechOrchestrator.setVoice(voiceId).catch(() => {});
    },
    [setVoice]
  );

  // Speed selection handler
  const handleSelectSpeed = useCallback(
    async (newRate: number) => {
      setRate(newRate);
      await speechOrchestrator.setRate(newRate).catch(() => {});
    },
    [setRate]
  );

  // Speed test audio handler
  const handleTestSpeed = useCallback(async () => {
    try {
      if (isPreviewingSpeed) {
        await defaultSpeechEngine.stop();
        setIsPreviewingSpeed(false);
        return;
      }

      await defaultSpeechEngine.stop();
      setPreviewingVoiceId(null);
      setIsPreviewingSpeed(true);

      const sample = `This is how fast your documents will be read at ${rate.toFixed(2)}x speed.`;
      await defaultSpeechEngine.speak(sample, {
        voiceId: selectedVoiceId || undefined,
        rate: rate || 1.0,
      });
      setIsPreviewingSpeed(false);
    } catch (e) {
      console.warn('Speed test error in setup:', e);
      setIsPreviewingSpeed(false);
    }
  }, [isPreviewingSpeed, rate, selectedVoiceId]);

  // Step 1: Appearance content
  const renderAppearanceStep = () => {
    const isLight = theme.mode === 'light';
    const isDark = theme.mode === 'dark';

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeaderArea}>
          <Text style={[styles.stepBadgeText, { color: theme.colors.accent }]}>
            STEP 1 OF 4 · APPEARANCE
          </Text>
          <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
            Choose Your Theme
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>
            Select your preferred visual style. Light mode is the recommended default for comfortable daytime reading.
          </Text>
        </View>

        <View style={styles.appearanceCardsContainer}>
          {/* Light Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeChoiceCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isLight ? theme.colors.accent : theme.colors.divider,
                borderWidth: isLight ? 2 : 1,
              },
            ]}
            onPress={() => theme.setThemeMode('light')}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ checked: isLight }}
            accessibilityLabel="Light Mode (Default)"
          >
            <View style={styles.themeChoiceTop}>
              <View
                style={[
                  styles.themeIconCircle,
                  { backgroundColor: isLight ? theme.colors.accentSoft : theme.colors.background },
                ]}
              >
                <Text style={styles.themeEmoji}>☀️</Text>
              </View>
              {isLight && (
                <View style={[styles.activeCheckBadge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={styles.activeCheckText}>✓ Active</Text>
                </View>
              )}
            </View>

            <View style={styles.themeInfoBlock}>
              <View style={styles.themeTitleRow}>
                <Text style={[styles.themeTitle, { color: theme.colors.textPrimary }]}>
                  Light Mode
                </Text>
                <View style={[styles.defaultPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.defaultPillText, { color: '#92400E' }]}>DEFAULT</Text>
                </View>
              </View>
              <Text style={[styles.themeDesc, { color: theme.colors.textSecondary }]}>
                Clean paper-like aesthetic with crisp contrast. Ideal for day reading and bright spaces.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dark Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeChoiceCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isDark ? theme.colors.accent : theme.colors.divider,
                borderWidth: isDark ? 2 : 1,
              },
            ]}
            onPress={() => theme.setThemeMode('dark')}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ checked: isDark }}
            accessibilityLabel="Dark Mode"
          >
            <View style={styles.themeChoiceTop}>
              <View
                style={[
                  styles.themeIconCircle,
                  { backgroundColor: isDark ? theme.colors.accentSoft : theme.colors.background },
                ]}
              >
                <Text style={styles.themeEmoji}>🌙</Text>
              </View>
              {isDark && (
                <View style={[styles.activeCheckBadge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={styles.activeCheckText}>✓ Active</Text>
                </View>
              )}
            </View>

            <View style={styles.themeInfoBlock}>
              <Text style={[styles.themeTitle, { color: theme.colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.themeDesc, { color: theme.colors.textSecondary }]}>
                Dim obsidian backdrop designed to minimize eye strain in low-light and nighttime sessions.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Step 2: TTS Voice Selection content
  const renderVoiceStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeaderArea}>
          <Text style={[styles.stepBadgeText, { color: theme.colors.accent }]}>
            STEP 2 OF 4 · NARRATOR VOICE
          </Text>
          <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
            Pick Your Narrator
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>
            Select a language to filter voices, tap Preview to audition, and choose the voice you like best.
          </Text>
        </View>

        {/* Horizontal Language Filter Chips */}
        <View style={styles.languageFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.languageChip,
                selectedLanguage === 'all' && styles.languageChipActive,
                {
                  backgroundColor:
                    selectedLanguage === 'all' ? theme.colors.accent : theme.colors.surface,
                  borderColor:
                    selectedLanguage === 'all' ? theme.colors.accent : theme.colors.divider,
                },
              ]}
              onPress={() => setSelectedLanguage('all')}
              accessibilityRole="button"
              accessibilityLabel="All languages"
            >
              <Text
                style={[
                  styles.languageChipText,
                  { color: selectedLanguage === 'all' ? '#FFFFFF' : theme.colors.textPrimary },
                ]}
              >
                All ({voices.length + 1})
              </Text>
            </TouchableOpacity>

            {availableLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageChip,
                    isSelected && styles.languageChipActive,
                    {
                      backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.divider,
                    },
                  ]}
                  onPress={() => setSelectedLanguage(lang.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${lang.label}`}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
                    ]}
                  >
                    {lang.label} ({lang.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.voiceListWrapper}>
          <FlatList
            data={filteredVoices}
            keyExtractor={(item) => item.id || 'system_default'}
            showsVerticalScrollIndicator={true}
            style={styles.voiceFlatList}
            renderItem={({ item }) => {
              const voiceKey = item.id || 'system_default';
              const isSelected = (!selectedVoiceId && !item.id) || selectedVoiceId === item.id;
              const isPreviewing = previewingVoiceId === voiceKey;

              return (
                <View
                  style={[
                    styles.voiceCard,
                    {
                      backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.divider,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.voiceCardContent}
                    onPress={() => handleSelectVoice(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`Select voice ${item.name}`}
                  >
                    <View style={styles.voiceSelectIndicator}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isSelected ? theme.colors.accent : theme.colors.textSecondary },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[styles.radioInner, { backgroundColor: theme.colors.accent }]}
                          />
                        )}
                      </View>
                    </View>

                    <View style={styles.voiceTextGroup}>
                      <Text
                        style={[
                          styles.voiceNameText,
                          {
                            color: isSelected ? theme.colors.accent : theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.locale ? (
                        <Text
                          style={[styles.voiceLocaleText, { color: theme.colors.textSecondary }]}
                        >
                          {item.locale}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.voicePreviewBtn,
                      {
                        backgroundColor: isPreviewing ? theme.colors.accent : theme.colors.surface,
                        borderColor: theme.colors.accent,
                      },
                    ]}
                    onPress={() => handlePreviewVoice(item.id)}
                    accessibilityLabel={
                      isPreviewing ? `Stop previewing ${item.name}` : `Preview ${item.name}`
                    }
                  >
                    <Text
                      style={[
                        styles.voicePreviewBtnText,
                        { color: isPreviewing ? '#FFFFFF' : theme.colors.accent },
                      ]}
                    >
                      {isPreviewing ? '❚❚ Stop' : '▶ Preview'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </View>
    );
  };

  // Step 3: Default Reading Speed content
  const renderSpeedStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeaderArea}>
          <Text style={[styles.stepBadgeText, { color: theme.colors.accent }]}>
            STEP 3 OF 4 · READING PACE
          </Text>
          <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
            Set Default Hearing Speed
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>
            Select your comfortable listening rate. You can also test how it sounds in real time.
          </Text>
        </View>

        <View
          style={[
            styles.speedCardContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
          ]}
        >
          <View style={styles.speedDisplayHeader}>
            <Text style={[styles.speedCurrentLabel, { color: theme.colors.textSecondary }]}>
              CURRENT SPEED
            </Text>
            <Text style={[styles.speedCurrentValue, { color: theme.colors.accent }]}>
              {rate.toFixed(2)}x
            </Text>
          </View>

          <View style={styles.speedPresetsGrid}>
            {SPEED_PRESETS.map((speed) => {
              const isSelected = rate === speed;
              return (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedChip,
                    {
                      backgroundColor: isSelected ? theme.colors.accent : theme.colors.background,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.divider,
                    },
                  ]}
                  onPress={() => handleSelectSpeed(speed)}
                  accessibilityRole="button"
                  accessibilityLabel={`Speed ${speed}x`}
                >
                  <Text
                    style={[
                      styles.speedChipText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
                    ]}
                  >
                    {speed.toFixed(2)}x
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.speedDivider, { backgroundColor: theme.colors.divider }]} />

          <TouchableOpacity
            style={[
              styles.testSpeedButton,
              {
                backgroundColor: isPreviewingSpeed ? theme.colors.accent : theme.colors.accentSoft,
                borderColor: theme.colors.accent,
              },
            ]}
            onPress={handleTestSpeed}
            accessibilityLabel={
              isPreviewingSpeed ? 'Stop speed audio test' : 'Test current reading speed'
            }
          >
            <Text
              style={[
                styles.testSpeedButtonText,
                { color: isPreviewingSpeed ? '#FFFFFF' : theme.colors.accent },
              ]}
            >
              {isPreviewingSpeed ? '❚❚ Stop Audio Test' : '🔊 Test Speed Sample'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Step 4: Supported Document Formats & Privacy
  const renderFormatsAndPrivacyStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeaderArea}>
          <Text style={[styles.stepBadgeText, { color: theme.colors.accent }]}>
            STEP 4 OF 4 · READY TO READ
          </Text>
          <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
            Supported Documents
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>
            Add any of these formats directly from your device storage for offline voice playback:
          </Text>
        </View>

        <View style={styles.formatsList}>
          {FORMAT_ITEMS.map((item) => (
            <View
              key={item.ext}
              style={[
                styles.formatItemCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
              ]}
            >
              <View style={[styles.formatIconPill, { backgroundColor: item.color + '20' }]}>
                <Text style={[styles.formatIconPillText, { color: item.color }]}>{item.ext}</Text>
              </View>
              <View style={styles.formatItemInfo}>
                <Text style={[styles.formatItemTitle, { color: theme.colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.formatItemDesc, { color: theme.colors.textSecondary }]}>
                  {item.desc}
                </Text>
              </View>
              <Text style={[styles.readyBadge, { color: theme.colors.accent }]}>✓ Ready</Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.guaranteeBox,
            { backgroundColor: theme.colors.accentSoft, borderColor: '#C7D2FE' },
          ]}
        >
          <Text style={[styles.guaranteeTitle, { color: '#3730A3' }]}>
            🛡️ 100% Offline & Private Guarantee
          </Text>
          <Text style={[styles.guaranteeDesc, { color: '#4338CA' }]}>
            Your files never leave your device. Voice extraction, background playback, and progress saving run natively on your phone with zero cloud dependencies.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {currentStep > 0 ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
          >
            <Text style={[styles.backIcon, { color: theme.colors.textPrimary }]}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandBadge}>
            <Text style={[styles.brandBadgeText, { color: theme.colors.accent }]}>PDF VOICE</Text>
          </View>
        )}

        {/* Multi-step progress dots */}
        <View style={styles.stepProgressIndicator}>
          {[0, 1, 2, 3].map((idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive
                      ? theme.colors.accent
                      : isCompleted
                      ? theme.colors.accentSoft
                      : theme.colors.divider,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleCompleteSetup}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip setup walkthrough"
        >
          <Text style={[styles.skipBtnText, { color: theme.colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body per Step */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderAppearanceStep()}
        {currentStep === 1 && renderVoiceStep()}
        {currentStep === 2 && renderSpeedStep()}
        {currentStep === 3 && renderFormatsAndPrivacyStep()}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View
        style={[
          styles.bottomFooter,
          { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: theme.colors.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            currentStep === TOTAL_STEPS - 1 ? 'Start Reading' : 'Continue to next step'
          }
        >
          <Text style={styles.primaryActionBtnText}>
            {currentStep === TOTAL_STEPS - 1 ? 'Start Reading 🎧' : 'Continue  →'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    minHeight: 40,
    minWidth: 60,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandBadge: {
    minHeight: 40,
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  stepProgressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    minHeight: 40,
    minWidth: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeaderArea: {
    marginBottom: 20,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Appearance step
  appearanceCardsContainer: {
    gap: 16,
  },
  themeChoiceCard: {
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  themeChoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeEmoji: {
    fontSize: 24,
  },
  activeCheckBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  themeInfoBlock: {
    gap: 6,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  themeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Voice step
  languageFilterWrapper: {
    marginBottom: 12,
  },
  languageFilterScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  languageChipActive: {
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  voiceListWrapper: {
    maxHeight: 380,
  },
  voiceFlatList: {
    flexGrow: 0,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  voiceCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  voiceSelectIndicator: {
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  voiceTextGroup: {
    flex: 1,
  },
  voiceNameText: {
    fontSize: 15,
  },
  voiceLocaleText: {
    fontSize: 12,
    marginTop: 2,
  },
  voicePreviewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePreviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Speed step
  speedCardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  speedDisplayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  speedCurrentLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  speedCurrentValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  speedPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  speedChip: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  speedChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  speedDivider: {
    height: 1,
    marginVertical: 12,
  },
  testSpeedButton: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testSpeedButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Formats & Privacy step
  formatsList: {
    gap: 10,
    marginBottom: 16,
  },
  formatItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  formatIconPill: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formatIconPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formatItemInfo: {
    flex: 1,
  },
  formatItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  formatItemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  readyBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  guaranteeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Footer
  bottomFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    height: MIN_TOUCH_TARGET,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
