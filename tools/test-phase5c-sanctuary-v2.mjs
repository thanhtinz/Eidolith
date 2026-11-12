// Sanctuary redesign v2 phase 1 API test: building levels + Hall gate +
// upgrade costs (Gold / Research Data), element/role synergy +20%,
// Research Lab accrual, collect-all totals.
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

const email = `p5c_${Date.now()}@test.dev`;
const username = `p5c_${Date.now() % 100000}`;
await call("POST", "/auth/register", null, { email, username, password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
const token = login.json?.data?.accessToken;
check("register + login", !!token);

const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = $1", [username]);
const pid = prof.rows[0].id;
const ids = {};
for (const [cid, lv] of [["EID-002", 8], ["EID-001", 8], ["EID-006", 8]]) {
  const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
  ids[cid] = r.rows[0].id;
}
const wallet = async () => (await call("GET", "/player/wallet", token)).json.data;
const sanc = async () => (await call("GET", "/sanctuary", token)).json.data;
const bld = (st, id) => st.buildings.find(b => b.id === id);

/* ------------------------------ state ------------------------------ */
let st = await sanc();
check("5 buildings incl research_lab", st.buildings.length === 5 && !!bld(st, "research_lab"));
check("hallLevel 1, cap 8h", st.hallLevel === 1 && st.capHours === 8);
check("lab: kind data, 2 slots", bld(st, "research_lab").kind === "data" && bld(st, "research_lab").slots === 2);
check("totals zero, researchData 0", st.totals.bond === 0 && st.totals.xp === 0 && st.totals.data === 0 && st.researchData === 0);
check("garden upgrade view: 150 gold to Lv.2, not hall-blocked at Lv.1->2? (blocked: 2 > hall 1)", bld(st, "bond_garden").upgrade?.gold === 150 && bld(st, "bond_garden").upgrade?.blockedByHall === true);

/* ------------------------------ upgrades ------------------------------ */
let r = await call("POST", "/sanctuary/buildings/training_ground/upgrade", token, {});
check("training upgrade blocked by hall gate", r.status === 422 && r.json.error.code === "SANCTUARY_HALL_GATE");
r = await call("POST", "/sanctuary/buildings/main_hall/upgrade", token, {});
check("hall upgrade to Lv.2 costs 300 (500 -> 200)", r.status === 200 && r.json.data.level === 2 && r.json.data.gold === 200);
r = await call("POST", "/sanctuary/buildings/training_ground/upgrade", token, {});
check("training upgrade to Lv.2 costs 150 (200 -> 50)", r.status === 200 && r.json.data.level === 2 && r.json.data.gold === 50);
st = await sanc();
check("training slots now 3, cap now 10h", bld(st, "training_ground").slots === 3 && st.capHours === 10);
r = await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {});
check("garden upgrade rejected: insufficient gold (50 < 150)", r.status === 422 && r.json.error.code === "INSUFFICIENT_GOLD");
r = await call("POST", "/sanctuary/buildings/evo_shrine/upgrade", token, {});
check("shrine upgrade rejected (locked)", r.status === 422);

/* ------------------------------ synergy accrual ------------------------------ */
check("assign Mossling -> garden", (await call("POST", "/sanctuary/assign", token, { buildingId: "bond_garden", creatureInstanceId: ids["EID-002"] })).status === 200);
check("assign Glowmoth -> lab", (await call("POST", "/sanctuary/assign", token, { buildingId: "research_lab", creatureInstanceId: ids["EID-006"] })).status === 200);
check("assign Emberling -> training", (await call("POST", "/sanctuary/assign", token, { buildingId: "training_ground", creatureInstanceId: ids["EID-001"] })).status === 200);
await pg.query("UPDATE sanctuary.assignments SET accrued_from = now() - interval '65 minutes', assigned_at = now() - interval '65 minutes' WHERE player_id = $1", [pid]);
st = await sanc();
const gA = bld(st, "bond_garden").assignments[0];
const lA = bld(st, "research_lab").assignments[0];
const tA = bld(st, "training_ground").assignments[0];
check("garden synergy flag on Mossling (Grove/Support)", gA?.synergy === true);
check("garden accrued 7 (65m x 1/10 x 1.2 = 7.8)", gA?.accrued === 7);
check("lab accrued 1 Data (65m x 1/60 x 1.2)", lA?.accrued === 1 && lA?.synergy === true);
check("training accrued 156 (65m x 2 x 1.2 Striker)", tA?.accrued === 156 && tA?.synergy === true);
check("totals bond 7 / xp 156 / data 1", st.totals.bond === 7 && st.totals.xp === 156 && st.totals.data === 1);
check("progress01/nextUnitInSec present", typeof gA?.progress01 === "number" && gA.nextUnitInSec > 0);

/* ------------------------------ collect-all ------------------------------ */
r = await call("POST", "/sanctuary/collect-all", token, {});
check("collect-all totals", r.status === 200 && r.json.data.totals.bond === 7 && r.json.data.totals.xp === 156 && r.json.data.totals.data === 1);
const w = await wallet();
check("wallet researchData = 1", Number(w.researchData) === 1);
const bp = await pg.query("SELECT bond_points, bond_level FROM creatures.creature_instances WHERE id = $1", [ids["EID-002"]]);
check("Mossling bond after collect: 7 points = Lv.1 + 2 remainder (5/level)", Number(bp.rows[0].bond_level) === 1 && Number(bp.rows[0].bond_points) === 2);
st = await sanc();
check("totals cleared after collect-all", st.totals.bond === 0 && st.totals.xp === 0 && st.totals.data === 0);

/* ------------------------------ data-priced upgrade ------------------------------ */
await pg.query("UPDATE economy.player_wallets SET balance = 5000 WHERE player_id = $1 AND currency_id = 'gold'", [pid]);
await pg.query("UPDATE economy.player_wallets SET balance = 25 WHERE player_id = $1 AND currency_id = 'research_data'", [pid]);
r = await call("POST", "/sanctuary/buildings/main_hall/upgrade", token, {});
check("hall to Lv.3 costs 600", r.status === 200 && r.json.data.level === 3 && r.json.data.gold === 4400);
r = await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {});
check("garden to Lv.2 costs 150", r.status === 200 && r.json.data.level === 2 && r.json.data.gold === 4250);
r = await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {});
check("garden to Lv.3 costs 400", r.status === 200 && r.json.data.level === 3 && r.json.data.gold === 3850);
r = await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {});
check("garden to Lv.4 blocked until hall Lv.4", r.status === 422 && r.json.error.code === "SANCTUARY_HALL_GATE");
r = await call("POST", "/sanctuary/buildings/main_hall/upgrade", token, {});
check("hall to Lv.4 costs 1200 gold + 10 data", r.status === 200 && r.json.data.level === 4 && r.json.data.gold === 2650 && r.json.data.researchData === 15);
r = await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {});
check("garden to Lv.4 costs 900 gold + 10 data", r.status === 200 && r.json.data.level === 4 && r.json.data.gold === 1750 && r.json.data.researchData === 5);
st = await sanc();
check("garden Lv.4 has 4 slots", bld(st, "bond_garden").slots === 4);

await pg.end();
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
