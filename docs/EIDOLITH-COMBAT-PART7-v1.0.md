# EIDOLITH – COMBAT SYSTEM DESIGN DOCUMENT

## PART 7: AUTO BATTLE, AI, SKILLS & ELEMENTAL COMBAT

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** Combat System Design Document
**Version:** 1.0
**Status:** Development Specification
**Combat Type:** 5v5 Auto Battle
**Movement:** Free Movement
**Simulation:** Server-authoritative
**Engine:** Custom TypeScript Combat Core

> Tài liệu này là bản Combat Part 7 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. COMBAT DESIGN OVERVIEW

### 1.1. Mục tiêu thiết kế

Combat của EIDOLITH là hệ thống chiến đấu tự động, nơi người chơi tập trung vào:

- Thu thập Eidolon.
- Xây dựng đội hình.
- Lựa chọn vai trò.
- Kết hợp nguyên tố.
- Tối ưu kỹ năng.
- Khai thác tương tác giữa các Eidolon.
- Phát triển chiến thuật trước trận.

Người chơi không cần điều khiển từng đòn đánh trong thời gian thực.

Hệ thống AI sẽ tự động điều khiển di chuyển, chọn mục tiêu và sử dụng kỹ năng.

### 1.2. Combat pillars

- **Team Strategy:** Đội hình và sự kết hợp giữa 5 Eidolon quyết định phần lớn chiến thuật.
- **Elemental Synergy:** Nguyên tố có thể tạo hiệu ứng tương tác và phản ứng dây chuyền.
- **Role Diversity:** Mỗi vai trò có nhiệm vụ riêng trong đội hình.
- **Dynamic Battlefield:** Eidolon di chuyển tự do, không bị giới hạn bởi ô vuông cố định.
- **Readable Combat:** Người chơi phải hiểu được nguyên nhân thắng thua thông qua animation, combat log và replay.

---

## 2. BATTLE FORMAT

### 2.1. Battle configuration

| Property | Specification |
|---|---|
| Team Size | 5 Eidolon |
| Opponent Size | 5 Eidolon |
| Format | 5v5 |
| Duration Target | 90–120 seconds |
| Combat Type | Auto Battle |
| Movement | Free Movement |
| Skill Usage | Automatic |
| Ultimate | Automatic |
| Simulation | Server-authoritative |
| Battle Result | Server validated |

Thời gian 90–120 giây là mục tiêu cân bằng ban đầu, không phải giới hạn cứng cho mọi loại trận.

### 2.2. Battle modes

| Mode | Description |
|---|---|
| PvE | Đánh quái vật |
| Elite Encounter | Đối đầu Eidolon mạnh |
| Boss Battle | Boss có cơ chế riêng |
| Dungeon | Nhiều trận liên tiếp |
| Arena | PvP xếp hạng |
| Friendly Battle | Giao hữu |
| Guild Battle | Chiến đấu theo hoạt động guild |
| Event Battle | Sự kiện giới hạn |

### 2.3. Battle phases

Một trận đấu gồm:

1. Preparation.
2. Deployment.
3. Battle Start.
4. Combat Simulation.
5. Victory / Defeat.
6. Reward Resolution.
7. Replay Generation.

---

## 3. TEAM FORMATION

### 3.1. Team size

Mỗi đội có tối đa 5 Eidolon. Người chơi có thể tạo nhiều đội hình lưu sẵn.

### 3.2. Team slots

Đội hình gồm 5 vị trí:

| Slot | Recommended Role |
|---|---|
| Slot 1 | Guardian |
| Slot 2 | Striker |
| Slot 3 | Ranger |
| Slot 4 | Support |
| Slot 5 | Flexible |

Đây là gợi ý bố trí, không phải quy tắc bắt buộc. Người chơi được tự do sử dụng 5 Eidolon bất kỳ nếu đáp ứng điều kiện trận đấu.

### 3.3. Team validation

Server kiểm tra:

- Eidolon thuộc sở hữu người chơi.
- Không bị khóa.
- Không bị sử dụng trong một hoạt động không cho phép dùng đồng thời.
- Đúng giới hạn số lượng.
- Đạt điều kiện level hoặc power nếu chế độ có yêu cầu.
- Không chứa instance trùng lặp.

