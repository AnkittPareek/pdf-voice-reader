/**
 * PDF Voice Reader — PlaybackService Interface & Native Adapter
 *
 * Spec reference: Section 8.3
 * Controls the Android Foreground Service, MediaStyle notification, and audio focus.
 */

import NativePlaybackService, {
  addPlaybackActionListener,
  PlaybackActionEvent,
} from '../../../modules/playback-service';

export interface PlaybackService {
  start(title: string, subtitle: string, isPlaying: boolean): Promise<void>;
  update(title: string, subtitle: string, isPlaying: boolean): Promise<void>;
  stop(): Promise<void>;
  onAction(callback: (action: 'play' | 'pause' | 'stop' | 'next' | 'prev') => void): () => void;
}

class FallbackPlaybackService implements PlaybackService {
  async start(_title: string, _subtitle: string, _isPlaying: boolean): Promise<void> {}
  async update(_title: string, _subtitle: string, _isPlaying: boolean): Promise<void> {}
  async stop(): Promise<void> {}
  onAction(_callback: (action: 'play' | 'pause' | 'stop' | 'next' | 'prev') => void): () => void {
    return () => {};
  }
}

class DefaultPlaybackService implements PlaybackService {
  private fallback = new FallbackPlaybackService();

  async start(title: string, subtitle: string, isPlaying: boolean): Promise<void> {
    if (NativePlaybackService?.startService) {
      await NativePlaybackService.startService(title, subtitle, isPlaying);
      return;
    }
    return this.fallback.start(title, subtitle, isPlaying);
  }

  async update(title: string, subtitle: string, isPlaying: boolean): Promise<void> {
    if (NativePlaybackService?.updateNotification) {
      await NativePlaybackService.updateNotification(title, subtitle, isPlaying);
      return;
    }
    return this.fallback.update(title, subtitle, isPlaying);
  }

  async stop(): Promise<void> {
    if (NativePlaybackService?.stopService) {
      await NativePlaybackService.stopService();
      return;
    }
    return this.fallback.stop();
  }

  onAction(callback: (action: 'play' | 'pause' | 'stop' | 'next' | 'prev') => void): () => void {
    const sub = addPlaybackActionListener((event: PlaybackActionEvent) => {
      callback(event.action);
    });
    return () => {
      sub?.remove();
    };
  }
}

export const defaultPlaybackService: PlaybackService = new DefaultPlaybackService();
