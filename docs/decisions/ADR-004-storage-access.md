# ADR-004: Storage Access

## Status
Accepted

## Context
The app needs to access user-selected PDF files. Android offers several approaches with different permission models.

## Decision
Use Android's Storage Access Framework (SAF) with `ACTION_OPEN_DOCUMENT` through Expo's `expo-document-picker`.

## Rationale
- No broad storage permissions required
- User explicitly selects each file
- Supports the privacy promise ("files stay on your device")
- Compatible with modern Android scoped storage
- URI permissions can be persisted for reopening

## Alternatives Rejected
- **Broad READ_EXTERNAL_STORAGE**: Over-permissioned, incompatible with modern Android scoped storage
- **File scanning**: Privacy-hostile, unnecessary for V1
- **Folder access (ACTION_OPEN_DOCUMENT_TREE)**: Future feature for library scanning

## Consequences
- Users must manually select each PDF (good for privacy, slightly more friction)
- URI persistence requires `takePersistableUriPermission`
- File metadata is limited to what SAF provides
- Folder-level import can be added in V1.1
