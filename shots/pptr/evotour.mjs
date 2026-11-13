// Evolution tour: tourfive's Emberling raised to Lv.18 with 2 cores;
// open its detail, screenshot the branch rows, evolve into Ignidrake
// (two-tap confirm), screenshot the Awakened detail.
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const prof = await pg.query("SELECT id FROM players.player_profiles WHERE display_name = 'tourfive'");
if (!prof.rows.length) { console.log("tourfive missing — run sancv2tour4 prep first"); process.exit(1); }
const pid = prof.rows[0].id;
await pg.query("UPDATE creatures.creature_instances SET level = 18 WHERE player_id = $1 AND creature_id = 'EID-001'", [pid]);
await pg.query(`INSERT INTO economy.player_wallets (player_id, currency_id, balance) VALUES ($1,'evolution_core',2)
  ON CONFLICT (player_id, currency_id) DO UPDATE SET balance = 2`, [pid]);
await pg.end();
console.log("prep done");

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
await domClick("#hub-navtoggle"); await sleep(700);
await domClick('.hub-nav button[data-tab="eidolons"]');
for (let i = 0; i < 10; i++) { if (await ev(() => document.querySelectorAll(".slot[data-inst]").length >= 1)) break; await sleep(2000); }
await sleep(800);
// click the Emberling team slot (first slot whose name is Emberling)
const clicked = await ev(() => {
  const slots = [...document.querySelectorAll(".slot[data-inst]")];
  const s = slots.find(x => x.textContent.includes("Emberling"));
  if (s) { s.click(); return true; } return false;
});
console.log("opened Emberling detail:", clicked);
for (let i = 0; i < 10; i++) { if (await ev(() => !!document.querySelector("[data-evolve]"))) break; await sleep(1500); }
await ev(() => { const b = document.querySelector("#hub-body"); const el = document.querySelector("[data-evolve]"); if (el) el.scrollIntoView({ block: "center" }); });
await sleep(700);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/evo-detail-branches.png" });
console.log("branches shot");
// evolve into Ignidrake (EID-021): arm + confirm
await domClick('[data-evolve="EID-021"]'); await sleep(600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/evo-confirm.png" });
await domClick('[data-evolve="EID-021"]');
for (let i = 0; i < 10; i++) { if (await ev(() => document.body.textContent.includes("Awakened"))) break; await sleep(1500); }
await sleep(800);
await ev(() => { const b = document.querySelector("#hub-body"); if (b) b.scrollTop = 0; });
await sleep(600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/evo-awakened.png" });
console.log("awakened shot");
await browser.close();
console.log("tour done");
