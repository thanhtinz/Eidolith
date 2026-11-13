// Phase 5 API test: battle rewards (creature/player XP, gold, bond),
// quest progress (arc + daily) and reward claims.
import { createRequire } from "node:module";
const require = createRequire(new URL("../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const BASE = "http://127.0.0.1:8787/api/v1";
let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name); } };
const call = async (method, path, token, body, headers = {}) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};

const email = `p5x${Date.now()}@test.dev`;
const username = `p5x${Date.now() % 100000}`;
const reg = await call("POST", "/auth/register", null, { email, username, password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
const token = login.json?.data?.accessToken;
check("register + login", (reg.status === 201 || reg.status === 200) && !!token);

// seed a 3-creature team directly (capture flow is covered by phase 3 tests)
const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = $1", [username]);
const pid = prof.rows[0].id;
const ids = [];
for (const cid of ["EID-001", "EID-002", "EID-004"]) {
  const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,5,'capture') RETURNING id", [pid, cid]);
  ids.push(r.rows[0].id);
}
await pg.end();
check("team seeded", ids.length === 3);

const q0 = await call("GET", "/progression/quests", token);
check("quest state: 4 arc + 5 daily, all fresh", q0.status === 200 && q0.json.data.arc.length === 4 && q0.json.data.daily.length === 5 && q0.json.data.arc.every(q => q.progress === 0 && !q.claimed));

const wallet0 = await call("GET", "/player/wallet", token);
const battle = await call("POST", "/battles", token, { instanceIds: ids });
const d = battle.json?.data;
check("battle returns rewards", battle.status === 200 && !!d?.rewards && d.rewards.creatureXp > 0 && d.rewards.gold > 0 && d.rewards.playerXp > 0);

// second battle: guards the BIGINT-string regression (XP must ADD, not concatenate)
const battle2 = await call("POST", "/battles", token, { instanceIds: ids });
check("second battle returns rewards", battle2.status === 200 && !!battle2.json?.data?.rewards);
const totalXp = d.rewards.creatureXp + battle2.json.data.rewards.creatureXp;
const curve = (lv) => 60 + 40 * lv;
let expLevel = 5, expRem = totalXp;
while (expRem >= curve(expLevel)) { expRem -= curve(expLevel); expLevel++; }
const creatures = await call("GET", "/creatures", token);
const fought = creatures.json.data.items.filter(i => ids.includes(i.instanceId));
check("creature XP applied to all fighters", fought.every(i => i.experience > 0 || i.level > 5));
check("creature XP adds up exactly across 2 battles (no string concat)", fought.every(i => i.level === expLevel && i.experience === expRem));
check("creatures expose bond level", fought.every(i => typeof i.bondLevel === "number"));

const wallet1 = await call("GET", "/player/wallet", token);
check("gold reward landed in wallet", wallet1.json.data.gold === wallet0.json.data.gold + d.rewards.gold + battle2.json.data.rewards.gold);

const q1 = await call("GET", "/progression/quests", token);
const dailyBattle = q1.json.data.daily.find(q => q.key === "daily_battle_5");
check("daily battle progress = 2/5 after two battles", dailyBattle.progress === 2);
const won = d.winner === 0;
if (won) {
  const dailyWin = q1.json.data.daily.find(q => q.key === "daily_win_1");
  check("daily win complete after victory", dailyWin.complete === true);
  const claim = await call("POST", "/progression/quests/daily/daily_win_1/claim", token, {});
  check("claim daily win pays 20 gold", claim.status === 200 && claim.json.data.rewards[0].amount === 20);
  const wallet2 = await call("GET", "/player/wallet", token);
  check("claim landed in wallet", wallet2.json.data.gold === wallet1.json.data.gold + 20);
  const again = await call("POST", "/progression/quests/daily/daily_win_1/claim", token, {});
  check("double claim rejected", again.status === 422);
} else {
  console.log("SKIP win-path checks (battle not won — rewards still verified)");
}
const early = await call("POST", "/progression/quests/arc/arc_win_10/claim", token, {});
check("claiming an incomplete quest is rejected", early.status === 422);

const pull = await call("POST", "/summoning/pull", token, { bannerId: "banner_standard", pullCount: 1 }, { "Idempotency-Key": crypto.randomUUID() });
check("summon works", pull.status === 200);
const q2 = await call("GET", "/progression/quests", token);
const arcSummon = q2.json.data.arc.find(q => q.key === "arc_first_summon");
check("arc first-summon complete", arcSummon.complete === true);
const claimSummon = await call("POST", "/progression/quests/arc/arc_first_summon/claim", token, {});
check("arc summon claim pays 15 crystal", claimSummon.status === 200);
const wallet3 = await call("GET", "/player/wallet", token);
check("crystal balance = 30 - 30 + 15", wallet3.json.data.crystal === 15);

console.log(`\nPhase 5 API: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
