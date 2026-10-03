# ADR-002: TTS Architecture

## Status
Proposed

## Context
PDF Voice Reader's core feature is reading PDFs aloud. We need a text-to-speech architecture that:
- Works offline
- Supports background playback
- Uses device-native voices
- Allows speed control (0.75x–2.0x)
- Is privacy-preserving (no cloud uploads)

## Decision
Use Android's native `TextToSpeech` API wrapped in a custom Expo module behind the `SpeechEngine` interface.

The interface is defined in `src/infrastructure/native/SpeechEngine.ts`.

## Rationale
- Native TTS is free, offline, and private
- No API keys or cloud dependencies
- Available on all Android devices
- Supports multiple languages and voices
- Speed control is built-in
- Cloud TTS (Google Cloud, AWS Polly) is a future premium feature, not V1

## Consequences
- Voice quality depends on the user's installed TTS engine
- Some devices may have limited voice options
- Cloud TTS can be added later behind the same interface
- Pause/resume support varies by Android version
