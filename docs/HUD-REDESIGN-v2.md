# HUD v2 — thiết kế lại toàn bộ lớp giao diện trên thế giới (2026-11-11)

Lệnh của Tín: "Nghiên cứu làm lại HUD hết". Mẫu tham chiếu: HUD ngang của Temtem (cụm người chơi góc trái-trên, minimap phải-trên, dải đội hình), Ragnarok M và Ni no Kuni: Cross Worlds (nút chức năng tròn nổi từng nút, joystick viền kim loại). Giữ nguyên ngôn ngữ đã chốt: kính tối + vàng #e8c96a + icon Font Awesome + không emoji.

## Bố cục mới (1280×720)
- **Trái-trên — cụm người chơi**: avatar TRÒN viền vàng + huy hiệu cấp đè góc, tên + thanh EXP ngay bên phải. Bỏ hẳn thanh slab chạy hết chiều ngang.
- **Dưới cụm người chơi — thẻ nhiệm vụ**: thẻ kính tối viền trái vàng, dòng "ARC 0" vàng nhỏ trên, mục tiêu hiện tại dưới; bấm mở panel Nhiệm vụ.
- **Phải-trên — tiền + minimap**: hai pill Xu/Lượng; dưới là **minimap thật** (ảnh render từ dữ liệu map, chấm vàng = vị trí người chơi chạy trực tiếp, chấm trắng = NPC, chấm vàng đậm = cổng), tên map + giờ thế giới + thời tiết + số người chơi nằm dưới khung minimap.
- **Phải-giữa — rail điều hướng**: bỏ cột slab, mỗi mục là **một nút tròn nổi riêng** (kính tối, đang chọn viền vàng + icon vàng), nhãn nhỏ dưới icon.
- **Giữa-dưới — dải đội hình**: 5 ô tròn chân dung Eidolon trong đội (viền theo màu hệ, huy hiệu cấp), ô trống là vòng đứt nét + icon chân thú; bấm mở panel Eidolons. Dữ liệu thật từ /creatures, tự làm mới sau khi bắt/triệu hồi.
- **Trái-dưới — joystick**: vẽ lại hai vòng (ngoài viền vàng mờ, trong kính tối), núm có lõi sáng.
- Toast dời lên trên dải đội hình.

## Không đổi
Panel giữa màn hình, thẻ encounter, toàn bộ luồng dữ liệu (ví, nhiệm vụ, sưu tập) — chỉ thay lớp trình bày trên thế giới.

## Triển khai 2026-11-11 — hướng A "Nhật ký thám hiểm" (Tín lệnh "Tiếp tục")
HUD v2 bị chê "vẫn xấu lắm" vì chất liệu kính lạnh không hợp thế giới tranh ấm. Ba hướng mockup đã dựng trên cảnh rừng thật (A da/giấy/vàng · B sáng tối giản · C đậm chất game); Tín lệnh tiếp tục + thu gọn menu → áp **hướng A** cho toàn bộ: hub thế giới, menu thu gọn (mặc định một nút huy chương, bấm xổ 5 mục, chọn xong tự thu, icon nút thu đổi theo mục đang chọn), panel, thẻ encounter, toast, màn đăng nhập, joystick gỗ/vàng trong HudScene. Font game **Baloo 2** (tiêu đề/số) + **Be Vietnam Pro** (nội dung) tự host ở public/fonts (woff2 không vào git, khôi phục bằng tools/fetch-fonts.sh). Minimap tròn: bản đồ thu vào khung tròn 113px ở giữa vòng vàng để chấm vị trí không bao giờ bị cắt ở góc map; ruy-băng tên map neo phải.
