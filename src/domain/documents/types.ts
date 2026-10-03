/**
 * PDF Voice Reader — Document Domain Models
 *
 * Spec reference: Section 11.1 (documents), Section 8.1 (PdfDocumentInfo)
 */

export interface Document {
  id: string;
  uri: string;
  fileName: string;
  title?: string;
  author?: string;
  pageCount?: number;
  fileSize?: number;
  createdAt: number;
  lastOpenedAt?: number;
  lastPositionPage: number;
  lastPositionChunk: number;
  progress: number;
  status: DocumentStatus;
}

export type DocumentStatus =
  | 'ready'
  | 'importing'
  | 'error'
  | 'password_protected'
  | 'no_text'
  | 'corrupt';

export interface PdfDocumentInfo {
  id: string;
  pageCount: number;
  title?: string;
  author?: string;
  fileName: string;
}

export interface PdfPageText {
  pageIndex: number;
  text: string;
  hasText: boolean;
}
