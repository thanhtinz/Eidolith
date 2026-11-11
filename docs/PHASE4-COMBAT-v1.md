# Phase 4 — Combat: đặc tả triển khai + số liệu MVP v1 (2026-11-11)

Soạn trước khi code Phase 4, theo đúng mẫu Phase 3: Part 7 khóa KHUNG (công thức, cấu trúc, luật) nhưng không cho số cụ thể ở nhiều chỗ. Số nào Part 7 đã cho thì ghi nguồn §; số nào chưa có thì là baseline do Bé đặt, tập trung MỘT chỗ trong code (`packages/combat-core/src/combat-config.ts` + định nghĩa skill trong `packages/game-data`) để simulation 1.000 trận tinh chỉnh, trình Tín bảng số trước khi khóa cứng (điểm mở 5 trong KE-HOACH-MVP).

## 1. Hiện trạng kiểm chứng (2026-11-11)

- `packages/combat-core/src/index.ts` mới là khung: `BattleEngine.step()` rỗng, chưa có BattleState, movement, AI, skill resolver, status, reaction, replay hash. Hằng số đã đúng Part 7: 10 tick/s, seeded RNG (`SeededRng` từ math-utils).
- `packages/game-data`: 20 loài mới có `skillNames` (3 tên/con = 60 tên) + trait tên/mô tả; CHƯA có `SkillDefinition` nào. `baseStats` là provisional theo role×rarity (hp/atk/def/spd — thiếu matk/mdef/crit/acc/res, xem §6).
- 8 reaction + hệ số hệ 1.25/1.00/0.80 đã có sẵn trong game-data (`REACTIONS`, `ELEMENT_MULTIPLIER`).

## 2. Công thức khóa cứng theo Part 7 (không tự chế)

- §12.1 BaseDamage = ATK × SkillMultiplier.
- §12.2 Mitigation = 1 / (1 + DEF/100).
- §12.3 Damage = BaseDamage × Mitigation × ElementMultiplier × CriticalMultiplier × RandomFactor × DamageModifiers — thứ tự nhân cố định đúng như §12.3.
- §12.5: HP không âm; shield trừ trước HP; heal không vượt MaxHP (trừ cơ chế Overheal — MVP không có).
- §8.3 TargetScore = w1·Threat + w2·LowHP + w3·Distance + w4·RolePriority + w5·Vulnerability.
- §8.5 nhịp quyết định: movement mỗi tick; chấm mục tiêu mỗi 3–5 tick hoặc khi mục tiêu chết/đổi; skill mỗi tick khi sẵn sàng; phản ứng khẩn cấp theo sự kiện.
- §14.3 stacking: Burn/Poison cộng stack có trần; Regeneration/Shock refresh thời lượng; Defense Up/Weakness lấy bản mạnh nhất; Freeze không cộng dồn thời lượng vô hạn.
- §14.4 EffectiveChance = BaseChance × (1 − Resistance).
- §15: mỗi mục tiêu không kích hoạt chuỗi reaction vô hạn trong cùng tick; reaction có cooldown riêng.
- Sự kiện trình diễn (§17.3): UnitSpawned, UnitMoved, UnitTargetChanged, SkillStarted, SkillHit, DamageApplied, HealingApplied, StatusApplied, ReactionTriggered, UnitDefeated, BattleCompleted. Combat-core chỉ phát event, không gọi animation/âm thanh (§17.1).

## 3. Ánh xạ 3 kỹ năng mỗi loài → định nghĩa (theo tên đã có trong game-data)

Mẫu chung suy từ tên skill hiện có (ví dụ Emberling: Ember Bite / Flame Dash / Fire Burst):

| Vị trí | Category | Vai trò trong kit |
|---|---|---|
| skillNames[0] | Active cơ bản | Đòn chủ lực cooldown ngắn, multiplier thấp |
| skillNames[1] | Active đặc trưng theo role | Guardian: khiên/đỡ · Support: hồi/buff · Controller: khống chế/status · Striker/Ranger/Specialist: đòn thứ hai + status hệ |
| skillNames[2] | Ultimate | Cần energy đầy; AoE / hồi lớn / khống chế diện / burst lớn |

Baseline theo role (multiplier tính trên ATK; cooldown tính bằng giây, quy ra tick ×10):

| Role | Skill 1 (mult / CD) | Skill 2 (mult / CD) | Ultimate (mult / CD = energy) |
|---|---|---|---|
| Guardian | 1.0 / 4s | khiên = 25% MaxHP, 12s | 1.6 AoE / energy 100 |
| Striker | 1.1 / 4s | 1.4 đơn mục tiêu / 9s | 2.2 đơn hoặc 1.5 AoE / 100 |
| Ranger | 1.0 / 4s | 1.25 / 8s | 1.7 AoE / 100 |
| Support | 0.8 / 4s | hồi 18% MaxHP đồng đội thấp nhất / 10s | hồi 30% toàn đội hoặc khiên toàn đội / 100 |
| Controller | 0.9 / 4s | 1.1 + status hệ (chance §5) / 10s | 1.4 AoE + khống chế / 100 |
| Specialist | 1.0 / 4s | 1.3 + status hệ / 9s | 1.9 / 100 |

Đòn đánh thường (Basic Attack, §10.1): multiplier 1.0, chu kỳ theo SPD — baseline: mỗi `round(30 / spd)` tick ra một đòn (SPD 10–15 → 2–3 tick/đòn là quá nhanh so với trận mục tiêu 90–120s §2.1; simulation phải kiểm và nới chu kỳ — ứng viên: chu kỳ cơ số 10 tick × (15/spd)).

