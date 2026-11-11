# EIDOLITH – EIDOLON COLLECTION & PROGRESSION SYSTEM

## PART 9: CAPTURE, SUMMONING, GROWTH & EVOLUTION

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** Eidolon Collection & Progression System
**Version:** 1.0
**Status:** Development Specification
**Core Feature:** Monster Collection & Progression
**Maximum Team Size:** 5 Eidolon
**Collection Model:** Hybrid Capture + Summoning

> Tài liệu này là bản Collection Part 9 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. SYSTEM OVERVIEW

### 1.1. Mục tiêu

Eidolon là trung tâm của toàn bộ gameplay EIDOLITH.

Người chơi có thể:

- Khám phá Eidolon trong thế giới.
- Bắt giữ Eidolon hoang dã.
- Triệu hồi Eidolon thông qua Resonance.
- Thu thập nhiều loài Eidolon.
- Nuôi dưỡng và tăng cấp.
- Mở khóa kỹ năng.
- Phát triển Bond.
- Mở khóa Trait.
- Trang bị vật phẩm.
- Tiến hóa nhiều nhánh.
- Xây dựng đội hình chiến đấu.
- Sưu tập các Eidolon hiếm.

Mỗi Eidolon phải có giá trị sưu tập và giá trị chiến đấu riêng.

### 1.2. Core design principles

- **Collection Diversity:** Khuyến khích người chơi sở hữu nhiều Eidolon thay vì chỉ sử dụng một đội hình duy nhất.
- **Meaningful Progression:** Mỗi hoạt động nuôi dưỡng phải mang lại tiến triển có thể cảm nhận.
- **Evolution Choices:** Tiến hóa có thể mở ra những hướng phát triển khác nhau.
- **Accessible Collection:** Người chơi có thể thu thập Eidolon qua nhiều con đường, không phụ thuộc hoàn toàn vào gacha.
- **Fair Monetization:** Không bán trực tiếp sức mạnh tuyệt đối.

---

## 2. EIDOLON DATA STRUCTURE

### 2.1. Creature identity

Mỗi Eidolon có một định danh template duy nhất.

Ví dụ:

```ts
interface EidolonDefinition {
  id: string;
  name: string;
  element: ElementType;
  rarity: Rarity;
  role: CombatRole;
  description: string;
  baseStats: BaseStats;
  growthCurveId: string;
  skillIds: string[];
  traitPool: string[];
  evolutionIds: string[];
  assetKey: string;
}
```

### 2.2. Eidolon instance

Mỗi Eidolon mà người chơi sở hữu là một cá thể riêng.

```ts
interface EidolonInstance {
  instanceId: string;
  ownerId: string;
  creatureId: string;
  nickname?: string;
  level: number;
  experience: number;
  evolutionStage: number;
  bondLevel: number;
  bondExperience: number;
  learnedSkills: string[];
  activeSkills: string[];
  traits: string[];
  equipment: string[];
  acquiredMethod: string;
  acquiredAt: string;
  isFavorite: boolean;
  isLocked: boolean;
}
```

### 2.3. Template vs Instance

| Template | Instance |
|---|---|
| Loài Eidolon | Cá thể cụ thể |
| Base stats | Chỉ số cá thể |
| Skill pool | Skill đã mở |
| Evolution branches | Nhánh đã chọn |
| Base appearance | Skin/cosmetic nếu có |
| Rarity | Acquisition history |

Không được lưu toàn bộ dữ liệu template lặp lại cho mỗi instance nếu có thể tham chiếu.

---

## 3. ELEMENT SYSTEM

10 nguyên tố chính:

| Element | Identity | Gameplay |
|---|---|---|
| Flame | Lửa | Burst damage |
| Tide | Nước | Control và hỗ trợ |
| Grove | Thiên nhiên | Healing |
| Stone | Đất đá | Defense |
| Gale | Gió | Mobility |
| Frost | Băng | Freeze |
| Volt | Điện | Shock |
| Venom | Độc | Damage over time |
| Shade | Bóng tối | Debuff |
| Astral | Tinh tú | Buff |

### 3.1. Element identity

Mỗi Eidolon có một nguyên tố chính. Một số Eidolon đặc biệt có thể có nguyên tố phụ, nhưng cần giới hạn để tránh làm phức tạp hệ thống cân bằng.

### 3.2. Element interactions

