-- 008_sanctuary_wave2.sql — Sanctuary redesign v2, wave 2 (docs/SANCTUARY-REDESIGN-v2.md §3):
-- Expedition Gate trips (Part 2 §28). Rewards are rolled server-side at
-- departure and stored hidden until the trip is claimed; a creature on an
-- unclaimed expedition is locked out of Sanctuary assignment and battles.
CREATE TABLE IF NOT EXISTS sanctuary.expeditions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id             uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  destination_id        text NOT NULL,
  creature_instance_ids uuid[] NOT NULL,
  started_at            timestamptz NOT NULL DEFAULT now(),
  ends_at               timestamptz NOT NULL,
  rewards               jsonb NOT NULL DEFAULT '[]'::jsonb,
  claimed_at            timestamptz
);
CREATE INDEX IF NOT EXISTS expeditions_player_active_idx
  ON sanctuary.expeditions (player_id) WHERE claimed_at IS NULL;
