// Phase 3 E2E: register -> WS join forest -> wild snapshot -> walk -> start
// encounter -> capture loop -> collection; summon pull + idempotent replay.
// Run from apps/game-server so `ws` resolves:  node ../../tools/test-phase3.mjs
import WebSocket from "ws";

const API = "http://127.0.0.1:8787/api/v1";
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!cond) failures++;
};

const email = `p3x${Date.now()}@test.dev`;
const reg = await fetch(`${API}/auth/register`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, username: `p3x${Date.now() % 100000}`, password: "SecurePass123" }),
});
check("register 201", reg.status === 201);
const login = await (await fetch(`${API}/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "SecurePass123" }),
})).json();
const token = login.data.accessToken;
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const inv0 = await (await fetch(`${API}/inventory`, { headers: H })).json();
const orbs0 = inv0.data.items.find(i => i.itemId === "basic_capture_orb")?.quantity ?? 0;
check("starter orbs = 5", orbs0 === 5, `got ${orbs0}`);
const wallet0 = await (await fetch(`${API}/player/wallet`, { headers: H })).json();
check("starter crystal = 30", wallet0.data.crystal === 30, `got ${wallet0.data.crystal}`);

// ---- WS: join, change to forest, read wilds ----
const ws = new WebSocket("ws://127.0.0.1:8787/ws/v1");
const inbox = [];
let snapshot = null;
ws.on("message", raw => {
  const m = JSON.parse(raw.toString());
  inbox.push(m);
  if (m.type === "world.snapshot") snapshot = m.payload;
});
await new Promise(r => ws.on("open", r));
ws.send(JSON.stringify({ type: "auth.authenticate", payload: { accessToken: token } }));
await sleep(1200);
check("village snapshot", snapshot?.world?.mapId === "meadow_village");
ws.send(JSON.stringify({ type: "world.change_map", payload: { targetMap: "whispering_forest", targetSpawn: "from_village" } }));
await sleep(1500);
check("forest snapshot", snapshot?.world?.mapId === "whispering_forest");
const wilds = snapshot?.wilds ?? [];
check("forest has 4 wilds", wilds.length === 4, `got ${wilds.length}: ${wilds.map(w => w.creatureId).join(",")}`);

// Walk next to the first wild in small steps (anti-teleport ~9 tiles/s).
let me = { x: snapshot.player.x, y: snapshot.player.y };
const target = wilds[0];
const goal = { x: target.x + 1, y: target.y };
while (Math.abs(goal.x - me.x) > 0.1 || Math.abs(goal.y - me.y) > 0.1) {
  const dx = goal.x - me.x, dy = goal.y - me.y;
  const d = Math.hypot(dx, dy), step = Math.min(3, d);
  me = { x: me.x + (dx / d) * step, y: me.y + (dy / d) * step };
  ws.send(JSON.stringify({ type: "world.player.move", payload: { x: me.x, y: me.y } }));
  await sleep(450);
}
await sleep(300);

// ---- Encounter + capture loop ----
let captured = false, orbsUsed = 0, fledCount = 0;
for (let attempt = 0; attempt < 8 && !captured; attempt++) {
  const start = await fetch(`${API}/encounters/start`, { method: "POST", headers: H, body: JSON.stringify({ spawnId: target.spawnId }) });
  const startBody = await start.json();
  if (start.status !== 200) { check("encounter start", false, `${start.status} ${JSON.stringify(startBody.error ?? startBody)}`); break; }
  const encId = startBody.data.encounterId;
  const cap = await fetch(`${API}/encounters/${encId}/capture`, { method: "POST", headers: H, body: JSON.stringify({ captureItemId: "basic_capture_orb" }) });
  const capBody = await cap.json();
  if (cap.status !== 200) { check("capture call", false, `${cap.status} ${JSON.stringify(capBody.error ?? capBody)}`); break; }
  orbsUsed++;
  if (capBody.data.captured) captured = true;
  else if (capBody.data.fled) { fledCount++; break; }
}
check("capture resolved (captured or fled)", captured || fledCount > 0, `orbsUsed=${orbsUsed} captured=${captured} fled=${fledCount}`);
const inv1 = await (await fetch(`${API}/inventory`, { headers: H })).json();
const orbs1 = inv1.data.items.find(i => i.itemId === "basic_capture_orb")?.quantity ?? 0;
check("orbs decremented exactly", orbs0 - orbs1 === orbsUsed, `${orbs0} -> ${orbs1}, used ${orbsUsed}`);
const col = await (await fetch(`${API}/creatures`, { headers: H })).json();
check("collection matches capture", col.data.items.length === (captured ? 1 : 0), `items=${col.data.items.length}`);
if (captured) check("captured creature is the target species", col.data.items[0].creatureId === target.creatureId, col.data.items[0].creatureId);
const removedEvt = inbox.some(m => m.type === "world.wild_removed" && m.payload.spawnId === target.spawnId);
check("wild_removed broadcast received", removedEvt === (captured || fledCount > 0));

// Too-far validation: start an encounter for a far wild without moving.
const far = (snapshot.wilds ?? []).find(w => w.spawnId !== target.spawnId);
if (far && Math.max(Math.abs(far.x - me.x), Math.abs(far.y - me.y)) > 3) {
  const farStart = await fetch(`${API}/encounters/start`, { method: "POST", headers: H, body: JSON.stringify({ spawnId: far.spawnId }) });
  check("too-far encounter rejected 422", farStart.status === 422, `got ${farStart.status}`);
}

// ---- Summoning + idempotency ----
const key = `test-${Date.now()}`;
const pull1 = await fetch(`${API}/summoning/pull`, {
  method: "POST", headers: { ...H, "Idempotency-Key": key },
  body: JSON.stringify({ bannerId: "banner_standard", pullCount: 1 }),
});
const pull1Body = await pull1.json();
check("summon pull 200", pull1.status === 200, JSON.stringify(pull1Body.error ?? ""));
check("summon spent 30 crystal", pull1Body.data?.remainingCrystal === 0, `remaining=${pull1Body.data?.remainingCrystal}`);
const pullReplay = await fetch(`${API}/summoning/pull`, {
  method: "POST", headers: { ...H, "Idempotency-Key": key },
  body: JSON.stringify({ bannerId: "banner_standard", pullCount: 1 }),
});
const pullReplayBody = await pullReplay.json();
check("idempotent replay returns same result", pullReplay.status === 200 &&
  pullReplayBody.data.results[0].creatureId === pull1Body.data.results[0].creatureId &&
  pullReplayBody.data.remainingCrystal === 0);
const pull2 = await fetch(`${API}/summoning/pull`, {
  method: "POST", headers: { ...H, "Idempotency-Key": `test2-${Date.now()}` },
  body: JSON.stringify({ bannerId: "banner_standard", pullCount: 1 }),
});
check("second pull rejected (insufficient crystal)", pull2.status === 422, `got ${pull2.status}`);
const col2 = await (await fetch(`${API}/creatures`, { headers: H })).json();
const expectedTotal = (captured ? 1 : 0) + (pull1Body.data.results[0].isDuplicate ? 0 : 1);
check("collection total consistent", col2.data.items.length === expectedTotal, `items=${col2.data.items.length} expected=${expectedTotal}`);
const stats = await (await fetch(`${API}/player/statistics`, { headers: H })).json();
check("statistics counts", stats.data.capturedEidolons === (captured ? 1 : 0) && stats.data.summonedEidolons === (pull1Body.data.results[0].isDuplicate ? 0 : 1),
  JSON.stringify(stats.data));

ws.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures ? 1 : 0);
