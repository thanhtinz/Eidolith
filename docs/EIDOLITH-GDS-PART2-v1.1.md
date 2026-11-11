# EIDOLITH — GAME DESIGN SPECIFICATION – PART 2

## SYSTEMS & PRODUCTION SPECIFICATION

**Project:** Eidolith – The Forgotten Wilds
**Document:** GDS Part 2
**Version:** 1.1
**Platform:** Android / iOS
**Orientation:** Portrait 9:16
**Engine:** Phaser 3 + TypeScript
**Art Style:** Isometric Pixel Art

> Tài liệu này là bản GDS Part 2 v1.1 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 20. WORLD MAP PRODUCTION SPECIFICATION

### 20.1. World Map Architecture

Thế giới Aetheria được tổ chức theo ba cấp:

- **Region:** Vùng đất lớn.
- **Zone:** Khu vực thuộc Region.
- **Area:** Bản đồ gameplay cụ thể.

Ví dụ:

```
AETHERIA
│
├── VERDANT PLAINS
│   ├── Meadow Village
│   ├── Whispering Forest
│   ├── Crystal Lake
│   └── Ancient Grove
│
├── EMBERFALL
│   ├── Ashen Valley
│   ├── Molten Ridge
│   └── Fire Sanctum
│
├── FROSTVEIL
│   ├── Snowfield
│   ├── Frozen Lake
│   └── Ice Cavern
│
├── HOLLOWREACH
│   ├── Corrupted Forest
│   ├── Shadow Ruins
│   └── Abyssal Nest
│
└── CELESTIA
    ├── Floating Meadow
    ├── Starfall Temple
    └── Origin Core
```

### 20.2. World Map Navigation

Người chơi có thể mở bản đồ thế giới để:

- Xem các Region đã mở khóa.
- Xem vị trí hiện tại.
- Xem khu vực chưa khám phá.
- Xem nhiệm vụ.
- Xem Dungeon.
- Xem Boss.
- Xem điểm dịch chuyển.
- Xem sự kiện đang diễn ra.

Bản đồ thế giới không thay thế gameplay di chuyển thực tế. Người chơi vẫn phải trực tiếp khám phá các Area.

### 20.3. Area Design

Mỗi Area phải có:

| Thành phần | Yêu cầu |
|---|---|
| Environment | Chủ đề môi trường |
| Terrain | Địa hình |
| NPC | Nhân vật tương tác |
| Spawn Points | Điểm sinh vật xuất hiện |
| Resource Nodes | Điểm tài nguyên |
| Encounter Zones | Khu vực chiến đấu |
| Secrets | Khu vực bí mật |
| Exits | Lối chuyển bản đồ |

### 20.4. Verdant Plains – Starting Region

Đây là khu vực đầu tiên người chơi trải nghiệm.

**Meadow Village** — Chức năng:

- Khu vực khởi đầu.
- Hướng dẫn người chơi.
- NPC nhiệm vụ.
- Cửa hàng.
- Sanctuary Access.
- Điểm dịch chuyển.

**Whispering Forest** — Chức năng:

- Khám phá rừng.
- Thu phục Eidolon.
- Thu thập thảo dược.
- Chiến đấu với sinh vật hoang dã.

**Crystal Lake** — Chức năng:

- Sinh vật hệ Tide.
- Tài nguyên dưới nước.
- Nhiệm vụ khám phá.
- Boss phụ.

**Ancient Grove** — Chức năng:

- Khu vực nguy hiểm.
- Sinh vật hiếm.
- Ancient Boss.
- Mảnh Origin Core.

### 20.5. Map Object Specification

Mỗi object trong map cần có:

- Object ID.
- Object Type.
- Position X.
- Position Y.
- Collision.
- Interaction Range.
- Animation.
- Spawn Configuration.
- Visibility Rules.

Object phải được cấu hình bằng dữ liệu, không viết cứng trong Scene.

---

## 21. WORLD TIME & WEATHER SYSTEM

### 21.1. Day and Night

Thế giới sử dụng chu kỳ ngày và đêm.

| Thời gian | Môi trường |
|---|---|
| Morning | Buổi sáng |
| Day | Ban ngày |
| Evening | Hoàng hôn |
| Night | Ban đêm |

Thời gian có thể ảnh hưởng đến:

- Sinh vật xuất hiện.
- NPC hoạt động.
- Nhiệm vụ.
- Môi trường.
- Sự kiện.

### 21.2. Weather

Các loại thời tiết:

- Sunny.
- Rain.
- Storm.
- Snow.
- Fog.
- Wind.
- Special Weather.

