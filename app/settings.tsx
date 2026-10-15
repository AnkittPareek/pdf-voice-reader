/**
 * PDF Voice Reader — Settings Screen
 *
 * Spec reference: Section 4 (UX architecture — Settings surface)
 * Settings: TTS voice, Language, Speed, Theme, About/privacy
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/theme';
import { usePlaybackStore } from '../src/state/playbackStore';
import { formatRate } from '../src/utils/formatters';
import { SPEED_PRESETS, SpeechVoice } from '../src/domain/speech/types';
import { defaultSpeechEngine } from '../src/infrastructure/native/SpeechEngine';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';
import { adService } from '../src/application/AdService';
import {
  getAvailableVoiceLanguages,
  filterVoicesByLanguage,
  getPreviewSampleText,
} from '../src/utils/languageDetector';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const rate = usePlaybackStore((s) => s.rate);
  const setRate = usePlaybackStore((s) => s.setRate);
  const selectedVoiceId = usePlaybackStore((s) => s.voiceId);
  const setVoice = usePlaybackStore((s) => s.setVoice);

  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const availableLanguages = useMemo(() => getAvailableVoiceLanguages(voices), [voices]);

  const filteredVoices = useMemo(() => {
    const list = filterVoicesByLanguage(voices, selectedLanguage);
    if (selectedLanguage === 'all') {
      return [{ id: '', name: 'System default', locale: 'Natural device voice' }, ...list];
    }
    return list;
  }, [voices, selectedLanguage]);

  const isPreviewingRef = useRef(false);

  const stopPreviewIfActive = useCallback(async () => {
    if (isPreviewingRef.current) {
      try {
        await defaultSpeechEngine.stop();
      } catch {}
      isPreviewingRef.current = false;
    }
  }, []);

  useEffect(() => {
    async function loadVoices() {
      try {
        const availableVoices = await defaultSpeechEngine.getVoices();
        setVoices(availableVoices);
      } catch (e) {
        console.warn('Failed to load TTS voices:', e);
      }
    }
    loadVoices();

    return () => {
      if (isPreviewingRef.current) {
        defaultSpeechEngine.stop().catch(() => {});
        isPreviewingRef.current = false;
      }
    };
  }, []);

  const handleBack = useCallback(async () => {
    await stopPreviewIfActive();
    router.back();
  }, [router, stopPreviewIfActive]);

  const handleSelectSpeed = useCallback(
    async (speed: number) => {
      setRate(speed);
      await speechOrchestrator.setRate(speed);
    },
    [setRate]
  );

  const handlePreviewVoice = useCallback(
    async (voiceId: string) => {
      const voiceKey = voiceId || 'system_default';
      try {
        if (previewingVoiceId === voiceKey) {
          await stopPreviewIfActive();
          setPreviewingVoiceId(null);
          return;
        }

        // If a document is currently playing in background, pause it
        if (usePlaybackStore.getState().state === 'speaking') {
          await speechOrchestrator.pause();
        }

        await stopPreviewIfActive();
        isPreviewingRef.current = true;
        setPreviewingVoiceId(voiceKey);

        const targetVoice = voices.find((v) => v.id === voiceId);
        const sampleText = getPreviewSampleText(targetVoice?.locale || selectedLanguage);
        await defaultSpeechEngine.speak(sampleText, {
          voiceId: voiceId && voiceId !== 'system_default' ? voiceId : undefined,
          rate: rate || 1.0,
        });
        isPreviewingRef.current = false;
        setPreviewingVoiceId(null);
      } catch (e) {
        console.warn('Voice preview error:', e);
        isPreviewingRef.current = false;
        setPreviewingVoiceId(null);
      }
    },
    [previewingVoiceId, rate, voices, selectedLanguage, stopPreviewIfActive]
  );

  const handleSelectVoice = useCallback(
    async (voiceId: string) => {
      await stopPreviewIfActive();
      setPreviewingVoiceId(null);
      setVoice(voiceId);
      setShowVoiceModal(false);
      await speechOrchestrator.setVoice(voiceId);
      await adService.showInterstitial();
    },
    [setVoice, stopPreviewIfActive]
  );

  const activeVoiceName =
    voices.find((v) => v.id === selectedVoiceId)?.name || 'System default';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: theme.colors.textPrimary }]}>
            ‹
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            theme.typography.title,
            { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' },
          ]}
        >
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Speech section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            SPEECH & TTS
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {/* Voice Row */}
            <TouchableOpacity
              onPress={() => setShowVoiceModal(true)}
              style={styles.settingRow}
              accessibilityLabel="Select TTS voice"
              accessibilityRole="button"
            >
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Voice
              </Text>
              <View style={styles.voiceSelectorPreview}>
                <Text
                  style={[
                    styles.rowValueAccent,
                    { color: theme.colors.accent, maxWidth: 200 },
                  ]}
                  numberOfLines={1}
                >
                  {activeVoiceName}
                </Text>
                <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            {/* Speed Row */}
            <View style={styles.settingColumn}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Default reading speed
              </Text>

              {/* Horizontal swipeable speed presets */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.speedScrollContent}
              >
                {SPEED_PRESETS.map((speed) => {
                  const isSelected = rate === speed;
                  return (
                    <TouchableOpacity
                      key={speed}
                      onPress={() => handleSelectSpeed(speed)}
                      accessibilityLabel={`Speed ${formatRate(speed)}`}
                      style={[
                        styles.speedButton,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.background,
                          borderColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.divider,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.speedButtonText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {formatRate(speed)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Appearance section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            APPEARANCE
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {/* Dark Mode Switch Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.themeLabelContainer}>
                <Text
                  style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
                >
                  Dark Mode
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {theme.mode === 'dark'
                    ? 'Dark theme active'
                    : 'Light theme active (default)'}
                </Text>
              </View>

              <Switch
                value={theme.mode === 'dark'}
                onValueChange={(isDark) =>
                  theme.setThemeMode(isDark ? 'dark' : 'light')
                }
                trackColor={{
                  false: theme.colors.divider,
                  true: theme.colors.accent,
                }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Toggle Dark Mode"
              />
            </View>
          </View>
        </View>

        {/* Supported file types section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            SUPPORTED FILE TYPES
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {/* PDF */}
            <View style={styles.settingRow}>
              <View style={styles.formatItemLeft}>
                <View
                  style={[
                    styles.formatIconCircle,
                    { backgroundColor: theme.colors.accentSoft },
                  ]}
                >
                  <Text style={[styles.formatIconText, { color: theme.colors.accent }]}>
                    PDF
                  </Text>
                </View>
                <View style={styles.formatInfoText}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                    PDF Documents (.pdf)
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Ebooks, papers, reports & scanned pages
                  </Text>
                </View>
              </View>
              <Text style={[styles.badgeCheck, { color: theme.colors.accent }]}>✓ Ready</Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            {/* EPUB */}
            <View style={styles.settingRow}>
              <View style={styles.formatItemLeft}>
                <View
                  style={[
                    styles.formatIconCircle,
                    { backgroundColor: theme.colors.accentSoft },
                  ]}
                >
                  <Text style={[styles.formatIconText, { color: theme.colors.accent }]}>
                    EPUB
                  </Text>
                </View>
                <View style={styles.formatInfoText}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                    EPUB Ebooks (.epub)
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Reflowable digital books & publications
                  </Text>
                </View>
              </View>
              <Text style={[styles.badgeCheck, { color: theme.colors.accent }]}>✓ Ready</Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            {/* TXT */}
            <View style={styles.settingRow}>
              <View style={styles.formatItemLeft}>
                <View
                  style={[
                    styles.formatIconCircle,
                    { backgroundColor: theme.colors.accentSoft },
                  ]}
                >
                  <Text style={[styles.formatIconText, { color: theme.colors.accent }]}>
                    TXT
                  </Text>
                </View>
                <View style={styles.formatInfoText}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                    Plain Text (.txt, .text)
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Notes, transcripts, articles & raw text
                  </Text>
                </View>
              </View>
              <Text style={[styles.badgeCheck, { color: theme.colors.accent }]}>✓ Ready</Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            {/* Markdown */}
            <View style={styles.settingRow}>
              <View style={styles.formatItemLeft}>
                <View
                  style={[
                    styles.formatIconCircle,
                    { backgroundColor: theme.colors.accentSoft },
                  ]}
                >
                  <Text style={[styles.formatIconText, { color: theme.colors.accent }]}>
                    MD
                  </Text>
                </View>
                <View style={styles.formatInfoText}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                    Markdown (.md)
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Markdown notes, docs & formatted text
                  </Text>
                </View>
              </View>
              <Text style={[styles.badgeCheck, { color: theme.colors.accent }]}>✓ Ready</Text>
            </View>
          </View>
        </View>

        {/* Privacy & Storage section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            PRIVACY & STORAGE
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Data Storage
              </Text>
              <Text style={[styles.rowValueSuccess, { color: '#10B981' }]}>
                100% On-Device
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Cloud Sync
              </Text>
              <Text style={[styles.rowValueMuted, { color: theme.colors.textSecondary }]}>
                Disabled (Zero Uploads)
              </Text>
            </View>

          </View>

          {/* Guarantee banner box */}
          <View
            style={[
              styles.guaranteeBox,
              {
                backgroundColor: theme.colors.accentSoft,
                borderColor: '#C7D2FE',
              },
            ]}
          >
            <Text style={[styles.guaranteeTitle, { color: '#3730A3' }]}>
              🛡️ Offline-First Reading
            </Text>
            <Text style={[styles.guaranteeDesc, { color: '#4338CA' }]}>
              PDF Voice runs native on-device speech engines and local rendering. Your sensitive documents, books, and study material never leave your smartphone.
            </Text>
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textSecondary },
            ]}
          >
            ABOUT
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Version
              </Text>
              <Text
                style={[
                  styles.rowValueMuted,
                  { color: theme.colors.textSecondary },
                ]}
              >
                1.0.4 (Build 5)
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Speech Engine
              </Text>
              <Text
                style={[
                  styles.rowValueMuted,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Native Android TTS
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  theme.typography.title,
                  { color: theme.colors.textPrimary, flex: 1 },
                ]}
              >
                Select TTS Voice
              </Text>
              <TouchableOpacity
                onPress={() => setShowVoiceModal(false)}
                accessibilityLabel="Close voice picker"
                style={styles.modalCloseButton}
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Language filter chips */}
            <View style={styles.modalLanguageFilterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalLanguageFilterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.modalLanguageChip,
                    selectedLanguage === 'all' && styles.modalLanguageChipActive,
                    {
                      backgroundColor:
                        selectedLanguage === 'all'
                          ? theme.colors.accent
                          : theme.colors.surface,
                      borderColor:
                        selectedLanguage === 'all'
                          ? theme.colors.accent
                          : theme.colors.divider,
                    },
                  ]}
                  onPress={() => setSelectedLanguage('all')}
                  accessibilityRole="button"
                  accessibilityLabel="All languages"
                >
                  <Text
                    style={[
                      styles.modalLanguageChipText,
                      {
                        color:
                          selectedLanguage === 'all'
                            ? '#FFFFFF'
                            : theme.colors.textPrimary,
                      },
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
                        styles.modalLanguageChip,
                        isSelected && styles.modalLanguageChipActive,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.divider,
                        },
                      ]}
                      onPress={() => setSelectedLanguage(lang.code)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${lang.label}`}
                    >
                      <Text
                        style={[
                          styles.modalLanguageChipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {lang.label} ({lang.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <FlatList
              data={filteredVoices}
              keyExtractor={(item) => item.id || 'system_default'}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const voiceKey = item.id || 'system_default';
                const isSelected =
                  (!selectedVoiceId && !item.id) || selectedVoiceId === item.id;
                const isPreviewing = previewingVoiceId === voiceKey;
                return (
                  <View
                    style={[
                      styles.voiceModalItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accentSoft
                          : 'transparent',
                        borderColor: theme.colors.divider,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.voiceItemInfo}
                      onPress={() => handleSelectVoice(item.id)}
                      accessibilityLabel={`Select voice ${item.name}`}
                    >
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            color: isSelected
                              ? theme.colors.accent
                              : theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.locale ? (
                        <Text
                          style={[
                            theme.typography.caption,
                            { color: theme.colors.textSecondary, marginTop: 2 },
                          ]}
                        >
                          {item.locale}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    <View style={styles.voiceActions}>
                      <TouchableOpacity
                        style={[
                          styles.previewButton,
                          {
                            backgroundColor: isPreviewing
                              ? theme.colors.accent
                              : theme.colors.surface,
                            borderColor: theme.colors.accent,
                          },
                        ]}
                        onPress={() => handlePreviewVoice(item.id)}
                        accessibilityLabel={
                          isPreviewing
                            ? `Stop previewing ${item.name}`
                            : `Preview ${item.name}`
                        }
                      >
                        <Text
                          style={[
                            styles.previewButtonText,
                            {
                              color: isPreviewing
                                ? '#FFFFFF'
                                : theme.colors.accent,
                            },
                          ]}
                        >
                          {isPreviewing ? '❚❚ Stop' : '▶ Preview'}
                        </Text>
                      </TouchableOpacity>

                      {isSelected && (
                        <Text
                          style={[
                            styles.checkmark,
                            { color: theme.colors.accent },
                          ]}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.voiceListContent}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {},
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowValueAccent: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowValueMuted: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowValueSuccess: {
    fontSize: 14,
    fontWeight: '700',
  },
  voiceSelectorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '400',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  settingColumn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  speedScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonText: {
    fontSize: 13,
  },
  guaranteeBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    marginTop: 18,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  guaranteeDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalLanguageFilterWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  modalLanguageFilterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  modalLanguageChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalLanguageChipActive: {
    borderWidth: 1,
  },
  modalLanguageChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  voiceListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  voiceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  voiceItemInfo: {
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  themeLabelContainer: {
    flex: 1,
    paddingRight: 12,
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formatItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  formatIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIconText: {
    fontSize: 11,
    fontWeight: '800',
  },
  formatInfoText: {
    flex: 1,
  },
  badgeCheck: {
    fontSize: 12,
    fontWeight: '700',
  },
});