### 3.4. Team presets

Hỗ trợ: Main Team, PvE Team, Boss Team, PvP Team, Farming Team.

---

## 4. ROLE SYSTEM

EIDOLITH có 6 vai trò chính.

### 4.1. Guardian

Chức năng: Bảo vệ đội hình.

Đặc điểm: HP cao, DEF cao, có kỹ năng khiêu khích, có shield, có khả năng giảm sát thương đồng đội, ưu tiên đứng tuyến đầu.

AI behavior: Protect, Defensive, Taunt, Intercept.

### 4.2. Striker

Chức năng: Gây sát thương chính.

Đặc điểm: ATK cao, tốc độ tấn công tốt, có burst damage, có thể tập trung mục tiêu ít HP.

AI behavior: Aggressive, Assassin, Focus Target.

### 4.3. Ranger

Chức năng: Gây sát thương từ xa.

Đặc điểm: Tầm đánh xa, khả năng duy trì damage, có thể đánh nhiều mục tiêu, ưu tiên vị trí an toàn.

AI behavior: Ranged, Kiting, Priority Target.

### 4.4. Support

Chức năng: Hỗ trợ đội hình.

Đặc điểm: Hồi HP, Shield, Buff, tăng tốc độ, hỗ trợ hồi phục trạng thái.

AI behavior: Support, Protect, Healing Priority.

### 4.5. Controller

Chức năng: Kiểm soát chiến trường.

Đặc điểm: Stun, Slow, Freeze, Knockback, giảm hiệu quả chiến đấu đối phương.

AI behavior: Control, Interrupt, Group Targeting.

### 4.6. Specialist

Chức năng: Vai trò chiến thuật đặc biệt.

Đặc điểm: Summon, Trap, Counter, Stealth, Energy manipulation, Unique mechanics.

AI behavior phụ thuộc từng Eidolon.

---

## 5. BATTLEFIELD SYSTEM

### 5.1. Free Movement

Battlefield sử dụng hệ tọa độ tự do. Không có grid gameplay cố định.

Các unit có thể:

- Di chuyển đến mục tiêu.
- Tiếp cận đối phương.
- Giữ khoảng cách.
- Né vật cản.
- Tìm vị trí sử dụng skill.
- Thay đổi vị trí theo AI.

Navigation grid chỉ được dùng nội bộ cho pathfinding và collision.

### 5.2. Battlefield dimensions

Kích thước battlefield được định nghĩa theo từng chế độ.

Mỗi battlefield có: Width, Height, Boundary, Collision, Navigation, Spawn positions, Environmental objects.

### 5.3. Deployment positions

Hai đội xuất hiện tại hai khu vực đối diện nhau. Vị trí spawn có thể thay đổi theo bản đồ.

### 5.4. Collision

Collision phải xử lý: Unit collision, Wall collision, Boundary collision, Knockback collision, Skill area collision.

Không cho phép unit di chuyển xuyên tường hoặc vượt khỏi battlefield.

### 5.5. Position behavior

| Role | Default Position |
|---|---|
| Guardian | Frontline |
| Striker | Midline |
| Ranger | Backline |
| Support | Backline |
| Controller | Midline / Backline |
| Specialist | Dynamic |

AI được phép thay đổi vị trí khi chiến thuật yêu cầu.

---

## 6. COMBAT SIMULATION ENGINE

### 6.1. Simulation architecture

```
CombatEngine
├── BattleManager
├── SimulationClock
├── BattleState
├── UnitManager
├── MovementSystem
├── CollisionSystem
├── TargetSelector
├── AIController
├── SkillResolver
├── StatusEffectSystem
├── ElementSystem
├── DamageCalculator
├── CooldownSystem
├── VictoryChecker
├── EventDispatcher
└── ReplayRecorder
```

### 6.2. Fixed timestep

MVP sử dụng simulation tick 10 ticks/second.

Mỗi tick xử lý:

1. Cooldown.
2. Status duration.
3. AI decision.
4. Movement.
5. Collision.
6. Target selection.
7. Skill activation.
8. Damage calculation.
9. Status application.
10. Death processing.
11. Victory condition.
12. Event logging.

