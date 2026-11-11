/* Phase 4 verification: determinism + 1,000-battle balance simulation.
 * Run: npx tsx tools/sim-phase4.ts */
import { BattleEngine, buildUnitInit, runBattle, type BattleUnitInit } from "@eidolith/combat-core";
import { CREATURES, creatureById } from "@eidolith/game-data";
import { SeededRng } from "@eidolith/math-utils";

const team = (ids: string[], level: number, t: 0 | 1): BattleUnitInit[] =>
  ids.map((id, i) => buildUnitInit(`${t}-${i}`, id, level, t, i));

/* --- 1. Determinism --- */
const A = ["EID-001", "EID-004", "EID-006", "EID-011", "EID-002"];
const B = ["EID-003", "EID-005", "EID-010", "EID-014", "EID-018"];
const units = [...team(A, 5, 0), ...team(B, 5, 1)];
const r1 = runBattle(42, units);
const r2 = runBattle(42, units);
const r3 = runBattle(43, units);
console.log("determinism same-seed:", r1.hash === r2.hash ? "PASS" : `FAIL (${r1.hash} vs ${r2.hash})`);
console.log("determinism diff-seed differs:", r1.hash !== r3.hash ? "PASS" : "FAIL");
console.log(`sample battle: winner=${r1.winner} ticks=${r1.ticks} (${(r1.ticks / 10).toFixed(1)}s) events=${r1.events.length} hash=${r1.hash}`);

/* --- 2. Random-team batch --- */
const rng = new SeededRng(20261111);
const all = CREATURES.map(c => c.id);
function randomTeam(t: 0 | 1): BattleUnitInit[] {
  const picks = new Set<string>();
  while (picks.size < 5) picks.add(all[rng.int(0, all.length - 1)]);
  const level = 3 + rng.int(0, 3);
  return [...picks].map((id, i) => buildUnitInit(`${t}-${i}`, id, level, t, i));
}
const N = 1000;
let wins = [0, 0, 0]; let timeouts = 0; let ticksSum = 0;
const tickList: number[] = [];
let ults = 0, reactions = 0, deaths = 0;
for (let i = 0; i < N; i++) {
  const res = runBattle(rng.int(1, 2 ** 31 - 1), [...randomTeam(0), ...randomTeam(1)]);
  wins[res.winner]++;
  ticksSum += res.ticks; tickList.push(res.ticks);
  const done = res.events[res.events.length - 1];
  if (done?.data.reason === "timeout") timeouts++;
  for (const e of res.events) {
    if (e.type === "UnitDefeated") deaths++;
    else if (e.type === "ReactionTriggered") reactions++;
    else if (e.type === "SkillStarted") {
      const name = String(e.data.skill);
      const uid = String(e.data.unitId);
      void name; void uid;
    }
  }
  // count ultimates via SkillStarted on slot-3 names: rebuild name set
}
tickList.sort((a, b) => a - b);
const pct = (p: number) => tickList[Math.min(N - 1, Math.floor(N * p))];
console.log(`\n--- ${N} random 5v5 battles (levels 3–6) ---`);
console.log(`wins team0/team1/draw: ${wins[0]} / ${wins[1]} / ${wins[2]}`);
console.log(`duration avg ${(ticksSum / N / 10).toFixed(1)}s  median ${(pct(0.5) / 10).toFixed(1)}s  p90 ${(pct(0.9) / 10).toFixed(1)}s  max ${(tickList[N - 1] / 10).toFixed(1)}s`);
console.log(`timeouts: ${timeouts} (${(timeouts / N * 100).toFixed(1)}%)  deaths/battle: ${(deaths / N).toFixed(1)}  reactions/battle: ${(reactions / N).toFixed(1)}`);

/* --- 3. Rarity sanity: all-Epic vs all-Common, same level --- */
const byRarity = (r: string) => CREATURES.filter(c => c.rarity === r).map(c => c.id);
const epics = byRarity("Epic").concat(byRarity("Rare")).slice(0, 5);
const commons = byRarity("Common").slice(0, 5);
let epicWins = 0; const M = 100;
for (let i = 0; i < M; i++) {
  const res = runBattle(1000 + i, [...team(epics, 5, 0), ...team(commons, 5, 1)]);
  if (res.winner === 0) epicWins++;
}
console.log(`rarity check: Epic/Rare team beat Common team ${epicWins}/${M} at equal level`);

/* --- 4. Ult usage: count slot-3 casts in the sample battle --- */
const ultNames = new Set([...A, ...B].flatMap(id => {
  const def = creatureById(id)!;
  return [def.skillNames[2]];
}));
const ultCasts = r1.events.filter(e => e.type === "SkillStarted" && ultNames.has(String(e.data.skill))).length;
console.log(`sample battle ultimate casts: ${ultCasts}`);
