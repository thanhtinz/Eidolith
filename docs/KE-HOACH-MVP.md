# EIDOLITH — KẾ HOẠCH TRIỂN KHAI MVP

Viết ngày 2026-11-10, dựa trên 9 phần tài liệu Tín gửi: GDS Part 1 (v1.0), Part 2 (v1.1), Part 3 (v1.2), TDD Part 4, DDD Part 5, API Part 6, Combat Part 7, World Part 8, Collection Part 9.

Mục này là tài liệu làm việc của Bé — phần 4 là các điểm GDS còn mâu thuẫn/thiếu số liệu cần Tín chốt trước hoặc trong lúc code; các phần còn lại Bé tự xử lý theo tài liệu.

---

## 1. Stack đã khóa (theo TDD §24 + DDD §24 + API §30 + Combat §26 + World §26)

- Client: Phaser 3 + TypeScript, portrait 720×1280 (Scale FIT), pixelArt + roundPixels, WebGL.
- Đóng gói mobile: Phaser là web — để lên Android/iOS cần một lớp vỏ. Đề xuất **Capacitor** (bọc bản web build thành app native, dùng lại được Android SDK đã có trong máy). Chưa thấy tài liệu nhắc tới lớp vỏ này — xem điểm mở số 7.
- Server: Node.js + TypeScript, Modular Monolith (không microservices ở MVP), REST `/api/v1` + WebSocket `/ws/v1`.
- DB: PostgreSQL (schema logic theo module, UUID PK, tiền tệ BIGINT, JSONB cho config), Redis chỉ cache/realtime (session, zone state, matchmaking, leaderboard cache).
- Combat: combat-core thuần TypeScript độc lập Phaser, fixed timestep 10 tick/s, seeded RNG, deterministic + replay (seed + snapshot + events).
- Map: Tiled → JSON, tile isometric **64×32** (Part 8 §4.3 — bản chốt cuối, xem điểm mở số 1).
- Game data: data-driven + version + checksum + validator (creatures, skills, evolutions, maps, spawn tables...).
- Môi trường máy Bé đã sẵn: Node 24, PostgreSQL portable, Android SDK/Gradle — chạy được toàn bộ stack trên (client build web + server + PG local), kiểm chứng sống được trong sandbox trừ WebSocket ra ngoài (giới hạn đã biết từ các dự án trước: chỉ test local được).

## 2. Lộ trình triển khai (gộp M1–M8 của GDS §17 với 7 phase của TDD §21)

**Phase 1 – Foundation**
Monorepo đúng cấu trúc TDD §3.1 (apps/game-client, game-server, admin-panel, content-tools; packages/shared-types, game-data, combat-core, navigation-core, protocol, validation, math-utils). Server modular monolith + PG migration 001–005 (auth/players/creatures/world/combat) + Redis. Auth đủ bộ theo API §3 (register/login/refresh rotation/logout, session hash). Client: Boot/Preload/Login/Character scenes, Network Manager theo API §26.
*Mốc nghiệm thu:* DB-001, API-001/002, TDD-001 — đăng ký, đăng nhập, vào được game.

**Phase 2 – Isometric World**
Tiled pipeline + map validator (World §20.3), render isometric 64×32 + depth sorting, tap-to-move + joystick, A* trên navigation grid, collision, camera follow/bounds, chuyển map. Hai map đầu: meadow_village (P0) + whispering_forest (P0). World networking: zone instance, AOI, snapshot, reconnect/resume (API §22). Thời gian server 60 phút/chu kỳ + weather đồng bộ.
*Mốc nghiệm thu:* WORLD-001→007, 012, 013, 015, 016; TDD-002/003/004/005.

