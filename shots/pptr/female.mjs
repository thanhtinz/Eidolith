import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000 });
page.on("console", m => { if (m.type() === "error") console.log("page error:", m.text().slice(0, 160)); });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
// saved session may auto-login; otherwise register via the form
const loggedIn = await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 12000 }).then(() => true).catch(() => false);
if (!loggedIn) {
  await page.waitForSelector("#f-email", { timeout: 15000 });
  await page.click(".f-tab:not(.on)");
  await page.waitForSelector("#f-username", { timeout: 5000 });
  await page.type("#f-username", "wanderer_girl");
  await page.type("#f-email", "girl@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.select("#f-gender", "wanderer_female");
  await page.click("#f-submit");
  await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 25000 });
}
await new Promise(r => setTimeout(r, 1500));
console.log("female char in world:", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/artv4b-female-village.png" });
await browser.close();
console.log("done");