Render không phụ thuộc trực tiếp vào tốc độ simulation.

### 6.3. Battle state

```ts
interface BattleState {
  battleId: string;
  tick: number;
  elapsedMs: number;
  status: "preparing" | "running" | "completed";
  teams: BattleTeam[];
  units: BattleUnit[];
  activeEffects: ActiveEffect[];
  randomSeed: number;
  result?: BattleResult;
}
```

### 6.4. Deterministic RNG

Tất cả random trong battle phải sử dụng cùng một seeded random generator.

Không sử dụng Math.random() trực tiếp trong Combat Core.

Mục đích: Tái hiện replay, kiểm thử balance, điều tra lỗi, phát hiện bất thường.

---

## 7. UNIT SYSTEM

### 7.1. Unit attributes

| Attribute | Description |
|---|---|
| HP | Health |
| ATK | Attack |
| DEF | Defense |
| SPD | Speed |
| CRIT | Critical chance |
| CRIT_DMG | Critical damage |
| ACC | Accuracy |
| RES | Status resistance |
| RANGE | Attack range |
| MOVE_SPEED | Movement speed |

### 7.2. Runtime state

```ts
interface BattleUnit {
  unitId: string;
  creatureId: string;
  teamId: string;
  hp: number;
  maxHp: number;
  energy: number;
  position: Vector2;
  velocity: Vector2;
  state: UnitState;
  targetId?: string;
  cooldowns: Record<string, number>;
  activeEffects: ActiveEffect[];
  isAlive: boolean;
}
```

### 7.3. Unit states

```ts
type UnitState =
  | "IDLE"
  | "MOVING"
  | "APPROACHING"
  | "ATTACKING"
  | "CASTING"
  | "STUNNED"
  | "FROZEN"
  | "KNOCKBACK"
  | "DEAD";
```

State transitions phải được quản lý tập trung để tránh xung đột giữa movement, skill và status effects.

---

## 8. AI BEHAVIOR SYSTEM

### 8.1. AI architecture

Mỗi Eidolon sử dụng: Behavior Profile, Decision Rules, Target Scoring, Movement Intent, Skill Priority, Role Strategy.

AI không cần sử dụng machine learning. MVP dùng Utility AI kết hợp Finite State Machine để dễ kiểm soát và kiểm thử.

### 8.2. Behavior profiles

| Profile | Behavior |
|---|---|
| Aggressive | Tấn công liên tục |
| Defensive | Ưu tiên sống sót |
| Protect | Bảo vệ đồng đội |
| Assassin | Nhắm mục tiêu yếu |
| Ranged | Giữ khoảng cách |
| Support | Hỗ trợ đội hình |
| Control | Khống chế mục tiêu |

### 8.3. Target selection

Mỗi mục tiêu được tính điểm.

```
TargetScore =
  w1 × Threat
+ w2 × LowHP
+ w3 × Distance
+ w4 × RolePriority
+ w5 × Vulnerability
```

Giải thích:

- **Threat:** Mức độ nguy hiểm.
- **LowHP:** Mức độ yếu của mục tiêu.
- **Distance:** Khoảng cách.
- **RolePriority:** Giá trị chiến thuật của mục tiêu.
- **Vulnerability:** Khả năng bị hạ gục hoặc chịu hiệu ứng.

Trọng số khác nhau theo behavior profile.

### 8.4. Target priorities

Ví dụ:

**Assassin:** 1. Support. 2. Ranger. 3. Controller. 4. Striker. 5. Guardian.

**Guardian:** 1. Đối thủ đang tấn công đồng đội. 2. Đối thủ có Threat cao. 3. Mục tiêu gần nhất.

**Support:** 1. Đồng đội HP thấp. 2. Đồng đội đang bị khống chế. 3. Đồng đội cần buff. 4. Hỗ trợ tấn công nếu không cần hồi phục.

### 8.5. Decision interval

AI không cần tính toán lại mọi quyết định ở mỗi tick.

MVP:

- Movement update: Mỗi tick.
- Target evaluation: Mỗi 3–5 ticks hoặc khi mục tiêu thay đổi.
- Skill decision: Mỗi tick khi unit sẵn sàng hành động.
- Emergency reaction: Ngay khi có sự kiện quan trọng.

