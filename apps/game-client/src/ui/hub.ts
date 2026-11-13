import Phaser from "phaser";
import type { PlayerProfile, PlayerWallet, OwnedCreature, InventoryStack, SummonPullResponse, QuestStateResponse, QuestView, SideQuestView, SanctuaryStateResponse, SanctuaryBuildingView, ExpeditionsResponse, WorkshopResponse, ExpeditionDestinationView, FriendsResponse, FriendView, PlayerSearchResult } from "@eidolith/shared-types";
import { CREATURES, ELEMENTS, creatureById, statsAtLevel, skillsOf } from "@eidolith/game-data";
import { network } from "../net/NetworkManager";
import { CREATURE_SPRITES } from "./sprites";
import { sfxClick, sfxOpen, sfxClose, sfxReward, sfxLevelUp, sfxThrow, sfxCapture, sfxBreakOut, sfxFled } from "./sfx";
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
.hub-root{position:relative;width:1280px;height:720px;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#f4f7fa;pointer-events:none;--sel:#ffd83d;--selink:#26303a;--bar:#3ddc5f;--line:rgba(255,255,255,.10);--plate:rgba(35,43,54,.93);--plate2:rgba(255,255,255,.05)}
.hub-root *{box-sizing:border-box;margin:0;padding:0}
.pcluster{position:absolute;top:14px;left:14px;display:flex;align-items:center;gap:11px;background:linear-gradient(180deg,rgba(46,57,71,.95),rgba(30,37,47,.95));border:1px solid var(--line);border-radius:12px;padding:9px 34px 9px 9px;pointer-events:auto;clip-path:polygon(0 0,100% 0,calc(100% - 18px) 100%,0 100%)}
.pcluster:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#2fae9b}
.pav{position:relative;flex:none}
.pav img{width:56px;height:56px;object-fit:cover;object-position:top;border-radius:50%;border:2px solid rgba(255,255,255,.25);background:#20303a;display:block}
.hud-badge{position:absolute;left:50%;transform:translateX(-50%);bottom:-9px;border-radius:999px;background:var(--sel);color:var(--selink);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:1.5px 9px;font-family:'Baloo 2',sans-serif;white-space:nowrap}
.pmeta{min-width:0}
.pmeta .nm{font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:800;line-height:1.15;white-space:nowrap;color:#fff}
.hud-exp{position:relative;width:196px;height:17px;background:rgba(0,0,0,.42);border-radius:999px;margin-top:4px;overflow:hidden}
.hud-exp i{position:absolute;left:0;top:0;bottom:0;background:#39b6e8;border-radius:999px}
.hud-exp span{position:absolute;inset:0;font-size:11.5px;line-height:17px;text-align:center;color:#fff;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.cur{display:flex;align-items:center;gap:8px;font-size:16.5px;font-weight:700;color:#fff}
.cur .coin{width:29px;height:29px;border-radius:50%;background:#f5b921;display:flex;align-items:center;justify-content:center;color:#5c3a00;font-size:15px;flex:none}
.cur.gem .coin{background:#39b6e8;color:#083a52}
.cur i{font-size:15px}
.cur span{color:#fff}
.qcard-top{position:absolute;top:104px;left:14px;display:flex;align-items:center;gap:11px;background:linear-gradient(180deg,rgba(46,57,71,.95),rgba(30,37,47,.95));border:1px solid var(--line);border-radius:12px;color:#fff;padding:9px 30px 9px 9px;cursor:pointer;pointer-events:auto;max-width:350px;text-align:left;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)}
.qcard-top>i{font-size:16px;color:var(--selink);background:var(--sel);width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}
.qcard-top .qarc{font-size:10.5px;letter-spacing:1.6px;color:var(--sel);font-weight:800}
.qcard-top .qobj-t{font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topright{position:absolute;top:14px;right:14px;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}
.toprow{display:flex;gap:10px;align-items:flex-start;pointer-events:none}
.currencies{display:flex;gap:14px;align-items:center;pointer-events:auto;background:var(--plate);border:1px solid var(--line);border-radius:999px;padding:6px 16px 6px 8px;box-shadow:0 8px 20px rgba(10,15,20,.4)}
.minimap-wrap{position:relative;pointer-events:auto}
.minimap{position:relative;width:158px;height:158px;border-radius:50%;overflow:hidden;background:#22331f;border:4px solid #232b36;outline:2px solid var(--sel);outline-offset:-9px;box-shadow:0 10px 26px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.tick{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--sel);border:1.5px solid #26303a;z-index:4}
.minimap-inner{position:absolute;inset:0}
.minimap img{width:100%;height:100%;display:block;object-fit:cover}
.mdot{position:absolute;width:11px;height:11px;border-radius:50%;background:var(--sel);border:2px solid #26303a;transform:translate(-50%,-50%);box-shadow:0 0 7px rgba(255,216,61,.9);z-index:2}
.mname{position:absolute;right:-4px;bottom:-11px;background:var(--plate);color:#fff;font-size:12.5px;font-weight:700;text-align:center;padding:5px 14px;border:1px solid var(--line);border-radius:999px;white-space:nowrap;z-index:3;box-shadow:0 6px 14px rgba(0,0,0,.4)}
.mmeta{font-size:12.5px;color:#fff;background:var(--plate);border:1px solid var(--line);border-radius:999px;padding:6px 13px;pointer-events:auto;margin-top:2px;box-shadow:0 6px 14px rgba(0,0,0,.35)}
.mmeta #hub-clock{color:var(--sel);font-weight:800}
.mmeta .wsep{color:#aeb9c4;margin:0 7px}
.mmeta #hub-wicon{color:var(--sel);margin-right:5px}
.party{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:8px;pointer-events:auto}
#hub-chat{position:absolute;left:14px;bottom:14px;width:356px;z-index:6;background:rgba(27,33,43,.92);border:1px solid var(--line);border-radius:15px;box-shadow:0 10px 26px rgba(10,15,20,.45);overflow:hidden}
#hub-chat .chead{display:flex;align-items:center;gap:8px;padding:9px 13px;border-bottom:1px solid var(--line);font:800 12px 'Baloo 2',sans-serif;letter-spacing:.13em;color:var(--sel)}
#hub-chat .ctab{background:none;border:none;color:#8b93a0;font:800 12px 'Baloo 2',sans-serif;letter-spacing:.13em;cursor:pointer;padding:2px 4px;position:relative}
#hub-chat .ctab.on{color:var(--sel)}
#hub-chat .cdot{position:absolute;top:-3px;right:-8px;width:8px;height:8px;border-radius:50%;background:#e5484d}
#hub-chat .chead .mapchip{margin-left:auto;background:rgba(57,182,232,.16);border:1px solid rgba(57,182,232,.4);color:#9adcf7;border-radius:999px;padding:2px 9px;font:700 11px 'Be Vietnam Pro',sans-serif;letter-spacing:0}
#hub-chat .msgs{padding:10px 13px 4px;display:flex;flex-direction:column;gap:7px}
#hub-chat .msg{font-size:13.5px;line-height:1.45;color:#e8edf2;word-break:break-word}
#hub-chat .msg .who{font-weight:700}
#hub-chat .msg .when{color:#8b93a0;font-size:11px;margin-left:6px}
#hub-chat .row{display:flex;gap:8px;padding:9px 11px 11px;align-items:center}
#hub-chat input{flex:1;min-width:0;background:rgba(20,26,34,.8);border:1px solid var(--line);border-radius:10px;padding:9px 11px;color:#fff;font:400 13.5px 'Be Vietnam Pro',sans-serif;outline:none}
#hub-chat .send{width:36px;height:36px;flex:none;border-radius:50%;background:var(--sel);color:var(--selink);border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.btn-y{background:var(--sel);color:var(--selink);border:none;border-radius:11px;padding:10px 16px;font:800 14.5px 'Baloo 2',sans-serif;cursor:pointer}
.btn-g{background:rgba(255,255,255,.10);color:#dfe6ec;border:1px solid var(--line);border-radius:11px;padding:10px 14px;font:800 14px 'Baloo 2',sans-serif;cursor:pointer}
.fr-search{display:flex;gap:8px}
.fr-sbox{flex:1;display:flex;align-items:center;gap:9px;background:rgba(20,26,34,.65);border:1px solid var(--line);border-radius:11px;padding:0 13px;color:#8b93a0}
.fr-sbox input{flex:1;min-width:0;background:none;border:none;outline:none;color:#fff;font:400 14.5px 'Be Vietnam Pro',sans-serif;padding:11px 0}
.fr-strip{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.fr-strip .blk{background:var(--plate2);border:1px solid var(--line);border-radius:13px;padding:10px 14px}
.fr-strip .blk b{font:800 22px 'Baloo 2',sans-serif;color:#fff;display:block;line-height:1.05}
.fr-strip .blk span{font-size:12px;letter-spacing:.1em;color:#8b93a0;font-weight:700}
.fr-card{display:flex;gap:14px;align-items:center;background:var(--plate2);border:1px solid var(--line);border-radius:15px;padding:12px 14px;margin-bottom:10px}
.fr-ava{position:relative;width:64px;height:64px;flex:none;border-radius:13px;background:linear-gradient(180deg,rgba(57,182,232,.20),rgba(20,26,34,.6));border:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.fr-ava img{width:54px;height:54px;object-fit:contain}
.fr-ava .ph{font:800 26px 'Baloo 2',sans-serif;color:#fff}
.fr-ava .dotwrap{position:absolute;right:-4px;bottom:-4px;background:var(--plate);border-radius:50%;padding:2px;display:flex}
.fr-ondot{width:10px;height:10px;border-radius:50%;background:var(--bar);box-shadow:0 0 0 3px rgba(61,220,95,.18)}
.fr-offdot{width:10px;height:10px;border-radius:50%;background:#5b6672}
.fr-lvpill{background:var(--sel);color:var(--selink);font:800 11.5px 'Baloo 2',sans-serif;border-radius:999px;padding:2px 8px}
.fr-name{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:17px}
.fr-status{font-size:13px;color:#aeb9c4;margin-top:2px;display:flex;align-items:center;gap:6px}
.fr-team{display:flex;align-items:center;gap:8px;margin-top:7px}
.fr-team .tl{font-size:11px;letter-spacing:.1em;color:#8b93a0;font-weight:700}
.fr-tslots{display:flex;gap:6px}
.fr-tslot{width:40px;height:40px;border-radius:10px;background:rgba(20,26,34,.7);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;overflow:hidden}
.fr-tslot img{width:34px;height:34px;object-fit:contain}
.fr-tslot .ph{font:800 15px 'Baloo 2',sans-serif}
.fr-tslot.empty{border-style:dashed;color:#5b6672;font-size:13px}
.fr-iconbtn{width:40px;height:40px;flex:none;border-radius:11px;background:rgba(255,255,255,.08);border:1px solid var(--line);color:#dfe6ec;font-size:15px;cursor:pointer}
.fr-cnt{background:rgba(255,216,61,.16);border:1px solid rgba(255,216,61,.45);color:var(--sel);border-radius:999px;padding:1px 9px;font-size:12px;margin-left:8px;letter-spacing:0}
.pmini{display:flex;align-items:center;gap:8px;background:var(--plate);border:1px solid var(--line);border-radius:12px;padding:6px 12px 6px 6px;box-shadow:0 8px 20px rgba(10,15,20,.4);cursor:pointer}
.pmini img{width:36px;height:36px;object-fit:contain}
.pmini .pn{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:13.5px;line-height:1;color:#fff}
.pmini .pl{font-size:11px;color:#aeb9c4;font-weight:700}
.pmini .pbar{position:relative;height:11px;min-width:88px;background:rgba(0,0,0,.42);border-radius:999px;margin-top:3px;overflow:hidden}
.pmini .pbar i{position:absolute;left:0;top:0;bottom:0;background:var(--bar);border-radius:999px}
.pmini .pbar span{position:absolute;inset:0;font-size:9.5px;line-height:11px;font-weight:700;color:#fff;padding:0 6px;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.pmini.empty{color:#aeb9c4;font-size:13px;font-weight:700;padding:10px 16px;cursor:default}
.hub-nav{position:absolute;right:14px;bottom:12px;display:flex;flex-direction:column;gap:9px;pointer-events:auto;align-items:flex-end}
.nav-items{display:flex;flex-direction:column;gap:3px;background:rgba(27,33,43,.97);border:1px solid var(--line);border-radius:16px;padding:8px;width:218px;box-shadow:0 14px 34px rgba(10,15,20,.5);transition:opacity .18s ease,transform .18s ease}
.hub-nav:not(.open) .nav-items{opacity:0;transform:translateY(14px);pointer-events:none}
.nav-items .nh{font-size:10.5px;letter-spacing:1.6px;font-weight:800;color:#aeb9c4;padding:4px 10px 6px}
.hub-nav button[data-tab]{display:flex;align-items:center;gap:11px;width:100%;padding:9px 10px;border:none;border-radius:10px;background:none;color:#f4f7fa;font-weight:700;font-size:15px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif;text-align:left}
.hub-nav button[data-tab] .nico{width:22px;text-align:center;font-size:15px;flex:none}
.hub-nav button[data-tab].on{background:var(--sel);color:var(--selink)}
.hub-nav .toggle{width:58px;height:58px;border-radius:50%;background:rgba(27,33,43,.97);border:1px solid var(--line);color:#fff;cursor:pointer;box-shadow:0 10px 24px rgba(10,15,20,.5);position:relative;display:flex;align-items:center;justify-content:center;font-size:22px}
.hub-nav .toggle .chev{position:absolute;right:-3px;top:-3px;width:19px;height:19px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;background:var(--sel);color:var(--selink);border:1.5px solid #26303a}
.hub-nav.open .toggle .chev i{transform:rotate(180deg)}
.hub-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(950px,calc(100% - 150px));max-height:656px;display:none;flex-direction:column;background:rgba(27,33,43,.97);border:1px solid var(--line);border-radius:18px;pointer-events:auto;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6)}
.hub-panel.open{display:flex}
.hub-panel header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}
.hub-panel header h2{font-family:'Baloo 2',sans-serif;font-size:25px;color:#fff}
.hub-panel header .sub{font-size:15px;color:#aeb9c4;margin-top:2px}
.hub-panel .x{width:38px;height:38px;border-radius:10px;background:#e23b3b;color:#fff;border:none;font-size:19px;cursor:pointer;flex:none}
.hub-body{overflow-y:auto;padding:6px 20px 20px;min-height:0;flex:1}
.hub-sec{font-size:12px;font-weight:800;color:var(--sel);letter-spacing:1.6px;margin:15px 0 8px;text-transform:uppercase;font-family:'Be Vietnam Pro',sans-serif}
.slots{display:flex;gap:10px}
.slot{flex:1;min-height:86px;border:1px solid var(--line);border-radius:12px;display:flex;align-items:center;justify-content:flex-start;gap:8px;color:#aeb9c4;font-size:14px;text-align:left;padding:8px 10px;background:var(--plate2);min-width:0}
.slot.empty{justify-content:center;border-style:dashed}
.slot img{width:46px;height:46px;object-fit:contain;flex:none}
.slot .sn{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:14.5px;color:#fff;line-height:1.1;white-space:nowrap}
.slot .sl2{font-size:11px;color:#aeb9c4;font-weight:700;white-space:nowrap}
.dex{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.card{background:var(--plate2);border:1px solid var(--line);border-radius:14px;padding:11px;display:flex;gap:12px;align-items:center}
.card .art{width:74px;height:74px;flex:none;border-radius:12px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;overflow:hidden}
.card .art img{width:74px;height:74px;object-fit:contain}
.card .art .ph{font-size:30px;font-weight:800}
.card h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#fff}
.card .meta{font-size:14.5px;color:#c3ccd4;line-height:1.45}
.chip{display:inline-block;padding:2px 10px;border-radius:99px;font-size:13px;color:#fff;font-weight:700;vertical-align:1px}
.rar{font-weight:700}
.qcard{background:var(--plate2);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.qcard h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#fff;margin-bottom:4px}
.qclaim{margin-top:10px;background:var(--sel);color:var(--selink);border:none;border-radius:10px;padding:9px 18px;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:15px;cursor:pointer}
.qclaim:hover{filter:brightness(1.06)}
.qdone{margin-top:10px;color:#7fe3a0;font-weight:700;font-size:14.5px}
.qrew{color:#aeb9c4;font-size:14px;margin-top:2px}
.dt-head{display:flex;gap:18px;align-items:center}
.dt-head img{width:110px;height:110px;object-fit:contain}
.dt-head .ph{font-size:64px;font-family:'Baloo 2',sans-serif}
.dt-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}
.dt-stat{background:var(--plate2);border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.dt-stat b{display:block;font-family:'Baloo 2',sans-serif;font-size:24px;color:#fff}
.dt-stat span{font-size:12.5px;color:#aeb9c4;letter-spacing:.6px}
.dt-a-top{display:flex;gap:16px;align-items:stretch}
.dt-stage{width:296px;flex:none;border:1px solid var(--line);border-radius:15px;padding:16px 14px 14px;text-align:center;position:relative;overflow:hidden}
.dt-stage .dt-glow{position:absolute;left:50%;top:96px;transform:translate(-50%,-50%);width:190px;height:190px;border-radius:50%;pointer-events:none}
.dt-stage img{width:172px;height:172px;object-fit:contain;position:relative}
.dt-stage .dt-phm{width:172px;height:172px;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center}
.dt-stage .dt-phm .disc{width:138px;height:138px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 64px 'Baloo 2',sans-serif;color:#fff;border:3px solid}
.dt-stage h3{font:800 26px 'Baloo 2',sans-serif;color:#fff;position:relative;margin-top:4px}
.dt-stage .meta{font-size:13.5px;color:#c3ccd4;margin-top:3px;position:relative}
.dt-a-right{flex:1;min-width:0}
.dt-xpbar{height:20px;background:rgba(255,255,255,.10);border-radius:999px;position:relative;overflow:hidden}
.dt-xpbar i{position:absolute;top:0;bottom:0;left:0;background:var(--bar2);border-radius:999px}
.dt-xpbar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.dt-trait{background:rgba(20,26,34,.65);border:1px solid var(--line);border-left:4px solid var(--sel);border-radius:11px;padding:10px 13px;font-size:14px;color:#c3ccd4;margin-top:10px}
.dt-skills{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.dt-sk{background:rgba(20,26,34,.65);border:1px solid var(--line);border-radius:13px;padding:11px 12px;display:flex;gap:10px;align-items:center}
.dt-sk .sic{width:38px;height:38px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}
.dt-sk b{color:#fff;font-size:15px;display:block}
.dt-sk .tag{font-size:10.5px;letter-spacing:.08em;color:var(--sel);font-weight:800}
.dt-corepill{margin-left:auto;background:rgba(255,216,61,.14);border:1px solid rgba(255,216,61,.5);color:var(--sel);font-weight:700;font-size:13px;border-radius:999px;padding:4px 12px;letter-spacing:0;text-transform:none;font-family:'Be Vietnam Pro',sans-serif}
.dt-evo{background:rgba(20,26,34,.65);border:1px solid var(--line);border-radius:14px;padding:13px 14px}
.dt-evo h4{font:800 19px 'Baloo 2',sans-serif;color:#fff}
.dt-evo .rl{font-size:12.5px;color:#aeb9c4;margin:2px 0 7px}
.dt-evo .st{font-size:13px;color:#c3ccd4;line-height:1.5}
.dt-evo .ult{font-size:13px;color:#c3ccd4}
.dt-evo .ult b{color:var(--sel)}
.dt-evobtn{width:100%;margin-top:10px;background:var(--sel);color:var(--selink);border:none;border-radius:11px;padding:10px;font:800 14.5px 'Baloo 2',sans-serif;cursor:pointer}
.dt-evobtn:disabled{background:rgba(255,255,255,.14);color:#8a94a0;cursor:default}
.dt-evobtn.armed{background:#e5484d;color:#fff}
.dt-awake{border:1px solid rgba(255,216,61,.55);background:rgba(255,216,61,.07);border-radius:14px;padding:13px 15px;font-size:14.5px;color:#c3ccd4}
.hearts{color:#ff5a4a;letter-spacing:3px;font-size:16px}
.hearts .off{color:rgba(255,255,255,.16)}
.sk{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;background:var(--plate2);margin-bottom:6px;font-size:15px}
.sk .sic{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12.5px;flex:none}
.sk .tag{margin-left:auto;color:var(--sel);font-weight:800;font-size:11px;letter-spacing:1.2px}
.slot[data-inst]{cursor:pointer}
.dex .card{cursor:pointer}
.qcard p{font-size:15.5px;color:#c3ccd4;line-height:1.5}
.qobj{display:flex;justify-content:space-between;font-size:15.5px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qobj:last-child{border-bottom:none}
.qobj .st{color:#fff;font-weight:700}
.bar{height:10px;background:rgba(0,0,0,.42);border-radius:99px;margin-top:6px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--bar);border-radius:99px}
.tabs{display:flex;gap:8px;margin:4px 0 14px}
.tabs button{flex:1;padding:10px 0;border-radius:11px;border:1px solid var(--line);background:var(--plate2);color:#f4f7fa;font-size:16px;font-weight:700;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif}
.tabs button.on{background:var(--sel);border-color:var(--sel);color:var(--selink)}
.bcard{background:var(--plate2);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;gap:14px;align-items:center}
.bcard .bic{width:52px;height:52px;flex:none;border-radius:12px;background:rgba(255,216,61,.12);display:flex;align-items:center;justify-content:center;color:var(--sel)}
.bcard .bic svg{width:30px;height:30px}
.bcard h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#fff}
.bcard p{font-size:15px;color:#c3ccd4;line-height:1.45}
.bcard .blv{margin-left:auto;font-size:15px;color:var(--sel);font-weight:700;white-space:nowrap}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mgrid button{background:var(--plate2);border:1px solid var(--line);border-radius:14px;color:#f4f7fa;padding:16px 4px 12px;font-size:15.5px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;font-family:'Be Vietnam Pro',sans-serif}
.mgrid button svg{width:30px;height:30px;color:var(--sel)}
.mgrid button i{font-size:27px;color:var(--sel)}
.setrow{display:flex;align-items:center;justify-content:space-between;padding:13px 2px;border-bottom:1px solid rgba(255,255,255,.07);font-size:17px}
.tgl{width:58px;height:32px;border-radius:99px;background:rgba(255,255,255,.16);position:relative;cursor:pointer;flex:none}
.tgl::after{content:'';position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#f4f7fa;transition:left .15s}
.tgl.on{background:#3f9e63}.tgl.on::after{left:30px}
.logout{width:100%;margin-top:18px;padding:15px;border:none;border-radius:14px;background:#8c2f2f;color:#fff;font-size:17.5px;font-weight:700;cursor:pointer}
.logout.confirm{background:#c33}
.enc{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,6,9,.45);pointer-events:auto;z-index:5}
.enc[hidden]{display:none}
.enc-card{position:relative;width:520px;background:rgba(27,33,43,.98);border:1px solid var(--line);border-radius:20px;padding:22px 26px 26px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.6)}
.enc-card img{width:150px;height:150px;object-fit:contain}
.enc-card .ph{font-size:88px;font-weight:800;line-height:150px}
.enc-card h3{font-family:'Baloo 2',sans-serif;font-size:29px;margin-top:6px;color:#fff}
.enc-card .meta{display:flex;gap:8px;justify-content:center;margin-top:9px;font-size:15.5px;color:#aeb9c4}
.enc-msg{min-height:26px;font-size:17px;margin:14px 0 6px;color:#f4f7fa}
.enc-msg.good{color:#7fe3a0}.enc-msg.bad{color:#ff9a8a}
.enc-btn{width:100%;padding:16px;border:none;border-radius:13px;background:var(--sel);color:var(--selink);font-size:18.5px;font-weight:800;cursor:pointer;font-family:'Baloo 2',sans-serif}
.enc-btn:disabled{background:rgba(255,255,255,.14);color:#8a94a0;cursor:default}
.enc-x{position:absolute;top:14px;right:14px}
.enc.shake .enc-card{animation:shk .4s}
@keyframes shk{0%,100%{transform:translateX(0)}25%{transform:translateX(-9px)}75%{transform:translateX(9px)}}
.owned-badge{background:#3f9e63;color:#fff;border-radius:999px;font-size:12.5px;padding:2.5px 9px;font-weight:700}
.sumres{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
.sumres .cell{background:var(--plate2);border:1px solid var(--line);border-radius:14px;padding:12px;text-align:center}
.sumres .cell img{width:96px;height:96px;object-fit:contain}
.sumres .cell .ph{font-size:52px;font-weight:800;line-height:96px}
.bagrow{display:flex;align-items:center;gap:13px;background:var(--plate2);border:1px solid var(--line);border-radius:14px;padding:13px 15px;margin-bottom:10px}
.bagrow i{font-size:24px;color:var(--sel)}
.bagrow .qty{margin-left:auto;font-weight:800;font-size:18px;color:#fff}
.slots.sanc{display:grid;grid-template-columns:1fr 1fr}
.slots.sanc .slotempty{width:auto}
.slotc{display:flex;align-items:center;gap:9px;background:var(--plate2);border:1px solid var(--sel);border-radius:12px;padding:7px 10px;min-width:0}
.slotc img{width:40px;height:40px;object-fit:contain}
.slotc .ph{font-size:24px;font-weight:800;width:40px;text-align:center}
.slotc .snm{font-size:14.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.slotc .smeta{font-size:12.5px;color:#aeb9c4;white-space:nowrap}
.slotc .un{margin-left:auto;background:#3a2323;color:#ff9a9a;border:1px solid #6e3a3a;border-radius:8px;width:28px;height:28px;flex:none;cursor:pointer}
.slotempty{border:1.5px dashed #4a586c;border-radius:12px;background:transparent;color:#9fb0c0;font:600 14px 'Be Vietnam Pro',sans-serif;padding:12px;cursor:pointer;width:100%}
.pickrow{display:flex;align-items:center;gap:11px;width:100%;background:var(--plate2);border:1px solid var(--line);border-radius:12px;padding:9px 12px;margin-bottom:8px;cursor:pointer;color:#fff;text-align:left;font-family:'Be Vietnam Pro',sans-serif}
.pickrow:hover{border-color:var(--sel)}
.pickrow img{width:44px;height:44px;object-fit:contain}
.pickrow .ph{font-size:26px;font-weight:800;width:44px;text-align:center}
.collectbtn{margin-top:10px;background:var(--sel);color:#191203;border:none;border-radius:11px;padding:10px 16px;font:800 15px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.s2-over{display:flex;gap:12px;align-items:stretch;margin-bottom:15px}
.s2-ov{flex:1;background:var(--plate2);border:1px solid var(--line);border-radius:13px;padding:11px 14px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.s2-ov .lab{font-size:10.5px;letter-spacing:1.4px;color:#aeb9c4;font-weight:800}
.s2-ov .big{font-family:'Baloo 2',sans-serif;font-size:19px;color:#fff;line-height:1.2;margin-top:2px;white-space:nowrap}
.s2-ov .small{font-size:12.5px;color:#aeb9c4;margin-top:1px}
.s2-lvpill{display:inline-block;background:var(--sel);color:var(--selink);font:800 12px 'Baloo 2',sans-serif;border-radius:999px;padding:1px 8px;vertical-align:2px;margin-left:5px}
.s2-upmini{margin-top:6px;background:none;border:1px solid var(--sel);color:var(--sel);border-radius:8px;padding:3px 10px;font:700 12px 'Be Vietnam Pro',sans-serif;cursor:pointer;width:max-content}
.s2-collect{background:var(--sel);color:var(--selink);border:none;border-radius:12px;padding:13px 20px;font:800 15px 'Baloo 2',sans-serif;cursor:pointer;white-space:nowrap}
.s2-collect:disabled{background:rgba(255,255,255,.14);color:#8a94a0;cursor:default}
.s2-collectbar{display:flex;align-items:center;gap:14px;background:rgba(24,30,39,.97);border:1px solid var(--line);border-radius:13px;padding:10px 12px 10px 16px;margin:-6px 0 15px}
.s2-collectbar .cb-tot{font-size:14px;color:#aeb9c4}
.s2-collectbar .cb-tot b{color:#fff}
.s2-collectbar .s2-collect{margin-left:auto}
.s2-b{background:var(--plate2);border:1px solid var(--line);border-radius:16px;padding:15px 17px 16px;margin-bottom:15px}
.s2-b.locked{opacity:.65;padding:11px 17px}
.s2-bhead{display:flex;align-items:center;gap:12px}
.s2-bic{width:48px;height:48px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff}
.s2-bhead h3{font-family:'Baloo 2',sans-serif;font-size:20px;color:#fff;line-height:1.1}
.s2-bhead .bd{font-size:13.5px;color:#aeb9c4;margin-top:2px}
.s2-new{background:#e23b3b;color:#fff;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px;letter-spacing:1px;vertical-align:3px;margin-left:7px}
.s2-up{margin-left:auto;background:none;border:1.5px solid var(--sel);color:var(--sel);border-radius:10px;padding:9px 14px;font:800 13.5px 'Be Vietnam Pro',sans-serif;cursor:pointer;white-space:nowrap;flex:none}
.s2-up b{color:#fff;font-family:'Baloo 2',sans-serif}
.s2-up:disabled{border-color:#4a586c;color:#8b93a0;cursor:default}
.s2-confirm{display:flex;gap:10px;align-items:center;margin-top:11px;background:rgba(255,216,61,.08);border:1px solid rgba(255,216,61,.45);border-radius:11px;padding:10px 13px;font-size:14px;color:#f4f7fa}
.s2-confirm .go{background:var(--sel);color:var(--selink);border:none;border-radius:9px;padding:8px 16px;font:800 14px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.s2-confirm .no{background:#39424f;color:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 14px;font:700 14px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.s2-specs{display:flex;gap:22px;margin:11px 0;font-size:13px;color:#aeb9c4;flex-wrap:wrap}
.s2-specs b{color:#e8edf2}
.s2-specs .k{color:var(--sel);font-weight:800;letter-spacing:.8px;font-size:11px}
.s2-abar{position:relative;height:18px;background:rgba(0,0,0,.42);border-radius:999px;overflow:hidden;margin-bottom:13px}
.s2-abar i{position:absolute;left:0;top:0;bottom:0;background:var(--bar);border-radius:999px}
.s2-abar span{position:absolute;inset:0;font-size:11.5px;line-height:18px;font-weight:700;color:#fff;padding:0 10px;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.s2-slots{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.s2-slot{background:rgba(20,26,34,.65);border:1px solid var(--line);border-radius:13px;padding:10px 12px;display:flex;gap:10px;align-items:center;min-width:0;overflow:hidden}
.s2-slot .nm{font:800 15px 'Baloo 2',sans-serif;color:#fff;line-height:1.1;white-space:nowrap}
.s2-slot .m2{font:600 11.5px 'Be Vietnam Pro',sans-serif;color:#aeb9c4}
.s2-slot .acc{font-size:12.5px;color:#7fe3a0;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s2-syn{display:inline-block;background:rgba(255,216,61,.16);border:1px solid var(--sel);color:var(--sel);font-size:10.5px;font-weight:800;border-radius:99px;padding:1px 7px;margin-left:5px;vertical-align:1px}
.s2-slot .un{margin-left:auto;background:#3a2323;color:#ff9a9a;border:1px solid #6e3a3a;border-radius:8px;width:30px;height:30px;flex:none;cursor:pointer}
.s2-empty{border:1.5px dashed #4a586c;border-radius:13px;background:transparent;color:#9fb0c0;font:700 14px 'Be Vietnam Pro',sans-serif;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;min-height:66px}
.s2-empty .hint{font-size:11.5px;color:#8b93a0;font-weight:600}
.s2-locktag{margin-left:auto;color:var(--sel);font:800 13.5px 'Baloo 2',sans-serif;white-space:nowrap}
.pickrow.dis{opacity:.55;cursor:default}
.pickrow.dis:hover{border-color:var(--line)}
.pickrow.sel{border-color:var(--sel);background:rgba(255,216,61,.10)}
.s2-dest{display:flex;gap:12px;align-items:center;background:rgba(20,26,34,.65);border:1px solid var(--line);border-radius:13px;padding:11px 13px;margin-top:10px}
.s2-dest .nm2{font:800 15.5px 'Baloo 2',sans-serif;color:#fff}
.s2-dest .sub2{font-size:12.5px;color:#aeb9c4;margin-top:1px}
.s2-dest .s2-up{margin-left:auto}
.dlg-card{text-align:left}
.dlg-card h3{margin-top:0}
.dlg-card .say{font-size:16.5px;line-height:1.5;color:#e8e2d2;margin:10px 0}
.dlg-card .qmeta{font-size:14.5px;color:#aeb9c4;margin:6px 0 14px}
.dlg-actions{display:flex;gap:10px;margin-top:8px}
.dlg-actions .go{flex:1;background:var(--sel);color:#191203;border:none;border-radius:11px;padding:12px;font:800 16px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.dlg-actions .back{flex:1;background:#39424f;color:#fff;border:1px solid var(--line);border-radius:11px;padding:12px;font:700 16px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.qstate{font-size:13px;font-weight:700;border-radius:999px;padding:3px 10px;background:#39424f;color:#cfe0ee;white-space:nowrap}
.qstate.ok{background:#3f9e63;color:#fff}
.qstate.done{background:#6b5a1e;color:#ffd83d}
.toast{position:absolute;left:50%;transform:translateX(-50%);bottom:92px;background:rgba(27,33,43,.97);border:1px solid var(--line);color:#fff;padding:11px 20px;border-radius:999px;font-size:16px;font-weight:600;display:none;pointer-events:none;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.45)}
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
function sideCard(q: SideQuestView): string {
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
  const rew = q.rewards.map(r => `+${r.amount} ${CURRENCY_VI[r.currency] ?? r.currency}`).join(" · ");
  const chip = q.state === "claimed" ? `<span class="qstate ok">Đã xong</span>`
    : q.state === "complete" ? `<span class="qstate done">Về gặp ${q.npcName} nhận thưởng</span>`
    : q.state === "active" ? `<span class="qstate">Đang làm ${q.progress}/${q.target}</span>`
    : `<span class="qstate">Chưa nhận — gặp ${q.npcName}</span>`;
  return `<div class="qcard"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h3>${q.title}</h3>${chip}</div>
    <p>${q.npcName} · ${q.npcRole} — Thưởng: ${rew}</p>
    <div class="bar"><i style="width:${pct}%"></i></div></div>`;
}
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
  openNpc: (npcName: string) => void;
  openBoss: () => void;
}

export interface HubHudInfo { mapLabel: string; weatherLabel: string; weatherKey: string; startMinutes: number; players: number; mapId: string; mapW: number; mapH: number; }
const WEATHER_ICON: Record<string, string> = { clear: "fa-sun", cloudy: "fa-cloud", rain: "fa-cloud-rain", wind: "fa-wind", storm: "fa-cloud-bolt", fog: "fa-smog", snow: "fa-snowflake" };
export function mountHub(scene: Phaser.Scene, opts: { profile: PlayerProfile; hud: HubHudInfo; onLogout: () => void; onArena?: () => void; onBoss?: () => void; onFriendBattle?: (playerId: string) => void }): HubHandle {
  const p = opts.profile;
  const regionName = p.currentRegion.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const avatar = p.avatarId === "wanderer_female" ? "assets/chars/wanderer-female-v4.png" : "assets/chars/wanderer-v4.png";
  const html = `<style>${CSS}</style><div class="hub-root">
    <div class="pcluster">
      <div class="pav"><img src="${avatar}" alt=""/><span class="hud-badge">Lv.<span id="hub-lv">${p.level}</span></span></div>
      <div class="pmeta"><div class="nm">${p.displayName}</div>
        <div class="hud-exp"><i id="hub-exp-fill" style="width:${Math.min(100, Math.round((p.experience / (100 * p.level)) * 100))}%"></i><span id="hub-exp-txt">EXP ${p.experience}/${100 * p.level}</span></div></div>
    </div>
    <button class="qcard-top" id="hub-qtrack"><i class="fa-solid fa-scroll"></i><span><span class="qarc">ARC 0 · NHIỆM VỤ CHÍNH</span><br/><span class="qobj-t">Nói chuyện với Elder Rowan</span></span></button>
    <div class="topright">
      <div class="toprow">
      <div class="currencies">
        <div class="cur gold"><span class="coin">${TOP_ICONS.coin}</span><span id="w-gold">—</span></div>
        <div class="cur gem"><span class="coin">${TOP_ICONS.gem}</span><span id="w-crystal">—</span></div>
      </div>
      <div class="minimap-wrap"><span class="tick" style="left:50%;top:-4px;transform:translateX(-50%)"></span><span class="tick" style="left:50%;bottom:-4px;transform:translateX(-50%)"></span><span class="tick" style="top:50%;left:-4px;transform:translateY(-50%)"></span><span class="tick" style="top:50%;right:-4px;transform:translateY(-50%)"></span><div class="minimap"><div class="minimap-inner"><img src="assets/maps/minimap-${opts.hud.mapId}.png" alt=""/><span class="mdot" id="hub-mdot" style="left:50%;top:50%"></span></div></div></div>
      </div>
      <div class="mmeta"><span id="hub-clock"></span><span class="wsep">|</span><i id="hub-wicon" class="fa-solid ${WEATHER_ICON[opts.hud.weatherKey] ?? "fa-cloud-sun"}"></i> ${opts.hud.weatherLabel}</div>
    </div>
    <div class="party" id="hub-party"></div>
    <div id="hub-chat"><div class="chead"><button class="ctab on" id="hub-chat-tab-zone">KHU VỰC<span class="cdot" id="hub-chat-dot-zone" hidden></span></button><button class="ctab" id="hub-chat-tab-world">THẾ GIỚI<span class="cdot" id="hub-chat-dot-world" hidden></span></button><span class="mapchip"><i class="fa-solid fa-location-dot" id="hub-chat-chip-icon"></i> <span id="hub-chat-map"></span></span></div><div class="msgs" id="hub-chat-msgs"></div><div class="row"><input id="hub-chat-in" maxlength="200" placeholder="Nhắn cho mọi người quanh đây…"/><button class="send" id="hub-chat-send"><i class="fa-solid fa-paper-plane"></i></button></div></div>
    <section class="hub-panel" id="hub-panel"><header><div><h2 id="hub-title"></h2><div class="sub" id="hub-sub"></div></div><button class="x" id="hub-close"><i class="fa-solid fa-xmark"></i></button></header><div class="hub-body" id="hub-body"></div></section>
    <div class="enc" id="hub-enc" hidden></div>
    <div class="enc" id="hub-dlg" hidden></div>
    <div class="toast" id="hub-toast"></div>
    <nav class="hub-nav" id="hub-nav">
      <div class="nav-items">
      <div class="nh">MENU CHÍNH</div>
      <button data-tab="world" class="on"><span class="nico">${ICONS.world}</span><span>Thế giới</span></button>
      <button data-tab="eidolons"><span class="nico">${ICONS.eidolons}</span><span>Eidolons</span></button>
      <button data-tab="sanctuary"><span class="nico">${ICONS.sanctuary}</span><span>Sanctuary</span></button>
      <button data-tab="menu"><span class="nico">${ICONS.menu}</span><span>Menu</span></button>
      </div>
      <button class="toggle" id="hub-navtoggle"><span id="hub-navicon"><i class="fa-solid fa-bars"></i></span></button>
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
  // UI SFX pack (Part 15): one delegated tick for every enabled button
  // in the hub; meaningful actions layer their own cue on top.
  root.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (b && !(b as HTMLButtonElement).disabled) sfxClick();
  });
  // Live world clock (+0.4 game-min per real second, same rate as the world)
  // and player count via the game's hud:players event.
  let minutes = opts.hud.startMinutes;
  const clockEl = root.querySelector("#hub-clock") as HTMLElement;
  const drawClock = () => {
    const h = Math.floor(minutes / 60) % 24, m = Math.floor(minutes % 60);
    clockEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  drawClock();
  const clockTimer = window.setInterval(() => { minutes = (minutes + 0.4) % 1440; drawClock(); }, 1000);
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
  // Zone chat (Phase 6): last 5 messages + input; send via world WS.
  const chatMsgs = root.querySelector("#hub-chat-msgs") as HTMLElement;
  const chatIn = root.querySelector("#hub-chat-in") as HTMLInputElement;
  const CHAT_MAP_NAME: Record<string, string> = { meadow_village: "Meadow Village", whispering_forest: "Whispering Forest", ancient_grove: "Ancient Grove" };
  (root.querySelector("#hub-chat-map") as HTMLElement).textContent = CHAT_MAP_NAME[opts.hud.mapId] ?? opts.hud.mapId;
  const CHAT_COLORS = ["#ffd83d", "#3ddc5f", "#ff9a5a", "#c792ff", "#ff7ab0", "#ffe066"];
  const chatColorFor = (id: string) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CHAT_COLORS[h % CHAT_COLORS.length]; };
  type ChatLine = { name: string; content: string; self: boolean; pid: string; ts: number };
  const chatStore: Record<"zone" | "world", ChatLine[]> = { zone: [], world: [] };
  let chatTab: "zone" | "world" = "zone";
  const tabZone = root.querySelector("#hub-chat-tab-zone") as HTMLElement;
  const tabWorld = root.querySelector("#hub-chat-tab-world") as HTMLElement;
  const dotZone = root.querySelector("#hub-chat-dot-zone") as HTMLElement;
  const dotWorld = root.querySelector("#hub-chat-dot-world") as HTMLElement;
  const chipText = root.querySelector("#hub-chat-map") as HTMLElement;
  const chipIcon = root.querySelector("#hub-chat-chip-icon") as HTMLElement;
  const mapName = CHAT_MAP_NAME[opts.hud.mapId] ?? opts.hud.mapId;
  const lineEl = (l: ChatLine) => {
    const d = document.createElement("div");
    d.className = "msg";
    const who = document.createElement("span");
    who.className = "who";
    who.style.color = l.self ? "#39b6e8" : chatColorFor(l.pid);
    who.textContent = l.name;
    const when = document.createElement("span");
    when.className = "when";
    const dt = new Date(l.ts);
    when.textContent = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    d.appendChild(who); d.appendChild(when); d.appendChild(document.createElement("br"));
    d.appendChild(document.createTextNode(l.content));
    return d;
  };
  const renderChat = () => {
    chatMsgs.innerHTML = "";
    for (const l of chatStore[chatTab].slice(-5)) chatMsgs.appendChild(lineEl(l));
  };
  const setChatTab = (t: "zone" | "world") => {
    chatTab = t;
    tabZone.classList.toggle("on", t === "zone");
    tabWorld.classList.toggle("on", t === "world");
    if (t === "zone") { dotZone.hidden = true; chipIcon.className = "fa-solid fa-location-dot"; chipText.textContent = mapName; chatIn.placeholder = "Nhắn cho mọi người quanh đây…"; }
    else { dotWorld.hidden = true; chipIcon.className = "fa-solid fa-globe"; chipText.textContent = "Toàn máy chủ"; chatIn.placeholder = "Nhắn cho cả thế giới…"; }
    renderChat();
  };
  tabZone.addEventListener("click", () => setChatTab("zone"));
  tabWorld.addEventListener("click", () => setChatTab("world"));
  chipText.textContent = mapName;
  const appendChat = (channel: "zone" | "world", l: ChatLine) => {
    const arr = chatStore[channel];
    arr.push(l);
    if (arr.length > 30) arr.splice(0, arr.length - 30);
    if (channel === chatTab) renderChat();
    else if (channel === "world") dotWorld.hidden = false;
    else dotZone.hidden = false;
  };
  const sendChat = () => {
    const v = chatIn.value.trim();
    if (!v) return;
    network.send("world.chat.send", { content: v, channel: chatTab });
    chatIn.value = "";
  };
  (root.querySelector("#hub-chat-send") as HTMLElement).addEventListener("click", sendChat);
  chatIn.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); sendChat(); }
  });
  const unsubChat = network.subscribe("world.chat.message", (p: { playerId: string; displayName: string; content: string; ts: number; channel?: string }) => {
    appendChat(p.channel === "world" ? "world" : "zone", {
      name: p.displayName, content: p.content, self: p.playerId === opts.profile.playerId, pid: p.playerId, ts: p.ts,
    });
  });
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
        const sp = SPRITES[it.creatureId];
        const xpNext = it.level >= 50 ? 0 : 60 + 40 * it.level;
        const pct = xpNext ? Math.min(100, Math.round((it.experience / xpNext) * 100)) : 100;
        return `<div class="pmini" data-party title="${it.name} · Lv.${it.level}">${sp ? `<img src="${sp}" alt=""/>` : ""}<span><span class="pn">${it.name}</span> <span class="pl">Lv.${it.level}</span><div class="pbar"><i style="width:${pct}%"></i><span>${it.level >= 50 ? "MAX" : `XP ${it.experience}/${xpNext}`}</span></div></span></div>`;
      }),
      ...Array(Math.max(0, 5 - team.length)).fill(`<div class="pmini empty" data-party>Ô trống</div>`),
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
          sfxReward();
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
          const xpNext = it.level >= 50 ? 0 : 60 + 40 * it.level;
          return `<div class="slot" data-inst="${it.instanceId}">${sp ? `<img src="${sp}" alt=""/>` : ""}<span><span class="sn">${it.name}</span><br/><span class="sl2">Lv.${it.level} · ${it.level >= 50 ? "MAX" : `XP ${it.experience}/${xpNext}`}</span></span></div>`;
        }), ...Array(Math.max(0, 5 - team.length)).fill(`<div class="slot empty">Ô trống</div>`)].join("");
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
          void network.request<PlayerWallet>("GET", "/player/wallet").then(w => {
            if (!root.isConnected) return;
            renderDetail(it, w.evolutionCore);
          }).catch(() => { if (root.isConnected) renderDetail(it, 0); });
        };
        const renderDetail = (it: OwnedCreature, cores: number): void => {
          const def = creatureById(it.creatureId);
          if (!def) return;
          const st = statsAtLevel(def, it.level);
          const xpNext = it.level >= 50 ? 0 : 60 + 40 * it.level;
          const xpPct = xpNext ? Math.min(100, Math.round((it.experience / xpNext) * 100)) : 100;
          const hearts = Array.from({ length: 10 }, (_, i) => `<i class="fa-solid fa-heart ${i < it.bondLevel ? "" : "off"}"></i>`).join("");
          const elc = ELEMENT_COLOR[it.element] ?? "#666";
          const skills = skillsOf(it.creatureId).map(sk => `<div class="dt-sk"><span class="sic" style="background:${elc}"><i class="fa-solid ${sk.slot === 3 ? "fa-star" : sk.slot === 2 ? "fa-shield-halved" : "fa-paw"}"></i></span><span><b>${sk.name}</b><span class="tag">${sk.slot === 3 ? "CHIÊU CUỐI" : sk.slot === 2 ? "KỸ NĂNG" : "ĐÒN THƯỜNG"}</span></span></div>`).join("");
          const evoSection = evoSectionFor(it, def, cores);
          const sp = SPRITES[it.creatureId];
          sub.textContent = `Chi tiết Eidolon`;
          body.innerHTML = `<button class="qclaim" id="dt-back" style="margin:0 0 12px">← Bộ sưu tập</button>
            <div class="dt-a-top">
              <div class="dt-stage" style="background:linear-gradient(180deg, ${elc}30, rgba(35,43,54,.85) 62%)">
                <div class="dt-glow" style="background:radial-gradient(circle, ${elc}66, transparent 68%)"></div>
                ${sp ? `<img src="${sp}" alt="${it.name}"/>` : `<div class="dt-phm"><div class="disc" style="background:${elc}26;border-color:${elc}">${it.name.slice(0, 1)}</div></div>`}
                <h3>${it.name} · Lv.${it.level}</h3>
                <div class="meta"><span class="chip" style="background:${elc}">${ELEMENT_VI[it.element] ?? it.element}</span> <span class="rar" style="color:${elc}">${RARITY_VI[it.rarity]}</span></div>
                <div class="meta">${ROLE_VI[it.role]} · ${def.habitat || "Chưa rõ nơi sống"}</div>
                <div class="hearts" style="margin-top:6px;position:relative">${hearts}<span style="color:#aeb9c4;font-size:13.5px;letter-spacing:0"> Bond ${it.bondLevel}/10</span></div>
              </div>
              <div class="dt-a-right">
                <div class="hub-sec" style="margin-top:0">Kinh nghiệm</div>
                <div class="dt-xpbar"><i style="width:${xpPct}%"></i><span>${it.level >= 50 ? "MAX" : `${it.experience} / ${xpNext} XP`}</span></div>
                ${def.descriptionVi ? `<p style="font-size:14.5px;color:#c3ccd4;margin-top:11px">${def.descriptionVi}</p>` : ""}
                <div class="dt-grid" style="margin:10px 0 0">
                  <div class="dt-stat"><b>${st.hp}</b><span>MÁU (HP)</span></div>
                  <div class="dt-stat"><b>${st.atk}</b><span>TẤN CÔNG</span></div>
                  <div class="dt-stat"><b>${st.def}</b><span>PHÒNG THỦ</span></div>
                  <div class="dt-stat"><b>${st.spd}</b><span>TỐC ĐỘ</span></div>
                </div>
                ${def.traitName ? `<div class="dt-trait"><b style="color:var(--sel)">Đặc tính — ${def.traitName}:</b> ${def.traitDescVi || ""}</div>` : ""}
                <div class="hub-sec">Kỹ năng</div>
                <div class="dt-skills">${skills}</div>
              </div>
            </div>
            ${evoSection}`;
          (body.querySelector("#dt-back") as HTMLElement).addEventListener("click", () => renderers.eidolons());
          body.querySelectorAll<HTMLElement>("[data-evolve]").forEach(btn => btn.addEventListener("click", () => {
            const tid = btn.dataset.evolve!;
            if (!btn.dataset.armed) {
              btn.dataset.armed = "1";
              btn.textContent = "Chạm lại để xác nhận — tốn 1 Evolution Core";
              btn.classList.add("armed");
              return;
            }
            btn.setAttribute("disabled", "1"); btn.textContent = "Đang tiến hoá…";
            void network.request<{ toCreatureId: string }>("POST", `/creatures/${it.instanceId}/evolve`, { targetId: tid }).then(() => {
              sfxLevelUp();
              showToast(`Đã tiến hoá thành ${creatureById(tid)?.name ?? tid}!`);
              refreshParty();
              void network.request<{ items: OwnedCreature[] }>("GET", "/creatures").then(({ items }) => {
                const updated = items.find(x => x.instanceId === it.instanceId);
                if (updated && root.isConnected) showDetail(updated);
              }).catch(() => undefined);
            }).catch((e: Error) => { showToast(e.message); showDetail(it); });
          }));
        };
        // Evolution section (approved EVOLUTION-DRAFT-v1, detail mock A):
        // one card per branch target; evolved forms show an Awakened banner.
        const evoSectionFor = (it: OwnedCreature, def: ReturnType<typeof creatureById>, cores: number): string => {
          if (!def) return "";
          if (def.evolvedFrom) {
            const base = creatureById(def.evolvedFrom);
            return `<div class="hub-sec">Tiến hoá</div><div class="dt-awake"><i class="fa-solid fa-gem" style="color:var(--sel)"></i> Dạng <b style="color:var(--sel)">Awakened</b> — đã tiến hoá từ ${base?.name ?? def.evolvedFrom}. Bậc Ascended sẽ mở ở giai đoạn sau.</div>`;
          }
          const targets = def.evolutionTargets ?? [];
          if (!targets.length) return "";
          const cards = targets.map(tid => {
            const t = creatureById(tid);
            if (!t) return "";
            const tst = statsAtLevel(t, it.level);
            const telc = ELEMENT_COLOR[t.element] ?? "#666";
            const dis = it.level < 16 ? "Cần Lv.16" : cores < 1 ? "Thiếu Evolution Core" : null;
            return `<div class="dt-evo"><h4>${t.name}</h4><div class="rl"><span class="chip" style="background:${telc}">${ELEMENT_VI[t.element] ?? t.element}</span> ${ROLE_VI[t.role]} · ${RARITY_VI[t.rarity]}</div><div class="st">HP ${tst.hp} · ATK ${tst.atk} · DEF ${tst.def} · SPD ${tst.spd}</div><div class="ult">Chiêu cuối: <b>${t.skillNames[2]}</b></div>${dis ? `<button class="dt-evobtn" disabled>${dis}</button>` : `<button class="dt-evobtn" data-evolve="${tid}">Tiến hoá · 1 Core</button>`}</div>`;
          }).join("");
          return `<div class="hub-sec" style="display:flex;align-items:center">Nhánh tiến hoá<span class="dt-corepill"><i class="fa-solid fa-gem"></i> Đang có: ${cores} Evolution Core</span></div><div style="display:grid;grid-template-columns:repeat(${targets.length},1fr);gap:12px">${cards}</div><p style="font-size:13px;color:#8b93a0;margin-top:8px">Chỉ số tính ở Lv.${it.level} hiện tại. Tiến hoá giữ nguyên cấp, XP và Bond — không quay lại được.</p>`;
        };
        body.querySelectorAll<HTMLElement>(".slot[data-inst]").forEach(el => el.addEventListener("click", () => { const it = byId.get(el.dataset.inst!); if (it) showDetail(it); }));
        body.querySelectorAll<HTMLElement>(".dex .card").forEach((el, idx) => el.addEventListener("click", () => { const it = bestOf.get(CREATURES[idx].id); if (it) showDetail(it); }));
      }).catch(() => { sub.textContent = "Không tải được bộ sưu tập"; });
    },
    sanctuary: () => {
      title.textContent = "Sanctuary"; sub.textContent = "Căn cứ của Wanderer — nơi Eidolon nghỉ ngơi, rèn luyện và nghiên cứu";
      body.innerHTML = `<p style="font-size:15.5px;color:#9a937f">Đang tải…</p>`;
      const BICON: Record<string, [string, string]> = {
        bond_garden: ["fa-seedling", "#3f9e63"], training_ground: ["fa-dumbbell", "#d0812a"],
        research_lab: ["fa-flask", "#3973b8"], evo_shrine: ["fa-gem", "#6b4fa1"],
        expedition_gate: ["fa-compass", "#4a7a9e"], workshop: ["fa-hammer", "#7a6a4f"],
      };
      const CUR_VI: Record<string, string> = { gold: "Gold", crystal: "Crystal", bond_essence: "Bond Essence", research_data: "Research Data", evolution_core: "Evolution Core" };
      const UNIT: Record<string, string> = { bond: "Bond", xp: "XP", data: "Data" };
      const fmtDur = (sec: number): string => {
        if (sec <= 0) return "ngay";
        const m = Math.ceil(sec / 60);
        if (m < 60) return `${m} phút`;
        const h = Math.floor(m / 60), mm = m % 60;
        return mm ? `${h} giờ ${mm} phút` : `${h} giờ`;
      };
      const rateText = (bd: SanctuaryBuildingView): string => bd.kind === "bond"
        ? (bd.perMinute >= 1 ? `${bd.perMinute} Bond / phút` : `1 Bond / ${Math.round(1 / bd.perMinute)} phút`)
        : bd.kind === "xp" ? `${bd.perMinute} XP / phút` : `${Math.round(bd.perMinute * 60)} Data / giờ`;
      const refreshWallet = (): void => {
        void network.request<PlayerWallet>("GET", "/player/wallet").then(w => {
          if (!root.isConnected) return;
          goldEl.textContent = fmt(w.gold); crystalEl.textContent = fmt(w.crystal);
        }).catch(() => undefined);
      };
      void (async () => {
        try {
          const [state, owned, expState, shopState] = await Promise.all([
            network.request<SanctuaryStateResponse>("GET", "/sanctuary"),
            network.request<{ items: OwnedCreature[] }>("GET", "/creatures"),
            network.request<ExpeditionsResponse>("GET", "/sanctuary/expeditions"),
            network.request<WorkshopResponse>("GET", "/sanctuary/workshop"),
          ]);
          if (!root.isConnected) return;
          const byInstance = new Map(owned.items.map(c => [c.instanceId, c]));
          const assignedIds = new Set(state.buildings.flatMap(bd => bd.assignments.map(a => a.instanceId)));
          const whereOf = new Map<string, string>();
          for (const bd of state.buildings) for (const a of bd.assignments) whereOf.set(a.instanceId, bd.nameVi);
          const defOf = (cid: string) => CREATURES.find(c => c.id === cid);
          const thumb = (cid: string, size = 44) => artFor(cid, size);
          let confirmId: string | null = null;

          const upLabel = (bd: SanctuaryBuildingView): string => {
            const u = bd.upgrade!;
            const cost = u.data > 0 ? `${fmt(u.gold)} Gold + ${u.data} Data` : `${fmt(u.gold)} Gold`;
            return `Nâng cấp · <b>${cost}</b>`;
          };
          const SHORT: Record<string, string> = { bond_garden: "Vườn", training_ground: "Sân tập", research_lab: "Lab" };
          const confirmRow = (bd: SanctuaryBuildingView): string => {
            const u = bd.upgrade!;
            const cost = u.data > 0 ? `${fmt(u.gold)} Gold và ${u.data} Research Data` : `${fmt(u.gold)} Gold`;
            return `<div class="s2-confirm"><span>Nâng <b>${bd.nameVi}</b> lên <b>Lv.${u.toLevel}</b>? Trừ ${cost}.</span><span style="margin-left:auto;display:flex;gap:8px"><button class="go" data-upgo="${bd.id}">Nâng cấp</button><button class="no" data-upno="1">Huỷ</button></span></div>`;
          };
          const upButton = (bd: SanctuaryBuildingView): string => {
            if (!bd.upgrade) return "";
            if (bd.upgrade.blockedByHall) return `<button class="s2-up" disabled>Cần Nhà chính Lv.${bd.upgrade.toLevel}</button>`;
            return `<button class="s2-up" data-upgrade="${bd.id}">${upLabel(bd)}</button>`;
          };

          const bhead = (bd: SanctuaryBuildingView, icon: string, color: string): string =>
            `<div class="s2-bhead"><div class="s2-bic" style="background:${color}"><i class="fa-solid ${icon}"></i></div><div><h3>${bd.nameVi}</h3><div class="bd">${bd.descVi}</div></div><span class="s2-lvpill">Lv.${bd.level}</span></div>`;
          const expCard = (bd: SanctuaryBuildingView): string => {
            const [icon, color] = BICON[bd.id] ?? ["fa-compass", "#4a7a9e"];
            const act = expState.active.map(e => {
              const st = new Date(e.startedAt).getTime(), en = new Date(e.endsAt).getTime();
              const pct = Math.max(0, Math.min(100, Math.round(((Date.now() - st) / Math.max(1, en - st)) * 100)));
              return `<div class="s2-dest"><div style="min-width:0;flex:1"><div class="nm2">${e.nameVi}</div><div class="sub2">${e.creatureNames.join(" · ")}</div><div class="s2-abar" style="margin:7px 0 0"><i style="width:${e.ready ? 100 : pct}%"></i><span>${e.ready ? "Đội đã về — chờ nhận kết quả" : `Còn ${fmtDur(Math.max(0, (en - Date.now()) / 1000))}`}</span></div></div>${e.ready ? `<button class="s2-up" data-claim="${e.id}">Nhận kết quả</button>` : ""}</div>`;
            }).join("");
            const dests = expState.destinations.map(d => `<div class="s2-dest"><div style="min-width:0"><div class="nm2">${d.nameVi} <span class="chip" style="background:#39424f;font-size:11px">${fmtDur(d.minutes * 60)}</span></div><div class="sub2">${d.requiresText}</div><div class="sub2">Phần thưởng: ${d.rewardText}</div></div><button class="s2-up" data-exp-pick="${d.id}">Gửi đội đi</button></div>`).join("");
            return `<div class="s2-b">${bhead(bd, icon, color)}${act ? `<div class="hub-sec" style="margin-top:12px">Đội đang đi</div>${act}` : ""}<div class="hub-sec" style="margin-top:12px">Điểm đến</div>${dests}<p style="font-size:12.5px;color:#8b93a0;margin-top:10px">Eidolon đang đi thám hiểm không thể phân công hay ra trận cho đến khi nhận kết quả chuyến đi.</p></div>`;
          };
          const shopCard = (bd: SanctuaryBuildingView): string => {
            const [icon, color] = BICON[bd.id] ?? ["fa-hammer", "#7a6a4f"];
            const rows = shopState.recipes.map(r => `<div class="s2-dest"><div style="min-width:0"><div class="nm2">${r.nameVi}</div><div class="sub2">Giá: ${r.costs.map(c => `${fmt(c.amount)} ${CUR_VI[c.currency] ?? c.currency}`).join(" + ")}</div></div><button class="s2-up" data-craft="${r.id}" ${r.canAfford ? "" : "disabled"}>Chế tạo</button></div>`).join("");
            return `<div class="s2-b">${bhead(bd, icon, color)}${rows}</div>`;
          };
          const draw = (): void => {
            const hall = state.buildings.find(b => b.id === "main_hall")!;
            const work = state.buildings.filter(b => b.kind === "bond" || b.kind === "xp" || b.kind === "data");
            const used = work.reduce((n, b) => n + b.assignments.length, 0);
            const totalSlots = work.reduce((n, b) => n + b.slots, 0);
            const t = state.totals;
            const totParts = [t.bond ? `+${t.bond} Bond` : "", t.xp ? `+${t.xp} XP` : "", t.data ? `+${t.data} Data` : ""].filter(Boolean).join(" · ");
            let html = `<div class="s2-over">
              <div class="s2-ov"><span class="lab">CẤP SANCTUARY</span><span class="big">Nhà chính<span class="s2-lvpill">Lv.${hall.level}</span></span><span class="small">Trần tích luỹ ${state.capHours} giờ</span>${hall.upgrade ? `<button class="s2-upmini" data-upgrade="main_hall">Nâng cấp · ${fmt(hall.upgrade.gold)} Gold</button>` : `<span class="small">Đã đạt cấp tối đa</span>`}</div>
              <div class="s2-ov"><span class="lab">ĐANG LÀM VIỆC</span><span class="big">${used} / ${totalSlots} ô</span><span class="small">${work.map(b => `${SHORT[b.id] ?? b.nameVi} ${b.assignments.length}`).join(" · ")}</span></div>
              <div class="s2-ov"><span class="lab">CHỜ THU HOẠCH</span><span class="big" style="color:var(--sel)">${totParts || "Chưa có gì"}</span><span class="small">Research Data đang có: ${fmt(state.researchData)}</span></div>
            </div>`;
            html += `<div class="s2-collectbar"><span class="cb-tot">${totParts ? `Đang chờ thu hoạch: <b>${totParts}</b>` : "Chưa có gì để thu hoạch"}</span><button class="s2-collect" data-collectall="1" ${totParts ? "" : "disabled"}><i class="fa-solid fa-box-open"></i> Thu hoạch tất cả</button></div>`;
            if (confirmId === "main_hall") html += confirmRow(hall);
            for (const bd of state.buildings) {
              if (bd.id === "main_hall") continue;
              const [icon, color] = BICON[bd.id] ?? ["fa-house", "#8a6d3b"];
              if (bd.kind === "locked") {
                html += `<div class="s2-b locked"><div class="s2-bhead"><div class="s2-bic" style="background:${color};width:40px;height:40px;font-size:18px"><i class="fa-solid ${icon}"></i></div><div><h3 style="font-size:18px">${bd.nameVi}</h3><div class="bd">${bd.descVi}</div></div><span class="s2-locktag"><i class="fa-solid fa-lock"></i> Chưa mở khoá</span></div></div>`;
                continue;
              }
              if (bd.kind === "shrine") {
                html += `<div class="s2-b">${bhead(bd, icon, color)}<p style="font-size:14px;color:#c3ccd4;margin-top:12px">Đài đã mở. Tiến hoá thực hiện trong <b>thẻ chi tiết của từng Eidolon</b> (mục Eidolons): cần <b>Lv.16 + 1 Evolution Core</b>. Mỗi loài có 2–3 nhánh với vai trò khác nhau — chọn kỹ, tiến hoá không quay lại được.</p></div>`;
                continue;
              }
              if (bd.kind === "expedition") { html += expCard(bd); continue; }
              if (bd.kind === "workshop") { html += shopCard(bd); continue; }
              const unit = UNIT[bd.kind] ?? "";
              const totAcc = bd.assignments.reduce((n, a) => n + a.accrued, 0);
              const totCap = bd.assignments.reduce((n, a) => n + (a.progress01 > 0 ? a.accrued / a.progress01 : 0), 0);
              const minCap = bd.assignments.length ? Math.min(...bd.assignments.map(a => a.capInSec)) : 0;
              const abar = bd.assignments.length
                ? `<div class="s2-abar"><i style="width:${totCap > 0 ? Math.min(100, Math.round((totAcc / totCap) * 100)) : 0}%"></i><span>${totAcc > 0 ? `Đã tích ${totAcc} / ${Math.round(totCap)} ${unit} · ${minCap <= 0 ? "đã đầy trần" : `đầy sau ${fmtDur(minCap)}`}` : `Chưa tích luỹ — Eidolon đang làm việc`}</span></div>`
                : "";
              html += `<div class="s2-b">
                <div class="s2-bhead"><div class="s2-bic" style="background:${color}"><i class="fa-solid ${icon}"></i></div>
                  <div><h3>${bd.nameVi}${bd.id === "research_lab" ? `<span class="s2-new">MỚI</span>` : ""}</h3><div class="bd">${bd.descVi}</div></div>
                  <span class="s2-lvpill">Lv.${bd.level}</span>${upButton(bd)}</div>
                ${confirmId === bd.id ? confirmRow(bd) : ""}
                <div class="s2-specs"><span><span class="k">SẢN LƯỢNG</span> <b>${rateText(bd)}</b></span><span><span class="k">Ô</span> <b>${bd.assignments.length} / ${bd.slots}</b></span><span><span class="k">CỘNG HƯỞNG</span> <b>${bd.synergyElements.join(" · ")} +20%</b></span><span><span class="k">TRẦN</span> <b>${state.capHours} giờ</b></span></div>
                ${abar}
                <div class="s2-slots">`;
              for (const a of bd.assignments) {
                const c = byInstance.get(a.instanceId); const d = defOf(a.creatureId);
                const m2 = bd.kind === "bond" ? `Bond ${c?.bondLevel ?? 0}` : bd.kind === "xp" ? `XP ${c?.experience ?? 0}` : (d ? ROLE_VI[d.role] : "");
                const acc = a.capInSec <= 0 ? `+${a.accrued} ${unit} · Đã đầy trần` : `+${a.accrued} ${unit} · sau ${fmtDur(a.nextUnitInSec)}`;
                html += `<div class="s2-slot">${thumb(a.creatureId, 46)}<div style="min-width:0"><div class="nm">${d?.name ?? a.creatureId} <span class="chip" style="background:var(--sel);color:var(--selink);font-size:10.5px">Lv.${a.level}</span> <span class="chip" style="background:${ELEMENT_COLOR[d?.element ?? ""] ?? "#666"};font-size:10.5px">${d?.element ?? ""}</span> <span class="m2">${m2}</span></div><div class="acc">${acc}${a.synergy ? `<span class="s2-syn">+20%</span>` : ""}</div></div><button class="un" data-unassign="${a.instanceId}" title="Rút về (phần chưa thu hoạch sẽ mất)"><i class="fa-solid fa-xmark"></i></button></div>`;
              }
              for (let i = bd.assignments.length; i < bd.slots; i++)
                html += `<button class="s2-empty" data-pick="${bd.id}">+ Phân công Eidolon<span class="hint">Hợp: ${bd.synergyElements.join(" · ")} / ${bd.synergyRoles.map(r => ROLE_VI[r] ?? r).join(" · ")}</span></button>`;
              html += `</div></div>`;
            }
            html += `<p style="font-size:13px;color:#8b93a0;margin-top:2px">Tích luỹ tối đa ${state.capHours} giờ cho mỗi Eidolon theo cấp Nhà chính. Rút về trước khi thu hoạch sẽ mất phần chưa thu.</p>`;
            body.innerHTML = html;
            wire();
          };

          const drawPicker = (bd: SanctuaryBuildingView): void => {
            const isSyn = (c: OwnedCreature) => { const d = defOf(c.creatureId); return !!d && (bd.synergyElements.includes(d.element) || bd.synergyRoles.includes(d.role)); };
            const free = owned.items.filter(c => !assignedIds.has(c.instanceId));
            const sugg = free.filter(isSyn);
            const rest = free.filter(c => !isSyn(c));
            const row = (c: OwnedCreature, syn: boolean): string => {
              const d = defOf(c.creatureId);
              return `<button class="pickrow" data-assign="${c.instanceId}">${thumb(c.creatureId)}<span><b>${d?.name ?? c.creatureId}</b> <span class="chip" style="background:var(--sel);color:var(--selink);font-size:10.5px">Lv.${c.level}</span> <span class="chip" style="background:${ELEMENT_COLOR[d?.element ?? ""] ?? "#666"};font-size:10.5px">${d?.element ?? ""}</span> <span style="color:#aeb9c4;font-size:13px">${d ? ROLE_VI[d.role] : ""} · Bond ${c.bondLevel}</span>${syn ? `<span class="s2-syn">HỢP +20%</span>` : ""}</span></button>`;
            };
            const elsewhere = owned.items.filter(c => assignedIds.has(c.instanceId));
            body.innerHTML = `<div class="hub-sec">Phân công vào ${bd.nameVi} — sản lượng ${rateText(bd)}</div>`
              + (sugg.length ? `<div class="hub-sec" style="margin-top:4px">Gợi ý — hợp công trình này</div>` + sugg.map(c => row(c, true)).join("") : "")
              + (rest.length ? `<div class="hub-sec">Tất cả Eidolon</div>` + rest.map(c => row(c, false)).join("") : "")
              + (!free.length ? `<p style="font-size:15.5px;color:#9a937f">Mọi Eidolon đều đã được phân công.</p>` : "")
              + (elsewhere.length ? `<div class="hub-sec">Đang phân công nơi khác</div>` + elsewhere.map(c => { const d = defOf(c.creatureId); return `<button class="pickrow dis" disabled>${thumb(c.creatureId)}<span><b>${d?.name ?? c.creatureId}</b> <span style="color:#aeb9c4;font-size:13px">Đang ở ${whereOf.get(c.instanceId) ?? ""} — rút về mới phân công lại được</span></span></button>`; }).join("") : "")
              + `<button class="slotempty" id="pick-back" style="margin-top:6px">← Quay lại Sanctuary</button>`;
            body.querySelector("#pick-back")?.addEventListener("click", () => draw());
            body.querySelectorAll<HTMLElement>("[data-assign]").forEach(b2 => b2.addEventListener("click", () => {
              void network.request("POST", "/sanctuary/assign", { buildingId: bd.id, creatureInstanceId: b2.dataset.assign }).then(() => { showToast("Đã phân công!"); renderers.sanctuary(); }).catch((e: Error) => showToast(e.message));
            }));
          };

          const drawExpPicker = (dest: ExpeditionDestinationView): void => {
            const awayIds = new Set(expState.active.flatMap(e => e.creatureIds));
            const free = owned.items.filter(c => !assignedIds.has(c.instanceId) && !awayIds.has(c.instanceId));
            const sel = new Set<string>();
            const row = (c: OwnedCreature): string => {
              const d = defOf(c.creatureId);
              return `<button class="pickrow" data-exp-sel="${c.instanceId}">${thumb(c.creatureId)}<span><b>${d?.name ?? c.creatureId}</b> <span class="chip" style="background:var(--sel);color:var(--selink);font-size:10.5px">Lv.${c.level}</span> <span class="chip" style="background:${ELEMENT_COLOR[d?.element ?? ""] ?? "#666"};font-size:10.5px">${d?.element ?? ""}</span> <span style="color:#aeb9c4;font-size:13px">${d ? ROLE_VI[d.role] : ""} · Bond ${c.bondLevel}</span></span></button>`;
            };
            body.innerHTML = `<div class="hub-sec">Gửi đội đi — ${dest.nameVi} · ${fmtDur(dest.minutes * 60)}</div>
              <p style="font-size:13.5px;color:#aeb9c4;margin:2px 0 8px">${dest.requiresText} · Chọn 1–3 Eidolon. Phần thưởng: ${dest.rewardText}.</p>`
              + (free.length ? free.map(row).join("") : `<p style="font-size:15.5px;color:#9a937f">Không có Eidolon nào rảnh (đang phân công hoặc đang đi chuyến khác).</p>`)
              + `<div id="exp-status" style="font-size:14px;color:#aeb9c4;margin-top:10px">Đã chọn 0/3</div>
              <div style="display:flex;gap:10px;margin-top:8px"><button class="s2-up" id="exp-start" disabled style="margin-left:0">Xuất phát</button><button class="slotempty" id="exp-back">← Quay lại Sanctuary</button></div>`;
            const status = body.querySelector("#exp-status") as HTMLElement;
            const startBtn = body.querySelector("#exp-start") as HTMLButtonElement;
            const refreshStatus = (): void => {
              const chosen = owned.items.filter(c => sel.has(c.instanceId));
              const sumLv = chosen.reduce((n, c) => n + c.level, 0);
              let req = "";
              let okReq = true;
              if (dest.needElement) { const has = chosen.some(c => defOf(c.creatureId)?.element === dest.needElement); req = ` · Cần 1 hệ ${dest.needElement}: ${has ? "đủ" : "chưa có"}`; okReq = okReq && has; }
              if (dest.minTotalLevel) { req = ` · Tổng cấp ${sumLv}/${dest.minTotalLevel}`; okReq = okReq && sumLv >= dest.minTotalLevel; }
              status.textContent = `Đã chọn ${sel.size}/3${req}`;
              startBtn.disabled = !(sel.size >= 1 && okReq);
            };
            body.querySelectorAll<HTMLElement>("[data-exp-sel]").forEach(b2 => b2.addEventListener("click", () => {
              const id = b2.dataset.expSel!;
              if (sel.has(id)) { sel.delete(id); b2.classList.remove("sel"); }
              else if (sel.size >= 3) { showToast("Mỗi chuyến tối đa 3 Eidolon"); return; }
              else { sel.add(id); b2.classList.add("sel"); }
              refreshStatus();
            }));
            body.querySelector("#exp-back")?.addEventListener("click", () => draw());
            startBtn.addEventListener("click", () => {
              void network.request("POST", "/sanctuary/expeditions/start", { destinationId: dest.id, creatureInstanceIds: [...sel] }).then(() => { showToast("Đội đã xuất phát!"); renderers.sanctuary(); }).catch((e: Error) => showToast(e.message));
            });
          };
          const wire = (): void => {
            body.querySelectorAll<HTMLElement>("[data-unassign]").forEach(btn => btn.addEventListener("click", () => {
              void network.request("POST", "/sanctuary/unassign", { creatureInstanceId: btn.dataset.unassign }).then(() => { showToast("Đã rút Eidolon về"); renderers.sanctuary(); }).catch((e: Error) => showToast(e.message));
            }));
            body.querySelector<HTMLElement>("[data-collectall]")?.addEventListener("click", () => {
              void network.request<{ totals: { bond: number; xp: number; data: number } }>("POST", "/sanctuary/collect-all", {}).then(r => {
                if (r.totals.bond || r.totals.xp || r.totals.data) sfxReward();
                const parts = [r.totals.bond ? `+${r.totals.bond} Bond` : "", r.totals.xp ? `+${r.totals.xp} XP` : "", r.totals.data ? `+${r.totals.data} Data` : ""].filter(Boolean).join(" · ");
                showToast(parts ? `Thu hoạch xong: ${parts}` : "Chưa có gì để thu hoạch");
                renderers.sanctuary(); refreshParty(); refreshWallet();
              }).catch((e: Error) => showToast(e.message));
            });
            body.querySelectorAll<HTMLElement>("[data-upgrade]").forEach(btn => btn.addEventListener("click", () => { confirmId = btn.dataset.upgrade!; draw(); }));
            body.querySelector<HTMLElement>("[data-upno]")?.addEventListener("click", () => { confirmId = null; draw(); });
            body.querySelector<HTMLElement>("[data-upgo]")?.addEventListener("click", (ev) => {
              const id = (ev.currentTarget as HTMLElement).dataset.upgo!;
              void network.request<{ level: number }>("POST", `/sanctuary/buildings/${id}/upgrade`, {}).then(r => {
                showToast(`Đã nâng cấp lên Lv.${r.level}!`);
                confirmId = null; renderers.sanctuary(); refreshWallet();
              }).catch((e: Error) => { showToast(e.message); confirmId = null; draw(); });
            });
            body.querySelectorAll<HTMLElement>("[data-pick]").forEach(btn => btn.addEventListener("click", () => {
              const bd = state.buildings.find(b => b.id === btn.dataset.pick)!;
              drawPicker(bd);
            }));
            body.querySelectorAll<HTMLElement>("[data-exp-pick]").forEach(btn => btn.addEventListener("click", () => {
              const dest = expState.destinations.find(d => d.id === btn.dataset.expPick)!;
              drawExpPicker(dest);
            }));
            body.querySelectorAll<HTMLElement>("[data-claim]").forEach(btn => btn.addEventListener("click", () => {
              void network.request<{ rewards: { currency: string; amount: number }[] }>("POST", `/sanctuary/expeditions/${btn.dataset.claim}/claim`, {}).then(r => {
                sfxReward();
                showToast(`Đội đã về: ${r.rewards.map(x => `+${x.amount} ${CUR_VI[x.currency] ?? x.currency}`).join(" · ")}`);
                renderers.sanctuary(); refreshWallet();
              }).catch((e: Error) => showToast(e.message));
            }));
            body.querySelectorAll<HTMLElement>("[data-craft]").forEach(btn => btn.addEventListener("click", () => {
              void network.request<{ itemId: string; qty: number }>("POST", "/sanctuary/workshop/craft", { recipeId: btn.dataset.craft }).then(() => {
                showToast("Chế tạo xong — vật phẩm đã vào Túi đồ");
                renderers.sanctuary(); refreshWallet();
              }).catch((e: Error) => showToast(e.message));
            }));
          };
          draw();
        } catch (e) {
          body.innerHTML = `<p style="font-size:15.5px;color:#e88">${e instanceof Error ? e.message : "Không tải được Sanctuary"}</p>`;
        }
      })();
    },
    friends: () => {
      // Redesign A "Thẻ đồng hành" (approved mockup): summary strip, rich
      // companion cards with team preview + current map, request cards.
      title.textContent = "Bạn bè"; sub.textContent = "Kết bạn · đấu giao hữu · rủ nhau đi săn";
      body.innerHTML = `<div id="fr-main"><p style="color:#8b93a0;font-size:14px">Đang tải…</p></div>`;
      const main = body.querySelector("#fr-main") as HTMLElement;
      const MAP_NAME: Record<string, string> = { meadow_village: "Meadow Village", whispering_forest: "Whispering Forest", ancient_grove: "Ancient Grove" };
      const AVATAR_IMG: Record<string, string> = { wanderer_male: "assets/chars/wanderer-v4.png", wanderer_female: "assets/chars/wanderer-female-v4.png", avatar_default: "assets/chars/wanderer-v4.png" };
      const avaHtml = (f: FriendView) => `<div class="fr-ava">${AVATAR_IMG[f.avatarId] ? `<img src="${AVATAR_IMG[f.avatarId]}" alt=""/>` : `<span class="ph">${f.displayName.slice(0, 1).toUpperCase()}</span>`}<span class="dotwrap"><span class="${f.online ? "fr-ondot" : "fr-offdot"}"></span></span></div>`;
      const teamHtml = (f: FriendView) => {
        const slots: string[] = [];
        for (let i = 0; i < 5; i++) {
          const t = (f.team ?? [])[i];
          if (!t) { slots.push(`<span class="fr-tslot empty"><i class="fa-solid fa-plus"></i></span>`); continue; }
          const def = creatureById(t.creatureId);
          const nm = def?.name ?? t.creatureId;
          const sp = SPRITES[t.creatureId];
          slots.push(sp
            ? `<span class="fr-tslot" title="${nm} · Lv.${t.level}"><img src="${sp}" alt="${nm}"/></span>`
            : `<span class="fr-tslot" title="${nm} · Lv.${t.level}"><span class="ph" style="color:${ELEMENT_COLOR[def?.element ?? ""] ?? "#999"}">${nm.slice(0, 1)}</span></span>`);
        }
        return `<div class="fr-team"><span class="tl">ĐỘI HÌNH</span><div class="fr-tslots">${slots.join("")}</div></div>`;
      };
      const headHtml = (f: FriendView, status: string) => `${avaHtml(f)}<div style="flex:1;min-width:0"><div class="fr-name">${f.displayName} <span class="fr-lvpill">Lv.${f.level}</span></div><div class="fr-status">${status}</div></div>`;
      const paint = async () => {
        try {
          const d = await network.request<FriendsResponse>("GET", "/social/friends");
          const onlineCount = d.friends.filter(f => f.online).length;
          let h = `<div class="fr-strip">
            <div class="blk"><b>${d.friends.length}</b><span>TỔNG SỐ BẠN</span></div>
            <div class="blk"><b style="color:var(--bar)">${onlineCount}</b><span>ĐANG ONLINE</span></div>
            <div class="blk"><b style="color:var(--sel)">${d.incoming.length}</b><span>LỜI MỜI MỚI</span></div></div>
            <div class="fr-search" style="margin-top:12px"><div class="fr-sbox"><i class="fa-solid fa-magnifying-glass"></i><input id="fr-q" placeholder="Tìm người chơi theo tên…"/></div><button class="btn-y" id="fr-go">Tìm</button></div>
            <div id="fr-results"></div>`;
          if (d.incoming.length) h += `<div class="hub-sec">Lời mời kết bạn<span class="fr-cnt">${d.incoming.length}</span></div>` + d.incoming.map(f => `<div class="fr-card">${headHtml(f, "Muốn kết bạn với bạn")}<div style="display:flex;gap:8px;flex:none"><button class="btn-y" data-acc="${f.requestId}">Chấp nhận</button><button class="btn-g" data-dec="${f.requestId}">Từ chối</button></div></div>`).join("");
          h += `<div class="hub-sec">Danh sách bạn</div>`;
          h += d.friends.length
            ? d.friends.map(f => `<div class="fr-card">${avaHtml(f)}<div style="flex:1;min-width:0"><div class="fr-name">${f.displayName} <span class="fr-lvpill">Lv.${f.level}</span></div><div class="fr-status">${f.online ? `<i class="fa-solid fa-location-dot" style="color:var(--bar2)"></i> Đang ở ${MAP_NAME[f.mapId ?? ""] ?? "thế giới"}` : `<i class="fa-solid fa-clock"></i> Offline`}</div>${teamHtml(f)}</div><div style="display:flex;gap:8px;align-items:center;flex:none"><button class="${f.online ? "btn-y" : "btn-g"}" data-duel="${f.playerId}"><i class="fa-solid fa-bolt"></i> Đấu giao hữu</button><button class="fr-iconbtn" data-unf="${f.playerId}" title="Huỷ kết bạn"><i class="fa-solid fa-user-xmark"></i></button></div></div>`).join("")
            : `<p style="color:#8b93a0;font-size:14px">Chưa có bạn nào — tìm người chơi ở ô trên và gửi lời mời nhé.</p>`;
          if (d.outgoing.length) h += `<div class="hub-sec">Đã gửi lời mời</div>` + d.outgoing.map(f => `<div class="fr-card">${headHtml(f, "Đang chờ phản hồi…")}</div>`).join("");
          main.innerHTML = h;
          main.querySelectorAll("[data-acc]").forEach(b => b.addEventListener("click", async () => { try { await network.request("POST", `/social/friends/${(b as HTMLElement).dataset.acc}/accept`); showToast("Đã kết bạn!"); void paint(); } catch (e) { showToast(e instanceof Error ? e.message : "Lỗi"); } }));
          main.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", async () => { try { await network.request("POST", `/social/friends/${(b as HTMLElement).dataset.dec}/decline`); void paint(); } catch (e) { showToast(e instanceof Error ? e.message : "Lỗi"); } }));
          main.querySelectorAll("[data-unf]").forEach(b => b.addEventListener("click", async () => { try { await network.request("DELETE", `/social/friends/${(b as HTMLElement).dataset.unf}`); showToast("Đã huỷ kết bạn"); void paint(); } catch (e) { showToast(e instanceof Error ? e.message : "Lỗi"); } }));
          main.querySelectorAll("[data-duel]").forEach(b => b.addEventListener("click", () => { opts.onFriendBattle?.((b as HTMLElement).dataset.duel!); }));
          const results = main.querySelector("#fr-results") as HTMLElement;
          const doSearch = async () => {
            const q = (main.querySelector("#fr-q") as HTMLInputElement).value.trim();
            if (q.length < 2) { showToast("Nhập ít nhất 2 ký tự"); return; }
            try {
              const d2 = await network.request<{ results: PlayerSearchResult[] }>("GET", `/social/search?q=${encodeURIComponent(q)}`);
              results.innerHTML = `<div class="hub-sec">Kết quả tìm kiếm</div>` + (d2.results.length ? d2.results.map(r => {
                const act = r.relation === "friend" ? `<span style="color:#3ddc5f;font-size:13px;font-weight:700">Đã là bạn</span>`
                  : r.relation === "outgoing" ? `<span style="color:#8b93a0;font-size:13px">Đã gửi lời mời</span>`
                  : r.relation === "incoming" ? `<button class="btn-y" data-add="${r.playerId}">Chấp nhận lời mời</button>`
                  : `<button class="btn-y" data-add="${r.playerId}">Kết bạn</button>`;
                return `<div class="fr-card">${headHtml(r, r.online ? "Đang online" : "Offline")}<div style="flex:none">${act}</div></div>`;
              }).join("") : `<p style="color:#8b93a0;font-size:14px">Không tìm thấy người chơi nào.</p>`);
              results.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", async () => { try { const r = await network.request<{ status: string }>("POST", "/social/friends/request", { playerId: (b as HTMLElement).dataset.add }); showToast(r.status === "accepted" ? "Đã kết bạn!" : "Đã gửi lời mời"); void doSearch(); void paint(); } catch (e) { showToast(e instanceof Error ? e.message : "Lỗi"); } }));
            } catch (e) { showToast(e instanceof Error ? e.message : "Lỗi tìm kiếm"); }
          };
          (main.querySelector("#fr-go") as HTMLElement).addEventListener("click", () => void doSearch());
          (main.querySelector("#fr-q") as HTMLInputElement).addEventListener("keydown", (e) => { if (e.key === "Enter") void doSearch(); });
        } catch (e) { main.innerHTML = `<p style="color:#ff9a8a;font-size:14px">${e instanceof Error ? e.message : "Lỗi tải bạn bè"}</p>`; }
      };
      void paint();
    },
    quests: () => {
      title.textContent = "Nhiệm vụ"; sub.textContent = "Nhật ký nhiệm vụ";
      let tab = "main";
      let state: QuestStateResponse | null = null;
      const draw = () => {
        const list = !state ? `<p style="font-size:15.5px;color:#9a937f">Đang tải…</p>`
          : tab === "side" ? (state.side.length ? state.side.map(sideCard).join("") : `<div class="qcard"><h3>Chưa có nhiệm vụ phụ</h3><p>Hãy nói chuyện với dân làng Meadow Village.</p></div>`)
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
            sfxReward();
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
        if (key === "friends") { renderers.friends(); return; }
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
  (root.querySelector("#hub-navtoggle") as HTMLElement).addEventListener("click", () => navEl.classList.toggle("open"));
  const setTab = (tab: string) => {
    navEl.classList.remove("open");
    root.querySelectorAll(".hub-nav button[data-tab]").forEach(b => b.classList.toggle("on", (b as HTMLElement).dataset.tab === tab));
    if (tab === "world") { panel.classList.remove("open"); sfxClose(); return; }
    renderers[tab]?.();
    panel.classList.add("open");
    sfxOpen();
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
      sfxThrow();
      void network.request<{ captured: boolean; fled: boolean; orbsLeft: number }>("POST", `/encounters/${enc.encounterId}/capture`, { captureItemId: "basic_capture_orb" })
        .then(res => {
          orbs = res.orbsLeft;
          if (res.captured) {
            sfxCapture();
            over = true;
            msg.textContent = `Bắt thành công! ${def.name} đã vào bộ sưu tập.`;
            msg.className = "enc-msg good";
            showToast(`Đã thu thập ${def.name}!`);
            refreshParty();
            window.setTimeout(close, 1700);
          } else if (res.fled) {
            sfxFled();
            over = true;
            msg.textContent = `${def.name} đã bỏ chạy…`;
            msg.className = "enc-msg bad";
          } else {
            sfxBreakOut();
            msg.textContent = "Nó phá vỡ cầu và thoát ra! Ném tiếp đi.";
            msg.className = "enc-msg bad";
            encEl.classList.remove("shake"); void encEl.offsetWidth; encEl.classList.add("shake");
          }
        })
        .catch((e: Error) => { msg.textContent = e.message; msg.className = "enc-msg bad"; if (/hết hạn|không hợp lệ|rời khỏi/i.test(e.message)) over = true; })
        .finally(() => { busy = false; syncBtn(); });
    });
  };

  const dlgEl = root.querySelector("#hub-dlg") as HTMLElement;
  const closeDlg = () => { dlgEl.hidden = true; dlgEl.innerHTML = ""; };
  const openNpc = (npcName: string): void => {
    void network.request<QuestStateResponse>("GET", "/progression/quests").then(st => {
      const q = st.side.find(x => x.npcName === npcName);
      const role = q?.npcRole ?? "";
      let inner: string;
      if (!q || q.state === "claimed") {
        inner = `<div class="say">Cảm ơn Wanderer. Từ ngày ngươi tới, Meadow Village yên bình hơn hẳn.</div>
          <div class="dlg-actions"><button class="back" id="dlg-close">Đóng</button></div>`;
      } else if (q.state === "available") {
        const rew = q.rewards.map(r => `+${r.amount} ${CURRENCY_VI[r.currency] ?? r.currency}`).join(" · ");
        inner = `<div class="say">${q.giverText}</div>
          <div class="qmeta">Nhiệm vụ: <b style="color:#fff">${q.title}</b> (0/${q.target}) · Thưởng: ${rew}</div>
          <div class="dlg-actions"><button class="go" id="dlg-accept">Nhận nhiệm vụ</button><button class="back" id="dlg-close">Để sau</button></div>`;
      } else if (q.state === "active") {
        inner = `<div class="say">${q.progressText}</div>
          <div class="qmeta">Nhiệm vụ: <b style="color:#fff">${q.title}</b> — tiến độ ${q.progress}/${q.target}</div>
          <div class="dlg-actions"><button class="back" id="dlg-close">Đóng</button></div>`;
      } else {
        const rew = q.rewards.map(r => `+${r.amount} ${CURRENCY_VI[r.currency] ?? r.currency}`).join(" · ");
        inner = `<div class="say">Ngươi làm được rồi, Wanderer! Đây là phần thưởng đã hứa.</div>
          <div class="qmeta">Nhiệm vụ: <b style="color:#fff">${q.title}</b> hoàn thành · Thưởng: ${rew}</div>
          <div class="dlg-actions"><button class="go" id="dlg-claim">Nhận thưởng</button><button class="back" id="dlg-close">Để sau</button></div>`;
      }
      dlgEl.innerHTML = `<div class="enc-card dlg-card" style="width:560px"><h3>${npcName}</h3><div class="meta" style="justify-content:flex-start"><span>${role}</span></div>${inner}</div>`;
      dlgEl.hidden = false;
      dlgEl.querySelector("#dlg-close")?.addEventListener("click", closeDlg);
      dlgEl.querySelector("#dlg-accept")?.addEventListener("click", () => {
        void network.request("POST", `/progression/quests/side/${q!.key}/accept`, {}).then(() => { showToast(`Đã nhận nhiệm vụ: ${q!.title}`); closeDlg(); void network.request<QuestStateResponse>("GET", "/progression/quests").then(updateTracker).catch(() => undefined); }).catch((e: Error) => showToast(e.message));
      });
      dlgEl.querySelector("#dlg-claim")?.addEventListener("click", () => {
        void network.request("POST", `/progression/quests/side/${q!.key}/claim`, {}).then(() => {
          sfxReward();
          showToast("Đã nhận thưởng nhiệm vụ phụ!");
          void network.request<{ gold: number; crystal: number }>("GET", "/player/wallet").then(w => { goldEl.textContent = fmt(w.gold); crystalEl.textContent = fmt(w.crystal); }).catch(() => undefined);
          closeDlg();
        }).catch((e: Error) => showToast(e.message));
      });
    }).catch(() => showToast("Không nói chuyện được lúc này"));
  };
  const openBoss = (): void => {
    dlgEl.innerHTML = `<div class="enc-card dlg-card" style="width:560px"><h3>Ancient Treant</h3>
      <div class="meta" style="justify-content:flex-start"><span>Boss khu vực · Ancient Grove</span></div>
      <div class="say">Cổ thụ nghìn năm đang ngủ say giữa đấu trường. Đánh thức nó dậy là một trận chiến thật sự — đội hình 5 Eidolon đầu tiên của bạn sẽ ra trận.</div>
      <div class="qmeta">Thắng: nhận Evolution Core + Gold (lần thắng đầu mỗi ngày được thưởng đầy đủ).</div>
      <div class="dlg-actions"><button class="go" id="dlg-fight">Vào trận</button><button class="back" id="dlg-close">Để sau</button></div></div>`;
    dlgEl.hidden = false;
    dlgEl.querySelector("#dlg-close")?.addEventListener("click", closeDlg);
    dlgEl.querySelector("#dlg-fight")?.addEventListener("click", () => { closeDlg(); opts.onBoss?.(); });
  };

  return {
    openEncounter,
    openNpc,
    openBoss,
    setWallet: (w) => {
      if (!w) return;
      goldEl.textContent = fmt(w.gold);
      crystalEl.textContent = fmt(w.crystal);
    },
    destroy: () => {
      unsubChat();
      window.clearInterval(clockTimer);
    scene.game.events.off("hud:pos", onPos);
      window.clearInterval(syncTimer);
      window.removeEventListener("resize", sync);
      overlay.remove();
    },
  };
}