Eidolon cùng nguyên tố có thể tạo synergy. Eidolon khác nguyên tố có thể kích hoạt elemental reaction. Không nên ép người chơi sử dụng một đội hình toàn cùng nguyên tố.

---

## 4. RARITY SYSTEM

### 4.1. Rarity levels

| Rarity | Classification |
|---|---|
| Common | Phổ thông |
| Uncommon | Ít gặp |
| Rare | Hiếm |
| Epic | Rất hiếm |
| Legendary | Huyền thoại |

### 4.2. Rarity rules

Rarity phản ánh: Độ hiếm, giá trị sưu tập, mức độ khó tìm, đặc điểm thiết kế, khả năng tiếp cận.

Rarity không được quyết định toàn bộ sức mạnh. Một Eidolon Common được đầu tư đúng vẫn có thể hữu dụng trong đội hình chuyên biệt.

### 4.3. Rarity progression

Rarity của Eidolon là thuộc tính cố định của template. Không tăng rarity tùy ý thông qua level hoặc evolution, trừ khi thiết kế một cơ chế riêng có quy tắc rõ ràng.

---

## 5. EIDOLON ROLES

6 vai trò:

1. Guardian.
2. Striker.
3. Ranger.
4. Support.
5. Controller.
6. Specialist.

Mỗi Eidolon có một role chính. Một số Eidolon có thể có hybrid behavior nhưng không nên có nhiều role chính cùng lúc.

---

## 6. ACQUISITION SYSTEM

### 6.1. Acquisition methods

Có hai hệ thống chính:

- **Wild Capture:** Người chơi khám phá bản đồ và bắt Eidolon hoang dã.
- **Resonance Summoning:** Người chơi sử dụng hệ thống triệu hồi để nhận Eidolon.

Ngoài ra có thể nhận qua: Quest Rewards, Boss Rewards, Event Rewards, Achievement Rewards, Special Exchange, Exploration Discovery.

### 6.2. Acquisition history

Mỗi Eidolon instance phải ghi nhận: Method, Source, Time, Event ID nếu có, Banner ID nếu được triệu hồi.

Lịch sử này dùng cho quản lý tài sản và hỗ trợ người chơi.

---

## 7. WILD CAPTURE SYSTEM

### 7.1. Capture flow

1. Người chơi phát hiện Wild Eidolon.
2. Tiếp cận.
3. Bắt đầu encounter.
4. Chọn Capture Item.
5. Server tính xác suất.
6. Trả kết quả.
7. Nếu thành công, tạo Eidolon instance.
8. Nếu thất bại, áp dụng quy tắc encounter.

### 7.2. Capture items

| Item | Purpose |
|---|---|
| Basic Capture Orb | Bắt Eidolon thông thường |
| Advanced Capture Orb | Tăng hiệu quả |
| Rare Capture Orb | Hỗ trợ Eidolon hiếm |
| Element Capture Orb | Chuyên dụng theo nguyên tố |
| Event Capture Orb | Sự kiện |

### 7.3. Capture factors

Tỷ lệ capture có thể phụ thuộc: Wild Eidolon HP, Rarity, Level, Status effect, Capture item, Encounter bonus, Special conditions.

Công thức phải được cân bằng và công khai các hệ số có ý nghĩa với người chơi.

### 7.4. Capture result

Các kết quả: Success, Failed, Encounter Expired, Invalid Encounter.

### 7.5. Capture fairness

- Không cho client tự tính kết quả.
- Không tiêu thụ item hai lần.
- Có Idempotency-Key.
- Ghi lịch sử capture.
- Không tạo trùng Eidolon khi reconnect.

---

## 8. RESONANCE SUMMONING

### 8.1. Overview

Resonance là hệ thống triệu hồi Eidolon thông qua năng lượng tinh tú.

Người chơi có thể sử dụng: Crystal, Resonance Ticket, Event Summoning Ticket.

### 8.2. Banner types

| Banner | Purpose |
|---|---|
| Standard Resonance | Eidolon cơ bản |
| Featured Resonance | Eidolon nổi bật |
| Element Resonance | Tập trung một nguyên tố |
| Event Resonance | Nội dung giới hạn |

### 8.3. Summoning options

- Single Summon.
- 10x Summon.

### 8.4. Summoning data

Mỗi banner có: Banner ID, Available Eidolon, Rarity rates, Featured rates, Start time, End time, Pity configuration, Duplicate conversion, Guarantee rules.

### 8.5. Probability disclosure

