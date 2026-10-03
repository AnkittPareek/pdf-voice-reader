---
name: pdf-reader
description: PDF extraction, reading-order normalization, chunking, resume position, scanned-PDF detection, regression fixtures
---

# PDF Reader Skill

## PDF Extraction
- Use the `PdfEngine` interface (`src/infrastructure/native/PdfEngine.ts`)
- Extract text incrementally (page by page), never the entire document at once
- Run extraction off the UI thread

## Reading-Order Normalization
- Use `src/utils/textNormalization.ts` for the normalization pipeline
- Pipeline: whitespace → page numbers → blank lines → broken lines → sentence splitting
- Preserve paragraph boundaries
- Don't blindly join lines inside lists

## Chunking
- Use `src/utils/chunking.ts`
- Target: 500–1500 characters per chunk
- Boundary preference: paragraph > sentence > clause > hard limit
- Each chunk carries `documentId`, `pageIndex`, `sequence`, `startOffset`, `endOffset`

## Resume Position
- Resume position includes: `documentId`, `pageIndex`, `chunkSequence`, `characterOffset`
- Persist on: pause, stop, chunk completion, page transition, app background, service shutdown
- Do NOT write to SQLite on every character-level TTS callback

## Scanned-PDF Detection
- Check `PdfPageText.hasText` — if false, the page may be scanned
- Show error: "This PDF does not contain selectable text."
- Future: OCR (V1.1)

## Regression Fixtures
- Maintain test PDFs in `tests/fixtures/`
- Fixture corpus: small text, 100 pages, 1000 pages, two-column, header/footer, scanned, mixed, tables, math, non-English, password, corrupt, large (200MB)
