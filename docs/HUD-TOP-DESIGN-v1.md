# HUD phía trên — Thiết kế v1 (2026-11-11)

Nghiên cứu theo lệnh của Tín "Nghiên cứu làm hud phía trên đi".

## Nguồn tham khảo
- **Tài liệu của game (khóa cứng):** Part 13 §4 — vùng trên cùng của World HUD gồm: trạng thái người chơi, tóm tắt tiền tệ; tracker nhiệm vụ là thành phần ngữ cảnh (thu gọn được). Part 5 §7 — ví gồm `currency_types` + `player_wallets` (BIGINT), 4 tiền tệ MVP: Gold, Crystal, Bond Essence, Evolution Core (Part 11 §12).
- **Game mobile cùng thể loại (Pokémon GO, Nexomon, các game gacha mobile):** mẫu chung đã thành chuẩn — cụm trái là chân dung nhân vật có huy hiệu cấp + tên + thanh EXP mảnh; cụm phải là các chip tiền tệ dạng pill (icon + số, bấm + để nạp/mở shop) và nút tròn cho Thư/Cài đặt. Mọi thứ nằm trong một thanh duy nhất cao ~1/14 màn hình, nền tối mờ để không tranh với cảnh.
- **Coromon:** thông tin trạng thái đội/người chơi luôn gọn ở viền, giữa màn hình tuyệt đối không có overlay thường trực.

## Quyết định cho Eidolith
1. **Một thanh HUD duy nhất** ở trên cùng (thay hai chip rời trước đây):
   - Trái: avatar trong khung bo góc + huy hiệu cấp tròn ở góc dưới-phải avatar; tên nhân vật (— chấm chỉ báo kết nối đã bị bỏ theo lệnh của Tín 2026-11-11); dưới tên là **thanh EXP** mảnh màu teal kèm số EXP.
   - Phải: chip **Gold** và chip **Crystal** (icon SVG xu/gem, số định dạng phân cách nghìn kiểu 1.250), nút tròn **Thư** và **Cài đặt** — bấm mở panel Menu của hub (Cài đặt mở thẳng mục cài đặt).
2. **Hàng hai (ngữ cảnh, nhỏ và nhẹ):** trái là tracker nhiệm vụ dạng pill ("Arc 0 · Nói chuyện với Elder Rowan", bấm mở panel Nhiệm vụ); phải là chip ngữ cảnh (tên map · giờ thế giới · thời tiết · số người chơi) — giữ nguyên dữ liệu sống như trước.
3. **Tiền tệ phải là số thật:** dựng ví theo Part 5 §7 (migration 002: `economy.currency_types`, `economy.player_wallets`, `economy.currency_transactions`) + API `GET /player/wallet`. Tài khoản mới nhận quà khởi đầu **500 Gold + 30 Crystal** (mức baseline MVP do Bé đặt vì tài liệu không ghi số khởi đầu — có ghi transaction `starter_grant` để kiểm toán, chỉnh sau nếu Tín muốn mức khác). Tài khoản cũ được cấp ví khi migration chạy.
4. **Đường cong EXP** tài liệu chưa định nghĩa: tạm dùng mức lên cấp = 100 × cấp hiện tại (đánh dấu PROVISIONAL cùng quy chế với base stats tạm ở game-data, chờ chốt ở Phase 5).
5. **Icon là Font Awesome CSS thật, tự host** (lệnh của Tín 2026-11-11: đổi toàn bộ icon hub sang icon CSS, bỏ nút Thư/Cài đặt khỏi thanh trên — hai mục này vẫn ở trong panel Menu): Font Awesome 6.5.2 đặt tại `apps/game-client/public/fontawesome/` (không CDN ngoài); file font nhị phân không lưu git, khôi phục bằng `tools/fetch-fontawesome.sh`. Ánh xạ: xu = fa-coins, gem = fa-gem, nav = fa-compass/fa-paw/fa-house/fa-scroll/fa-grip, menu = fa-bag-shopping/fa-wand-magic-sparkles/fa-store/fa-user-group/fa-shield-halved/fa-trophy/fa-gear/fa-envelope, đóng panel = fa-xmark.
6. Toàn bộ vẫn là lớp DOM của hub (đồng bộ khung canvas như HUB-DESIGN-v1), không thêm lớp HUD canvas nào khác — HudScene chỉ còn joystick.
