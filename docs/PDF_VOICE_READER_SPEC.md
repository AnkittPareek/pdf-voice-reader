PDF Voice Reader — Product, UX, HLD, LLD & Gemini Build Specification
**Version:** 1.0  
**Date:** 30 September 2026  
**Status:** Base implementation specification / source of truth
---
0. Document purpose
This document is the source of truth for the initial PDF Voice Reader application.
The initial product is deliberately narrow:
Open a PDF and listen to it aloud, with reliable background playback and remembered position.
This is not a generic document-management application in V1. Do not expand scope unless a later product decision explicitly changes this specification.
---
1. Product definition
1.1 Product statement
A privacy-first, offline-first, Android-first PDF reader that converts text PDFs into a continuous listening experience using the device's native text-to-speech engine.
Core journey:
Import / Open PDF
       ↓
Inspect PDF
       ↓
Extract text
       ↓
Normalize reading order
       ↓
Build speech chunks
       ↓
Play
       ↓
Continue across pages
       ↓
Remember exact position
1.2 Primary user
People who already have PDFs and want to consume them while:
commuting
walking
exercising
doing household work
studying
resting their eyes
multitasking
1.3 Product principles
1. Listening is the primary action.
2. Normal text PDFs and device TTS should work offline.
3. User PDFs stay on-device by default.
4. Playback must survive screen lock/backgrounding.
5. The product should feel like an audiobook player, not a complicated file manager.
6. Never place ads into active listening.
7. AI is not part of the V1 critical path.
8. Native functionality belongs in native modules; React Native owns presentation and application orchestration.
---
2. Research findings
2.1 ReadEra baseline
ReadEra's official site describes a broad offline reader with automatic document detection, large-library handling, bookmarks, text search, collections, reading progress, multiple reading modes and many document formats. It also highlights text-to-speech.
This establishes the category baseline, but our V1 should not attempt to reproduce ReadEra's breadth. The product should specialize in **PDF listening**.
Official source:
https://readera.org/index.html
ReadEra also describes on-device file handling and a privacy-oriented model in which user files are not transmitted.
Source:
https://readera.org/privacy
2.2 Adobe Acrobat baseline
Adobe documents Read Aloud on Android with pause/play, speed control and language selection. Adobe also documents limitations around unknown languages, password-protected files and non-OCR scanned PDFs.
Product implication: scanned PDFs, protected PDFs and extraction failures must have explicit product states rather than silent failures.
Sources:
https://www.adobe.com/devnet-docs/acrobat/android/en/workingwithpdf.html
https://helpx.adobe.com/in/acrobat/using/reading-pdfs-reflow-accessibility-features.html
2.3 Speechify baseline
Speechify emphasizes OCR, synchronized highlighting, many voices/languages, fast playback, document support and AI summaries.
Product implication: synchronized highlighting, OCR and premium voices are strong future features, but they are not required for V1.
Source:
https://speechify.com/text-reader/
2.4 Android platform findings
File access
Android's Storage Access Framework provides user-controlled document selection through the system picker. V1 should use ACTION_OPEN_DOCUMENT for user-selected PDFs rather than broad storage scanning.
Source:
https://developer.android.com/training/data-storage/shared/documents-files
Background playback
Android's quality guidance expects background audio playback to use a foreground service and a persistent MediaStyle notification with controls. Modern Android versions also impose foreground-service declaration and start restrictions.
Sources:
https://developer.android.com/develop/adaptive-apps/quality-guidelines/core-app-quality
https://developer.android.com/develop/background-work/services/fgs/service-types
https://developer.android.com/develop/background-work/services/fgs/declare
https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
Native TTS
Android exposes TextToSpeech/TextToSpeechService APIs and installed voice/locale support.
Source:
https://developer.android.com/reference/android/speech/tts/TextToSpeechService
React Native / Expo
Expo development builds are appropriate when an app requires native libraries or custom native code. Expo Modules API supports Kotlin/Swift native modules.
Sources:
https://docs.expo.dev/develop/development-builds/introduction/
https://docs.expo.dev/workflow/customizing/
https://docs.expo.dev/modules/overview/
Media playback
Android recommends Media3/ExoPlayer for general audio/video playback use cases. V1 should not add Media3 merely because it is popular; dynamic TTS can initially be owned by the TTS service. Media3 becomes relevant if generated/cached speech audio becomes a first-class playback asset.
Source:
https://developer.android.com/media/implement/playback-app
---
3. Scope
3.1 V1 — mandatory
Area
Requirement
Priority
PDF import
Android system file picker
P0
PDF open
Render pages
P0
Text extraction
Extract text from text PDFs
P0
Text cleanup
Normalize extraction artifacts
P0
TTS
Native device TTS
P0
Playback
Play/pause/stop
P0
Continuous reading
Advance through chunks/pages automatically
P0
Background
Continue after screen lock
P0
Notification
Playback controls
P0
Speed
0.75x–2.0x
P0
Position
Remember document + speech position
P0
Recent library
Recently opened PDFs
P0
Error states
Unsupported/scanned/password/empty PDFs
P0
Dark mode
System/light/dark
P0
3.2 V1.1
OCR for scanned PDFs
Sentence/paragraph highlighting
Sleep timer
Skip forward/back
Better heading/chapter detection
"Listen from here"
Text selection → Listen
More granular speech controls
3.3 V2
EPUB
TXT/DOCX
Premium voices
Cloud sync
Reading statistics
AI summary
Ask-this-document
Translation
Study mode
Do not implement V2 features before the V1 listening loop is stable.
---
4. UX architecture
V1 should have only three primary surfaces:
Library
  ├── Recent PDFs
  ├── Add PDF
  └── Empty state
