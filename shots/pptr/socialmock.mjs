import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
for (const t of ["a", "b"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(`file:///home/hatch/workspace/eidolith/shots/social-mock/mock.html?t=${t}`, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `/home/hatch/workspace/eidolith/shots/social-mock-${t}.png` });
  await page.close();
  console.log("shot", t);
}
await browser.close();
