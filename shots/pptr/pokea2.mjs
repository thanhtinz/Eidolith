import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 200)));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (!(await page.$("#f-username"))) { await page.click(".f-tab:not(.on)"); await sleep(600); }
  await page.type("#f-username", "tourfive");
  await page.type("#f-email", "tour5@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit"); console.log("registered");
  await sleep(2500);
  if (await page.$("#f-email")) {
    if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
    await page.type("#f-email", "tour5@test.dev"); await page.type("#f-password", "SecurePass123");
    await page.click("#f-submit"); console.log("logged in after register");
  }
}
await sleep(9000);
const hasHub = await page.evaluate(() => !!document.querySelector("#hub-navtoggle"));
console.log("hub mounted:", hasHub);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-hud.png" });
await browser.close();