### 21.3. Weather Effects

Ví dụ:

| Weather | Effect |
|---|---|
| Rain | Tăng cơ hội xuất hiện Tide |
| Storm | Xuất hiện Volt Event |
| Snow | Tăng hoạt động Frost |
| Fog | Mở encounter đặc biệt |
| Wind | Tăng hoạt động Gale |

Thời tiết không được tạo lợi thế chiến đấu quá lớn để tránh ảnh hưởng cân bằng.

---

## 22. QUEST SYSTEM

### 22.1. Quest Categories

| Quest Type | Nội dung |
|---|---|
| Main Quest | Cốt truyện chính |
| Side Quest | Nhiệm vụ phụ |
| Daily Quest | Nhiệm vụ hằng ngày |
| Weekly Quest | Nhiệm vụ hằng tuần |
| Exploration Quest | Khám phá |
| Collection Quest | Thu thập Eidolon |
| Guild Quest | Bang hội |
| Event Quest | Sự kiện |

### 22.2. Main Quest

Main Quest dẫn dắt người chơi khám phá thế giới Aetheria.

Nội dung:

- Tìm hiểu Wanderer.
- Khám phá Meadow Village.
- Gặp Eidolon đầu tiên.
- Khám phá Whispering Forest.
- Tìm hiểu Origin Core.
- Đánh bại Boss khu vực.

### 22.3. Quest Objectives

Các loại nhiệm vụ:

- Kill: Đánh bại mục tiêu.
- Collect: Thu thập vật phẩm.
- Discover: Khám phá khu vực.
- Interact: Tương tác NPC.
- Capture: Thu phục Eidolon.
- Evolve: Tiến hóa.
- Battle: Tham gia chiến đấu.
- Deliver: Giao vật phẩm.
- Escort: Hộ tống.
- Investigate: Điều tra.

### 22.4. Quest Structure

```json
{
  "id": "quest_001",
  "type": "main",
  "title": "The First Resonance",
  "region": "verdant_plains",
  "objectives": [
    {
      "type": "discover",
      "target": "whispering_forest",
      "required": 1
    },
    {
      "type": "capture",
      "target": "eid_001",
      "required": 1
    }
  ],
  "rewards": {
    "gold": 100,
    "experience": 50
  }
}
```

### 22.5. Quest Rules

- Nhiệm vụ được lưu trên server.
- Objective Progress được cập nhật khi sự kiện hợp lệ xảy ra.
- Phần thưởng chỉ được nhận một lần nếu nhiệm vụ không lặp lại.
- Daily và Weekly có chu kỳ reset riêng.
- Nhiệm vụ sự kiện có thời hạn.

---

## 23. SKILL SYSTEM

### 23.1. Skill Structure

Mỗi kỹ năng gồm:

| Field | Description |
|---|---|
| Skill ID | Định danh |
| Name | Tên kỹ năng |
| Type | Loại |
| Element | Nguyên tố |
| Target | Mục tiêu |
| Range | Phạm vi |
| Cooldown | Hồi chiêu |
| Multiplier | Hệ số |
| Effect | Hiệu ứng |
| Animation | Hoạt ảnh |
| VFX | Hiệu ứng hình ảnh |

### 23.2. Skill Types

- Basic Attack.
- Active Skill.
- Passive Skill.
- Ultimate Skill.
- Aura Skill.
- Conditional Skill.

### 23.3. Skill Target Types

- Single Enemy.
- Multiple Enemies.
- Area of Effect.
- Self.
- Single Ally.
- All Allies.
- Random Target.

### 23.4. Skill Example

```json
{
  "id": "skill_001",
  "name": "Ember Bite",
  "type": "active",
  "element": "flame",
  "target": "single_enemy",
  "range": 1.5,
  "cooldown": 5,
  "multiplier": 1.5,
  "effects": [
    {
      "type": "burn",
      "chance": 0.25,
      "duration": 3
    }
  ]
}
```

### 23.5. Skill Upgrade

Người chơi có thể nâng cấp kỹ năng bằng:

- Gold.
- Skill Material.
- Research Data.

Nâng cấp có thể cải thiện:

- Damage.
- Healing.
- Duration.
- Cooldown.
- Effect Chance.

Không phải kỹ năng nào cũng được tăng sát thương. Một số kỹ năng được nâng cấp bằng cách mở rộng phạm vi hoặc cải thiện hiệu ứng.

---

## 24. TRAIT & PASSIVE SYSTEM

### 24.1. Trait