PDF Reader
  ├── PDF rendering
  ├── Listen CTA
  ├── Reading progress
  └── Reader settings
Settings
  ├── TTS voice
  ├── Language
  ├── Speed
  ├── Theme
  └── About/privacy
Do not introduce bottom navigation with multiple empty tabs.
---
5. Design language
5.1 Visual direction
Calm / premium / editorial / audio-first.
The application should feel closer to an audiobook player than a file manager.
Avoid:
excessive gradients
excessive glassmorphism
decorative 3D elements
huge hero illustrations
random rounded cards
fake dashboard statistics
AI-generated-looking visual clutter
5.2 Color tokens
Light theme:
Background        #F7F7F5
Surface           #FFFFFF
Primary text      #171717
Secondary text    #6B6B6B
Divider           #E6E6E3
Accent            #4F46E5
Accent soft       #EEF2FF
Error             #B42318
Dark theme:
Background        #101114
Surface           #181A1F
Primary text      #F5F5F5
Secondary text    #A7A9B0
Divider           #2B2E35
Accent            #818CF8
Accent soft       #22254A
Error             #F97066
Never hard-code these values in components. Use theme tokens.
5.3 Typography
Application UI:
Display      28–32 px / semibold
Title        20–24 px / semibold
Body         16 px / regular
Secondary    14 px / regular
Caption      12 px / medium
The original PDF page is rendered as a document. Do not restyle PDF content in V1.
5.4 Shape and interaction
12–16 px corner radius for cards/sheets.
8 px for compact controls.
Avoid excessive pill-shaped UI.
Use approximately 44–48 dp minimum touch targets.
Keep controls obvious and reachable.
Use motion sparingly.
---
6. UI specification
6.1 Library — first launch
┌─────────────────────────────────┐
│ PDF Voice                  ⚙    │
│                                 │
│ Listen to your PDFs             │
│ without staring at the screen.  │
│                                 │
│       ┌─────────────────┐       │
│       │    + Add PDF    │       │
│       └─────────────────┘       │
│                                 │
│ Your PDFs will appear here.     │
│                                 │
└─────────────────────────────────┘
Requirements:
One dominant CTA.
No permission wall.
Launch the system picker only after the user taps Add PDF.
Briefly explain that files remain on-device by default.
6.2 Library — populated
┌─────────────────────────────────┐
│ PDF Voice                  ⚙    │
│                                 │
│ Continue listening              │
│ ┌─────────────────────────────┐ │
│ │ PDF cover   Book / document │ │
│ │             42%             │ │
│ │             38 min left     │ │
│ │             ▶ Continue      │ │
│ └─────────────────────────────┘ │
│                                 │
│ Recent                          │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │ PDF  │ │ PDF  │ │ PDF  │     │
│ │ 12%  │ │ 74%  │ │  0%  │     │
│ └──────┘ └──────┘ └──────┘     │
│                                 │
│             + Add PDF           │
└─────────────────────────────────┘
6.3 Reader screen
┌─────────────────────────────────┐
│ ‹  Document.pdf            ⋮    │
│                                 │
│                                 │
│        ORIGINAL PDF PAGE        │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ Page 42 of 280                  │
│ ━━━━━━━━━━━━━●──────────────    │
│                                 │
│         ▶  Listen               │
│                                 │
│      Tap to start listening     │
└─────────────────────────────────┘
6.4 Listening mode
┌─────────────────────────────────┐
│ ‹  Now listening            ⋮   │
│                                 │
│            PDF                  │
│        Document title           │
│                                 │
│         Page 42 / 280           │
│                                 │
│ "The current paragraph is..."   │
│                                 │
│ ━━━━━━━━━━━●───────────────     │
│                                 │
│         38:42 / 2:14:31         │
│                                 │
│     ↶ 15s   ❚❚   15s ↷         │
│                                 │
│       0.75x  1x  1.25x  1.5x    │
│                                 │
│  Voice: English (System)        │
└─────────────────────────────────┘
6.5 Listening controls
Primary controls:
play/pause
previous/next speech chunk
optional skip 15 seconds later
speed
voice
language
stop
Do not bury Play/Pause inside settings.
---
7. HLD
┌──────────────────────────────────────────────┐
│                React Native UI               │
│                                              │
│ Library │ Reader │ Listening │ Settings      │
└──────────────────────┬───────────────────────┘
                       │
                 TypeScript API
                       │
