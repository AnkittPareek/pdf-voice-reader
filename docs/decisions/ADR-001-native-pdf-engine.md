# ADR-001: Native PDF Engine

## Status
Proposed

## Context
PDF Voice Reader needs to:
1. Render PDF pages visually
2. Extract text from PDF pages for TTS

We need to choose a PDF rendering/extraction approach that works with Expo development builds on Android.

## Decision
Use an abstracted `PdfEngine` interface that initially targets Android's built-in `PdfRenderer` for rendering and a native PDF text extraction library (e.g., PDFBox or iText) for text extraction.

The interface is defined in `src/infrastructure/native/PdfEngine.ts` and allows the implementation to be swapped after real-device benchmarking.

## Candidates Considered
1. **Android PdfRenderer** — Built-in, no dependencies, limited text extraction
2. **react-native-pdf-light** — React Native wrapper, needs compatibility verification
3. **Custom Expo Module with PDFBox** — Full control, Kotlin implementation

## Rationale
- Abstract interface allows engine replacement without UI changes
- Android PdfRenderer is available on all modern Android devices
- Text extraction is the harder problem and may need a dedicated library
- No dependency should be selected merely because an AI agent recommends it

## Consequences
- Rendering and extraction may use different underlying libraries
- Performance benchmarking on physical devices will determine the final choice
- The interface must remain stable while implementations change
