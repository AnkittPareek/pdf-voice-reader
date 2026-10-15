/**
 * PDF Voice Reader — Document Voice & Language Setup Modal
 *
 * Prompts the user to pick a narrator voice and language tailored to the document.
 * Displays auto-detected language from page 0 text snippet, provides language filter chips,
 * and allows instant on-device audio previewing with native language phrases.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useTheme } from '../../theme/theme';
import { SpeechVoice } from '../../domain/speech/types';
import { defaultSpeechEngine } from '../../infrastructure/native/SpeechEngine';
import {
  getAvailableVoiceLanguages,
  filterVoicesByLanguage,
  getPreviewSampleText,
  getLanguageDisplayName,
} from '../../utils/languageDetector';

export interface DocumentVoiceSetupModalProps {
  visible: boolean;
  documentTitle: string;
  detectedLanguageCode?: string;
  detectedLanguageName?: string;
  initialVoiceId?: string;
  voices: SpeechVoice[];
  onConfirm: (voiceId: string, languageCode: string) => void;
  onCancel: () => void;
}

export function DocumentVoiceSetupModal({
  visible,
  documentTitle,
  detectedLanguageCode = 'en',
  detectedLanguageName,
  initialVoiceId = '',
  voices,
  onConfirm,
  onCancel,
}: DocumentVoiceSetupModalProps) {
  const theme = useTheme();

  const [selectedLanguage, setSelectedLanguage] = useState<string>(detectedLanguageCode);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(initialVoiceId);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      defaultSpeechEngine.stop().catch(() => {});
    };
  }, []);

  const availableLanguages = useMemo(() => getAvailableVoiceLanguages(voices), [voices]);

  const filteredVoices = useMemo(() => {
    const list = filterVoicesByLanguage(voices, selectedLanguage);
    if (selectedLanguage === 'all') {
      return [{ id: '', name: 'System Default', locale: 'Natural device voice' }, ...list];
    }
    return list;
  }, [voices, selectedLanguage]);

  // Audio Preview Handler
  const handlePreview = useCallback(
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

        const targetVoice = voices.find((v) => v.id === voiceId);
        const sampleText = getPreviewSampleText(targetVoice?.locale || selectedLanguage);

        await defaultSpeechEngine.speak(sampleText, {
          voiceId: voiceId && voiceId !== 'system_default' ? voiceId : undefined,
          rate: 1.0,
        });
        setPreviewingVoiceId(null);
      } catch (e) {
        console.warn('Voice preview error in setup modal:', e);
        setPreviewingVoiceId(null);
      }
    },
    [previewingVoiceId, voices, selectedLanguage]
  );

  const handleSelectLanguage = useCallback((langCode: string) => {
    defaultSpeechEngine.stop().catch(() => {});
    setPreviewingVoiceId(null);
    setSelectedLanguage(langCode);

    // If changing language, clear or auto-select voice matching that language
    const matching = filterVoicesByLanguage(voices, langCode);
    if (matching.length > 0) {
      setSelectedVoiceId(matching[0].id);
    } else {
      setSelectedVoiceId('');
    }
  }, [voices]);

  const handleConfirm = useCallback(() => {
    defaultSpeechEngine.stop().catch(() => {});
    setPreviewingVoiceId(null);
    onConfirm(selectedVoiceId, selectedLanguage);
  }, [onConfirm, selectedVoiceId, selectedLanguage]);

  const handleClose = useCallback(() => {
    defaultSpeechEngine.stop().catch(() => {});
    setPreviewingVoiceId(null);
    onCancel();
  }, [onCancel]);

  const displayDetectedName =
    detectedLanguageName || getLanguageDisplayName(detectedLanguageCode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.divider,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.stepBadge, { color: theme.colors.accent }]}>
                🎙️ NARRATOR SETUP
              </Text>
              <Text
                style={[styles.title, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                Choose Document Voice
              </Text>
              <Text
                style={[styles.documentName, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                📄 {documentTitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              accessibilityLabel="Close setup"
              style={styles.closeBtn}
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Detected Language Banner */}
          <View
            style={[
              styles.detectionBanner,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <View style={styles.detectionBannerLeft}>
              <Text style={styles.detectionIcon}>✨</Text>
              <View>
                <Text style={[styles.detectionLabel, { color: theme.colors.textSecondary }]}>
                  Detected Document Language
                </Text>
                <Text style={[styles.detectionValue, { color: theme.colors.accent }]}>
                  {displayDetectedName}
                </Text>
              </View>
            </View>
            <View style={[styles.autoBadge, { backgroundColor: theme.colors.accentSoft }]}>
              <Text style={[styles.autoBadgeText, { color: theme.colors.accent }]}>
                Auto-Detected
              </Text>
            </View>
          </View>

          {/* Language filter scroll */}
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Change Language Filter:
          </Text>
          <View style={styles.languageChipsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageChipsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.languageChip,
                  selectedLanguage === 'all' && styles.languageChipActive,
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
                onPress={() => handleSelectLanguage('all')}
                accessibilityRole="button"
                accessibilityLabel="All languages"
              >
                <Text
                  style={[
                    styles.languageChipText,
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
                      styles.languageChip,
                      isSelected && styles.languageChipActive,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.divider,
                      },
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${lang.label}`}
                  >
                    <Text
                      style={[
                        styles.languageChipText,
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

          {/* Voice list */}
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Available Narrator Voices ({filteredVoices.length}):
          </Text>

          <FlatList
            data={filteredVoices}
            keyExtractor={(item) => item.id || 'system_default'}
            showsVerticalScrollIndicator={true}
            style={styles.voiceList}
            contentContainerStyle={styles.voiceListContent}
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
                    style={styles.voiceInfoRow}
                    onPress={() => setSelectedVoiceId(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`Select ${item.name}`}
                  >
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

                    <View style={styles.voiceTexts}>
                      <Text
                        style={[
                          styles.voiceName,
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
                          style={[styles.voiceLocale, { color: theme.colors.textSecondary }]}
                        >
                          {item.locale}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.previewBtn,
                      {
                        backgroundColor: isPreviewing ? theme.colors.accent : theme.colors.surface,
                        borderColor: theme.colors.accent,
                      },
                    ]}
                    onPress={() => handlePreview(item.id)}
                    accessibilityLabel={
                      isPreviewing ? `Stop previewing ${item.name}` : `Preview ${item.name}`
                    }
                  >
                    <Text
                      style={[
                        styles.previewBtnText,
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

          {/* Action buttons */}
          <View style={styles.actionFooter}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: theme.colors.accent }]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm narrator and start listening"
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                🎧 Start Listening
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.defaultBtn, { borderColor: theme.colors.divider }]}
              onPress={() => {
                setSelectedVoiceId('');
                handleConfirm();
              }}
              accessibilityRole="button"
              accessibilityLabel="Use default narrator"
            >
              <Text style={[styles.defaultBtnText, { color: theme.colors.textSecondary }]}>
                Use Default Narrator
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 10,
    gap: 3,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  documentName: {
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  detectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  detectionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  detectionIcon: {
    fontSize: 22,
  },
  detectionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  detectionValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  autoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  languageChipsWrapper: {
    marginBottom: 12,
  },
  languageChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  languageChip: {
    paddingHorizontal: 12,
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
  voiceList: {
    maxHeight: 220,
    marginBottom: 14,
  },
  voiceListContent: {
    gap: 8,
    paddingVertical: 2,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  voiceInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  voiceTexts: {
    flex: 1,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceLocale: {
    fontSize: 11,
    marginTop: 2,
  },
  previewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionFooter: {
    gap: 10,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  defaultBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
