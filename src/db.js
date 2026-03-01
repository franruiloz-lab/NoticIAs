const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(DB_PATH);

// Tabla base (sin category, compatible con instancias existentes)
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source       TEXT NOT NULL,
    source_type  TEXT NOT NULL,
    title        TEXT NOT NULL,
    url          TEXT NOT NULL UNIQUE,
    summary      TEXT,
    score        INTEGER DEFAULT 0,
    profile      TEXT DEFAULT 'both',
    tags         TEXT DEFAULT '[]',
    upvotes      INTEGER DEFAULT 0,
    fetched_at   TEXT NOT NULL,
    published_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_score      ON items(score DESC);
  CREATE INDEX IF NOT EXISTS idx_fetched_at ON items(fetched_at DESC);
  CREATE INDEX IF NOT EXISTS idx_profile    ON items(profile);
  CREATE INDEX IF NOT EXISTS idx_published  ON items(published_at DESC);
`);

// Migración: añadir category si no existe
try { db.exec(`ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'news'`); } catch (_) {}
// Índice de category después de asegurar que la columna existe
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_category ON items(category)`); } catch (_) {}

function insertItem(item) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items
      (source, source_type, title, url, summary, score, profile, category, tags, upvotes, fetched_at, published_at)
    VALUES
      (@source, @source_type, @title, @url, @summary, @score, @profile, @category, @tags, @upvotes, @fetched_at, @published_at)
  `);
  return stmt.run(item);
}

function getItems({ profile, category, minScore, maxDays, limit, offset, search } = {}) {
  let query = 'SELECT * FROM items WHERE 1=1';
  const params = [];

  if (profile && profile !== 'all') {
    query += ` AND (profile = ? OR profile = 'both')`;
    params.push(profile);
  }
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (minScore) {
    query += ` AND score >= ?`;
    params.push(minScore);
  }
  if (maxDays) {
    query += ` AND (published_at >= datetime('now', '-' || ? || ' days') OR fetched_at >= datetime('now', '-' || ? || ' days'))`;
    params.push(maxDays, maxDays);
  }
  if (search) {
    query += ` AND (title LIKE ? OR summary LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY COALESCE(published_at, fetched_at) DESC, score DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }
  if (offset) {
    query += ' OFFSET ?';
    params.push(offset);
  }

  return db.prepare(query).all(...params);
}

function getStats() {
  return {
    total:       db.prepare('SELECT COUNT(*) as n FROM items').get().n,
    today:       db.prepare("SELECT COUNT(*) as n FROM items WHERE fetched_at >= date('now')").get().n,
    highScore:   db.prepare('SELECT COUNT(*) as n FROM items WHERE score >= 8').get().n,
    business:    db.prepare("SELECT COUNT(*) as n FROM items WHERE category = 'business'").get().n,
    thisWeek:    db.prepare("SELECT COUNT(*) as n FROM items WHERE COALESCE(published_at, fetched_at) >= datetime('now', '-7 days')").get().n,
  };
}

module.exports = { insertItem, getItems, getStats };
