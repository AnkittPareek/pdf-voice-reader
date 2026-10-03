/**
 * PDF Voice Reader — PdfCard Component
 *
 * Displays a single PDF document in the library.
 * Shows thumbnail/icon, title, progress, and last accessed time.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/theme';
import { Document } from '../../domain/documents/types';
import { formatProgress, formatRelativeTime, getDocumentDisplayName } from '../../utils/formatters';
import { PlayIcon } from '../AudioIcons/AudioIcons';

interface PdfCardProps {
  document: Document;
  onPress: (document: Document) => void;
  variant?: 'compact' | 'featured';
}

export function PdfCard({ document, onPress, variant = 'compact' }: PdfCardProps) {
  const theme = useTheme();

  const isFeatured = variant === 'featured';
  const progressPercent = formatProgress(document.progress);
  const displayName = getDocumentDisplayName(document.title, document.fileName);
  const rawExt = (document.fileName?.split('.').pop() || 'pdf').toUpperCase();
  const badgeLabel = ['PDF', 'EPUB', 'TXT', 'MD'].includes(rawExt) ? rawExt : 'DOC';

  const accessibilityLabel = `${displayName}, ${progressPercent} complete${
    document.lastOpenedAt
      ? `, last opened ${formatRelativeTime(document.lastOpenedAt)}`
      : ''
  }`;

  if (isFeatured) {
    const pageDisplay = (document.lastPositionPage ?? 0) + 1;
    const pageTotal = Math.max(document.pageCount ?? 1, pageDisplay);

    return (
      <TouchableOpacity
        onPress={() => onPress(document)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        activeOpacity={0.8}
        style={[
          styles.featuredCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
          },
        ]}
      >
        <View style={styles.featuredTopRow}>
          {/* Stylized Book Cover */}
          <View
            style={[
              styles.featuredCover,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <View style={styles.featuredCoverSpine} />
            <Text style={styles.featuredCoverText}>{badgeLabel}</Text>
          </View>

          <View style={styles.featuredContent}>
            <Text
              style={[
                styles.featuredTitle,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={2}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.featuredSubtitle,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {document.author ? `${document.author} · ` : ''}{pageTotal} pages
            </Text>
            <View style={[styles.resumePill, { backgroundColor: theme.colors.accentSoft }]}>
              <Text style={[styles.resumePillText, { color: theme.colors.accent }]}>
                ⚡ Resumes at Page {pageDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.featuredProgressBar}>
          <View
            style={[
              styles.featuredProgressFill,
              {
                backgroundColor: theme.colors.accent,
                width: `${Math.max(document.progress * 100, 4)}%`,
              },
            ]}
          />
        </View>

        {/* Footer */}
        <View style={styles.featuredFooter}>
          <Text
            style={[styles.progressMetaText, { color: theme.colors.textSecondary }]}
          >
            Page {pageDisplay} of {pageTotal} ({progressPercent})
          </Text>

          <View style={[styles.listenNowButton, { backgroundColor: theme.colors.accent }]}>
            <PlayIcon size={13} color="#FFFFFF" />
            <Text style={styles.listenNowButtonText}>
              {document.progress >= 1 ? 'Read again' : 'Listen Now'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Compact card (recent documents row)
  return (
    <TouchableOpacity
      onPress={() => onPress(document)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.75}
      style={[
        styles.compactCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
        },
      ]}
    >
      <View
        style={[
          styles.compactCover,
          { backgroundColor: theme.colors.accentSoft, borderColor: '#C7D2FE' },
        ]}
      >
        <Text style={[styles.compactCoverText, { color: theme.colors.accent }]}>
          {badgeLabel}
        </Text>
      </View>
      <Text
        style={[
          styles.compactTitle,
          { color: theme.colors.textPrimary },
        ]}
        numberOfLines={2}
      >
        {displayName}
      </Text>
      <Text
        style={[
          styles.compactMeta,
          { color: theme.colors.textSecondary },
        ]}
      >
        {progressPercent}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Featured card (continue listening)
  featuredCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  featuredTopRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  featuredCover: {
    width: 72,
    height: 98,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredCoverSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  featuredCoverText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  resumePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resumePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featuredProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  featuredProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listenNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  listenNowButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Compact card (recent row)
  compactCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  compactCover: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  compactCoverText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 4,
  },
  compactMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
});
