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
    return (
      <TouchableOpacity
        onPress={() => onPress(document)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        activeOpacity={0.7}
        style={[
          styles.featuredCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
          },
        ]}
      >
        <View
          style={[
            styles.featuredIcon,
            { backgroundColor: theme.colors.accentSoft },
          ]}
        >
          <Text
            style={[
              styles.featuredIconText,
              { color: theme.colors.accent },
            ]}
          >
            {badgeLabel}
          </Text>
        </View>
        <View style={styles.featuredContent}>
          <Text
            style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <Text
            style={[
              theme.typography.secondary,
              { color: theme.colors.textSecondary, marginTop: 4 },
            ]}
          >
            {progressPercent}
          </Text>
          <View style={styles.featuredProgressBar}>
            <View
              style={[
                styles.featuredProgressFill,
                {
                  backgroundColor: theme.colors.accent,
                  width: `${document.progress * 100}%`,
                },
              ]}
            />
          </View>
          <View style={[styles.continueButton, { backgroundColor: theme.colors.accent }]}>
            <View style={styles.continueButtonInner}>
              <PlayIcon size={12} color="#FFFFFF" />
              <Text style={[theme.typography.secondary, { color: '#FFFFFF', fontWeight: '600' }]}>
                {document.progress >= 1 ? 'Listen again' : document.progress > 0 ? 'Continue' : 'Start'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(document)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.7}
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
          styles.compactIcon,
          { backgroundColor: theme.colors.accentSoft },
        ]}
      >
        <Text
          style={[
            styles.compactIconText,
            { color: theme.colors.accent },
          ]}
        >
          {badgeLabel}
        </Text>
      </View>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textPrimary, marginTop: 8 },
        ]}
        numberOfLines={2}
      >
        {getDocumentDisplayName(document.title, document.fileName)}
      </Text>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginTop: 2 },
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
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  featuredIcon: {
    width: 72,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featuredProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
    marginTop: 8,
    overflow: 'hidden',
  },
  featuredProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  continueButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Compact card (recent grid)
  compactCard: {
    width: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  compactIcon: {
    width: 64,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