**Phase 3 – Collection**
Game-data: 20 creature templates + 60 skills (3/con) + trait + evolution branches theo Part 3. Spawn server-managed (lifecycle Part 8 §9.5), encounter + capture theo API §6 (server tính, idempotency), summoning banner + pity + duplicate→shard (Part 9 §8), Collection UI (filter/sort/detail 8 tab), Inventory.
*Mốc nghiệm thu:* EID-001→005, 013, 014, 015; API-004/005/006/007.

**Phase 4 – Combat**
combat-core: BattleState, fixed timestep, seeded RNG, damage formula (Part 7 §12), Utility AI + FSM (target scoring 5 thành phần), movement/steering, skill resolver, energy/ultimate, status + stacking, element multiplier + reaction (làm trước các reaction thuộc 6 hệ MVP), BattleScene trình diễn từ combat events, replay.
*Mốc nghiệm thu:* COM-001→016; TDD-006/007. Chạy simulation batch 1.000+ trận kiểm tra determinism + balance thô.

**Phase 5 – Progression**
Level/EXP (cap 50, EXP table data-driven), growth curves, Bond 10 cấp, skill unlock/upgrade, evolution đa nhánh (transaction Part 5 DDD §17.2), equipment cơ bản, quest (main chain Verdant Plains theo Part 2 §22.2 + daily), Sanctuary (bản MVP: Habitat + Evolution Shrine + Training Ground trước, các building còn lại theo sau), 2 dungeon (starter_dungeon + 1), 3 boss — xem điểm mở số 3.
*Mốc nghiệm thu:* EID-006→012; acceptance Part 2 §38 cho Quest/Skill/Trait/Equipment/Sanctuary/Dungeon/Boss.

**Phase 6 – Multiplayer**
Friends, chat (WS, moderation cơ bản), party 2–4, PvP arena casual + ranked (rating server, mùa 6–8 tuần), guild bản cơ bản (tạo, chat, mission — Guild War hoãn theo GDS §16.3), trading escrow (hoãn nếu phải cắt scope — GDS §16.3 đã xếp Trading Market vào Deferred).
*Mốc nghiệm thu:* API-012; Part 2 §38 cho Social/Arena/Guild.

**Phase 7 – Production prep**
Admin panel (modules Part 2 §35, phân quyền + audit log), events/live ops, monitoring + analytics events (TDD §18.3), anti-cheat cơ bản (TDD §15.2), load test, backup + restore test, CI/CD pipeline (TDD §19.3), đóng gói Capacitor Android để test máy thật.
*Mốc nghiệm thu:* TDD-008→014, DB-013/014/015, API-014/015/016.

## 3. Nội dung MVP đã có dữ liệu sẵn (không phải sáng tác thêm)

- 20 Eidolon có tên/hệ/rarity/role/habitat/3 skill/trait/nhánh tiến hóa (Part 3 §43) — tổng 41 nhánh tiến hóa đích (Emberling 3 nhánh, 19 con còn lại mỗi con 2 nhánh).
- 10 element + hiệu ứng + 8 elemental reaction (Part 3 §41, Part 7 §15).
- 4 NPC chính có tên (Elder Rowan, Mira, Kael, Elara) + 6 NPC vai phụ = đủ 10 NPC của MVP.
- Map list MVP: meadow_village, whispering_forest, crystal_lake, ancient_grove, starter_dungeon, boss_arena_01, sanctuary_home (Part 8 §23.1).
- API contract + error registry + WS events đã đủ để code thẳng (Part 6).
- Schema DB đã đủ cột cho mọi bảng MVP (Part 5).

## 4. Điểm mở cần Tín chốt (Bé đã ghi rõ phương án đề xuất cho từng điểm)

