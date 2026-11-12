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
- 2026-11-11: **Phase 5 Progression (lõi) xong** — trận đấu nay có thưởng thật: XP Eidolon + lên cấp, Bond, XP người chơi, Gold, rơi Evolution Core; nhiệm vụ Arc 0 + 5 mục tiêu hằng ngày theo dõi tiến độ thật và nhận thưởng được; thẻ chi tiết Eidolon (chỉ số/kỹ năng/Bond/tiến hoá). Còn Phase 5b: Sanctuary, boss/dungeon, tiến hoá. Số liệu: docs/PHASE5-PROGRESSION-v1.md.
- 2026-11-11: **Phase 4 Combat xong** — combat-core đầy đủ theo Part 7 (AI utility, 60 skill, 10 status, 8 reaction, replay tất định), server chạy trận + lưu replay (test 10/10), BattleScene phát lại từ Menu → Đấu trường; simulation 1.000 trận đạt đối xứng thắng 490/510, Epic thắng Common 82/100. Số liệu: docs/PHASE4-COMBAT-v1.md §8.
- 2026-11-11: **Áp hướng A “Nhật ký thám hiểm” cho toàn bộ giao diện** (sau khi HUD v2 bị chê xấu vì chất liệu kính lạnh): da nâu + giấy vàng + vàng cổ, font game Baloo 2 + Be Vietnam Pro tự host, menu THU GỌN mặc định một nút huy chương, minimap tròn viền vàng; panel + thẻ bắt + đăng nhập đồng bộ cùng chất liệu.
- 2026-11-11: **HUD v2 — làm lại toàn bộ lớp giao diện trên thế giới** (docs/HUD-REDESIGN-v2.md, mẫu Temtem/Ragnarok M): cụm người chơi avatar tròn, thẻ nhiệm vụ, minimap thật có chấm vị trí trực tiếp (ảnh sinh bằng tools/gen_minimaps.py, không vào git như mọi PNG), dải đội hình 5 ô tròn dữ liệu thật, nút điều hướng tròn nổi, joystick viền vàng.
- 2026-11-11: **Chuyển sang màn hình ngang 1280×720 + thiết kế lại giao diện** (lệnh của Tín, ghi đè khóa dọc của Part 4): nav thành rail dọc mép phải, panel thành hộp thoại giữa màn hình, thẻ bắt Eidolon giữa màn hình; thế giới iso rộng thoáng hơn hẳn. Kiểm chứng Chrome thật đủ màn hình.
- 2026-11-11: **Phase 3 — Collection xong**: Eidolon hoang dã xuất hiện trong Whispering Forest (bảng encounter theo habitat, sprite thật gồm 3 loài mới Pebblit/Glowmoth/Rootusk), bắt bằng Capture Orb do server quyết định (kiểm khoảng cách, trừ vật phẩm đúng số, tỉ lệ công khai), bộ sưu tập + túi đồ nối dữ liệu thật, triệu hồi Standard Resonance có pity và chống trừ tiền hai lần bằng Idempotency-Key. Kiểm chứng: test E2E server 18/18 PASS (tools/test-phase3.mjs) + Chrome thật. Số liệu cân bằng ở docs/PHASE3-COLLECTION-v1.md.
- 2026-11-11: **HUD phía trên hoàn chỉnh + ví tiền tệ thật** (docs/HUD-TOP-DESIGN-v1.md): thanh HUD một hàng gồm avatar + huy hiệu cấp + chấm kết nối + thanh EXP, chip Gold/Crystal đọc từ ví thật, nút Thư/Cài đặt mở thẳng panel tương ứng; hàng ngữ cảnh gồm tracker nhiệm vụ + chip map/giờ/thời tiết. Server có migration 002 (ví theo Part 5 §7), API GET /player/wallet và quà khởi đầu 500 Gold + 30 Crystal cho tài khoản mới.
- 2026-11-11: **Asset nghiêng pixel hơn + gộp HUD trên cùng vào hub**: pipeline trích xuất dùng pixel hoá khối đều 2px (nửa độ phân giải rồi phóng NEAREST, bảng màu 64) cho nhân vật/NPC/vật thể/sinh vật và từng ô tile; toàn bộ HUD phía trên nay là một lớp duy nhất của hub — chip người chơi bên trái, chip ngữ cảnh (tên map · giờ thế giới · thời tiết · số người chơi) bên phải, HudScene chỉ còn joystick.
- 2026-11-11: **Hub UI theo Part 13** (thiết kế ở docs/HUB-DESIGN-v1.md): thanh người chơi trên cùng, nav dưới đáy 5 mục Thế giới · Eidolons · Sanctuary · Nhiệm vụ · Menu, panel dạng bottom-sheet — Eidolons có sổ loài đủ 20 loài từ game-data, Nhiệm vụ có tab Chính tuyến/Hằng ngày/Phụ, Menu đủ 8 mục (Cài đặt + Đăng xuất dùng thật). Hub là lớp DOM phủ khớp khung canvas (không dùng Phaser DOM vì lệch tỉ lệ ở màn hình mật độ cao).
- 2026-11-11: **NPC có sheet riêng cùng style đã duyệt** (Rowan râu trắng áo tím cầm trượng pha lê, Mira áo xanh cầm đèn, Kael trinh sát olive đeo cung) — cắt trực tiếp từ sheet như Wanderer; sprite trích ở tỉ lệ hiển thị 2× + làm sắc cạnh cho nét.
- 2026-11-10: **Đợt sửa lỗi hiển thị theo phản hồi của Tín**: nhãn tên có nền pill + lớp riêng không bị cây che, HUD có nền tối mờ, dọn cây quanh spawn rừng, phủ sáng/tối theo giờ thế giới, lấp vùng trống quanh map bằng rừng trang trí.
- 2026-11-10: **Art v4 trong game được tách trực tiếp từ các sheet đã duyệt** (house/cây/nhân vật/mặt đất) sau phản hồi của Tín rằng bản tự vẽ không giống mockup — xem `docs/ART-DIRECTION-v1.md` mục đính chính.
- 2026-11-10: **Đồ hoạ Premium Pixel đã duyệt và áp vào game**: tileset/props vẽ lại pixel-native (đổ bóng nhiều tông, đường lát đá, nước lấp lánh), sprite Wanderer nam + nữ (chọn khi đăng ký) và NPC theo concept đã duyệt — xem `docs/ART-DIRECTION-v1.md`.
- 2026-11-10: **Phase 2 – Isometric World XONG**: 2 bản đồ Tiled (meadow_village 24×24, whispering_forest 28×28) + validator đường đi spawn→portal; render isometric 64×32 có depth-sort, NPC; tap-to-move + joystick ảo với A*; camera follow; portal qua lại 2 map; WebSocket zone/snapshot/người chơi khác/giờ thế giới (60 phút = 1 ngày game) + thời tiết đồng bộ; vị trí được lưu và khôi phục khi đăng nhập lại. Kiểm chứng sống: test WS 2 client (gồm chống teleport) + Chrome thật đi bộ qua portal.
- 2026-11-10: **Phase 1 – Foundation XONG**: monorepo (7 packages + game-client/game-server/content-tools/admin-panel), migration PostgreSQL account/player, API auth đủ bộ (register/login/refresh rotation/logout) + player profile/progress/statistics, game-data 20 Eidolon có validator + checksum, client Phaser Boot→Preload→Login→World. Đã kiểm chứng sống end-to-end trên PG thật + trình duyệt thật (đăng ký → đăng nhập → vào Meadow Village).
