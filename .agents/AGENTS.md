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
