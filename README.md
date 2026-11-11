# Eidolith – The Forgotten Wilds

**Thể loại:** Monster Collection Strategy RPG
**Nền tảng:** Android / iOS — Portrait 9:16
**Đồ họa:** 2D Pixel Art, Camera Isometric
**Combat:** Auto Battle – Free Movement, đội hình 5 Eidolon
**Engine:** Phaser 3 + TypeScript (client) · Node.js + PostgreSQL + Redis (server)
**Mô hình:** Free-to-Play

Người chơi vào vai **Wanderer** khám phá thế giới **Aetheria**, thu phục và huấn luyện các sinh vật **Eidolon**, tiến hóa theo nhánh, xây dựng đội hình chiến thuật và phát triển căn cứ **Sanctuary**, trên hành trình thu thập các mảnh **Origin Core** bị vỡ sau sự kiện The Great Fracture.

## Tài liệu thiết kế (nguồn chuẩn)

| Tài liệu | Nội dung |
|---|---|
| [docs/EIDOLITH-GDS-v1.0.md](docs/EIDOLITH-GDS-v1.0.md) | GDS Part 1 — tổng quan, world/lore, gameplay, Eidolon, combat, Sanctuary, economy, multiplayer, UI, kỹ thuật, database, MVP (§1–19) |
| [docs/EIDOLITH-GDS-PART2-v1.1.md](docs/EIDOLITH-GDS-PART2-v1.1.md) | GDS Part 2 — Systems & Production: world map, thời tiết, quest, skill, trait, equipment, inventory, expedition, social, dungeon, boss, arena, guild, events, admin, API (§20–39) |
| [docs/EIDOLITH-GDS-PART3-v1.2.md](docs/EIDOLITH-GDS-PART3-v1.2.md) | GDS Part 3 — Content Production Bible: element/role database, 20 Eidolon đầu tiên, evolution, boss, NPC, item, spawn, asset bible (§40–52) |
| [docs/EIDOLITH-TDD-PART4-v1.0.md](docs/EIDOLITH-TDD-PART4-v1.0.md) | TDD Part 4 — kiến trúc hệ thống, Phaser client, isometric, Tiled pipeline, world networking, combat engine deterministic, API/WebSocket, bảo mật, DevOps, testing, MVP implementation plan 7 phase |
| [docs/EIDOLITH-DDD-PART5-v1.0.md](docs/EIDOLITH-DDD-PART5-v1.0.md) | DDD Part 5 — schema PostgreSQL đầy đủ (account, creature, combat, world, inventory, economy, progression, social, guild, trading, event, PvP, admin/audit), Redis, migration/seed, transaction spec |
| [docs/EIDOLITH-API-PART6-v1.0.md](docs/EIDOLITH-API-PART6-v1.0.md) | Part 6 — API & WebSocket Protocol: REST endpoints đầy đủ, WS envelope/events, reconnect, error code registry, rate limit, Network Manager, luồng end-to-end |
| [docs/EIDOLITH-COMBAT-PART7-v1.0.md](docs/EIDOLITH-COMBAT-PART7-v1.0.md) | Part 7 — Combat System: 5v5 auto battle, Utility AI + FSM, skill/energy/ultimate, damage, element multiplier 1.25/1.00/0.80, status, 8 elemental reactions, boss phases, replay, balance |
| [docs/EIDOLITH-WORLD-PART8-v1.0.md](docs/EIDOLITH-WORLD-PART8-v1.0.md) | Part 8 — World & Exploration: cấu trúc Aetheria, Verdant Plains, isometric tile 64×32, movement, NPC, spawn lifecycle, gathering, treasure, time 60 phút/chu kỳ, weather, world events, map pipeline |
| [docs/EIDOLITH-COLLECTION-PART9-v1.0.md](docs/EIDOLITH-COLLECTION-PART9-v1.0.md) | Part 9 — Collection & Progression: capture, summoning + pity, level cap 50, growth curves, Bond 10 cấp, trait, evolution đa nhánh, duplicate→shard, roster 20 |
| [docs/EIDOLITH-QUEST-PART10-v1.0.md](docs/EIDOLITH-QUEST-PART10-v1.0.md) | Part 10 — Quest, Story & Narrative: khung truyện Aetheria (Arc 0–4), quest taxonomy + data model + state machine, dialogue/choice, MVP: main story 4 khu vực, 12–18 side quest |
| [docs/EIDOLITH-ECONOMY-PART11-v1.0.md](docs/EIDOLITH-ECONOMY-PART11-v1.0.md) | Part 11 — Economy, Shop, Monetization & Live Ops: 8 loại currency, wallet/ledger, shop, battle pass, purchase flow + receipt verification; MVP: Gold, Crystal, Bond Essence, Evolution Core |
| [docs/EIDOLITH-MULTIPLAYER-PART12-v1.0.md](docs/EIDOLITH-MULTIPLAYER-PART12-v1.0.md) | Part 12 — Multiplayer, Guild, PvP, Trading & Co-op: presence, shared zones + AOI, party/co-op, guild, PvP, trading escrow, moderation; MVP: friends, party, shared starter zone, co-op boss, arena bất đồng bộ |
| [docs/EIDOLITH-UIUX-PART13-v1.0.md](docs/EIDOLITH-UIUX-PART13-v1.0.md) | Part 13 — UI/UX Specification: navigation chính (World, Eidolons, Sanctuary, Quests, Menu), screen inventory, HUD, accessibility, localization VI+EN, design tokens |
| [docs/EIDOLITH-ART-PART14-v1.0.md](docs/EIDOLITH-ART-PART14-v1.0.md) | Part 14 — Art & Animation Production Bible: isometric 2:1, tile 64×32, animation standards, VFX element language, naming convention, Tiled/Phaser pipeline |
| [docs/EIDOLITH-AUDIO-VFX-PART15-v1.0.md](docs/EIDOLITH-AUDIO-VFX-PART15-v1.0.md) | Part 15 — Audio & VFX Design: soundscape theo region, adaptive music, combat sound, ngân sách hiệu năng mobile; MVP: VFX cho 6 nguyên tố |
| [docs/EIDOLITH-ADMIN-PART16-v1.0.md](docs/EIDOLITH-ADMIN-PART16-v1.0.md) | Part 16 — Admin Panel & Live Operations: RBAC 7 role, content publishing workflow, player support, economy ops, moderation, LiveOps calendar, audit |
| [docs/EIDOLITH-QA-RELEASE-PART17-v1.0.md](docs/EIDOLITH-QA-RELEASE-PART17-v1.0.md) | Part 17 — QA, Analytics, Release & Roadmap: chiến lược test, CI/CD, release gates A–E, lộ trình Prototype → Vertical Slice → Alpha → Closed Beta → Soft Launch → Global, milestones M1–M8 |
| [docs/KE-HOACH-MVP.md](docs/KE-HOACH-MVP.md) | Kế hoạch triển khai MVP theo milestone M1–M8 + danh sách điểm chưa rõ cần chốt trong GDS |

