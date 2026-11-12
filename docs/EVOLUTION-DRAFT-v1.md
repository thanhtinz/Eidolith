# EVOLUTION-DRAFT-v1 — Phác thảo dữ liệu 41 dạng tiến hoá (CHỜ TÍN DUYỆT)

> Trạng thái: BẢN PHÁC THẢO do Bé tự soạn ngày 2026-11-12 để Tín duyệt một lượt.
> Chưa đưa vào game-data, chưa mở nút Tiến hoá. Duyệt xong mới code hoá vào
> `packages/game-data` + migration + transaction tiến hoá (DDD Part 5 §17.2).

## Vì sao có bản này

Phase 5 đã xong lõi (thưởng trận, nhiệm vụ, thẻ chi tiết) nhưng tiến hoá chưa mở được:
tài liệu Part 3 chỉ cho **tên** của 41 dạng tiến hoá, không có creature id / hệ / vai trò /
chỉ số của dạng đích (xem PHASE5-PROGRESSION-v1.md §4). Thay vì chờ, bản này phác thảo
đầy đủ 41 dạng theo đúng các công thức số đã đang chạy trong game, để Tín chỉ cần
duyệt/sửa, không phải thiết kế từ trang trắng.

## Nguyên tắc phác thảo (toàn bộ đều suy ra từ luật đã chốt trong game)

1. **Hệ giữ nguyên** theo dạng gốc — không dạng nào đổi hệ (tài liệu không ghi đổi hệ).
   Trường hợp duy nhất cần lưu ý: Obsidrake (từ Crystalhorn, Stone) — tên gợi bóng tối
   nhưng vẫn giữ hệ Stone; nếu Tín muốn đổi Shade thì sửa ở bước duyệt.
2. **Độ hiếm tăng đúng 1 bậc**: Common→Uncommon, Uncommon→Rare, Rare→Epic, Epic→Legendary.
3. **Nhánh = lựa chọn lối chơi**: mỗi loài có 1 nhánh "đi sâu vai trò gốc" và 1 nhánh
   "rẽ sang vai trò kề" (Emberling có 3 nhánh: sâu Striker, rẽ Guardian, rẽ Ranger).
   Đây là điểm thiết kế chính cần Tín duyệt — nó làm tiến hoá thành quyết định build,
   không chỉ là tăng số.
4. **Chỉ số tính bằng chính công thức provisional đang chạy** (`provisionalBaseStats`
   trong game-data: bảng role × hệ số rarity, SPD không nhân rarity), sau đó nhân hệ số
   tiến hoá **×1.20** cho HP/ATK/DEF, SPD giữ theo vai trò đích. Không có con số nào
   ngoài công thức này.
5. **Điều kiện giữ nguyên như game đã hiển thị**: Lv.16 + 1 Evolution Core
   (Core đã rơi thật từ trận thắng 25% và nhiệm vụ ngày). Không thêm cổng Bond/vật phẩm.
6. **Stage**: 41 dạng này là bậc **Awakened** (bước tiến hoá 1 theo điểm mở số 9 trong
   KE-HOACH-MVP). Bậc Ascended chưa có tên/hình trong tài liệu — để giai đoạn sau.
7. **Kỹ năng**: dạng tiến hoá giữ 2 kỹ năng đầu của dạng gốc, kỹ năng cuối (ultimate)
   nâng cấp theo dạng đích — tên ultimate mới sẽ soạn ở bước code hoá sau khi Tín duyệt
   bảng này, tránh soạn 41 tên khi hướng nhánh còn có thể đổi.
8. **ID đề xuất**: EID-021 → EID-061, đánh số theo thứ tự roster gốc (bảng dưới).
   Dạng tiến hoá là template riêng trong game-data, cá thể người chơi trỏ sang template
   mới khi tiến hoá (đúng mô hình transaction của DDD §17.2).

## Bảng 41 dạng tiến hoá