---

## 9. MOVEMENT & PATHFINDING

### 9.1. Movement system

Các phương pháp: A* Pathfinding, Steering Behavior, Separation, Obstacle Avoidance, Arrival Behavior.

### 9.2. Movement rules

- Không đi xuyên vật cản.
- Không đi ra ngoài battlefield.
- Không chồng lấn unit kéo dài.
- Ưu tiên khoảng cách phù hợp với skill.
- Có thể đổi hướng khi target thay đổi.
- Không liên tục đổi mục tiêu gây rung hoặc di chuyển vô nghĩa.

### 9.3. Ranged behavior

Ranger và Support ưu tiên: Giữ khoảng cách tấn công, tránh đứng sát Guardian đối phương, tìm vị trí có đường tấn công hợp lệ, lùi lại nếu bị Striker tiếp cận.

### 9.4. Melee behavior

Striker và Guardian ưu tiên: Tiếp cận mục tiêu, chọn hướng tiếp cận phù hợp, không tập trung tất cả unit vào một điểm nếu có thể phân bố tốt hơn.

---

## 10. SKILL SYSTEM

### 10.1. Skill categories

| Category | Description |
|---|---|
| Basic Attack | Tấn công thường |
| Active Skill | Kỹ năng chủ động |
| Ultimate | Kỹ năng tối thượng |
| Passive | Nội tại |
| Reaction Skill | Kích hoạt theo điều kiện |
| Support Skill | Hỗ trợ |
| Control Skill | Khống chế |

### 10.2. Skill definition

```ts
interface SkillDefinition {
  id: string;
  name: string;
  element: ElementType;
  category: SkillCategory;
  targetType: TargetType;
  range: number;
  cooldownMs: number;
  energyCost: number;
  damageMultiplier: number;
  effects: SkillEffect[];
  priority: number;
}
```

### 10.3. Target types

- Self.
- Single Enemy.
- Multiple Enemies.
- Single Ally.
- Multiple Allies.
- All Enemies.
- All Allies.
- Area Target.
- Lowest HP Ally.
- Highest Threat Enemy.

### 10.4. Skill execution

1. Kiểm tra unit còn sống.
2. Kiểm tra trạng thái.
3. Kiểm tra cooldown.
4. Kiểm tra energy.
5. Chọn mục tiêu.
6. Kiểm tra tầm đánh.
7. Tạo skill action.
8. Resolve hit.
9. Calculate damage.
10. Apply effects.
11. Update cooldown.
12. Emit events.

### 10.5. Skill priority

AI chọn skill theo: Skill availability, Target validity, Skill priority, Tactical situation, Resource availability, Emergency conditions.

Không bắt buộc sử dụng skill có damage cao nhất trong mọi trường hợp.

---

## 11. ENERGY & ULTIMATE SYSTEM

### 11.1. Energy

Eidolon có năng lượng dùng cho Ultimate.

Energy có thể tăng khi: Tấn công, bị tấn công, sử dụng một số skill, kích hoạt elemental reaction, nhận buff đặc biệt.

### 11.2. Energy rules

- Energy có giới hạn tối đa.
- Ultimate yêu cầu đủ energy.
- Energy không thể vượt giới hạn.
- Khi trận kết thúc, energy reset.

### 11.3. Ultimate

Ultimate có thể: Gây damage diện rộng, hồi máu, tạo shield, buff toàn đội, khống chế nhiều mục tiêu, kích hoạt elemental reaction.

Ultimate tự động sử dụng khi điều kiện phù hợp.

### 11.4. Ultimate AI conditions

Ví dụ:

- Dùng AoE khi có ít nhất 3 mục tiêu trong vùng ảnh hưởng.
- Dùng heal khi nhiều đồng đội thấp HP.
- Dùng shield trước đòn tấn công nguy hiểm.
- Dùng control khi đối phương đang chuẩn bị Ultimate.

---

## 12. DAMAGE CALCULATION

### 12.1. Base damage

```
BaseDamage =
ATK × SkillMultiplier
```

### 12.2. Defense mitigation

```
Mitigation =
1 / (1 + DEF / 100)
```

