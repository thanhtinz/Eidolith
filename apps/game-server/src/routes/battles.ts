// Phase 4 Combat — practice battles run ON THE SERVER with the shared
// deterministic combat-core (Part 7 §17): the client only plays back the
// event stream, and the stored replay (seed + teams + events + hash) can be
// re-verified at any time. Balance: packages/combat-core/src/combat-config.ts.
import { Router } from "express";
import { CREATURES } from "@eidolith/game-data";
import { buildUnitInit, runBattle, type BattleUnitInit } from "@eidolith/combat-core";
import type { BattleResponse, BattleTeamUnit } from "@eidolith/shared-types";
import { query } from "../db.js";
import { ApiError, Errors, ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { applyBattleRewards, grantBossBonus } from "../progression.js";

export const battlesRouter = Router();
battlesRouter.use(requireAuth);

const err = (status: number, code: string, message: string) => new ApiError(status, code, message);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}

const toTeamUnit = (u: BattleUnitInit): BattleTeamUnit => ({
  unitId: u.unitId, team: u.team, creatureId: u.creatureId, name: u.name,
  element: u.element, role: u.role, level: u.level, maxHp: u.maxHp,
});

/** Practice opponent: same headcount as the player's team, species drawn
 * from the full roster, level near the player's average. */
/** Species that already have in-game sprites (client CREATURE_SPRITES).
 * Weighted ×3 so practice battles mostly show real art instead of the
 * letter placeholders used for the 13 species still waiting for sprites. */
const SPRITE_SPECIES = new Set(["EID-001", "EID-002", "EID-003", "EID-004", "EID-005", "EID-006", "EID-011"]);
function buildEnemyTeam(count: number, avgLevel: number, rng: () => number): BattleUnitInit[] {
  const pool = CREATURES.flatMap(c => SPRITE_SPECIES.has(c.id) ? [c, c, c] : [c]);
  const picks: string[] = [];
  while (picks.length < count && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    picks.push(pool.splice(idx, 1)[0].id);
  }
  return picks.map((creatureId, i) => {
    const level = Math.max(1, Math.min(50, avgLevel + Math.floor(rng() * 3) - 1));
    return buildUnitInit(`1-${i}`, creatureId, level, 1, i);
  });
}

