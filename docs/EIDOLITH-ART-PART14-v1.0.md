# EIDOLITH – Part 14 – Art & Animation Production Bible

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

ART & ANIMATION PRODUCTION BIBLE

PART 14 – Pixel Art Isometric Visual Standards and Asset Pipeline

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-14 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Art Direction

- 2. Camera & Tile Standard

- 3. Resolution & Pixel Density

- 4. Character & Eidolon Assets

- 5. Animation Standards

- 6. Environment Art

- 7. VFX & Element Language

- 8. UI Art

- 9. Naming & File Convention

- 10. Tiled & Phaser Pipeline

- 11. Quality Control

- 12. Production Plan

# 1. Art Direction

EIDOLITH sử dụng 2D Pixel Art với thế giới isometric. Không khí thiên nhiên huyền bí, ấm áp nhưng có vùng nguy hiểm và cổ đại.

Nhân vật và Eidolon có silhouette dễ nhận diện ở kích thước nhỏ. Tránh pixel noise, outline quá dày và palette quá bão hòa.

# 2. Camera & Tile Standard

World camera: isometric 2:1 diamond projection; tile tham chiếu 64×32 px. Có thể dùng tile multiples cho vật thể lớn.

Coordinate conversion phải thống nhất với Tiled, Phaser và navigation system. Art origin và foot anchor phải được định nghĩa.

Nhân vật được depth-sort theo world foot position, không theo tâm sprite.

# 3. Resolution & Pixel Density

Thiết kế theo logical pixel scale; Phaser render ở resolution phù hợp thiết bị và upscale bằng nearest-neighbor.

Sprite sheet dùng grid thống nhất, padding đủ để tránh bleeding; texture atlas có naming convention.

Không nội suy bilinear cho pixel art trừ hiệu ứng được duyệt.

# 4. Character & Eidolon Assets

Mỗi creature cần concept, front/side/three-quarter reference, palette, silhouette, scale chart và animation sheet.

Animation tối thiểu: idle, move, attack, hit, skill, victory/celebration và defeat. Creature không dùng animation không cần thiết nếu gameplay không gọi.

Animation phải giữ foot anchor ổn định; tránh nhảy vị trí khi chuyển state.

# 5. Animation Standards

Idle: loop tự nhiên, 4–8 frames tùy độ phức tạp.

Walk/run: loop 6–10 frames, tốc độ đồng bộ movement.

Attack: anticipation, active frame, recovery; hitbox timing phải khớp combat data.

Skill: cast, projectile/area effect, impact, recovery.

Defeat: kết thúc rõ ràng, không loop vô hạn.

Frame counts là guideline; ưu tiên readability và timing gameplay.

# 6. Environment Art

Tileset gồm ground, path, cliff, water, foliage, props, buildings, bridges và overlays.

Map layers: ground, ground detail, lower props, entities, upper props, canopy/foreground, collision metadata.

Collision và interaction metadata không được suy ra từ hình ảnh; phải có layer dữ liệu riêng.

Landmark phải có silhouette nhận diện tốt trên minimap và ở camera zoom-out.

# 7. VFX & Element Language

Flame: ember, heat distortion pixel clusters.

Tide: droplets, arcs, flowing ribbons.

Grove: leaves, spores, growth pulses.

Stone: fragments, dust, impact rings.

Gale: curved wind streaks.

Frost: sharp crystalline particles.

Volt: angular branching sparks.

Venom: bubbles, toxic haze.

Shade: low-luminance wisps.

Astral: star motes and geometric glints.

VFX không che silhouette, telegraph hoặc status icon.

# 8. UI Art

UI icon phải đọc được ở 24–48 px; thiết kế silhouette trước chi tiết.

Rarity frame, element icon và role icon có quy chuẩn riêng; không chỉ dùng màu.

Typography ưu tiên pixel font cho tiêu đề ngắn; body text dùng font dễ đọc và hỗ trợ dấu tiếng Việt.

# 9. Naming & File Convention

Ví dụ: eidolon_emberling_idle_01.png, env_verdant_ground_a.png, vfx_flame_burst_01.png, ui_icon_capture_orb.png.

Asset metadata lưu source, author, license, dimensions, pivot, frame rate, palette version và content version.

Không đưa file nguồn nặng vào runtime nếu chỉ cần atlas đã build.

# 10. Tiled & Phaser Pipeline

Artist tạo tileset và map trong Tiled; export TMX/JSON theo pipeline thống nhất.

Validation tool kiểm tra tile size, layer name, object type, collision, spawn point, navigation data và asset reference.

Build step đóng gói atlas, map data và manifest; CI fail nếu thiếu asset hoặc sai reference.

# 11. Quality Control

Kiểm tra pixel alignment, palette consistency, silhouette, animation loop, foot anchor, atlas bleed, readability ở zoom thực tế và hiệu năng.

Kiểm tra màu mù bằng icon shape/pattern thay vì màu đơn lẻ.

Kiểm tra asset trên thiết bị thật ở nhiều độ sáng và tỷ lệ màn hình.

# 12. Production Plan

MVP art priority: Wanderer, 20 Eidolon base forms, 4 starter areas, Meadow Village, starter dungeon, boss arena, UI core set, capture/battle VFX.

Evolution forms có thể phát hành theo từng đợt; không cần sản xuất toàn bộ nhánh tiến hóa trước playable prototype.

Definition of Done: asset được duyệt, có metadata, tích hợp trong build, hiển thị đúng scale và không có lỗi animation/collision.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
