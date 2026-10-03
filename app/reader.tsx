/**
 * PDF Voice Reader — Reader Screen
 *
 * Spec reference: Section 6.3 (Reader screen)
 * Upgraded to full ReadEra-level functionality:
 * - Dual view modes: [📖 Ebook / Text] and [📄 Original PDF]
 * - Real-time sentence & word-level highlighting synchronized with TTS
 * - Auto-scroll to currently spoken sentence
 * - "Tap to read from here" on any paragraph
 * - Integrated ReadEra bottom audio controller with speed presets
 * - Font size customization (A- / A+)
 * - Automatic page follow-along when audio advances
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/theme';
import { usePlaybackStore } from '../src/state/playbackStore';
import { useLibraryStore } from '../src/state/libraryStore';
import { ListenButton } from '../src/components/ListenButton/ListenButton';
import { ProgressBar } from '../src/components/ProgressBar/ProgressBar';
import { Document } from '../src/domain/documents/types';
import { SpeechChunk, SPEED_PRESETS } from '../src/domain/speech/types';
import { DocumentRepository } from '../src/infrastructure/repositories/DocumentRepository';
import { defaultPdfEngine } from '../src/infrastructure/native/PdfEngine';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';
import { ReaderService } from '../src/application/ReaderService';
import { formatRate, getDocumentDisplayName } from '../src/utils/formatters';
import { PlayIcon, PauseIcon, PrevTrackIcon, NextTrackIcon, ExpandIcon, StopIcon } from '../src/components/AudioIcons/AudioIcons';

export default function ReaderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string }>();
  const documentId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;

  const [document, setDocument] = useState<Document | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageImageUri, setPageImageUri] = useState<string | null>(null);
  const [pageChunks, setPageChunks] = useState<SpeechChunk[]>([]);
  const [rawPageText, setRawPageText] = useState<string>('');
  const [isPageRendering, setIsPageRendering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  // ReadEra features
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');
  const [fontSize, setFontSize] = useState<number>(17);

  const playback = usePlaybackStore();
  const isPlaying = playback.state === 'speaking';
  const isPaused = playback.state === 'paused';
  const isSpeechActive = isPlaying || isPaused;

  const scrollViewRef = useRef<ScrollView>(null);
  const chunkLayoutsRef = useRef<{ [key: number]: number }>({});

  // Load document metadata and initial position
  useEffect(() => {
    async function loadDocument() {
      if (!documentId) {
        setError('No document specified');
        setIsLoading(false);
        return;
      }

      try {
        let doc = useLibraryStore.getState().documents.find((d) => d.id === documentId) || null;
        if (!doc) {
          doc = await DocumentRepository.getById(documentId);
        }
        if (!doc) {
          setError('Document not found');
          setIsLoading(false);
          return;
        }

        try {
          await DocumentRepository.updateLastOpened(documentId);
        } catch {}

        try {
          const info = await defaultPdfEngine.open(doc.uri, doc.id);
          const resolvedTitle = getDocumentDisplayName(info.title || doc.title, doc.fileName);
          const needsUpdate = !doc.pageCount || doc.pageCount <= 0 || !doc.title || doc.title !== resolvedTitle;
          if (needsUpdate && info.pageCount > 0) {
            try {
              await DocumentRepository.updateStatus(documentId, 'ready');
            } catch {}
            doc = {
              ...doc,
              pageCount: info.pageCount,
              title: resolvedTitle,
              author: info.author || doc.author,
              status: 'ready',
            };
            try {
              await DocumentRepository.insert(doc);
            } catch {}
            await useLibraryStore.getState().updateDocument(doc);
          }
        } catch (e: any) {
          console.warn('PdfEngine open error:', e);
        }

        setDocument(doc);
        setCurrentPageIndex(doc.lastPositionPage ?? 0);
      } catch (err: any) {
        console.error('Failed to open document:', err);
        setError(err?.message || 'Failed to open document');
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();
  }, [documentId]);

  // Synchronize current page if background audio progresses to next page
  useEffect(() => {
    let lastPage = currentPageIndex;
    const unsub = usePlaybackStore.subscribe((state) => {
      if (
        state.documentId === documentId &&
        state.pageIndex !== lastPage &&
        state.pageIndex >= 0 &&
        state.state === 'speaking'
      ) {
        lastPage = state.pageIndex;
        setCurrentPageIndex(state.pageIndex);
      }
    });
    return unsub;
  }, [documentId, currentPageIndex]);

  // Render current page image & extract text chunks
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      if (!document || !document.id) return;

      setIsPageRendering(true);

      // 1. Render PDF page image
      try {
        const screenWidth = Math.round(Dimensions.get('window').width);
        const imageUri = await defaultPdfEngine.renderPage(
          document.id,
          currentPageIndex,
          screenWidth
        );
        if (!isCancelled) {
          setPageImageUri(imageUri || null);
          // If no PDF image (e.g. EPUB or TXT file), default to text mode
          if (!imageUri) {
            setViewMode('text');
          }
        }
      } catch {
        if (!isCancelled) {
          setPageImageUri(null);
          setViewMode('text');
        }
      } finally {
        if (!isCancelled) {
          setIsPageRendering(false);
        }
      }

      // 2. Extract page text and generate speech chunks
      try {
        const textResult = await defaultPdfEngine.getPageText(document.id, currentPageIndex);
        if (!isCancelled) {
          const raw = textResult?.text?.trim() || '';
          setRawPageText(raw);
          if (raw.length > 0) {
            const chunks = ReaderService.processPage(textResult, document.id, 0);
            setPageChunks(chunks);
          } else {
            setPageChunks([]);
          }
        }
      } catch {
        if (!isCancelled) {
          setPageChunks([]);
        }
      }
    }

    loadPage();

    return () => {
      isCancelled = true;
    };
  }, [document, currentPageIndex]);

  // Auto-scroll to active sentence in Text View
  useEffect(() => {
    if (
      isSpeechActive &&
      playback.documentId === documentId &&
      playback.pageIndex === currentPageIndex &&
      viewMode === 'text'
    ) {
      const yPos = chunkLayoutsRef.current[playback.chunkIndex];
      if (yPos !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, yPos - 80),
          animated: true,
        });
      }
    }
  }, [playback.chunkIndex, playback.pageIndex, isSpeechActive, playback.documentId, documentId, currentPageIndex, viewMode]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePrevPage = useCallback(async () => {
    if (currentPageIndex > 0) {
      const prev = currentPageIndex - 1;
      setCurrentPageIndex(prev);
      if (isSpeechActive && document) {
        await speechOrchestrator.jumpToChunk(prev, 0, document.id);
      }
    }
  }, [currentPageIndex, isSpeechActive, document]);

  const handleNextPage = useCallback(async () => {
    const pageCount = document?.pageCount ?? 1;
    if (currentPageIndex + 1 < pageCount) {
      const next = currentPageIndex + 1;
      setCurrentPageIndex(next);
      if (isSpeechActive && document) {
        await speechOrchestrator.jumpToChunk(next, 0, document.id);
      }
    }
  }, [currentPageIndex, isSpeechActive, document]);

  // ReadEra: Tap any chunk/sentence to read from here
  const handleChunkPress = useCallback(
    async (chunkIndex: number) => {
      if (!document) return;
      await speechOrchestrator.jumpToChunk(currentPageIndex, chunkIndex, document.id);
    },
    [document, currentPageIndex]
  );

  // Toggle play/pause or start speech in reader
  const handleListenToggle = useCallback(async () => {
    if (!document) return;

    if (playback.state === 'speaking') {
      await speechOrchestrator.pause();
      return;
    }

    if (playback.state === 'paused') {
      await speechOrchestrator.resume();
      return;
    }

    // Start reading out loud right here in reader
    await speechOrchestrator.start(document.id, currentPageIndex, 0);
  }, [document, playback.state, currentPageIndex]);

  const handlePrevChunk = useCallback(async () => {
    await speechOrchestrator.previousChunk();
  }, []);

  const handleNextChunk = useCallback(async () => {
    await speechOrchestrator.nextChunk();
  }, []);

  const handleSpeedChange = useCallback(async (rate: number) => {
    await speechOrchestrator.setRate(rate);
  }, []);

  const handleStopSpeech = useCallback(async () => {
    await speechOrchestrator.stop();
  }, []);

  const handleOpenFullscreenListening = useCallback(() => {
    if (document) {
      router.push({
        pathname: '/listening',
        params: { documentId: document.id },
      });
    }
  }, [document, router]);

  const handleFontSizeDecrease = () => {
    setFontSize((prev) => Math.max(14, prev - 2));
  };

  const handleFontSizeIncrease = () => {
    setFontSize((prev) => Math.min(26, prev + 2));
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !document) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={[styles.backIcon, { color: theme.colors.textPrimary }]}>‹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
            {error || 'Something went wrong'}
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.errorButton, { borderColor: theme.colors.divider }]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.accent }]}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pageCount = document.pageCount ?? 0;
  const displayPageNumber = currentPageIndex + 1;
  const progress = pageCount > 0 ? displayPageNumber / pageCount : 0;
  const isDocActive = playback.documentId === document.id;
  const isCurrentPageSpeaking = isDocActive && playback.pageIndex === currentPageIndex;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: theme.colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              theme.typography.secondary,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {getDocumentDisplayName(document.title, document.fileName)}
          </Text>
        </View>

        {/* Font size adjustments for reading */}
        <View style={styles.fontControls}>
          <TouchableOpacity
            onPress={handleFontSizeDecrease}
            style={[styles.fontBtn, { borderColor: theme.colors.divider }]}
            accessibilityLabel="Decrease font size"
          >
            <Text style={[styles.fontBtnText, { color: theme.colors.textPrimary }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFontSizeIncrease}
            style={[styles.fontBtn, { borderColor: theme.colors.divider }]}
            accessibilityLabel="Increase font size"
          >
            <Text style={[styles.fontBtnText, { color: theme.colors.textPrimary }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ReadEra View Mode Switcher: [📖 Text Reflow] vs [📄 Original PDF] */}
      {pageImageUri && (
        <View style={styles.modeBar}>
          <View
            style={[
              styles.modeSegment,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
            ]}
          >
            <TouchableOpacity
              onPress={() => setViewMode('text')}
              style={[
                styles.modeTab,
                viewMode === 'text' && { backgroundColor: theme.colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: viewMode === 'text' ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: viewMode === 'text' ? '700' : '500',
                  },
                ]}
              >
                📖 Ebook Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setViewMode('pdf')}
              style={[
                styles.modeTab,
                viewMode === 'pdf' && { backgroundColor: theme.colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: viewMode === 'pdf' ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: viewMode === 'pdf' ? '700' : '500',
                  },
                ]}
              >
                📄 PDF Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {viewMode === 'text' ? (
          // EBOOK / TEXT REFLOW VIEW WITH REAL-TIME HIGHLIGHTING
          <ScrollView
            ref={scrollViewRef}
            style={styles.textScrollView}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {pageChunks.length > 0 ? (
              pageChunks.map((chunk, index) => {
                const isCurrentChunk =
                  isCurrentPageSpeaking &&
                  isSpeechActive &&
                  playback.chunkIndex === index;

                return (
                  <TouchableOpacity
                    key={chunk.id || `chunk_${index}`}
                    activeOpacity={0.8}
                    onPress={() => handleChunkPress(index)}
                    onLayout={(e) => {
                      chunkLayoutsRef.current[index] = e.nativeEvent.layout.y;
                    }}
                    style={[
                      styles.chunkCard,
                      {
                        backgroundColor: isCurrentChunk
                          ? theme.colors.accentSoft
                          : 'transparent',
                        borderColor: isCurrentChunk
                          ? theme.colors.accent
                          : 'transparent',
                      },
                    ]}
                  >
                    {isCurrentChunk && (
                      <View style={styles.chunkActiveHeader}>
                        <View
                          style={[
                            styles.speakingPill,
                            { backgroundColor: theme.colors.accent },
                          ]}
                        >
                          <Text style={styles.speakingPillText}>
                            {isPlaying ? '● NOW READING' : '❚❚ PAUSED'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            theme.typography.caption,
                            { color: theme.colors.accent, fontWeight: '600' },
                          ]}
                        >
                          Sentence {index + 1} of {pageChunks.length}
                        </Text>
                      </View>
                    )}

                    {/* Word-level highlight inside active chunk if available */}
                    {isCurrentChunk &&
                    playback.currentRange &&
                    playback.currentRange.end > playback.currentRange.start ? (
                      (() => {
                        const { start, end } = playback.currentRange!;
                        const safeStart = Math.max(0, Math.min(start, chunk.text.length));
                        const safeEnd = Math.max(safeStart, Math.min(end, chunk.text.length));
                        const before = chunk.text.slice(0, safeStart);
                        const activeWord = chunk.text.slice(safeStart, safeEnd);
                        const after = chunk.text.slice(safeEnd);

                        return (
                          <Text
                            style={[
                              styles.readingText,
                              {
                                fontSize,
                                lineHeight: Math.round(fontSize * 1.6),
                                color: theme.colors.textPrimary,
                              },
                            ]}
                          >
                            {before}
                            <Text
                              style={[
                                styles.activeWordHighlight,
                                {
                                  backgroundColor: theme.colors.accent,
                                  color: '#FFFFFF',
                                },
                              ]}
                            >
                              {activeWord}
                            </Text>
                            {after}
                          </Text>
                        );
                      })()
                    ) : (
                      <Text
                        style={[
                          styles.readingText,
                          {
                            fontSize,
                            lineHeight: Math.round(fontSize * 1.6),
                            color: isCurrentChunk
                              ? theme.colors.textPrimary
                              : theme.colors.textPrimary,
                            fontWeight: isCurrentChunk ? '600' : '400',
                          },
                        ]}
                      >
                        {chunk.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : rawPageText.length > 0 ? (
              <Text
                style={[
                  styles.readingText,
                  {
                    fontSize,
                    lineHeight: Math.round(fontSize * 1.6),
                    color: theme.colors.textPrimary,
                  },
                ]}
              >
                {rawPageText}
              </Text>
            ) : (
              <View style={styles.emptyTextState}>
                <Text
                  style={[
                    theme.typography.secondary,
                    { color: theme.colors.textSecondary, textAlign: 'center' },
                  ]}
                >
                  This page has no selectable text.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // ORIGINAL PDF PAGE VIEW
          <View
            style={[
              styles.pdfContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {isPageRendering && (
              <View style={styles.renderingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
              </View>
            )}

            {pageImageUri ? (
              <Image
                source={{ uri: pageImageUri }}
                style={styles.pdfImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdfPlaceholder}>
                <Text
                  style={[
                    theme.typography.secondary,
                    { color: theme.colors.textSecondary, textAlign: 'center' },
                  ]}
                >
                  Page {displayPageNumber}
                </Text>
              </View>
            )}

            {/* ReadEra floating banner when reading in PDF mode */}
            {isCurrentPageSpeaking && isSpeechActive && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setViewMode('text')}
                style={[
                  styles.floatingPdfAudioCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.accent,
                  },
                ]}
              >
                <View style={styles.floatingAudioHeader}>
                  <View
                    style={[
                      styles.speakingPill,
                      { backgroundColor: theme.colors.accent },
                    ]}
                  >
                    <Text style={styles.speakingPillText}>
                      {isPlaying ? '● READING' : '❚❚ PAUSED'}
                    </Text>
                  </View>
                  <Text style={[styles.floatingActionText, { color: theme.colors.accent }]}>
                    Switch to Text view ›
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textPrimary, fontWeight: '500' },
                  ]}
                  numberOfLines={2}
                >
                  &ldquo;{playback.currentText}&rdquo;
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Page Switcher Bar */}
        <View style={styles.pageSwitcher}>
          <TouchableOpacity
            onPress={handlePrevPage}
            disabled={currentPageIndex <= 0}
            accessibilityLabel="Previous page"
            style={[
              styles.pageNavButton,
              currentPageIndex <= 0 && { opacity: 0.3 },
            ]}
          >
            <Text style={[styles.pageNavText, { color: theme.colors.textPrimary }]}>
              ‹ Prev
            </Text>
          </TouchableOpacity>

          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
          >
            Page {displayPageNumber} of {pageCount || 1}
          </Text>

          <TouchableOpacity
            onPress={handleNextPage}
            disabled={pageCount > 0 && currentPageIndex + 1 >= pageCount}
            accessibilityLabel="Next page"
            style={[
              styles.pageNavButton,
              pageCount > 0 && currentPageIndex + 1 >= pageCount && { opacity: 0.3 },
            ]}
          >
            <Text style={[styles.pageNavText, { color: theme.colors.textPrimary }]}>
              Next ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom ReadEra TTS Controller */}
      <View
        style={[
          styles.bottomControls,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
          },
        ]}
      >
        <ProgressBar progress={progress} height={3} />

        {isSpeechActive && isDocActive ? (
          // INTEGRATED READERA AUDIO PLAYER
          <View style={styles.activePlayerContainer}>
            <View style={styles.playerMetaRow}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.accent, fontWeight: '700' },
                ]}
              >
                Sentence {playback.chunkIndex + 1} of {pageChunks.length || 1}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Page {displayPageNumber} of {pageCount || 1}
              </Text>
            </View>

            {/* Play/Pause/Prev/Next Controls */}
            <View style={styles.playerControlsRow}>
              <TouchableOpacity
                onPress={handlePrevChunk}
                accessibilityLabel="Previous sentence"
                accessibilityRole="button"
                style={[
                  styles.playerNavBtn,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
                ]}
              >
                <PrevTrackIcon size={16} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleListenToggle}
                accessibilityLabel={isPlaying ? 'Pause' : 'Resume'}
                accessibilityRole="button"
                style={[
                  styles.playerPlayBtn,
                  { backgroundColor: theme.colors.accent },
                ]}
              >
                {isPlaying ? (
                  <PauseIcon size={20} color="#FFFFFF" />
                ) : (
                  <PlayIcon size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextChunk}
                accessibilityLabel="Next sentence"
                accessibilityRole="button"
                style={[
                  styles.playerNavBtn,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
                ]}
              >
                <NextTrackIcon size={16} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              {/* Fullscreen listening expand */}
              <TouchableOpacity
                onPress={handleOpenFullscreenListening}
                accessibilityLabel="Open fullscreen player"
                accessibilityRole="button"
                style={[
                  styles.playerIconBtn,
                  { borderColor: theme.colors.divider, backgroundColor: theme.colors.background },
                ]}
              >
                <ExpandIcon size={15} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              {/* Stop button */}
              <TouchableOpacity
                onPress={handleStopSpeech}
                accessibilityLabel="Stop speech"
                accessibilityRole="button"
                style={[
                  styles.playerIconBtn,
                  { borderColor: theme.colors.divider, backgroundColor: theme.colors.background },
                ]}
              >
                <StopIcon size={14} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            {/* Speed presets */}
            <View style={styles.speedRow}>
              {SPEED_PRESETS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  onPress={() => handleSpeedChange(speed)}
                  accessibilityLabel={`Speed ${formatRate(speed)}`}
                  style={[
                    styles.speedPill,
                    playback.rate === speed && {
                      backgroundColor: theme.colors.accentSoft,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.speedPillText,
                      {
                        color:
                          playback.rate === speed
                            ? theme.colors.accent
                            : theme.colors.textSecondary,
                        fontWeight: playback.rate === speed ? '700' : '500',
                      },
                    ]}
                  >
                    {formatRate(speed)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 2 },
              ]}
            >
              Tap any paragraph to read from there · Background audio active
            </Text>
          </View>
        ) : (
          // IDLE / CTA PLAYER
          <View style={styles.idlePlayerContainer}>
            <ListenButton
              isPlaying={false}
              isPaused={false}
              onPress={handleListenToggle}
              size="large"
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
              ]}
            >
              Tap any paragraph to start reading, or tap Listen
            </Text>
          </View>
        )}
      </View>
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
    paddingVertical: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  fontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'center',
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 2,
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeTabText: {
    fontSize: 13,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  textScrollView: {
    flex: 1,
  },
  textScrollContent: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  chunkCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  chunkActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  speakingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  speakingPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readingText: {
    letterSpacing: 0.2,
  },
  activeWordHighlight: {
    fontWeight: '700',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  emptyTextState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfImage: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  floatingPdfAudioCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingAudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  floatingActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pageNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pageNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  activePlayerContainer: {
    gap: 8,
  },
  playerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  playerNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPlayBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  playerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  speedPillText: {
    fontSize: 12,
  },
  idlePlayerContainer: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