battlesRouter.post("/battles", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const rawMode = (req.body as { mode?: unknown })?.mode;
    const mode = rawMode === "boss" ? "boss" : rawMode === "friend" ? "friend" : "practice";
    const instanceIds = (req.body as { instanceIds?: unknown })?.instanceIds;
    if (!Array.isArray(instanceIds) || instanceIds.length < 1 || instanceIds.length > 5
      || !instanceIds.every(x => typeof x === "string"))
      throw err(422, "BATTLE_TEAM_INVALID", "Đội hình phải gồm 1–5 Eidolon");
    const { rows } = await query<{ id: string; creature_id: string; level: number }>(
      `SELECT id, creature_id, level FROM creatures.creature_instances WHERE player_id = $1 AND id = ANY($2::uuid[])`,
      [playerId, instanceIds]);
    if (rows.length !== instanceIds.length)
      throw err(422, "BATTLE_TEAM_INVALID", "Có Eidolon không thuộc về bạn hoặc không tồn tại");
    const { rows: expRows } = await query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM sanctuary.expeditions WHERE player_id = $1 AND claimed_at IS NULL AND creature_instance_ids && $2::uuid[]`,
      [playerId, instanceIds]);
    if (Number(expRows[0].n) > 0)
      throw err(422, "BATTLE_TEAM_INVALID", "Có Eidolon đang đi thám hiểm, không thể ra trận");
    const byId = new Map(rows.map(r => [r.id, r]));
    const playerUnits = instanceIds.map((id, i) => {
      const row = byId.get(id)!;
      return buildUnitInit(`0-${i}`, row.creature_id, row.level, 0, i);
    });
    const avgLevel = Math.round(playerUnits.reduce((a, u) => a + u.level, 0) / playerUnits.length);
    const seed = Math.floor(Math.random() * 2 ** 31);
    // Phase 5b boss (Part 3 §45.1): Ancient Treant Lv.18 + 2 Pebblit Lv.10,
    // tuned by simulation — docs/PHASE5B-SANCTUARY-BOSS-SIDEQUESTS-v1.md §2.
    // Phase 6 friendly battle: the enemy is a snapshot of a friend's team
    // (first 5 owned, same convention as the collection panel). No rewards.
    let friendEnemyUnits: ReturnType<typeof buildUnitInit>[] | null = null;
    if (mode === "friend") {
      const opponentPlayerId = (req.body as { opponentPlayerId?: unknown })?.opponentPlayerId;
      if (typeof opponentPlayerId !== "string") throw err(422, "BATTLE_TEAM_INVALID", "Thiếu đối thủ giao hữu");
      const { rows: fr } = await query(
        `SELECT 1 FROM social.friendships WHERE status = 'accepted'
         AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
        [playerId, opponentPlayerId]);
      if (!fr.length) throw err(422, "BATTLE_NOT_FRIENDS", "Chỉ đấu giao hữu được với bạn bè");
      const { rows: opp } = await query<{ creature_id: string; level: number }>(
        `SELECT creature_id, level FROM creatures.creature_instances WHERE player_id = $1 ORDER BY acquired_at DESC LIMIT 5`,
        [opponentPlayerId]);
      if (!opp.length) throw err(422, "BATTLE_TEAM_INVALID", "Đối thủ chưa có Eidolon nào");
      friendEnemyUnits = opp.map((r, i) => buildUnitInit(`1-${i}`, r.creature_id, Number(r.level), 1, i));
    }
    const enemyUnits = mode === "boss"
      ? [buildUnitInit("1-0", "EID-B01", 18, 1, 0),
         buildUnitInit("1-1", "EID-004", 10, 1, 1),
         buildUnitInit("1-2", "EID-004", 10, 1, 2)]
      : friendEnemyUnits ?? buildEnemyTeam(playerUnits.length, avgLevel, Math.random);
    let bossFirstWinToday = false;
    if (mode === "boss") {
      const { rows: prior } = await query<{ n: string }>(
        `SELECT COUNT(*) AS n FROM combat.battles WHERE player_id = $1 AND mode = 'boss' AND winner = 0 AND created_at::date = CURRENT_DATE`,
        [playerId]);
      bossFirstWinToday = Number(prior[0].n) === 0;
    }
    const result = runBattle(seed, [...playerUnits, ...enemyUnits]);
    const playerTeam = playerUnits.map(toTeamUnit);
    const enemyTeam = enemyUnits.map(toTeamUnit);
    const { rows: saved } = await query<{ battle_id: string }>(
      `INSERT INTO combat.battles (player_id, mode, seed, player_team, enemy_team, events, winner, ticks, result_hash)
       VALUES ($1, $9, $2, $3, $4, $5, $6, $7, $8) RETURNING battle_id`,
      [playerId, seed, JSON.stringify(playerTeam), JSON.stringify(enemyTeam),
       JSON.stringify(result.events), result.winner, result.ticks, result.hash, mode]);
    const rewards = mode === "friend" ? undefined
      : await applyBattleRewards(playerId, instanceIds, result.winner, mode === "boss" ? Math.max(avgLevel, 13) : avgLevel);
    if (mode === "boss" && result.winner === 0 && rewards) {
      const bonus = await grantBossBonus(playerId, bossFirstWinToday);
      rewards.gold += bonus.gold;
      rewards.evolutionCore += bonus.evolutionCore;
      rewards.playerXp += bonus.playerXp;
    }
    const payload: BattleResponse = {
      battleId: saved[0].battle_id, seed, winner: result.winner, ticks: result.ticks,
      hash: result.hash, teams: [...playerTeam, ...enemyTeam], events: result.events,
      rewards,
    };
    ok(req, res, payload);
  } catch (e) { next(e); }
});

battlesRouter.get("/battles/:id", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { rows } = await query<{
      battle_id: string; seed: string; player_team: BattleTeamUnit[]; enemy_team: BattleTeamUnit[];
      events: BattleResponse["events"]; winner: number; ticks: number; result_hash: string;
    }>(`SELECT battle_id, seed, player_team, enemy_team, events, winner, ticks, result_hash
        FROM combat.battles WHERE battle_id = $1 AND player_id = $2`, [req.params.id, playerId]);
    if (!rows.length) throw err(404, "BATTLE_NOT_FOUND", "Không tìm thấy trận đấu");
    const b = rows[0];
    ok(req, res, {
      battleId: b.battle_id, seed: Number(b.seed), winner: b.winner as 0 | 1 | 2, ticks: b.ticks, hash: b.result_hash,
      teams: [...b.player_team, ...b.enemy_team], events: b.events,
    } satisfies BattleResponse);
  } catch (e) { next(e); }
});
