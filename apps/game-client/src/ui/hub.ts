import Phaser from "phaser";
import type { PlayerProfile } from "@eidolith/shared-types";
import { network } from "../net/NetworkManager";
import { CREATURES, ELEMENTS } from "@eidolith/game-data";
/** Hub UI (Part 13 §2): top player bar + bottom navigation
 *  World · Eidolons · Sanctuary · Quests · Menu with bottom-sheet panels.
 *  Design: docs/HUB-DESIGN-v1.md. DOM overlay — the empty area lets touches
 *  pass through to the world; panels/nav capture their own touches. */

const SPRITES: Record<string, string> = {
  "EID-001": "assets/creatures/emberling-v2.png",
  "EID-002": "assets/creatures/mossling-v2.png",
  "EID-003": "assets/creatures/aquafin-v2.png",
  "EID-005": "assets/creatures/zephy-v2.png",
};
const ROLE_VI: Record<string, string> = {
  Guardian: "Hộ vệ", Striker: "Tấn công", Ranger: "Xạ thủ",
  Support: "Hỗ trợ", Controller: "Khống chế", Specialist: "Chuyên biệt",
};
const RARITY_VI: Record<string, string> = {
  Common: "Thường", Uncommon: "Không phổ biến", Rare: "Hiếm", Epic: "Sử thi", Legendary: "Huyền thoại",
};
const ELEMENT_VI: Record<string, string> = Object.fromEntries(ELEMENTS.map(e => [e.element, e.themeVi]));
const ELEMENT_COLOR: Record<string, string> = {
  Flame: "#e86a4a", Tide: "#4a9fe8", Grove: "#5dbb63", Stone: "#b09a72", Gale: "#7fd4c1",
  Frost: "#9fd8ef", Volt: "#e8c94a", Venom: "#9a6ae8", Shade: "#7a7f9a", Astral: "#e89ad4",
};

const ICONS = {
  world: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" stroke="none"/></svg>',
  eidolons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><path d="M3.5 12h6M14.5 12h6"/></svg>',
  sanctuary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/><path d="M12 20v-5"/></svg>',
  quests: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h11a1 1 0 011 1v13a2 2 0 01-2 2H7"/><path d="M7 4a2 2 0 00-2 2v1h4"/><path d="M9.5 9h6M9.5 13h6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/></svg>',
};


const MENU_ICONS: Record<string, string> = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1.2 12a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z"/><path d="M8.5 10V6.5a3.5 3.5 0 017 0V10"/></svg>',
  summon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7l1.2-3.5h13.6L20 7"/><path d="M4 7h16v2a2.8 2.8 0 01-5.5 0 2.8 2.8 0 01-5 0A2.8 2.8 0 014 9V7z"/><path d="M5.5 12.5V20h13v-7.5"/></svg>',
  friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.4"/><path d="M3.5 19.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 15.2c2.3.2 3.6 1.6 4 4.3"/></svg>',
  guild: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 2.5v5.2c0 4.6-3 8.4-7 10.3-4-1.9-7-5.7-7-10.3V5.5L12 3z"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4l11 11M19 4L8 15"/><path d="M14.5 3.5L20.5 3.5 20.5 9.5M3.5 14.5L3.5 20.5 9.5 20.5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.2 2.7 2.9-.6 1 2.8 2.9.8-1 2.8 1 2.8-2.9.8-1 2.8-2.9-.6L12 20l-1.2-2.7-2.9.6-1-2.8-2.9-.8 1-2.8-1-2.8 2.9-.8 1-2.8 2.9.6L12 2.8z" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
};

