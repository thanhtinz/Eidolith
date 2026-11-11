# EIDOLITH — GAME DESIGN SPECIFICATION (GDS)

**Project:** Eidolith – The Forgotten Wilds
**Document Version:** 1.0
**Date:** November 2026
**Genre:** Monster Collection Strategy RPG
**Platform:** Android / iOS
**Orientation:** Portrait 9:16
**Art Style:** 2D Pixel Art
**Camera:** Isometric
**Combat:** Auto Battle – Free Movement
**Business Model:** Free-to-Play
**Status:** Approved Design Baseline

> Tài liệu này là bản GDS v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. PROJECT OVERVIEW

### 1.1. Product Vision

Eidolith là game mobile thuộc thể loại Monster Collection Strategy RPG, kết hợp khám phá thế giới, thu thập sinh vật, huấn luyện, tiến hóa và chiến đấu chiến thuật.

Người chơi vào vai Wanderer – những người có khả năng kết nối với các sinh vật huyền bí mang tên Eidolon.

Người chơi sẽ khám phá thế giới Aetheria, thu phục Eidolon, xây dựng đội hình, phát triển Sanctuary và tham gia các hoạt động cộng đồng.

### 1.2. Core Design Pillars

1. **Exploration:** Khám phá thế giới isometric.
2. **Collection:** Thu thập và quản lý Eidolon.
3. **Strategy:** Xây dựng đội hình và chiến thuật Auto Battle.
4. **Progression:** Huấn luyện, tiến hóa và phát triển căn cứ.
5. **Multiplayer:** PvP, Guild, Trading và Co-op.

### 1.3. Product Specifications

| Hạng mục | Đặc tả |
|---|---|
| Thể loại | Monster Collection Strategy RPG |
| Nền tảng | Android, iOS |
| Màn hình | Portrait 9:16 |
| Đồ họa | 2D Pixel Art |
| Camera | Isometric |
| Exploration | Free Exploration |
| Combat | Auto Battle |
| Battlefield | Free Movement |
| Collection | Hybrid |
| Team Size | 5 Eidolon |
| Multiplayer | Online |
| Monetization | Free-to-Play |

---

## 2. WORLD & LORE

### 2.1. World Setting

Thế giới Aetheria từng được duy trì bởi Origin Core – nguồn năng lượng tạo ra sự sống và các sinh vật Eidolon.

Sau sự kiện The Great Fracture, Origin Core bị phá vỡ thành nhiều mảnh.

Thế giới bị chia cắt thành các vùng sinh thái khác nhau. Năng lượng mất ổn định khiến nhiều Eidolon biến đổi và trở nên hung bạo.

Người chơi là Wanderer, có khả năng cảm nhận và cộng hưởng với năng lượng Eidolon.

Nhiệm vụ chính là khám phá thế giới, thu thập các mảnh Origin Core và khôi phục sự cân bằng.

### 2.2. World Regions

| Region | Mô tả |
|---|---|
| Verdant Plains | Đồng cỏ, rừng và hồ nước |
| Emberfall | Núi lửa và vùng đất dung nham |
| Frostveil | Vùng băng giá |
| Hollowreach | Khu vực bị tha hóa |
| Celestia | Quần đảo trên không |

Mỗi Region bao gồm nhiều Zone, Area, Dungeon, NPC và khu vực xuất hiện Eidolon.

### 2.3. World Structure

```
AETHERIA
├── Verdant Plains
│   ├── Meadow Village
│   ├── Whispering Forest
│   ├── Crystal Lake
│   └── Ancient Grove
├── Emberfall
│   ├── Ashen Valley
│   ├── Molten Ridge
│   └── Fire Sanctum
├── Frostveil
│   ├── Snowfield
│   ├── Frozen Lake
│   └── Ice Cavern
├── Hollowreach
│   ├── Corrupted Forest
│   ├── Shadow Ruins
│   └── Abyssal Nest
└── Celestia
    ├── Floating Meadow
    ├── Starfall Temple
    └── Origin Core
```

---

## 3. CORE GAMEPLAY