Trait là đặc tính riêng của từng Eidolon.

Ví dụ:

| Trait | Effect |
|---|---|
| Fierce | Tăng sát thương |
| Resilient | Tăng phòng thủ |
| Swift | Tăng tốc độ |
| Focused | Tăng chính xác |
| Vital | Tăng HP |
| Adaptive | Kháng hiệu ứng |

### 24.2. Trait Rules

- Mỗi Eidolon có Trait mặc định.
- Một số Eidolon có Trait hiếm.
- Trait không được tùy ý thay đổi liên tục.
- Có thể mở khóa hoặc thay đổi Trait bằng hệ thống chuyên biệt.
- Trait phải được cân bằng theo vai trò.

---

## 25. EQUIPMENT SYSTEM

### 25.1. Equipment Categories

- Weapon.
- Armor.
- Accessory.
- Core.

Mỗi Eidolon có các vị trí trang bị được thiết kế theo loại sinh vật.

### 25.2. Equipment Rarity

- Common.
- Uncommon.
- Rare.
- Epic.
- Legendary.

### 25.3. Equipment Stats

- HP.
- ATK.
- DEF.
- MATK.
- MDEF.
- SPD.
- CRIT.
- RES.

### 25.4. Equipment Upgrade

Các chức năng:

- Enhance.
- Refine.
- Upgrade.
- Set Bonus.
- Dismantle.

Equipment không nên là nguồn sức mạnh duy nhất. Build đội hình và tương tác kỹ năng vẫn phải giữ vai trò quan trọng.

---

## 26. INVENTORY SYSTEM

### 26.1. Inventory Categories

| Category | Items |
|---|---|
| Materials | Nguyên liệu |
| Evolution | Vật phẩm tiến hóa |
| Resonance | Vật phẩm thu phục |
| Equipment | Trang bị |
| Consumables | Vật phẩm tiêu hao |
| Quest | Vật phẩm nhiệm vụ |
| Cosmetics | Trang phục |

### 26.2. Inventory Features

- Stack Items.
- Sort.
- Filter.
- Search.
- Item Details.
- Use Item.
- Sell.
- Dismantle.
- Lock Item.

### 26.3. Inventory Rules

- Giới hạn stack theo từng vật phẩm.
- Vật phẩm quan trọng không được bán nhầm.
- Item Bound không được giao dịch.
- Giao dịch phải được xác nhận.
- Mọi thay đổi vật phẩm phải được server xác thực.

---

## 27. SANCTUARY EXPANSION

### 27.1. Building Levels

Mỗi công trình có cấp độ nâng cấp.

Cấp độ công trình ảnh hưởng:

- Khả năng mở khóa.
- Sản lượng.
- Thời gian sản xuất.
- Số lượng hoạt động.
- Chức năng mới.

### 27.2. Building Functions

**Habitat**

- Chăm sóc Eidolon.
- Tăng Bond.
- Quản lý môi trường sống.

**Training Ground**

- Huấn luyện.
- Nhận kinh nghiệm.
- Phát triển Mastery.

**Research Lab**

- Nghiên cứu công nghệ.
- Mở khóa công thức.
- Nghiên cứu kỹ năng.

**Evolution Shrine**

- Tiến hóa.
- Awakening.
- Nghiên cứu Evolution Branch.

**Workshop**

- Chế tạo vật phẩm.
- Nâng cấp nguyên liệu.
- Chế tạo trang bị.

**Expedition Gate**

- Phái Eidolon thám hiểm.
- Thu thập nguyên liệu.
- Khám phá khu vực chưa mở.

### 27.3. Sanctuary Management

Người chơi có thể:

- Sắp xếp công trình.
- Trang trí.
- Mở rộng diện tích.
- Tùy chỉnh cảnh quan.
- Bố trí Eidolon.

---

## 28. EXPEDITION SYSTEM

### 28.1. Overview

Expedition cho phép người chơi cử Eidolon đi thám hiểm mà không cần trực tiếp điều khiển.

### 28.2. Expedition Rules

Mỗi chuyến thám hiểm có:

- Destination.
- Duration.
- Required Power.
- Element Requirement.
- Role Requirement.
- Reward Table.
- Risk Level.

### 28.3. Rewards

- Gold.
- Materials.
- Bond Essence.
- Evolution Materials.
- Equipment.
- Research Data.

### 28.4. Expedition Result

Kết quả dựa trên:

- Chỉ số Eidolon.
- Nguyên tố.
- Trait.
- Đội hình.
- Độ khó.
- Sự kiện.

