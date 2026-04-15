-- ============================================================
-- STUDYHUB v7 — Full Database Schema
-- Paste vào Supabase SQL Editor và chạy
-- ============================================================

-- ── EXTENSIONS ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- PROFILES (User accounts)
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

-- VOCABULARY
CREATE TABLE IF NOT EXISTS vocabulary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word         TEXT NOT NULL,
  phonetic     TEXT DEFAULT '',
  word_type    TEXT DEFAULT 'n',
  meaning_vi   TEXT NOT NULL,
  definition   TEXT DEFAULT '',
  example      TEXT DEFAULT '',
  synonyms     TEXT[] DEFAULT '{}',
  category     TEXT DEFAULT 'TOEIC',
  srs_level    INTEGER DEFAULT 0 CHECK (srs_level BETWEEN 0 AND 6),
  next_review  TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- LEARNING PROGRESS (30-day roadmap)
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
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  room       TEXT NOT NULL DEFAULT 'global',
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room, created_at);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addressee  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester, addressee)
);

-- DOCUMENTS (now with is_public)
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  doc_type    TEXT DEFAULT 'link' CHECK (doc_type IN ('video','pdf','link','note')),
  subject     TEXT DEFAULT 'Chung',
  url         TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_public ON documents(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id, created_at DESC);

-- GAME ROOMS
CREATE TABLE IF NOT EXISTS game_rooms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code      TEXT UNIQUE NOT NULL,
  host_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status         TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  mode           TEXT DEFAULT 'battle' CHECK (mode IN ('1v1','battle')),
  question_count INTEGER DEFAULT 10,
  time_per_q     INTEGER DEFAULT 12,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- GAME PLAYERS
CREATE TABLE IF NOT EXISTS game_players (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id  UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score    INTEGER DEFAULT 0,
  answers  INTEGER DEFAULT 0,
  correct  INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- NOTES
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Ghi chú mới',
  content    TEXT DEFAULT '',
  color      TEXT DEFAULT '#ffffff',
  tags       TEXT[] DEFAULT '{}',
  pinned     BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORGETTING TOPICS
CREATE TABLE IF NOT EXISTS forgetting_topics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  subject       TEXT DEFAULT '',
  note          TEXT DEFAULT '',
  studied_at    TIMESTAMPTZ DEFAULT NOW(),
  review_count  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- POMODORO SESSIONS
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_name    TEXT DEFAULT '',
  duration_min INTEGER DEFAULT 25,
  completed    BOOLEAN DEFAULT FALSE,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary         ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE forgetting_topics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions  ENABLE ROW LEVEL SECURITY;

-- Allow all (app handles auth via password_hash)
CREATE POLICY "allow_all_profiles"    ON profiles           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vocab"       ON vocabulary         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_progress"    ON learning_progress  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chat"        ON chat_messages      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_friends"     ON friendships        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_docs"        ON documents          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rooms"       ON game_rooms         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_players"     ON game_players       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notes"       ON notes               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_forgetting"  ON forgetting_topics  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pomodoro"    ON pomodoro_sessions  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ============================================================
-- STORAGE BUCKET (chạy riêng nếu cần)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'chat-images');
-- CREATE POLICY "Auth Upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-images');

-- ============================================================
-- ⚠️ XÓA TOÀN BỘ DỮ LIỆU (NGUY HIỂM — chỉ dùng khi reset)
-- ============================================================
/*
TRUNCATE TABLE pomodoro_sessions  CASCADE;
TRUNCATE TABLE forgetting_topics  CASCADE;
TRUNCATE TABLE notes               CASCADE;
TRUNCATE TABLE game_players        CASCADE;
TRUNCATE TABLE game_rooms          CASCADE;
TRUNCATE TABLE documents           CASCADE;
TRUNCATE TABLE chat_messages       CASCADE;
TRUNCATE TABLE friendships         CASCADE;
TRUNCATE TABLE learning_progress   CASCADE;
TRUNCATE TABLE vocabulary          CASCADE;
TRUNCATE TABLE profiles            CASCADE;
*/

-- ============================================================
-- XÓA 1 USER (thay USER_ID_HERE bằng UUID thực)
-- ============================================================
/*
DO $$
DECLARE uid UUID := 'USER_ID_HERE';
BEGIN
  DELETE FROM pomodoro_sessions  WHERE user_id = uid;
  DELETE FROM forgetting_topics  WHERE user_id = uid;
  DELETE FROM notes               WHERE user_id = uid;
  DELETE FROM game_players        WHERE user_id = uid;
  DELETE FROM documents           WHERE user_id = uid;
  DELETE FROM learning_progress   WHERE user_id = uid;
  DELETE FROM vocabulary          WHERE user_id = uid;
  DELETE FROM friendships WHERE requester = uid OR addressee = uid;
  DELETE FROM profiles            WHERE id = uid;
  RAISE NOTICE 'Deleted user %', uid;
END $$;
*/

-- ============================================================
-- RESET XP & LEVEL (không xóa tài khoản)
-- ============================================================
/*
UPDATE profiles SET xp = 0, level = 1, streak = 0 WHERE id = 'USER_ID_HERE';
*/
