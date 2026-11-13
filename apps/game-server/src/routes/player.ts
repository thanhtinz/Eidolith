import { Router } from "express";
import { isValidDisplayName } from "@eidolith/validation";
import type { CharacterCreateRequest, PlayerProfile, PlayerProgress, PlayerStatistics, PlayerWallet } from "@eidolith/shared-types";
import { pool, query } from "../db.js";
import { ApiError, Errors, ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
export const playerRouter = Router();
playerRouter.use(requireAuth);

interface ProfileRow { id: string; display_name: string; level: number; experience: string; avatar_id: string; current_region_id: string; current_map_id: string; hair_style: string | null; hair_color: string | null; outfit: string | null; character_created_at: string | null; }
async function loadProfile(userId: string): Promise<ProfileRow> {
  const { rows } = await query<ProfileRow>(
    `SELECT id, display_name, level, experience, avatar_id, current_region_id, current_map_id, hair_style, hair_color, outfit, character_created_at FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0];
}
const toProfile = (r: ProfileRow): PlayerProfile => ({
  playerId: r.id, displayName: r.display_name, level: r.level, experience: Number(r.experience),
  avatarId: r.avatar_id, currentRegion: r.current_region_id, currentMap: r.current_map_id,
  characterCreated: r.character_created_at !== null,
  hairStyle: r.hair_style ?? undefined, hairColor: r.hair_color ?? undefined, outfit: r.outfit ?? undefined,
});

playerRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try { ok(req, res, toProfile(await loadProfile(req.userId!))); } catch (e) { next(e); }
});

playerRouter.patch("/me", async (req: AuthedRequest, res, next) => {
  try {
    const profile = await loadProfile(req.userId!);
    const { displayName, avatarId } = req.body as { displayName?: string; avatarId?: string };
    if (displayName !== undefined) {
      if (!isValidDisplayName(displayName)) throw Errors.invalidName();
      const taken = await query(`SELECT id FROM players.player_profiles WHERE lower(display_name)=lower($1) AND id <> $2`, [displayName, profile.id]);
      if (taken.rows.length) throw Errors.nameTaken();
      await query(`UPDATE players.player_profiles SET display_name = $1, updated_at = now() WHERE id = $2`, [displayName.trim(), profile.id]);
    }
    if (avatarId !== undefined) {
      await query(`UPDATE players.player_profiles SET avatar_id = $1, updated_at = now() WHERE id = $2`, [avatarId, profile.id]);
    }
    ok(req, res, toProfile(await loadProfile(req.userId!)));
  } catch (e) { next(e); }
});

/** Character creation (2026-11-12): one-time — sets the display name (name
 *  rule: letters + digits only), gender avatar and appearance. The internal
 *  placeholder username from email-only registration is replaced by the
 *  chosen name so every surface shows the real character name. */
const APPEARANCE: Record<string, { styles: string[]; outfits: string[] }> = {
  wanderer_female: { styles: ["long", "ponytail", "braid", "bun", "bob"], outfits: ["default", "sweater", "shirt", "floral", "coat", "apron"] },
  wanderer_male: { styles: ["messy", "slick", "halfup", "crop", "curly"], outfits: ["default", "sweater", "plaid", "jacket", "vest", "work"] },
};
const HAIR_COLORS = ["brown", "black", "blond", "silver", "red"];
playerRouter.post("/character", async (req: AuthedRequest, res, next) => {
  try {
    const profile = await loadProfile(req.userId!);
    if (profile.character_created_at !== null) throw new ApiError(422, "CHARACTER_ALREADY_CREATED", "Nhân vật đã được tạo");
    const body = req.body as CharacterCreateRequest;
    const name = (body.displayName ?? "").trim();
    if (!isValidDisplayName(name)) throw Errors.invalidName();
    const sets = APPEARANCE[body.avatarId ?? ""];
    if (!sets || !sets.styles.includes(body.hairStyle ?? "") || !sets.outfits.includes(body.outfit ?? "") || !HAIR_COLORS.includes(body.hairColor ?? "")) {
      throw new ApiError(422, "CHARACTER_INVALID", "Diện mạo không hợp lệ");
    }
    const taken = await query(`SELECT id FROM players.player_profiles WHERE lower(display_name)=lower($1) AND id <> $2`, [name, profile.id]);
    if (taken.rows.length) throw Errors.nameTaken();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE players.player_profiles SET display_name = $1, avatar_id = $2, hair_style = $3, hair_color = $4, outfit = $5, character_created_at = now(), updated_at = now() WHERE id = $6`,
        [name, body.avatarId, body.hairStyle, body.hairColor, body.outfit, profile.id]);
      await client.query(`UPDATE auth.users SET username = $1, updated_at = now() WHERE id = $2`, [name, req.userId]);
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    ok(req, res, toProfile(await loadProfile(req.userId!)));
  } catch (e) { next(e); }
});

playerRouter.get("/wallet", async (req: AuthedRequest, res, next) => {
  try {
    const profile = await loadProfile(req.userId!);
    const { rows } = await query<{ currency_id: string; balance: string }>(
      `SELECT currency_id, balance FROM economy.player_wallets WHERE player_id = $1`, [profile.id]);
    const bal = (id: string) => Number(rows.find(r => r.currency_id === id)?.balance ?? 0);
    const wallet: PlayerWallet = { gold: bal("gold"), crystal: bal("crystal"), bondEssence: bal("bond_essence"), evolutionCore: bal("evolution_core"), researchData: bal("research_data") };
    ok(req, res, wallet);
  } catch (e) { next(e); }
});

playerRouter.get("/progress", async (req: AuthedRequest, res, next) => {
  try {
    const profile = await loadProfile(req.userId!);
    const { rows } = await query<{ main_story_stage: string; tutorial_completed: boolean; unlocked_regions: string[]; unlocked_features: string[] }>(
      `SELECT main_story_stage, tutorial_completed, unlocked_regions, unlocked_features FROM players.player_progress WHERE player_id = $1`, [profile.id]);
    const r = rows[0];
    const progress: PlayerProgress = { mainStoryStage: r.main_story_stage, tutorialCompleted: r.tutorial_completed, unlockedRegions: r.unlocked_regions, unlockedFeatures: r.unlocked_features };
    ok(req, res, progress);
  } catch (e) { next(e); }
});

playerRouter.get("/statistics", async (req: AuthedRequest, res, next) => {
  try {
    const profile = await loadProfile(req.userId!);
    const { rows } = await query<{ total_playtime_seconds: string }>(
      `SELECT total_playtime_seconds FROM players.player_progress WHERE player_id = $1`, [profile.id]);
    const counts = await query<{ method: string; n: string }>(
      `SELECT acquired_method AS method, COUNT(*) AS n FROM creatures.creature_instances WHERE player_id = $1 GROUP BY acquired_method`, [profile.id]);
    const byMethod = (m: string) => Number(counts.rows.find(r => r.method === m)?.n ?? 0);
    const stats: PlayerStatistics = {
      totalPlaytimeSeconds: Number(rows[0].total_playtime_seconds), totalBattles: 0, wins: 0, losses: 0,
      capturedEidolons: byMethod("capture"), summonedEidolons: byMethod("summon"), evolutionCount: 0, dungeonCompletions: 0,
    };
    ok(req, res, stats);
  } catch (e) { next(e); }
});