### 3.1. Main Gameplay Loop

```
EXPLORE WORLD
      ↓
DISCOVER EIDOLON
      ↓
ENCOUNTER / BATTLE
      ↓
CAPTURE / COLLECT
      ↓
TRAIN / EVOLVE
      ↓
BUILD FORMATION
      ↓
EXPLORE NEW REGION
```

### 3.2. Player Character

Người chơi sở hữu một nhân vật Wanderer.

Chức năng:

- Di chuyển trong thế giới.
- Tương tác với NPC.
- Nhận nhiệm vụ.
- Thu thập tài nguyên.
- Khám phá khu vực.
- Chỉ huy đội hình Eidolon.

Nhân vật chính không trực tiếp tham gia chiến đấu trong đội hình Eidolon.

### 3.3. Character Customization

Cho phép tùy chỉnh:

- Kiểu nhân vật.
- Kiểu tóc.
- Màu tóc.
- Trang phục.
- Phụ kiện.
- Ngoại hình.
- Hiệu ứng.

### 3.4. Movement System

Hệ thống di chuyển sử dụng tọa độ thế giới riêng biệt với tọa độ hiển thị.

Yêu cầu:

- Joystick điều khiển.
- Di chuyển 8 hướng.
- Collision Detection.
- A* Pathfinding.
- Camera Follow.
- Camera Zoom.
- Obstacle Avoidance.

Đề xuất sử dụng isometric tile map 32×16 pixel.

---

## 4. WORLD EXPLORATION SYSTEM

### 4.1. Map Structure

Thế giới được tổ chức theo cấu trúc:

Region → Zone → Area → Map Objects.

Người chơi được tự do di chuyển trong khu vực đã mở khóa.

### 4.2. World Objects

| Object | Chức năng |
|---|---|
| NPC | Hội thoại và nhiệm vụ |
| Wild Eidolon | Sinh vật hoang dã |
| Resource Node | Tài nguyên |
| Treasure | Kho báu |
| Dungeon Entrance | Lối vào phụ bản |
| Boss Spawn | Điểm xuất hiện Boss |
| Portal | Di chuyển khu vực |
| Sanctuary | Căn cứ |
| Hidden Object | Vật thể bí mật |

### 4.3. Encounter System

Sinh vật xuất hiện dựa trên:

- Region.
- Zone.
- Thời gian.
- Thời tiết.
- Mùa.
- Sự kiện.
- Spawn Configuration.

Mỗi khu vực có Spawn Table riêng.

### 4.4. Environmental Interaction

Một số Eidolon có thể kích hoạt các cơ chế môi trường:

| Element | Khả năng |
|---|---|
| Flame | Đốt vật cản |
| Tide | Điều khiển nước |
| Volt | Kích hoạt thiết bị |
| Stone | Phá đá |
| Gale | Kích hoạt cơ chế gió |
| Frost | Đóng băng mặt nước |

---

## 5. EIDOLON SYSTEM

### 5.1. Creature Classification

Eidolon là các sinh vật nguyên bản của thế giới Aetheria.

Mỗi sinh vật có:

- Creature ID.
- Name.
- Element.
- Rarity.
- Role.
- Base Stats.
- Growth Rate.
- Skills.
- Evolution.
- Trait.
- Habitat.
- Lore.
- Sprite Assets.

### 5.2. Element System

Game sử dụng 10 nguyên tố:

1. Flame
2. Tide
3. Grove
4. Stone
5. Gale
6. Frost
7. Volt
8. Venom
9. Shade
10. Astral

Mỗi nguyên tố có hiệu ứng riêng. Ví dụ:

- Flame: Burn.
- Tide: Wet.
- Volt: Shock.
- Frost: Freeze.
- Venom: Poison.
- Gale: Knockback.
- Stone: Defense.
- Shade: Weakness.
- Grove: Regeneration.
- Astral: Empowerment.

### 5.3. Combat Roles

| Role | Chức năng |
|---|---|
| Guardian | Tank |
| Striker | Melee Damage |
| Ranger | Ranged Damage |
| Support | Healing / Buff |
| Controller | Crowd Control |
| Specialist | Unique Mechanics |

