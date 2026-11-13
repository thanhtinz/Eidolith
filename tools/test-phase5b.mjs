// Phase 5b API test: Sanctuary assign/collect (time-travelled accrual),
// NPC side quests (accept -> progress -> claim, guards), boss battles
// (Treant team, guaranteed Core on first daily win, reduced repeat).
import { createRequire } from "node:module";
const require = createRequire(new URL("../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const BASE = "http://127.0.0.1:8787/api/v1";
let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name); } };
const call = async (method, path, token, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};

const email = `p5bx${Date.now()}@test.dev`;
const username = `p5bx${Date.now() % 100000}`;
await call("POST", "/auth/register", null, { email, username, password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
const token = login.json?.data?.accessToken;
check("register + login", !!token);

const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = $1", [username]);
const pid = prof.rows[0].id;
const teamIds = [];
for (const [cid, lv] of [["EID-001", 12], ["EID-002", 12], ["EID-004", 12], ["EID-006", 12], ["EID-011", 12]]) {
  const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
  teamIds.push(r.rows[0].id);
}
const wallet = async () => {
  const w = await call("GET", "/player/wallet", token);
  const d = w.json.data ?? {};
  return { gold: Number(d.gold ?? 0), crystal: Number(d.crystal ?? 0), evolution_core: Number(d.evolutionCore ?? 0), bond_essence: Number(d.bondEssence ?? 0) };
};

/* ------------------------------ Sanctuary ------------------------------ */
let st = await call("GET", "/sanctuary", token);
check("sanctuary state: 7 buildings (v2 + wave 2)", st.status === 200 && st.json.data.buildings.length === 7);
const garden = st.json.data.buildings.find(b => b.id === "bond_garden");
check("bond garden: 3 slots, empty", garden.slots === 3 && garden.assignments.length === 0);

let r = await call("POST", "/sanctuary/assign", token, { buildingId: "bond_garden", creatureInstanceId: teamIds[0] });
check("assign to bond garden", r.status === 200);
r = await call("POST", "/sanctuary/assign", token, { buildingId: "training_ground", creatureInstanceId: teamIds[0] });
check("double assign rejected", r.status === 422);
r = await call("POST", "/sanctuary/assign", token, { buildingId: "evo_shrine", creatureInstanceId: teamIds[1] });
check("assign to locked shrine rejected", r.status === 422);
r = await call("POST", "/sanctuary/assign", token, { buildingId: "training_ground", creatureInstanceId: teamIds[1] });
check("assign to training ground", r.status === 200);

// time travel: 65 minutes of accrual for both assignments
await pg.query("UPDATE sanctuary.assignments SET accrued_from = now() - interval '65 minutes', assigned_at = now() - interval '65 minutes' WHERE player_id = $1", [pid]);
st = await call("GET", "/sanctuary", token);
const g2 = st.json.data.buildings.find(b => b.id === "bond_garden");
const t2 = st.json.data.buildings.find(b => b.id === "training_ground");
check("bond accrued 6 after 65 min (1/10min)", g2.assignments[0]?.accrued === 6);
check("xp accrued 130 after 65 min (2/min)", t2.assignments[0]?.accrued === 130);

const bondBefore = await pg.query("SELECT bond_points, bond_level FROM creatures.creature_instances WHERE id = $1", [teamIds[0]]);
r = await call("POST", "/sanctuary/collect", token, { buildingId: "bond_garden" });
check("collect bond garden: gain 6", r.status === 200 && r.json.data.gains?.[0]?.amount === 6);
const bondAfter = await pg.query("SELECT bond_points, bond_level FROM creatures.creature_instances WHERE id = $1", [teamIds[0]]);
check("bond points applied (5 -> level up, 1 left)",
  Number(bondAfter.rows[0].bond_level) === Number(bondBefore.rows[0].bond_level) + 1 && Number(bondAfter.rows[0].bond_points) === 1);
r = await call("POST", "/sanctuary/collect", token, { buildingId: "bond_garden" });
check("second collect: nothing left", r.status === 200 && (r.json.data.gains?.length ?? 0) === 0);

const xpBefore = await pg.query("SELECT level, experience FROM creatures.creature_instances WHERE id = $1", [teamIds[1]]);
r = await call("POST", "/sanctuary/collect", token, { buildingId: "training_ground" });
check("collect training: gain 130 XP", r.status === 200 && r.json.data.gains?.[0]?.amount === 130);
const xpAfter = await pg.query("SELECT level, experience FROM creatures.creature_instances WHERE id = $1", [teamIds[1]]);
// creatureXpForNext(12) = 540, so +130 XP stays Lv.12 with 130 banked.
check("training XP applied (Lv12, 130 xp banked)",
  Number(xpAfter.rows[0].level) === 12 && Number(xpAfter.rows[0].experience) === Number(xpBefore.rows[0].experience) + 130);

r = await call("POST", "/sanctuary/unassign", token, { creatureInstanceId: teamIds[0] });
check("unassign works", r.status === 200);
r = await call("POST", "/sanctuary/unassign", token, { creatureInstanceId: teamIds[0] });
check("unassign twice rejected", r.status === 404);

/* ----------------------------- Side quests ----------------------------- */
let qs = await call("GET", "/progression/quests", token);
check("quest state has 3 side quests, all available",
  qs.json.data.side?.length === 3 && qs.json.data.side.every(q => q.state === "available"));
r = await call("POST", "/progression/quests/side/side_mira_capture/claim", token, {});
check("claim before accept rejected", r.status === 422);
r = await call("POST", "/progression/quests/side/side_rowan_wins/accept", token, {});
check("accept Rowan quest", r.status === 200 && r.json.data.side.find(q => q.key === "side_rowan_wins")?.state === "active");
r = await call("POST", "/progression/quests/side/side_rowan_wins/accept", token, {});
check("accept twice rejected", r.status === 422);

// Progress only counts after accept, and only WINS count for Rowan: keep
// fighting until 3 wins land (arena outcomes are seed-random). Kael (not
// accepted) must stay at 0 even though battle_played fires meanwhile.
let rowan = null, kael = null;
for (let i = 0; i < 14; i++) {
  const b = await call("POST", "/battles", token, { instanceIds: teamIds });
  if (b.status !== 200) break;
  qs = await call("GET", "/progression/quests", token);
  rowan = qs.json.data.side.find(q => q.key === "side_rowan_wins");
  kael = qs.json.data.side.find(q => q.key === "side_kael_battles");
  if (rowan.state === "complete") break;
}
check("Kael quest untouched before accept", kael.progress === 0 && kael.state === "available");
if (rowan.state === "complete") {
  const w0 = await wallet();
  r = await call("POST", "/progression/quests/side/side_rowan_wins/claim", token, {});
  const w1 = await wallet();
  check("claim Rowan: +60 gold", r.status === 200 && (w1.gold ?? 0) - (w0.gold ?? 0) === 60);
  r = await call("POST", "/progression/quests/side/side_rowan_wins/claim", token, {});
  check("claim twice rejected", r.status === 422);
} else {
  check("Rowan quest completes after 3 wins (<=14 battles)", false);
}

/* ------------------------------- Boss ---------------------------------- */
const wBefore = await wallet();
let boss = await call("POST", "/battles", token, { instanceIds: teamIds, mode: "boss" });
check("boss battle runs", boss.status === 200);
const enemyNames = (boss.json.data?.teams ?? []).filter(u => u.team === 1).map(u => u.name);
check("boss team = Ancient Treant + 2 Pebblit", enemyNames[0] === "Ancient Treant" && enemyNames.filter(n => n === "Pebblit").length === 2);
let guard = 0;
while (boss.json.data?.winner !== 0 && guard < 6) {
  boss = await call("POST", "/battles", token, { instanceIds: teamIds, mode: "boss" });
  guard++;
}
check("boss beaten within 7 tries (Lv12 team)", boss.json.data?.winner === 0);
if (boss.json.data?.winner === 0) {
  check("boss win grants >=1 Evolution Core in rewards", (boss.json.data.rewards?.evolutionCore ?? 0) >= 1);
  const wAfter = await wallet();
  check("core landed in wallet", (wAfter.evolution_core ?? 0) > (wBefore.evolution_core ?? 0));
}

await pg.end();
console.log(`\nPhase 5b: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