### 12.3. Final damage

```
Damage =
BaseDamage
× Mitigation
× ElementMultiplier
× CriticalMultiplier
× RandomFactor
× DamageModifiers
```

Các modifier phải được áp dụng theo một thứ tự cố định.

### 12.4. Critical

```
CriticalDamage =
Damage × CriticalMultiplier
```

Critical chance được giới hạn trong khoảng hợp lệ.

### 12.5. Damage boundaries

- Damage tối thiểu được quy định rõ.
- Damage không được vượt giới hạn số học.
- Không cho HP âm trong runtime state.
- Shield được xử lý trước HP theo quy tắc thống nhất.
- Healing không vượt Max HP trừ khi có cơ chế Overheal.

---

## 13. ELEMENT SYSTEM

EIDOLITH có 10 nguyên tố.

| Element | Identity | Primary Effect |
|---|---|---|
| Flame | Lửa | Burn |
| Tide | Nước | Wet |
| Grove | Cây cỏ | Regeneration |
| Stone | Đất đá | Defense |
| Gale | Gió | Knockback |
| Frost | Băng | Freeze |
| Volt | Điện | Shock |
| Venom | Độc | Poison |
| Shade | Bóng tối | Weakness |
| Astral | Tinh tú | Empowerment |

### 13.1. Element multiplier

MVP sử dụng hệ số tương khắc đơn giản.

| Interaction | Multiplier |
|---|---|
| Advantage | 1.25 |
| Neutral | 1.00 |
| Disadvantage | 0.80 |

Bảng tương khắc phải được cấu hình trong game data.

Không tự động áp dụng khắc hệ chỉ dựa trên tên nguyên tố; từng quan hệ phải được xác định rõ.

### 13.2. Element identity

Mỗi hệ cần có đặc trưng chiến đấu:

- **Flame:** Damage over time và burst.
- **Tide:** Làm ướt, hỗ trợ và kiểm soát.
- **Grove:** Hồi phục và sustain.
- **Stone:** Phòng thủ và chống chịu.
- **Gale:** Cơ động và đẩy lùi.
- **Frost:** Làm chậm và đóng băng.
- **Volt:** Shock và chuỗi sát thương.
- **Venom:** Poison và suy yếu.
- **Shade:** Debuff và disruption.
- **Astral:** Buff và năng lượng.

---

## 14. STATUS EFFECT SYSTEM

### 14.1. Status effects

| Effect | Description |
|---|---|
| Burn | Sát thương theo thời gian |
| Wet | Trạng thái ướt |
| Regeneration | Hồi HP theo thời gian |
| Defense Up | Tăng DEF |
| Knockback | Đẩy lùi |
| Freeze | Đóng băng |
| Shock | Làm gián đoạn hoặc giảm tốc |
| Poison | Sát thương độc |
| Weakness | Giảm sức mạnh |
| Empowerment | Tăng sức mạnh |

### 14.2. Status effect data

```ts
interface ActiveEffect {
  effectId: string;
  sourceUnitId: string;
  targetUnitId: string;
  durationTicks: number;
  stackCount: number;
  magnitude: number;
  appliedAtTick: number;
}
```

### 14.3. Stacking policy

| Effect | Policy |
|---|---|
| Burn | Add Stack, capped |
| Poison | Add Stack, capped |
| Regeneration | Refresh Duration |
| Defense Up | Replace Strongest |
| Freeze | Không cộng dồn thời lượng vô hạn |
| Shock | Refresh Duration |
| Weakness | Replace Strongest |
| Empowerment | Theo skill configuration |

### 14.4. Status resistance

RES ảnh hưởng khả năng chống lại hiệu ứng bất lợi.

Công thức đề xuất:

```
EffectiveChance =
BaseChance × (1 - Resistance)
```

Resistance được chuẩn hóa về khoảng hợp lệ và có giới hạn tối đa.

### 14.5. Control diminishing returns

Để tránh bị khống chế liên tục:

- Freeze có thời gian khống chế tối đa.
- Stun có diminishing returns.
- Boss có control resistance.
- Một số unit miễn nhiễm với hiệu ứng cụ thể.

---