### 5.4. Rarity

- Common.
- Uncommon.
- Rare.
- Epic.
- Legendary.
- Mythic.

Độ hiếm không quyết định tuyệt đối sức mạnh. Cần bảo đảm sinh vật độ hiếm thấp vẫn có giá trị chiến thuật.

---

## 6. COLLECTION & CAPTURE

### 6.1. Hybrid Collection

Game sử dụng hai phương thức thu thập:

**Wild Encounter**

- Tìm thấy sinh vật trong thế giới.
- Bắt đầu tương tác hoặc chiến đấu.
- Giảm khả năng kháng cộng hưởng.
- Sử dụng Resonance Item.
- Xác định kết quả thu phục.

**Resonance Summoning**

- Triệu hồi tại Sanctum.
- Sử dụng Resonance.
- Có hệ thống tỷ lệ.
- Có Pity System.
- Có Duplicate Conversion.
- Có Shard Exchange.

### 6.2. Bond System

Bond là chỉ số liên kết giữa Wanderer và Eidolon.

Bond tăng qua:

- Chiến đấu.
- Chăm sóc.
- Nhiệm vụ cá nhân.
- Tương tác.
- Hoạt động tại Sanctuary.

Bond được sử dụng trong một số điều kiện tiến hóa và thu phục.

### 6.3. Capture Formula

```
P = CLAMP(
    P0 + BondBonus + WeatherBonus
    + ItemBonus - Resistance,
    MinimumChance,
    MaximumChance
)
```

Server là nguồn quyết định xác suất cuối cùng.

---

## 7. EVOLUTION SYSTEM

### 7.1. Evolution Stages

| Stage | Description |
|---|---|
| Origin | Hình thái ban đầu |
| Awakened | Hình thái thức tỉnh |
| Ascended | Hình thái tối thượng |

### 7.2. Branching Evolution

Một Eidolon có thể có nhiều hướng tiến hóa.

Ví dụ:

```
EMBERLING
    |
    ├── IGNIDRAKE
    |      └── Striker
    |
    ├── CINDERGUARD
    |      └── Guardian
    |
    └── SOLARWING
           └── Ranger
```

Mỗi nhánh có:

- Sprite riêng.
- Animation riêng.
- Base Stats riêng.
- Skill Set riêng.
- Role riêng.

### 7.3. Evolution Requirements

Điều kiện:

- Level.
- Bond.
- Evolution Material.
- Quest.
- Environmental Condition.
- Special Boss Requirement.

### 7.4. Additional Progression

- Level Up.
- Awakening.
- Skill Upgrade.
- Trait.
- Equipment.
- Mastery.
- Bond.

---

## 8. COMBAT SYSTEM

### 8.1. Combat Overview

Chiến đấu sử dụng Auto Battle kết hợp AI chiến thuật.

Người chơi thiết lập đội hình và chiến thuật trước trận.

Eidolon tự động:

- Di chuyển.
- Tìm mục tiêu.
- Tấn công.
- Sử dụng kỹ năng.
- Né nguy hiểm.
- Hỗ trợ đồng đội.

### 8.2. Team Formation

Đội hình tối đa 5 Eidolon.

Không bắt buộc phải sử dụng đủ các vai trò.

Người chơi có thể lựa chọn:

- 5 Striker.
- 2 Guardian + 3 Ranger.
- 1 Guardian + 2 Striker + 1 Support + 1 Controller.
- Các đội hình tùy biến khác.

### 8.3. Battlefield

Chiến trường sử dụng Free Movement.

Đặc điểm:

- Isometric Perspective.
- Navigation Grid ẩn.
- Không có ô chiến đấu cố định.
- Collision.
- Obstacles.
- Hazard Zones.
- Spawn Areas.
- Dynamic Positioning.

### 8.4. AI Behavior

| Behavior | Chức năng |
|---|---|
| Aggressive | Tấn công chủ động |
| Defensive | Giữ an toàn |
| Protect | Bảo vệ đồng đội |
| Support | Ưu tiên hỗ trợ |
| Assassin | Tìm mục tiêu yếu |
| Ranged | Giữ khoảng cách |
| Control | Khống chế |