1. **Kích thước tile:** Part 1 §3.4 đề xuất tile isometric 32×16, Part 1 §13.2 ghi tile 16×16 hoặc 32×32, Part 8 §4.3 chốt **64×32**. Bé theo Part 8 (tài liệu sau nhất, chuyên sâu nhất về world): **64×32**. Nếu Tín muốn khác thì báo lại trước Phase 2.
2. **6 hệ MVP vs roster 20 con dùng cả 10 hệ:** Combat Part 7 §24 chốt 6 hệ MVP là Flame, Tide, Grove, Stone, Gale, Frost và 8 reaction — nhưng trong 8 reaction có Conductive Field (cần Volt), Toxic Bloom (cần Venom), Eclipse (cần Shade + Astral) vốn không thuộc 6 hệ MVP, và roster 20 con có 8 con thuộc 4 hệ còn lại (Glowmoth, Starwhisp — Astral; Thornbug, Venomleaf — Venom; Shadekit, Duskowl — Shade; Voltik, Tempestray — Volt). Part 9 §18 cũng ghi "một số Eidolon hệ cao cấp có thể được giữ khóa cho các bản cập nhật sau". Đề xuất của Bé: **MVP mở đủ 20 con nhưng combat chỉ cân bằng sâu 6 hệ chính; 4 hệ phụ có skill/status cơ bản, reaction Conductive/Toxic/Eclipse bật sẵn vì dữ liệu đã có, cân bằng sâu để sau.** Nếu Tín muốn cắt hẳn 8 con đó khỏi MVP thì roster MVP còn 12 con — cần Tín xác nhận vì Part 3 §40.2 ghi rõ MVP 20 con.
3. **3 Boss MVP nhưng 2 boss nằm ngoài Region MVP:** Part 3 §45 có Ancient Treant (Verdant Plains), Molten Wyrm (Emberfall), Frostbound Colossus (Frostveil) — MVP chỉ có 1 Region Verdant Plains. Đề xuất: MVP làm đủ cơ chế boss + Ancient Treant (Area Boss ở Ancient Grove) + Mini Boss ở Whispering Forest + boss của starter_dungeon; Molten Wyrm và Frostbound Colossus làm data sẵn, mở cùng Region của chúng sau MVP.
4. **Số lượng item:** Part 3 §40.2 ghi MVP 50+ item nhưng §47.2 mới liệt kê 10 item; Part 9 bổ sung capture orbs (5 loại), EXP Crystal, Element Fragment, Trait Catalyst... vẫn chưa đủ 50. Bé sẽ tự dựng đủ danh mục 50 item theo đúng các category đã định (Material/Evolution/Resonance/Equipment/Consumable/Quest/Cosmetic) và trình Tín duyệt danh sách trước khi đưa vào seed.
5. **Chưa có bảng số liệu cân bằng:** chưa có base stats cụ thể cho 20 con (chỉ có ví dụ Emberling hp 100/atk 25/def 10/spd 15 trong TDD §9.2/DDD §3.1 — mà ví dụ đó còn thiếu MATK/MDEF/CRIT/ACC/RES so với bảng stat Part 1 §8.6), chưa có bảng tương khắc nguyên tố (chỉ có hệ số 1.25/1.00/0.80 ở Part 7 §13.1), chưa có số cho capture formula (P0, bonus, resistance ở Part 1 §6.3), tỉ lệ summon + mốc pity (Part 6 §7.2 mới cho ví dụ guaranteeAt 80), trọng số AI w1–w5, EXP table, giá/nguồn tiền. Đây là phần "balance pass" — Bé đề xuất tự sinh bộ số khởi điểm theo role/rarity (Guardian thiên HP/DEF, Striker thiên ATK...) rồi tinh chỉnh bằng simulation batch ở Phase 4/8 như Part 7 §20 yêu cầu, trình Tín bảng số trước khi khóa.
6. **Rarity 5 hay 6 bậc:** Part 1 §5.4 liệt kê 6 bậc có Mythic; Part 9 §4.1 và §25 chỉ có 5 bậc (tới Legendary). Roster 20 con cao nhất là Epic. Bé theo Part 9: **5 bậc cho MVP**, Mythic để dành cho bản mở rộng. Nếu Tín muốn giữ Mythic từ đầu thì thêm vào game-data là xong, không ảnh hưởng code.
7. **Lớp vỏ mobile:** tài liệu không nói Phaser client sẽ lên Android/iOS bằng cách nào. Bé đề xuất **Capacitor** (chuẩn cho Phaser lên store, build APK được ngay trong máy này để Tín test). Cần Tín gật ý này khi bắt đầu Phase 1.
8. **Tên gọi vật phẩm capture chưa thống nhất:** Part 3 §47 gọi là Resonance Shard / Greater Resonance; Part 9 §7.2 gọi là Capture Orb (Basic/Advanced/Rare/Element/Event); API Part 6 §6.2 dùng `basic_capture_orb`, §5.6/§7 dùng các id khác (`exp_crystal`, banner cost bằng crystal). Bé sẽ thống nhất theo Part 9 (Capture Orb) + id dạng snake_case của Part 6 khi làm game-data, và sửa lại Part 3 trong bản GDS hợp nhất sau.
9. **Evolution 3 stage vs 1 bước/nhánh:** Part 1 §7.1 định nghĩa 3 stage Origin → Awakened → Ascended, nhưng roster Part 3 mỗi nhánh chỉ có 1 đích tiến hóa (ví dụ Emberling → Ignidrake) và DDD có cột evolution_stage. Hiểu đúng có lẽ là: đích của nhánh = Awakened, Ascended là bước 2 của cùng nhánh chưa được thiết kế tên/hình. MVP Bé làm 1 bước tiến hóa/nhánh (đúng dữ liệu hiện có); Ascended để giai đoạn sau khi có thiết kế.
10. **Dungeon MVP đếm chưa khớp:** GDS §16.1 ghi 2 Dungeon, Part 8 §23 ghi 1 Dungeon + 1 Boss Arena. Bé tính boss_arena_01 là dungeon thứ hai về mặt kỹ thuật (instance riêng, có boss) — nếu Tín muốn 2 dungeon thật + arena riêng thì thêm 1 dungeon nữa vào Phase 5.

