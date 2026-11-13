# STAGE 4 — SUN / MOON SYSTEM v1

> Đối chiếu checklist của Tín (2026-11-12) và nghiên cứu cách các game 2D làm chu kỳ ngày/đêm (Kingdom Two Crowns: bóng dài hướng ngược mặt trời lúc bình minh/hoàng hôn, ngắn nhất giữa trưa, đĩa mặt trời/trăng chạy theo cung; hệ thời tiết 2D hiện đại kiểu TimeOfDay: MỘT mô hình duy nhất sinh sun position + sun color + star intensity cho mọi lớp hình; Byzen devlog: trăng là nguồn sáng thứ hai thật, không phải tint của mặt trời).

## Nguyên tắc: một mô hình mặt trời duy nhất

`WorldScene.sunModel()` suy mọi thứ từ giờ thế giới (server world.ts `worldClock`, 60 phút thật = 24 giờ game):

- Mặt trời mọc 06:00, lặn 18:36. `dayT` = tiến trình trên cung ngày; **độ cao** `elev = sin(π·dayT)` (0 ở chân trời, 1 lúc trưa).
- Trăng chạy cung gương 18:36 → 06:00, `moonElev` cùng công thức.
- `darkness`: ngày = clamp(0,5 − elev); đêm = 0,55 + 0,45·moonElev.
- `golden`: đỉnh khi elev ≈ 0,3 (khoảng 08:00 và 17:00) — giờ vàng.
- Bóng đổ: hướng `dirX = cos(π·dayT)` (ngược phía mặt trời, lật chiều sáng/chiều), dài `len = 54 − 44·elev` px (dài lúc nắng thấp, ngắn lúc trưa); ban đêm bóng trăng mờ với hướng/len riêng.

## Năm mục checklist → nơi thực hiện (WorldScene.ts)

1. **Hướng nắng theo giờ** — `sunModel()`: dayT/elev/dirX/len là nguồn duy nhất mọi hệ con tiêu thụ.
2. **Ánh sáng đổi màu + vệt nắng** — màu: `applyTint()` keyframe 9 mốc (có từ Phase 2). Vệt nắng: texture `sky_rays` (dải sáng chéo sinh bằng canvas), blend ADD, alpha = golden × 0,13, góc nghiêng lật theo buổi sáng/chiều.
3. **Mặt trời lặn dần** — đĩa mặt trời `sky_sun` chạy cung ngang đỉnh màn hình (x theo dayT, y theo elev), to hơn + cam hơn khi gần chân trời, chìm và tắt ở 18:36; tint hoàng hôn lerp theo.
4. **Moon/Stars** — trường sao `sky_stars` (230 sao, alpha theo darkness, nhấp nháy nhẹ). Âm thanh đêm: `setNightAmbience()` trong ui/sfx.ts (dế tổng hợp + cú hiếm, tôn trọng cài đặt sfx) — game không dùng thư viện Howler, toàn bộ âm thanh là WebAudio tự tổng hợp từ trước tới nay. **Đĩa mặt trăng ĐÃ GỠ hẳn theo lệnh Tín 2026-11-12** ("Bỏ icon trăng luôn đi kiểu khi tối là biết trời tối"): ban đêm truyền đạt bằng độ tối + sao + âm thanh, không vẽ icon trăng lên trời; đường cong moonElev trong sunModel chỉ còn dùng nội bộ để tính darkness và bóng đêm mờ.
5. **Bóng đổ dài/ngắn theo giờ** — texture `sky_shadow` gắn cho: nhân vật người chơi + người chơi khác + quái hoang (bóng con trong container), NPC + prop (nhà/cây/thông/đá/bụi) + cây boss (bóng tĩnh theo vị trí, hệ số chiều cao riêng từng loại). Mọi bóng cập nhật hướng/độ dài/độ mờ từ `sunModel()` mỗi giây.

Lớp trời được ghim theo khung camera giống tintRect (`pinSky()` trong `update()`), depth 80003–80006 (trên tint 80000, dưới nhãn tên 90000).

## Kiểm chứng

Hook tour: `window.__eidolith.setWorldMinutes(m)` + `getSunState()`. Ảnh chụp 4 thời điểm: 08:00 (bóng dài + vệt nắng), 12:00 (bóng ngắn), 17:50 (hoàng hôn, đĩa trời thấp), 22:00 (trăng + sao).