### 8.5. Target Selection

```
TargetScore =
    ThreatWeight * Threat
  + LowHPWeight * LowHP
  + DistanceWeight * Distance
  + RoleWeight * RolePriority
```

AI chọn mục tiêu có điểm ưu tiên cao nhất.

### 8.6. Combat Statistics

| Stat | Description |
|---|---|
| HP | Health |
| ATK | Physical Attack |
| DEF | Physical Defense |
| MATK | Magic Attack |
| MDEF | Magic Defense |
| SPD | Action Speed |
| CRIT | Critical Chance |
| ACC | Accuracy |
| RES | Status Resistance |

### 8.7. Damage Formula

```
Damage =
    (ATK * SkillMultiplier)
    / (1 + DEF / 100)
    * ElementMultiplier
    * RandomFactor
```

### 8.8. Critical Damage

```
CriticalDamage = Damage * CritMultiplier
```

Giá trị mặc định đề xuất:

- Critical Rate: 5%.
- Critical Multiplier: 1.5x.

### 8.9. Action Interval

```
ActionInterval =
    BaseInterval / (1 + SPD / 100)
```

### 8.10. Ultimate System

Ultimate tự động kích hoạt khi đủ năng lượng.

Năng lượng tăng qua:

- Tấn công.
- Nhận sát thương.
- Hỗ trợ.
- Kỹ năng.

Người chơi có thể cấu hình điều kiện kích hoạt.

### 8.11. Status Effects

- Burn.
- Poison.
- Freeze.
- Stun.
- Slow.
- Root.
- Shield.
- Regen.
- Weakness.
- Silence.

Mỗi hiệu ứng phải có Duration, Stack Rules và Resistance Rules.

### 8.12. Battle Modes

- Campaign Battle.
- Wild Encounter.
- Boss Battle.
- Dungeon.
- Tower.
- Arena.
- Raid.
- Guild War.
- Survival.

---

## 9. SANCTUARY SYSTEM

Sanctuary là căn cứ cá nhân của Wanderer.

### 9.1. Buildings

| Building | Function |
|---|---|
| Habitat | Nuôi dưỡng Eidolon |
| Training Ground | Huấn luyện |
| Research Lab | Nghiên cứu |
| Evolution Shrine | Tiến hóa |
| Workshop | Chế tạo |
| Market | Giao dịch |
| Expedition Gate | Thám hiểm |
| Sanctuary Hall | Nâng cấp căn cứ |

### 9.2. Creature Activities

Eidolon có thể thực hiện các hoạt động:

- Thu thập tài nguyên.
- Hỗ trợ sản xuất.
- Thám hiểm.
- Chăm sóc căn cứ.

Mỗi hoạt động yêu cầu nguyên tố hoặc đặc tính phù hợp.

---

## 10. ECONOMY SYSTEM

### 10.1. Currency

| Currency | Function |
|---|---|
| Gold | Nâng cấp |
| Crystal | Premium |
| Bond Essence | Bond |
| Evolution Core | Evolution |
| Arena Token | PvP |
| Guild Coin | Guild |
| Research Data | Research |

### 10.2. Economy Sources

- Campaign.
- Daily Quest.
- Weekly Quest.
- Dungeon.
- Arena.
- Guild.
- Expedition.
- Achievement.
- Events.

### 10.3. Monetization

- Battle Pass.
- Cosmetic Shop.
- Monthly Card.
- Premium Currency.
- Starter Bundle.
- Event Bundle.

Không bán trực tiếp sức mạnh tuyệt đối để tránh pay-to-win.

---

## 11. MULTIPLAYER SYSTEM

### 11.1. World Multiplayer

Người chơi có thể gặp những Wanderer khác trong các khu vực chung.

Chức năng:

- World Chat.
- Party.
- Friend.
- Trading.
- World Event.
- World Boss.

### 11.2. PvP Arena

Chế độ:

- Ranked.
- Casual.
- Tournament.
- Draft.
- Async Defense.

Rank:

- Bronze.
- Silver.
- Gold.
- Platinum.
- Diamond.
- Master.
- Legend.

### 11.3. Guild

Chức năng:

- Guild Chat.
- Guild Mission.
- Guild Research.
- Guild Boss.
- Guild Shop.
- Guild Ranking.
- Guild War.

### 11.4. Trading

Cho phép trao đổi:

- Eidolon.
- Equipment.
- Materials.
- Items.

Yêu cầu:

- Transaction Safety.
- Trade Logs.
- Anti-Duplication.
- Trade Restrictions.
- Market Fees.

### 11.5. Co-op

- Raid Boss.
- Dungeon Party.
- Cooperative Expedition.
- World Event.

---

## 12. UI/UX SPECIFICATION

### 12.1. Main Screens

1. Login.
2. Server Selection.
3. Character Creation.
4. Main World.
5. World Map.
6. Collection.
7. Eidolon Details.
8. Formation.
9. Battle.
10. Battle Result.
11. Evolution.
12. Summoning.
13. Inventory.
14. Sanctuary.
15. Quest.
16. Shop.
17. Guild.
18. Arena.
19. Trading.
20. Profile.

### 12.2. Navigation

Bottom Navigation:

- Home.
- Eidolon.
- Explore.
- Arena.
- Social.

### 12.3. UI Guidelines

- Portrait 9:16.
- Touch-friendly.
- Isometric World luôn là trung tâm.
- Menu chi tiết sử dụng Full-screen Panel.
- Battle UI không che khuất nhân vật.
- Hỗ trợ nhiều tỷ lệ màn hình.
- Có thể mở rộng ngôn ngữ.

---

## 13. ART DIRECTION

### 13.1. Art Style

Modern 2D Pixel Art.

Yêu cầu:

- Silhouette rõ ràng.
- Palette màu thống nhất.
- Animation mượt nhưng giữ chất pixel.
- Không sử dụng asset không đồng bộ phong cách.

### 13.2. Asset Specifications

| Asset | Base Resolution |
|---|---|
| Small Eidolon | 64×64 |
| Large Eidolon | 96×96 |
| NPC | 48×64 |
| Tile | 16×16 hoặc 32×32 |
| UI Icon | 32×32 hoặc 64×64 |
| Boss | 128×128 trở lên |

### 13.3. Animation Requirements

Mỗi Eidolon cần:

- Idle.
- Walk.
- Run.
- Attack.
- Skill.
- Ultimate.
- Hit.
- Defeat.
- Evolution.

Những đối tượng cần di chuyển tự do có thể sử dụng animation 8 hướng.

---

## 14. TECHNICAL ARCHITECTURE

### 14.1. Technology Stack

| Component | Technology |
|---|---|
| Game Client | Phaser 3 |
| Language | TypeScript |
| Rendering | WebGL |
| Map Editor | Tiled |
| Pathfinding | A* |
| Backend | Node.js |
| API | REST |
| Realtime | WebSocket |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | S3-compatible |

### 14.2. Architecture Principles

- Client chịu trách nhiệm rendering và input.
- Server quản lý dữ liệu quan trọng.
- Battle Engine độc lập với Phaser.
- Game Data sử dụng cấu hình.
- Database có migration.
- API có versioning.
- Multiplayer sử dụng server authority.
- Replay có thể tái lập từ battle seed và action log.

### 14.3. Source Structure

```
eidolith/
├── apps/
│   ├── game-client/
│   ├── game-server/
│   ├── admin-panel/
│   └── tools/
├── packages/
│   ├── shared-types/
│   ├── game-data/
│   ├── combat-core/
│   ├── math-utils/
│   └── protocol/
├── assets/
│   ├── creatures/
│   ├── characters/
│   ├── environments/
│   ├── tilesets/
│   ├── animations/
│   ├── effects/
│   ├── ui/
│   └── audio/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schemas/
└── docs/
```

---

## 15. DATABASE SPECIFICATION

### 15.1. Account