## 5. Nguyên tắc làm việc rút ra từ tài liệu (Bé tự ràng buộc khi code)

- Mọi thứ data-driven: thêm Eidolon/skill/map mới = thêm dữ liệu, không sửa code (TDD §9.1, Part 3 §52).
- combat-core và navigation-core không phụ thuộc Phaser/DOM (TDD §3.2) — test được bằng unit test thuần.
- Mọi thao tác tài sản đi qua transaction + idempotency + audit log (DDD §17, API §11.3 của TDD).
- Không tự chế số liệu cân bằng rồi khóa cứng — số khởi điểm phải qua simulation và có bản trình duyệt (điểm mở số 5).
- Asset creature: mỗi hình thái tiến hóa là sprite mới hẳn, cấm phóng to/đổi màu bản cũ (Part 3 §44.3); tên file theo quy ước `creature_{id}_{animation}_{direction}_{frame}.png` (Part 3 §49.5).
- UI không dùng emoji, dùng icon asset/CSS theo luật chung của Tín.

---

## 6. Bổ sung từ Part 10–17 (nhận thêm 2026-11-10)

Tám phần sau làm rõ thêm nhiều phạm vi MVP và giải quyết/chỉnh một số điểm mở ở mục 4:

**Đã được chốt hẳn:**
- *Điểm mở 1 (tile):* Part 14 §2 xác nhận lại tile tham chiếu **64×32**, isometric 2:1 — điểm này đóng.
- *Economy MVP (Part 11 §12):* chỉ 4 currency đưa vào MVP — Gold, Crystal, Bond Essence, Evolution Core; Arena Token, Guild Coin, Research Data, Event Token để sau. Crystal tách paid/earned. MVP không có quảng cáo ép buộc. Battle Pass/Monthly Card có trong thiết kế monetization nhưng phạm vi MVP của Part 11 chỉ gồm wallet/ledger, cosmetic shop prototype, exchange shop, 1 banner có pity, purchase sandbox — Pass/Card xếp sau prototype.
- *Multiplayer MVP (Part 12 §11):* nhẹ hơn Part 2 từng mô tả — friends, party, shared starter zone, chat cơ bản có moderation, co-op boss prototype, friendly battle, arena bất đồng bộ (asynchronous). Real-time PvP, Guild War/territory, auction house hoãn. Điều này khớp với Phase 6 của kế hoạch nhưng giảm tải: guild đầy đủ (treasury, weekly objective...) làm sau arena bất đồng bộ.
- *Quest MVP (Part 10 §13):* main story qua 4 khu vực starter theo 5 arc (Arc 0 Awakening → Arc 4 Beyond the Plains), 12–18 side quests, 5 daily objectives, 3 Bond quest prototype, journal + tracker (tối đa 3 objective được ghim).
- *Audio/VFX MVP (Part 15 §10):* 4 bộ ambience region, 3 music theme, VFX cho **6 nguyên tố MVP** — củng cố hướng cân bằng sâu 6 hệ ở điểm mở 2.
- *Art MVP (Part 14 §12):* 20 Eidolon dạng gốc + 4 starter area + dungeon + boss arena + UI core; **dạng tiến hóa phát hành theo đợt**, không cần sản xuất đủ 41 nhánh trước prototype — giảm mạnh rủi ro nghẽn asset ở Phase 5.
- *Admin MVP (Part 16 §11):* dashboard cơ bản, player lookup, content config, event/banner management, grant workflow có audit, moderation queue, maintenance toggle — khớp Phase 7.
- *Lộ trình phát hành (Part 17 §9, §14):* Prototype → Vertical Slice → Alpha → Closed Beta → Soft Launch → Global, qua 5 release gate A–E (Core Loop, Integrity, Performance, Operations, Compliance). Milestone M1–M8 của Part 17 khớp thứ tự 7 phase trong kế hoạch này (M7 Economy & LiveOps tách riêng sau M6 Online).

