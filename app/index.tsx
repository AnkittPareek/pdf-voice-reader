/**
 * PDF Voice Reader — Library Screen (Home)
 *
 * Spec reference: Section 6.1 (first launch) and 6.2 (populated)
 * The main entry point. Shows recently opened PDFs and an Add PDF CTA.
 *
 * Requirements:
 * - One dominant CTA
 * - No permission wall
 * - Launch system picker only after user taps Add PDF
 * - Briefly explain that files remain on-device
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/theme';
import { useLibraryStore } from '../src/state/libraryStore';
import { PdfCard } from '../src/components/PdfCard/PdfCard';
import { Document } from '../src/domain/documents/types';
import { generateId } from '../src/utils/formatters';
import { HAS_SEEN_WELCOME_KEY } from './welcome';
import { BannerAdView } from '../src/components/Ads/BannerAdView';
import { RewardedAdModal } from '../src/components/Ads/RewardedAdModal';
import { HomeAudioPlayer } from '../src/components/HomeAudioPlayer/HomeAudioPlayer';
import { DocumentVoiceSetupModal } from '../src/components/Modals/DocumentVoiceSetupModal';
import { adService } from '../src/application/AdService';
import { usePlaybackStore } from '../src/state/playbackStore';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';
import { defaultPdfEngine } from '../src/infrastructure/native/PdfEngine';
import { defaultSpeechEngine } from '../src/infrastructure/native/SpeechEngine';
import { detectDocumentLanguage } from '../src/utils/languageDetector';
import { SpeechVoice } from '../src/domain/speech/types';

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents, loadDocuments, addDocument, removeDocument } = useLibraryStore();
  const [showRewardedModal, setShowRewardedModal] = useState(false);
  const [isAdFree, setIsAdFree] = useState(false);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<{ code: string; name: string }>({
    code: 'en',
    name: 'English',
  });

  useEffect(() => {
    loadDocuments();
    adService.initialize().then(() => {
      setIsAdFree(adService.isAdFreeActive());
    });
    defaultSpeechEngine
      .initialize()
      .then(() => defaultSpeechEngine.getVoices())
      .then(setVoices)
      .catch(() => {});
  }, [loadDocuments]);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const seen = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
        if (seen === null) {
          router.push('/welcome');
        }
      } catch {}
    }
    checkFirstLaunch();
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
      adService.initialize().then(() => {
        setIsAdFree(adService.isAdFreeActive());
      });
    }, [loadDocuments])
  );

  const handleAddPdf = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/epub+zip',
          'text/plain',
          'text/markdown',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const lowerName = (asset.name || '').toLowerCase();
      const validExtensions = ['.pdf', '.epub', '.txt', '.text', '.md'];
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
      const validMimeTypes = [
        'application/pdf',
        'application/epub+zip',
        'text/plain',
        'text/markdown',
      ];
      const hasValidMime = asset.mimeType ? validMimeTypes.includes(asset.mimeType) : false;

      if (!hasValidExt && !hasValidMime) {
        Alert.alert(
          'Unsupported Document Type',
          'Please select a readable document format: PDF (.pdf), EPUB ebook (.epub), or text file (.txt, .md).'
        );
        return;
      }

      const docId = generateId();
      let detectedLang = 'en';
      let detectedLangName = 'English';

      try {
        await defaultPdfEngine.open(asset.uri, docId);
        const pageText = await defaultPdfEngine.getPageText(docId, 0);
        if (pageText?.text) {
          const res = detectDocumentLanguage(pageText.text);
          detectedLang = res.code;
          detectedLangName = res.name;
        }
      } catch (err) {
        console.warn('Initial language detection error:', err);
      }

      const doc: Document = {
        id: docId,
        uri: asset.uri,
        fileName: asset.name || 'Document',
        fileSize: asset.size,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        lastPositionPage: 0,
        lastPositionChunk: 0,
        progress: 0,
        status: 'ready',
        language: detectedLang,
      };

      setPendingDoc(doc);
      setDetectedLanguage({ code: detectedLang, name: detectedLangName });
      setShowVoiceSetupModal(true);
    } catch {
      Alert.alert(
        'Could not open document',
        'There was a problem selecting the file. Please try again.'
      );
    }
  }, []);

  const handleConfirmDocVoice = useCallback(
    async (voiceId: string, languageCode: string) => {
      if (!pendingDoc) return;
      setShowVoiceSetupModal(false);

      const finalDoc: Document = {
        ...pendingDoc,
        language: languageCode,
        voiceId: voiceId || undefined,
      };

      await addDocument(finalDoc);
      if (voiceId) {
        await speechOrchestrator.setDocumentVoice(voiceId, languageCode);
      }
      setPendingDoc(null);
      router.push({ pathname: '/reader', params: { documentId: finalDoc.id } });
    },
    [addDocument, pendingDoc, router]
  );

  const handleCancelDocVoice = useCallback(async () => {
    if (!pendingDoc) return;
    setShowVoiceSetupModal(false);
    await addDocument(pendingDoc);
    const id = pendingDoc.id;
    setPendingDoc(null);
    router.push({ pathname: '/reader', params: { documentId: id } });
  }, [addDocument, pendingDoc, router]);

  const handleDocumentPress = useCallback(
    (doc: Document) => {
      router.push({ pathname: '/reader', params: { documentId: doc.id } });
    },
    [router]
  );

  const handleDeleteDocument = useCallback(
    (doc: Document) => {
      Alert.alert(
        'Remove Document',
        `Remove "${doc.fileName || 'this document'}" from your library? Your saved reading position will be cleared.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (usePlaybackStore.getState().documentId === doc.id) {
                await speechOrchestrator.stop();
              }
              await removeDocument(doc.id);
            },
          },
        ]
      );
    },
    [removeDocument]
  );

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const mostRecent =
    documents.length > 0
      ? documents.reduce((latest, doc) =>
          (doc.lastOpenedAt ?? 0) > (latest.lastOpenedAt ?? 0) ? doc : latest
        )
      : undefined;
  const otherDocuments = documents.filter((d) => d.id !== mostRecent?.id);
  const isEmpty = documents.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary, fontWeight: '800' }]}>
          PDF Voice
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowRewardedModal(true)}
            accessibilityLabel={isAdFree ? 'Ad-free status active' : 'Get 1 hour ad-free'}
            accessibilityRole="button"
            style={[
              styles.adFreeBadge,
              {
                backgroundColor: isAdFree ? theme.colors.successSoft : theme.colors.accentSoft,
                borderColor: isAdFree ? '#A7F3D0' : '#C7D2FE',
              },
            ]}
          >
            <Text
              style={[
                styles.adFreeBadgeText,
                { color: isAdFree ? theme.colors.success : theme.colors.accent },
              ]}
            >
              {isAdFree ? '🛡️ Ad-Free' : '🎁 Ad-Free'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSettingsPress}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            style={[
              styles.settingsButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <Text style={[styles.settingsIcon, { color: theme.colors.textPrimary }]}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          /* Empty state — Section 6.1 */
          <View style={styles.emptyState}>
            <Text
              style={[
                theme.typography.title,
                { color: theme.colors.textPrimary, textAlign: 'center', fontWeight: '800' },
              ]}
            >
              Listen to your PDFs{'\n'}without staring at the screen.
            </Text>

            <TouchableOpacity
              onPress={handleAddPdf}
              accessibilityLabel="Add a PDF or document"
              accessibilityRole="button"
              activeOpacity={0.8}
              style={[styles.addButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text
                style={[
                  theme.typography.body,
                  { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                + Add Document
              </Text>
            </TouchableOpacity>

            {/* Supported formats indicator */}
            <View style={styles.supportedFormatsContainer}>
              <Text style={[styles.supportedFormatsLabel, { color: theme.colors.textSecondary }]}>
                SUPPORTED FORMATS
              </Text>
              <View style={styles.formatBadgesRow}>
                <View
                  style={[
                    styles.formatBadge,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
                  ]}
                >
                  <Text style={[styles.formatBadgeText, { color: theme.colors.accent }]}>
                    📄 PDF
                  </Text>
                </View>
                <View
                  style={[
                    styles.formatBadge,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
                  ]}
                >
                  <Text style={[styles.formatBadgeText, { color: theme.colors.accent }]}>
                    📖 EPUB
                  </Text>
                </View>
                <View
                  style={[
                    styles.formatBadge,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
                  ]}
                >
                  <Text style={[styles.formatBadgeText, { color: theme.colors.accent }]}>
                    📝 TXT
                  </Text>
                </View>
                <View
                  style={[
                    styles.formatBadge,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
                  ]}
                >
                  <Text style={[styles.formatBadgeText, { color: theme.colors.accent }]}>
                    📋 MD
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={[
                theme.typography.secondary,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 14,
                  fontWeight: '500',
                },
              ]}
            >
              Your documents will appear here.{'\n'}Files stay 100% on your device.
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/welcome')}
              accessibilityRole="button"
              accessibilityLabel="Learn how PDF Voice works"
              style={[styles.howItWorksButton, { borderColor: theme.colors.divider }]}
            >
              <Text
                style={[
                  theme.typography.secondary,
                  { color: theme.colors.accent, fontWeight: '600' },
                ]}
              >
                Learn how it works ›
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Populated state — Section 6.2 */
          <>
            {/* Continue listening — featured card */}
            {mostRecent && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionHeader,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {mostRecent.progress >= 1 ? 'READ AGAIN' : 'CONTINUE LISTENING'}
                </Text>
                <PdfCard
                  document={mostRecent}
                  onPress={handleDocumentPress}
                  onDelete={handleDeleteDocument}
                  variant="featured"
                />
              </View>
            )}

            {/* Recent documents */}
            {otherDocuments.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionHeader,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  RECENT DOCUMENTS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {otherDocuments.map((doc) => (
                    <PdfCard
                      key={doc.id}
                      document={doc}
                      onPress={handleDocumentPress}
                      onDelete={handleDeleteDocument}
                      variant="compact"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Add PDF button (populated state) */}
            <TouchableOpacity
              onPress={handleAddPdf}
              accessibilityLabel="Add another document"
              accessibilityRole="button"
              activeOpacity={0.8}
              style={[
                styles.addButtonSecondary,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.divider,
                },
              ]}
            >
              <Text style={[styles.addPlusIcon, { color: theme.colors.accent }]}>+</Text>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.accent, fontWeight: '700' },
                ]}
              >
                Add Document
              </Text>
            </TouchableOpacity>

            {/* Supported formats indicator in populated state */}
            <View style={styles.populatedFormatsRow}>
              <Text style={[styles.populatedFormatsText, { color: theme.colors.textSecondary }]}>
                Supported: PDF · EPUB · TXT · MD
              </Text>
            </View>

            {/* Privacy footer notice */}
            <View style={styles.privacyNoticeContainer}>
              <Text style={[styles.privacyNoticeText, { color: theme.colors.textSecondary }]}>
                🔒 100% On-Device · Your documents never leave this phone
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Persistent Home Screen Audio Player Controls */}
      <HomeAudioPlayer documents={documents} />

      {/* Bottom Library Sponsor Banner */}
      <BannerAdView onPressRemoveAds={() => setShowRewardedModal(true)} />

      {/* 1h Ad-Free Rewarded Unlock Modal */}
      <RewardedAdModal
        visible={showRewardedModal}
        onClose={() => setShowRewardedModal(false)}
        onRewardGranted={() => setIsAdFree(true)}
      />

      {/* Per-Document Narrator Voice & Language Setup Modal */}
      {showVoiceSetupModal && (
        <DocumentVoiceSetupModal
          key={pendingDoc?.id || 'new_doc_voice_modal'}
          visible={showVoiceSetupModal}
          documentTitle={pendingDoc?.fileName || 'Document'}
          detectedLanguageCode={detectedLanguage.code}
          detectedLanguageName={detectedLanguage.name}
          initialVoiceId={pendingDoc?.voiceId || ''}
          voices={voices}
          onConfirm={handleConfirmDocVoice}
          onCancel={handleCancelDocVoice}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adFreeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  adFreeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonSecondary: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  addPlusIcon: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 26,
  },
  howItWorksButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  section: {
    marginTop: 20,
  },
  recentRow: {
    gap: 12,
    paddingBottom: 4,
  },
  privacyNoticeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  privacyNoticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  supportedFormatsContainer: {
    marginTop: 18,
    alignItems: 'center',
    gap: 8,
  },
  supportedFormatsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  formatBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  populatedFormatsRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  populatedFormatsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