const CSS = `
.hub-root{position:relative;width:720px;height:1280px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#e8e4d8;pointer-events:none}
.hub-root *{box-sizing:border-box;margin:0;padding:0}
.hudbar{position:absolute;top:12px;left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(8,13,18,.66);border:1px solid rgba(232,201,106,.35);border-radius:18px;padding:8px 12px;pointer-events:auto;backdrop-filter:blur(3px)}
.hud-id{display:flex;align-items:center;gap:11px;min-width:0}
.hud-av{position:relative;flex:none}
.hud-av img{width:50px;height:60px;object-fit:cover;object-position:top;border-radius:10px;background:#20303a;display:block}
.hud-badge{position:absolute;right:-7px;bottom:-7px;min-width:26px;height:26px;border-radius:50%;background:#e8c96a;color:#231a05;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #0b0f14;padding:0 4px}
.hud-meta{min-width:0}
.hud-meta .nm{font-size:20px;font-weight:700;line-height:1.15;display:flex;align-items:center;gap:8px;white-space:nowrap}
.dot{width:10px;height:10px;border-radius:50%;background:#5a6672;flex:none}
.dot.on{background:#57d977;box-shadow:0 0 6px #57d977}
.hud-exp{position:relative;width:196px;height:17px;background:rgba(255,255,255,.10);border-radius:9px;margin-top:5px;overflow:hidden}
.hud-exp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2fae9b,#7fd4c1);border-radius:9px}
.hud-exp span{position:absolute;inset:0;font-size:11.5px;line-height:17px;text-align:center;color:#eaf6f2;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.hud-right{display:flex;align-items:center;gap:8px;flex:none}
.cur{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 13px 7px 9px;font-size:16.5px;font-weight:700}
.cur svg{width:20px;height:20px}
.cur.gold{color:#f2cf6b}.cur.gem{color:#8fd8ff}
.cur span{color:#e8e4d8}
.hbtn{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#cdb87a;display:flex;align-items:center;justify-content:center;cursor:pointer}
.hbtn svg{width:22px;height:22px}
.hudrow{position:absolute;top:96px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
.qtrack{display:flex;align-items:center;gap:8px;background:rgba(8,13,18,.55);border:1px solid rgba(232,201,106,.25);border-radius:999px;color:#e8e4d8;font-size:14.5px;padding:7px 14px 7px 10px;cursor:pointer;pointer-events:auto;max-width:400px}
.qtrack svg{width:17px;height:17px;color:#e8c96a;flex:none}
.qtrack span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hub-ctx{text-align:right;background:rgba(8,13,18,.55);border:1px solid rgba(232,201,106,.25);border-radius:14px;padding:7px 13px;pointer-events:auto}
.hub-ctx .mp{font-size:15.5px;font-weight:700;line-height:1.2}
.hub-ctx .ck{font-size:13.5px;color:#cdb87a}
.hub-ctx .wt{font-size:13px;color:#9fc6e8}
.hub-nav{position:absolute;left:0;right:0;bottom:0;display:flex;background:rgba(8,12,17,.88);border-top:1px solid rgba(232,201,106,.35);padding:10px 8px 18px;pointer-events:auto;backdrop-filter:blur(4px)}
.hub-nav button{flex:1;background:none;border:none;color:#9a937f;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:15.5px;padding:8px 0 4px;border-radius:14px;cursor:pointer}
.hub-nav button svg{width:30px;height:30px}
.hub-nav button.on{color:#e8c96a;background:rgba(232,201,106,.10)}
.hub-panel{position:absolute;left:12px;right:12px;bottom:104px;max-height:760px;display:none;flex-direction:column;background:rgba(10,16,22,.94);border:1px solid rgba(232,201,106,.4);border-radius:22px;pointer-events:auto;overflow:hidden}
.hub-panel.open{display:flex}
.hub-panel header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}
.hub-panel header h2{font-size:23px;color:#e8c96a}
.hub-panel header .sub{font-size:15px;color:#9a937f;margin-top:2px}
.hub-panel .x{width:40px;height:40px;border-radius:10px;background:#c33;color:#fff;border:none;font-size:20px;cursor:pointer;flex:none}
.hub-body{overflow-y:auto;padding:6px 20px 20px;min-height:0;flex:1}
.hub-sec{font-size:16px;color:#7fd4c1;letter-spacing:.4px;margin:14px 0 8px;text-transform:uppercase}
.slots{display:flex;gap:10px}
.slot{flex:1;height:86px;border:1.5px dashed rgba(232,228,216,.35);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#6a7264;font-size:14px;text-align:center;padding:4px}
.dex{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:12px;display:flex;gap:12px;align-items:center}
.card .art{width:74px;height:74px;flex:none;border-radius:12px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.14),rgba(255,255,255,.02));display:flex;align-items:center;justify-content:center;overflow:hidden}
.card .art img{width:74px;height:74px;object-fit:contain}
.card .art .ph{font-size:30px;font-weight:800}
.card h3{font-size:19px}
.card .meta{font-size:14.5px;color:#b9bfae;line-height:1.45}
.chip{display:inline-block;padding:1px 9px;border-radius:99px;font-size:13.5px;color:#0d1117;font-weight:700;vertical-align:1px}
.rar{font-weight:700}
.qcard{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px 16px;margin-bottom:12px}
.qcard h3{font-size:19px;margin-bottom:4px}
.qcard p{font-size:15.5px;color:#b9bfae;line-height:1.5}
.qobj{display:flex;justify-content:space-between;font-size:15.5px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qobj:last-child{border-bottom:none}
.qobj .st{color:#cdb87a}
.bar{height:8px;background:rgba(255,255,255,.10);border-radius:99px;margin-top:6px;overflow:hidden}
.bar i{display:block;height:100%;background:#7fd4c1;border-radius:99px}
.tabs{display:flex;gap:8px;margin:4px 0 14px}
.tabs button{flex:1;padding:10px 0;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#e8e4d8;font-size:16px;cursor:pointer}
.tabs button.on{background:rgba(232,201,106,.16);border-color:rgba(232,201,106,.55);color:#e8c96a}
.bcard{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px 16px;margin-bottom:12px;display:flex;gap:14px;align-items:center}
.bcard .bic{width:52px;height:52px;flex:none;border-radius:12px;background:rgba(127,212,193,.13);display:flex;align-items:center;justify-content:center;color:#7fd4c1}
.bcard .bic svg{width:30px;height:30px}
.bcard h3{font-size:19px}
.bcard p{font-size:15px;color:#b9bfae;line-height:1.45}
.bcard .blv{margin-left:auto;font-size:15px;color:#cdb87a;white-space:nowrap}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.mgrid button{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:16px;color:#e8e4d8;padding:16px 4px 12px;font-size:15.5px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer}
.mgrid button svg{width:30px;height:30px;color:#7fd4c1}
.setrow{display:flex;align-items:center;justify-content:space-between;padding:13px 2px;border-bottom:1px solid rgba(255,255,255,.07);font-size:17px}
.tgl{width:58px;height:32px;border-radius:99px;background:rgba(255,255,255,.14);position:relative;cursor:pointer;flex:none}
.tgl::after{content:'';position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#e8e4d8;transition:left .15s}
.tgl.on{background:#3f9e63}.tgl.on::after{left:30px}
.logout{width:100%;margin-top:18px;padding:15px;border:none;border-radius:14px;background:#8c2f2f;color:#fff;font-size:17.5px;font-weight:700;cursor:pointer}
.logout.confirm{background:#c33}
.toast{position:absolute;left:50%;transform:translateX(-50%);bottom:196px;background:rgba(8,12,17,.92);border:1px solid rgba(232,201,106,.5);color:#e8e4d8;padding:11px 20px;border-radius:12px;font-size:16px;display:none;pointer-events:none;white-space:nowrap}
`;

