import { requireNativeModule, type EventSubscription } from 'expo-modules-core';
import { SpeechVoice, SpeechOptions } from '../../../src/domain/speech/types';

export interface NativeSpeechEngineInterface {
  initialize(): Promise<boolean>;
  getVoices(): Promise<SpeechVoice[]>;
  speak(text: string, options?: SpeechOptions): Promise<boolean>;
  stop(): Promise<boolean>;
  pause(): Promise<boolean>;
  resume(): Promise<boolean>;
  isSpeaking(): Promise<boolean>;
  addListener?(eventName: string, listener: Function): EventSubscription;
}

export type SpeechRangeEvent = {
  utteranceId: string;
  start: number;
  end: number;
};

export type SpeechErrorEvent = {
  utteranceId: string;
  error: string;
};

let nativeModule: (NativeSpeechEngineInterface & { addListener?: (event: string, fn: any) => EventSubscription }) | null = null;

try {
  nativeModule = requireNativeModule<NativeSpeechEngineInterface>('SpeechEngine');
} catch {
  nativeModule = null;
}

export function addSpeechRangeListener(
  listener: (event: SpeechRangeEvent) => void
): EventSubscription | null {
  return nativeModule?.addListener ? nativeModule.addListener('onSpeechRange', listener) : null;
}

export function addSpeechStartListener(
  listener: (event: { utteranceId: string }) => void
): EventSubscription | null {
  return nativeModule?.addListener ? nativeModule.addListener('onSpeechStart', listener) : null;
}

export function addSpeechDoneListener(
  listener: (event: { utteranceId: string }) => void
): EventSubscription | null {
  return nativeModule?.addListener ? nativeModule.addListener('onSpeechDone', listener) : null;
}

export function addSpeechErrorListener(
  listener: (event: SpeechErrorEvent) => void
): EventSubscription | null {
  return nativeModule?.addListener ? nativeModule.addListener('onSpeechError', listener) : null;
}

export default nativeModule;
