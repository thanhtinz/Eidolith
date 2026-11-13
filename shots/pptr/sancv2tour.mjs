// Sanctuary v2 tour: prep state via API/PG (gold, assignments, upgrades,
// time-travelled accrual), then drive the real client and screenshot the
// new spacious panel, its scrolled bottom, and the synergy picker.
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
const login = await call("POST", "/auth/login", null, { email: "tour5@test.dev", password: "SecurePass123" });
const token = login.json?.data?.accessToken;
if (!token) { console.log("API login failed"); process.exit(1); }
const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = 'tourfive'");
const pid = prof.rows[0].id;
await pg.query("UPDATE economy.player_wallets SET balance = 2000 WHERE player_id = $1 AND currency_id = 'gold'", [pid]);
const creatures = await call("GET", "/creatures", token);
const bySpecies = Object.fromEntries(creatures.json.data.items.map(c => [c.creatureId, c.instanceId]));
const st0 = (await call("GET", "/sanctuary", token)).json.data;
const assigned = new Set(st0.buildings.flatMap(b => b.assignments.map(a => a.instanceId)));
const tryAssign = async (bid, inst) => { if (inst && !assigned.has(inst)) { const r = await call("POST", "/sanctuary/assign", token, { buildingId: bid, creatureInstanceId: inst }); console.log("assign", bid, r.status); } };
await tryAssign("research_lab", bySpecies["EID-006"]);
await tryAssign("training_ground", bySpecies["EID-001"]);
console.log("upgrade hall:", (await call("POST", "/sanctuary/buildings/main_hall/upgrade", token, {})).status);
console.log("upgrade garden:", (await call("POST", "/sanctuary/buildings/bond_garden/upgrade", token, {})).status);
await pg.query("UPDATE sanctuary.assignments SET accrued_from = now() - interval '65 minutes', assigned_at = now() - interval '65 minutes' WHERE player_id = $1", [pid]);
const st1 = (await call("GET", "/sanctuary", token)).json.data;
console.log("prep totals:", JSON.stringify(st1.totals), "hall", st1.hallLevel);
await pg.end();

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

await domClick("#hub-navtoggle"); await sleep(700);
await domClick('.hub-nav button[data-tab="sanctuary"]');
const okPanel = await waitFor(() => document.querySelectorAll(".s2-b").length >= 3);
console.log("panel v2 rendered:", okPanel);
await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-panel.png" });
await ev(() => { const b = document.querySelector("#hub-body"); b.scrollTop = b.scrollHeight; });
await sleep(700);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-panel-scroll.png" });
console.log("panel shots done");

// picker: click an empty lab slot (data-pick="research_lab")
await ev(() => { const b = document.querySelector("#hub-body"); b.scrollTop = 0; });
await sleep(400);
const picked = await domClick('[data-pick="research_lab"]');
console.log("picker opened:", picked);
await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-picker.png" });
await domClick("#pick-back"); await sleep(1000);
// collect all
const collected = await domClick("[data-collectall]");
console.log("collect-all clicked:", collected);
await sleep(1500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-collected.png" });
await browser.close();
console.log("tour done");
