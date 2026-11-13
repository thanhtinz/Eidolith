import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
page.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0, 300)));
await page.setViewport({ width: 760, height: 1000, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const rect = (el) => el ? JSON.stringify(el.getBoundingClientRect()) : "missing";
  const root = q(".hub-root");
  let wrapper = root;
  while (wrapper && !wrapper.style.transform) wrapper = wrapper.parentElement;
  return {
    navButtons: document.querySelectorAll(".hub-nav button").length,
    rootRect: rect(root), navRect: rect(q(".hub-nav")), topRect: rect(q(".hub-top")),
    wrapperTransform: wrapper ? wrapper.style.transform : "none",
    wrapperRect: rect(wrapper),
    dpr: window.devicePixelRatio,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
