// Phase 5 Progression — battle rewards (creature/player XP, bond, gold,
// evolution-core drops) and the quest system (Arc 0 chain + 5 daily
// objectives from Part 10) with claimable rewards.
//
// Balance numbers below are Be's MVP baselines: Parts 9-11 define the
// systems (level cap 50, bond 10 levels, 4 currencies) but no amounts,
// so curves/rates are centralized here for one-place tuning.
import type { PoolClient } from "pg";
import { pool, query } from "./db.js";
import { ApiError } from "./http.js";
import type { BattleRewards, QuestStateResponse, QuestView } from "@eidolith/shared-types";

/* ------------------------------ curves ------------------------------ */
export const creatureXpForNext = (level: number): number => 60 + 40 * level;
export const playerXpForNext = (level: number): number => 100 * level;
export const MAX_LEVEL = 50;
export const BOND_POINTS_PER_LEVEL = 5;
export const MAX_BOND = 10;

/* ------------------------------ quests ------------------------------ */
export type ObjectiveKind = "battle_played" | "battle_won" | "captured" | "summoned";
export interface QuestDef {
  key: string; scope: "arc" | "daily"; title: string; kind: ObjectiveKind;
  target: number; rewards: { currency: string; amount: number }[];
}
export const QUESTS: QuestDef[] = [
  { key: "arc_first_capture", scope: "arc", title: "Bắt Eidolon đầu tiên", kind: "captured", target: 1, rewards: [{ currency: "gold", amount: 50 }] },
  { key: "arc_first_win", scope: "arc", title: "Thắng trận đấu trường đầu tiên", kind: "battle_won", target: 1, rewards: [{ currency: "gold", amount: 30 }] },
  { key: "arc_first_summon", scope: "arc", title: "Triệu hồi lần đầu tiên", kind: "summoned", target: 1, rewards: [{ currency: "crystal", amount: 15 }] },
  { key: "arc_win_10", scope: "arc", title: "Thắng 10 trận đấu trường", kind: "battle_won", target: 10, rewards: [{ currency: "gold", amount: 100 }, { currency: "crystal", amount: 10 }] },
  { key: "daily_win_1", scope: "daily", title: "Thắng 1 trận đấu trường", kind: "battle_won", target: 1, rewards: [{ currency: "gold", amount: 20 }] },
  { key: "daily_win_3", scope: "daily", title: "Thắng 3 trận đấu trường", kind: "battle_won", target: 3, rewards: [{ currency: "gold", amount: 35 }] },
  { key: "daily_battle_5", scope: "daily", title: "Đấu 5 trận hôm nay", kind: "battle_played", target: 5, rewards: [{ currency: "evolution_core", amount: 1 }] },
  { key: "daily_capture_2", scope: "daily", title: "Bắt 2 Eidolon hoang dã", kind: "captured", target: 2, rewards: [{ currency: "gold", amount: 25 }] },
  { key: "daily_summon_1", scope: "daily", title: "Triệu hồi 1 lần", kind: "summoned", target: 1, rewards: [{ currency: "crystal", amount: 10 }] },
];
const questByKey = new Map(QUESTS.map(q => [q.key, q]));

/** Advance every quest (arc + today's dailies) matching an objective kind. */
export async function bumpObjectives(client: PoolClient, playerId: string, kind: ObjectiveKind, n = 1): Promise<void> {
  for (const def of QUESTS) {
    if (def.kind !== kind) continue;
    if (def.scope === "arc") {
      await client.query(
        `INSERT INTO progression.arc_progress (player_id, quest_key, progress) VALUES ($1,$2,$3)
         ON CONFLICT (player_id, quest_key) DO UPDATE SET progress = LEAST(progression.arc_progress.progress + $3, $4)`,
        [playerId, def.key, Math.min(n, def.target), def.target]);
    } else {
      await client.query(
        `INSERT INTO progression.daily_progress (player_id, day, quest_key, progress) VALUES ($1, CURRENT_DATE, $2, $3)
         ON CONFLICT (player_id, day, quest_key) DO UPDATE SET progress = LEAST(progression.daily_progress.progress + $3, $4)`,
        [playerId, def.key, Math.min(n, def.target), def.target]);
    }
  }
}

/* ------------------------------ economy ------------------------------ */
export async function grantCurrency(client: PoolClient, playerId: string, currency: string, amount: number, reason: string): Promise<void> {
  const { rows } = await client.query<{ balance: string }>(
    `INSERT INTO economy.player_wallets (player_id, currency_id, balance) VALUES ($1,$2,$3)
     ON CONFLICT (player_id, currency_id) DO UPDATE SET balance = economy.player_wallets.balance + $3, updated_at = now()
     RETURNING balance`,
    [playerId, currency, amount]);
  await client.query(
    `INSERT INTO economy.currency_transactions (player_id, currency_id, amount, balance_after, reason) VALUES ($1,$2,$3,$4,$5)`,
    [playerId, currency, amount, Number(rows[0].balance), reason]);
}