Expedition là hoạt động bổ trợ, không thay thế khám phá trực tiếp.

---

## 29. SOCIAL SYSTEM

### 29.1. Friend System

Chức năng:

- Add Friend.
- Remove Friend.
- Friend List.
- Online Status.
- Private Message.
- Visit Sanctuary.
- Invite Party.

### 29.2. Chat System

Các kênh:

- Global.
- Region.
- Guild.
- Party.
- Private.

Yêu cầu:

- Chat Moderation.
- Anti-Spam.
- Block.
- Report.
- Rate Limit.

### 29.3. Party System

Party hỗ trợ 2–4 người.

Chức năng:

- Invite.
- Accept.
- Leave.
- Kick.
- Ready.
- Party Leader.
- Shared Dungeon.

---

## 30. DUNGEON SYSTEM

### 30.1. Dungeon Categories

- Elemental Dungeon.
- Resource Dungeon.
- Evolution Dungeon.
- Ancient Ruins.
- Challenge Dungeon.

### 30.2. Dungeon Structure

Mỗi Dungeon có:

- Entrance.
- Stages.
- Enemy Groups.
- Elite Enemies.
- Boss.
- Rewards.

### 30.3. Difficulty

- Normal.
- Hard.
- Expert.
- Nightmare.

Độ khó tăng thông qua:

- Enemy Stats.
- Enemy AI.
- Enemy Composition.
- Environmental Hazards.
- Boss Mechanics.

---

## 31. BOSS SYSTEM

### 31.1. Boss Classification

- Area Boss.
- Dungeon Boss.
- Ancient Boss.
- World Boss.
- Raid Boss.

### 31.2. Boss Mechanics

Boss có thể có:

- Multiple Phases.
- Special Attacks.
- Summoning.
- Area Damage.
- Shield.
- Enrage.
- Weakness Windows.

### 31.3. Boss Rewards

- Rare Materials.
- Evolution Core.
- Equipment.
- Achievement.
- Collection Rewards.

Boss phải có cơ chế riêng, không chỉ là quái vật có HP cao.

---

## 32. ARENA & RANKED SYSTEM

### 32.1. Arena Modes

- Ranked Arena.
- Casual Arena.
- Tournament.
- Draft Arena.
- Defense Formation.

### 32.2. Rating

Điểm xếp hạng thay đổi dựa trên:

- Đối thủ.
- Kết quả.
- Chênh lệch rating.
- Mùa giải.

### 32.3. Season

Một mùa giải kéo dài khoảng 6–8 tuần.

Kết thúc mùa:

- Reset hoặc điều chỉnh rating.
- Phát thưởng.
- Lưu lịch sử.
- Công bố bảng xếp hạng.

### 32.4. Matchmaking

Matchmaking ưu tiên:

- Rating.
- Cấp độ tiến triển.
- Chất lượng đội hình.
- Khu vực server.

Không nên ghép trận chỉ dựa trên tổng lực chiến.

---

## 33. GUILD SYSTEM

### 33.1. Guild Creation

Điều kiện:

- Đạt cấp độ tài khoản yêu cầu.
- Có phí thành lập.
- Chọn tên.
- Chọn biểu tượng.
- Viết mô tả.

### 33.2. Guild Roles

- Leader.
- Officer.
- Member.

### 33.3. Guild Features

- Guild Chat.
- Guild Mission.
- Guild Research.
- Guild Boss.
- Guild Shop.
- Guild Ranking.
- Guild War.

### 33.4. Guild Progression

Guild có cấp độ và điểm phát triển riêng.

Điểm Guild nhận từ hoạt động thành viên.

---

## 34. LIVE EVENTS

### 34.1. Event Types

- Login Event.
- Collection Event.
- Exploration Event.
- Boss Event.
- Seasonal Event.
- PvP Event.
- Community Event.

### 34.2. Event Configuration

Mỗi sự kiện phải có:

- Event ID.
- Start Time.
- End Time.
- Eligibility.
- Objectives.
- Rewards.
- Ranking Rules.
- Claim Rules.

### 34.3. Live Operations

Admin có thể:

- Kích hoạt sự kiện.
- Tắt sự kiện.
- Cập nhật phần thưởng.
- Cập nhật nhiệm vụ.
- Cập nhật Spawn Table.
- Thông báo toàn server.

---

## 35. ADMIN PANEL

### 35.1. Management Modules

