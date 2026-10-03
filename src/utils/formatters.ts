/**
 * PDF Voice Reader — Formatters
 *
 * Utility functions for formatting display values.
 */

/**
 * Format progress as percentage string.
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format duration in seconds to mm:ss or h:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format a timestamp as relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Truncate a filename for display.
 */
export function truncateFileName(name: string, maxLength = 32): string {
  if (name.length <= maxLength) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const baseName = name.slice(0, name.length - ext.length);
  const truncated = baseName.slice(0, maxLength - ext.length - 3);
  return `${truncated}...${ext}`;
}

/**
 * Generate a simple unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Format speech rate for display.
 */
export function formatRate(rate: number): string {
  return `${rate}x`;
}

/**
 * Estimate reading time in minutes based on character count.
 * Assumes ~150 words per minute, ~5 chars per word on average.
 */
export function estimateReadingTime(charCount: number): number {
  const words = charCount / 5;
  return Math.ceil(words / 150);
}

/**
 * Clean and resolve document display title.
 * Filters out generic placeholders like (anonymous), untitled, etc.
 * Formats filenames with readable spacing.
 */
export function getDocumentDisplayName(title?: string, fileName?: string): string {
  const genericTitles = ['(anonymous)', 'anonymous', 'untitled', 'untitled document', 'unknown', ''];
  if (title && !genericTitles.includes(title.trim().toLowerCase())) {
    return title.trim();
  }
  if (fileName) {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    return withoutExt.replace(/[_-]+/g, ' ').trim();
  }
  return 'Document';
}
