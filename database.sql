-- ══════════════════════════════════════════════════════
-- STUDYHUB — Database Schema (Complete & Clean)
-- Dán vào Supabase → SQL Editor → Run All
-- ══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Xóa bảng cũ (chạy khi cài lại từ đầu) ────────────
DROP TABLE IF EXISTS pomodoro_sessions  CASCADE;
DROP TABLE IF EXISTS forgetting_topics  CASCADE;
DROP TABLE IF EXISTS notes              CASCADE;
DROP TABLE IF EXISTS game_players       CASCADE;
DROP TABLE IF EXISTS game_rooms         CASCADE;
DROP TABLE IF EXISTS documents          CASCADE;
DROP TABLE IF EXISTS chat_messages      CASCADE;
DROP TABLE IF EXISTS friendships        CASCADE;
DROP TABLE IF EXISTS learning_progress  CASCADE;
DROP TABLE IF EXISTS vocabulary         CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

-- ── PROFILES ──────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  gender        TEXT DEFAULT 'other' CHECK (gender IN ('male','female','other')),
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

-- ── VOCABULARY ────────────────────────────────────────
CREATE TABLE vocabulary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word         TEXT NOT NULL,
  phonetic     TEXT DEFAULT '',
  word_type    TEXT DEFAULT 'n',
  meaning_vi   TEXT NOT NULL DEFAULT '',
  definition   TEXT DEFAULT '',
  example      TEXT DEFAULT '',
  synonyms     TEXT[] DEFAULT '{}',
  category     TEXT DEFAULT 'TOEIC',
  srs_level    INTEGER DEFAULT 0 CHECK (srs_level BETWEEN 0 AND 6),
  next_review  TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vocab_user   ON vocabulary(user_id);
CREATE INDEX idx_vocab_review ON vocabulary(user_id, next_review);

-- ── LEARNING PROGRESS ─────────────────────────────────
CREATE TABLE learning_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ── CHAT MESSAGES ─────────────────────────────────────
CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT DEFAULT '',
  room       TEXT NOT NULL DEFAULT 'global',
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_room ON chat_messages(room, created_at DESC);

-- ── FRIENDSHIPS ───────────────────────────────────────
CREATE TABLE friendships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester, addressee)
);

-- ── DOCUMENTS ─────────────────────────────────────────
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  doc_type    TEXT DEFAULT 'link' CHECK (doc_type IN ('video','pdf','link','note')),
  subject     TEXT DEFAULT 'Chung',
  url         TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_docs_user   ON documents(user_id, created_at DESC);
CREATE INDEX idx_docs_public ON documents(is_public, created_at DESC) WHERE is_public = TRUE;

-- ── GAME ROOMS ────────────────────────────────────────
CREATE TABLE game_rooms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code      TEXT UNIQUE NOT NULL,
  host_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status         TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  mode           TEXT DEFAULT 'battle' CHECK (mode IN ('1v1','battle')),
  question_count INTEGER DEFAULT 10,
  time_per_q     INTEGER DEFAULT 12,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rooms_status ON game_rooms(status, created_at DESC);

-- ── GAME PLAYERS ──────────────────────────────────────
CREATE TABLE game_players (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score     INTEGER DEFAULT 0,
  answers   INTEGER DEFAULT 0,
  correct   INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ── NOTES ─────────────────────────────────────────────
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT DEFAULT 'Ghi chú mới',
  content    TEXT DEFAULT '',
  color      TEXT DEFAULT '#ffffff',
  tags       TEXT[] DEFAULT '{}',
  pinned     BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FORGETTING TOPICS ─────────────────────────────────
CREATE TABLE forgetting_topics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  subject      TEXT DEFAULT '',
  note         TEXT DEFAULT '',
  studied_at   TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── POMODORO SESSIONS ─────────────────────────────────
CREATE TABLE pomodoro_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_name    TEXT DEFAULT '',
  duration_min INTEGER DEFAULT 25,
  completed    BOOLEAN DEFAULT FALSE,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (open — app handles auth)
-- ══════════════════════════════════════════════════════
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','vocabulary','learning_progress','chat_messages','friendships',
    'documents','game_rooms','game_players','notes','forgetting_topics','pomodoro_sessions'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "open_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════
-- REALTIME
-- ══════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ══════════════════════════════════════════════════════
-- ⚠️  XÓA TOÀN BỘ DỮ LIỆU (uncommment để dùng)
-- ══════════════════════════════════════════════════════
/*
TRUNCATE TABLE pomodoro_sessions, forgetting_topics, notes, game_players,
  game_rooms, documents, chat_messages, friendships,
  learning_progress, vocabulary, profiles CASCADE;
*/

-- ══════════════════════════════════════════════════════
-- XÓA 1 USER (thay UUID_CỦA_USER)
-- ══════════════════════════════════════════════════════
/*
DO $$ DECLARE uid UUID := 'UUID_CỦA_USER';
BEGIN
  DELETE FROM pomodoro_sessions WHERE user_id = uid;
  DELETE FROM forgetting_topics  WHERE user_id = uid;
  DELETE FROM notes               WHERE user_id = uid;
  DELETE FROM game_players        WHERE user_id = uid;
  DELETE FROM documents           WHERE user_id = uid;
  DELETE FROM learning_progress   WHERE user_id = uid;
  DELETE FROM vocabulary          WHERE user_id = uid;
  DELETE FROM friendships WHERE requester = uid OR addressee = uid;
  DELETE FROM profiles WHERE id = uid;
  RAISE NOTICE 'Đã xóa user %', uid;
END $$;
*/

-- ══════════════════════════════════════════════════════
-- RESET XP/LEVEL (không xóa tài khoản)
-- ══════════════════════════════════════════════════════
/*
UPDATE profiles SET xp = 0, level = 1, streak = 0 WHERE id = 'UUID_CỦA_USER';
*/