- users
- player_profiles
- player_settings
- player_sessions
- player_progress

### 15.2. Creature

- creatures
- creature_instances
- creature_stats
- creature_skills
- creature_evolutions
- creature_traits
- creature_bonds
- creature_equipment
- creature_collection

### 15.3. World

- world_regions
- world_zones
- world_maps
- world_objects
- spawn_tables
- encounter_templates
- resource_nodes
- world_events

### 15.4. Combat

- battle_sessions
- battle_participants
- battle_teams
- battle_units
- battle_actions
- battle_results
- battle_replays

### 15.5. Economy

- inventory
- player_wallets
- currency_transactions
- items
- shops
- shop_products
- purchases
- reward_claims

### 15.6. Multiplayer

- guilds
- guild_members
- guild_messages
- player_friends
- trade_orders
- trade_logs
- pvp_ratings
- leaderboards

### 15.7. Data Management

Static Data:

- Creature.
- Skill.
- Element.
- Evolution.
- Map.
- Item.
- Spawn Table.

Dynamic Data:

- Player.
- Creature Instances.
- Wallet.
- Inventory.
- Formation.
- Quest Progress.
- Battle History.

Static Data cần version hóa và có khả năng rollback.

---

## 16. MVP SPECIFICATION

### 16.1. Initial Content

| Content | Quantity |
|---|---|
| Eidolon | 20 |
| Elements | 6 |
| Region | 1 |
| Dungeon | 2 |
| Boss | 3 |
| NPC | 10 |
| Team Size | 5 |
| Evolution | Branching |
| Combat Modes | Campaign / Boss |

### 16.2. MVP Features

- Isometric Engine.
- World Exploration.
- Character Movement.
- Collision.
- Pathfinding.
- Encounter.
- Capture.
- Summoning.
- Collection.
- Formation.
- Auto Battle.
- Evolution.
- Inventory.
- Quest.
- Sanctuary.
- Server Save.

### 16.3. Deferred Features

Chưa triển khai trong MVP:

- Guild War.
- Trading Market.
- World Boss Multiplayer.
- Large-scale Raid.
- Advanced Seasonal Events.

---

## 17. DEVELOPMENT ROADMAP

| Milestone | Workstream |
|---|---|
| M1 | Isometric Engine |
| M2 | World Exploration |
| M3 | Eidolon & Collection |
| M4 | Combat Engine |
| M5 | Evolution & Economy |
| M6 | Backend Integration |
| M7 | UI/UX & Content |
| M8 | Testing & Optimization |

Các milestone có thể được triển khai song song tùy nguồn lực đội ngũ.

---

## 18. QUALITY ASSURANCE

### 18.1. Functional Testing

- Movement.
- Collision.
- Camera.
- Map Transition.
- Encounter.
- Capture.
- Summoning.
- Collection.
- Evolution.
- Battle.
- Rewards.
- Save/Load.

### 18.2. Security Testing

- Server Authority.
- Currency Validation.
- Trade Validation.
- Anti-Duplication.
- API Rate Limiting.
- Authentication.
- Replay Validation.

### 18.3. Performance

- Kiểm soát số lượng sprite.
- Texture Atlas.
- Asset Loading.
- Object Pooling.
- Map Chunk Loading.
- Network Optimization.
- Memory Management.

---

## 19. FINAL PRODUCT DEFINITION

Eidolith là một game Monster Collection Strategy RPG màn hình dọc, sử dụng Pixel Art Isometric và thế giới có thể tự do khám phá.

Người chơi:

1. Khám phá Aetheria.
2. Tìm kiếm Eidolon.
3. Thu phục và triệu hồi.
4. Huấn luyện và tiến hóa.
5. Xây dựng đội hình chiến đấu.
6. Phát triển Sanctuary.
7. Tham gia hoạt động multiplayer.

Core Identity:

> EXPLORE THE WORLD.
> DISCOVER THE UNKNOWN.
> BUILD YOUR OWN LEGEND.

---

*END OF DOCUMENT — Eidolith Game Design Specification, Version 1.0, Status: Approved Design Baseline.*
