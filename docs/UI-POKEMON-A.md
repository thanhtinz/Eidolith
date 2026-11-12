# UI Hướng A — "Chuẩn Pokémon" (chốt 2026-11-11)

Tín chọn hướng A trong 3 mockup nghiên cứu từ Pokémon Scarlet/Violet
(`shots/hud-poke/STUDY.md` có bản rút gọn ngữ pháp) và ra thêm luật điều hướng
(bên dưới). Đã áp vào game thật: hub (`src/ui/hub.ts`), BattleScene overlay,
joystick (HudScene), form đăng nhập (LoginScene + `index.html`).

## Token

- Tấm nền: slate `rgba(27–35, 33–43, 43–54, .93–.97)`, viền 1px
  `rgba(255,255,255,.10–.12)`, bo góc 12–18px, đổ bóng mềm.
- Đang chọn / hành động chính: vàng đặc `#ffd83d`, chữ tối `#26303a`.
- Thanh tiến trình: rãnh `rgba(0,0,0,.42)`, lõi XP xanh dương `#39b6e8`
  (người chơi), lõi tăng trưởng xanh lá `#3ddc5f` (Eidolon/nhiệm vụ);
  **con số nằm trong thanh**, chữ trắng đậm.
- Hệ/nguyên tố: pill màu hệ, chữ trắng. Nhãn mục: chữ vàng, hoa,
  giãn chữ 1.6px, 11–12px.
- Huy hiệu cấp: pill vàng "Lv.N" ở góc avatar. Nút đóng panel: ô vuông đỏ.
- Font giữ nguyên: Baloo 2 (tiêu đề/số) + Be Vietnam Pro (nội dung).

## Cấu trúc đã đổi so với theme "Nhật ký thám hiểm"

- Menu điều hướng: bỏ huy chương tròn → panel slate với các HÀNG icon + nhãn;
  hàng đang chọn phủ vàng. Vẫn thu gọn: mặc định 1 nút tròn slate góc dưới-phải
  (icon theo mục đang mở + chevron vàng), bấm mới xổ panel.
- Dải đội: ô tròn → thẻ nameplate nhỏ (sprite + tên + Lv + thanh XP có số).
- Ô đội hình trong panel Eidolons: thẻ ngang (sprite + tên + dòng Lv · XP).
- Thẻ chi tiết: hàng kỹ năng có chip icon màu hệ + thẻ loại chiêu vàng ở phải;
  nhãn mục vàng hoa đúng ngữ pháp Pokémon.
- Thanh EXP người chơi cao 17px, số trắng trong thanh.

## HUD trên — bản A2 (Tín chốt mockup A 2026-11-11 20:20)

- Thẻ nhân vật + thẻ nhiệm vụ: nameplate **cắt xiên cạnh phải** (clip-path),
  gradient slate, vạch ngọc lục bảo `#2fae9b` ở mép trái thẻ nhân vật;
  huy hiệu "Lv.N" thành pill vàng nằm giữa dưới avatar.
- Tiền: hai loại gộp vào **một dải pill** duy nhất (icon + số), không kèm giờ.
- **Giờ thế giới + thời tiết: tách riêng thành pill nhỏ nằm dưới minimap** —
  lệnh riêng của Tín, không gộp vào dải tiền. Định dạng pill (Tín chốt
  2026-11-11 20:40): `HH:MM | <icon thời tiết> <nhãn>` rồi mới tới
  `· N người chơi`. Icon theo loại thời tiết Part 8 §14 (fa-sun / fa-cloud /
  fa-cloud-rain / fa-wind / fa-cloud-bolt / fa-smog / fa-snowflake);
  server đã bổ sung loại `wind` ("Gió mạnh") vào vòng quay thời tiết.
- Minimap thành mặt la bàn: vòng vàng inset trong viền slate + 4 chấm
  vàng ở 4 hướng; chấm vị trí người chơi giữ nguyên.

## Luật điều hướng nhiệm vụ (Tín lệnh 2026-11-11 19:45)

- **Menu KHÔNG có mục Nhiệm vụ.**
- Panel Nhiệm vụ mở bằng cách **bấm vào thẻ nhiệm vụ ngay dưới thẻ thông tin
  nhân vật** (tracker `#hub-qtrack` → `setTab("quests")`). Đây là cửa vào
  duy nhất của panel Nhiệm vụ; renderer và `setTab("quests")` vẫn giữ nguyên
  để NPC/sự kiện sau này gọi được.
