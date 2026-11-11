# EIDOLITH — GAME DESIGN SPECIFICATION – PART 3

## CONTENT PRODUCTION BIBLE

**Project:** Eidolith – The Forgotten Wilds
**Document:** GDS Part 3
**Version:** 1.2
**Category:** Content Design & Asset Production
**Status:** Production Specification Draft

> Tài liệu này là bản GDS Part 3 v1.2 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 40. CONTENT DESIGN OVERVIEW

### 40.1. Content Objectives

Part 3 xác định nội dung gameplay cụ thể của Eidolith.

Các nhóm nội dung:

1. Eidolon Database.
2. Element System.
3. Creature Roles.
4. Creature Evolution.
5. Skill Database.
6. Boss Database.
7. NPC Database.
8. World Encounter.
9. Item Database.
10. Asset Production.

### 40.2. Initial Content Scope

| Content | Số lượng MVP |
|---|---|
| Eidolon | 20 |
| Elements | 6 |
| Creature Roles | 6 |
| Skills | 60 |
| Evolution Branches | 15+ |
| Boss | 3 |
| NPC | 10 |
| Regions | 1 |
| Zones | 4 |
| Dungeon | 2 |
| Items | 50+ |

MVP sử dụng 6 nguyên tố trước, sau đó mở rộng lên 10 nguyên tố trong các bản cập nhật.

---

## 41. ELEMENT DATABASE

### 41.1. Element Overview

Eidolith sử dụng 10 nguyên tố.

| ID | Element | Theme | Main Effect |
|---|---|---|---|
| E01 | Flame | Lửa | Burn |
| E02 | Tide | Nước | Wet |
| E03 | Grove | Thực vật | Regeneration |
| E04 | Stone | Đất đá | Defense |
| E05 | Gale | Gió | Knockback |
| E06 | Frost | Băng | Freeze |
| E07 | Volt | Điện | Shock |
| E08 | Venom | Độc | Poison |
| E09 | Shade | Bóng tối | Weakness |
| E10 | Astral | Tinh tú | Empowerment |

### 41.2. Element Mechanics

**Flame**

- Gây sát thương.
- Thiêu đốt.
- Có thể kích hoạt phản ứng với Grove và Frost.

**Tide**

- Làm ướt.
- Hỗ trợ.
- Tăng hiệu quả một số kỹ năng Volt.

**Grove**

- Hồi phục.
- Tăng sức bền.
- Tạo vùng thực vật.

**Stone**

- Phòng thủ.
- Tạo lá chắn.
- Kiểm soát địa hình.

**Gale**

- Tốc độ.
- Đẩy lùi.
- Điều khiển vị trí.

**Frost**

- Làm chậm.
- Đóng băng.
- Khống chế.

**Volt**

- Điện giật.
- Đánh lan.
- Kích hoạt thiết bị.

**Venom**

- Độc.
- Sát thương theo thời gian.
- Suy yếu.

**Shade**

- Hút sinh lực.
- Giảm sức mạnh.
- Hiệu ứng bóng tối.

**Astral**

- Cường hóa.
- Kỹ năng đặc biệt.
- Cơ chế cộng hưởng.

### 41.3. Element Reaction

Các phản ứng nguyên tố:

| Combination | Reaction | Effect |
|---|---|---|
| Tide + Volt | Conductive Field | Điện lan trong vùng ướt |
| Flame + Grove | Wildfire | Lửa lan trên vùng thực vật |
| Flame + Frost | Thermal Burst | Sát thương và sương nhiệt |
| Grove + Venom | Toxic Bloom | Tạo vùng độc |
| Gale + Flame | Firestorm | Mở rộng vùng lửa |
| Stone + Volt | Charged Ground | Điện tích mặt đất |
| Frost + Tide | Frozen Surface | Đóng băng vùng nước |
| Shade + Astral | Eclipse | Thay đổi hiệu ứng năng lượng |

Reaction cần có thời gian hồi hoặc giới hạn kích hoạt để tránh tạo combo vô hạn.

---

## 42. CREATURE ROLE DATABASE

### 42.1. Role Definitions

