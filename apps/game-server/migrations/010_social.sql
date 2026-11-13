-- 010_social.sql — Phase 6 wave 1 (docs/PHASE6-MULTIPLAYER-v1.md):
-- friendships + moderated zone chat log (Part 12 MVP).
CREATE SCHEMA IF NOT EXISTS social;
CREATE TABLE IF NOT EXISTS social.friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON social.friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON social.friendships (requester_id, status);
CREATE TABLE IF NOT EXISTS social.chat_messages (
  id         bigserial PRIMARY KEY,
  player_id  uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  channel    text NOT NULL DEFAULT 'zone',
  map_id     text,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_recent_idx ON social.chat_messages (created_at DESC);