Tỷ lệ phải hiển thị trước khi triệu hồi. Không được thay đổi tỷ lệ sau khi người chơi bắt đầu giao dịch mà không công bố và áp dụng đúng phiên bản banner.

### 8.6. Pity

Pity là cơ chế bảo đảm giúp người chơi nhận phần thưởng theo điều kiện tích lũy.

Ví dụ:

- Một mốc bảo đảm Rare hoặc cao hơn.
- Một mốc bảo đảm Epic hoặc cao hơn.
- Một mốc bảo đảm Featured Eidolon.

Các mốc cụ thể phải được cấu hình theo từng banner.

### 8.7. Duplicate summoning

Khi nhận Eidolon đã sở hữu:

- Chuyển thành Eidolon Shard.
- Cấp Bond Essence.
- Hoặc chuyển thành vật phẩm tiến triển tương ứng.

Không tự động xóa hoặc ghi đè Eidolon cũ.

### 8.8. Summoning transaction

Server thực hiện:

1. Lock wallet.
2. Kiểm tra banner.
3. Kiểm tra currency.
4. Kiểm tra pity.
5. Tạo kết quả bằng server RNG.
6. Trừ currency.
7. Tạo instance hoặc cấp duplicate reward.
8. Cập nhật pity.
9. Ghi transaction.
10. Commit.

---

## 9. LEVEL & EXPERIENCE SYSTEM

### 9.1. Level cap

MVP đề xuất:

- Eidolon level tối đa: 50.
- Player level cap được cấu hình độc lập.
- Evolution có thể mở khóa giới hạn phát triển mới trong các bản cập nhật tương lai.

Level cap phải là cấu hình data-driven.

### 9.2. EXP sources

Eidolon nhận EXP từ: Battle, Quest, Training Item, Sanctuary Activity, Special Event.

### 9.3. EXP formula

Sử dụng bảng EXP yêu cầu theo từng level.

```ts
interface LevelExperience {
  level: number;
  requiredExp: number;
  cumulativeExp: number;
}
```

Dùng bảng dữ liệu thay vì hardcode công thức riêng trong client.

### 9.4. Level-up rewards

Level up có thể: Tăng base stats, mở skill, mở điều kiện evolution, tăng power rating.

### 9.5. Level-up validation

Server kiểm tra: Current level, EXP, Level cap, Material, Instance ownership.

---

## 10. STAT GROWTH SYSTEM

### 10.1. Primary stats

| Stat | Description |
|---|---|
| HP | Sinh lực |
| ATK | Tấn công |
| DEF | Phòng thủ |
| SPD | Tốc độ |

### 10.2. Secondary stats

| Stat | Description |
|---|---|
| CRIT | Tỷ lệ chí mạng |
| CRIT_DMG | Sát thương chí mạng |
| ACC | Độ chính xác |
| RES | Kháng hiệu ứng |
| MOVE_SPEED | Tốc độ di chuyển |
| RANGE | Tầm đánh |

### 10.3. Growth curves

Mỗi Eidolon có growth curve.

Ví dụ:

```json
{
  "id": "growth_striker_standard",
  "stats": {
    "hp": 1.10,
    "atk": 1.45,
    "def": 0.90,
    "spd": 1.15
  }
}
```

Các hệ số trên là ví dụ cấu hình, cần cân bằng bằng simulation.

### 10.4. Final stat calculation

```
Final Stat =
(Base Stat
+ Level Growth
+ Evolution Bonus
+ Equipment Bonus
+ Trait Bonus)
× Buff Multiplier
```

Combat snapshot phải chứa các chỉ số đã được server tính toán tại thời điểm bắt đầu trận.

---

## 11. BOND SYSTEM

### 11.1. Overview

Bond thể hiện mối liên kết giữa Wanderer và Eidolon. Bond không chỉ là một thanh EXP phụ mà còn là hệ thống gắn kết người chơi với từng cá thể.

### 11.2. Bond activities

Battle Together, Feeding, Sanctuary Interaction, Special Quest, Bond Item, Daily Interaction.

### 11.3. Bond levels

MVP đề xuất 10 cấp Bond.

### 11.4. Bond rewards

| Milestone | Reward |
|---|---|
| Bond 1 | Basic Profile |
| Bond 2 | Small Stat Bonus |
| Bond 3 | New Dialogue |
| Bond 4 | Cosmetic Detail |
| Bond 5 | Special Trait Access |
| Bond 6 | Additional Dialogue |
| Bond 7 | Bond Animation |
| Bond 8 | Small Stat Bonus |
| Bond 9 | Special Interaction |
| Bond 10 | Signature Cosmetic |