┌──────────────────────▼───────────────────────┐
│              Application Layer               │
│                                              │
│ LibraryService                               │
│ ReaderService                                │
│ SpeechOrchestrator                           │
│ PlaybackStateStore                           │
└───────┬──────────────┬──────────────┬────────┘
        │              │              │
        ▼              ▼              ▼
  Repository      Native Bridge    Preferences
        │              │
        ▼              ▼
     SQLite       Android Modules
                       │
            ┌──────────┼───────────┐
            ▼          ▼           ▼
       PDF Engine     TTS      Background
       / Renderer    Engine      Service
7.1 Layering rules
Presentation
React Native/TypeScript owns:
rendering
navigation
user input
local UI state
accessibility labels
screen lifecycle
It must not own:
PDF parsing
Android TTS lifecycle
Android foreground service lifecycle
low-level notification implementation
Application
TypeScript owns:
use cases
orchestration
state transitions
repository coordination
native API coordination
Domain
Platform-independent models and rules:
document metadata
reading position
speech chunk
playback state
validation
Infrastructure
Native Android and persistence:
PDF rendering
PDF text extraction
TextToSpeech
foreground service
notification
SQLite
---
8. Native architecture
Recommended app-specific modules:
modules/
├── pdf-engine/
│   ├── android/
│   └── src/
│
├── pdf-text/
│   ├── android/
│   └── src/
│
├── speech-engine/
│   ├── android/
│   └── src/
│
└── playback-service/
    ├── android/
    └── src/
