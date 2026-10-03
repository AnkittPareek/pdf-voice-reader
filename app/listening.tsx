/**
 * PDF Voice Reader — Listening Screen
 *
 * Spec reference: Section 6.4 (Listening mode), Section 6.5 (Controls)
 *
 * Primary controls: play/pause, previous/next chunk, skip 15s, speed, voice, stop
 * "Do not bury Play/Pause inside settings."
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/theme';
import { usePlaybackStore } from '../src/state/playbackStore';
import { useLibraryStore } from '../src/state/libraryStore';
import { ProgressBar } from '../src/components/ProgressBar/ProgressBar';
import { formatRate, getDocumentDisplayName } from '../src/utils/formatters';
import { SPEED_PRESETS } from '../src/domain/speech/types';
import { speechOrchestrator } from '../src/application/SpeechOrchestrator';
import { PlayIcon, PauseIcon, PrevTrackIcon, NextTrackIcon } from '../src/components/AudioIcons/AudioIcons';

export default function ListeningScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string }>();
  const documentId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;

  const playback = usePlaybackStore();
  const documents = useLibraryStore((s) => s.documents);
  const document = documents.find((d) => d.id === (documentId || playback.documentId));

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePlayPause = useCallback(async () => {
    if (playback.state === 'speaking') {
      await speechOrchestrator.pause();
    } else if (playback.state === 'paused') {
      await speechOrchestrator.resume();
    } else if (playback.state === 'stopped' || playback.state === 'idle') {
      if (document) {
        await speechOrchestrator.start(document.id, playback.pageIndex, playback.chunkIndex);
      }
    }
  }, [playback.state, playback.pageIndex, playback.chunkIndex, document]);

  const handleStop = useCallback(async () => {
    await speechOrchestrator.stop();
    router.back();
  }, [router]);

  const handlePrev = useCallback(async () => {
    await speechOrchestrator.previousChunk();
  }, []);

  const handleNext = useCallback(async () => {
    await speechOrchestrator.nextChunk();
  }, []);

  const handleSpeedChange = useCallback(
    async (rate: number) => {
      await speechOrchestrator.setRate(rate);
    },
    []
  );

  const displayTitle = getDocumentDisplayName(document?.title, document?.fileName);
  const currentPage = playback.pageIndex + 1;
  const pageCount = Math.max(document?.pageCount ?? 0, currentPage, 1);
  const isPlaying = playback.state === 'speaking';
  const isPaused = playback.state === 'paused';
  const isLoading = playback.state === 'loading' || playback.state === 'initializing';
  const isError = playback.state === 'error';
  const isCompleted = playback.state === 'completed';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
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
            theme.typography.secondary,
            { color: theme.colors.textSecondary, flex: 1, textAlign: 'center' },
          ]}
        >
          Now listening
        </Text>
        <TouchableOpacity
          onPress={handleStop}
          accessibilityLabel="Stop playback"
          style={styles.stopButton}
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.error, fontWeight: '600' },
            ]}
          >
            Stop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Document info */}
        <View style={styles.documentInfo}>
          <View
            style={[
              styles.documentIcon,
              { backgroundColor: theme.colors.accentSoft },
            ]}
          >
            <Text style={[styles.documentIconText, { color: theme.colors.accent }]}>
              PDF
            </Text>
          </View>
          <Text
            style={[
              theme.typography.title,
              {
                color: theme.colors.textPrimary,
                textAlign: 'center',
                marginTop: 16,
              },
            ]}
            numberOfLines={3}
          >
            {displayTitle}
          </Text>
          <Text
            style={[
              theme.typography.secondary,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 8,
              },
            ]}
          >
            Page {currentPage} of {pageCount}
          </Text>
        </View>

        {/* Error banner if state is error */}
        {isError && (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
            ]}
          >
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.error, textAlign: 'center', fontWeight: '600' },
              ]}
            >
              {playback.error || 'Playback error occurred.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.errorCardButton, { backgroundColor: theme.colors.accentSoft }]}
            >
              <Text style={[theme.typography.caption, { color: theme.colors.accent, fontWeight: '700' }]}>
                Return to Reader
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <View
            style={[
              styles.completedCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
            ]}
          >
            <Text
              style={[
                theme.typography.title,
                { color: theme.colors.accent, textAlign: 'center' },
              ]}
            >
              Document Complete
            </Text>
            <Text
              style={[
                theme.typography.secondary,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
              ]}
            >
              You reached the end of this document.
            </Text>
          </View>
        )}

        {/* Current text preview (Spec Section 6.4) */}
        {!isError && !isCompleted && (
          <View
            style={[
              styles.textPreview,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 8 },
                  ]}
                >
                  Loading speech chunk...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textPrimary,
                    textAlign: 'left',
                    lineHeight: 24,
                  },
                ]}
              >
                {playback.currentText
                  ? `"${playback.currentText}"`
                  : playback.state === 'idle'
                  ? 'Press play to start listening'
                  : 'Listening...'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Playback controls */}
      <View
        style={[
          styles.controls,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
          },
        ]}
      >
        {/* Progress */}
        <ProgressBar progress={playback.progress} height={4} />

        {/* Progress percent */}
        <View style={styles.progressRow}>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
          >
            Page {currentPage} of {pageCount}
          </Text>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
          >
            {Math.round(playback.progress * 100)}%
          </Text>
        </View>

        {/* Main controls (play/pause/prev/next) */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            onPress={handlePrev}
            accessibilityLabel="Previous paragraph"
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[
              styles.navButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
            ]}
          >
            <PrevTrackIcon size={20} color={theme.colors.textPrimary} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, fontWeight: '600' },
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            accessibilityLabel={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
            accessibilityRole="button"
            activeOpacity={0.85}
            style={[
              styles.playButton,
              {
                backgroundColor: theme.colors.accent,
                shadowColor: theme.colors.accent,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : isPlaying ? (
              <PauseIcon size={28} color="#FFFFFF" />
            ) : (
              <PlayIcon size={28} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            accessibilityLabel="Next paragraph"
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[
              styles.navButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
            ]}
          >
            <NextTrackIcon size={20} color={theme.colors.textPrimary} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, fontWeight: '600' },
              ]}
            >
              Next
            </Text>
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
                styles.speedButton,
                playback.rate === speed && {
                  backgroundColor: theme.colors.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
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

        {/* Status text */}
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
          ]}
        >
          {isPlaying
            ? 'Background playback active · Lock screen to continue'
            : isPaused
            ? 'Playback paused'
            : isCompleted
            ? 'Playback completed'
            : 'Offline playback ready'}
        </Text>
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
  stopButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  documentInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
  },
  documentIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentIconText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textPreview: {
    width: '100%',
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  errorCardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedCard: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  navButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