| Role ID | Role | Main Function |
|---|---|---|
| R01 | Guardian | Tank |
| R02 | Striker | Melee Damage |
| R03 | Ranger | Ranged Damage |
| R04 | Support | Healing |
| R05 | Controller | Crowd Control |
| R06 | Specialist | Unique Mechanics |

### 42.2. Role Design Rules

**Guardian:** HP cao, DEF cao, khả năng bảo vệ đồng đội.

**Striker:** ATK cao, khả năng tiếp cận mục tiêu, sát thương cận chiến.

**Ranger:** Tầm đánh xa, có khả năng giữ khoảng cách, ưu tiên mục tiêu nguy hiểm.

**Support:** Hồi máu, Buff, tạo lá chắn.

**Controller:** Khống chế, làm chậm, gián đoạn kỹ năng.

**Specialist:** Cơ chế đặc biệt, kết hợp nguyên tố, tạo chiến thuật riêng.

---

## 43. EIDOLON DATABASE – INITIAL 20

### 43.1. Verdant Plains Collection

#### 01. Emberling

| Attribute | Value |
|---|---|
| ID | EID-001 |
| Element | Flame |
| Rarity | Common |
| Role | Striker |
| Habitat | Ashen Meadow |
| Evolution | Ignidrake / Cinderguard / Solarwing |

Description: Một sinh vật nhỏ có cơ thể giống kỳ giông, mang nguồn nhiệt bên trong lớp vảy.

Skills: Ember Bite, Flame Dash, Fire Burst.

Trait: Hot Blood — Tăng sức mạnh khi HP thấp.

Evolution: Ignidrake (Sát thương), Cinderguard (Phòng thủ), Solarwing (Tầm xa).

#### 02. Mossling

| Attribute | Value |
|---|---|
| ID | EID-002 |
| Element | Grove |
| Rarity | Common |
| Role | Support |
| Habitat | Whispering Forest |

Description: Sinh vật nhỏ được hình thành từ rêu và những hạt giống cổ đại.

Skills: Seed Heal, Vine Bind, Forest Blessing.

Trait: Natural Growth — Tăng hiệu quả hồi phục.

Evolution: Thornwarden, Verdant Sage.

#### 03. Aquafin

| Attribute | Value |
|---|---|
| ID | EID-003 |
| Element | Tide |
| Rarity | Common |
| Role | Ranger |
| Habitat | Crystal Lake |

Description: Sinh vật thủy sinh có vây phát sáng và khả năng phóng luồng nước áp lực cao.

Skills: Water Shot, Bubble Trap, Tidal Wave.

Trait: Fluid Body — Tăng khả năng né tránh.

Evolution: Tideray, Abyssfin.

#### 04. Pebblit

| Attribute | Value |
|---|---|
| ID | EID-004 |
| Element | Stone |
| Rarity | Common |
| Role | Guardian |
| Habitat | Meadow Village Outskirts |

Description: Sinh vật nhỏ có lớp giáp đá tự nhiên.

Skills: Stone Punch, Rock Shield, Earthquake.

Trait: Hard Shell — Giảm sát thương nhận vào.

Evolution: Granitusk, Titanolith.

#### 05. Zephy

| Attribute | Value |
|---|---|
| ID | EID-005 |
| Element | Gale |
| Rarity | Common |
| Role | Ranger |
| Habitat | Open Meadow |

Description: Sinh vật giống chim nhỏ có khả năng điều khiển những luồng gió.

Skills: Wind Peck, Air Blade, Cyclone.

Trait: Swift Wings — Tăng tốc độ hành động.

Evolution: Zephyrion, Stormcrest.

#### 06. Glowmoth

| Attribute | Value |
|---|---|
| ID | EID-006 |
| Element | Astral |
| Rarity | Uncommon |
| Role | Support |
| Habitat | Whispering Forest – Night |

Description: Sinh vật giống bướm đêm có đôi cánh chứa ánh sáng phát quang.

Skills: Starlight, Radiant Dust, Celestial Veil.

Trait: Luminous Aura — Hỗ trợ đồng đội.

Evolution: Lumivane, Astramoth.

#### 07. Thornbug

| Attribute | Value |
|---|---|
| ID | EID-007 |
| Element | Venom |
| Rarity | Uncommon |
| Role | Controller |
| Habitat | Ancient Grove |