function dexCard(c: (typeof CREATURES)[number]): string {
  const sprite = SPRITES[c.id];
  const color = ELEMENT_COLOR[c.element];
  const art = sprite
    ? `<img src="${sprite}" alt="${c.name}"/>`
    : `<span class="ph" style="color:${color}">${c.name.slice(0, 1)}</span>`;
  return `<div class="card"><div class="art">${art}</div><div>
    <h3>${c.name}</h3>
    <div class="meta"><span class="chip" style="background:${color}">${ELEMENT_VI[c.element] ?? c.element}</span>
    <span class="rar" style="color:${color}">${RARITY_VI[c.rarity]}</span></div>
    <div class="meta">${ROLE_VI[c.role]} · ${c.habitat || "Chưa rõ nơi sống"}</div></div></div>`;
}

function questsHtml(tab: string): string {
  if (tab === "daily") {
    const daily: [string, string, number][] = [
      ["Đăng nhập hôm nay", "0/1", 0], ["Khám phá thế giới (đi 300 bước)", "0/300", 0],
      ["Nói chuyện với 1 NPC", "0/1", 0], ["Thu thập 1 Eidolon", "0/1", 0], ["Hoàn thành 1 nhiệm vụ chính", "0/1", 0],
    ];
    return daily.map(([t, p, pct]) => `<div class="qcard"><h3>${t}</h3><div class="qobj"><span>Tiến độ</span><span class="st">${p}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`).join("");
  }
  if (tab === "side") return `<div class="qcard"><h3>Chưa có nhiệm vụ phụ</h3><p>Hãy nói chuyện với dân làng Meadow Village — nhiệm vụ phụ sẽ xuất hiện tại đây.</p></div>`;
  return `<div class="qcard"><h3>Arc 0 — Khởi hành</h3><p>Cốt truyện chính bắt đầu tại Meadow Village, Verdant Plains.</p>
    <div class="qobj"><span>Nói chuyện với Elder Rowan</span><span class="st">Đang làm</span></div>
    <div class="qobj"><span>Khám phá Whispering Forest</span><span class="st">Chưa mở</span></div>
    <div class="qobj"><span>Thu thập Eidolon đầu tiên</span><span class="st">Chưa mở</span></div></div>`;
}

