-- Character creation (2026-11-12): appearance chosen at the creation screen.
-- Accounts registered WITH a username already named their character at
-- register (legacy path) and are backfilled as created; email-only accounts
-- get character_created_at NULL and pass through the creation screen once.
ALTER TABLE players.player_profiles ADD COLUMN IF NOT EXISTS hair_style VARCHAR(32);
ALTER TABLE players.player_profiles ADD COLUMN IF NOT EXISTS hair_color VARCHAR(32);
ALTER TABLE players.player_profiles ADD COLUMN IF NOT EXISTS outfit VARCHAR(32);
ALTER TABLE players.player_profiles ADD COLUMN IF NOT EXISTS character_created_at TIMESTAMPTZ;
UPDATE players.player_profiles SET character_created_at = created_at WHERE character_created_at IS NULL;