## Phạm vi MVP (theo GDS §16 + Part 3 §40.2)

- 20 Eidolon, 60 kỹ năng, tiến hóa phân nhánh, 6 role đủ cả 6
- 1 Region (Verdant Plains) với 4 Zone: Meadow Village, Whispering Forest, Crystal Lake, Ancient Grove
- 2 Dungeon, 3 Boss, 10 NPC, 50+ Item
- Hệ thống: isometric engine, khám phá, encounter, capture, summoning, collection, formation 5, auto battle, evolution, inventory, quest, Sanctuary, server save
- Hoãn sau MVP: Guild War, Trading Market, World Boss multiplayer, Raid lớn, Seasonal Events nâng cao

## Trạng thái

- 2026-11-10: Nhận đủ 17 phần tài liệu — GDS Part 1–3, TDD Part 4, DDD Part 5, API Part 6, Combat Part 7, World Part 8, Collection Part 9, Quest/Story Part 10, Economy Part 11, Multiplayer Part 12, UI/UX Part 13, Art Part 14, Audio/VFX Part 15, Admin Part 16, QA/Release Part 17. Đã lưu tài liệu + lập kế hoạch MVP.
- 2026-11-10: **Phase 1 – Foundation XONG**: monorepo (7 packages + game-client/game-server/content-tools/admin-panel), migration PostgreSQL account/player, API auth đủ bộ (register/login/refresh rotation/logout) + player profile/progress/statistics, game-data 20 Eidolon có validator + checksum, client Phaser Boot→Preload→Login→World. Đã kiểm chứng sống end-to-end trên PG thật + trình duyệt thật (đăng ký → đăng nhập → vào Meadow Village).