const TOP_ICONS = {
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 4h10l3.5 5.5L12 20 3.5 9.5 7 4z"/><path d="M3.5 9.5h17M12 20L8.8 9.5 12 4l3.2 5.5L12 20"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  quest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3.5h12v17l-3-2.2L12 20.5l-3-2.2-3 2.2v-17z" stroke-linejoin="round"/><path d="M9.5 8h5M9.5 11.5h5"/></svg>',
};
export interface HubHandle { destroy: () => void; setWallet: (w: { gold: number; crystal: number } | null) => void; }

export interface HubHudInfo { mapLabel: string; weatherLabel: string; startMinutes: number; players: number; }
export function mountHub(scene: Phaser.Scene, opts: { profile: PlayerProfile; hud: HubHudInfo; onLogout: () => void }): HubHandle {
  const p = opts.profile;
  const regionName = p.currentRegion.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const avatar = p.avatarId === "wanderer_female" ? "assets/chars/wanderer-female-v4.png" : "assets/chars/wanderer-v4.png";
  const html = `<style>${CSS}</style><div class="hub-root">
    <div class="hudbar">
      <div class="hud-id">
        <div class="hud-av"><img src="${avatar}" alt=""/><span class="hud-badge">${p.level}</span></div>
        <div class="hud-meta"><div class="nm">${p.displayName}<span class="dot" id="hub-conn"></span></div>
          <div class="hud-exp"><i style="width:${Math.min(100, Math.round((p.experience / (100 * p.level)) * 100))}%"></i><span>EXP ${p.experience}/${100 * p.level}</span></div></div>
      </div>
      <div class="hud-right">
        <div class="cur gold">${TOP_ICONS.coin}<span id="w-gold">—</span></div>
        <div class="cur gem">${TOP_ICONS.gem}<span id="w-crystal">—</span></div>
        <button class="hbtn" id="hb-mail" title="Thư">${MENU_ICONS.mail}</button>
        <button class="hbtn" id="hb-settings" title="Cài đặt">${MENU_ICONS.settings}</button>
      </div>
    </div>
    <div class="hudrow">
      <button class="qtrack" id="hub-qtrack">${TOP_ICONS.quest}<span>Arc 0 · Nói chuyện với Elder Rowan</span></button>
      <div class="hub-ctx"><div class="mp">${opts.hud.mapLabel}</div><div class="ck" id="hub-clock"></div><div class="wt">${opts.hud.weatherLabel} · <span id="hub-players">${opts.hud.players}</span> người chơi</div></div>
    </div>
    <section class="hub-panel" id="hub-panel"><header><div><h2 id="hub-title"></h2><div class="sub" id="hub-sub"></div></div><button class="x" id="hub-close">✕</button></header><div class="hub-body" id="hub-body"></div></section>
    <div class="toast" id="hub-toast"></div>
    <nav class="hub-nav">
      <button data-tab="world" class="on">${ICONS.world}<span>Thế giới</span></button>
      <button data-tab="eidolons">${ICONS.eidolons}<span>Eidolons</span></button>
      <button data-tab="sanctuary">${ICONS.sanctuary}<span>Sanctuary</span></button>
      <button data-tab="quests">${ICONS.quests}<span>Nhiệm vụ</span></button>
      <button data-tab="menu">${ICONS.menu}<span>Menu</span></button>
    </nav></div>`;
  // Plain fixed overlay positioned over the canvas by its own bounding rect.
  // (Phaser's DOM plugin applies its own scale/origin math that misplaces a
  // full-screen overlay on high-DPI displays; plain CSS transform is exact.)
  const overlay = document.createElement("div");
  overlay.innerHTML = html;
  overlay.style.cssText = "position:fixed;left:0;top:0;width:720px;height:1280px;transform-origin:0 0;z-index:30;pointer-events:none";
  document.body.appendChild(overlay);
  const canvas = scene.game.canvas;
  const sync = () => {
    const r = canvas.getBoundingClientRect();
    overlay.style.left = `${r.left}px`;
    overlay.style.top = `${r.top}px`;
    overlay.style.transform = `scale(${r.width / 720})`;
  };
  sync();
  const syncTimer = window.setInterval(sync, 600);
  window.addEventListener("resize", sync);
  const root = overlay;
  // Live world clock (+0.4 game-min per real second, same rate as the world)
  // and player count via the game's hud:players event.
  let minutes = opts.hud.startMinutes;
  const clockEl = root.querySelector("#hub-clock") as HTMLElement;
  const playersEl = root.querySelector("#hub-players") as HTMLElement;
  const drawClock = () => {
    const h = Math.floor(minutes / 60) % 24, m = Math.floor(minutes % 60);
    clockEl.textContent = `Giờ thế giới: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  drawClock();
  const clockTimer = window.setInterval(() => { minutes = (minutes + 0.4) % 1440; drawClock(); }, 1000);
  const onPlayers = (n: number) => { playersEl.textContent = String(n); };
  scene.game.events.on("hud:players", onPlayers);
  // Top-bar wiring: real wallet values, connection dot, shortcut buttons.
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const goldEl = root.querySelector("#w-gold") as HTMLElement;
  const crystalEl = root.querySelector("#w-crystal") as HTMLElement;
  const connEl = root.querySelector("#hub-conn") as HTMLElement;
  const drawConn = () => connEl.classList.toggle("on", network.worldConnected);
  drawConn();
  const connTimer = window.setInterval(drawConn, 2000);
  (root.querySelector("#hb-mail") as HTMLElement).addEventListener("click", () => setTab("menu"));
  (root.querySelector("#hb-settings") as HTMLElement).addEventListener("click", () => {
    setTab("menu");
    (root.querySelector('[data-m="settings"]') as HTMLElement | null)?.click();
  });
  (root.querySelector("#hub-qtrack") as HTMLElement).addEventListener("click", () => setTab("quests"));
  const panel = root.querySelector("#hub-panel") as HTMLElement;
  const title = root.querySelector("#hub-title") as HTMLElement;
  const sub = root.querySelector("#hub-sub") as HTMLElement;
  const body = root.querySelector("#hub-body") as HTMLElement;
  const toast = root.querySelector("#hub-toast") as HTMLElement;
  let toastTimer = 0;
  const showToast = (msg: string) => {
    toast.textContent = msg; toast.style.display = "block";
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.style.display = "none"; }, 2400);
  };
  const settings = (() => {
    try { return { music: true, sfx: true, ...(JSON.parse(localStorage.getItem("eidolith.settings") ?? "{}") as object) }; }
    catch { return { music: true, sfx: true }; }
  })() as { music: boolean; sfx: boolean };
  const saveSettings = () => localStorage.setItem("eidolith.settings", JSON.stringify(settings));

  const renderers: Record<string, () => void> = {
    eidolons: () => {
      title.textContent = "Eidolons"; sub.textContent = "Bộ sưu tập · 0/20 đã thu thập";
      body.innerHTML = `<div class="hub-sec">Đội hình (0/5)</div><div class="slots">${"<div class='slot'>Ô trống</div>".repeat(5)}</div>
        <p style="font-size:15px;color:#9a937f;margin-top:10px">Bạn chưa có Eidolon nào. Eidolon hoang dã xuất hiện ở Whispering Forest.</p>
        <div class="hub-sec">Sổ loài — Verdant Plains</div><div class="dex">${CREATURES.map(dexCard).join("")}</div>`;
    },
    sanctuary: () => {
      title.textContent = "Sanctuary"; sub.textContent = "Nơi Eidolon nghỉ ngơi và gắn kết";
      const b = (name: string, desc: string, lv: string) => `<div class="bcard"><div class="bic">${ICONS.sanctuary}</div><div><h3>${name}</h3><p>${desc}</p></div><div class="blv">${lv}</div></div>`;
      body.innerHTML = b("Nhà chính", "Trung tâm của Sanctuary — quản lý phân công và nâng cấp.", "Lv.1")
        + b("Vườn gắn kết", "Eidolon ở đây tăng Bond theo thời gian.", "Chưa xây")
        + b("Đài tiến hoá", "Dùng Evolution Core để tiến hoá Eidolon theo nhánh.", "Chưa xây")
        + `<div class="hub-sec">Phân công (0/5)</div><div class="slots">${"<div class='slot'>Ô trống</div>".repeat(5)}</div>`;
    },
    quests: () => {
      title.textContent = "Nhiệm vụ"; sub.textContent = "Nhật ký nhiệm vụ";
      let tab = "main";
      const draw = () => {
        body.innerHTML = `<div class="tabs">
          <button data-q="main" class="${tab === "main" ? "on" : ""}">Chính tuyến</button>
          <button data-q="daily" class="${tab === "daily" ? "on" : ""}">Hằng ngày</button>
          <button data-q="side" class="${tab === "side" ? "on" : ""}">Phụ</button></div><div id="q-list">${questsHtml(tab)}</div>`;
        body.querySelectorAll("[data-q]").forEach(btn => btn.addEventListener("click", () => { tab = (btn as HTMLElement).dataset.q!; draw(); }));
      };
      draw();
    },
    menu: () => {
      title.textContent = "Menu"; sub.textContent = p.displayName + " · " + regionName;
      const item = (key: string, label: string) => `<button data-m="${key}">${MENU_ICONS[key] ?? ICONS.menu}<span>${label}</span></button>`;
      body.innerHTML = `<div class="mgrid">
        ${item("bag", "Túi đồ")}${item("summon", "Triệu hồi")}${item("shop", "Cửa hàng")}${item("friends", "Bạn bè")}
        ${item("guild", "Bang hội")}${item("arena", "Đấu trường")}${item("settings", "Cài đặt")}${item("mail", "Thư")}</div>
        <div id="menu-extra"></div>
        <button class="logout" id="hub-logout">Đăng xuất</button>`;
      const extra = body.querySelector("#menu-extra") as HTMLElement;
      body.querySelectorAll("[data-m]").forEach(btn => btn.addEventListener("click", () => {
        const key = (btn as HTMLElement).dataset.m!;
        if (key === "settings") {
          extra.innerHTML = `<div class="hub-sec">Cài đặt</div>
            <div class="setrow"><span>Nhạc nền</span><div class="tgl ${settings.music ? "on" : ""}" data-s="music"></div></div>
            <div class="setrow"><span>Hiệu ứng âm thanh</span><div class="tgl ${settings.sfx ? "on" : ""}" data-s="sfx"></div></div>
            <div class="setrow"><span>Ngôn ngữ</span><span style="color:#cdb87a">Tiếng Việt</span></div>`;
          extra.querySelectorAll("[data-s]").forEach(t => t.addEventListener("click", () => {
            const k = (t as HTMLElement).dataset.s as "music" | "sfx";
            settings[k] = !settings[k]; saveSettings();
            (t as HTMLElement).classList.toggle("on", settings[k]);
          }));
        } else {
          showToast("Tính năng mở ở giai đoạn sau");
        }
      }));
      const logoutBtn = body.querySelector("#hub-logout") as HTMLButtonElement;
      logoutBtn.addEventListener("click", () => {
        if (!logoutBtn.classList.contains("confirm")) {
          logoutBtn.classList.add("confirm"); logoutBtn.textContent = "Chạm lần nữa để xác nhận đăng xuất";
          window.setTimeout(() => { logoutBtn.classList.remove("confirm"); logoutBtn.textContent = "Đăng xuất"; }, 3000);
          return;
        }
        opts.onLogout();
      });
    },
  };

  const setTab = (tab: string) => {
    root.querySelectorAll(".hub-nav button").forEach(b => b.classList.toggle("on", (b as HTMLElement).dataset.tab === tab));
    if (tab === "world") { panel.classList.remove("open"); return; }
    renderers[tab]?.();
    panel.classList.add("open");
  };
  root.querySelectorAll(".hub-nav button").forEach(b => b.addEventListener("click", () => setTab((b as HTMLElement).dataset.tab!)));
  root.querySelector("#hub-close")!.addEventListener("click", () => setTab("world"));
  return {
    setWallet: (w) => {
      if (!w) return;
      goldEl.textContent = fmt(w.gold);
      crystalEl.textContent = fmt(w.crystal);
    },
    destroy: () => {
      window.clearInterval(connTimer);
      window.clearInterval(clockTimer);
      scene.game.events.off("hud:players", onPlayers);
      window.clearInterval(syncTimer);
      window.removeEventListener("resize", sync);
      overlay.remove();
    },
  };
}
