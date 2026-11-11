# EIDOLITH – Part 15 – Audio & VFX Design

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

AUDIO & VISUAL EFFECTS DESIGN DOCUMENT

PART 15 – Soundscape, Music, Combat Feedback and Effect Budget

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-15 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Audio Vision

- 2. Audio Categories

- 3. Regional Soundscape

- 4. Adaptive Music

- 5. Combat Sound Design

- 6. VFX Design Rules

- 7. Mobile Performance Budget

- 8. Audio Implementation

- 9. Accessibility & QA

- 10. MVP Deliverables

# 1. Audio Vision

Âm thanh củng cố cảm giác khám phá và sự sống của Aetheria. Mỗi vùng có bản sắc âm thanh riêng, nhưng mix không được gây mệt khi chơi lâu.

Audio phải hỗ trợ gameplay: telegraph, hit confirmation, capture success, quest completion và trạng thái nguy hiểm.

# 2. Audio Categories

Music: exploration, village, dungeon, boss, battle, menu, event.

Ambience: wind, birds, water, insects, forest, cave, weather.

SFX: movement, interaction, UI, creature vocalization, skill, impact, capture, reward.

Voice: NPC barks hoặc creature calls chọn lọc; voice-over đầy đủ không thuộc MVP.

# 3. Regional Soundscape

Verdant Plains: gió đồng cỏ, chim, côn trùng, nhạc acoustic nhẹ.

Emberfall: gió nóng, đá nứt, tiếng lửa và nhịp percussion.

Frostveil: gió lạnh, băng rạn, âm sắc thưa và vang.

Hollowreach: ambience tối, âm thanh hữu cơ và tiếng vọng.

Celestia: âm thanh tinh thể, harmonic và không gian rộng.

# 4. Adaptive Music

Music states: exploration calm, exploration danger, encounter, battle, boss phase, victory, defeat.

Crossfade phải mượt; không reset track vô lý khi người chơi đi qua ranh giới nhỏ.

Priority rules ngăn nhiều music state phát đồng thời.

# 5. Combat Sound Design

Mỗi skill có cast cue, release cue, impact cue và optional status cue.

Boss telegraph cần âm thanh riêng biệt, khác rõ với hit thường.

Critical hit, shield break, heal và elemental reaction cần feedback phân biệt.

Âm thanh không được tiết lộ thông tin mà người chơi không thể nhìn thấy trong PvP.

# 6. VFX Design Rules

VFX chia lớp: telegraph, cast, projectile, impact, status, ambient và UI feedback.

Telegraph phải xuất hiện trước vùng nguy hiểm theo thời gian thiết kế; màu sắc luôn đi kèm shape/pattern.

Giới hạn particle, overdraw và screen shake; cung cấp reduced-effects setting.

VFX phải đồng bộ với combat event timestamp, không tự quyết định damage.

# 7. Mobile Performance Budget

Định nghĩa ngân sách particle theo cảnh: exploration, battle và boss; đặt cap cho emitter và active particles.

Ưu tiên object pooling; tránh tạo/hủy liên tục trong combat.

Audio voice limit và priority để không phát quá nhiều creature sounds cùng lúc.

Thiết bị yếu có thể giảm ambience layers, particle density và reverb.

# 8. Audio Implementation

Audio event được gọi bằng event key từ gameplay presentation layer; combat core không phụ thuộc audio engine.

Asset manifest chứa event, clip, volume, pitch range, cooldown, priority và localization variant.

Audio settings lưu Music, SFX, Ambience, Voice riêng.

# 9. Accessibility & QA

Caption hoặc visual indicator cho cue gameplay quan trọng.

Không dùng âm thanh làm tín hiệu duy nhất cho boss attack hoặc trạng thái.

Kiểm thử loa ngoài, tai nghe, mute, background/foreground, Bluetooth latency và thiết bị cấu hình thấp.

# 10. MVP Deliverables

4 regional ambience sets, 3 music themes, battle/boss/victory/defeat cues, 20 creature vocal sets chọn lọc, UI SFX pack và bộ VFX cho 6 nguyên tố MVP.

Acceptance: audio không chồng lấn nghiêm trọng; telegraph rõ; hiệu năng đạt ngân sách; mọi volume category hoạt động.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
