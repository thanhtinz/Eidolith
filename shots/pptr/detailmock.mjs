import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
for (const t of ["a", "b"]) {
  await page.goto(`file:///home/hatch/workspace/eidolith/shots/detail-mock/mock.html?t=${t}`, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `/home/hatch/workspace/eidolith/shots/detail-mock-${t}.png` });
  console.log("shot", t);
}
await browser.close();