Description: Sinh vật côn trùng có lớp giáp gai và khả năng tiết độc.

Skills: Toxic Sting, Thorn Trap, Venom Burst.

Trait: Toxic Armor — Gây độc khi bị tấn công cận chiến.

Evolution: Thorncrawler, Venomarch.

#### 08. Shadekit

| Attribute | Value |
|---|---|
| ID | EID-008 |
| Element | Shade |
| Rarity | Rare |
| Role | Striker |
| Habitat | Forgotten Ruins |

Description: Sinh vật nhỏ di chuyển trong bóng tối, có khả năng tạo bản sao ảo ảnh.

Skills: Shadow Claw, Dark Veil, Phantom Strike.

Trait: Shadow Step — Tăng khả năng né tránh.

Evolution: Noctyra, Umbrafang.

#### 09. Frostling

| Attribute | Value |
|---|---|
| ID | EID-009 |
| Element | Frost |
| Rarity | Uncommon |
| Role | Controller |
| Habitat | Frozen Cave |

Description: Sinh vật nhỏ mang lõi băng và có khả năng tạo tinh thể lạnh.

Skills: Ice Shard, Frost Bind, Crystal Storm.

Trait: Cold Core — Tăng hiệu quả khống chế.

Evolution: Glacior, Cryomantle.

#### 10. Voltik

| Attribute | Value |
|---|---|
| ID | EID-010 |
| Element | Volt |
| Rarity | Rare |
| Role | Specialist |
| Habitat | Thunder Ridge |

Description: Sinh vật có cơ thể chứa các tinh thể điện và di chuyển với tốc độ cao.

Skills: Spark Shot, Static Field, Thunder Crash.

Trait: Electric Charge — Tăng năng lượng Ultimate.

Evolution: Voltusk, Stormcore.

### 43.2. Additional Collection

**11. Rootusk** — Element: Grove. Rarity: Uncommon. Role: Guardian. Skills: Root Slam, Bark Armor, Nature Wall. Evolution: Elderroot / Worldbark.

**12. Cindermite** — Element: Flame. Rarity: Common. Role: Specialist. Skills: Ember Roll, Heat Wave, Magma Burst. Evolution: Magmabite / Infermite.

**13. Shellune** — Element: Tide. Rarity: Uncommon. Role: Guardian. Skills: Aqua Guard, Shell Bash, Ocean Barrier. Evolution: Tidalisk / Abysshell.

**14. Galesprite** — Element: Gale. Rarity: Uncommon. Role: Support. Skills: Breeze Heal, Wind Shield, Sky Dance. Evolution: Aerolume / Tempestia.

**15. Crystalhorn** — Element: Stone. Rarity: Rare. Role: Guardian. Skills: Crystal Charge, Gem Armor, Shatterquake. Evolution: Crystagorn / Obsidrake.

**16. Venomleaf** — Element: Venom. Rarity: Rare. Role: Controller. Skills: Poison Seed, Toxic Cloud, Corrupt Bloom. Evolution: Blightbloom / Vilethorn.

**17. Duskowl** — Element: Shade. Rarity: Rare. Role: Ranger. Skills: Night Arrow, Fear Gaze, Eclipse Dive. Evolution: Nocturnis / Darkwing.

**18. Starwhisp** — Element: Astral. Rarity: Epic. Role: Support. Skills: Star Pulse, Cosmic Shield, Astral Harmony. Evolution: Celestwhisp / Nebulume.

**19. Glacibear** — Element: Frost. Rarity: Epic. Role: Guardian. Skills: Ice Smash, Frozen Roar, Glacier Wall. Evolution: Frostmaw / Polar Titan.

**20. Tempestray** — Element: Volt. Rarity: Epic. Role: Striker. Skills: Lightning Dash, Thunder Claw, Tempest Nova. Evolution: Stormreaver / Thunderlord.

Lưu ý: Các tên và sinh vật trên là thiết kế IP ban đầu, cần qua vòng kiểm tra trùng lặp thương hiệu và kiểm duyệt thiết kế trước khi phát hành thương mại.

---

## 44. EVOLUTION PRODUCTION

### 44.1. Evolution Rules

