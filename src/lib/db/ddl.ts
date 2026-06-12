// Schéma SQL idempotent, exécuté à chaque démarrage.
// Doit rester synchronisé avec schema.ts.
export const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚽',
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  doubles_left INTEGER NOT NULL DEFAULT 4,
  bancos_left INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  tla TEXT NOT NULL DEFAULT '???',
  emblem TEXT,
  group_name TEXT
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id INTEGER UNIQUE,
  stage TEXT NOT NULL,
  group_name TEXT,
  kickoff INTEGER NOT NULL,
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  status TEXT NOT NULL DEFAULT 'TIMED',
  home_score INTEGER,
  away_score INTEGER,
  winner TEXT,
  minute TEXT,
  settled INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  ko_winner_team_id INTEGER,
  boost TEXT NOT NULL DEFAULT 'none',
  points INTEGER,
  breakdown TEXT,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prediction_user_match ON predictions(user_id, match_id);

CREATE TABLE IF NOT EXISTS bonus_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL,
  deadline INTEGER NOT NULL,
  answer TEXT,
  settled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bonus_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES bonus_questions(id),
  answer TEXT NOT NULL,
  points INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bonus_user_question ON bonus_answers(user_id, question_id);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  awarded_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_badge_user ON badges(user_id, badge_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

CREATE TABLE IF NOT EXISTS standings_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_snapshot_day_user ON standings_snapshots(day, user_id);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
