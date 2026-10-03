---
name: testing
description: Unit-test conventions, integration tests, physical-device checks, regression fixtures, performance tests
---

# Testing Skill

## Unit Test Conventions
- Test files in `tests/unit/`
- Use Jest with ts-jest
- Configuration in `jest.config.js`
- Run with `npm test`

## What to Unit Test
- Whitespace normalization
- Line joining
- Repeated header detection
- Page-number removal
- Sentence splitting
- Chunking (boundary preference, size limits)
- Progress calculations
- Playback state transitions

## Integration Tests
- Test the full pipeline: open PDF → extract → normalize → chunk → speak → complete → advance → persist
- Test files in `tests/integration/`

## Physical-Device Checks
- Screen lock during playback
- App backgrounding
- Notification controls
- Bluetooth headset connection/disconnection
- Incoming phone calls
- Audio focus changes
- Battery saver mode
- Low-memory device behavior
- Android 12+, 14+, 15+

## Regression Fixtures
- PDF test corpus in `tests/fixtures/`
- Each fixture tests a specific edge case
- Never commit proprietary PDFs — use generated test fixtures

## Performance Tests
- Library responsive with 100+ documents
- First page renders without waiting for full extraction
- Extraction runs off UI thread
- No full-document text copy in JS memory
- Large PDFs processed incrementally
