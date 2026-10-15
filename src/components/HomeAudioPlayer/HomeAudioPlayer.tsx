/**
 * PDF Voice Reader — Home Screen Audio Player Controls
 *
 * Persistent mini-player anchored above the bottom banner on the Home Library screen.
 * - Clearly indicates which PDF document is currently playing/tagged.
 * - Supports play/pause, prev/next, and stop controls.
 * - When no PDF is active, controls are gracefully disabled with an intuitive prompt:
 *   - "Tap any PDF to start reading" (if library has PDFs)
 *   - "Add a PDF to start reading" (if library is empty)
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/theme';
import { usePlaybackStore } from '../../state/playbackStore';
import { Document } from '../../domain/documents/types';
import { speechOrchestrator } from '../../application/SpeechOrchestrator';
import { adService } from '../../application/AdService';
import { getDocumentDisplayName } from '../../utils/formatters';
import { PlayIcon, PauseIcon, PrevTrackIcon, NextTrackIcon, StopIcon } from '../AudioIcons/AudioIcons';

interface HomeAudioPlayerProps {
  documents: Document[];
}

export function HomeAudioPlayer({ documents }: HomeAudioPlayerProps) {
  const theme = useTheme();
  const router = useRouter();
  const playback = usePlaybackStore();

  const isSpeaking = playback.state === 'speaking';
  const isPaused = playback.state === 'paused';
  const isActive = isSpeaking || isPaused;

  // Determine which document the player is tagged to
  const activeDoc =
    documents.find((d) => d.id === playback.documentId) ||
    (documents.length > 0
      ? documents.reduce((latest, doc) =>
          (doc.lastOpenedAt ?? 0) > (latest.lastOpenedAt ?? 0) ? doc : latest
        )
      : undefined);

  const hasDoc = !!activeDoc;
  const docDisplayName = activeDoc ? getDocumentDisplayName(activeDoc.title, activeDoc.fileName) : '';
  const pageDisplay = (activeDoc?.lastPositionPage ?? 0) + 1;
  const pageTotal = activeDoc?.pageCount || 1;

  const handleCardPress = useCallback(() => {
    if (activeDoc) {
      router.push({ pathname: '/reader', params: { documentId: activeDoc.id } });
    }
  }, [activeDoc, router]);

  const handlePlayPause = useCallback(async () => {
    if (!activeDoc) return;

    if (playback.state === 'speaking') {
      await speechOrchestrator.pause();
      await adService.showInterstitial();
      return;
    }

    if (playback.state === 'paused') {
      await adService.showInterstitialOrContinue(async () => {
        await speechOrchestrator.resume();
      });
      return;
    }

    // Start playback from saved position
    await adService.showInterstitialOrContinue(async () => {
      await speechOrchestrator.start(
        activeDoc.id,
        activeDoc.lastPositionPage ?? 0,
        activeDoc.lastPositionChunk ?? 0
      );
    });
  }, [activeDoc, playback.state]);

  const handlePrev = useCallback(async () => {
    if (isActive) {
      await speechOrchestrator.previousChunk();
    }
  }, [isActive]);

  const handleNext = useCallback(async () => {
    if (isActive) {
      await speechOrchestrator.nextChunk();
    }
  }, [isActive]);

  const handleStop = useCallback(async () => {
    if (isActive) {
      await speechOrchestrator.stop();
      await adService.showInterstitial();
    }
  }, [isActive]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
        },
      ]}
      accessibilityLabel="Audio player controls"
    >
      {/* Top Tag Row: Document Name & Status */}
      <TouchableOpacity
        onPress={handleCardPress}
        disabled={!hasDoc}
        activeOpacity={0.7}
        style={styles.infoRow}
        accessibilityRole="button"
        accessibilityLabel={
          hasDoc
            ? `${docDisplayName}, ${isActive ? (isSpeaking ? 'Playing' : 'Paused') : 'Ready to read'}`
            : 'No active PDF'
        }
      >
        <View
          style={[
            styles.bookIconBadge,
            { backgroundColor: hasDoc ? theme.colors.accentSoft : theme.colors.divider },
          ]}
        >
          <Text style={styles.bookIconText}>{hasDoc ? '📖' : '📄'}</Text>
        </View>

        <View style={styles.titleColumn}>
          {hasDoc ? (
            <>
              <Text
                style={[styles.docTitle, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {docDisplayName}
              </Text>
              <Text
                style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {isSpeaking
                  ? `● Playing · Page ${playback.pageIndex + 1}`
                  : isPaused
                  ? `❚❚ Paused · Page ${playback.pageIndex + 1}`
                  : `Ready · Page ${pageDisplay} of ${pageTotal}`}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[styles.noDocTitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {documents.length > 0
                  ? 'Tap any PDF to start reading'
                  : 'Add a PDF to start reading'}
              </Text>
              <Text style={[styles.noDocSubtitle, { color: theme.colors.textSecondary }]}>
                Offline TTS Audio Engine
              </Text>
            </>
          )}
        </View>

        {hasDoc && (
          <View style={[styles.openPill, { backgroundColor: theme.colors.accentSoft }]}>
            <Text style={[styles.openPillText, { color: theme.colors.accent }]}>Open ›</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Control Buttons Row */}
      <View style={styles.controlsRow}>
        {/* Previous Track */}
        <TouchableOpacity
          onPress={handlePrev}
          disabled={!isActive}
          accessibilityLabel="Previous paragraph"
          accessibilityRole="button"
          style={[styles.secondaryButton, !isActive && styles.disabledButton]}
        >
          <PrevTrackIcon size={16} color={isActive ? theme.colors.textPrimary : theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Play / Pause Primary Button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={!hasDoc}
          accessibilityLabel={isSpeaking ? 'Pause reading' : 'Play reading'}
          accessibilityRole="button"
          activeOpacity={0.8}
          style={[
            styles.playButton,
            { backgroundColor: hasDoc ? theme.colors.accent : theme.colors.divider },
            !hasDoc && styles.disabledButton,
          ]}
        >
          {isSpeaking ? (
            <PauseIcon size={20} color="#FFFFFF" />
          ) : (
            <PlayIcon size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Next Track */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isActive}
          accessibilityLabel="Next paragraph"
          accessibilityRole="button"
          style={[styles.secondaryButton, !isActive && styles.disabledButton]}
        >
          <NextTrackIcon size={16} color={isActive ? theme.colors.textPrimary : theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity
          onPress={handleStop}
          disabled={!isActive}
          accessibilityLabel="Stop reading"
          accessibilityRole="button"
          style={[styles.secondaryButton, !isActive && styles.disabledButton]}
        >
          <StopIcon size={16} color={isActive ? theme.colors.error || '#EF4444' : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bookIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookIconText: {
    fontSize: 18,
  },
  titleColumn: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  noDocTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  noDocSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  openPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  secondaryButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.35,
  },
});