## 4. Số baseline Bé đặt (Part 7 không cho số — simulation sẽ chỉnh)

- RandomFactor (§12.3): đồng đều 0.90–1.10, lấy từ seeded RNG để replay khớp bit.
- Crit: chance mặc định 10%, CriticalMultiplier 1.5. (Stat crit riêng từng loài: để Phase 5 khi có bảng stat đầy đủ.)
- Energy (§11): tối đa 100; +10 khi ra đòn thường, +15 khi dùng skill chủ động, +8 khi nhận đòn, +12 khi kích hoạt reaction. Ultimate tốn 100, tự dùng theo điều kiện §11.4 (AoE khi ≥3 mục tiêu trong vùng; heal khi ≥2 đồng đội <50% HP; khống chế khi địch sắp đầy energy).
- Tầm đánh: cận chiến 1.2 đơn vị; Ranger/Support 4.0; tốc độ di chuyển = SPD × 0.12 đơn vị/tick (baseline — kiểm bằng simulation để trận kết thúc 90–120s như §2.1).
- Trọng số AI §8.3 theo profile (w1 Threat, w2 LowHP, w3 Distance [điểm càng gần càng cao], w4 RolePriority, w5 Vulnerability):
  - Aggressive/Striker: 0.30 / 0.25 / 0.20 / 0.15 / 0.10
  - Assassin: 0.10 / 0.40 / 0.10 / 0.30 / 0.10 (thứ tự role §8.4: Support > Ranger > Controller > Striker > Guardian)
  - Guardian/Protect: 0.40 / 0.05 / 0.25 / 0.20 / 0.10 (ưu tiên kẻ đang đánh đồng đội)
  - Ranged: 0.20 / 0.20 / 0.30 / 0.20 / 0.10
  - Support: chấm trên ĐỒNG ĐỘI (HP thấp nhất trước, §8.4), không dùng bảng này cho địch.
- Thời lượng trận tối đa: 1200 tick (120s) — hết giờ thì đội còn tổng %HP cao hơn thắng (baseline, Part 7 chỉ nói 90–120s là mục tiêu cân bằng §2.1).

## 5. Status + Reaction baseline (khung theo §13–§15)

- Status theo hệ (§13.2/§14.1): Burn 4% MaxHP/tick trong 3s, tối đa 3 stack · Poison 3%/3s tối đa 3 stack · Wet 5s (mồi cho reaction) · Freeze 1.5s (boss: giảm nửa, §16.4) · Shock giảm 30% tốc độ hành động 2s · Weakness −20% ATK 4s · Defense Up +25% DEF 5s · Regeneration 3% MaxHP/tick trong 4s · Empowerment +20% ATK 5s · Knockback đẩy 1.5 đơn vị.
- Chance áp status từ skill 2: 60% (qua công thức RES §14.4; RES mặc định 0 ở MVP, trần resistance 75%).
- Reaction (§15.2, đủ 8 — theo điểm mở 2 đã chốt: bật cả Conductive/Toxic/Eclipse vì dữ liệu có sẵn): sát thương = 60% ATK của unit kích hoạt, bán kính 2.0, cooldown 8s mỗi loại trên mỗi mục tiêu, tối đa 1 reaction/mục tiêu/tick (§15.4).

## 6. Khoảng trống phải quyết khi code (không chặn khởi công)

1. Bảng stat đầy đủ (MATK/MDEF/CRIT/ACC/RES) chưa có trong tài liệu — MVP Phase 4 dùng 4 stat hiện có (ATK gộp cả vật lý/l phép); bảng đầy đủ để Phase 5 kèm growth curve.
2. Bảng tương khắc từng cặp hệ (§13.1 yêu cầu cấu hình rõ từng quan hệ, cấm suy từ tên): baseline vòng khắc 6 hệ MVP Flame→Grove→Stone→Frost→Gale→Tide→Flame (khắc = 1.25, bị khắc = 0.80, còn lại 1.00); 4 hệ phụ trung tính ở MVP. Đây là điểm Tín nên duyệt mắt vì nó định hình meta.
3. Boss (§16) chưa làm ở Phase 4 — chỉ dựng combat PvE thường + elite; boss phases/telegraph để Phase 5 cùng Ancient Treant.

## 7. Thứ tự code + nghiệm thu (COM-001→016, TDD-006/007)

1. BattleState + unit runtime (HP/energy/cooldown/status list) mở rộng từ khung `BattleEngine` hiện có; step() theo thứ tự: status tick → AI chấm mục tiêu → movement/steering + separation → skill resolver → reaction check → death/victory → emit events.
2. SkillDefinition cho 60 skill trong game-data (theo §3) + validator (đúng 3 skill/loài, ultimate đúng vị trí 3).
3. BattleScene client: chạy trận từ event stream (không tự tính), nút bắt đầu trận từ encounter/đội hình 5 ô đã có ở hub; tốc độ xem ×1/×2 (§17.4 — kiểm lại mục này khi code).
4. Server: API tạo trận + validate đội hình §3.3 (sở hữu, không khóa, đủ số lượng), lưu replay (seed + đội hình + event hash).
5. Simulation batch 1.000 trận (đội ngẫu nhiên theo role/rarity): kiểm determinism (cùng seed → cùng hash), thời lượng trận trong 90–120s, tỉ lệ thắng theo rarity không lệch quá mức — xuất bảng số để Tín duyệt trước khi khóa balance.