**Mâu thuẫn mới phát sinh (cần lưu ý khi code, chưa cần Tín chốt ngay):**
- *Navigation chính:* Part 13 §2 chốt bottom navigation là **World · Eidolons · Sanctuary · Quests · Menu**; Part 1 §11.1 từng ghi Home · Eidolon · Explore · Arena · Social. Part 13 là tài liệu UI chuyên sâu và mới hơn — Bé theo Part 13.
- *Cỡ party:* Part 12 §2 ghi party tối đa "4–5 người tùy mode"; Part 2 §29.2 ghi party 2–4. Bé tạm theo 2–4 cho dungeon/co-op thường và tối đa 5 chỉ khi mode yêu cầu đủ đội 5 Eidolon/người — sẽ chốt lại khi làm Phase 6.
- *Tên file asset:* Part 14 §9 dùng mẫu `eidolon_emberling_idle_01.png`; Part 3 §49.5 dùng `creature_{id}_{animation}_{direction}_{frame}`. Bé sẽ thống nhất một quy ước trong content-tools ở Phase 1 (đề xuất giữ mẫu Part 3 vì có direction + id số, dễ validate).
- *Tên NPC chính thức:* Part 10 §8 nói tên NPC chính "cần được chốt trong Character Bible" và chỉ liệt kê vai trò; Part 3 đã có sẵn tên (Elder Rowan, Mira, Kael, Elara). Bé giữ tên Part 3 làm tên làm việc cho tới khi có Character Bible riêng.
- *Localization:* Part 13 §9 yêu cầu kiến trúc hỗ trợ **tiếng Việt + tiếng Anh** ngay từ đầu (mọi UI string qua localization key, font hỗ trợ dấu tiếng Việt) — đưa vào Phase 1 khi dựng UI framework, không để retrofit.
