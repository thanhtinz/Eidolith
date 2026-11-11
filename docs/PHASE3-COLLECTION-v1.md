# Phase 3 — Collection: số liệu MVP v1 (2026-11-11)

Part 9/Part 6 khóa khung (luồng bắt, API, pity theo banner, công khai tỉ lệ) nhưng không cho số cụ thể — các số dưới đây là cấu hình MVP do Bé đặt, để trong code tại một chỗ (`apps/game-server/src/collection-config.ts`) để cân bằng sau.

## Eidolon hoang dã — Whispering Forest
Theo đúng habitat của Part 3, 4 cá thể sống cùng lúc, hồi sinh sau 20 giây:
| Loài | Trọng số | Cấp |
|---|---|---|
| Mossling (EID-002) | 40 | 2–4 |
| Zephy (EID-005) | 20 | 2–4 |
| Glowmoth (EID-006) | 15 | 3–5 |
| Pebblit (EID-004) | 15 | 2–3 |
| Rootusk (EID-011) | 10 | 3–5 |

## Bắt (Capture) — server quyết định hoàn toàn (Part 9 §7.5)
- Tỉ lệ gốc theo độ hiếm (HP đầy, Basic Orb): Common 70% · Uncommon 55% · Rare 35% · Epic 18%.
- Hệ số cấp: ×(1 − 1% × (cấp − 1)). Advanced Capture Orb ×1.5. Trần 95%.
- Thất bại: 25% Eidolon bỏ trốn (kết thúc encounter), còn lại ở lại cho lần ném tiếp theo.
- Encounter hết hạn sau 5 phút; bắt đầu encounter kiểm tra khoảng cách ≤ 3 ô (Part 6 §6).
- Tài khoản mới nhận 5 Basic Capture Orb.

## Triệu hồi — Standard Resonance (Part 9 §8)
- Giá: 30 Crystal/lượt, 270 Crystal/10 lượt (tài khoản mới có đúng 30 Crystal = 1 lượt đầu).
- Tỉ lệ theo độ hiếm (công khai trong panel): Common 55% · Uncommon 30% · Rare 11% · Epic 4% — đều nhau trong cùng bậc (roster 6/6/5/3).
- Pity: lượt thứ 10 liên tiếp không Rare+ → bảo đảm Rare+; 80 lượt không Epic+ → bảo đảm Epic (bộ đếm `since_rare`/`since_epic` lưu server).
- Trùng loài: chuyển thành +10 Mảnh loài đó + 5 Bond Essence (Part 9 §8.7), không tạo instance trùng.
- Mọi lần pull bắt buộc có Idempotency-Key; server lưu kết quả theo key, gửi lại key cũ trả đúng kết quả cũ, không trừ tiền hai lần.

## API (theo Part 6)
`GET /creatures` · `GET /inventory` · `POST /encounters/start` · `POST /encounters/{id}/capture` · `GET /summoning/banners` · `POST /summoning/pull`. Wild spawn đi qua WebSocket: snapshot có `wilds`, sự kiện `world.wild_spawned` / `world.wild_removed`.
