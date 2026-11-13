// Evolution API test (approved EVOLUTION-DRAFT-v1): level gate, branch
// validation, core spend, state preservation, busy locks, evolved forms
// in battle, shrine unlock state.
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

const email = `evox${Date.now()}@test.dev`;
const username = `evox${Date.now() % 100000}`;
await call("POST", "/auth/register", null, { email, username, password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
const token = login.json?.data?.accessToken;
check("register + login", !!token);

const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = $1", [username]);
const pid = prof.rows[0].id;
const ids = {};
for (const [cid, lv] of [["EID-001", 16], ["EID-002", 15], ["EID-003", 20]]) {
  const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
  ids[cid] = r.rows[0].id;
}
// Consistent post-rollover state: 7 lifetime points = bond_level 1 + 2 remainder.
await pg.query("UPDATE creatures.creature_instances SET bond_level = 1, bond_points = 2, experience = 123 WHERE id = $1", [ids["EID-001"]]);
const setCores = n => pg.query(
  `INSERT INTO economy.player_wallets (player_id, currency_id, balance) VALUES ($1,'evolution_core',$2)
   ON CONFLICT (player_id, currency_id) DO UPDATE SET balance = $2`, [pid, n]);
await setCores(1);
const wallet = async () => (await call("GET", "/player/wallet", token)).json.data;
const owned = async () => (await call("GET", "/creatures", token)).json.data.items;
const evolve = (inst, targetId) => call("POST", `/creatures/${inst}/evolve`, token, { targetId });

let r = await evolve(ids["EID-002"], "EID-024");
check("Lv.15 blocked by level gate", r.status === 422 && r.json.error.code === "EVOLUTION_LEVEL");
r = await evolve(ids["EID-001"], "EID-024");
check("branch of another species rejected", r.status === 422 && r.json.error.code === "EVOLUTION_TARGET_INVALID");
r = await evolve(ids["EID-001"], "EID-022");
check("evolve Emberling -> Cinderguard ok", r.status === 200 && r.json.data.toCreatureId === "EID-022");
const mine = await owned();
const evolved = mine.find(i => i.instanceId === ids["EID-001"]);
check("instance now Cinderguard, level/XP/bond preserved", evolved?.creatureId === "EID-022" && evolved?.name === "Cinderguard" && evolved?.level === 16 && evolved?.experience === 123 && evolved?.bondLevel === 1);
check("core spent 1 -> 0", Number((await wallet()).evolutionCore) === 0);
r = await evolve(ids["EID-001"], "EID-021");
check("already-evolved form cannot evolve again", r.status === 422 && r.json.error.code === "EVOLUTION_NOT_AVAILABLE");
r = await evolve(ids["EID-003"], "EID-026");
check("no core -> rejected", r.status === 422 && r.json.error.code === "EVOLUTION_NO_CORE");
await setCores(1);
r = await call("POST", "/sanctuary/assign", token, { buildingId: "training_ground", creatureInstanceId: ids["EID-003"] });
check("assign Aquafin to training", r.status === 200);
r = await evolve(ids["EID-003"], "EID-026");
check("assigned creature blocked from evolving", r.status === 422 && r.json.error.code === "EVOLUTION_BUSY");
await call("POST", "/sanctuary/unassign", token, { creatureInstanceId: ids["EID-003"] });
r = await evolve(ids["EID-003"], "EID-026");
check("evolve Aquafin -> Tideray ok after unassign", r.status === 200);
r = await call("POST", "/battles", token, { instanceIds: [ids["EID-001"], ids["EID-003"]] });
check("battle accepts evolved forms", r.status === 200 && !!r.json.data.battleId);
const log = await pg.query("SELECT from_creature_id, to_creature_id FROM progression.evolution_log WHERE player_id = $1 ORDER BY created_at", [pid]);
check("evolution log has both evolutions", log.rows.length === 2 && log.rows[0].to_creature_id === "EID-022" && log.rows[1].to_creature_id === "EID-026");
const sanc = await call("GET", "/sanctuary", token);
check("shrine unlocked as info card kind", sanc.json.data.buildings.find(b => b.id === "evo_shrine")?.kind === "shrine");

await pg.end();
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
