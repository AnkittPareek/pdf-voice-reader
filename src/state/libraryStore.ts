/**
 * PDF Voice Reader — Library Store
 *
 * State management for the document library.
 * Keeps a lightweight list of documents; does NOT store extracted text.
 */

import { create } from 'zustand';
import { Document } from '../domain/documents/types';
import { DocumentRepository } from '../infrastructure/repositories/DocumentRepository';

interface LibraryState {
  documents: Document[];
  isLoading: boolean;
  error?: string;

  /** Load all documents from the database */
  loadDocuments: () => Promise<void>;

  /** Add a new document to the library */
  addDocument: (doc: Document) => Promise<void>;

  /** Update an existing document's metadata */
  updateDocument: (doc: Document) => Promise<void>;

  /** Remove a document from the library */
  removeDocument: (id: string) => Promise<void>;

  /** Update a document's progress */
  updateProgress: (
    id: string,
    page: number,
    chunk: number,
    progress: number
  ) => Promise<void>;

  /** Get the most recently opened document */
  getMostRecent: () => Document | undefined;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  documents: [],
  isLoading: false,

  loadDocuments: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const documents = await DocumentRepository.getAll();
      set({ documents, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load library',
      });
    }
  },

  addDocument: async (doc: Document) => {
    try {
      await DocumentRepository.insert(doc);
      const documents = await DocumentRepository.getAll();
      set({ documents });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add document',
      });
    }
  },

  updateDocument: async (doc: Document) => {
    try {
      await DocumentRepository.insert(doc);
      set((state) => ({
        documents: state.documents.map((d) => (d.id === doc.id ? doc : d)),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update document',
      });
    }
  },

  removeDocument: async (id: string) => {
    try {
      await DocumentRepository.delete(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }));
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : 'Failed to remove document',
      });
    }
  },

  updateProgress: async (
    id: string,
    page: number,
    chunk: number,
    progress: number
  ) => {
    try {
      await DocumentRepository.updateProgress(id, page, chunk, progress);
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id
            ? {
                ...d,
                lastPositionPage: page,
                lastPositionChunk: chunk,
                progress,
                lastOpenedAt: Date.now(),
              }
            : d
        ),
      }));
    } catch {
      // Silent failure for progress updates — not critical
    }
  },

  getMostRecent: () => {
    const { documents } = get();
    if (documents.length === 0) return undefined;
    return documents.reduce((latest, doc) =>
      (doc.lastOpenedAt ?? 0) > (latest.lastOpenedAt ?? 0) ? doc : latest
    );
  },
}));
