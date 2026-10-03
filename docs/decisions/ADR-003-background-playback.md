# ADR-003: Background Playback

## Status
Proposed

## Context
Users must be able to lock their phone screen and continue hearing the PDF. This is the core product promise — "listen to PDFs while doing other things."

Android requires foreground services for long-running background operations, especially audio playback.

## Decision
Implement background playback using an Android foreground service with a `mediaPlayback` service type and MediaStyle notification controls.

## Architecture
1. The service is started only when the user explicitly initiates playback
2. A persistent notification shows playback controls (play/pause/stop)
3. The service owns the speech session independently of the React Native UI
4. When the app is foregrounded, the service communicates state back to the UI
5. Audio focus is managed to handle interruptions (calls, other media)

## Rationale
- Android quality guidelines require foreground services for background audio
- Modern Android (12+) restricts background service starts — must be user-initiated
- MediaStyle notifications provide standard playback controls
- Independence from the Reader screen ensures reliability

## Consequences
- Requires `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions
- Must handle audio focus changes (incoming calls, other apps)
- Media3/ExoPlayer is not required for dynamic TTS — only if we cache speech audio
- Service lifecycle must be carefully managed to avoid battery drain
