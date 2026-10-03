/**
 * In-memory mock for expo-sqlite in Jest test environment.
 */

class MockDatabase {
  private docs = new Map<string, any>();

  async execAsync(_sql: string) {
    return;
  }

  async getAllAsync(sql: string, _params: any[] = []): Promise<any[]> {
    if (sql.includes('FROM documents')) {
      return Array.from(this.docs.values()).sort(
        (a, b) => (b.last_opened_at || 0) - (a.last_opened_at || 0)
      );
    }
    return [];
  }

  async getFirstAsync(sql: string, params: any[] = []): Promise<any> {
    if (sql.includes('FROM documents WHERE id = ?')) {
      return this.docs.get(params[0]) || null;
    }
    if (sql.includes('COUNT(*) as count FROM documents')) {
      return { count: this.docs.size };
    }
    return null;
  }

  async runAsync(sql: string, params: any[] = []) {
    if (sql.includes('INSERT OR REPLACE INTO documents')) {
      const [
        id,
        uri,
        file_name,
        title,
        author,
        page_count,
        file_size,
        created_at,
        last_opened_at,
        last_position_page,
        last_position_chunk,
        progress,
        status,
      ] = params;
      this.docs.set(id, {
        id,
        uri,
        file_name,
        title,
        author,
        page_count,
        file_size,
        created_at,
        last_opened_at,
        last_position_page,
        last_position_chunk,
        progress,
        status,
      });
    } else if (sql.includes('UPDATE documents SET last_position_page = ?')) {
      const [page, chunk, progress, last_opened, id] = params;
      const doc = this.docs.get(id);
      if (doc) {
        doc.last_position_page = page;
        doc.last_position_chunk = chunk;
        doc.progress = progress;
        doc.last_opened_at = last_opened;
      }
    } else if (sql.includes('UPDATE documents SET last_opened_at = ?')) {
      const [last_opened, id] = params;
      const doc = this.docs.get(id);
      if (doc) {
        doc.last_opened_at = last_opened;
      }
    } else if (sql.includes('UPDATE documents SET status = ?')) {
      const [status, id] = params;
      const doc = this.docs.get(id);
      if (doc) {
        doc.status = status;
      }
    } else if (sql.includes('DELETE FROM documents WHERE id = ?')) {
      this.docs.delete(params[0]);
    }
    return { changes: 1, lastInsertRowId: 1 };
  }

  async closeAsync() {
    this.docs.clear();
  }
}

const mockDb = new MockDatabase();

export async function openDatabaseAsync(_name: string) {
  return mockDb;
}