Bond không nên tạo chênh lệch sức mạnh quá lớn giữa người chơi.

### 11.5. Bond progression

Bond EXP được tích lũy và chuyển thành cấp theo bảng cấu hình. Không cho phép một hoạt động đơn lẻ tạo ra lượng Bond EXP không giới hạn.

---

## 12. SKILL SYSTEM

### 12.1. Skill slots

Một Eidolon có: Basic Attack, Active Skill, Ultimate, Passive, Additional Skill nếu được mở khóa.

Số slot thực tế phụ thuộc thiết kế từng Eidolon.

### 12.2. Skill learning

Skill có thể mở khóa qua: Level, Evolution, Bond, Special Item, Quest, Trait.

### 12.3. Skill categories

| Category | Description |
|---|---|
| Attack | Damage |
| Defense | Defense |
| Healing | Recovery |
| Buff | Enhancement |
| Debuff | Weakening |
| Control | Crowd control |
| Summon | Summoning |
| Utility | Special behavior |

### 12.4. Skill upgrade

Skill có thể nâng cấp thông qua: Skill Material, Gold, Eidolon progression, Special Research. Nâng cấp cần giới hạn cấp và chi phí.

### 12.5. Skill configuration

Người chơi được lựa chọn kỹ năng hợp lệ trong các slot được mở. Không phải mọi skill đã học đều phải sử dụng cùng lúc.

---

## 13. TRAIT SYSTEM

### 13.1. Overview

Trait là đặc điểm bị động tạo sự khác biệt giữa các Eidolon cùng loài.

### 13.2. Trait categories

Offensive, Defensive, Support, Elemental, Exploration, Bond, Utility.

### 13.3. Trait examples

| Trait | Effect |
|---|---|
| Flame Heart | Tăng hiệu quả Flame |
| Thick Shell | Tăng DEF |
| Swift Runner | Tăng MOVE_SPEED |
| Calm Spirit | Tăng RES |
| Keen Sight | Tăng ACC |
| Wild Instinct | Tăng damage khi HP thấp |
| Gentle Soul | Tăng healing |

### 13.4. Trait acquisition

Trait có thể được nhận qua: Creature template, Level milestone, Evolution, Bond, Special training.

### 13.5. Trait restrictions

- Trait không được cộng dồn vô hạn.
- Trait xung đột phải có quy tắc.
- Một số Trait có thể bị giới hạn theo loài.
- Trait mạnh phải có chi phí hoặc điều kiện tương ứng.

---

## 14. EVOLUTION SYSTEM

### 14.1. Overview

Evolution là hệ thống thay đổi hình thái và khả năng chiến đấu của Eidolon. Một số Eidolon có thể tiến hóa theo nhiều nhánh.

### 14.2. Evolution structure

```
Base Eidolon
     |
     +---------+---------+
     |         |         |
  Branch A  Branch B  Branch C
```

### 14.3. Evolution requirements

Required Level, Bond Level, Evolution Core, Element Material, Special Quest, Research Requirement.

### 14.4. Evolution benefits

New appearance, Stat growth, New skills, New traits, New battle behavior, New interaction animation.

### 14.5. Evolution permanence

Mặc định, lựa chọn evolution là quyết định lâu dài. Có thể bổ sung Evolution Reset Item hoặc Branch Reversion trong tương lai, nhưng không nên triển khai ngay trong MVP nếu chưa xác định rõ tác động economy.

### 14.6. Evolution preview

Trước khi tiến hóa, người chơi xem: Hình dạng mới, Element, Role, Base stats, Skill changes, Trait changes, Material requirements.

### 14.7. Evolution transaction

Server kiểm tra tất cả điều kiện trong transaction. Không được trừ nguyên liệu trước khi xác nhận đủ điều kiện.

---

## 15. EQUIPMENT SYSTEM

### 15.1. Equipment categories

Weapon, Armor, Charm, Relic. Các slot chính thức có thể được tinh chỉnh trong quá trình balance.

### 15.2. Equipment attributes

HP, ATK, DEF, SPD, CRIT, RES, Element Bonus.

### 15.3. Equipment restrictions

