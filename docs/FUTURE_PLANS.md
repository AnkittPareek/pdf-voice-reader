# PDF Voice Reader — Future Product & Feature Roadmap

**Version Target:** V1.1 → V2.0  
**Updated:** 2026-10-11  
**Core Principles:** 100% On-Device · Zero Cloud Dependency · Audio-First Ergonomics · High-Retention Monetization  

---

## 1. Executive Summary

PDF Voice Reader is designed to convert PDFs into an effortless, offline audiobook experience. To transition from a utility app to an indispensable daily habit, future releases focus on:
1. **Frictionless Playback Ergonomics** (Sleep timer, quick 15s skip, instant tap-to-listen).
2. **Engagement & Daily Habit Formation** (Streaks, listening statistics, bookmarks).
3. **Advanced Offline Audio Processing** (On-device OCR, pitch tuning, pronunciation correction).

All enhancements strictly adhere to the non-negotiables: **zero cloud uploads**, **complete local privacy**, and **zero ads during active playback**.

---

## 2. Release Roadmap

### Phase 1: V1.1 — Ergonomics & Bedtime Listening (Near-Term)

| Feature | User Value | Architectural Strategy |
| :--- | :--- | :--- |
| **Sleep Timer (Bedtime Mode)** | Enables falling asleep to audiobooks/reading without draining battery or losing place overnight. | Timer countdown (`15m`, `30m`, `45m`, `60m`, `End of Page`) with a smooth 10-second audio fade-out in `SpeechOrchestrator`. Automatically stores stopping position in SQLite. |
| **Quick Skip (↺ 15s / ↻ 15s)** | Allows commuters and walkers to rewind missed sentences immediately without precision scrubbing. | Accessible from `ListeningScreen`, Mini-Player bar, and Android `MediaStyle` notification actions. Jumps backward/forward by chunk boundary or estimated word count. |
| **"Listen from Here" Instant Tap** | Eliminates manual scrolling/seeking when opening long documents. | Single tap on any paragraph or heading in text mode or page mode immediately routes chunk index to `speechOrchestrator.jumpToChunk()`. |
| **Synchronized Karaoke Auto-Scroll** | Enhances visual comprehension while listening. | Smooth auto-scrolling container tracking the active sentence with subtle contrast highlight (`accentSoft`). Keeps current sentence vertically centered. |
| **Pitch & Timbre Modulation** | Softens robotic system TTS voices into more natural tones. | Android `TextToSpeech.setPitch(float)` wrapper (range: `0.8x – 1.2x`), persisted in `playbackStore` and SQLite settings. |

---

### Phase 2: V1.2 — Daily Habit & Organization (Mid-Term)

| Feature | User Value | Architectural Strategy |
| :--- | :--- | :--- |
| **Daily Streaks & Listening Stats** | Duolingo/Audible-style gamification that dramatically boosts Day-7 and Day-30 retention. | Local SQLite table tracking daily seconds listened, documents completed, and current consecutive-day streak. Displayed on Library header. |
| **Bookmarks & Clip Quotes Drawer** | Quick retrieval of critical information, lecture notes, or favorite passages. | User highlights sentence → saves to local SQLite `bookmarks` table with page index, excerpt snippet, and timestamp. Drawer view allows one-tap jump to saved quote. |
| **Library Search & Sorting** | Fast navigation as users build large PDF collections (10+ docs). | Instant fuzzy search filter in `LibraryScreen` by document title and file name. Sort options: *Recently Listened*, *Title (A-Z)*, and *Progress (%)*. |
| **Pronunciation Override Dictionary** | Fixes awkward speech engine mispronunciations of technical acronyms and foreign names. | SQLite table mapping target tokens to phonetic equivalents (e.g., `SQL` → `sequel`, `API` → `A-P-I`). Applied during text normalization pipeline before chunk submission. |

---

### Phase 3: V2.0 — Extended Formats & On-Device Intelligence (Long-Term)

| Feature | User Value | Architectural Strategy |
| :--- | :--- | :--- |
| **On-Device OCR for Scanned PDFs** | Unlocks lecture slides, scanned book pages, and image-only PDFs that contain no raw text stream. | Local Google ML Kit Text Recognition (`com.google.mlkit:text-recognition`) running 100% on-device on Android. Zero network requests, keeping files strictly private. |
| **Multi-Format Support (EPUB & TXT)** | Broadens utility from PDFs to mainstream offline ebook libraries. | Fast on-device unzipping of EPUB HTML chapters, normalized through the existing `TextNormalizer` and `SentenceChunker`. |
| **OLED True Black & Sepia Themes** | Reduces eye strain in night reading and saves battery on OLED displays. | Additional theme token definitions in `src/theme/theme.ts`: `Sepia (Warm Paper)` and `OLED Black (#000000)`. |
| **Audio File Export / Offline Cache** | Allows exporting a chapter or article to local M4A/MP3 for listening on third-party offline players. | Android TTS `synthesizeToFile()` API saving audio chunks to application cache directory. |

---

## 3. Monetization & Ad Experience Roadmap

### Current Model (V1.0.2)
- **1-Hour Ad-Free Rewarded Unlock**: Users watch a 15–30s sponsor video to grant 1 hour of zero ads (stacks additively).
- **Natural-Break Interstitials**: Frequency-capped at 8-minute cooldowns, strictly blocked when audio is active or paused.
- **Library Bottom Banner**: Automatically hidden whenever Ad-Free is active.

### Future Monetization Refinements
1. **Optional "Permanent Ad-Free" In-App Purchase (Google Play Billing)**:
   - For power users who prefer a single one-time payment over watching rewarded ads.
   - Preserves offline-first architecture (verified via standard local purchase token cache).
2. **Rewarded Ad Streaks**:
   - Watching daily rewarded ads contributes to bonus ad-free multiplier or unlocks exclusive reader color themes.

---

## 4. Verification & Quality Gates

Every feature in the roadmap must satisfy:
1. **Offline Guarantee**: Works flawlessly in Airplane Mode with zero network access.
2. **Privacy Guarantee**: Document content and text never leave the device.
3. **Audio-First Integrity**: Audio service never crashes or stutters during background transitions or screen locks.
4. **Platform Concurrency**: UI maintains 60+ FPS without blocking JavaScript or UI threads during text extraction or TTS buffering.
