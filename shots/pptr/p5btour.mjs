// Phase 5b tour: Sanctuary assign flow, NPC dialogue + accept, side tab,
// portal trip to Ancient Grove, boss dialog + boss battle entry.
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
const click = async sel => { const el = await page.$(sel); if (el) { await el.click(); return true; } return false; };

// ---- Sanctuary: open, assign one creature to the bond garden ----
await click("#hub-navtoggle"); await sleep(700);
await click('.hub-nav button[data-tab="sanctuary"]'); await sleep(2500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-sanctuary.png" });
console.log("sanctuary shot");
if (await click('[data-pick="bond_garden"]')) {
  await sleep(1500);
  await click("[data-assign]"); await sleep(2500);
  await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-sanctuary-filled.png" });
  console.log("sanctuary filled shot");
}
await click("#hub-close"); await sleep(800);

// ---- NPC dialogue: click Rowan (walk closer if needed), accept quest ----
for (let i = 0; i < 3; i++) {
  await page.mouse.click(735, 225); await sleep(3500);
  const open = await page.evaluate(() => { const d = document.querySelector("#hub-dlg"); return d && !d.hidden; });
  if (open) break;
}
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-npc-dialog.png" });
console.log("npc dialog shot");
if (await click("#dlg-accept")) { console.log("quest accepted"); await sleep(1500); }
else { await click("#dlg-close"); await sleep(500); }

// ---- Quest panel side tab ----
await page.evaluate(() => document.querySelector("#hub-qtrack")?.click()); await sleep(2500);
await click('[data-q="side"]'); await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-quests-side.png" });
console.log("side tab shot");
await click("#hub-close"); await sleep(800);

// ---- Ancient Grove: jump via hook, find the Treant, open boss dialog ----
await page.evaluate(() => window.__eidolith?.changeMap("ancient_grove", "from_forest"));
await sleep(7000);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-grove.png" });
console.log("grove shot");
for (let i = 0; i < 4; i++) {
  await page.mouse.click(1100, 480); await sleep(4500);
  const open = await page.evaluate(() => { const d = document.querySelector("#hub-dlg"); return d && !d.hidden; });
  if (open) break;
}
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-boss-dialog.png" });
console.log("boss dialog shot");
if (await click("#dlg-fight")) {
  for (let i = 0; i < 14; i++) {
    const key = await page.evaluate(() => window.__eidolith?.scene?.scene?.key);
    if (key === "Battle") break; await sleep(2500);
  }
  await sleep(6000);
  await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/p5b-boss-battle.png" });
  console.log("boss battle shot");
}
await browser.close();
console.log("tour done");
