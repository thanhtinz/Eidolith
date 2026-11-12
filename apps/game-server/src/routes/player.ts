import { Router } from "express";
import { isValidDisplayName } from "@eidolith/validation";
import type { PlayerProfile, PlayerProgress, PlayerStatistics, PlayerWallet } from "@eidolith/shared-types";
import { query } from "../db.js";
import { Errors, ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
export const playerRouter = Router();
playerRouter.use(requireAuth);

interface ProfileRow { id: string; display_name: string; level: number; experience: string; avatar_id: string; current_region_id: string; current_map_id: string; }
async function loadProfile(userId: string): Promise<ProfileRow> {
  const { rows } = await query<ProfileRow>(
    `SELECT id, display_name, level, experience, avatar_id, current_region_id, current_map_id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0];
}
const toProfile = (r: ProfileRow): PlayerProfile => ({
  playerId: r.id, displayName: r.display_name, level: r.level, experience: Number(r.experience),
  avatarId: r.avatar_id, currentRegion: r.current_region_id, currentMap: r.current_map_id,
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
