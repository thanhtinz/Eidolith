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
import type { BattleRewards, QuestStateResponse, QuestView, SideQuestView } from "@eidolith/shared-types";

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

/* --------------------------- side quests ------------------------------ */
/** Part 10 side quests (MVP frame + the 3 village NPCs). Part 10 names no
 *  concrete side quests, so these are Bé's, built on the existing objective
 *  kinds; progress counts only AFTER accepting at the NPC. */
export interface SideQuestDef {
  key: string; title: string; npcName: string; npcRole: string;
  giverText: string; progressText: string;
  kind: ObjectiveKind; target: number; rewards: { currency: string; amount: number }[];
}
export const SIDE_QUESTS: SideQuestDef[] = [
  { key: "side_rowan_wins", title: "Lời dạy của trưởng lão", npcName: "Elder Rowan", npcRole: "Trưởng làng",
    giverText: "Đội hình chỉ mạnh khi được thử lửa, Wanderer. Hãy thắng 3 trận đấu trường rồi quay lại gặp ta.",
    progressText: "Đấu trường đang chờ. Thắng đủ 3 trận rồi quay lại đây.",
    kind: "battle_won", target: 3, rewards: [{ currency: "gold", amount: 60 }] },
  { key: "side_mira_capture", title: "Người bạn rừng xanh", npcName: "Mira", npcRole: "Nhà nghiên cứu Resonance",
    giverText: "Ta cần quan sát thêm Eidolon hoang dã ở cự ly gần. Bắt 3 con trong rừng rồi về báo ta nhé.",
    progressText: "Rừng Whispering đang nhiều Eidolon lắm. Bắt đủ 3 con rồi quay lại nhé.",
    kind: "captured", target: 3, rewards: [{ currency: "gold", amount: 40 }, { currency: "crystal", amount: 10 }] },
  { key: "side_kael_battles", title: "Thử thách đầu tiên", npcName: "Kael", npcRole: "Người dẫn đường",
    giverText: "Muốn đi xa thì đừng ngại va chạm. Chơi 5 trận đấu trường — thắng thua không quan trọng — rồi về gặp ta.",
    progressText: "Cứ đấu đủ 5 trận, thắng thua tính sau. Ta chờ ở đây.",
    kind: "battle_played", target: 5, rewards: [{ currency: "evolution_core", amount: 1 }] },
];
const sideByKey = new Map(SIDE_QUESTS.map(q => [q.key, q]));

/** Add bond points to one creature (battle rewards + Sanctuary collect),
 *  rolling points into bond levels with the Phase 5 caps. */
export async function addBondPoints(client: PoolClient, playerId: string, instanceId: string, points: number): Promise<void> {
  if (points <= 0) return;
  const { rows } = await client.query<{ bond_level: number; bond_points: number }>(
    `SELECT bond_level, bond_points FROM creatures.creature_instances WHERE id = $1 AND player_id = $2 FOR UPDATE`, [instanceId, playerId]);
  if (!rows.length) return;
  let bond_level = Number(rows[0].bond_level), bond_points = Number(rows[0].bond_points) + points;
  while (bond_points >= BOND_POINTS_PER_LEVEL && bond_level < MAX_BOND) { bond_points -= BOND_POINTS_PER_LEVEL; bond_level++; }
  if (bond_level >= MAX_BOND) bond_points = Math.min(bond_points, BOND_POINTS_PER_LEVEL - 1);
  await client.query(`UPDATE creatures.creature_instances SET bond_level=$1, bond_points=$2, updated_at=now() WHERE id=$3`, [bond_level, bond_points, instanceId]);
}