## 15. ELEMENTAL REACTION SYSTEM

### 15.1. Mục tiêu

Elemental Reaction khuyến khích người chơi kết hợp các nguyên tố khác nhau.

Reaction được kích hoạt khi điều kiện của hai hoặc nhiều nguyên tố được đáp ứng trên cùng mục tiêu hoặc vùng ảnh hưởng.

### 15.2. Reaction list

| Reaction | Elements | Effect |
|---|---|---|
| Conductive Field | Tide + Volt | Lan truyền shock |
| Wildfire | Flame + Grove | Burn diện rộng |
| Thermal Burst | Flame + Frost | Burst damage |
| Toxic Bloom | Grove + Venom | Vùng độc |
| Firestorm | Gale + Flame | Tăng phạm vi lửa |
| Charged Ground | Stone + Volt | Điện trường |
| Frozen Surface | Frost + Tide | Làm chậm vùng |
| Eclipse | Shade + Astral | Debuff và giảm hiệu quả buff |

### 15.3. Reaction rules

Mỗi reaction phải định nghĩa: Trigger condition, Element requirements, Target requirements, Radius, Damage, Status effects, Cooldown, Stack policy, Boss interaction, Visual effect.

### 15.4. Reaction priority

Nếu nhiều reaction đủ điều kiện cùng lúc:

1. Kiểm tra reaction cooldown.
2. Kiểm tra điều kiện target.
3. Kiểm tra element state.
4. Ưu tiên reaction theo cấu hình.
5. Kích hoạt reaction.
6. Ghi event.
7. Áp dụng cooldown.

Không cho phép một mục tiêu kích hoạt chuỗi reaction vô hạn trong cùng tick.

### 15.5. Reaction example

Tide + Volt:

1. Tide skill áp dụng Wet.
2. Volt skill đánh vào mục tiêu Wet.
3. Conductive Field được kích hoạt.
4. Sát thương điện lan sang mục tiêu gần đó.
5. Các mục tiêu bị lan truyền có thể nhận Shock.
6. Reaction cooldown bắt đầu.

---

## 16. BOSS COMBAT SYSTEM

### 16.1. Boss characteristics

Boss có: HP cao, bộ skill riêng, Phase, Enrage, AoE attack, Special mechanic, Control resistance, Reward table.

### 16.2. Boss phases

Ví dụ:

| Phase | HP Condition | Behavior |
|---|---|---|
| Phase 1 | 100–70% | Basic attacks |
| Phase 2 | 70–40% | AoE skills |
| Phase 3 | 40–15% | Increased damage |
| Enrage | Below 15% | High pressure |

Boss phase được cấu hình theo từng boss, không bắt buộc mọi boss phải dùng cùng một mô hình.

### 16.3. Telegraph

Các đòn tấn công nguy hiểm phải có dấu hiệu báo trước: Ground marker, Target marker, Charging animation, Warning effect, Sound cue.

Người chơi cần nhận biết nguy hiểm qua hình ảnh và combat log.

### 16.4. Boss immunity

Boss có thể: Giảm thời gian Freeze, giảm hiệu quả Knockback, kháng Stun, kháng debuff, chuyển phase theo HP.

Không nên miễn nhiễm hoàn toàn mọi hiệu ứng nếu điều đó làm mất giá trị của các đội hình Control.

---

## 17. BATTLE VISUALIZATION

### 17.1. Presentation architecture

```
Combat Core
    |
Combat Events
    |
Battle Presentation
    |
Animation Controller
    |
Sprite Renderer
    |
Visual Effects
    |
Audio Effects
```

Combat Core không gọi trực tiếp animation hoặc sound effect.

### 17.2. Animation categories

Idle, Walk, Run, Basic Attack, Skill Cast, Ultimate, Hit, Knockback, Stun, Freeze, Death, Victory.

### 17.3. Combat event examples

UnitSpawned, UnitMoved, UnitTargetChanged, SkillStarted, SkillHit, DamageApplied, HealingApplied, StatusApplied, ReactionTriggered, UnitDefeated, BattleCompleted.

### 17.4. Battle speed

Hỗ trợ: 1x, 2x, 3x. Thay đổi tốc độ hiển thị không được làm thay đổi kết quả simulation.

