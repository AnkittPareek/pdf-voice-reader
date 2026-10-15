# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-10-15

### Fixed
- **Audio Focus Auto-Resume Bug**: Resolved native issue in `PlaybackForegroundService` where external audio apps playing and pausing would automatically resume PDF Voice Reader. Playback now strictly requires user interaction (pressing the play button).
- **Paragraph & Word Resume on Tap**: Fixed paragraph tapping to resume playback, and implemented tokenized word-level touch targets allowing the user to tap *any individual word* to start reading aloud directly from that exact word via `SpeechOrchestrator.jumpToPosition`.
- **Back Press Navigation & Ads**: Fixed back press navigation in `Reader` and `Listening` screens across both UI back buttons and Android hardware/gesture back events (`BackHandler`).
- **Strict Document File Validation**: Restricted file picker to only valid readable document formats (`.pdf`, `.epub`, `.txt`, `.text`, `.md`) and added user-friendly alert rejection for unsupported formats, preventing arbitrary files from being opened.
- **Settings Privacy Disclosure**: Removed inaccurate "Advertising & Trackers: None" row from Settings screen.

### Added
- **Background Playback Back Exit Modal**: When pressing back while audio is active (speaking or paused), displays a modal asking if the user wants to "Hear in Background" or "Stop Playing". Continuing in background keeps audio playing and exits without an ad; choosing stop terminates audio and presents an interstitial ad before exit.
- **Remove Documents from Library**: Added trash icon and long-press support to both featured and standard document cards in the Library, with native confirmation dialog, database cleanup, and automatic audio termination if the deleted document was actively playing.
- **Full PDF View with Top Scrollable Page Selector**:
  - Automatically navigates to the currently spoken page when opening PDF mode.
  - Added horizontal scrollable bar with page chips (`P. 1`, `P. 2`, etc.) indicating the active page and showing a `🎧` reading badge on the page being read aloud.
  - Tapping any page chip immediately jumps to that page in the PDF viewer.
- **Supported Document Formats Indicators**:
  - Added dedicated supported formats badge indicators (`📄 PDF`, `📖 EPUB`, `📝 TXT`, `📋 MD`) to the Home/Library screen in both empty and populated states.
  - Added a comprehensive "SUPPORTED FILE TYPES" section to the Settings screen with breakdown of supported extensions and capabilities.
  - Updated the Welcome / Onboarding walkthrough step 1 to clearly guide new users on all supported document formats.
- **Light Mode Default & Dark Mode Toggle**:
  - Configured Light mode as the app's default visual appearance.
  - Added an interactive Dark Mode toggle switch and segmented mode selector (`☀️ Light Mode (Default)` vs `🌙 Dark Mode`) to the Appearance section in Settings.
  - Persisted user theme preference via `@react-native-async-storage/async-storage` for seamless instant application on app restarts.
- **Home Screen Audio Player Controls**: Added persistent mini-player controls to the Library tagged to the active document with Prev, Play/Pause, Next, and Stop controls, plus page status. Disables gracefully with contextual guidance ("Tap any PDF to start reading" or "Add a PDF to start reading") when idle or empty.
- **Interactive TTS Voice Previews**:
  - Added dedicated live audio preview buttons (`▶ Preview` / `❚❚ Stop`) to both Settings TTS voice modal and First-Time Onboarding wizard.
  - Allows users to hear sample narration of any device voice before confirming their selection.
  - Previewing audio avoids triggering ads, while confirming a new voice selection cleanly displays an interstitial ad.
- **Engaging Multi-Step Onboarding Walkthrough (`app/welcome.tsx`)**:
  - Completely revamped first-time setup into an interactive 4-step wizard with visual step indicators:
    - *Step 1 (Appearance)*: Interactive Light Mode (Default) vs Dark Mode cards that instantly adapt the app theme in real-time.
    - *Step 2 (TTS Voice Selection)*: Live audio preview buttons for all available native voices with immediate feedback.
    - *Step 3 (Default Reading Speed)*: Preset speed chips (0.75x – 2.0x) paired with an interactive "🔊 Test Speed Sample" audio button.
    - *Step 4 (Supported Documents & Offline Privacy)*: Showcase of supported document formats (PDF, EPUB, TXT, MD) and 100% on-device offline guarantees.
- **Settings Appearance UI Cleanup**: Streamlined the Appearance card in Settings by removing redundant segmented pill buttons, retaining a clean and intuitive Dark Mode toggle switch.

## [1.0.2] - 2026-10-11

### Changed
- **Rewarded Ad Duration**: Updated ad-free unlock from 24 hours to 1 hour per rewarded video, allowing users to earn additive ad-free time without excessive unlock spans.
- **Monetization UI**: Refreshed Rewarded Ad Modal and Library banner badges with updated 1-hour copy and accessibility tags.
- **Test Isolation**: Added `resetForTesting()` in `AdService` and verified additive reward stacking in unit tests.

### Added
- **About & Version Display**: Added dedicated About section in Settings screen displaying version and native speech engine status.
- **Future Product Roadmap**: Documented comprehensive multi-phase roadmap (`docs/FUTURE_PLANS.md`) covering Sleep Timer, 15s quick-skip, karaoke follow-along, bookmarks, and on-device OCR.

## [1.0.1] - 2026-10-09

### Added
- Google Mobile Ads (AdMob) integration with bottom library banner, natural-break interstitials, and rewarded ads.
- Offline privacy protections ensuring speech audio is never interrupted by interstitial displays.

## [1.0.0] - 2026-10-01

### Added
- Initial release of PDF Voice Reader for Android.
- Offline-first PDF text extraction and sentence chunking.
- Native Android TTS engine integration with background playback and lock-screen notification controls.
- SQLite document library metadata and reading position persistence.
