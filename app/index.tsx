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
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>
          PDF Voice
        </Text>
        <TouchableOpacity
          onPress={handleSettingsPress}
          accessibilityLabel="Settings"
          accessibilityRole="button"
          style={styles.settingsButton}
        >
          <Text style={[styles.settingsIcon, { color: theme.colors.textSecondary }]}>⚙</Text>
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
                { color: theme.colors.textPrimary, textAlign: 'center' },
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
                  { color: '#FFFFFF', fontWeight: '600' },
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
                    theme.typography.secondary,
                    {
                      color: theme.colors.textSecondary,
                      marginBottom: 12,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    },
                  ]}
                >
                  {mostRecent.progress >= 1 ? 'Read again' : 'Continue listening'}
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
                    theme.typography.secondary,
                    {
                      color: theme.colors.textSecondary,
                      marginBottom: 12,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    },
                  ]}
                >
                  Recent
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
                  borderColor: theme.colors.divider,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.accent, fontWeight: '600' },
                ]}
              >
                + Add PDF
              </Text>
            </TouchableOpacity>
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    borderRadius: 12,
    marginTop: 32,
  },
  addButtonSecondary: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
  },
  howItWorksButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  section: {
    marginTop: 24,
  },
  recentRow: {
    gap: 12,
  },
});