Use Expo Modules API for app-specific native modules when practical.
8.1 PdfEngine contract
type PdfDocumentInfo = {
  id: string;
  pageCount: number;
  title?: string;
  author?: string;
  fileName: string;
};
type PdfPageText = {
  pageIndex: number;
  text: string;
  hasText: boolean;
};
interface PdfEngine {
  open(uri: string): Promise<PdfDocumentInfo>;
  getPageText(documentId: string, pageIndex: number): Promise<PdfPageText>;
  renderPage(
    documentId: string,
    pageIndex: number,
    width: number
  ): Promise<string>;
  close(documentId: string): Promise<void>;
}
The exact native implementation may change after benchmarking. Do not invent APIs merely to satisfy this interface.
8.2 SpeechEngine contract
type SpeechVoice = {
  id: string;
  name: string;
  locale: string;
  quality?: number;
  requiresNetwork?: boolean;
};
type SpeechOptions = {
  rate: number;
  voiceId?: string;
  locale?: string;
};
interface SpeechEngine {
  initialize(): Promise<void>;
  getVoices(): Promise<SpeechVoice[]>;
  speak(text: string, options: SpeechOptions): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
The Android implementation should use the device's TextToSpeech API.
8.3 Background playback service
Responsibilities:
own the long-lived speech session
keep playback alive while actively listening
expose notification controls
handle audio focus
react to headset/Bluetooth controls where supported
persist progress independently of the Reader screen
communicate state to React Native when the app is foregrounded
The service must be started because the user explicitly initiated playback, not arbitrarily from the background.
---
9. PDF text pipeline
PDF URI
  ↓
Open document
  ↓
Extract page text
  ↓
Normalize
  ↓
Detect repeated headers/footers
  ↓
Join broken lines
  ↓
Preserve paragraph boundaries
  ↓
Remove obvious page-number noise
  ↓
Sentence segmentation
  ↓
Speech chunks
  ↓
TTS
9.1 Normalization rules
The normalizer should:
normalize Unicode whitespace
remove excessive blank lines
preserve paragraph boundaries
avoid blindly joining lines inside lists
remove repeated headers/footers only when repetition is strongly established
avoid deleting meaningful numbers
avoid changing quoted content
retain page/chunk metadata for resume
PDFs are layout-oriented, so extraction order is the largest technical risk in V1.
9.2 Chunking
Do not send an entire PDF to TTS.
Initial target:
Target chunk:
~500–1500 characters
Boundary preference:
1. paragraph
2. sentence
3. clause
4. hard character limit
Chunk model:
type SpeechChunk = {
  id: string;
  documentId: string;
  pageIndex: number;
  sequence: number;
  text: string;
  startOffset: number;
  endOffset: number;
};
---
10. Playback state machine
IDLE
 │
 │ play
 ▼
INITIALIZING
 │
 ├── error ──> ERROR
 │
 ▼
LOADING_CHUNK
 │
 ▼
SPEAKING
 │  │
 │  ├── pause ──> PAUSED
 │  ├── stop  ──> STOPPED
 │  └── done
 │
 ▼
ADVANCING
 │
 ├── next chunk ──> LOADING_CHUNK
 ├── next page  ──> EXTRACTING_PAGE
 └── EOF ────────> COMPLETED
PAUSED
 │
 ├── resume ──> SPEAKING
 └── stop   ──> STOPPED
Persist position on:
pause
stop
chunk completion
page transition
app background
service shutdown
reasonable progress intervals
Do not write to SQLite on every character-level TTS callback.
---
11. Data model
11.1 documents
documents
---------
id TEXT PRIMARY KEY
uri TEXT NOT NULL
file_name TEXT NOT NULL
title TEXT
author TEXT
page_count INTEGER
file_size INTEGER
created_at INTEGER
last_opened_at INTEGER
last_position_page INTEGER
last_position_chunk INTEGER
progress REAL
status TEXT
11.2 playback_settings
playback_settings
-----------------
id INTEGER PRIMARY KEY
speech_rate REAL
voice_id TEXT
locale TEXT
skip_headers INTEGER
skip_footers INTEGER
updated_at INTEGER
11.3 speech_chunks
speech_chunks
-------------
id TEXT PRIMARY KEY
document_id TEXT
page_index INTEGER
sequence INTEGER
text TEXT
start_offset INTEGER
end_offset INTEGER
V1 should generate chunks lazily where practical instead of precomputing every chunk for very large PDFs.
---
12. Position model
Resume position should be more precise than page number:
documentId
pageIndex
chunkSequence
characterOffset
Example:
{
  "documentId": "doc_123",
  "pageIndex": 42,
  "chunkSequence": 7,
  "characterOffset": 318
}
Resume flow:
1. reopen PDF
2. restore page
3. retrieve/rebuild chunks
4. restore chunk
5. continue from the nearest safe speech boundary
Do not promise exact character-level resume until the TTS engine reliably reports progress.
---
13. File handling
Use Android Storage Access Framework.
Primary flow:
User taps Add PDF
        ↓
ACTION_OPEN_DOCUMENT
        ↓
PDF selected
        ↓
Persist URI permission where supported
        ↓
Store URI + metadata
        ↓
Open
Do not scan the entire device in V1. This keeps permission complexity low and supports the privacy promise.
Later, an optional folder-scanning feature can use directory access.
---
14. PDF rendering strategy
Candidate approaches:
1. Android PdfRenderer for a native baseline where it is sufficient.
2. A maintained React Native PDF viewer such as `react-native-pdf-light`, after verifying current compatibility, license, maintenance, Android SDK support, binary size and large-document performance.
3. A different native PDF engine if benchmarking proves the above insufficient.
The rendering and extraction layers must remain abstracted so the engine can be replaced.
Do not select a dependency merely because an AI agent recommends it.
---
15. Performance requirements
V1 targets:
library should remain responsive with 100+ documents
first page should render without waiting for full-document extraction
extraction must run off the UI thread
TTS queue generation must not block scrolling
no full-document text copy in JS memory
large PDFs must be processed incrementally
background listening must not depend on the Reader screen being mounted
opening a large PDF must not cause avoidable memory spikes
Permanent regression corpus:
01-small-text.pdf
02-100-pages.pdf
03-1000-pages.pdf
04-two-column.pdf
05-header-footer.pdf
06-scanned.pdf
07-mixed-images-text.pdf
08-table-heavy.pdf
09-math-heavy.pdf
10-non-english.pdf
11-password-protected.pdf
12-broken-or-corrupt.pdf
13-large-file-200mb.pdf
---
16. Accessibility
Minimum requirements:
TalkBack-compatible controls
meaningful content descriptions
large touch targets
adequate contrast
no color-only state indication
playback state announced clearly
speed control accessible without gestures
notification controls labelled
no clipping at large system font settings
Accessibility is a core requirement because the application itself is an assistive listening tool.
---
17. Error states
Condition
User message
Action
No text
This PDF does not contain selectable text.
Try OCR
Password protected
This PDF is password protected and cannot be read aloud.
Close
Unsupported language
No installed voice supports this document's detected language.
Choose another voice
TTS unavailable
Text-to-speech is not available on this device.
Check system speech settings
Corrupt PDF
We couldn't open this PDF.
Try another file
Extraction failure
We couldn't extract readable text from this PDF.
Try another PDF
Never expose native stack traces to users.
---
18. Privacy and security
V1 principle:
PDF content never leaves the device.
Do not:
send document text to a server
upload PDFs
log extracted text
log document contents
put file paths/URIs into analytics
Safe analytics:
pdf_opened
listen_started
listen_completed
tts_error
pdf_extraction_failed
playback_paused
Unsafe analytics:
document_title
document_path
document_text
extracted_content
If AI or cloud OCR is introduced later, it must be explicitly opt-in and disclosed.
---
19. Monetization
Do not put ads into active listening.
Free V1
PDF import
PDF rendering
native TTS
background playback
speed control
recent PDFs
Premium later
OCR
premium neural voices
advanced speech controls
sentence highlighting
sleep timer
AI summary
Ask PDF
cloud sync
Do not implement subscriptions before the core listening loop demonstrates retention.
---
20. Recommended project structure
src/
├── app/
│   ├── navigation/
│   └── providers/
├── screens/
│   ├── LibraryScreen/
│   ├── ReaderScreen/
│   ├── ListeningScreen/
│   └── SettingsScreen/
├── components/
│   ├── PdfCard/
│   ├── ListenButton/
│   ├── PlaybackControls/
│   ├── ProgressBar/
│   └── VoiceSelector/
├── domain/
│   ├── documents/
│   ├── playback/
│   └── speech/
├── application/
│   ├── LibraryService.ts
│   ├── ReaderService.ts
│   └── SpeechOrchestrator.ts
├── infrastructure/
│   ├── database/
│   ├── native/
│   └── repositories/
├── state/
│   ├── libraryStore.ts
│   └── playbackStore.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── theme.ts
└── utils/
    ├── textNormalization.ts
    └── formatters.ts
modules/
├── pdf-engine/
├── pdf-text/
├── speech-engine/
└── playback-service/
tests/
├── unit/
├── integration/
└── fixtures/
---
21. State management
Use a small predictable state layer.
type PlaybackState =
  | "idle"
  | "initializing"
  | "loading"
  | "speaking"
  | "paused"
  | "stopped"
  | "completed"
  | "error";
type PlayerState = {
  documentId?: string;
  state: PlaybackState;
  pageIndex: number;
  chunkIndex: number;
  progress: number;
  rate: number;
  voiceId?: string;
  error?: string;
};
Avoid putting the entire extracted document into global React state.
---
22. Testing strategy
22.1 Unit tests
Test:
whitespace normalization
line joining
repeated header detection
page-number removal
sentence splitting
chunking
progress calculations
playback state transitions
22.2 Integration test
open PDF
→ extract page
→ normalize
→ create chunks
→ start speech
→ receive completion
→ advance chunk
→ advance page
→ persist position
22.3 Physical-device tests
Test:
screen lock
app background
notification controls
Bluetooth headset
incoming phone call
audio focus changes
battery saver
low-memory device
Android 12+
Android 14+
Android 15+
current Android 17 behavior as applicable
---
23. Definition of Done for V1
[ ] User can select a PDF from Android Files.
[ ] PDF opens reliably.
[ ] Page rendering is smooth enough for normal reading.
[ ] Text PDFs can be extracted.
[ ] Extraction artifacts are normalized.
[ ] User can start speech from the current page.
[ ] Speech automatically continues through chunks/pages.
[ ] Pause/resume works.
[ ] Speed works.
[ ] Voice selection works.
[ ] Screen lock does not stop playback.
[ ] Notification controls work.
[ ] Progress survives app restart.
[ ] Unsupported/scanned/password PDFs show useful errors.
[ ] No document contents are sent to servers.
[ ] No document contents appear in logs.
[ ] Large PDFs do not freeze the UI.
[ ] Tests cover the speech state machine.
[ ] Release build works on a physical Android device.
---
24. Gemini / Antigravity development rules
This section is the AI-agent operating contract.
24.1 Source-of-truth hierarchy
1. Explicit user instruction in the current task.
2. This specification.
3. Existing working project architecture.
4. Official Android/Expo documentation.
5. Current dependency documentation.
6. Agent assumptions.
Never invent an API because it looks plausible.
24.2 Research before native implementation
Before implementing or changing:
PDF engine
TTS
foreground service
MediaSession
storage access
Android permissions
Expo native modules
OCR
billing
the agent must verify the current official documentation and current dependency documentation.
For Gemini API work, use Google's current Gemini documentation rather than model memory. Google's current coding-agent documentation recommends Gemini Docs MCP to keep agents current with evolving Gemini APIs.
Source:
https://ai.google.dev/gemini-api/docs/coding-agents
24.3 Small implementation increments
Preferred sequence:
1. Bootstrap project
2. Theme/design system
3. Navigation
4. Library UI
5. PDF picker
6. PDF rendering
7. PDF extraction
8. Text normalization
9. TTS native module
10. Speech orchestrator
11. Background service
12. Persistence
13. Error states
14. Testing
15. Performance
16. Release hardening
After each major step:
implement
→ typecheck
→ lint
→ test
→ build
→ manually verify
→ commit
24.4 Never hide failures
If a native dependency fails:
stop
report the exact error
identify the failing dependency
verify compatibility
propose alternatives
do not silently replace the architecture
24.5 Do not rewrite working code unnecessarily
extend working code
refactor only when justified
preserve public interfaces
avoid unrelated dependency upgrades
24.6 Native-code rule
Native Android code must remain behind typed TypeScript interfaces.
React Native screens must not directly know:
Android Service classes
TextToSpeech internals
PDF renderer internals
notification channel IDs
Android URI implementation details
24.7 UI rule
Follow the design tokens and screen specifications. Do not generate generic "AI-looking" UI.
24.8 No premature features
Do not implement:
authentication
cloud sync
AI chat
social features
EPUB
DOCX
payments
until V1 listening is stable.
24.9 Architecture decision records
Create:
docs/
└── decisions/
    ├── ADR-001-native-pdf-engine.md
    ├── ADR-002-tts-architecture.md
    ├── ADR-003-background-playback.md
    └── ADR-004-storage-access.md
Every major architecture change gets an ADR.
---
25. Recommended .agents/AGENTS.md
Create this file in the repository:
# PDF Voice Reader — Agent Instructions
You are implementing PDF Voice Reader.
Read docs/PDF_VOICE_READER_SPEC.md before making architectural or product changes.
## Product
The V1 product converts user-selected PDFs into an offline listening experience.
## Non-negotiables
- PDF content stays on-device in V1.
- Background playback must work.
- Do not add cloud services unless explicitly requested.
- Do not add AI features to the V1 critical path.
- Do not invent native APIs.
- Verify native/platform APIs against current official documentation.
- Keep native functionality behind typed interfaces.
- Do not rewrite unrelated working code.
## Architecture
React Native + TypeScript owns UI and application orchestration.
Native Android modules own PDF rendering/extraction, TTS, and background playback.
SQLite persists document metadata and reading position.
## Development workflow
For every meaningful change:
1. inspect existing code
2. identify impacted layer
3. implement the smallest coherent change
4. run typecheck
5. run lint
6. run relevant tests
7. build Android if native code changed
8. report exact results
## UI
Follow the design tokens and screen specifications in the product spec.
Do not introduce arbitrary colors, gradients, cards, or navigation patterns.
## Security
Never log PDF text.
Never send PDF contents to analytics.
Never upload PDFs in V1.
## Dependency rule
Before adding a dependency:
- verify maintenance
- verify license
- verify Android compatibility
- verify Expo/React Native compatibility
- verify bundle-size impact
- explain why it is needed
## Completion
A feature is not complete merely because TypeScript compiles.
It must work on a physical Android device where relevant.
Google's current agent documentation supports file-based AGENTS.md and skills under an `.agents` directory.
---
26. Suggested Gemini skills
.agents/
├── AGENTS.md
└── skills/
    ├── pdf-reader/
    │   └── SKILL.md
    ├── android-native/
    │   └── SKILL.md
    ├── ui-system/
    │   └── SKILL.md
    └── testing/
        └── SKILL.md
pdf-reader/SKILL.md
Teach:
PDF extraction
reading-order normalization
chunking
resume position
scanned-PDF detection
regression fixtures
android-native/SKILL.md
Teach:
Expo Modules API
Kotlin conventions
foreground services
Android lifecycle
TextToSpeech lifecycle
audio focus
notification behavior
ui-system/SKILL.md
Teach:
design tokens
spacing
typography
accessibility
screen conventions
reusable component rules
testing/SKILL.md
Teach:
unit-test conventions
integration tests
physical-device checks
regression fixtures
performance tests
---
27. Gemini staged implementation prompts
Phase 1 — Inspect
Read:
- docs/PDF_VOICE_READER_SPEC.md
- .agents/AGENTS.md
We are beginning implementation of PDF Voice Reader.
Do not implement the entire app.
First inspect the repository and report:
1. current project structure
2. package manager
3. Expo/React Native version
4. Android configuration
5. existing dependencies
6. whether native modules are already configured
7. architecture conflicts with the specification
Then propose the minimum bootstrap changes required for V1.
Do not modify application code yet.
Phase 2 — Foundation
Implement only the project foundation.
Requirements:
- React Native + TypeScript
- Expo development build
- navigation foundation
- design tokens
- theme system
- application/domain/infrastructure folder structure
- typed native-module interfaces
- SQLite abstraction
- basic Library screen
- basic Settings screen
Do not implement PDF rendering or TTS yet.
After implementation:
- run typecheck
- run lint
- run tests
- build Android if required
- report exact results.
Phase 3 — PDF
Implement PDF import and rendering.
Use the system document picker.
Do not request broad storage permission unnecessarily.
Before selecting a PDF library/engine:
1. inspect current project compatibility
2. verify current library documentation
3. verify license
4. verify Android compatibility
5. record the decision in an ADR
Implement:
- PDF selection
- document persistence
- PDF opening
- page rendering
- loading/error states
Do not implement TTS yet.
Phase 4 — Extraction
Implement the PDF text extraction pipeline.
Requirements:
- incremental page extraction
- text normalization
- paragraph preservation
- obvious page-number cleanup
- conservative header/footer detection
- chunking
- unit tests using the PDF fixture corpus
Do not put extracted document text into global React state.
Do not log document contents.
Phase 5 — TTS
Implement native Android TTS behind the SpeechEngine interface.
Requirements:
- initialize
- list voices
- locale selection
- speech rate
- speak
- stop
- pause/resume where supported
- completion/error callbacks
Keep all Android TextToSpeech implementation inside the native module.
Do not implement cloud TTS.
Phase 6 — Background listening
Implement the speech orchestrator and background listening.
The user must be able to:
- start from the current page
- pause
- resume
- stop
- automatically advance through chunks/pages
- lock the screen without losing playback
- control playback from the notification
- resume after reopening the app
Use the Android foreground-service/media playback architecture required by the current Android version.
Test on a physical device.
---
28. Research-backed architectural decisions
Decision
Rationale
Android-first
Initial requirements depend heavily on Android storage, TTS and foreground-service behavior.
Expo Development Build
Custom/native functionality is required; Expo Go is insufficient for custom native modules.
Native PDF/TTS boundary
PDF parsing and Android TTS should not live in JavaScript.
No backend in V1
Core value does not require accounts, sync or server infrastructure.
Native TTS first
Low cost, offline operation, privacy and no API-key management.
Media3 only when justified
Media3 is excellent for media playback, but dynamic TTS does not automatically require ExoPlayer.
Abstract PDF engine
Rendering/extraction technology may need replacement after real-device benchmarking.
---
29. Future AI architecture
AI remains outside the V1 critical path.
PDF
 ↓
Local extraction
 ↓
Chunking
 ↓
Local metadata
 ↓
Optional user action
 ↓
AI service
 ↓
Summary / Q&A / explanation
Potential future features:
summarize page
summarize chapter
explain selected paragraph
ask the PDF
generate quiz
generate flashcards
translate selected text
generate podcast-style summary
Never make a user upload a document to AI without clear disclosure and consent.
---
30. Product success metrics
Activation
Percentage of new users who:
open app
→ import PDF
→ press Listen
Listening conversion
listen_started / pdf_opened
Listening completion
Percentage of listening sessions reaching at least 80% of the selected document.
Retention
D1
D7
D30
Quality
PDF extraction failure rate
TTS initialization failure rate
crash-free sessions
background playback interruption rate
time from PDF open to first speech
Do not optimize for downloads alone.
---
31. V1 build order
M0  Repository + specification
M1  Expo + Android development build
M2  Design system + navigation
M3  PDF picker
M4  PDF renderer
M5  PDF text extraction
M6  Text normalization/chunking
M7  Native TTS
M8  Speech orchestrator
M9  Background service + notification
M10 Persistence/resume
M11 Error handling
M12 Testing/performance
M13 Play Store release
Do not move to the next milestone with unresolved architecture-level failures.
---
32. Final product definition
The first release should be judged by one question:
**Can a user select a normal text PDF, press Listen, lock their phone, and reliably hear the document from beginning to end while the app remembers exactly where they stopped?**
If yes, V1 has achieved its purpose.
Everything else is secondary.
---
33. Sources
1. ReadEra official product/features — https://readera.org/index.html
2. ReadEra privacy — https://readera.org/privacy
3. ReadEra Premium — https://readera.org/premium
4. ReadEra OpenReadEra — https://readera.org/open-readera
5. Adobe Acrobat Android PDF help — https://www.adobe.com/devnet-docs/acrobat/android/en/workingwithpdf.html
6. Adobe Read Out Loud/reflow — https://helpx.adobe.com/in/acrobat/using/reading-pdfs-reflow-accessibility-features.html
7. Speechify Text Reader — https://speechify.com/text-reader/
8. Android Storage Access Framework — https://developer.android.com/training/data-storage/shared/documents-files
9. Android TextToSpeechService — https://developer.android.com/reference/android/speech/tts/TextToSpeechService
10. Android foreground services — https://developer.android.com/develop/background-work/services/fgs/service-types
11. Android foreground-service declaration — https://developer.android.com/develop/background-work/services/fgs/declare
12. Android foreground-service restrictions — https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
13. Android app quality/background audio — https://developer.android.com/develop/adaptive-apps/quality-guidelines/core-app-quality
14. Android Media3 — https://developer.android.com/media/implement/playback-app
15. Expo development builds — https://docs.expo.dev/develop/development-builds/introduction/
16. Expo custom native code — https://docs.expo.dev/workflow/customizing/
17. Expo Modules API — https://docs.expo.dev/modules/overview/
18. Gemini coding-agent guidance — https://ai.google.dev/gemini-api/docs/coding-agents
19. Gemini managed-agent / AGENTS.md guidance — https://ai.google.dev/gemini-api/docs/custom-agents
20. Gemini API documentation — https://ai.google.dev/gemini-api/docs
21. React Native PDF Light — https://github.com/alpha0010/react-native-pdf-viewer