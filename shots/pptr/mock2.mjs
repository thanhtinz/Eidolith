import puppeteer from "puppeteer-core";
const CHROME = "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--use-gl=swiftshader"] });
for (const [t, open] of [["a",0],["b",0],["c",0],["a",1]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await page.goto(`file:///home/hatch/workspace/eidolith/shots/hud-mock/mock.html?t=${t}${open ? "&open=1" : ""}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1100);
  await page.screenshot({ path: `/home/hatch/workspace/eidolith/shots/hud-mock-${t}${open ? "-open" : "-mini"}.png` });
  await page.close();
  console.log("shot", t, open ? "open" : "collapsed");
}
await browser.close();