### 17.5. Visual priorities

- Ultimate phải dễ nhận biết.
- Damage numbers không che unit.
- Status icon phải rõ.
- HP bar dễ quan sát.
- Hiệu ứng không che toàn bộ battlefield.
- Có tùy chọn giảm hiệu ứng trên thiết bị yếu.

---

## 18. VICTORY & DEFEAT CONDITIONS

### 18.1. Victory

Một đội chiến thắng khi toàn bộ unit đối phương bị đánh bại hoặc điều kiện chiến thắng riêng của chế độ được đáp ứng.

### 18.2. Defeat

Một đội thất bại khi toàn bộ unit của đội bị đánh bại.

### 18.3. Timeout

Nếu trận đấu vượt giới hạn thời gian:

- PvE: Có thể dùng HP còn lại hoặc quy tắc riêng.
- PvP: Áp dụng quy tắc phân định hòa hoặc thắng theo tiêu chí đã công bố.
- Boss: Có thể tính thất bại nếu chưa hoàn thành mục tiêu.

Không được tự động coi một đội có HP cao hơn là thắng cho mọi chế độ mà không công bố luật.

### 18.4. Rewards

Phần thưởng có thể bao gồm: EXP, Gold, Materials, Bond Essence, Quest progress, Event progress, Arena rating.

Server phải xử lý reward theo transaction và idempotency.

---

## 19. REPLAY SYSTEM

### 19.1. Replay data

Replay lưu: Battle ID, Combat version, Seed, Initial battle snapshot, Action events, Combat events hoặc dữ liệu đủ để tái tạo, Final result.

### 19.2. Replay requirements

- Tái hiện đúng trong cùng combat version.
- Không phụ thuộc asset render version.
- Có thể xem lại animation.
- Có thể tua hoặc phát lại theo khả năng client.
- Có checksum.
- Có công cụ debug.

### 19.3. Version compatibility

Replay phải lưu combat version riêng. Không dùng combat engine phiên bản mới để khẳng định replay cũ vẫn có cùng kết quả.

---

## 20. BALANCE SYSTEM

### 20.1. Balance data

Các thông số có thể điều chỉnh: Base stats, Growth curve, Skill multiplier, Cooldown, Energy gain, Element multiplier, Status duration, Reaction damage, AI weights, Boss HP, Boss damage.

### 20.2. Balance metrics

Theo dõi: Win rate theo Eidolon, Win rate theo role, Win rate theo element, Average battle duration, Average team composition, Pick rate, Ban rate nếu có hệ thống ban, Skill usage rate, Ultimate usage rate, Elemental reaction frequency, PvP rating distribution.

### 20.3. Balance rules

- Không để một Eidolon thống trị mọi chế độ.
- Không bắt buộc người chơi phải sở hữu một Eidolon cụ thể.
- Mỗi role cần có giá trị chiến thuật.
- Elemental reaction không được tạo chuỗi damage vô hạn.
- Boss phải có nhiều phương án đối phó.
- Balance cần được đánh giá bằng simulation và dữ liệu thực tế.

---

## 21. COMBAT CONFIGURATION

### 21.1. Global config

```ts
interface CombatConfig {
  tickRate: number;
  maxDurationMs: number;
  maxUnitsPerTeam: number;
  defaultCriticalMultiplier: number;
  defaultElementMultiplier: number;
  maxStatusStacks: number;
  maxControlDurationMs: number;
}
```

### 21.2. Unit configuration

Mỗi Eidolon có thể định nghĩa: Base stats, Role, Element, Behavior profile, Preferred range, Skill priority, Passive effects, AI modifiers.

### 21.3. Skill configuration

Mỗi skill có: Skill ID, Category, Target type, Range, Cooldown, Energy cost, Damage, Effect, Reaction tags, Visual asset references.

---

## 22. COMBAT TESTING

### 22.1. Unit tests

Damage formula, Critical chance, Element multiplier, Status stacking, Cooldown, Energy, Healing, Shield, Death, Victory condition.

### 22.2. AI tests

Target selection, Role priority, Guardian protection, Support healing, Ranger positioning, Assassin focus, Control skill usage.

### 22.3. Simulation tests

