-- RamzNews Gen 2 Database Schema
-- This schema defines the tables for the Cloudflare D1 database

-- Posts table for tracking all processed posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  original_link TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  telegram_message_id TEXT
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Create index on source for filtering by source
CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);

-- Create index on category for content analysis
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Sources table for tracking RSS feed sources
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  category TEXT,
  last_fetch_at TEXT,
  fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Stats table for analytics
CREATE TABLE IF NOT EXISTS stats (
  date TEXT PRIMARY KEY,
  total_fetched INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  fetch_errors INTEGER DEFAULT 0,
  process_errors INTEGER DEFAULT 0,
  send_errors INTEGER DEFAULT 0
);

-- Insert default sources
INSERT OR IGNORE INTO sources (name, url, category, created_at) VALUES
  ('BBC Persian', 'https://www.bbc.com/persian/iran/rss.xml', 'news', datetime('now')),
  ('DW Persian', 'https://rss.dw.com/rdf/rss-per-iran', 'news', datetime('now')),
  ('Euronews Persian', 'https://per.euronews.com/rss', 'news', datetime('now')),
  ('Ramzarz News', 'https://ramzarz.news/feed/', 'crypto', datetime('now')),
  ('Arz Digital', 'https://arzdigital.com/feed/', 'crypto', datetime('now')); 