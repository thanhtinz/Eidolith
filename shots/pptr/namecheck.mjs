import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
// title screen: reveal the login form (tap-to-start)
await page.waitForFunction(() => typeof window.__eidolithStart === "function", { timeout: 30000 }).catch(() => {});
await page.evaluate(() => window.__eidolithStart && window.__eidolithStart());

for (let i = 0; i < 16 && !(await page.$("#f-email")); i++) await sleep(2500);
if (!(await page.$("#f-username"))) { await page.click(".f-tab:not(.on)"); await sleep(700); }
await page.type("#f-email", "newbie@test.dev");
await page.type("#f-username", "ten_dep-2026!");
await page.type("#f-password", "SecurePass123");
await page.click("#f-submit");
await sleep(1500);
console.log("error text:", await page.evaluate(() => document.querySelector("#f-error")?.textContent));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/name-rule-form.png" });
await browser.close();
