-- DDD Part 5, Phase 1 – Account: users, player_profiles, player_settings, player_sessions, player_progress
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS players;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned','deleted')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS players.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(32) NOT NULL UNIQUE,
  avatar_id VARCHAR(64) NOT NULL DEFAULT 'avatar_default',
  level INTEGER NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  current_region_id VARCHAR(64) NOT NULL DEFAULT 'verdant_plains',
  current_map_id VARCHAR(64) NOT NULL DEFAULT 'meadow_village',
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players.player_settings (
  player_id UUID PRIMARY KEY REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'vi',
  music_volume SMALLINT NOT NULL DEFAULT 80,
  sfx_volume SMALLINT NOT NULL DEFAULT 80,
  graphics_quality VARCHAR(20) NOT NULL DEFAULT 'auto',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players.player_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(128),
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON players.player_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON players.player_sessions(refresh_token_hash);

CREATE TABLE IF NOT EXISTS players.player_progress (
  player_id UUID PRIMARY KEY REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  main_story_stage VARCHAR(64) NOT NULL DEFAULT 'arc_0_awakening',
  tutorial_completed BOOLEAN NOT NULL DEFAULT false,
  unlocked_regions JSONB NOT NULL DEFAULT '["verdant_plains"]',
  unlocked_features JSONB NOT NULL DEFAULT '[]',
  total_playtime_seconds BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
