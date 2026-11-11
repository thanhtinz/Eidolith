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
    const instanceIds = (req.body as { instanceIds?: unknown })?.instanceIds;
    if (!Array.isArray(instanceIds) || instanceIds.length < 1 || instanceIds.length > 5
      || !instanceIds.every(x => typeof x === "string"))
      throw err(422, "BATTLE_TEAM_INVALID", "Đội hình phải gồm 1–5 Eidolon");
    const { rows } = await query<{ id: string; creature_id: string; level: number }>(
      `SELECT id, creature_id, level FROM creatures.creature_instances WHERE player_id = $1 AND id = ANY($2::uuid[])`,
      [playerId, instanceIds]);
    if (rows.length !== instanceIds.length)
      throw err(422, "BATTLE_TEAM_INVALID", "Có Eidolon không thuộc về bạn hoặc không tồn tại");
    const byId = new Map(rows.map(r => [r.id, r]));
    const playerUnits = instanceIds.map((id, i) => {
      const row = byId.get(id)!;
      return buildUnitInit(`0-${i}`, row.creature_id, row.level, 0, i);
    });
    const avgLevel = Math.round(playerUnits.reduce((a, u) => a + u.level, 0) / playerUnits.length);
    const seed = Math.floor(Math.random() * 2 ** 31);
    const enemyUnits = buildEnemyTeam(playerUnits.length, avgLevel, Math.random);
    const result = runBattle(seed, [...playerUnits, ...enemyUnits]);
    const playerTeam = playerUnits.map(toTeamUnit);
    const enemyTeam = enemyUnits.map(toTeamUnit);
    const { rows: saved } = await query<{ battle_id: string }>(
      `INSERT INTO combat.battles (player_id, mode, seed, player_team, enemy_team, events, winner, ticks, result_hash)
       VALUES ($1, 'practice', $2, $3, $4, $5, $6, $7, $8) RETURNING battle_id`,
      [playerId, seed, JSON.stringify(playerTeam), JSON.stringify(enemyTeam),
       JSON.stringify(result.events), result.winner, result.ticks, result.hash]);
    const payload: BattleResponse = {
      battleId: saved[0].battle_id, seed, winner: result.winner, ticks: result.ticks,
      hash: result.hash, teams: [...playerTeam, ...enemyTeam], events: result.events,
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
