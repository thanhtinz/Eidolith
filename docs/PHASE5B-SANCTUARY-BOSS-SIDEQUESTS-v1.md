# PHASE5B — Sanctuary thật, boss Ancient Treant + Ancient Grove, nhiệm vụ phụ NPC

> Phạm vi chốt theo KE-HOACH-MVP (Phase 5b) và các phần tài liệu gốc:
> Sanctuary = Part 2 §27.2 + Part 6 §13; Boss = Part 3 §45.1 + Part 7 §16;
> Ancient Grove = Part 8 §3; Side quest = Part 10 §(MVP: 12–18 side quests —
> đợt này làm khung + 3 quest NPC làng, đúng 3 NPC đang có mặt).
> Mọi con số không có trong tài liệu đều ghi **BASELINE** — Bé đặt, chờ Tín duyệt cân bằng.

## 1. Sanctuary (server thật)

- Migration `006_sanctuary_sidequests.sql`: schema `sanctuary`
  (`assignments`, `collect_state`) + `progression.side_progress`.
- Hai công trình hoạt động (đúng khung panel hiện tại: 5 ô phân công):
  - `bond_garden` "Vườn gắn kết" — 3 ô. Mỗi Eidolon được phân công sinh
    **1 điểm Bond / 10 phút** (BASELINE), cộng thẳng vào `bond_points`
    của cá thể khi Thu hoạch.
  - `training_ground` "Sân tập" — 2 ô. Mỗi Eidolon sinh **2 XP / phút**
    (BASELINE) khi Thu hoạch, lên cấp theo cùng đường cong Phase 5.
  - `main_hall` (Nhà chính) chỉ là thẻ tổng quan; `evo_shrine` (Đài tiến hoá)
    giữ trạng thái "Chưa xây" — tiến hoá chờ Tín duyệt EVOLUTION-DRAFT-v1.
- Tích luỹ tính lười (lazy) từ `assigned_at`/`last_collect_at`, **trần 8 giờ**
  (BASELINE, chống treo máy farm vô hạn). Thu hoạch (`POST /sanctuary/collect`)
  chốt phần nguyên (điểm Bond / XP), phần lẻ tính tiếp từ mốc thu hoạch.
- API theo Part 6 §13: `GET /sanctuary`, `POST /sanctuary/assign`,
  `POST /sanctuary/unassign`, `POST /sanctuary/collect`. Nâng cấp công trình
  (Part 6 có endpoint) để giai đoạn sau — MVP mọi công trình Lv.1.

## 2. Boss Ancient Treant + map Ancient Grove

- Map mới `ancient_grove` 20×20 (tools/gen_grove.py): rừng cổ thụ, đấu trường
  đất tròn ở giữa, cổng ở bìa tây rừng Whispering Forest (portal hai chiều).
  Wild elite tại grove (ENCOUNTER_TABLES): Rootusk/Pebblit/Glowmoth Lv.8–11.
- Boss là def riêng `BOSSES` trong game-data (EID-B01, KHÔNG vào roster 20 —
  validator khoá roster = 20; không bắt được, không triệu hồi được, không vào
  dex, không vào pool địch thường):
  - Grove · Guardian · Legendary · chỉ số gốc hp 660 / atk 48 / def 22 / spd 9 (đã chỉnh bằng mô phỏng: đội mẫu Lv.5–11 thắng 14/24 trận).
  - Kỹ năng đúng tên Part 3 §45.1: **Root Slam** (đòn thường, hệ Grove),
    **Forest Barrier** (khiên 16% HP — kit Guardian), **Ancient Roar**
    (chiêu cuối AoE 2.2 — kit Guardian). Phase 2/3 của Part 3 (khiên + AoE)
    thể hiện qua chính hai kỹ năng này; enrage dùng fatigue ramp sẵn có của
    engine sau 900 tick. Telegraph/phase chuyển theo HP (§16.2/16.3) là nợ
    trình diễn — ghi rõ, không giả vờ đã có.
  - Đội boss: Treant Lv.18 + 2 Pebblit Lv.10 ("gọi sinh vật phụ", §45.1; Pebblit chọn thay Mossling vì Mossling hồi máu làm trận kéo dài tới giới hạn 120s trong mô phỏng).
- `POST /battles { mode: "boss", instanceIds }`: thắng → **1 Evolution Core
  chắc chắn + 120 Gold + 60 XP người chơi** (BASELINE); mỗi ngày chỉ tính
  thưởng đầy đủ 1 lần thắng đầu, thắng lại trong ngày giảm còn 1/4 (BASELINE,
  chống farm Core). Thua không mất gì.
- Client: trong grove có cây cổ thụ khổng lồ + nhãn "Ancient Treant" —
  bấm vào mở hộp xác nhận rồi vào trận (BattleScene cũ). Boss hiện placeholder
  chữ cái phóng to ×1.7 trong trận — **sprite Treant riêng là nợ art**, theo
  luật vẽ monster của Tín phải trình mẫu duyệt trước, không tự sinh.

## 3. Nhiệm vụ phụ NPC (khung + 3 quest)

Part 10 không liệt kê tên side quest cụ thể → Bé soạn 3 quest dùng đúng các
loại mục tiêu đã có (battle_won / captured / battle_played), nhận & trả tại NPC:

| Quest | NPC | Mục tiêu | Thưởng (BASELINE) |
|---|---|---|---|
| Loi day cua truong lao | Elder Rowan | Thắng 3 trận | 60 Gold |
| Nguoi ban rung xanh | Mira | Bắt 3 Eidolon | 40 Gold + 10 Crystal |
| Thu thach dau tien | Kael | Chơi 5 trận | 1 Evolution Core |

- Luồng: bấm vào NPC trong thế giới → hộp thoại (tên NPC + lời thoại theo
  trạng thái) → Nhận nhiệm vụ / Nhận thưởng. Tiến độ chỉ tính SAU khi nhận
  (`bumpObjectives` cộng cả `side_progress` cho quest đang active).
- Panel Nhiệm vụ có tab "Phụ" hiện trạng thái thật; nhận/trả chỉ tại NPC.
- API: `GET /progression/quests` thêm mảng `side`;
  `POST /progression/quests/side/:key/accept` và `.../claim`.

## 4. Kiểm chứng

- `tools/test-phase5b.mjs`: sanctuary assign/collect (điều khiển thời gian
  qua assigned_at), side quest accept→progress→claim + chặn claim sớm/trùng,
  boss battle API + thưởng Core + giới hạn ngày, sim thắng/thua boss bằng
  đội mẫu Lv.9–11.
- Tour Chrome thật: panel Sanctuary nối dữ liệu thật, đối thoại NPC,
  đi cổng rừng → grove → bấm Treant → vào trận boss.
