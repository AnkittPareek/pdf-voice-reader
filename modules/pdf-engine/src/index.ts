import { requireNativeModule } from 'expo-modules-core';
import { PdfDocumentInfo, PdfPageText } from '../../../src/domain/documents/types';

export interface NativePdfEngineInterface {
  open(uri: string): Promise<PdfDocumentInfo>;
  openWithId?(uri: string, documentId: string): Promise<PdfDocumentInfo>;
  getPageText(documentId: string, pageIndex: number): Promise<PdfPageText>;
  renderPage(documentId: string, pageIndex: number, width: number): Promise<string>;
  close(documentId: string): Promise<void>;
}

let nativeModule: NativePdfEngineInterface | null = null;

try {
  nativeModule = requireNativeModule<NativePdfEngineInterface>('PdfEngine');
} catch {
  // Native module not available (e.g. running in Jest or before native build)
  nativeModule = null;
}

export default nativeModule;
