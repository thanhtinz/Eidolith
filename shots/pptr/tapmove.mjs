import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
const g0 = await page.evaluate(() => window.__eidolith?.getPlayerGrid());
await page.mouse.click(430, 500);
await sleep(5000);
const g1 = await page.evaluate(() => window.__eidolith?.getPlayerGrid());
console.log("grid before", JSON.stringify(g0), "after", JSON.stringify(g1));
console.log(g0 && g1 && (Math.abs(g1.x - g0.x) + Math.abs(g1.y - g0.y)) > 1 ? "TAP-MOVE OK" : "TAP-MOVE FAIL");
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a6-tapmove.png" });
console.log("shot ok");
await browser.close();