| Module | Chức năng |
|---|---|
| Dashboard | Tổng quan |
| Players | Quản lý người chơi |
| Creatures | Quản lý Eidolon |
| Skills | Quản lý kỹ năng |
| Items | Quản lý vật phẩm |
| Maps | Quản lý bản đồ |
| Quests | Quản lý nhiệm vụ |
| Events | Quản lý sự kiện |
| Economy | Quản lý tiền tệ |
| Guilds | Quản lý bang hội |
| Battles | Lịch sử chiến đấu |
| Reports | Báo cáo |
| Analytics | Thống kê |

### 35.2. Content Management

Game Data nên có khả năng cập nhật từ Admin mà không cần phát hành lại toàn bộ client đối với những nội dung được thiết kế data-driven.

Các thay đổi phải có:

- Validation.
- Version.
- Audit Log.
- Publish.
- Rollback.

---

## 36. API SPECIFICATION

### 36.1. Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### 36.2. Player

```
GET    /api/v1/player/profile
PATCH  /api/v1/player/profile
GET    /api/v1/player/progress
GET    /api/v1/player/settings
```

### 36.3. Collection

```
GET    /api/v1/creatures
GET    /api/v1/collection
GET    /api/v1/collection/{id}
POST   /api/v1/collection/capture
POST   /api/v1/collection/summon
POST   /api/v1/collection/evolve
```

### 36.4. Battle

```
POST   /api/v1/battle/create
POST   /api/v1/battle/start
POST   /api/v1/battle/complete
GET    /api/v1/battle/history
GET    /api/v1/battle/replay/{id}
```

### 36.5. Inventory

```
GET    /api/v1/inventory
POST   /api/v1/inventory/use
POST   /api/v1/inventory/sell
POST   /api/v1/inventory/dismantle
```

### 36.6. Economy

```
GET    /api/v1/wallet
GET    /api/v1/wallet/transactions
GET    /api/v1/shop
POST   /api/v1/shop/purchase
```

### 36.7. Multiplayer

```
GET    /api/v1/friends
POST   /api/v1/friends/request
GET    /api/v1/guild
POST   /api/v1/guild/create
POST   /api/v1/trade/create
POST   /api/v1/trade/accept
GET    /api/v1/arena/ranking
```

Các endpoint trên là contract định hướng. Cần xác định quyền truy cập, schema request/response, idempotency và validation trước khi triển khai production.

---

## 37. SERVER OPERATIONS

### 37.1. Server Responsibilities

Server chịu trách nhiệm:

- Authentication.
- Player Data.
- Creature Ownership.
- Currency.
- Inventory.
- Battle Results.
- Capture Results.
- Trading.
- PvP Rating.
- Events.
- Rewards.

### 37.2. Server Security

- Server Authority.
- JWT Authentication.
- API Rate Limiting.
- Transaction Validation.
- Anti-Duplication.
- Audit Logs.
- Suspicious Activity Detection.

### 37.3. Data Backup

- Database Backup.
- Transaction Logs.
- Recovery Testing.
- Backup Retention.
- Disaster Recovery.

---

## 38. ACCEPTANCE CRITERIA – PART 2

Một hệ thống được xem là hoàn thành khi đáp ứng các yêu cầu sau:

| System | Acceptance Criteria |
|---|---|
| World | Khu vực tải và chuyển cảnh chính xác |
| Weather | Hiệu ứng môi trường đồng bộ |
| Quest | Objective và Reward chính xác |
| Skill | Target, Cooldown, Effect hoạt động |
| Trait | Passive Effect đúng cấu hình |
| Equipment | Stats và Upgrade chính xác |
| Inventory | Không mất hoặc nhân đôi vật phẩm |
| Sanctuary | Công trình hoạt động theo cấp |
| Expedition | Phần thưởng được xác thực |
| Social | Chat và Friend hoạt động |
| Dungeon | Hoàn thành đúng tiến trình |
| Boss | Phase và Reward chính xác |
| Arena | Matchmaking và Rating hợp lệ |
| Guild | Quyền thành viên chính xác |
| Events | Thời gian và phần thưởng đúng |
| Admin | Có thể quản lý nội dung an toàn |
| API | Authentication và Validation đầy đủ |

---

## 39. DOCUMENT STATUS

**Project:** EIDOLITH
**Document:** Game Design Specification – Part 2
**Version:** 1.1
**Status:** Design Specification Draft

Part 2 mở rộng các hệ thống gameplay và production cần thiết để chuyển Eidolith từ concept sang dự án có thể triển khai.

Các công thức, thông số và nội dung kinh tế vẫn cần được kiểm thử, cân bằng và phê duyệt trước khi đưa vào production.

*END OF PART 2*
