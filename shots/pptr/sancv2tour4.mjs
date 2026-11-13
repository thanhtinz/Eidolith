// Sanctuary wave-2 tour (DB was rebuilt, so re-register + re-seed):
// expedition card with an active trip, expedition picker for Crystal
// Shore, ready-to-claim state after time travel, workshop card.
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = "http://127.0.0.1:8787/api/v1";
const call = async (m, p, t, b) => {
  const r = await fetch(BASE + p, { method: m, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};

/* ---------- prep ---------- */
await call("POST", "/auth/register", null, { email: "tour5@test.dev", username: "tourfive", password: "SecurePass123" });
const login = await call("POST", "/auth/login", null, { email: "tour5@test.dev", password: "SecurePass123" });
const token = login.json?.data?.accessToken;
if (!token) { console.log("login failed"); process.exit(1); }
const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = 'tourfive'");
const pid = prof.rows[0].id;
await pg.query("UPDATE economy.player_wallets SET balance = 2000 WHERE player_id = $1 AND currency_id = 'gold'", [pid]);
await pg.query("UPDATE economy.player_wallets SET balance = 6 WHERE player_id = $1 AND currency_id = 'bond_essence'", [pid]);
const existing = await pg.query("SELECT creature_id, id FROM creatures.creature_instances WHERE player_id = $1", [pid]);
const have = Object.fromEntries(existing.rows.map(r => [r.creature_id, r.id]));
for (const [cid, lv] of [["EID-001", 9], ["EID-002", 5], ["EID-003", 7], ["EID-004", 6], ["EID-011", 11]]) {
  if (!have[cid]) {
    const r = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
    have[cid] = r.rows[0].id;
  }
}
const st0 = (await call("GET", "/sanctuary", token)).json.data;
const assigned = new Set(st0.buildings.flatMap(b => b.assignments.map(a => a.instanceId)));
if (!assigned.has(have["EID-011"])) console.log("assign garden:", (await call("POST", "/sanctuary/assign", token, { buildingId: "bond_garden", creatureInstanceId: have["EID-011"] })).status);
const exps0 = (await call("GET", "/sanctuary/expeditions", token)).json.data;
if (!exps0.active.length) console.log("start whisper:", (await call("POST", "/sanctuary/expeditions/start", token, { destinationId: "whisper_edge", creatureInstanceIds: [have["EID-002"]] })).status);
await pg.query("UPDATE sanctuary.assignments SET accrued_from = now() - interval '65 minutes' WHERE player_id = $1", [pid]);
await pg.end();
console.log("prep done");

/* ---------- browser ---------- */
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 160)));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
  await page.type("#f-email", "tour5@test.dev"); await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit"); console.log("logged in");
}
await sleep(12000);
for (let i = 0; i < 8; i++) {
  const n = await page.evaluate(() => document.querySelectorAll(".pmini").length);
  if (n >= 5) break; await sleep(2500);
}
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const domClick = sel => ev(s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
const waitFor = async (fn, tries = 12, gap = 2000) => { for (let i = 0; i < tries; i++) { if (await ev(fn)) return true; await sleep(gap); } return false; };
const openSanctuary = async () => {
  await domClick("#hub-navtoggle"); await sleep(700);
  await domClick('.hub-nav button[data-tab="sanctuary"]');
  return waitFor(() => document.querySelectorAll(".s2-b").length >= 5);
};
const scrollToCard = name => ev(n => {
  const card = [...document.querySelectorAll(".s2-b")].find(c => c.textContent.includes(n));
  if (card) { card.scrollIntoView({ block: "start" }); return true; } return false;
}, name);

console.log("panel open:", await openSanctuary());
await sleep(1000);
await scrollToCard("Cổng thám hiểm"); await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-expedition.png" });
console.log("expedition card shot");
// picker for crystal shore
await domClick('[data-exp-pick="crystal_shore"]'); await sleep(1000);
await ev(() => { const r = document.querySelector('[data-exp-sel]'); if (r) r.click(); });
await sleep(500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-exp-picker.png" });
console.log("exp picker shot");
await domClick("#exp-back"); await sleep(800);
await scrollToCard("Xưởng chế tạo"); await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-workshop.png" });
console.log("workshop shot");
// time-travel the active trip to ready, reopen panel, screenshot claim state
const pg2 = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg2.connect();
await pg2.query("UPDATE sanctuary.expeditions SET ends_at = now() - interval '1 minute' WHERE claimed_at IS NULL");
await pg2.end();
await domClick("#hub-close"); await sleep(800);
console.log("panel reopen:", await openSanctuary());
await sleep(1000);
await scrollToCard("Cổng thám hiểm"); await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-exp-ready.png" });
console.log("exp ready shot");
await browser.close();
console.log("tour done");
