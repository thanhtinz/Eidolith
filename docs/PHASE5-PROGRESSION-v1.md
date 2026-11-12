# Phase 5 — Progression (bản ghi triển khai)

Trạng thái: phần lõi HOÀN THÀNH (thưởng trận + cấp độ + bond + nhiệm vụ + chi tiết Eidolon). Sanctuary và boss/dungeon để Phase 5b.

## 1. Thưởng trận đấu (server áp dụng, `apps/game-server/src/progression.ts`)
- Eidolon ra trận: XP = thắng `40 + 4×Lv địch TB` · hoà `26 + 2×` · thua `16 + 1×`. Đường cong cấp: `xpForNext = 60 + 40×cấp`, trần Lv.50.
- Bond: +1 điểm/trận; 5 điểm = +1 Bond (trần 10) — cột `bond_points` (migration 005).
- Người chơi: XP thắng 30 / hoà 18 / thua 12; cong `100×cấp`.
- Gold: thắng 34 / hoà 20 / thua 12, ghi sổ `battle_reward`.
- Evolution Core: thắng rơi 25% +1.
- Panel kết quả hiện toàn bộ: Gold, XP đội, XP người chơi, con nào lên cấp, lõi rơi.
- ⚠️ Bài học kỹ thuật: cột `experience`/`balance` kiểu BIGINT được pg trả về dạng CHUỖI — cộng XP bằng `+=` thành nối chuỗi và cấp nổ tung (bắt được khi soi ảnh tour: 2 trận mà Lv.5→11). Đã ép `Number()` ở mọi điểm đọc trong progression + mapping `/creatures`, và test Phase 5 có ca kiểm chứng cộng dồn XP qua 2 trận khớp đường cong tuyệt đối.

## 2. Nhiệm vụ thật (Part 10) — migration 005, `GET /progression/quests`, `POST /progression/quests/:scope/:key/claim`
- Chính tuyến (Arc 0): Bắt Eidolon đầu tiên (+50 Gold) · Thắng trận đầu tiên (+30 Gold) · Triệu hồi lần đầu (+15 Crystal) · Thắng 10 trận (+100 Gold, +10 Crystal).
- Hằng ngày (reset theo ngày server): Thắng 1 trận (+20 Gold) · Thắng 3 trận (+35 Gold) · Đấu 5 trận (+1 Evolution Core) · Bắt 2 Eidolon (+25 Gold) · Triệu hồi 1 lần (+10 Crystal).
- Tiến độ tự ghi từ sự kiện thật: đấu trận (battles), bắt (capture), triệu hồi (summon — bản replay idempotent không tính trùng).
- Panel Nhiệm vụ hiển thị thưởng + thanh tiến độ + nút Nhận (chặn nhận trùng/thiếu điều kiện ở server); thẻ theo dõi trên HUD hiện mục tiêu chưa xong gần nhất.
- Mọi con số ở mục 1–2 là baseline MVP của Bé (tài liệu không cho số) — gom trong `progression.ts`/`progression-config` phía server để chỉnh một chỗ.

## 3. Chi tiết Eidolon (nợ Phase 3 — đã trả một phần)
Bấm ô đội hình hoặc thẻ loài đã có → thẻ chi tiết: sprite, hệ/độ hiếm/vai trò, Bond 10 tim, thanh XP, 4 chỉ số theo cấp (HP/ATK/DEF/SPD từ game-data), đặc tính, 3 kỹ năng (đánh dấu chiêu cuối), nhánh tiến hoá + yêu cầu (Lv.16 + 1 Evolution Core).
- Chưa làm: 8-tab đầy đủ theo Part 13 và lọc/sắp xếp bộ sưu tập.

## 4. Tiến hoá — CHƯA mở, và lý do
Tài liệu Part 3 chỉ cho TÊN 41 dạng tiến hoá (Ignidrake, Thornwarden…) — không có hệ/chỉ số/kỹ năng/hình của các dạng đó. Bé không tự bịa dữ liệu 41 dạng; khi Tín chốt cách xử lý (Bé phác thảo dữ liệu dạng tiến hoá để duyệt, hoặc Tín bổ sung), nút Tiến hoá sẽ nối ngay — tiền tệ (Evolution Core) và điều kiện đã chạy sẵn.

## 5. Kiểm chứng
- `tools/test-phase5.mjs`: 19 ca khi thắng (15 ca + nhánh thắng tuỳ kết quả trận) — thưởng vào ví đúng, XP cộng dồn đúng đường cong qua 2 trận, tiến độ nhiệm vụ đúng, nhận thưởng đúng + chặn nhận trùng/nhận sớm, triệu hồi tính vào Arc.
- Chrome thật: panel kết quả có dòng thưởng, panel Nhiệm vụ thật (1/1 + nút Nhận), thẻ chi tiết Rootusk đầy đủ.

## 6. Còn lại của Phase 5 (5b)
Sanctuary (toà nhà + phân công + Bond theo thời gian), boss Ancient Treant + dungeon (Part 7 §16), nhiệm vụ phụ từ NPC, lọc/sắp xếp bộ sưu tập.
