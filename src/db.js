const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    summary     TEXT,
    score       INTEGER DEFAULT 0,
    profile     TEXT DEFAULT 'both',
    tags        TEXT DEFAULT '[]',
    upvotes     INTEGER DEFAULT 0,
    fetched_at  TEXT NOT NULL,
    published_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_score      ON items(score DESC);
  CREATE INDEX IF NOT EXISTS idx_fetched_at ON items(fetched_at DESC);
  CREATE INDEX IF NOT EXISTS idx_profile    ON items(profile);
`);

function insertItem(item) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items
      (source, source_type, title, url, summary, score, profile, tags, upvotes, fetched_at, published_at)
    VALUES
      (@source, @source_type, @title, @url, @summary, @score, @profile, @tags, @upvotes, @fetched_at, @published_at)
  `);
  return stmt.run(item);
}

function getItems({ profile, minScore, limit, offset, search } = {}) {
  let query = 'SELECT * FROM items WHERE 1=1';
  const params = [];

  if (profile && profile !== 'all') {
    query += ` AND (profile = ? OR profile = 'both')`;
    params.push(profile);
  }
  if (minScore) {
    query += ` AND score >= ?`;
    params.push(minScore);
  }
  if (search) {
    query += ` AND (title LIKE ? OR summary LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY fetched_at DESC, score DESC';

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
    technical:   db.prepare("SELECT COUNT(*) as n FROM items WHERE profile = 'technical'").get().n,
    nontechnical:db.prepare("SELECT COUNT(*) as n FROM items WHERE profile = 'non-technical'").get().n,
  };
}

module.exports = { insertItem, getItems, getStats };