Mỗi nhánh tiến hóa phải xác định:

- Evolution ID.
- Source Creature.
- Target Creature.
- Required Level.
- Required Bond.
- Required Material.
- Required Quest.
- Required Conditions.

### 44.2. Evolution Example

```
EMBERLING
│
├── IGNIDRAKE
│   └── High ATK / Striker
│
├── CINDERGUARD
│   └── High DEF / Guardian
│
└── SOLARWING
    └── Ranged / AoE
```

### 44.3. Evolution Visual Requirements

Mỗi hình thái phải có:

- Silhouette mới.
- Sprite mới.
- Idle Animation.
- Walk Animation.
- Attack Animation.
- Skill Animation.
- Ultimate Animation.
- Evolution Effect.
- Portrait.
- Collection Icon.

Không được chỉ phóng to sprite cũ và thay đổi màu sắc để tạo hình thái tiến hóa.

---

## 45. BOSS DATABASE

### 45.1. Initial Bosses

**Boss 01 – Ancient Treant**

- Region: Verdant Plains.
- Role: Area Guardian.
- Mechanics: Root Slam, Forest Barrier, Seed Summoning, Ancient Roar.
- Phase 1: Tấn công vật lý, gọi sinh vật phụ.
- Phase 2: Tạo vùng rễ cây, tăng phòng thủ.
- Phase 3: Kích hoạt Ancient Core, tấn công diện rộng.

**Boss 02 – Molten Wyrm**

- Region: Emberfall.
- Mechanics: Lava Breath, Magma Pool, Tail Sweep, Eruption.
- Boss tập trung vào vùng nguy hiểm và kiểm soát vị trí.

**Boss 03 – Frostbound Colossus**

- Region: Frostveil.
- Mechanics: Ice Hammer, Frozen Ground, Crystal Shield, Blizzard.
- Boss tập trung vào làm chậm, đóng băng và phòng thủ.

### 45.2. Boss Reward

- Boss Materials.
- Evolution Core.
- Equipment.
- Rare Items.
- Achievement.

---

## 46. NPC DATABASE

### 46.1. Main NPC

**Elder Rowan** — Hướng dẫn Wanderer, giới thiệu thế giới, cung cấp Main Quest.

**Mira** — Nghiên cứu Eidolon, giới thiệu Collection, hướng dẫn Resonance.

**Kael** — Huấn luyện chiến đấu, giới thiệu Formation, hướng dẫn Arena.

**Elara** — Quản lý Sanctuary, hướng dẫn Building, hướng dẫn Expedition.

### 46.2. Supporting NPC

Các NPC khác:

- Merchant.
- Blacksmith.
- Researcher.
- Explorer.
- Fisher.
- Guild Representative.

Mỗi NPC cần:

- NPC ID.
- Name.
- Role.
- Dialogue.
- Quest Links.
- Position.
- Sprite.
- Animation.

---

## 47. ITEM DATABASE

### 47.1. Item Categories

- Currency.
- Material.
- Evolution.
- Resonance.
- Equipment.
- Consumable.
- Quest.
- Cosmetic.

### 47.2. Initial Item List

| Item | Category | Function |
|---|---|---|
| Resonance Shard | Resonance | Thu phục |
| Greater Resonance | Resonance | Thu phục hiếm |
| Bond Essence | Material | Tăng Bond |
| Flame Core | Evolution | Tiến hóa |
| Tide Core | Evolution | Tiến hóa |
| Grove Core | Evolution | Tiến hóa |
| Stone Core | Evolution | Tiến hóa |
| Skill Manual | Material | Nâng kỹ năng |
| Ancient Crystal | Material | Nghiên cứu |
| Recovery Herb | Consumable | Hồi phục |

### 47.3. Item Configuration

Mỗi vật phẩm có:

- Item ID.
- Name.
- Category.
- Rarity.
- Description.
- Stack Limit.
- Tradeable.
- Sellable.
- Use Effect.
- Asset Icon.

---

## 48. WORLD SPAWN DATABASE

### 48.1. Spawn Configuration

Mỗi Spawn Point cần:

- Spawn ID.
- Map ID.
- Position.
- Encounter Table.
- Respawn Time.
- Spawn Radius.
- Level Range.
- Time Condition.
- Weather Condition.

