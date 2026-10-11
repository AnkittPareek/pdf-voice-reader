# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
