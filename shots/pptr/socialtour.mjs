// Phase 6 wave-1 tour: two browser contexts (tourfive + toursix as
// friends) — friends panel with Online flag, then zone chat both ways.
import puppeteer from "puppeteer-core";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const API = "http://127.0.0.1:8787/api/v1";
async function call(method, path, token, body) {
  const res = await fetch(API + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, data: j.data };
}
async function account(email, username, gender = "male") {
  await call("POST", "/auth/register", null, { email, password: "SecurePass123", username, gender });
  const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
  await call("PATCH", "/player/me", login.data.accessToken, { avatarId: gender === "female" ? "wanderer_female" : "wanderer_male" });
  const me = await call("GET", "/player/me", login.data.accessToken);
  return { token: login.data.accessToken, playerId: me.data.playerId };
}
const A = await account("tour5@test.dev", "tourfive", "male");
const B = await account("tour6@test.dev", "toursix", "female");
// friendship via API (either direction state is fine — request + accept)
await call("POST", "/social/friends/request", A.token, { playerId: B.playerId });
const bl = await call("GET", "/social/friends", B.token);
const inc = (bl.data.incoming ?? []).find(x => x.playerId === A.playerId);
if (inc) await call("POST", `/social/friends/${inc.requestId}/accept`, B.token);
const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const has = await pg.query("SELECT COUNT(*) AS n FROM creatures.creature_instances WHERE player_id = $1", [B.playerId]);
if (Number(has.rows[0].n) === 0) {
  await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,'EID-003',9,'capture'),($1,'EID-005',7,'capture')", [B.playerId]);
  console.log("seeded toursix team");
}
await pg.end();
console.log("friends ready");

const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
async function loginPage(email) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on("pageerror", e => console.log("[pageerror]", email, String(e).slice(0, 120)));
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
  // title screen: reveal the login form (tap-to-start)
  await page.waitForFunction(() => typeof window.__eidolithStart === "function", { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => window.__eidolithStart && window.__eidolithStart());

  for (let i = 0; i < 16 && !(await page.$("#f-email")); i++) await sleep(2500);
  if (await page.$("#f-email")) {
    if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
    await page.type("#f-email", email); await page.type("#f-password", "SecurePass123");
    await page.click("#f-submit");
  // server-select screen: press Start to enter the world
  await page.waitForSelector("#srv-start", { timeout: 25000 }).catch(() => {});
  await page.evaluate(() => document.querySelector("#srv-start")?.click());

  } else console.log("WARN no login form for", email);
  let inWorld = false;
  for (let i = 0; i < 24; i++) { if (await page.evaluate(() => document.querySelectorAll(".pmini").length >= 1)) { inWorld = true; break; } await sleep(2500); }
  console.log("in world:", email, inWorld);
  return page;
}
const pageB = await loginPage("tour6@test.dev");
const pageA = await loginPage("tour5@test.dev");
await sleep(3000);
const ev = (page, fn, ...a) => page.evaluate(fn, ...a);
const click = (page, sel) => ev(page, s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
// A: Menu -> Ban be
await click(pageA, "#hub-navtoggle"); await sleep(700);
await click(pageA, '.hub-nav button[data-tab="menu"]'); await sleep(900);
await click(pageA, 'button[data-m="friends"]');
for (let i = 0; i < 8; i++) { if (await ev(pageA, () => document.body.textContent.includes("Danh sách bạn"))) break; await sleep(1500); }
await sleep(800);
await pageA.screenshot({ path: "/home/hatch/workspace/eidolith/shots/social-friends.png" });
console.log("friends panel shot; online flag:", await ev(pageA, () => document.body.textContent.includes("toursix") && document.body.textContent.includes("Đang ở Meadow Village")));
// A: close panel, chat to B
await click(pageA, "#hub-close"); await sleep(600);
await pageA.click("#hub-chat-in");
await pageA.type("#hub-chat-in", "Chào toursix, thấy mình không?");
await pageA.keyboard.press("Enter");
await sleep(1500);
const bGot = await ev(pageB, () => document.querySelector("#hub-chat-msgs")?.textContent ?? "");
console.log("B received:", bGot.includes("thấy mình không"));
await pageB.click("#hub-chat-in");
await pageB.type("#hub-chat-in", "Thấy rõ luôn! Chat ngon đấy.");
await pageB.keyboard.press("Enter");
await sleep(1500);
const aGot = await ev(pageA, () => document.querySelector("#hub-chat-msgs")?.textContent ?? "");
console.log("A received both:", aGot.includes("Chào toursix") && aGot.includes("Thấy rõ luôn"));
await pageA.screenshot({ path: "/home/hatch/workspace/eidolith/shots/social-chat.png" });
console.log("chat shot");
// world tab: A shouts globally; B gets the unread dot, switches tab, replies
await click(pageA, "#hub-chat-tab-world"); await sleep(400);
await pageA.click("#hub-chat-in");
await pageA.type("#hub-chat-in", "Có ai ở đó không? Chào cả thế giới!");
await pageA.keyboard.press("Enter");
await sleep(1500);
console.log("B world-tab unread dot:", await ev(pageB, () => { const d = document.querySelector("#hub-chat-dot-world"); return !!d && !d.hidden; }));
await click(pageB, "#hub-chat-tab-world"); await sleep(500);
console.log("B sees world msg:", await ev(pageB, () => (document.querySelector("#hub-chat-msgs")?.textContent ?? "").includes("Chào cả thế giới")));
await pageB.click("#hub-chat-in");
await pageB.type("#hub-chat-in", "Có mình đây, nghe rõ lắm!");
await pageB.keyboard.press("Enter");
await sleep(1500);
console.log("A sees world reply:", await ev(pageA, () => (document.querySelector("#hub-chat-msgs")?.textContent ?? "").includes("nghe rõ lắm")));
await pageA.screenshot({ path: "/home/hatch/workspace/eidolith/shots/social-chat-world.png" });
console.log("world chat shot");
await browser.close();
console.log("tour done");
