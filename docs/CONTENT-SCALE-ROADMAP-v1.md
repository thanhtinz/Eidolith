# CONTENT SCALE ROADMAP v1 — Mục tiêu 200+ NPC · 100+ Map · 300+ Monster

> Tín chốt hướng 2026-11-12: game phải đạt **200+ NPC, hơn 100 map, hơn 300+ monster**, phát triển **từ từ theo đợt** (mỗi đợt = một region hoàn chỉnh). Tài liệu này là sổ theo dõi chính thức: mọi đợt nội dung cập nhật số đếm tại §5.

## 1. Điểm xuất phát (2026-11-12)

| Hạng mục | Hiện có | Mục tiêu |
|---|---|---|
| Map | 3 (Meadow Village, Whispering Forest, Ancient Grove) + Sanctuary home | 100+ |
| Monster | 20 loài gốc + 41 dạng tiến hoá (dữ liệu) = 61 dạng; 7 loài có sprite | 300+ dạng |
| NPC | 3 chính (Rowan, Mira, Kael) + 7 mẫu thiết kế chờ duyệt (Elara + 6 phụ) | 200+ |

## 2. Map — 5 region × ~21 map = 105

Khung mỗi region (theo Part 8): 1 thị trấn trung tâm · 4–5 vùng dã ngoại · 2 làng/trạm nhỏ · 1 dungeon (2–3 tầng = map riêng) · 1 đấu trường boss · 4–6 nội thất (shop, nhà trọ, lều nghiên cứu, hội quán, nhà dân) · 2–3 điểm đặc biệt (đền, hang ẩn, hồ).

**Region 1 — Verdant Plains (Grove/Gale)** — đợt hoàn thiện đầu tiên:
Meadow Village ✓ · Whispering Forest ✓ · Ancient Grove ✓ · Crystal Lake · Windmill Fields · Riverbend Village · Forest Deep · Grove Ruins · Lake Cave · Mist Marsh · Hilltop Shrine · Farm Acres · Forest Camp · Root Hollow (dungeon, 2 tầng) · Treant Arena (boss) · nội thất: Tiệm Bram · Lò rèn Hilda · Lều nghiên cứu của Mira · Hội quán bang hội · Nhà trọ · Sanctuary Home ✓.

**Region 2 — Emberfall (Flame/Stone)**: thị trấn tro Obsidian Town, miệng núi lửa, mỏ đá, suối dung nham, dungeon Hỏa Ngục, boss Molten Wyrm…
**Region 3 — Frostveil (Frost/Tide)**: làng băng, hồ đóng băng, hang băng, dungeon Băng Cung, boss Frostbound Colossus…
**Region 4 — Hollowreach (tha hoá)**: vùng đất vỡ, tàn tích Origin, dungeon Hư Vô…
**Region 5 — Celestia (quần đảo trời)**: đảo nổi, tháp mây, đấu trường trời…

## 3. Monster — 110 loài gốc × ~3 dạng = ~330 dạng

- Mỗi region ~22 loài gốc: 6 Common · 6 Uncommon · 5 Rare · 3 Epic · 2 Legendary (gồm dòng boss region). Mỗi region chuộng 2 hệ chính (theo Part 8) + khách mời các hệ còn lại để đủ 10 hệ.
- Mọi loài gốc có **2 nhánh tiến hoá** (sâu vai trò + đổi vai trò, công thức đã chạy từ đợt tiến hoá 2026-11-12) → trung bình 3 dạng/loài → 110 × 3 = **330 dạng**.
- Thứ tự sản xuất mỗi họ: dữ liệu (chỉ số theo role × rarity, kỹ năng theo kit hệ) → sprite theo LUẬT VẼ MONSTER (từng con đúng nhân dạng, trình mẫu trước) → bản đồ xuất hiện + bảng encounter → kiểm chứng. Cả họ ra mắt cùng nhau; dạng cuối có splash ult ở đợt sau.
- Region 1 cần +8 loài gốc nữa (20 → 28 của riêng Verdant, phần dư chia cho các region sau theo hệ).

## 4. NPC — 200+ theo 4 lớp

| Lớp | Số lượng | Cách sản xuất |
|---|---|---|
| Dàn chính (cốt truyện) | ~12 | Sprite thiết kế riêng từng người (Rowan, Mira, Kael, Elara…) |
| Chuyên trách theo region | ~40 | Sprite riêng: thương nhân, thợ rèn, nghiên cứu, thám hiểm, ngư dân, đại diện bang hội… mỗi region một bộ mặt mới |
| Dân cư làng/thị trấn | ~120 | **Nhà máy ngoại hình**: chính hệ tạo nhân vật (2 giới × 5 kiểu tóc × 5 màu × 6+ trang phục = 300+ tổ hợp không trùng) — mỗi người có tên riêng, vai trò, 2–3 câu thoại, một số gắn nhiệm vụ phụ |
| Người qua đường & đặc biệt | ~30 | Đội thám hiểm, ban tổ chức arena, khách mùa lễ, thuỷ thủ, người giữ đền… |

Danh sách tên + vị trí + thoại lưu tại `content/npc-roster` khi bắt đầu đợt 1; tên không trùng, NPC nào cũng phải có ít nhất một câu thoại riêng (luật Part 3 §46.2: ID, tên, vai trò, thoại, liên kết nhiệm vụ, vị trí, sprite).

## 5. Sổ đếm (cập nhật mỗi đợt)

| Đợt | Map | Loài gốc | Tổng dạng | NPC |
|---|---|---|---|---|
| Hiện tại (2026-11-13) | 13 | 20 | 61 | 3 (+7 chờ duyệt) |
| Đợt 1 — Verdant hoàn chỉnh | 21 | 28 | ~84 | ~45 |
| Đợt 2 — Emberfall | 42 | 50 | ~150 | ~85 |
| Đợt 3 — Frostveil | 63 | 72 | ~216 | ~125 |
| Đợt 4 — Hollowreach | 84 | 94 | ~282 | ~165 |
| Đợt 5 — Celestia | 105 | 110+ | 330+ | 200+ |

## 6. Nguyên tắc

1. **Từ từ nhưng không dừng**: mỗi đợt đóng gói trọn một region (map + monster + NPC + nhiệm vụ) rồi mới sang region kế.
2. Số lượng không đánh đổi chất lượng: monster trình mẫu từng họ, NPC quan trọng trình mẫu từng người — đúng luật art đã chốt.
3. Mọi nội dung mới đều qua validator + test API + tour kiểm chứng như các phase trước.