- Một item instance chỉ trang bị cho một Eidolon.
- Item đang được trang bị phải được khóa khỏi giao dịch.
- Chuyển trang bị phải cập nhật đồng bộ.
- Một số item có thể giới hạn theo role hoặc element.

### 15.4. Equipment progression

Có thể hỗ trợ: Enhancement, Refinement, Set Bonus, Special Attribute. Không cần đưa toàn bộ vào MVP.

---

## 16. EIDOLON DUPLICATE SYSTEM

### 16.1. Duplicate rules

Nếu người chơi nhận được Eidolon đã sở hữu:

1. Kiểm tra quy tắc duplicate.
2. Cấp shard hoặc tài nguyên chuyển đổi.
3. Ghi acquisition history.
4. Không ghi đè instance cũ.

### 16.2. Shard system

Mỗi loài có thể có Shard riêng. Shard dùng để: Mở khóa Eidolon nếu được thiết kế cho phép, mở một số nâng cấp, đổi vật phẩm đặc biệt, tiến triển Bond hoặc hệ thống chuyên biệt.

### 16.3. Duplicate fairness

- Có giới hạn chuyển đổi.
- Có bảng quy đổi công khai.
- Không tạo lợi thế vô hạn từ duplicate.
- Không yêu cầu người chơi phải sở hữu quá nhiều bản sao để sử dụng Eidolon cơ bản.

---

## 17. EIDOLON COLLECTION UI

### 17.1. Collection screen

Hiển thị: Eidolon Portrait, Name, Element, Rarity, Level, Role, Ownership status.

### 17.2. Filters

Element, Rarity, Role, Level, Evolution Stage, Favorite, Owned / Not Owned.

### 17.3. Sorting

Recent Acquisition, Level, Rarity, Power, Name, Element.

### 17.4. Eidolon detail screen

Các tab:

1. Overview.
2. Stats.
3. Skills.
4. Traits.
5. Evolution.
6. Bond.
7. Equipment.
8. History.

### 17.5. Collection completion

Người chơi có thể theo dõi: Total Eidolon, Discovered, Captured, Summoned, Evolved, Element Collection, Regional Collection.

---

## 18. INITIAL EIDOLON ROSTER

MVP sử dụng 20 Eidolon đã được xác định trong Content Production Bible.

| Eidolon | Element | Rarity | Role |
|---|---|---|---|
| Emberling | Flame | Common | Striker |
| Mossling | Grove | Common | Support |
| Aquafin | Tide | Common | Ranger |
| Pebblit | Stone | Common | Guardian |
| Zephy | Gale | Common | Ranger |
| Glowmoth | Astral | Uncommon | Support |
| Thornbug | Venom | Uncommon | Controller |
| Shadekit | Shade | Rare | Striker |
| Frostling | Frost | Uncommon | Controller |
| Voltik | Volt | Rare | Specialist |
| Rootusk | Grove | Uncommon | Guardian |
| Cindermite | Flame | Common | Specialist |
| Shellune | Tide | Uncommon | Guardian |
| Galesprite | Gale | Uncommon | Support |
| Crystalhorn | Stone | Rare | Guardian |
| Venomleaf | Venom | Rare | Controller |
| Duskowl | Shade | Rare | Ranger |
| Starwhisp | Astral | Epic | Support |
| Glacibear | Frost | Epic | Guardian |
| Tempestray | Volt | Epic | Striker |

Danh sách trên là roster content ban đầu. Một số Eidolon hệ cao cấp có thể được giữ khóa cho các bản cập nhật sau.

---

## 19. PROGRESSION LOOP

### 19.1. Core loop

```
Explore World
     |
     v
Discover Eidolon
     |
     v
Capture / Summon
     |
     v
Build Collection
     |
     v
Battle & Earn EXP
     |
     v
Level Up
     |
     v
Bond & Skill Growth
     |
     v
Evolution
     |
     v
Build Stronger Team
     |
     v
Explore New Regions
```

### 19.2. Daily progression

Người chơi có thể: Hoàn thành daily quests, thu thập tài nguyên, tăng Bond, tham gia Dungeon, khám phá spawn, tham gia event.

### 19.3. Long-term progression

Thu thập toàn bộ Eidolon, mở các nhánh Evolution, hoàn thành Bond, tối ưu đội hình, sưu tập Trait, hoàn thành Regional Collection, tham gia PvP.

---

## 20. BALANCE & ECONOMY

### 20.1. Progression balance