| ID đề xuất | Dạng tiến hoá | Từ | Hệ | Vai trò | Độ hiếm | HP | ATK | DEF | SPD | Định hướng nhánh |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EID-021 | Ignidrake | EID-001 Emberling | Flame | Striker | Uncommon | 134 | 34 | 12 | 14 | Rồng lửa công phá — giữ vai Striker, dồn sát thương |
| EID-022 | Cinderguard | EID-001 Emberling | Flame | Guardian | Uncommon | 191 | 22 | 20 | 10 | Khiên than hồng — rẽ sang thủ, chắn cho đội |
| EID-023 | Solarwing | EID-001 Emberling | Flame | Ranger | Uncommon | 121 | 31 | 11 | 15 | Cánh mặt trời — rẽ sang đánh xa |
| EID-024 | Thornwarden | EID-002 Mossling | Grove | Guardian | Uncommon | 191 | 22 | 20 | 10 | Tường gai bảo hộ đội |
| EID-025 | Verdant Sage | EID-002 Mossling | Grove | Support | Uncommon | 127 | 24 | 14 | 13 | Hiền giả rừng — hồi phục thuần |
| EID-026 | Tideray | EID-003 Aquafin | Tide | Ranger | Uncommon | 121 | 31 | 11 | 15 | Cá đuối lướt sóng — đánh xa cơ động |
| EID-027 | Abyssfin | EID-003 Aquafin | Tide | Specialist | Uncommon | 125 | 30 | 12 | 14 | Thợ săn vực sâu — kỹ thuật áp lực nước |
| EID-028 | Granitusk | EID-004 Pebblit | Stone | Guardian | Uncommon | 191 | 22 | 20 | 10 | Ngà granite — thủ cứng tuyến đầu |
| EID-029 | Titanolith | EID-004 Pebblit | Stone | Guardian | Uncommon | 191 | 22 | 20 | 10 | Pháo đài sống — thủ tối đa, chậm chắc |
| EID-030 | Zephyrion | EID-005 Zephy | Gale | Ranger | Uncommon | 121 | 31 | 11 | 15 | Chúa tể gió nhẹ — tốc độ và tầm xa |
| EID-031 | Stormcrest | EID-005 Zephy | Gale | Specialist | Uncommon | 125 | 30 | 12 | 14 | Mào bão — kỹ thuật diện rộng |
| EID-032 | Lumivane | EID-006 Glowmoth | Astral | Support | Rare | 136 | 25 | 14 | 13 | Cánh sáng — hỗ trợ/hồi phục |
| EID-033 | Astramoth | EID-006 Glowmoth | Astral | Controller | Rare | 138 | 27 | 14 | 12 | Bướm tinh tú — bụi sao khống chế |
| EID-034 | Thorncrawler | EID-007 Thornbug | Venom | Controller | Rare | 138 | 27 | 14 | 12 | Bọ gai bò — bẫy và độc trường |
| EID-035 | Venomarch | EID-007 Thornbug | Venom | Striker | Rare | 142 | 35 | 13 | 14 | Chúa độc — rẽ sang gây sát thương độc trực tiếp |
| EID-036 | Noctyra | EID-008 Shadekit | Shade | Striker | Epic | 152 | 36 | 14 | 14 | Bóng đêm săn mồi — sát thương bùng nổ |
| EID-037 | Umbrafang | EID-008 Shadekit | Shade | Specialist | Epic | 142 | 32 | 14 | 14 | Nanh u ám — ảo ảnh và ám sát kỹ thuật |
| EID-038 | Glacior | EID-009 Frostling | Frost | Controller | Rare | 138 | 27 | 14 | 12 | Sông băng sống — đóng băng diện rộng |
| EID-039 | Cryomantle | EID-009 Frostling | Frost | Guardian | Rare | 203 | 23 | 21 | 10 | Áo choàng băng — rẽ sang chắn đỡ |
| EID-040 | Voltusk | EID-010 Voltik | Volt | Striker | Epic | 152 | 36 | 14 | 14 | Ngà điện — xung kích tốc độ cao |
| EID-041 | Stormcore | EID-010 Voltik | Volt | Specialist | Epic | 142 | 32 | 14 | 14 | Lõi bão — tích điện và bùng nổ kỹ thuật |
| EID-042 | Elderroot | EID-011 Rootusk | Grove | Guardian | Rare | 203 | 23 | 21 | 10 | Rễ cổ thụ — thủ và neo vị trí |
| EID-043 | Worldbark | EID-011 Rootusk | Grove | Support | Rare | 136 | 25 | 14 | 13 | Vỏ cây thế giới — rẽ sang hồi phục diện rộng |
| EID-044 | Magmabite | EID-012 Cindermite | Flame | Specialist | Uncommon | 125 | 30 | 12 | 14 | Hàm dung nham — kỹ thuật nhiệt |
| EID-045 | Infermite | EID-012 Cindermite | Flame | Striker | Uncommon | 134 | 34 | 12 | 14 | Bọ địa ngục — rẽ sang công trực diện |
| EID-046 | Tidalisk | EID-013 Shellune | Tide | Guardian | Rare | 203 | 23 | 21 | 10 | Đĩa thủy triều — thủ bằng vỏ và sóng |
| EID-047 | Abysshell | EID-013 Shellune | Tide | Controller | Rare | 138 | 27 | 14 | 12 | Vỏ vực sâu — rẽ sang giam giữ địch trong vỏ |
| EID-048 | Aerolume | EID-014 Galesprite | Gale | Support | Rare | 136 | 25 | 14 | 13 | Linh gió sáng — hỗ trợ tốc độ đội |
| EID-049 | Tempestia | EID-014 Galesprite | Gale | Controller | Rare | 138 | 27 | 14 | 12 | Nữ chúa bão tố — rẽ sang khống chế bằng gió |
| EID-050 | Crystagorn | EID-015 Crystalhorn | Stone | Guardian | Epic | 218 | 24 | 22 | 10 | Sừng pha lê — thủ phản sát thương |
| EID-051 | Obsidrake | EID-015 Crystalhorn | Stone | Striker | Epic | 152 | 36 | 14 | 14 | Rồng hắc diện thạch — rẽ sang công phá (hệ giữ Stone) |
| EID-052 | Blightbloom | EID-016 Venomleaf | Venom | Controller | Epic | 148 | 28 | 15 | 12 | Hoa úa độc — vùng độc khống chế |
| EID-053 | Vilethorn | EID-016 Venomleaf | Venom | Striker | Epic | 152 | 36 | 14 | 14 | Gai độc hiểm — rẽ sang sát thương |
| EID-054 | Nocturnis | EID-017 Duskowl | Shade | Ranger | Epic | 138 | 34 | 12 | 15 | Cú đêm — tỉa xa trong bóng tối |
| EID-055 | Darkwing | EID-017 Duskowl | Shade | Striker | Epic | 152 | 36 | 14 | 14 | Cánh đêm — rẽ sang cận chiến bổ nhào |
| EID-056 | Celestwhisp | EID-018 Starwhisp | Astral | Support | Legendary | 156 | 27 | 16 | 13 | Linh hồn thiên giới — hỗ trợ cấp cao nhất |
| EID-057 | Nebulume | EID-018 Starwhisp | Astral | Controller | Legendary | 159 | 30 | 16 | 12 | Tinh vân — rẽ sang khống chế diện rộng |
| EID-058 | Frostmaw | EID-019 Glacibear | Frost | Striker | Legendary | 164 | 38 | 14 | 14 | Hàm băng — rẽ sang công phá băng |
| EID-059 | Polar Titan | EID-019 Glacibear | Frost | Guardian | Legendary | 234 | 25 | 23 | 10 | Titan cực địa — thủ tối thượng |
| EID-060 | Stormreaver | EID-020 Tempestray | Volt | Striker | Legendary | 164 | 38 | 14 | 14 | Kẻ săn bão — sát thương sấm sét tối đa |
| EID-061 | Thunderlord | EID-020 Tempestray | Volt | Specialist | Legendary | 153 | 34 | 14 | 14 | Chúa sấm — kỹ thuật điện diện rộng |
## Điểm cần Tín chốt khi duyệt

1. Nguyên tắc nhánh "1 sâu vai trò + 1 rẽ vai trò" — giữ hay muốn mọi nhánh cùng vai trò gốc?
2. Hệ số tiến hoá ×1.20 — giữ, hay tiến hoá phải mạnh hẳn (×1.35) / nhẹ hơn (×1.10)?
3. Obsidrake giữ hệ Stone hay đổi Shade?
4. Điều kiện chỉ Lv.16 + 1 Evolution Core như game đã hiển thị, hay thêm Bond tối thiểu?

Duyệt 4 điểm này (hoặc sửa thẳng trên bảng) là Bé code hoá: thêm 41 template vào
game-data + validator, migration lưu creature template của cá thể, endpoint tiến hoá
theo transaction DDD §17.2, và nối nút Tiến hoá trong thẻ chi tiết. Sprite của 41 dạng
chưa có — đợt art riêng theo luật vẽ monster (từng con, trình mẫu trước khi nhân rộng).
