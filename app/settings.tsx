/**
 * PDF Voice Reader — Settings Screen
 *
 * Spec reference: Section 4 (UX architecture — Settings surface)
 * Settings: TTS voice, Language, Speed, Theme, About/privacy
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/theme';
import { usePlaybackStore } from '../src/state/playbackStore';
import { formatRate } from '../src/utils/formatters';
import { SPEED_PRESETS, SpeechVoice } from '../src/domain/speech/types';
import { defaultSpeechEngine } from '../src/infrastructure/native/SpeechEngine';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const rate = usePlaybackStore((s) => s.rate);
  const setRate = usePlaybackStore((s) => s.setRate);
  const selectedVoiceId = usePlaybackStore((s) => s.voiceId);
  const setVoice = usePlaybackStore((s) => s.setVoice);

  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

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
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSelectSpeed = useCallback(
    async (speed: number) => {
      setRate(speed);
      await speechOrchestrator.setRate(speed);
    },
    [setRate]
  );

  const handleSelectVoice = useCallback(
    async (voiceId: string) => {
      setVoice(voiceId);
      setShowVoiceModal(false);
      await speechOrchestrator.setVoice(voiceId);
    },
    [setVoice]
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
            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Theme
              </Text>
              <Text
                style={[
                  styles.rowValueMuted,
                  { color: theme.colors.textSecondary },
                ]}
              >
                System automatic
              </Text>
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

            <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />

            <View style={styles.settingRow}>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textPrimary }]}
              >
                Advertising & Trackers
              </Text>
              <Text style={[styles.rowValueSuccess, { color: '#10B981' }]}>
                None (Zero Tracking)
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

            <FlatList
              data={[{ id: '', name: 'System default', locale: '' }, ...voices]}
              keyExtractor={(item) => item.id || 'system_default'}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const isSelected =
                  (!selectedVoiceId && !item.id) || selectedVoiceId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelectVoice(item.id)}
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
                    <View style={styles.voiceItemInfo}>
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
                    </View>
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
                  </TouchableOpacity>
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
});