### 48.2. Spawn Example

```json
{
  "spawn_id": "spawn_forest_001",
  "map_id": "whispering_forest",
  "position": {
    "x": 420,
    "y": 310
  },
  "spawn_radius": 80,
  "respawn_seconds": 180,
  "encounter_table": "forest_common",
  "level_range": {
    "min": 1,
    "max": 8
  }
}
```

Spawn phải được quản lý bằng server để hạn chế gian lận và tránh tình trạng nhiều người cùng nhận một encounter không hợp lệ.

---

## 49. ASSET PRODUCTION BIBLE

### 49.1. Creature Sprite Standards

Mỗi Eidolon cần:

| Asset | Required |
|---|---|
| Idle | Yes |
| Walk | Yes |
| Run | Optional |
| Attack | Yes |
| Skill | Yes |
| Ultimate | Yes |
| Hit | Yes |
| Defeat | Yes |
| Portrait | Yes |
| Icon | Yes |

### 49.2. Directional Animation

Sinh vật di chuyển trong thế giới isometric cần hỗ trợ 8 hướng nếu yêu cầu gameplay cần thiết.

Các hướng:

- North.
- North East.
- East.
- South East.
- South.
- South West.
- West.
- North West.

Không phải tất cả hoạt ảnh chiến đấu đều cần 8 hướng. Có thể dùng animation theo hướng mục tiêu cho từng nhóm kỹ năng.

### 49.3. Environment Assets

Mỗi Region cần:

- Ground Tiles.
- Grass.
- Trees.
- Rocks.
- Water.
- Buildings.
- Props.
- Decorations.
- Collision Objects.
- Ambient Effects.

### 49.4. UI Assets

- Creature Icons.
- Element Icons.
- Skill Icons.
- Item Icons.
- Equipment Icons.
- Status Icons.
- Currency Icons.
- Rank Icons.
- Menu Icons.
- Frame Components.

### 49.5. Asset Naming Convention

```
creature_{creature_id}_{animation}_{direction}_{frame}
```

Example:

```
creature_001_idle_south_01.png
creature_001_walk_east_01.png
creature_001_attack_north_01.png
```

---

## 50. CONTENT QUALITY CONTROL

### 50.1. Creature Review

Mỗi sinh vật phải được kiểm tra:

- Silhouette.
- Color Palette.
- Originality.
- Animation.
- Element Identity.
- Role Identity.
- Skill Identity.
- Evolution Consistency.

### 50.2. Gameplay Review

- Không có sinh vật bắt buộc cho mọi đội hình.
- Không có kỹ năng vô hạn.
- Không có combo gây mất cân bằng nghiêm trọng.
- Độ hiếm không quyết định tuyệt đối khả năng chiến thắng.
- Sinh vật Common vẫn có giá trị sử dụng.

### 50.3. Art Review

- Pixel consistency.
- Sprite readability.
- Isometric lighting.
- Animation timing.
- UI compatibility.
- Mobile readability.

---

## 51. CONTENT PRODUCTION ROADMAP

| Milestone | Deliverable |
|---|---|
| C1 | 20 Creature Designs |
| C2 | 20 Creature Sprite Sets |
| C3 | 60 Skill Designs |
| C4 | Evolution Assets |
| C5 | 3 Boss Designs |
| C6 | NPC Pack |
| C7 | Verdant Plains Tileset |
| C8 | Item & UI Icon Pack |
| C9 | Animation Integration |
| C10 | Content QA |

---

## 52. FINAL CONTENT SPECIFICATION

Eidolith sử dụng hệ thống nội dung data-driven.

Mọi sinh vật, kỹ năng, nguyên tố, vật phẩm, bản đồ và sự kiện phải có định danh riêng và có thể được quản lý độc lập.

Content Team chịu trách nhiệm thiết kế và sản xuất tài nguyên.

Game Design Team chịu trách nhiệm cơ chế, chỉ số và cân bằng.

Development Team chịu trách nhiệm tích hợp, lưu trữ và vận hành.

*END OF PART 3 — Document: Eidolith Content Production Bible, Version: 1.2, Status: Production Specification Draft.*
