---
name: android-native
description: Expo Modules API, Kotlin conventions, foreground services, Android lifecycle, TextToSpeech lifecycle, audio focus, notification behavior
---

# Android Native Skill

## Expo Modules API
- Use Expo Modules API for app-specific native modules
- Module directories: `modules/pdf-engine/`, `modules/speech-engine/`, `modules/playback-service/`
- Each module has `android/` (Kotlin) and `src/` (TypeScript interface)

## Kotlin Conventions
- Use Kotlin for all Android native code
- Follow Android Kotlin style guide
- Keep implementations behind typed TypeScript interfaces

## Foreground Services
- Required for background audio playback
- Must declare `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions
- Service starts only from explicit user action (play button)
- Use MediaStyle notification with play/pause/stop controls

## Android Lifecycle
- Handle configuration changes gracefully
- Clean up resources in service `onDestroy`
- Handle audio focus changes (incoming calls, other media apps)

## TextToSpeech Lifecycle
- Initialize asynchronously — handle `OnInitListener`
- Check language availability before speaking
- Handle `onUtteranceCompleted` callbacks
- Clean up with `shutdown()` in service destruction
- Speed range: 0.75x–2.0x (map to TTS API rate)

## Audio Focus
- Request audio focus before speaking
- Pause/duck on transient focus loss
- Resume on focus gain
- Stop on permanent focus loss

## Notification Behavior
- Persistent MediaStyle notification during playback
- Controls: play/pause, stop (minimum)
- Show document title in notification
- Remove notification when playback stops
