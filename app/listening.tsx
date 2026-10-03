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
            styles.headerTitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          NOW LISTENING
        </Text>
        <TouchableOpacity
          onPress={handleStop}
          accessibilityLabel="Stop playback"
          style={styles.stopButton}
        >
          <Text style={styles.stopButtonText}>
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
        {/* Document info with folded corner badge */}
        <View style={styles.documentInfo}>
          <View
            style={[
              styles.documentIcon,
              {
                backgroundColor: theme.colors.accentSoft,
                borderColor: '#C7D2FE',
              },
            ]}
          >
            <View style={styles.documentFold} />
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
                marginTop: 14,
                fontWeight: '800',
                fontSize: 22,
                lineHeight: 28,
              },
            ]}
            numberOfLines={2}
          >
            {displayTitle}
          </Text>
          <Text
            style={[
              theme.typography.secondary,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 6,
                fontWeight: '500',
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

        {/* Current text preview card with Spoken Sentence pill */}
        {!isError && !isCompleted && (
          <View
            style={[
              styles.textCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.divider,
              },
            ]}
          >
            <View style={[styles.cardLabelPill, { backgroundColor: theme.colors.accentSoft }]}>
              <View style={[styles.pulseDot, { backgroundColor: theme.colors.accent }]} />
              <Text style={[styles.cardLabelText, { color: theme.colors.accent }]}>
                Spoken Sentence
              </Text>
            </View>

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
                  styles.spokenQuoteText,
                  { color: theme.colors.textPrimary },
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

      {/* Playback controls panel */}
      <View
        style={[
          styles.controlsPanel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
          },
        ]}
      >
        {/* Progress bar */}
        <ProgressBar progress={playback.progress} height={6} />

        {/* Progress meta */}
        <View style={styles.progressRow}>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary, fontWeight: '600' }]}
          >
            Page {currentPage} of {pageCount}
          </Text>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary, fontWeight: '600' }]}
          >
            {Math.round(playback.progress * 100)}% Completed
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
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          >
            <PrevTrackIcon size={20} color={theme.colors.textPrimary} />
            <Text style={[styles.navButtonLabel, { color: theme.colors.textSecondary }]}>
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
              <PauseIcon size={32} color="#FFFFFF" />
            ) : (
              <PlayIcon size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            accessibilityLabel="Next paragraph"
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[
              styles.navButton,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          >
            <NextTrackIcon size={20} color={theme.colors.textPrimary} />
            <Text style={[styles.navButtonLabel, { color: theme.colors.textSecondary }]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Speed presets */}
        <View style={styles.speedRow}>
          {SPEED_PRESETS.map((speed) => {
            const isSelected = playback.rate === speed;
            return (
              <TouchableOpacity
                key={speed}
                onPress={() => handleSpeedChange(speed)}
                accessibilityLabel={`Speed ${formatRate(speed)}`}
                style={[
                  styles.speedPill,
                  {
                    backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.background,
                    borderColor: isSelected ? theme.colors.accent : theme.colors.divider,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.speedPillText,
                    {
                      color: isSelected ? theme.colors.accent : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {formatRate(speed)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Background active badge */}
        <View style={styles.bgBadge}>
          <View style={styles.pulseDotGreen} />
          <Text style={styles.bgBadgeText}>
            {isPlaying
              ? 'Background Service Active · Lock-screen Controls Ready'
              : isPaused
              ? 'Playback Paused · Ready to Resume'
              : 'Offline Speech Engine Ready'}
          </Text>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
    lineHeight: 34,
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stopButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  documentInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    width: '100%',
  },
  documentIcon: {
    width: 80,
    height: 98,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  documentFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    backgroundColor: '#C7D2FE',
    borderBottomLeftRadius: 8,
  },
  documentIconText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textCard: {
    width: '100%',
    minHeight: 140,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 14,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardLabelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  spokenQuoteText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'normal',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  errorCardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  completedCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 16,
  },
  controlsPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 4,
  },
  playButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  navButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  navButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  speedPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillText: {
    fontSize: 12,
  },
  bgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  pulseDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  bgBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
});