/* --------------------------- battle rewards --------------------------- */
export async function applyBattleRewards(
  playerId: string, instanceIds: string[], winner: 0 | 1 | 2, avgEnemyLevel: number,
): Promise<BattleRewards> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const creatureXp = winner === 0 ? 40 + 4 * avgEnemyLevel : winner === 2 ? 26 + 2 * avgEnemyLevel : 16 + avgEnemyLevel;
    const levelUps: BattleRewards["levelUps"] = [];
    for (const id of instanceIds) {
      const { rows } = await client.query<{ creature_id: string; level: number; experience: number; bond_level: number; bond_points: number }>(
        `SELECT creature_id, level, experience, bond_level, bond_points FROM creatures.creature_instances WHERE id = $1 AND player_id = $2 FOR UPDATE`,
        [id, playerId]);
      if (!rows.length) continue;
      const r = rows[0];
      // pg returns BIGINT columns as strings — coerce before arithmetic,
      // otherwise `experience += xp` string-concatenates and levels explode.
      let level = Number(r.level), experience = Number(r.experience);
      let bond_level = Number(r.bond_level), bond_points = Number(r.bond_points);
      experience += creatureXp;
      while (level < MAX_LEVEL && experience >= creatureXpForNext(level)) { experience -= creatureXpForNext(level); level++; }
      if (level >= MAX_LEVEL) experience = 0;
      bond_points += 1;
      while (bond_points >= BOND_POINTS_PER_LEVEL && bond_level < MAX_BOND) { bond_points -= BOND_POINTS_PER_LEVEL; bond_level++; }
      if (bond_level >= MAX_BOND) bond_points = Math.min(bond_points, BOND_POINTS_PER_LEVEL - 1);
      await client.query(
        `UPDATE creatures.creature_instances SET level=$1, experience=$2, bond_level=$3, bond_points=$4, updated_at=now() WHERE id=$5`,
        [level, experience, bond_level, bond_points, id]);
      if (level > r.level) levelUps.push({ instanceId: id, creatureId: r.creature_id, level });
    }
    const playerXp = winner === 0 ? 30 : winner === 2 ? 18 : 12;
    const prof = await client.query<{ level: number; experience: number }>(
      `SELECT level, experience FROM players.player_profiles WHERE id = $1 FOR UPDATE`, [playerId]);
    let pLevel = Number(prof.rows[0].level), pXp = Number(prof.rows[0].experience) + playerXp;
    let playerLeveledUp = false;
    while (pLevel < MAX_LEVEL && pXp >= playerXpForNext(pLevel)) { pXp -= playerXpForNext(pLevel); pLevel++; playerLeveledUp = true; }
    if (pLevel >= MAX_LEVEL) pXp = 0;
    await client.query(`UPDATE players.player_profiles SET level=$1, experience=$2, updated_at=now() WHERE id=$3`, [pLevel, pXp, playerId]);
    const gold = winner === 0 ? 34 : winner === 2 ? 20 : 12;
    await grantCurrency(client, playerId, "gold", gold, "battle_reward");
    let evolutionCore = 0;
    if (winner === 0 && Math.random() < 0.25) {
      evolutionCore = 1;
      await grantCurrency(client, playerId, "evolution_core", 1, "battle_reward");
    }
    await bumpObjectives(client, playerId, "battle_played", 1);
    if (winner === 0) await bumpObjectives(client, playerId, "battle_won", 1);
    await client.query("COMMIT");
    return { creatureXp, levelUps, playerXp, playerLevel: pLevel, playerLeveledUp, gold, evolutionCore };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally { client.release(); }
}

/* ------------------------------ quest API ------------------------------ */
export async function questState(playerId: string): Promise<QuestStateResponse> {
  const arcRows = await query<{ quest_key: string; progress: number; claimed_at: string | null }>(
    `SELECT quest_key, progress, claimed_at FROM progression.arc_progress WHERE player_id = $1`, [playerId]);
  const dailyRows = await query<{ quest_key: string; progress: number; claimed_at: string | null; day: string }>(
    `SELECT quest_key, progress, claimed_at, to_char(day, 'YYYY-MM-DD') AS day FROM progression.daily_progress WHERE player_id = $1 AND day = CURRENT_DATE`, [playerId]);
  const dayRow = await query<{ day: string }>(`SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS day`);
  const arcMap = new Map(arcRows.rows.map(r => [r.quest_key, r]));
  const dailyMap = new Map(dailyRows.rows.map(r => [r.quest_key, r]));
  const view = (def: QuestDef, row?: { progress: number; claimed_at: string | null }): QuestView => {
    const progress = row?.progress ?? 0;
    return {
      key: def.key, scope: def.scope, title: def.title, target: def.target, progress,
      complete: progress >= def.target, claimed: Boolean(row?.claimed_at), rewards: def.rewards,
    };
  };
  return {
    day: dayRow.rows[0].day,
    arc: QUESTS.filter(q => q.scope === "arc").map(d => view(d, arcMap.get(d.key))),
    daily: QUESTS.filter(q => q.scope === "daily").map(d => view(d, dailyMap.get(d.key))),
  };
}

export async function claimQuest(playerId: string, scope: string, key: string): Promise<{ rewards: { currency: string; amount: number }[] }> {
  const def = questByKey.get(key);
  if (!def || def.scope !== scope) throw new ApiError(404, "QUEST_NOT_FOUND", "Nhiệm vụ không tồn tại");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const table = scope === "arc" ? "progression.arc_progress" : "progression.daily_progress";
    const dayClause = scope === "arc" ? "" : " AND day = CURRENT_DATE";
    const { rows } = await client.query<{ progress: number; claimed_at: string | null }>(
      `SELECT progress, claimed_at FROM ${table} WHERE player_id = $1 AND quest_key = $2${dayClause} FOR UPDATE`, [playerId, key]);
    const row = rows[0];
    if (!row || row.progress < def.target)
      throw new ApiError(422, "QUEST_NOT_COMPLETE", "Nhiệm vụ chưa hoàn thành");
    if (row.claimed_at)
      throw new ApiError(422, "QUEST_ALREADY_CLAIMED", "Đã nhận thưởng nhiệm vụ này rồi");
    for (const r of def.rewards) await grantCurrency(client, playerId, r.currency, r.amount, "quest_reward");
    await client.query(`UPDATE ${table} SET claimed_at = now() WHERE player_id = $1 AND quest_key = $2${dayClause}`, [playerId, key]);
    await client.query("COMMIT");
    return { rewards: def.rewards };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally { client.release(); }
}
