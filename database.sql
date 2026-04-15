-- ============================================================
-- STUDYHUB DATABASE SCHEMA
-- Paste toàn bộ file này vào Supabase SQL Editor > Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  gender        TEXT CHECK (gender IN ('male','female','other')),
  birth_date    DATE,
  avatar_id     INTEGER DEFAULT 1 CHECK (avatar_id BETWEEN 1 AND 20),
  bio           TEXT DEFAULT '',
  xp            INTEGER DEFAULT 0,
  level         INTEGER DEFAULT 1,
  streak        INTEGER DEFAULT 0,
  last_active   TIMESTAMPTZ DEFAULT NOW(),
  is_online     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addressee   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester, addressee)
);

-- VOCABULARY
CREATE TABLE IF NOT EXISTS vocabulary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word         TEXT NOT NULL,
  phonetic     TEXT,
  word_type    TEXT,
  meaning_vi   TEXT NOT NULL,
  definition   TEXT,
  example      TEXT,
  synonyms     TEXT[],
  category     TEXT DEFAULT 'TOEIC',
  srs_level    INTEGER DEFAULT 0 CHECK (srs_level BETWEEN 0 AND 6),
  next_review  TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- LEARNING PROGRESS
CREATE TABLE IF NOT EXISTS learning_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_number      INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  completed       BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  grammar_done    BOOLEAN DEFAULT FALSE,
  vocab_done      BOOLEAN DEFAULT FALSE,
  listening_done  BOOLEAN DEFAULT FALSE,
  reading_done    BOOLEAN DEFAULT FALSE,
  speaking_done   BOOLEAN DEFAULT FALSE,
  time_spent_mins INTEGER DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- FORGETTING TOPICS
CREATE TABLE IF NOT EXISTS forgetting_topics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  subject         TEXT,
  note            TEXT,
  studied_at      TIMESTAMPTZ DEFAULT NOW(),
  review_count    INTEGER DEFAULT 0,
  review_history  TIMESTAMPTZ[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- POMODORO SESSIONS
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_name    TEXT,
  duration_min INTEGER DEFAULT 25,
  phase        TEXT DEFAULT 'pomo',
  completed    BOOLEAN DEFAULT FALSE,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- NOTES
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT DEFAULT '',
  content    TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  doc_type    TEXT DEFAULT 'link' CHECK (doc_type IN ('video','pdf','link','note')),
  subject     TEXT DEFAULT 'Chung',
  url         TEXT,
  description TEXT,
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room       TEXT DEFAULT 'global',
  content    TEXT NOT NULL,
  msg_type   TEXT DEFAULT 'text' CHECK (msg_type IN ('text','emoji','system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GAME ROOMS
CREATE TABLE IF NOT EXISTS game_rooms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code      TEXT UNIQUE NOT NULL,
  mode           TEXT DEFAULT '1v1' CHECK (mode IN ('1v1','battle')),
  status         TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  host_id        UUID REFERENCES profiles(id),
  max_players    INTEGER DEFAULT 2,
  question_count INTEGER DEFAULT 10,
  current_q      INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- GAME PLAYERS
CREATE TABLE IF NOT EXISTS game_players (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score     INTEGER DEFAULT 0,
  answers   INTEGER DEFAULT 0,
  correct   INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- LEADERBOARD CACHE
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  user_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp     INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won    INTEGER DEFAULT 0,
  vocab_count  INTEGER DEFAULT 0,
  study_days   INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS POLICIES ──
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary        ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE forgetting_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert"     ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update"     ON profiles FOR UPDATE USING (true);
CREATE POLICY "vocab_all"           ON vocabulary FOR ALL USING (true);
CREATE POLICY "progress_all"        ON learning_progress FOR ALL USING (true);
CREATE POLICY "forget_all"          ON forgetting_topics FOR ALL USING (true);
CREATE POLICY "pomo_all"            ON pomodoro_sessions FOR ALL USING (true);
CREATE POLICY "notes_all"           ON notes FOR ALL USING (true);
CREATE POLICY "docs_all"            ON documents FOR ALL USING (true);
CREATE POLICY "chat_read"           ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert"         ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "friends_all"         ON friendships FOR ALL USING (true);
CREATE POLICY "game_rooms_all"      ON game_rooms FOR ALL USING (true);
CREATE POLICY "game_players_all"    ON game_players FOR ALL USING (true);
CREATE POLICY "lb_read"             ON leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "lb_write"            ON leaderboard_cache FOR ALL USING (true);

-- ── FUNCTIONS ──
CREATE OR REPLACE FUNCTION create_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leaderboard_cache (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_leaderboard_entry();

CREATE OR REPLACE FUNCTION sync_leaderboard_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leaderboard_cache SET total_xp = NEW.xp, updated_at = NOW() WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_xp_update
  AFTER UPDATE OF xp ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_leaderboard_xp();

CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random()*length(chars)+1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ── INDEXES ──
CREATE INDEX IF NOT EXISTS idx_vocab_user    ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_review  ON vocabulary(next_review);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room     ON chat_messages(room, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_code     ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online, last_active DESC);
CREATE INDEX IF NOT EXISTS idx_lb_xp         ON leaderboard_cache(total_xp DESC);

-- ============================================================
-- DONE! Sau khi chạy xong SQL này:
-- 1. Vào Database > Replication > bật Realtime cho:
--    chat_messages, profiles, game_rooms, game_players
-- 2. Vào Project Settings > API > copy URL và anon key
-- 3. Điền vào file src/services/SupabaseService.js
-- ============================================================

-- ============================================================
-- STUDYHUB v4 ADDITIONS — Paste these after existing schema
-- ============================================================

-- CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed')),
  room_id      UUID REFERENCES game_rooms(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS policies (paste in Supabase SQL editor)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT USING (auth.uid() = requester OR auth.uid() = addressee);
CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT WITH CHECK (auth.uid() = requester);
CREATE POLICY "Addressee can update friendship status"
  ON friendships FOR UPDATE USING (auth.uid() = addressee OR auth.uid() = requester);
CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE USING (auth.uid() = requester OR auth.uid() = addressee);

-- Enable Realtime on necessary tables
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;

-- Add is_public field to documents (run this if upgrading)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public) WHERE is_public = TRUE;

-- RPG stats are stored in localStorage, no DB needed
