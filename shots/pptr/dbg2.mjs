import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("PAGE:", m.text().slice(0, 250)); });
page.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0, 400)));
await page.setViewport({ width: 760, height: 1000 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await new Promise(r => setTimeout(r, 6000));
const hasForm = await page.evaluate(() => !!document.querySelector("#f-email"));
console.log("login form present:", hasForm);
if (hasForm) {
  await page.type("#f-email", "girl@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  await new Promise(r => setTimeout(r, 10000));
  console.log("form error text:", await page.evaluate(() => document.querySelector("#f-error")?.textContent ?? "(form gone)"));
}
console.log("hook:", await page.evaluate(() => typeof window.__eidolith));
await browser.close();
