// Phase 5b tour part 2 — deterministic: drive interactions through the
// game's own hooks (grid hops + hub calls), click DOM via evaluate.
import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 160)));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click("#f-switch"); await sleep(600); }
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

// ---- Sanctuary: buildings view with the filled bond-garden slot ----
await domClick("#hub-navtoggle"); await sleep(700);
await domClick('.hub-nav button[data-tab="sanctuary"]');
await waitFor(() => document.querySelectorAll(".slotc").length >= 1);
await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-sanctuary2.png" });
console.log("sanctuary buildings shot");
await domClick("#hub-close"); await sleep(800);

// ---- NPC: hop next to Rowan, open dialogue, accept ----
await ev(() => { const sc = window.__eidolith.scene; const n = sc.npcSpots.find(x => x.name === "Elder Rowan"); sc.gridPos = { x: n.tx + 1, y: n.ty }; window.__eidolith.network.send("world.player.move", { x: n.tx + 1, y: n.ty }); });
await sleep(2500);
await ev(() => window.__eidolith.scene.hub.openNpc("Elder Rowan"));
const dlgOk = await waitFor(() => { const d = document.querySelector("#hub-dlg"); return d && !d.hidden && !!document.querySelector("#dlg-accept"); });
console.log("npc dialog with accept:", dlgOk);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-npc-dialog2.png" });
if (dlgOk) { await domClick("#dlg-accept"); await sleep(1800); console.log("accepted"); }

// ---- Quest panel side tab ----
await domClick("#hub-qtrack"); await sleep(2200);
await domClick('[data-q="side"]'); await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-quests-side.png" });
console.log("side tab shot");
await domClick("#hub-close"); await sleep(800);

// ---- Grove + boss ----
await ev(() => window.__eidolith.changeMap("ancient_grove", "from_forest"));
await sleep(7000);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-grove.png" });
console.log("grove shot");
await ev(() => { const sc = window.__eidolith.scene; sc.hub.openBoss(); });
const bossOk = await waitFor(() => { const d = document.querySelector("#hub-dlg"); return d && !d.hidden && !!document.querySelector("#dlg-fight"); }, 6, 1500);
console.log("boss dialog:", bossOk);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-boss-dialog.png" });
if (bossOk) {
  await domClick("#dlg-fight");
  const inBattle = await waitFor(() => window.__eidolith?.scene?.scene?.key === "Battle", 16, 2500);
  console.log("in battle:", inBattle);
  await sleep(6000);
  await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-boss-battle.png" });
}
await browser.close();
console.log("tour2 done");
