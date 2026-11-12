import Phaser from "phaser";
import type { PlayerProfile, OwnedCreature, InventoryStack, SummonPullResponse, QuestStateResponse, QuestView } from "@eidolith/shared-types";
import { CREATURES, ELEMENTS, creatureById, statsAtLevel, skillsOf } from "@eidolith/game-data";
import { network } from "../net/NetworkManager";
import { CREATURE_SPRITES } from "./sprites";
/** Hub UI (Part 13 §2): top player bar + bottom navigation
 *  World · Eidolons · Sanctuary · Quests · Menu with bottom-sheet panels.
 *  Design: docs/HUB-DESIGN-v1.md. DOM overlay — the empty area lets touches
 *  pass through to the world; panels/nav capture their own touches. */

const SPRITES = CREATURE_SPRITES;
const RARITY_COLOR: Record<string, string> = {
  Common: "#9a937f", Uncommon: "#5dbb63", Rare: "#4a9fe8", Epic: "#b06ae8", Legendary: "#e8c94a",
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
  world: '<i class="fa-solid fa-compass"></i>',
  eidolons: '<i class="fa-solid fa-paw"></i>',
  sanctuary: '<i class="fa-solid fa-house"></i>',
  quests: '<i class="fa-solid fa-scroll"></i>',
  menu: '<i class="fa-solid fa-grip"></i>',
};


const MENU_ICONS: Record<string, string> = {
  bag: '<i class="fa-solid fa-bag-shopping"></i>',
  summon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
  shop: '<i class="fa-solid fa-store"></i>',
  friends: '<i class="fa-solid fa-user-group"></i>',
  guild: '<i class="fa-solid fa-shield-halved"></i>',
  arena: '<i class="fa-solid fa-trophy"></i>',
  settings: '<i class="fa-solid fa-gear"></i>',
  mail: '<i class="fa-solid fa-envelope"></i>',
};

