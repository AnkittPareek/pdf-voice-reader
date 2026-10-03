/**
 * PDF Voice Reader — Document Repository
 *
 * Persistence layer for document metadata.
 * Spec reference: Section 11.1
 */

import { getDatabase } from '../database/database';
import { Document, DocumentStatus } from '../../domain/documents/types';

export const DocumentRepository = {
  async insert(doc: Document): Promise<void> {
    const db = await getDatabase();
    const sql = `INSERT OR REPLACE INTO documents
        (id, uri, file_name, title, author, page_count, file_size,
         created_at, last_opened_at, last_position_page, last_position_chunk,
         progress, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      doc.id,
      doc.uri,
      doc.fileName,
      doc.title ?? null,
      doc.author ?? null,
      doc.pageCount ?? null,
      doc.fileSize ?? null,
      doc.createdAt,
      doc.lastOpenedAt ?? null,
      doc.lastPositionPage,
      doc.lastPositionChunk,
      doc.progress,
      doc.status,
    ];
    if (typeof db.runSync === 'function') {
      db.runSync(sql, params);
      return;
    }
    await db.runAsync(sql, params);
  },

  async getById(id: string): Promise<Document | null> {
    try {
      const db = await getDatabase();
      const sql = 'SELECT * FROM documents WHERE id = ?';
      const row = typeof db.getFirstSync === 'function'
        ? db.getFirstSync<DocumentRow>(sql, [id])
        : await db.getFirstAsync<DocumentRow>(sql, [id]);
      return row ? mapRowToDocument(row) : null;
    } catch (e) {
      console.warn('DocumentRepository.getById error:', e);
      return null;
    }
  },

  async getAll(): Promise<Document[]> {
    try {
      const db = await getDatabase();
      const sql = 'SELECT * FROM documents ORDER BY last_opened_at DESC, created_at DESC';
      const rows = typeof db.getAllSync === 'function'
        ? db.getAllSync<DocumentRow>(sql)
        : await db.getAllAsync<DocumentRow>(sql);
      return rows.map(mapRowToDocument);
    } catch (e) {
      console.warn('DocumentRepository.getAll error:', e);
      return [];
    }
  },

  async getRecent(limit = 20): Promise<Document[]> {
    try {
      const db = await getDatabase();
      const sql = 'SELECT * FROM documents ORDER BY last_opened_at DESC, created_at DESC LIMIT ?';
      const rows = typeof db.getAllSync === 'function'
        ? db.getAllSync<DocumentRow>(sql, [limit])
        : await db.getAllAsync<DocumentRow>(sql, [limit]);
      return rows.map(mapRowToDocument);
    } catch (e) {
      console.warn('DocumentRepository.getRecent error:', e);
      return [];
    }
  },

  async updateLastOpened(id: string): Promise<void> {
    try {
      const db = await getDatabase();
      const sql = 'UPDATE documents SET last_opened_at = ? WHERE id = ?';
      const params = [Date.now(), id];
      if (typeof db.runSync === 'function') {
        db.runSync(sql, params);
        return;
      }
      await db.runAsync(sql, params);
    } catch (e) {
      console.warn('DocumentRepository.updateLastOpened error:', e);
    }
  },

  async updateProgress(
    id: string,
    page: number,
    chunk: number,
    progress: number
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const sql = `UPDATE documents
       SET last_position_page = ?, last_position_chunk = ?, progress = ?,
           last_opened_at = ?
       WHERE id = ?`;
      const params = [page, chunk, progress, Date.now(), id];
      if (typeof db.runSync === 'function') {
        db.runSync(sql, params);
        return;
      }
      await db.runAsync(sql, params);
    } catch (e) {
      console.warn('DocumentRepository.updateProgress error:', e);
    }
  },

  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    try {
      const db = await getDatabase();
      const sql = 'UPDATE documents SET status = ? WHERE id = ?';
      const params = [status, id];
      if (typeof db.runSync === 'function') {
        db.runSync(sql, params);
        return;
      }
      await db.runAsync(sql, params);
    } catch (e) {
      console.warn('DocumentRepository.updateStatus error:', e);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await getDatabase();
      const sql = 'DELETE FROM documents WHERE id = ?';
      if (typeof db.runSync === 'function') {
        db.runSync(sql, [id]);
        return;
      }
      await db.runAsync(sql, [id]);
    } catch (e) {
      console.warn('DocumentRepository.delete error:', e);
    }
  },

  async getCount(): Promise<number> {
    try {
      const db = await getDatabase();
      const sql = 'SELECT COUNT(*) as count FROM documents';
      const result = typeof db.getFirstSync === 'function'
        ? db.getFirstSync<{ count: number }>(sql)
        : await db.getFirstAsync<{ count: number }>(sql);
      return result?.count ?? 0;
    } catch (e) {
      console.warn('DocumentRepository.getCount error:', e);
      return 0;
    }
  },
};

// ---------- Internal ----------

interface DocumentRow {
  id: string;
  uri: string;
  file_name: string;
  title: string | null;
  author: string | null;
  page_count: number | null;
  file_size: number | null;
  created_at: number;
  last_opened_at: number | null;
  last_position_page: number;
  last_position_chunk: number;
  progress: number;
  status: string;
}

function mapRowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    uri: row.uri,
    fileName: row.file_name,
    title: row.title ?? undefined,
    author: row.author ?? undefined,
    pageCount: row.page_count ?? undefined,
    fileSize: row.file_size ?? undefined,
    createdAt: row.created_at,
    lastOpenedAt: row.last_opened_at ?? undefined,
    lastPositionPage: row.last_position_page,
    lastPositionChunk: row.last_position_chunk,
    progress: row.progress,
    status: row.status as DocumentStatus,
  };
}