Chạy hàng nghìn trận tự động với các team composition khác nhau.

Mục tiêu: Phát hiện mất cân bằng, phát hiện crash, phát hiện trạng thái bất khả thi, kiểm tra replay determinism, kiểm tra hiệu năng simulation.

### 22.4. Regression tests

Mỗi thay đổi combat phải chạy lại các trận test đã lưu.

### 22.5. Required test scenarios

| Scenario | Expected |
|---|---|
| Guardian vs Striker | Damage và survival hợp lệ |
| Support low HP team | AI ưu tiên heal |
| Ranger under pressure | AI tìm khoảng cách |
| Flame + Grove | Wildfire kích hoạt đúng |
| Tide + Volt | Conductive Field đúng |
| Boss Freeze | Control resistance đúng |
| All units dead | Battle kết thúc |
| Timeout | Áp dụng đúng luật |
| Same seed | Deterministic result |

---

## 23. MVP COMBAT IMPLEMENTATION

- **Phase 1 – Core Engine:** Battle state, Fixed timestep, Seeded RNG, Unit attributes, Damage calculation, Victory condition.
- **Phase 2 – Movement:** Battlefield, Navigation, Collision, A*, Steering behavior.
- **Phase 3 – AI:** Target selection, Role profiles, Skill priority, Decision rules.
- **Phase 4 – Skill System:** Basic attack, Active skill, Ultimate, Passive, Cooldown, Energy.
- **Phase 5 – Element System:** 6 MVP elements, Element multiplier, Status effects, Initial elemental reactions.
- **Phase 6 – Boss:** Boss AI, Boss phases, Telegraph, Enrage.
- **Phase 7 – Presentation:** Battle UI, Animation events, Damage numbers, Effects, Audio, Replay viewer.
- **Phase 8 – Balance:** Simulation batch, Balance dashboard, Regression tests, PvP tuning.

---

## 24. MVP COMBAT CONTENT

MVP ban đầu sử dụng 6 nguyên tố:

- Flame.
- Tide.
- Grove.
- Stone.
- Gale.
- Frost.

Sáu hệ này được dùng để kiểm thử đầy đủ role và elemental synergy trước khi triển khai các hệ còn lại.

Đội hình ban đầu nên có: Guardian, Striker, Ranger, Support, Controller, Specialist.

MVP cần tối thiểu 20 Eidolon theo Content Production Bible, nhưng không nhất thiết phải mở toàn bộ ngay trong tutorial hoặc giai đoạn đầu của game.

---

## 25. ACCEPTANCE CRITERIA

| ID | Requirement |
|---|---|
| COM-001 | Battle 5v5 hoạt động |
| COM-002 | Free Movement hoạt động |
| COM-003 | Collision hợp lệ |
| COM-004 | AI chọn mục tiêu |
| COM-005 | AI sử dụng skill |
| COM-006 | Cooldown hoạt động |
| COM-007 | Ultimate hoạt động |
| COM-008 | Element multiplier chính xác |
| COM-009 | Status effect hoạt động |
| COM-010 | Elemental reaction hoạt động |
| COM-011 | Boss phase hoạt động |
| COM-012 | Victory/Defeat chính xác |
| COM-013 | Battle replay tái hiện được |
| COM-014 | Simulation deterministic |
| COM-015 | Server xác nhận kết quả |
| COM-016 | Combat không phụ thuộc Phaser |

---

## 26. FINAL COMBAT DECISIONS

| Category | Decision |
|---|---|
| Battle Format | 5v5 |
| Combat Style | Auto Battle |
| Movement | Free Movement |
| Team Size | 5 Eidolon |
| Roles | 6 |
| Elements | 10 |
| MVP Elements | 6 |
| Simulation | Fixed Timestep |
| Tick Rate | 10 ticks/second |
| AI | Utility AI + FSM |
| Pathfinding | A* |
| Skill System | Data-driven |
| Status System | Configurable stacking |
| Reaction System | Element combinations |
| Boss | Phase-based AI |
| Replay | Seed + Snapshot + Events |
| Authority | Server-authoritative |

*END OF PART 7 – COMBAT SYSTEM DESIGN DOCUMENT v1.0*
