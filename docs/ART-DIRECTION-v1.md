# Eidolith — Art Direction v1 (đề xuất, chờ duyệt)

Ngày: 2026-11-10. Trạng thái: ĐÃ ĐƯỢT DUYỆT (Tín, 2026-11-10 "Duyệt hướng này, áp vào game luôn") và ĐÃ ÁP VÀO GAME: tileset/props v2 + sprite Wanderer nam/nữ + 3 NPC (tools/gen_art_v2.py, asset *-v2). Tín bổ sung: phải có nhân vật nữ — đã có Wanderer nữ (concept sheet art-concepts + sprite riêng), người chơi chọn Nam/Nữ ngay ở form đăng ký (lưu vào avatar_id: wanderer_male/wanderer_female). Sprite 4 Eidolon đầu tiên sẽ làm ở Phase 3 theo đúng sheet đã duyệt, golden-sample trước.

## 1. Nghiên cứu tham chiếu

| Game | Điểm mạnh thị giác | Bài học cho Eidolith |
|---|---|---|
| Coromon | Pixel art hiện đại, màu rực, outline đậm, không khí Ghibli, môi trường chi tiết | Chuẩn chất lượng chính: pixel "premium" chứ không phải pixel thô |
| Cassette Beasts | HD-2D: sprite pixel + môi trường giàu chiều sâu, tương phản cao, sprite biểu cảm | Tương phản sáng/tối mạnh giúp đọc hình ở màn hình nhỏ |
| Nexomon: Extinction | Màu anime tươi, hình khối đơn giản dễ đọc | Sinh vật phải đọc được hệ/nguyên tố ngay ở kích thước nhỏ |
| Temtem | 3D cel-shaded | Không áp dụng (Eidolith là 2D isometric theo Part 14) |
| Pokémon Black/White | Pixel chi tiết, đổ bóng nhiều tông | Đổ bóng 3–4 tông cho bề mặt lớn (cỏ, mái nhà, tán cây) |

Nguồn: review Coromon (exp.playtested / 3rd-strike / GameBrain), Cassette Beasts (Nintendo Life / ladiesgamers).

## 2. Hướng đồ hoạ mới — "Premium Pixel"

Giữ nguyên khung kỹ thuật của Art Bible Part 14 (isometric 2:1, tile 64×32, pixel art), nâng chất lượng:

- **Đổ bóng 3–4 tông** cho mọi bề mặt lớn; không còn màu phẳng 1 tông như bản placeholder.
- **Outline nâu đậm/tím ấm** (không dùng đen tuyền) — mềm và sang hơn.
- **Bảng màu ấm bão hoà**: xanh cỏ ngả vàng, mái terracotta, điểm nhấn teal + vàng gold (màu của Origin Core / pha lê Resonance).
- **Mặt đất có chất liệu**: cỏ có sợi và hoa li ti, đường lát đá từng viên, nước có lấp lánh.
- **Cây tán lớp** (layered canopy) 2 sắc độ để tạo chiều sâu; bóng mềm dưới vật thể.
- **Sinh vật**: mắt to biểu cảm, motif nguyên tố đọc rõ ở cỡ nhỏ (đuôi lửa, mầm lá, vây nước, lông gió xoáy), silhouette riêng từng loài.
- **Wanderer**: áo choàng teal viền vàng + mặt dây chuyền pha lê phát sáng — nhận diện chính của nhân vật, nhất quán ở mọi kích thước.

## 3. Bộ mockup v1 (trong `art-concepts/` ở workspace)

1. Golden screen Meadow Village — chuẩn vàng cho mọi màn hình sau.
2. Creature sheet: Emberling (Flame), Mossling (Grove), Aquafin (Tide), Zephy (Gale).
3. Wanderer sheet: mặt trước / nghiêng / chân dung.
4. Tileset & props sheet: tile cỏ/hoa/đá/nước, nhà, cây, thông, đá, bụi hoa, cụm pha lê.

## 4. Cách chuyển mockup thành asset game (khi được duyệt)

- Vẽ lại pixel-native ở đúng kích thước dùng thật (tile 64×32, sprite nhân vật ~48×64, sinh vật ~64×64) theo đúng mockup — không ép ảnh to xuống (tránh bệt/lem).
- Golden screen duyệt xong mới nhân rộng: tileset Verdant → props → Wanderer 8 hướng? (game dùng sprite tĩnh + bobbing ở Phase 2; sheet di chuyển làm ở đợt polish) → 4 Eidolon đầu tiên → NPC.
- Mọi asset mới giao dưới tên file mới, kèm ảnh kiểm chứng trong game ở kích thước thật.