/** Grant XP to one creature (Sanctuary training). Returns the new level. */
export async function grantCreatureXp(client: PoolClient, playerId: string, instanceId: string, xp: number): Promise<number | null> {
  if (xp <= 0) return null;
  const { rows } = await client.query<{ level: number; experience: number }>(
    `SELECT level, experience FROM creatures.creature_instances WHERE id = $1 AND player_id = $2 FOR UPDATE`, [instanceId, playerId]);
  if (!rows.length) return null;
  let level = Number(rows[0].level), experience = Number(rows[0].experience) + xp;
  while (level < MAX_LEVEL && experience >= creatureXpForNext(level)) { experience -= creatureXpForNext(level); level++; }
  if (level >= MAX_LEVEL) experience = 0;
  await client.query(`UPDATE creatures.creature_instances SET level=$1, experience=$2, updated_at=now() WHERE id=$3`, [level, experience, instanceId]);
  return level;
}

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
  for (const def of SIDE_QUESTS) {
    if (def.kind !== kind) continue;
    await client.query(
      `UPDATE progression.side_progress SET progress = LEAST(progress + $2, $3)
       WHERE player_id = $1 AND quest_key = $4 AND claimed_at IS NULL`,
      [playerId, n, def.target, def.key]);
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
  const sideRows = await query<{ quest_key: string; progress: number; claimed_at: string | null }>(
    `SELECT quest_key, progress, claimed_at FROM progression.side_progress WHERE player_id = $1`, [playerId]);
  const sideMap = new Map(sideRows.rows.map(r => [r.quest_key, r]));
  const side: SideQuestView[] = SIDE_QUESTS.map(def => {
    const row = sideMap.get(def.key);
    const progress = row?.progress ?? 0;
    const state: SideQuestView["state"] = !row ? "available" : row.claimed_at ? "claimed"
      : progress >= def.target ? "complete" : "active";
    return {
      key: def.key, title: def.title, npcName: def.npcName, npcRole: def.npcRole,
      giverText: def.giverText, progressText: def.progressText,
      target: def.target, progress, state, rewards: def.rewards,
    };
  });
  return {
    day: dayRow.rows[0].day,
    arc: QUESTS.filter(q => q.scope === "arc").map(d => view(d, arcMap.get(d.key))),
    daily: QUESTS.filter(q => q.scope === "daily").map(d => view(d, dailyMap.get(d.key))),
    side,
  };
}

export async function acceptSideQuest(playerId: string, key: string): Promise<void> {
  const def = sideByKey.get(key);
  if (!def) throw new ApiError(404, "QUEST_NOT_FOUND", "Nhiệm vụ không tồn tại");
  const { rows } = await query<{ quest_key: string }>(
    `SELECT quest_key FROM progression.side_progress WHERE player_id = $1 AND quest_key = $2`, [playerId, key]);
  if (rows.length) throw new ApiError(422, "QUEST_ALREADY_ACCEPTED", "Đã nhận nhiệm vụ này rồi");
  await query(`INSERT INTO progression.side_progress (player_id, quest_key) VALUES ($1, $2)`, [playerId, key]);
}

export async function claimSideQuest(playerId: string, key: string): Promise<{ rewards: { currency: string; amount: number }[] }> {
  const def = sideByKey.get(key);
  if (!def) throw new ApiError(404, "QUEST_NOT_FOUND", "Nhiệm vụ không tồn tại");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ progress: number; claimed_at: string | null }>(
      `SELECT progress, claimed_at FROM progression.side_progress WHERE player_id = $1 AND quest_key = $2 FOR UPDATE`, [playerId, key]);
    const row = rows[0];
    if (!row) throw new ApiError(422, "QUEST_NOT_ACCEPTED", "Chưa nhận nhiệm vụ này");
    if (row.claimed_at) throw new ApiError(422, "QUEST_ALREADY_CLAIMED", "Đã nhận thưởng nhiệm vụ này rồi");
    if (row.progress < def.target) throw new ApiError(422, "QUEST_NOT_COMPLETE", "Nhiệm vụ chưa hoàn thành");
    for (const r of def.rewards) await grantCurrency(client, playerId, r.currency, r.amount, "quest_reward");
    await client.query(`UPDATE progression.side_progress SET claimed_at = now() WHERE player_id = $1 AND quest_key = $2`, [playerId, key]);
    await client.query("COMMIT");
    return { rewards: def.rewards };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally { client.release(); }
}

/** Boss clear bonus (Phase 5b): currencies + extra player XP, own tx.
 *  Full reward only for the day's first boss win (anti Core-farming). */
export async function grantBossBonus(playerId: string, firstWinToday: boolean): Promise<{ gold: number; evolutionCore: number; playerXp: number }> {
  const gold = firstWinToday ? 120 : 30;
  const evolutionCore = firstWinToday ? 1 : 0;
  const playerXp = firstWinToday ? 30 : 8;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await grantCurrency(client, playerId, "gold", gold, "boss_reward");
    if (evolutionCore) await grantCurrency(client, playerId, "evolution_core", evolutionCore, "boss_reward");
    const prof = await client.query<{ level: number; experience: number }>(
      `SELECT level, experience FROM players.player_profiles WHERE id = $1 FOR UPDATE`, [playerId]);
    let pLevel = Number(prof.rows[0].level), pXp = Number(prof.rows[0].experience) + playerXp;
    while (pLevel < MAX_LEVEL && pXp >= playerXpForNext(pLevel)) { pXp -= playerXpForNext(pLevel); pLevel++; }
    if (pLevel >= MAX_LEVEL) pXp = 0;
    await client.query(`UPDATE players.player_profiles SET level=$1, experience=$2, updated_at=now() WHERE id=$3`, [pLevel, pXp, playerId]);
    await client.query("COMMIT");
    return { gold, evolutionCore, playerXp };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally { client.release(); }
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
