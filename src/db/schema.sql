CREATE TABLE IF NOT EXISTS saved_items (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'reddit', 'youtube')),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  author TEXT,
  thumbnail TEXT,
  saved_at TEXT,
  raw_content TEXT NOT NULL,
  theme_tags TEXT NOT NULL DEFAULT '[]',
  embedding TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_items_platform ON saved_items(platform);