const CSS = `
.hub-root{position:relative;width:1280px;height:720px;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#e8e4d8;pointer-events:none}
.hub-root *{box-sizing:border-box;margin:0;padding:0}
.pcluster{position:absolute;top:14px;left:14px;display:flex;align-items:center;gap:12px;background:linear-gradient(180deg,#3b2517,#2a190e);border:2px solid #d4a437;border-radius:999px;padding:7px 22px 7px 7px;pointer-events:auto;box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,220,150,.35)}
.pav{position:relative;flex:none}
.pav img{width:58px;height:58px;object-fit:cover;object-position:top;border-radius:50%;border:2px solid #d4a437;background:#20303a;display:block;box-shadow:0 0 0 3px #2a190e}
.hud-badge{position:absolute;right:-5px;bottom:-5px;min-width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#d4a437);color:#2a190e;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #2a190e;padding:0 4px;font-family:'Baloo 2',sans-serif}
.pmeta{min-width:0}
.pmeta .nm{font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:800;line-height:1.15;white-space:nowrap;color:#f7ead0;text-shadow:0 2px 3px rgba(0,0,0,.5)}
.hud-exp{position:relative;width:186px;height:16px;background:#170d06;border-radius:9px;margin-top:5px;overflow:hidden;box-shadow:inset 0 2px 5px rgba(0,0,0,.8)}
.hud-exp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2fae9b,#7fd4c1);border-radius:9px}
.hud-exp span{position:absolute;inset:0;font-size:11px;line-height:16px;text-align:center;color:#ffe9a8;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.cur{display:flex;align-items:center;gap:7px;background:linear-gradient(180deg,#3b2517,#2a190e);border:2px solid #d4a437;border-radius:999px;padding:5px 14px 5px 6px;font-size:16.5px;font-weight:700;color:#f7ead0;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.cur .coin{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#d4a437);display:flex;align-items:center;justify-content:center;color:#5c3d0c;font-size:16px;flex:none}
.cur.gem .coin{background:radial-gradient(circle at 35% 30%,#bff3ff,#3fa7c4);color:#0d3a4a}
.cur i{font-size:16px}
.cur span{color:#f7ead0}
.qcard-top{position:absolute;top:98px;left:14px;display:flex;align-items:center;gap:11px;background:linear-gradient(180deg,#f8edd2,#eedcae);border:2px solid #b98a1e;border-left:6px solid #b98a1e;border-radius:10px;color:#4a2f18;padding:9px 16px 9px 12px;cursor:pointer;pointer-events:auto;max-width:330px;text-align:left;box-shadow:0 6px 16px rgba(0,0,0,.4)}
.qcard-top i{font-size:19px;color:#a33b2e;flex:none}
.qcard-top .qarc{font-size:11.5px;letter-spacing:1.2px;color:#a33b2e;font-weight:700}
.qcard-top .qobj-t{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topright{position:absolute;top:14px;right:14px;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.currencies{display:flex;gap:8px;pointer-events:auto}
.minimap-wrap{position:relative;pointer-events:auto}
.minimap{position:relative;width:158px;height:158px;border-radius:50%;overflow:hidden;background:#22331f;border:4px solid #2a190e;outline:2px solid #d4a437;box-shadow:0 10px 26px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.minimap-inner{position:relative;width:113px;height:113px;flex:none}
.minimap img{width:113px;height:113px;display:block;image-rendering:pixelated}
.mdot{position:absolute;width:11px;height:11px;border-radius:50%;background:#ffd94a;border:2px solid #2a190e;transform:translate(-50%,-50%);box-shadow:0 0 7px rgba(255,217,74,.9);z-index:2}
.mname{position:absolute;right:-4px;bottom:-11px;background:linear-gradient(180deg,#3b2517,#2a190e);color:#f7ead0;font-size:12.5px;font-weight:700;text-align:center;padding:4.5px 14px;border:2px solid #d4a437;border-radius:999px;white-space:nowrap;z-index:3;box-shadow:0 4px 10px rgba(0,0,0,.4)}
.mmeta{font-size:13px;color:#f7ead0;background:linear-gradient(180deg,#3b2517,#2a190e);border:2px solid #d4a437;border-radius:999px;padding:5px 13px;pointer-events:auto;margin-top:15px;box-shadow:0 4px 10px rgba(0,0,0,.35)}
.mmeta #hub-clock{color:#ffe9a8}
.party{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:10px;pointer-events:auto}
.pslot{position:relative;width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 34% 26%,#5a3a22,#241407 75%);border:2px solid #d4a437;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.45)}
.pslot img{width:52px;height:52px;object-fit:contain;border-radius:50%}
.pslot .ph{font-size:24px;font-weight:800}
.pslot.empty{border-style:dashed;border-color:#a68d5f;color:#a68d5f;background:rgba(30,18,8,.92)}
.pslot.empty i{font-size:21px}
.pslot .plv{position:absolute;right:-4px;bottom:-4px;background:radial-gradient(circle at 35% 30%,#ffe9a8,#d4a437);color:#2a190e;font-size:11.5px;font-weight:800;border-radius:999px;padding:1px 6px;border:2px solid #2a190e;font-family:'Baloo 2',sans-serif}
.pslot .gem-dot{position:absolute;left:50%;bottom:-5px;transform:translateX(-50%) rotate(45deg);width:9px;height:9px;background:#35d4b5;border:1.5px solid #2a190e;z-index:2}
.hub-nav{position:absolute;right:14px;bottom:14px;display:flex;flex-direction:column;gap:11px;pointer-events:auto;align-items:center}
.nav-items{display:flex;flex-direction:column;gap:11px;transition:opacity .18s ease,transform .18s ease}
.hub-nav:not(.open) .nav-items{opacity:0;transform:translateY(14px);pointer-events:none}
.hub-nav .toggle .chev{position:absolute;right:-3px;top:-3px;width:19px;height:19px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#ffe9a8,#d4a437);color:#2a190e;border:1.5px solid #2a190e}
.hub-nav.open .toggle .chev i{transform:rotate(180deg)}
.hub-nav button{width:64px;background:none;border:none;color:#e8dcc0;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:0;font-family:'Be Vietnam Pro',sans-serif;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.hub-nav button .nico{width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#5a3a22,#2a190e 72%);border:2px solid #d4a437;display:flex;align-items:center;justify-content:center;color:#e8c96a;box-shadow:0 6px 16px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,220,150,.35);position:relative}
.hub-nav button i{font-size:23px}
.hub-nav button.on{color:#ffd94a}
.hub-nav button.on .nico{border-color:#ffe9a8;color:#ffe9a8;box-shadow:0 0 14px rgba(212,164,55,.55),inset 0 0 12px rgba(53,212,181,.35)}
.hub-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(950px,calc(100% - 150px));max-height:656px;display:none;flex-direction:column;background:linear-gradient(180deg,#2e1c0f,#211307);border:2px solid #d4a437;border-radius:22px;pointer-events:auto;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6)}
.hub-panel.open{display:flex}
.hub-panel header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}
.hub-panel header h2{font-family:'Baloo 2',sans-serif;font-size:25px;color:#e8c96a}
.hub-panel header .sub{font-size:15px;color:#c9b18a;margin-top:2px}
.hub-panel .x{width:40px;height:40px;border-radius:10px;background:#c33;color:#fff;border:none;font-size:20px;cursor:pointer;flex:none}
.hub-body{overflow-y:auto;padding:6px 20px 20px;min-height:0;flex:1}
.hub-sec{font-family:'Baloo 2',sans-serif;font-size:17px;color:#e8c96a;letter-spacing:.4px;margin:14px 0 8px;text-transform:uppercase}
.slots{display:flex;gap:10px}
.slot{flex:1;height:86px;border:1.5px dashed rgba(212,164,55,.4);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#a68d5f;font-size:14px;text-align:center;padding:4px;background:rgba(212,164,55,.04)}
.dex{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.card{background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:16px;padding:12px;display:flex;gap:12px;align-items:center}
.card .art{width:74px;height:74px;flex:none;border-radius:12px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.14),rgba(255,255,255,.02));display:flex;align-items:center;justify-content:center;overflow:hidden}
.card .art img{width:74px;height:74px;object-fit:contain}
.card .art .ph{font-size:30px;font-weight:800}
.card h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#f7ead0}
.card .meta{font-size:14.5px;color:#d8c9a8;line-height:1.45}
.chip{display:inline-block;padding:1px 9px;border-radius:99px;font-size:13.5px;color:#0d1117;font-weight:700;vertical-align:1px}
.rar{font-weight:700}
.qcard{background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:16px;padding:14px 16px;margin-bottom:12px}
.qcard h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#f7ead0;margin-bottom:4px}
.qclaim{margin-top:10px;background:linear-gradient(180deg,#ffb340,#e07f1f);color:#2a1503;border:none;border-radius:10px;padding:9px 18px;font-family:'Baloo 2',sans-serif;font-weight:700;font-size:15px;cursor:pointer}
.qclaim:hover{filter:brightness(1.08)}
.qdone{margin-top:10px;color:#8fd96a;font-weight:700;font-size:14.5px}
.qrew{color:#c9b18a;font-size:14px;margin-top:2px}
.dt-head{display:flex;gap:18px;align-items:center}
.dt-head img{width:110px;height:110px;object-fit:contain}
.dt-head .ph{font-size:64px;font-family:'Baloo 2',sans-serif}
.dt-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}
.dt-stat{background:rgba(212,164,55,.07);border:1px solid rgba(212,164,55,.2);border-radius:12px;padding:10px;text-align:center}
.dt-stat b{display:block;font-family:'Baloo 2',sans-serif;font-size:21px;color:#f7ead0}
.dt-stat span{font-size:12.5px;color:#9a937f;letter-spacing:.6px}
.hearts{color:#e2543e;letter-spacing:3px;font-size:16px}
.hearts .off{color:rgba(247,234,208,.18)}
.sk{display:flex;justify-content:space-between;padding:7px 2px;border-bottom:1px dashed rgba(212,164,55,.18);font-size:15px}
.sk .tag{color:#ffd94a;font-weight:700;font-size:12.5px;letter-spacing:.8px}
.slot[data-inst]{cursor:pointer}
.dex .card{cursor:pointer}
.qcard p{font-size:15.5px;color:#d8c9a8;line-height:1.5}
.qobj{display:flex;justify-content:space-between;font-size:15.5px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qobj:last-child{border-bottom:none}
.qobj .st{color:#cdb87a}
.bar{height:8px;background:rgba(255,255,255,.10);border-radius:99px;margin-top:6px;overflow:hidden}
.bar i{display:block;height:100%;background:#7fd4c1;border-radius:99px}
.tabs{display:flex;gap:8px;margin:4px 0 14px}
.tabs button{flex:1;padding:10px 0;border-radius:12px;border:1px solid rgba(212,164,55,.3);background:rgba(212,164,55,.05);color:#f7ead0;font-size:16px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif}
.tabs button.on{background:rgba(232,201,106,.16);border-color:rgba(232,201,106,.55);color:#e8c96a}
.bcard{background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:16px;padding:14px 16px;margin-bottom:12px;display:flex;gap:14px;align-items:center}
.bcard .bic{width:52px;height:52px;flex:none;border-radius:12px;background:rgba(127,212,193,.13);display:flex;align-items:center;justify-content:center;color:#7fd4c1}
.bcard .bic svg{width:30px;height:30px}
.bcard h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#f7ead0}
.bcard p{font-size:15px;color:#d8c9a8;line-height:1.45}
.bcard .blv{margin-left:auto;font-size:15px;color:#cdb87a;white-space:nowrap}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.mgrid button{background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:16px;color:#f7ead0;padding:16px 4px 12px;font-size:15.5px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif}
.mgrid button svg{width:30px;height:30px;color:#7fd4c1}
.mgrid button i{font-size:27px;color:#e8c96a}
.setrow{display:flex;align-items:center;justify-content:space-between;padding:13px 2px;border-bottom:1px solid rgba(255,255,255,.07);font-size:17px}
.tgl{width:58px;height:32px;border-radius:99px;background:rgba(255,255,255,.14);position:relative;cursor:pointer;flex:none}
.tgl::after{content:'';position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#e8e4d8;transition:left .15s}
.tgl.on{background:#3f9e63}.tgl.on::after{left:30px}
.logout{width:100%;margin-top:18px;padding:15px;border:none;border-radius:14px;background:#8c2f2f;color:#fff;font-size:17.5px;font-weight:700;cursor:pointer}
.logout.confirm{background:#c33}
.enc{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,6,9,.45);pointer-events:auto;z-index:5}
.enc[hidden]{display:none}
.enc-card{position:relative;width:520px;background:linear-gradient(180deg,#2e1c0f,#211307);border:2px solid #d4a437;border-radius:26px;padding:22px 26px 26px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.6)}
.enc-card img{width:150px;height:150px;object-fit:contain}
.enc-card .ph{font-size:88px;font-weight:800;line-height:150px}
.enc-card h3{font-family:'Baloo 2',sans-serif;font-size:29px;margin-top:6px;color:#f7ead0}
.enc-card .meta{display:flex;gap:8px;justify-content:center;margin-top:9px;font-size:15.5px;color:#c9b18a}
.enc-msg{min-height:26px;font-size:17px;margin:14px 0 6px;color:#f7ead0}
.enc-msg.good{color:#7fe3a0}.enc-msg.bad{color:#ff9a8a}
.enc-btn{width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(180deg,#e8a33d,#c8871e);color:#fff;font-size:18.5px;font-weight:700;cursor:pointer;font-family:'Baloo 2',sans-serif}
.enc-btn:disabled{background:#4a4436;color:#9a937f;cursor:default}
.enc-x{position:absolute;top:14px;right:14px}
.enc.shake .enc-card{animation:shk .4s}
@keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-9px)}75%{transform:translateX(9px)}}
.owned-badge{background:#3f9e63;color:#eafff1;border-radius:999px;font-size:12.5px;padding:2.5px 9px;font-weight:700}
.sumres{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
.sumres .cell{background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:14px;padding:12px;text-align:center}
.sumres .cell img{width:96px;height:96px;object-fit:contain}
.sumres .cell .ph{font-size:52px;font-weight:800;line-height:96px}
.bagrow{display:flex;align-items:center;gap:13px;background:rgba(212,164,55,.06);border:1px solid rgba(212,164,55,.22);border-radius:14px;padding:13px 15px;margin-bottom:10px}
.bagrow i{font-size:24px;color:#e8c96a}
.bagrow .qty{margin-left:auto;font-weight:800;font-size:18px;color:#e8c96a}
.toast{position:absolute;left:50%;transform:translateX(-50%);bottom:92px;background:linear-gradient(180deg,#3b2517,#2a190e);border:2px solid #d4a437;color:#f7ead0;padding:11px 20px;border-radius:999px;font-size:16px;display:none;pointer-events:none;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.45)}
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

const CURRENCY_VI: Record<string, string> = { gold: "Gold", crystal: "Crystal", evolution_core: "Evolution Core", bond_essence: "Bond Essence" };
function questCard(q: QuestView): string {
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
  const rew = q.rewards.map(r => `+${r.amount} ${CURRENCY_VI[r.currency] ?? r.currency}`).join(" · ");
  const action = q.claimed
    ? `<div class="qdone"><i class="fa-solid fa-check"></i> Đã nhận thưởng</div>`
    : q.complete
      ? `<button class="qclaim" data-claim="${q.scope}:${q.key}">Nhận thưởng</button>`
      : "";
  return `<div class="qcard"><h3>${q.title}</h3><div class="qrew">Thưởng: ${rew}</div>
    <div class="qobj"><span>Tiến độ</span><span class="st">${q.progress}/${q.target}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>${action}</div>`;
}

const TOP_ICONS = {
  coin: '<i class="fa-solid fa-coins"></i>',
  gem: '<i class="fa-solid fa-gem"></i>',
  quest: '<i class="fa-solid fa-scroll"></i>',
};
export interface EncounterUi { encounterId: string; creatureId: string; level: number; }
export interface HubHandle {
  destroy: () => void;
  setWallet: (w: { gold: number; crystal: number } | null) => void;
  openEncounter: (enc: EncounterUi) => void;
}

export interface HubHudInfo { mapLabel: string; weatherLabel: string; startMinutes: number; players: number; mapId: string; mapW: number; mapH: number; }
export function mountHub(scene: Phaser.Scene, opts: { profile: PlayerProfile; hud: HubHudInfo; onLogout: () => void; onArena?: () => void }): HubHandle {
  const p = opts.profile;
  const regionName = p.currentRegion.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const avatar = p.avatarId === "wanderer_female" ? "assets/chars/wanderer-female-v4.png" : "assets/chars/wanderer-v4.png";
  const html = `<style>${CSS}</style><div class="hub-root">
    <div class="pcluster">
      <div class="pav"><img src="${avatar}" alt=""/><span class="hud-badge" id="hub-lv">${p.level}</span></div>
      <div class="pmeta"><div class="nm">${p.displayName}</div>
        <div class="hud-exp"><i id="hub-exp-fill" style="width:${Math.min(100, Math.round((p.experience / (100 * p.level)) * 100))}%"></i><span id="hub-exp-txt">EXP ${p.experience}/${100 * p.level}</span></div></div>
    </div>
    <button class="qcard-top" id="hub-qtrack"><i class="fa-solid fa-scroll"></i><span><span class="qarc">ARC 0 · NHIỆM VỤ CHÍNH</span><br/><span class="qobj-t">Nói chuyện với Elder Rowan</span></span></button>
    <div class="topright">
      <div class="currencies">
        <div class="cur gold"><span class="coin">${TOP_ICONS.coin}</span><span id="w-gold">—</span></div>
        <div class="cur gem"><span class="coin">${TOP_ICONS.gem}</span><span id="w-crystal">—</span></div>
      </div>
      <div class="minimap-wrap"><div class="minimap"><div class="minimap-inner"><img src="assets/maps/minimap-${opts.hud.mapId}.png" alt=""/><span class="mdot" id="hub-mdot" style="left:50%;top:50%"></span></div></div><div class="mname">${opts.hud.mapLabel}</div></div>
      <div class="mmeta"><span id="hub-clock"></span> · ${opts.hud.weatherLabel} · <span id="hub-players">${opts.hud.players}</span> người chơi</div>
    </div>
    <div class="party" id="hub-party"></div>
    <section class="hub-panel" id="hub-panel"><header><div><h2 id="hub-title"></h2><div class="sub" id="hub-sub"></div></div><button class="x" id="hub-close"><i class="fa-solid fa-xmark"></i></button></header><div class="hub-body" id="hub-body"></div></section>
    <div class="enc" id="hub-enc" hidden></div>
    <div class="toast" id="hub-toast"></div>
    <nav class="hub-nav" id="hub-nav">
      <div class="nav-items">
      <button data-tab="world" class="on"><span class="nico">${ICONS.world}</span><span>Thế giới</span></button>
      <button data-tab="eidolons"><span class="nico">${ICONS.eidolons}</span><span>Eidolons</span></button>
      <button data-tab="sanctuary"><span class="nico">${ICONS.sanctuary}</span><span>Sanctuary</span></button>
      <button data-tab="quests"><span class="nico">${ICONS.quests}</span><span>Nhiệm vụ</span></button>
      <button data-tab="menu"><span class="nico">${ICONS.menu}</span><span>Menu</span></button>
      </div>
      <button class="toggle" id="hub-navtoggle"><span class="nico"><span id="hub-navicon">${ICONS.world}</span><span class="chev"><i class="fa-solid fa-chevron-up"></i></span></span></button>
    </nav></div>`;
  // Plain fixed overlay positioned over the canvas by its own bounding rect.
  // (Phaser's DOM plugin applies its own scale/origin math that misplaces a
  // full-screen overlay on high-DPI displays; plain CSS transform is exact.)
  const overlay = document.createElement("div");
  overlay.innerHTML = html;
  overlay.style.cssText = "position:fixed;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;z-index:30;pointer-events:none";
  document.body.appendChild(overlay);
  const canvas = scene.game.canvas;
  const sync = () => {
    const r = canvas.getBoundingClientRect();
    overlay.style.left = `${r.left}px`;
    overlay.style.top = `${r.top}px`;
    overlay.style.transform = `scale(${r.width / 1280})`;
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
  const mdot = root.querySelector("#hub-mdot") as HTMLElement;
  const onPos = (pos: { x: number; y: number }) => {
    mdot.style.left = `${((pos.x + 0.5) / opts.hud.mapW) * 100}%`;
    mdot.style.top = `${((pos.y + 0.5) / opts.hud.mapH) * 100}%`;
  };
  scene.game.events.on("hud:pos", onPos);
  // Top-bar wiring: real wallet values, connection dot, shortcut buttons.
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const goldEl = root.querySelector("#w-gold") as HTMLElement;
  const crystalEl = root.querySelector("#w-crystal") as HTMLElement;
  (root.querySelector("#hub-qtrack") as HTMLElement).addEventListener("click", () => setTab("quests"));
  const updateTracker = (st: QuestStateResponse): void => {
    const arcEl = root.querySelector("#hub-qtrack .qarc") as HTMLElement | null;
    const objEl = root.querySelector("#hub-qtrack .qobj-t") as HTMLElement | null;
    if (!arcEl || !objEl) return;
    const nextArc = st.arc.find(q => !q.complete);
    const nextDaily = st.daily.find(q => !q.complete);
    if (nextArc) { arcEl.textContent = "ARC 0 · NHIỆM VỤ CHÍNH"; objEl.textContent = `${nextArc.title} · ${nextArc.progress}/${nextArc.target}`; }
    else if (nextDaily) { arcEl.textContent = "NHIỆM VỤ HẰNG NGÀY"; objEl.textContent = `${nextDaily.title} · ${nextDaily.progress}/${nextDaily.target}`; }
    else { arcEl.textContent = "NHIỆM VỤ"; objEl.textContent = "Đã xong các mục tiêu — quay lại nhận thưởng!"; }
  };
  void network.request<QuestStateResponse>("GET", "/progression/quests").then(st => { if (root.isConnected) updateTracker(st); }).catch(() => undefined);
  void network.request<PlayerProfile>("GET", "/player/me").then(me => {
    if (!root.isConnected) return;
    const lv = root.querySelector("#hub-lv"); if (lv) lv.textContent = String(me.level);
    const fill = root.querySelector("#hub-exp-fill") as HTMLElement | null;
    const txt = root.querySelector("#hub-exp-txt");
    if (fill) fill.style.width = `${Math.min(100, Math.round((me.experience / (100 * me.level)) * 100))}%`;
    if (txt) txt.textContent = `EXP ${me.experience}/${100 * me.level}`;
  }).catch(() => undefined);
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

  const artFor = (creatureId: string, size: number): string => {
    const sp = SPRITES[creatureId];
    const def = CREATURES.find(c => c.id === creatureId);
    return sp ? `<img src="${sp}" style="width:${size}px;height:${size}px;object-fit:contain" alt=""/>`
      : `<span class="ph" style="font-size:${Math.round(size * 0.55)}px;line-height:${size}px;color:${ELEMENT_COLOR[def?.element ?? ""] ?? "#9a937f"}">${(def?.name ?? "?").charAt(0)}</span>`;
  };
  const partyEl = root.querySelector("#hub-party") as HTMLElement;
  const renderParty = (items: OwnedCreature[]): void => {
    const team = items.slice(0, 5);
    partyEl.innerHTML = [
      ...team.map(it => {
        const def = CREATURES.find(c => c.id === it.creatureId);
        const sp = SPRITES[it.creatureId];
        const color = ELEMENT_COLOR[def?.element ?? ""] ?? "#9a937f";
        return `<div class="pslot" data-party title="${it.name} · Lv.${it.level}" style="border-color:${color}">${sp ? `<img src="${sp}" alt=""/>` : `<span class="ph" style="color:${color}">${it.name.charAt(0)}</span>`}<span class="plv">${it.level}</span><span class="gem-dot"></span></div>`;
      }),
      ...Array(Math.max(0, 5 - team.length)).fill(`<div class="pslot empty" data-party><i class="fa-solid fa-paw"></i></div>`),
    ].join("");
    partyEl.querySelectorAll("[data-party]").forEach(el => el.addEventListener("click", () => setTab("eidolons")));
  };
  const refreshParty = (): void => {
    void network.request<{ items: OwnedCreature[] }>("GET", "/creatures").then(({ items }) => { if (root.isConnected) renderParty(items); }).catch(() => undefined);
  };
  refreshParty();
  const renderBag = (): void => {
    title.textContent = "Túi đồ"; sub.textContent = "Vật phẩm đang có";
    body.innerHTML = `<p style="font-size:15.5px;color:#9a937f">Đang tải…</p>`;
    void network.request<{ items: InventoryStack[] }>("GET", "/inventory").then(({ items }) => {
      if (!root.isConnected) return;
      body.innerHTML = items.length === 0
        ? `<div class="qcard"><h3>Túi đồ trống</h3><p>Chưa có vật phẩm nào.</p></div>`
        : items.map(i => `<div class="bagrow"><i class="fa-solid ${i.category === "capture" ? "fa-circle-dot" : "fa-box"}"></i><div><div style="font-weight:700;font-size:16.5px">${i.name}</div><div style="font-size:13.5px;color:#9a937f">${i.description}</div></div><span class="qty">×${i.quantity}</span></div>`).join("");
    }).catch(() => { body.innerHTML = `<div class="qcard"><h3>Không tải được túi đồ</h3></div>`; });
  };
  const renderSummon = (): void => {
    title.textContent = "Triệu hồi"; sub.textContent = "Standard Resonance";
    body.innerHTML = `<p style="font-size:15.5px;color:#9a937f">Đang tải banner…</p>`;
    type BannerResp = { banners: { id: string; rates: Record<string, number>; pity: { sinceRare: number; sinceEpic: number; guaranteeRareAt: number; guaranteeEpicAt: number } }[] };
    void Promise.all([
      network.request<BannerResp>("GET", "/summoning/banners"),
      network.request<{ gold: number; crystal: number }>("GET", "/player/wallet"),
    ]).then(([b, w]) => {
      if (!root.isConnected) return;
      const banner = b.banners[0];
      let crystal = w.crystal;
      let pity = banner.pity;
      const rateRows = Object.entries(banner.rates).map(([r, v]) =>
        `<div class="qobj"><span style="color:${RARITY_COLOR[r]}">${RARITY_VI[r] ?? r}</span><span class="st">${Math.round(v * 100)}%</span></div>`).join("");
      body.innerHTML = `<div class="qcard"><h3>Standard Resonance</h3>
        <p>Triệu hồi Eidolon bằng Crystal. Trùng loài sẽ chuyển thành Mảnh + Bond Essence.</p>
        ${rateRows}
        <div class="qobj"><span>Bảo đảm Hiếm trở lên</span><span class="st">mỗi ${pity.guaranteeRareAt} lượt (đang ${pity.sinceRare})</span></div>
        <div class="qobj"><span>Bảo đảm Sử thi</span><span class="st">tối đa ${pity.guaranteeEpicAt} lượt (đang ${pity.sinceEpic})</span></div>
        <div class="qobj"><span>Crystal đang có</span><span class="st" id="sum-crystal">${crystal.toLocaleString("vi-VN")}</span></div></div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <button class="enc-btn" id="sum-1" style="flex:1">Triệu hồi ×1 · 30</button>
          <button class="enc-btn" id="sum-10" style="flex:1">Triệu hồi ×10 · 270</button>
        </div>
        <div id="sum-results"></div>`;
      const resultsEl = body.querySelector("#sum-results") as HTMLElement;
      const crystalEl2 = body.querySelector("#sum-crystal") as HTMLElement;
      let pulling = false;
      const pull = (count: number) => {
        if (pulling) return;
        pulling = true;
        void network.request<SummonPullResponse>("POST", "/summoning/pull", { bannerId: banner.id, pullCount: count }, true, { "Idempotency-Key": crypto.randomUUID() }).then(res => {
          crystal = res.remainingCrystal;
          pity = { ...pity, sinceRare: res.pity.sinceRare, sinceEpic: res.pity.sinceEpic };
          crystalEl2.textContent = crystal.toLocaleString("vi-VN");
          crystalEl.textContent = crystal.toLocaleString("vi-VN");
          refreshParty();
          resultsEl.innerHTML = `<div class="hub-sec">Kết quả</div><div class="sumres">${res.results.map(r => {
            const def = CREATURES.find(c => c.id === r.creatureId);
            return `<div class="cell">${artFor(r.creatureId, 96)}<div style="font-weight:700;margin-top:4px">${def?.name ?? r.creatureId}</div>
              <div style="color:${RARITY_COLOR[r.rarity]};font-size:14px">${RARITY_VI[r.rarity] ?? r.rarity}</div>
              <div style="font-size:13.5px;color:${r.isDuplicate ? "#9a937f" : "#7fe3a0"}">${r.isDuplicate ? `Trùng · +${r.shardsGained} Mảnh` : "MỚI!"}</div></div>`;
          }).join("")}</div>`;
        }).catch((e: Error) => { resultsEl.innerHTML = `<p class="enc-msg bad" style="margin-top:12px">${e.message}</p>`; })
          .finally(() => { pulling = false; });
      };
      (body.querySelector("#sum-1") as HTMLButtonElement).addEventListener("click", () => pull(1));
      (body.querySelector("#sum-10") as HTMLButtonElement).addEventListener("click", () => pull(10));
    }).catch(() => { body.innerHTML = `<div class="qcard"><h3>Không tải được banner</h3></div>`; });
  };

  const renderers: Record<string, () => void> = {
    eidolons: () => {
      title.textContent = "Eidolons"; sub.textContent = "Đang tải bộ sưu tập…";
      body.innerHTML = `<p style="font-size:15.5px;color:#9a937f">Đang tải…</p>`;
      void network.request<{ items: OwnedCreature[] }>("GET", "/creatures").then(({ items }) => {
        if (!root.isConnected) return;
        const ownedSpecies = new Map<string, number>();
        for (const it of items) ownedSpecies.set(it.creatureId, (ownedSpecies.get(it.creatureId) ?? 0) + 1);
        sub.textContent = `Bộ sưu tập · ${ownedSpecies.size}/20 loài · ${items.length} cá thể`;
        const team = items.slice(0, 5);
        const slots = [...team.map(it => {
          const sp = SPRITES[it.creatureId];
          return `<div class="slot" data-inst="${it.instanceId}" style="color:#e8e4d8">${sp ? `<img src="${sp}" style="width:52px;height:52px;object-fit:contain" alt=""/>` : ""}<span>${it.name}<br/>Lv.${it.level}</span></div>`;
        }), ...Array(Math.max(0, 5 - team.length)).fill(`<div class="slot">Ô trống</div>`)].join("");
        const dex = CREATURES.map(c => {
          const n = ownedSpecies.get(c.id) ?? 0;
          const card = dexCard(c);
          return n > 0 ? card.replace('<div class="meta">', `<div class="meta"><span class="owned-badge">Đã có ×${n}</span></div><div class="meta">`) : card;
        }).join("");
        body.innerHTML = `<div class="hub-sec">Đội hình (${team.length}/5)</div><div class="slots">${slots}</div>
          ${items.length === 0 ? `<p style="font-size:15px;color:#9a937f;margin-top:10px">Bạn chưa có Eidolon nào. Eidolon hoang dã xuất hiện ở Whispering Forest — lại gần và chạm vào chúng để bắt.</p>` : ""}
          <div class="hub-sec">Sổ loài — Verdant Plains</div><div class="dex">${dex}</div>`;
        const byId = new Map(items.map(i => [i.instanceId, i]));
        const bestOf = new Map<string, OwnedCreature>();
        for (const it of items) { const cur = bestOf.get(it.creatureId); if (!cur || it.level > cur.level) bestOf.set(it.creatureId, it); }
        const showDetail = (it: OwnedCreature): void => {
          const def = creatureById(it.creatureId);
          if (!def) return;
          const st = statsAtLevel(def, it.level);
          const xpNext = it.level >= 50 ? 0 : 60 + 40 * it.level;
          const xpPct = xpNext ? Math.min(100, Math.round((it.experience / xpNext) * 100)) : 100;
          const hearts = Array.from({ length: 10 }, (_, i) => `<i class="fa-solid fa-heart ${i < it.bondLevel ? "" : "off"}"></i>`).join("");
          const skills = skillsOf(it.creatureId).map(sk => `<div class="sk"><span>${sk.name}</span>${sk.slot === 3 ? `<span class="tag">CHIÊU CUỐI</span>` : sk.slot === 2 ? `<span class="tag">KỸ NĂNG</span>` : `<span class="tag">ĐÒN THƯỜNG</span>`}</div>`).join("");
          const sp = SPRITES[it.creatureId];
          sub.textContent = `Chi tiết Eidolon`;
          body.innerHTML = `<button class="qclaim" id="dt-back" style="margin:0 0 12px">← Bộ sưu tập</button>
            <div class="dt-head">${sp ? `<img src="${sp}" alt="${it.name}"/>` : `<span class="ph" style="color:${ELEMENT_COLOR[it.element]}">${it.name.slice(0, 1)}</span>`}
              <div><h3 style="font-family:'Baloo 2',sans-serif;font-size:27px;color:#f7ead0">${it.name} · Lv.${it.level}</h3>
              <div class="meta"><span class="chip" style="background:${ELEMENT_COLOR[it.element]}">${ELEMENT_VI[it.element] ?? it.element}</span> <span class="rar" style="color:${ELEMENT_COLOR[it.element]}">${RARITY_VI[it.rarity]}</span></div>
              <div class="meta">${ROLE_VI[it.role]} · ${def.habitat || "Chưa rõ nơi sống"}</div>
              <div class="hearts" style="margin-top:6px">${hearts}<span style="color:#c9b18a;font-size:13.5px;letter-spacing:0"> Bond ${it.bondLevel}/10</span></div></div></div>
            <div class="qobj" style="margin-top:12px"><span>Kinh nghiệm</span><span class="st">${it.level >= 50 ? "MAX" : `${it.experience}/${xpNext} XP`}</span></div>
            <div class="bar"><i style="width:${xpPct}%"></i></div>
            ${def.descriptionVi ? `<p style="font-size:15px;color:#c9b18a;margin-top:10px">${def.descriptionVi}</p>` : ""}
            <div class="dt-grid">
              <div class="dt-stat"><b>${st.hp}</b><span>MÁU (HP)</span></div>
              <div class="dt-stat"><b>${st.atk}</b><span>TẤN CÔNG</span></div>
              <div class="dt-stat"><b>${st.def}</b><span>PHÒNG THỦ</span></div>
              <div class="dt-stat"><b>${st.spd}</b><span>TỐC ĐỘ</span></div>
            </div>
            ${def.traitName ? `<div class="hub-sec">Đặc tính — ${def.traitName}</div><p style="font-size:15px;color:#c9b18a">${def.traitDescVi || ""}</p>` : ""}
            <div class="hub-sec">Kỹ năng</div>${skills}
            ${def.evolutionBranches.length ? `<div class="hub-sec">Nhánh tiến hoá</div><p style="font-size:15px;color:#c9b18a">${def.evolutionBranches.join(" · ")}<br/>Yêu cầu: Lv.16 + 1 Evolution Core cho mỗi lần tiến hoá.</p>` : ""}`;
          (body.querySelector("#dt-back") as HTMLElement).addEventListener("click", () => renderers.eidolons());
        };
        body.querySelectorAll<HTMLElement>(".slot[data-inst]").forEach(el => el.addEventListener("click", () => { const it = byId.get(el.dataset.inst!); if (it) showDetail(it); }));
        body.querySelectorAll<HTMLElement>(".dex .card").forEach((el, idx) => el.addEventListener("click", () => { const it = bestOf.get(CREATURES[idx].id); if (it) showDetail(it); }));
      }).catch(() => { sub.textContent = "Không tải được bộ sưu tập"; });
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
      let state: QuestStateResponse | null = null;
      const draw = () => {
        const list = !state ? `<p style="font-size:15.5px;color:#9a937f">Đang tải…</p>`
          : tab === "side" ? `<div class="qcard"><h3>Chưa có nhiệm vụ phụ</h3><p>Hãy nói chuyện với dân làng Meadow Village — nhiệm vụ phụ sẽ xuất hiện tại đây.</p></div>`
          : (tab === "main" ? state.arc : state.daily).map(questCard).join("");
        body.innerHTML = `<div class="tabs">
          <button data-q="main" class="${tab === "main" ? "on" : ""}">Chính tuyến</button>
          <button data-q="daily" class="${tab === "daily" ? "on" : ""}">Hằng ngày</button>
          <button data-q="side" class="${tab === "side" ? "on" : ""}">Phụ</button></div><div id="q-list">${list}</div>`;
        body.querySelectorAll("[data-q]").forEach(btn => btn.addEventListener("click", () => { tab = (btn as HTMLElement).dataset.q!; draw(); }));
        body.querySelectorAll<HTMLElement>("[data-claim]").forEach(btn => btn.addEventListener("click", () => {
          const [scope, key] = btn.dataset.claim!.split(":");
          btn.textContent = "Đang nhận…"; (btn as HTMLButtonElement).disabled = true;
          void network.request("POST", `/progression/quests/${scope}/${key}/claim`, {}).then(() => {
            showToast("Đã nhận thưởng nhiệm vụ!");
            void network.request<QuestStateResponse>("GET", "/progression/quests").then(st => { state = st; draw(); updateTracker(st); }).catch(() => undefined);
            void network.request<{ gold: number; crystal: number }>("GET", "/player/wallet").then(w => {
              goldEl.textContent = fmt(w.gold); crystalEl.textContent = fmt(w.crystal);
            }).catch(() => undefined);
          }).catch(() => { showToast("Chưa thể nhận thưởng lúc này"); draw(); });
        }));
      };
      draw();
      void network.request<QuestStateResponse>("GET", "/progression/quests").then(st => { state = st; if (root.isConnected) draw(); }).catch(() => undefined);
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
        if (key === "arena") { setTab("world"); opts.onArena?.(); return; }
        if (key === "bag") { renderBag(); return; }
        if (key === "summon") { renderSummon(); return; }
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

  const navEl = root.querySelector("#hub-nav") as HTMLElement;
  const navIconEl = root.querySelector("#hub-navicon") as HTMLElement;
  (root.querySelector("#hub-navtoggle") as HTMLElement).addEventListener("click", () => navEl.classList.toggle("open"));
  const TAB_ICONS: Record<string, string> = { world: ICONS.world, eidolons: ICONS.eidolons, sanctuary: ICONS.sanctuary, quests: ICONS.quests, menu: ICONS.menu };
  const setTab = (tab: string) => {
    navEl.classList.remove("open");
    if (TAB_ICONS[tab]) navIconEl.innerHTML = TAB_ICONS[tab];
    root.querySelectorAll(".hub-nav button[data-tab]").forEach(b => b.classList.toggle("on", (b as HTMLElement).dataset.tab === tab));
    if (tab === "world") { panel.classList.remove("open"); return; }
    renderers[tab]?.();
    panel.classList.add("open");
  };
  root.querySelectorAll(".hub-nav button[data-tab]").forEach(b => b.addEventListener("click", () => setTab((b as HTMLElement).dataset.tab!)));
  root.querySelector("#hub-close")!.addEventListener("click", () => setTab("world"));
  const encEl = root.querySelector("#hub-enc") as HTMLElement;
  const openEncounter = (enc: EncounterUi): void => {
    const def = CREATURES.find(c => c.id === enc.creatureId);
    if (!def) return;
    let orbs = 0;
    let busy = false;
    let over = false;
    encEl.hidden = false;
    encEl.innerHTML = `<div class="enc-card">
      <button class="x enc-x" id="enc-close"><i class="fa-solid fa-xmark"></i></button>
      ${artFor(enc.creatureId, 150)}
      <h3>${def.name}</h3>
      <div class="meta"><span class="chip" style="background:${ELEMENT_COLOR[def.element]};color:#10131a;padding:2px 10px;border-radius:999px;font-weight:700">${ELEMENT_VI[def.element] ?? def.element}</span>
      <span style="color:${RARITY_COLOR[def.rarity]}">${RARITY_VI[def.rarity]}</span><span>Cấp ${enc.level}</span></div>
      <p class="enc-msg" id="enc-msg">Một ${def.name} hoang dã xuất hiện!</p>
      <button class="enc-btn" id="enc-throw" disabled>Đang tải Capture Orb…</button></div>`;
    const msg = encEl.querySelector("#enc-msg") as HTMLElement;
    const btn = encEl.querySelector("#enc-throw") as HTMLButtonElement;
    const close = () => { encEl.hidden = true; encEl.innerHTML = ""; };
    (encEl.querySelector("#enc-close") as HTMLElement).addEventListener("click", close);
    const syncBtn = () => { btn.textContent = over ? "Đóng" : `Ném Capture Orb · còn ${orbs}`; btn.disabled = busy || (!over && orbs <= 0); if (!over && orbs <= 0) btn.textContent = "Hết Capture Orb"; };
    void network.request<{ items: InventoryStack[] }>("GET", "/inventory").then(({ items }) => {
      orbs = items.find(i => i.itemId === "basic_capture_orb")?.quantity ?? 0;
      syncBtn();
    }).catch(() => { msg.textContent = "Không tải được túi đồ"; });
    btn.addEventListener("click", () => {
      if (over) { close(); return; }
      if (busy || orbs <= 0) return;
      busy = true; syncBtn();
      void network.request<{ captured: boolean; fled: boolean; orbsLeft: number }>("POST", `/encounters/${enc.encounterId}/capture`, { captureItemId: "basic_capture_orb" })
        .then(res => {
          orbs = res.orbsLeft;
          if (res.captured) {
            over = true;
            msg.textContent = `Bắt thành công! ${def.name} đã vào bộ sưu tập.`;
            msg.className = "enc-msg good";
            showToast(`Đã thu thập ${def.name}!`);
            refreshParty();
            window.setTimeout(close, 1700);
          } else if (res.fled) {
            over = true;
            msg.textContent = `${def.name} đã bỏ chạy…`;
            msg.className = "enc-msg bad";
          } else {
            msg.textContent = "Nó phá vỡ cầu và thoát ra! Ném tiếp đi.";
            msg.className = "enc-msg bad";
            encEl.classList.remove("shake"); void encEl.offsetWidth; encEl.classList.add("shake");
          }
        })
        .catch((e: Error) => { msg.textContent = e.message; msg.className = "enc-msg bad"; if (/hết hạn|không hợp lệ|rời khỏi/i.test(e.message)) over = true; })
        .finally(() => { busy = false; syncBtn(); });
    });
  };

  return {
    openEncounter,
    setWallet: (w) => {
      if (!w) return;
      goldEl.textContent = fmt(w.gold);
      crystalEl.textContent = fmt(w.crystal);
    },
    destroy: () => {
      window.clearInterval(clockTimer);
      scene.game.events.off("hud:players", onPlayers);
    scene.game.events.off("hud:pos", onPos);
      window.clearInterval(syncTimer);
      window.removeEventListener("resize", sync);
      overlay.remove();
    },
  };
}
