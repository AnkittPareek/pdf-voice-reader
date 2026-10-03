/**
 * PDF Voice Reader — Database Abstraction
 *
 * Spec reference: Section 11 (Data model)
 * Uses expo-sqlite for local persistence.
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'pdf_voice_reader.db';

/**
 * Get (or create) the database instance.
 * Initializes the schema on first access.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    if (typeof SQLite.openDatabaseSync === 'function') {
      const syncDb = SQLite.openDatabaseSync(DB_NAME);
      syncDb.execSync(`PRAGMA journal_mode = WAL;`);
      syncDb.execSync(`PRAGMA foreign_keys = ON;`);
      createTablesSync(syncDb);
      db = syncDb;
      return db;
    }
  } catch (err) {
    console.warn('openDatabaseSync error, falling back to openDatabaseAsync:', err);
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await createTables(db);

  return db;
}

function createTablesSync(database: SQLite.SQLiteDatabase): void {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      file_name TEXT NOT NULL,
      title TEXT,
      author TEXT,
      page_count INTEGER,
      file_size INTEGER,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER,
      last_position_page INTEGER DEFAULT 0,
      last_position_chunk INTEGER DEFAULT 0,
      progress REAL DEFAULT 0.0,
      status TEXT DEFAULT 'ready'
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS playback_settings (
      id INTEGER PRIMARY KEY,
      speech_rate REAL DEFAULT 1.0,
      voice_id TEXT,
      locale TEXT,
      skip_headers INTEGER DEFAULT 1,
      skip_footers INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS speech_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page_index INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      text TEXT NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_page
    ON speech_chunks(document_id, page_index, sequence);
  `);

  database.execSync(`
    INSERT OR IGNORE INTO playback_settings (id, speech_rate, skip_headers, skip_footers, updated_at)
    VALUES (1, 1.0, 1, 1, ${Date.now()});
  `);
}

async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  // Documents table — Section 11.1
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      file_name TEXT NOT NULL,
      title TEXT,
      author TEXT,
      page_count INTEGER,
      file_size INTEGER,
      created_at INTEGER NOT NULL,
      last_opened_at INTEGER,
      last_position_page INTEGER DEFAULT 0,
      last_position_chunk INTEGER DEFAULT 0,
      progress REAL DEFAULT 0.0,
      status TEXT DEFAULT 'ready'
    );
  `);

  // Playback settings table — Section 11.2
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS playback_settings (
      id INTEGER PRIMARY KEY,
      speech_rate REAL DEFAULT 1.0,
      voice_id TEXT,
      locale TEXT,
      skip_headers INTEGER DEFAULT 1,
      skip_footers INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `);

  // Speech chunks table — Section 11.3
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS speech_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page_index INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      text TEXT NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // Index for quick chunk lookup by document and page
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_page
    ON speech_chunks(document_id, page_index, sequence);
  `);

  // Insert default playback settings if not exists
  await database.execAsync(`
    INSERT OR IGNORE INTO playback_settings (id, speech_rate, skip_headers, skip_footers, updated_at)
    VALUES (1, 1.0, 1, 1, ${Date.now()});
  `);
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
