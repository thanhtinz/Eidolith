// Sanctuary wave 2 API test: Expedition Gate (requirements, creature lock
// for assignment + battles, time-travel claim, stored rewards) and
// Workshop crafting (costs, inventory output, insufficient funds).
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

const email = `p5dx${Date.now()}@test.dev`;
const username = `p5dx${Date.now() % 100000}`;
await call("POST", "/auth/register", null, { email, username, password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
const token = login.json?.data?.accessToken;
check("register + login", !!token);

const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = $1", [username]);
const pid = prof.rows[0].id;
const ids = {};
for (const [cid, lv] of [["EID-001", 12], ["EID-002", 12], ["EID-003", 12], ["EID-004", 6]]) {
  const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
  ids[cid] = r.rows[0].id;
}
const wallet = async () => (await call("GET", "/player/wallet", token)).json.data;
const exps = async () => (await call("GET", "/sanctuary/expeditions", token)).json.data;

/* ------------------------------ expeditions ------------------------------ */
let st = await exps();
check("3 destinations, none active", st.destinations.length === 3 && st.active.length === 0);
check("destination views carry req fields", st.destinations.find(d => d.id === "crystal_shore")?.needElement === "Tide" && st.destinations.find(d => d.id === "grove_deep")?.minTotalLevel === 30);

let r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "crystal_shore", creatureInstanceIds: [ids["EID-001"]] });
check("crystal without Tide rejected", r.status === 422 && r.json.error.code === "EXPEDITION_REQUIREMENT");
r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "grove_deep", creatureInstanceIds: [ids["EID-004"]] });
check("grove with total level 6 < 30 rejected", r.status === 422 && r.json.error.code === "EXPEDITION_REQUIREMENT");
r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "whisper_edge", creatureInstanceIds: [ids["EID-001"], ids["EID-001"]] });
check("duplicate party member rejected", r.status === 422);
r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "whisper_edge", creatureInstanceIds: [ids["EID-001"]] });
check("whisper start ok", r.status === 200 && !!r.json.data.id);
const expId = r.json.data.id;
st = await exps();
check("active: 1 trip, not ready, rewards hidden", st.active.length === 1 && st.active[0].ready === false && st.active[0].rewards === null);
check("active carries creature names", st.active[0].creatureNames[0] === "Emberling");

r = await call("POST", "/sanctuary/assign", token, { buildingId: "bond_garden", creatureInstanceId: ids["EID-001"] });
check("assign locked while on expedition", r.status === 422 && r.json.error.code === "SANCTUARY_ON_EXPEDITION");
r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "whisper_edge", creatureInstanceIds: [ids["EID-001"]] });
check("second trip with same creature rejected", r.status === 422 && r.json.error.code === "EXPEDITION_CREATURE_BUSY");
r = await call("POST", "/battles", token, { instanceIds: [ids["EID-001"]] });
check("battle locked while on expedition", r.status === 422 && r.json.error.code === "BATTLE_TEAM_INVALID");
r = await call("POST", `/sanctuary/expeditions/${expId}/claim`, token, {});
check("claim before return rejected", r.status === 422 && r.json.error.code === "EXPEDITION_NOT_READY");

await pg.query("UPDATE sanctuary.expeditions SET ends_at = now() - interval '1 minute' WHERE id = $1", [expId]);
st = await exps();
const readyExp = st.active[0];
check("ready after time travel, rewards revealed", readyExp?.ready === true && Array.isArray(readyExp?.rewards) && readyExp.rewards.length === 2);
const goldReward = readyExp.rewards.find(x => x.currency === "gold")?.amount ?? 0;
const essReward = readyExp.rewards.find(x => x.currency === "bond_essence")?.amount ?? 0;
check("whisper rewards in range (gold 40-70, essence 2-4)", goldReward >= 40 && goldReward <= 70 && essReward >= 2 && essReward <= 4);
const wBefore = await wallet();
r = await call("POST", `/sanctuary/expeditions/${expId}/claim`, token, {});
check("claim ok", r.status === 200 && r.json.data.rewards.length === 2);
const wAfter = await wallet();
check("gold + essence landed", Number(wAfter.gold) === Number(wBefore.gold) + goldReward && Number(wAfter.bondEssence) === Number(wBefore.bondEssence ?? 0) + essReward);
r = await call("POST", `/sanctuary/expeditions/${expId}/claim`, token, {});
check("double claim rejected", r.status === 404);
r = await call("POST", "/sanctuary/assign", token, { buildingId: "bond_garden", creatureInstanceId: ids["EID-001"] });
check("assign works again after claim", r.status === 200);
await call("POST", "/sanctuary/unassign", token, { creatureInstanceId: ids["EID-001"] });

r = await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "crystal_shore", creatureInstanceIds: [ids["EID-003"]] });
check("crystal with Tide (Aquafin) starts", r.status === 200);
const exp2 = r.json.data.id;
await pg.query("UPDATE sanctuary.expeditions SET ends_at = now() - interval '1 minute' WHERE id = $1", [exp2]);
const wB2 = await wallet();
r = await call("POST", `/sanctuary/expeditions/${exp2}/claim`, token, {});
const dataGain = r.json.data.rewards.find(x => x.currency === "research_data")?.amount ?? 0;
const wA2 = await wallet();
check("crystal claim grants research data 2-4", r.status === 200 && dataGain >= 2 && dataGain <= 4 && Number(wA2.researchData) === Number(wB2.researchData ?? 0) + dataGain);

/* ------------------------------ workshop ------------------------------ */
await pg.query("UPDATE economy.player_wallets SET balance = 1000 WHERE player_id = $1 AND currency_id = 'gold'", [pid]);
await pg.query("UPDATE economy.player_wallets SET balance = 0 WHERE player_id = $1 AND currency_id = 'bond_essence'", [pid]);
const shop = await call("GET", "/sanctuary/workshop", token);
check("2 recipes; basic affordable, advanced not (no essence)", shop.json.data.recipes.length === 2 && shop.json.data.recipes[0].canAfford === true && shop.json.data.recipes[1].canAfford === false);
const invQty = async item => { const inv = await call("GET", "/inventory", token); return Number(inv.json.data.items.find(i => i.itemId === item)?.quantity ?? 0); };
const basicBefore = await invQty("basic_capture_orb");
r = await call("POST", "/sanctuary/workshop/craft", token, { recipeId: "orb_basic_x3" });
check("craft basic x3 ok", r.status === 200 && r.json.data.qty === 3);
check("inventory +3 basic orbs", (await invQty("basic_capture_orb")) === basicBefore + 3);
check("gold -60 after craft", Number((await wallet()).gold) === 940);
r = await call("POST", "/sanctuary/workshop/craft", token, { recipeId: "orb_advanced" });
check("craft advanced rejected without essence", r.status === 422 && r.json.error.code === "WORKSHOP_INSUFFICIENT");
await pg.query("UPDATE economy.player_wallets SET balance = 5 WHERE player_id = $1 AND currency_id = 'bond_essence'", [pid]);
r = await call("POST", "/sanctuary/workshop/craft", token, { recipeId: "orb_advanced" });
const wEnd = await wallet();
check("craft advanced ok: gold 790, essence 3, orb 1", r.status === 200 && Number(wEnd.gold) === 790 && Number(wEnd.bondEssence) === 3 && (await invQty("advanced_capture_orb")) === 1);

await pg.end();
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