Không nên để: Level up quá nhanh, Evolution quá dễ, Bond tăng quá chậm, Skill upgrade quá đắt, Capture quá khó, Summoning trở thành cách duy nhất để sở hữu Eidolon.

### 20.2. Acquisition balance

Wild Capture phải có giá trị thực tế. Resonance có thể cung cấp Eidolon hiếm hoặc tiện lợi hơn, nhưng không được làm mất giá trị khám phá thế giới.

### 20.3. Progression materials

Các vật phẩm chính: EXP Crystal, Bond Essence, Evolution Core, Element Fragment, Skill Manual, Trait Catalyst, Equipment Material.

### 20.4. Resource sources

| Material | Main Source |
|---|---|
| EXP Crystal | Battle, Quest |
| Bond Essence | Bond Activities |
| Evolution Core | Boss, Dungeon |
| Element Fragment | Exploration |
| Skill Manual | Dungeon, Event |
| Trait Catalyst | Research, Event |
| Equipment Material | Gathering, Dungeon |

---

## 21. ADMIN & LIVE BALANCING

Admin Panel cần hỗ trợ: Creature template, Base stats, Growth curves, Skill pool, Evolution branches, Trait pool, Capture rates, Summoning banner, Duplicate conversion, EXP table, Bond table, Progression material, Content version.

Thay đổi dữ liệu phải có audit log và version. Không được sửa trực tiếp dữ liệu instance của người chơi mà không ghi nhận lịch sử.

---

## 22. TESTING REQUIREMENTS

### 22.1. Collection tests

Capture, Summoning, Duplicate, Collection filter, Ownership, Favorite, Lock.

### 22.2. Progression tests

EXP, Level cap, Growth calculation, Bond, Skill unlock, Trait unlock, Evolution.

### 22.3. Economy tests

Material consumption, Currency deduction, Transaction rollback, Idempotency, Duplicate conversion.

### 22.4. Combat integration tests

Stat snapshot, Skill configuration, Equipment stats, Trait effects, Evolution changes, Element interaction.

---

## 23. MVP IMPLEMENTATION PRIORITY

- **Phase 1 – Collection Foundation:** Creature templates, Creature instances, Collection UI, Ownership, Favorite, Lock.
- **Phase 2 – Wild Capture:** Spawn integration, Encounter, Capture items, Capture calculation, Capture result.
- **Phase 3 – Summoning:** Banner, Rates, Pity, Single pull, 10x pull, Duplicate conversion.
- **Phase 4 – Progression:** Level, EXP, Stat growth, Bond, Skill unlock.
- **Phase 5 – Evolution:** Evolution branches, Material requirements, Preview, Evolution transaction, New appearance.
- **Phase 6 – Advanced Collection:** Traits, Equipment, Shards, Advanced filters, Collection completion.

---

## 24. ACCEPTANCE CRITERIA

| ID | Requirement |
|---|---|
| EID-001 | Có thể sở hữu nhiều Eidolon |
| EID-002 | Mỗi instance có ID riêng |
| EID-003 | Có thể bắt Wild Eidolon |
| EID-004 | Có thể Summon Eidolon |
| EID-005 | Duplicate được xử lý đúng |
| EID-006 | EXP và level hoạt động |
| EID-007 | Stat growth chính xác |
| EID-008 | Bond progression hoạt động |
| EID-009 | Skill unlock hoạt động |
| EID-010 | Trait system hoạt động |
| EID-011 | Evolution nhiều nhánh |
| EID-012 | Equipment không bị trùng quyền sở hữu |
| EID-013 | Collection UI có filter |
| EID-014 | Acquisition history được lưu |
| EID-015 | Transaction không cấp trùng tài sản |

---

## 25. FINAL SYSTEM DECISIONS

| Category | Decision |
|---|---|
| Collection Model | Hybrid Capture + Summoning |
| Initial Roster | 20 Eidolon |
| Elements | 10 |
| Roles | 6 |
| Rarity | 5 tiers |
| Team Size | 5 |
| Level Cap | 50 for MVP |
| Bond | 10 levels |
| Evolution | Multiple branches |
| Skills | Data-driven |
| Traits | Configurable |
| Equipment | Optional progression |
| Duplicate | Shard / Material Conversion |
| Authority | Server-authoritative |
| Persistence | PostgreSQL |

*END OF PART 9 – EIDOLON COLLECTION & PROGRESSION SYSTEM v1.0*
