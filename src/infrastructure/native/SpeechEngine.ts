/**
 * PDF Voice Reader — SpeechEngine Interface & Native Adapter
 *
 * Spec reference: Section 8.2
 * The Android implementation uses the device's TextToSpeech API.
 * All Android TextToSpeech implementation stays inside the native module.
 */

import { SpeechVoice, SpeechOptions } from '../../domain/speech/types';
import NativeSpeechEngine, {
  addSpeechRangeListener,
  addSpeechStartListener,
  addSpeechDoneListener,
  addSpeechErrorListener,
  SpeechRangeEvent,
} from '../../../modules/speech-engine';

export interface SpeechEngine {
  /** Initialize the TTS engine. */
  initialize(): Promise<void>;

  /** List available voices on the device. */
  getVoices(): Promise<SpeechVoice[]>;

  /** Speak text with the given options. Resolves true on natural completion, false if stopped/interrupted. */
  speak(text: string, options: SpeechOptions): Promise<boolean | void>;

  /** Stop speech immediately. */
  stop(): Promise<void>;

  /** Pause speech (where supported by the platform). */
  pause(): Promise<void>;

  /** Resume paused speech. Resolves true on natural completion, false if stopped/interrupted. */
  resume(): Promise<boolean | void>;

  /** Check if the engine is currently speaking. */
  isSpeaking(): Promise<boolean>;

  /** Subscribe to speech character range callbacks */
  onRange?(callback: (event: SpeechRangeEvent) => void): () => void;
}

/**
 * Mock fallback for non-native environments (Jest tests, web preview).
 */
class FallbackSpeechEngine implements SpeechEngine {
  private speaking = false;
  private paused = false;

  async initialize(): Promise<void> {
    return;
  }

  async getVoices(): Promise<SpeechVoice[]> {
    return [
      {
        id: 'system_default',
        name: 'System Default (English)',
        locale: 'en-US',
        quality: 300,
        requiresNetwork: false,
      },
    ];
  }

  async speak(_text: string, _options: SpeechOptions): Promise<boolean | void> {
    this.speaking = true;
    this.paused = false;
    // Simulates instant or fast completion in tests
    this.speaking = false;
    return true;
  }

  async stop(): Promise<void> {
    this.speaking = false;
    this.paused = false;
  }

  async pause(): Promise<void> {
    if (this.speaking) {
      this.paused = true;
      this.speaking = false;
    }
  }

  async resume(): Promise<boolean | void> {
    if (this.paused) {
      this.speaking = true;
      this.paused = false;
    }
    return true;
  }

  async isSpeaking(): Promise<boolean> {
    return this.speaking;
  }
}

class DefaultSpeechEngine implements SpeechEngine {
  private fallback = new FallbackSpeechEngine();

  async initialize(): Promise<void> {
    if (NativeSpeechEngine?.initialize) {
      await NativeSpeechEngine.initialize();
      return;
    }
    return this.fallback.initialize();
  }

  async getVoices(): Promise<SpeechVoice[]> {
    if (NativeSpeechEngine?.getVoices) {
      try {
        await this.initialize();
        return await NativeSpeechEngine.getVoices();
      } catch {
        return this.fallback.getVoices();
      }
    }
    return this.fallback.getVoices();
  }

  async speak(text: string, options: SpeechOptions): Promise<boolean | void> {
    if (NativeSpeechEngine?.speak) {
      return await NativeSpeechEngine.speak(text, options);
    }
    return this.fallback.speak(text, options);
  }

  async stop(): Promise<void> {
    if (NativeSpeechEngine?.stop) {
      await NativeSpeechEngine.stop();
      return;
    }
    return this.fallback.stop();
  }

  async pause(): Promise<void> {
    if (NativeSpeechEngine?.pause) {
      await NativeSpeechEngine.pause();
      return;
    }
    return this.fallback.pause();
  }

  async resume(): Promise<boolean | void> {
    if (NativeSpeechEngine?.resume) {
      return await NativeSpeechEngine.resume();
    }
    return this.fallback.resume();
  }

  async isSpeaking(): Promise<boolean> {
    if (NativeSpeechEngine?.isSpeaking) {
      return NativeSpeechEngine.isSpeaking();
    }
    return this.fallback.isSpeaking();
  }

  onRange(callback: (event: SpeechRangeEvent) => void): () => void {
    const sub = addSpeechRangeListener(callback);
    return () => {
      sub?.remove();
    };
  }
}

export const defaultSpeechEngine: SpeechEngine = new DefaultSpeechEngine();
export {
  addSpeechRangeListener,
  addSpeechStartListener,
  addSpeechDoneListener,
  addSpeechErrorListener,
};
