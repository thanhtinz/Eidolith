# Hub UI — Thiết kế v1 (2026-11-11)

Nghiên cứu nhanh trước khi dựng, theo lệnh của Tín "Nghiên cứu làm hub đi".

## Nguồn tham khảo
- **Tài liệu của game (khóa cứng):** Part 13 §2 — điều hướng chính đúng 5 mục **World · Eidolons · Sanctuary · Quests · Menu**; Menu mở Inventory, Summon, Shop, Friends, Guild, Arena, Settings, Mail. §4 — HUD thế giới: trên cùng là trạng thái người chơi + tóm tắt tiền tệ, giữa để trống cho thế giới, dưới là joystick + truy cập nhanh. §5 — thẻ Collection phải có portrait, tên, hệ, độ hiếm, cấp; không chỉ dựa vào màu để báo hệ.
- **Coromon (bản Remastered):** màn hình đội hình dùng thẻ dọc cho từng sinh vật — artwork lớn, icon hệ, chỉ số HP/tốc độ; menu là các thẻ bấm lớn, ít thao tác. Học: thẻ Eidolon trong hub dùng artwork đã cắt + chip hệ + vai trò, không dùng danh sách chữ khô.
- **Nexomon / game mobile cùng thể loại:** thanh điều hướng dưới đáy cố định, một tay bấm tới mọi hệ thống chính; panel trượt lên từ dưới, thế giới vẫn chạy phía sau.

## Quyết định cho Eidolith
1. Hub là lớp DOM phủ trên canvas (cùng cách với form đăng nhập): chữ nét, layout theo đúng tọa độ game 720×1280, vùng trống có `pointer-events: none` để chạm xuyên xuống thế giới.
2. **Thanh trên:** chip người chơi (avatar theo giới tính, tên, Lv, EXP thật từ hồ sơ) — chip tiền tệ chỉ hiện khi có API ví (Phase 5), không hiện số giả.
3. **Nav dưới đáy 5 mục** đúng Part 13, icon SVG tự vẽ (không emoji), mục đang chọn viền vàng; "Thế giới" = đóng panel.
4. **Panel dạng bottom-sheet** (nền kính tối, viền vàng/teal theo nhận diện game), nội dung cuộn, thế giới vẫn chạy sau panel.
5. Nội dung từng panel ở bản này:
   - *Eidolons:* 5 ô đội hình (trống) + lưới Dex đủ 20 loài từ game-data (thẻ: sprite nếu đã có art, tên, chip hệ tiếng Việt, độ hiếm, vai trò, nơi sống). Trạng thái sở hữu nối thật ở Phase 3.
   - *Sanctuary:* 3 thẻ công trình (Nhà chính, Vườn gắn kết, Đài tiến hoá) + ô phân công trống — số liệu nâng cấp nối ở Phase 5.
   - *Nhiệm vụ:* tab Chính tuyến / Hằng ngày / Phụ; Arc 0 với 3 mục tiêu đầu; 5 mục tiêu ngày theo Part 10 §13.
   - *Menu:* thẻ hồ sơ + lưới 8 mục theo Part 13; Cài đặt dùng được ngay (bật/tắt nhạc & hiệu ứng, lưu máy); Đăng xuất hoạt động thật; các mục còn lại báo rõ "mở ở giai đoạn sau" thay vì làm giả.
6. HUD cũ bỏ chip tên người chơi ở góc dưới-phải (đã chuyển lên thanh trên của hub) để tránh trùng lặp; joystick nâng lên trên nav.

## Bổ sung 2026-11-11 — CHUYỂN NGANG 1280×720 (lệnh của Tín, ghi đè khóa dọc 9:16 của Part 4)
- Phaser logical size đổi 720×1280 → **1280×720** (Scale FIT giữ nguyên); hub DOM root đổi tương ứng.
- **Điều hướng chính**: bỏ thanh đáy, thành **rail dọc ở mép phải** (5 mục giữ nguyên thứ tự/icon Font Awesome, nhãn dưới icon, mục đang chọn vàng) — vùng giữa màn hình hoàn toàn dành cho thế giới.
- **Panel**: bỏ bottom-sheet, thành **hộp thoại giữa màn hình** (rộng tối đa 950, cao tối đa 656, chừa rail phải), nền tối .96 + bóng đổ; sổ loài 3 cột.
- **Thẻ encounter**: thẻ giữa màn hình rộng 520, art 150px.
- Thanh trên, tracker nhiệm vụ, chip ngữ cảnh, joystick trái-dưới giữ nguyên vị trí tương đối. Toast chuyển xuống đáy giữa.
