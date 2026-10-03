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

import React, { useCallback, useEffect } from 'react';
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

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents, loadDocuments, addDocument } = useLibraryStore();

  useEffect(() => {
    loadDocuments();
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
    }, [loadDocuments])
  );

  const handleAddPdf = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/epub+zip',
          'text/plain',
          'text/*',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const doc: Document = {
        id: generateId(),
        uri: asset.uri,
        fileName: asset.name || 'Document',
        fileSize: asset.size,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        lastPositionPage: 0,
        lastPositionChunk: 0,
        progress: 0,
        status: 'importing',
      };

      await addDocument(doc);
      router.push({ pathname: '/reader', params: { documentId: doc.id } });
    } catch {
      Alert.alert(
        'Could not open document',
        'There was a problem selecting the file. Please try again.'
      );
    }
  }, [addDocument, router]);

  const handleDocumentPress = useCallback(
    (doc: Document) => {
      router.push({ pathname: '/reader', params: { documentId: doc.id } });
    },
    [router]
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
              accessibilityLabel="Add a PDF document"
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
                + Add PDF
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                theme.typography.secondary,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 16,
                  fontWeight: '500',
                },
              ]}
            >
              Your PDFs will appear here.{'\n'}Files stay on your device.
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
                      variant="compact"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Add PDF button (populated state) */}
            <TouchableOpacity
              onPress={handleAddPdf}
              accessibilityLabel="Add another PDF"
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
                Add PDF or Document
              </Text>
            </TouchableOpacity>

            {/* Privacy footer notice */}
            <View style={styles.privacyNoticeContainer}>
              <Text style={[styles.privacyNoticeText, { color: theme.colors.textSecondary }]}>
                🔒 100% On-Device · Your documents never leave this phone
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
});
