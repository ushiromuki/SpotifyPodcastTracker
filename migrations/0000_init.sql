-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spotify_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry INTEGER NOT NULL
);

-- Create podcast_shows table
CREATE TABLE IF NOT EXISTS podcast_shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spotify_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create played_episodes table
CREATE TABLE IF NOT EXISTS played_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spotify_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  played_at INTEGER NOT NULL,
  show_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (show_id) REFERENCES podcast_shows(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
