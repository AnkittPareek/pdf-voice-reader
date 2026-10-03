import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

export interface NativePlaybackServiceInterface {
  startService(title: string, subtitle: string, isPlaying: boolean): Promise<boolean>;
  updateNotification(title: string, subtitle: string, isPlaying: boolean): Promise<boolean>;
  stopService(): Promise<boolean>;
  addListener?(eventName: string, listener: Function): EventSubscription;
}

export type PlaybackActionEvent = {
  action: 'play' | 'pause' | 'stop' | 'next' | 'prev';
};

let nativeModule: (NativePlaybackServiceInterface & { addListener?: (event: string, fn: any) => EventSubscription }) | null = null;

try {
  nativeModule = requireNativeModule<NativePlaybackServiceInterface>('PlaybackService');
} catch {
  nativeModule = null;
}

export function addPlaybackActionListener(
  listener: (event: PlaybackActionEvent) => void
): EventSubscription | null {
  return nativeModule?.addListener ? nativeModule.addListener('onPlaybackAction', listener) : null;
}

export default nativeModule;
