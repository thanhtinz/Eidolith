-- DDD Part 5 §7 – Economy: currency_types, player_wallets, currency_transactions.
-- MVP currencies per Economy Part 11 §12: Gold, Crystal, Bond Essence, Evolution Core.
CREATE SCHEMA IF NOT EXISTS economy;

CREATE TABLE IF NOT EXISTS economy.currency_types (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_tradeable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO economy.currency_types (id, name, is_premium, is_tradeable) VALUES
  ('gold', 'Gold', false, true),
  ('crystal', 'Crystal', true, false),
  ('bond_essence', 'Bond Essence', false, false),
  ('evolution_core', 'Evolution Core', false, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS economy.player_wallets (
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  currency_id VARCHAR(32) NOT NULL REFERENCES economy.currency_types(id),
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, currency_id)
);

CREATE TABLE IF NOT EXISTS economy.currency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  currency_id VARCHAR(32) NOT NULL REFERENCES economy.currency_types(id),
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  reason VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill: every existing profile gets a wallet row per MVP currency.
INSERT INTO economy.player_wallets (player_id, currency_id, balance)
SELECT p.id, c.id, 0 FROM players.player_profiles p CROSS JOIN economy.currency_types c
ON CONFLICT (player_id, currency_id) DO NOTHING;
