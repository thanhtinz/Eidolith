# EIDOLITH – TECHNICAL DESIGN DOCUMENT (TDD)

## PART 4: SYSTEM ARCHITECTURE & ENGINEERING SPECIFICATION

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** Technical Design Document
**Version:** 1.0
**Status:** Development Specification
**Platform:** Android / iOS
**Orientation:** Portrait 9:16
**Game Engine:** Phaser 3 + TypeScript
**Backend:** Node.js + TypeScript
**Database:** PostgreSQL
**Cache:** Redis
**Protocol:** REST API + WebSocket

> Tài liệu này là bản TDD Part 4 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. TECHNICAL OVERVIEW

### 1.1. Mục tiêu

Tài liệu này quy định kiến trúc và nguyên tắc triển khai kỹ thuật cho EIDOLITH.

Hệ thống cần đáp ứng:

- Chạy ổn định trên thiết bị Android và iOS.
- Hỗ trợ màn hình dọc 9:16.
- Render thế giới 2D Isometric Pixel Art.
- Hỗ trợ khám phá bản đồ và di chuyển tự do.
- Hỗ trợ Auto Battle 5 vs 5.
- Đồng bộ dữ liệu người chơi giữa các thiết bị.
- Hỗ trợ PvP, Guild, Trading và Co-op.
- Có thể mở rộng số lượng người chơi và bản đồ.
- Hạn chế gian lận trong chiến đấu và giao dịch.
- Cho phép cập nhật nội dung mà không phải phát hành lại toàn bộ ứng dụng.

### 1.2. Nguyên tắc kiến trúc

1. **Server-authoritative:** Server là nguồn dữ liệu có thẩm quyền đối với tiến trình, tài sản và kết quả gameplay.
2. **Data-driven:** Creature, skill, item, map và balance được quản lý bằng dữ liệu.
3. **Modular:** Các hệ thống phải tách biệt, hạn chế phụ thuộc chéo.
4. **Deterministic combat:** Combat simulation phải có thể tái hiện bằng cùng dữ liệu đầu vào và seed.
5. **Client presentation separated:** Logic chiến đấu không phụ thuộc vào hiệu ứng hoặc hoạt ảnh.
6. **Versioned content:** Mọi bộ dữ liệu gameplay đều có phiên bản.
7. **Mobile-first:** Ưu tiên hiệu năng và thao tác trên màn hình cảm ứng.

---

## 2. SYSTEM ARCHITECTURE

### 2.1. Tổng quan

Hệ thống được chia thành 4 tầng:

**Client Layer**

- Phaser Game Client
- UI Layer
- Input Controller
- Rendering System
- Local Cache
- Network Client

**Application Layer**

- API Gateway
- Authentication
- Player Service
- Creature Service
- Inventory Service
- Economy Service
- Quest Service
- Social Service
- World Service
- Battle Service
- Guild Service
- Trading Service

**Data Layer**

- PostgreSQL
- Redis
- Object Storage
- Event Queue

**Operations Layer**

- Admin Panel
- Monitoring
- Logging
- Analytics
- Deployment Pipeline

### 2.2. Sơ đồ kiến trúc

```
                  MOBILE CLIENT
                       |
              +--------+--------+
              |                 |
          REST API          WebSocket
              |                 |
              +--------+--------+
                       |
                  API GATEWAY
                       |
    +------------------+------------------+
    |         |         |        |        |
  Player   Creature   World   Battle   Social
  Service  Service    Service Service  Service
    |         |         |        |        |
    +---------+---------+--------+--------+
                       |
                SHARED PACKAGES
                       |
       +---------------+---------------+
       |               |               |
   PostgreSQL        Redis          Storage
       |
   Event / Job Queue
```

### 2.3. Phân chia trách nhiệm

| Thành phần | Trách nhiệm |
|---|---|
| Game Client | Hiển thị, điều khiển, nhận input |
| API Gateway | Xác thực, định tuyến request |
| World Service | Quản lý khu vực, người chơi, spawn |
| Battle Service | Tạo và mô phỏng trận đấu |
| Creature Service | Quản lý Eidolon |
| Economy Service | Tiền tệ và giao dịch |
| Social Service | Bạn bè, chat, party |
| PostgreSQL | Dữ liệu lâu dài |
| Redis | Cache và dữ liệu realtime |
| Storage | Sprite, audio, replay, tài nguyên |

**Quyết định triển khai:** Giai đoạn MVP sử dụng Modular Monolith cho backend. Các module được tách rõ ràng về mã nguồn và dữ liệu, nhưng có thể chạy chung một ứng dụng. Chỉ tách thành microservices khi có nhu cầu mở rộng thực tế.

---

## 3. SOURCE CODE ARCHITECTURE

### 3.1. Monorepo

```
eidolith/
├── apps/
│   ├── game-client/
│   │   └── src/
│   │       ├── bootstrap/
│   │       ├── scenes/
│   │       ├── entities/
│   │       ├── systems/
│   │       │   ├── world/
│   │       │   ├── navigation/
│   │       │   ├── combat/
│   │       │   ├── collection/
│   │       │   └── interaction/
│   │       ├── rendering/
│   │       ├── networking/
│   │       ├── input/
│   │       ├── ui/
│   │       ├── assets/
│   │       └── config/
│   │
│   ├── game-server/
│   │   └── src/
│   │       ├── bootstrap/
│   │       ├── modules/
│   │       ├── api/
│   │       ├── websocket/
│   │       ├── workers/
│   │       ├── database/
│   │       ├── cache/
│   │       └── config/
│   │
│   ├── admin-panel/
│   └── content-tools/
│
├── packages/
│   ├── shared-types/
│   ├── game-data/
│   ├── combat-core/
│   ├── navigation-core/
│   ├── protocol/
│   ├── validation/
│   └── math-utils/
│
├── assets/
│   ├── creatures/
│   ├── characters/
│   ├── environments/
│   ├── tilesets/
│   ├── animations/
│   ├── effects/
│   ├── ui/
│   └── audio/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── tools/
│   ├── map-validator/
│   ├── sprite-validator/
│   ├── data-validator/
│   └── replay-viewer/
│
└── docs/
    ├── GDS/
    ├── TDD/
    ├── API/
    ├── DATABASE/
    └── ART/
```

### 3.2. Quy tắc package

- **shared-types:** Kiểu dữ liệu dùng chung.
- **game-data:** Định nghĩa creature, skill, item, map.
- **combat-core:** Logic chiến đấu độc lập Phaser.
- **navigation-core:** Pathfinding và xử lý đường đi.
- **protocol:** Định nghĩa message REST và WebSocket.
- **validation:** Kiểm tra dữ liệu đầu vào.
- **math-utils:** Vector, phép tính và thuật toán chung.

Không được import trực tiếp code từ game-client vào game-server.

combat-core không được phụ thuộc vào Phaser, DOM hoặc hệ thống render.

---

## 4. GAME CLIENT – PHASER 3

### 4.1. Game configuration

- Resolution logic: 720 × 1280.
- Orientation: Portrait.
- Aspect ratio: 9:16.
- Rendering: WebGL ưu tiên, Canvas fallback.
- Pixel Art: Bật pixelArt và roundPixels.
- Scale: Phaser Scale Manager với chế độ FIT.
- UI: Responsive theo kích thước màn hình thực tế.

Các kích thước 720 × 1280 là hệ tọa độ thiết kế tham chiếu, không phải giới hạn độ phân giải thiết bị.

### 4.2. Scene architecture

| Scene | Chức năng |
|---|---|
| BootScene | Khởi tạo game |
| PreloadScene | Tải tài nguyên |
| LoginScene | Đăng nhập |
| CharacterScene | Tạo nhân vật |
| LoadingScene | Chuyển khu vực |
| WorldScene | Khám phá thế giới |
| BattleScene | Trận chiến |
| SanctuaryScene | Khu vực Sanctuary |
| DungeonScene | Phó bản |
| UIScene | UI overlay |
| SettingsScene | Cài đặt |

Các Scene không được trực tiếp xử lý logic nghiệp vụ của backend.

### 4.3. Entity architecture

Các entity chính:

- PlayerEntity
- EidolonEntity
- NPCEntity
- WildEidolonEntity
- ResourceNodeEntity
- InteractiveObjectEntity
- BossEntity

Mỗi entity có:

```ts
interface WorldEntity {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  direction: number;
  state: string;
  visible: boolean;
}
```

Entity gameplay không được phụ thuộc vào một sprite cụ thể. Rendering layer chịu trách nhiệm ánh xạ entity sang sprite, animation và effect.

---

## 5. ISOMETRIC RENDERING SYSTEM

### 5.1. Coordinate system

Game sử dụng hai hệ tọa độ:

- **World Coordinate:** Tọa độ logic trong thế giới.
- **Screen Coordinate:** Tọa độ pixel trên màn hình.

Quy ước sử dụng tile isometric hình thoi.

Với tile width là W, tile height là H, tọa độ world (x, y) được chuyển sang screen:

```ts
function worldToScreen(x: number, y: number) {
  return {
    x: (x - y) * (W / 2),
    y: (x + y) * (H / 2)
  };
}
```

Chiều ngược lại:

```ts
function screenToWorld(sx: number, sy: number) {
  return {
    x: sx / W + sy / H,
    y: sy / H - sx / W
  };
}
```

Phải áp dụng cùng một quy ước tọa độ cho map, entity, collision, input và pathfinding.

### 5.2. Depth sorting

Entity phải được render theo vị trí thực tế trên bản đồ.

Quy tắc cơ bản:

```
depth = worldX + worldY;
```

Với vật thể cao như cây, nhà hoặc cột đá, cần sử dụng object origin và sorting anchor riêng.

Không sử dụng vị trí chân của sprite để suy ra toàn bộ bounding box va chạm.

### 5.3. Camera

Camera hỗ trợ:

- Follow Player.
- Smooth Follow.
- Camera Bounds.
- Zoom.
- Screen Shake.
- Fade Transition.
- Map Transition.

Camera phải ưu tiên giữ nhân vật trong vùng trung tâm có thể quan sát, đồng thời chừa không gian cho UI phía trên và phía dưới.

### 5.4. Mobile input

Hỗ trợ:

- Tap để di chuyển.
- Virtual Joystick tùy chọn.
- Tap NPC để tương tác.
- Tap Wild Eidolon để bắt đầu encounter.
- Tap object để thu thập.
- Drag camera nếu thiết kế khu vực cho phép.

Input Controller chuyển screen coordinate thành world coordinate trước khi gửi yêu cầu di chuyển.

---

## 6. MAP PIPELINE – TILED

### 6.1. Công cụ

Sử dụng Tiled Map Editor để thiết kế bản đồ.

Mỗi map được xuất ra định dạng JSON.

### 6.2. Map layers

| Layer | Nội dung |
|---|---|
| Ground | Mặt đất |
| Ground Detail | Cỏ, đá, chi tiết nền |
| Lower Objects | Vật thể thấp |
| Collision | Khu vực không thể đi qua |
| Navigation | Dữ liệu điều hướng |
| Interactive Objects | NPC, tài nguyên, cổng |
| Spawn Points | Vị trí spawn |
| Upper Objects | Tán cây, mái nhà |
| Effects | Mưa, sương, hiệu ứng |

### 6.3. Map metadata

```ts
interface MapDefinition {
  id: string;
  name: string;
  regionId: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: string[];
  spawnPoints: SpawnPoint[];
  collisionData: string;
  navigationData: string;
  version: number;
}
```

### 6.4. Collision

Collision cần phân biệt:

- **Static Collision:** Nhà, tường, vách đá.
- **Dynamic Collision:** Cửa đóng, vật thể di chuyển.
- **Interaction Area:** Vùng tương tác.
- **Trigger Area:** Vùng kích hoạt sự kiện.

Collision logic phải độc lập với hình ảnh sprite.

### 6.5. Navigation

Sử dụng navigation grid ẩn để phục vụ pathfinding.

Grid này không phải gameplay grid. Người chơi vẫn di chuyển tự do trên bản đồ.

MVP sử dụng A* trên navigation grid. Có thể nâng cấp sang hierarchical pathfinding khi bản đồ lớn.

### 6.6. Map streaming

Chỉ tải tài nguyên cần thiết cho khu vực hiện tại và khu vực lân cận.

Khi người chơi chuyển map:

1. Kiểm tra điều kiện chuyển map.
2. Gửi yêu cầu lên World Service.
3. Server xác nhận khu vực đích.
4. Client preload tài nguyên.
5. Client chuyển scene.
6. Server đồng bộ trạng thái người chơi.
7. Giải phóng tài nguyên không còn sử dụng.

---

## 7. WORLD NETWORKING

### 7.1. Server authority

Server quản lý:

- Vị trí được xác nhận của người chơi.
- Trạng thái NPC.
- Wild Eidolon spawn.
- Resource node.
- Encounter.
- Quest progression.
- World event.
- Kết quả tương tác.

Client chỉ gửi ý định hành động, không tự xác nhận phần thưởng hoặc kết quả quan trọng.

### 7.2. Movement synchronization

Quy trình:

1. Client nhận input.
2. Client dự đoán chuyển động để tránh cảm giác trễ.
3. Client gửi movement command.
4. Server kiểm tra tốc độ, collision và giới hạn di chuyển.
5. Server cập nhật trạng thái hợp lệ.
6. Server gửi snapshot cho các client liên quan.
7. Client nội suy vị trí khi nhận snapshot.

Các trạng thái cần đồng bộ:

```ts
interface PlayerMovementState {
  playerId: string;
  x: number;
  y: number;
  direction: number;
  velocityX: number;
  velocityY: number;
  state: string;
  serverTick: number;
}
```

### 7.3. Tick rate

MVP:

- Server world simulation: 10–20 ticks/second.
- Client rendering: 60 FPS mục tiêu.
- Movement snapshot: Khoảng 5–10 lần/giây, có thể điều chỉnh theo khu vực và tải mạng.
- Chat: Event-driven, không đồng bộ theo tick.

Tick rate phải được kiểm thử trên hạ tầng thực tế trước khi khóa thông số production.

### 7.4. Zone instance

Thế giới được chia thành Zone.

Mỗi Zone có:

- Zone ID.
- Map ID.
- Player list.
- Entity list.
- Spawn state.
- Weather state.
- Event state.

MVP sử dụng instanced zones. Persistent shared world và phân vùng nhiều server được triển khai ở giai đoạn mở rộng.

### 7.5. Interest management

Server chỉ gửi dữ liệu entity cần thiết đến client.

Mỗi người chơi có một vùng quan sát (Area of Interest – AOI).

Khi entity đi vào AOI:

- Gửi entity spawn state.

Khi entity rời AOI:

- Gửi entity despawn event.

Mục tiêu là hạn chế payload mạng và số lượng entity client phải render.

### 7.6. Reconnect

Khi mất kết nối:

1. Client giữ trạng thái UI an toàn.
2. Client thử kết nối lại.
3. Server xác thực session.
4. Server gửi snapshot mới nhất.
5. Client cập nhật entity và UI.
6. Các hành động đã hoàn tất không được thực hiện lần thứ hai.

---

## 8. COMBAT ENGINE

### 8.1. Architecture

Combat Engine nằm trong package combat-core.

Không sử dụng Phaser để xử lý damage, AI, skill hoặc kết quả trận đấu.

```
Combat Engine
├── Simulation
├── Battle State
├── Unit Controller
├── Movement
├── Target Selection
├── AI
├── Skill Resolver
├── Status Effect
├── Element System
├── Damage Calculator
├── Event Log
└── Replay
```

### 8.2. Fixed timestep

Combat simulation sử dụng fixed timestep.

MVP đề xuất 10 simulation ticks/second.

Mỗi tick thực hiện:

1. Update unit state.
2. Update cooldown.
3. Update status effect.
4. Update AI decision.
5. Resolve movement.
6. Resolve target.
7. Resolve skill.
8. Calculate damage.
9. Check death.
10. Emit combat events.

Render animation chạy độc lập với simulation tick.

### 8.3. Deterministic simulation

Mỗi trận có:

- Battle ID.
- Combat version.
- Seed.
- Initial team state.
- Battle configuration.
- Action timeline.

Random phải sử dụng seeded random generator.

```ts
interface BattleConfig {
  battleId: string;
  seed: number;
  combatVersion: string;
  maxDuration: number;
  tickRate: number;
}
```

Cùng một battle configuration và cùng một seed phải tạo ra kết quả simulation giống nhau trong cùng phiên bản combat engine.

### 8.4. Unit state

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

### 8.5. AI behavior

Mỗi Eidolon có behavior profile.

- Aggressive
- Defensive
- Protect
- Support
- Assassin
- Ranged
- Control

AI sử dụng utility scoring để lựa chọn mục tiêu:

```
Score(target) =
  w1 * Threat
  + w2 * LowHP
  + w3 * Distance
  + w4 * RolePriority
```

Các trọng số được quản lý bằng game data, không hardcode riêng cho từng creature.

### 8.6. Movement

- Sử dụng navigation/pathfinding trong battlefield.
- Không cho các unit chồng lấn không hợp lệ.
- Có thể sử dụng steering behavior để tránh va chạm.
- Ưu tiên di chuyển đến khoảng cách phù hợp với skill.
- Skill có thể có phạm vi, hướng và vùng ảnh hưởng riêng.

### 8.7. Skill resolver

Một skill được chia thành các thành phần:

```ts
interface SkillDefinition {
  id: string;
  name: string;
  element: string;
  type: string;
  range: number;
  cooldown: number;
  multiplier: number;
  targetType: string;
  effects: SkillEffect[];
}
```

Skill Resolver chịu trách nhiệm:

- Kiểm tra điều kiện sử dụng.
- Chọn mục tiêu.
- Kiểm tra tầm đánh.
- Tính sát thương.
- Áp dụng hiệu ứng.
- Tạo combat event.

### 8.8. Status effect

Mỗi status effect cần có:

- Effect ID.
- Duration.
- Stack limit.
- Stack policy.
- Tick interval.
- Source unit.
- Effect value.

Các stacking policy:

- Refresh Duration.
- Add Stack.
- Replace Strongest.
- Independent Stack.

Ví dụ:

| Effect | Stacking |
|---|---|
| Burn | Add Stack, có giới hạn |
| Poison | Add Stack, có giới hạn |
| Regeneration | Refresh Duration |
| Freeze | Không cộng dồn thời lượng tùy ý |
| Shock | Refresh Duration |
| Weakness | Replace Strongest |

### 8.9. Damage formula

Công thức nền tảng:

```
Damage =
(ATK × SkillMultiplier)
÷ (1 + DEF / 100)
× ElementMultiplier
× RandomFactor
```

Sau đó xử lý Critical, Shield, Damage Reduction và các modifier khác theo thứ tự thống nhất.

Tất cả phép tính combat phải có quy tắc rounding cố định để đảm bảo replay nhất quán.

### 8.10. Battle replay

Replay lưu:

- Battle configuration.
- Seed.
- Combat version.
- Initial unit state.
- Input/action events.
- Result.
- Event timeline.

Không cần lưu mọi frame hình ảnh.

Client có thể phát lại trận đấu bằng cách chạy lại simulation và sử dụng combat events để hiển thị animation.

---

## 9. DATA PIPELINE

### 9.1. Data-driven design

Các nội dung gameplay phải được định nghĩa bằng data:

- Eidolon.
- Skill.
- Trait.
- Evolution.
- Item.
- Equipment.
- Quest.
- Spawn table.
- Encounter.
- Boss.
- Dungeon.
- Event.

Không tạo logic riêng trong code cho từng Eidolon nếu có thể biểu diễn bằng cấu hình chung.

### 9.2. Data format

MVP có thể sử dụng JSON hoặc TypeScript definitions.

Ví dụ:

```json
{
  "id": "eidolon_emberling",
  "name": "Emberling",
  "element": "flame",
  "rarity": "common",
  "role": "striker",
  "baseStats": {
    "hp": 100,
    "atk": 25,
    "def": 10,
    "spd": 15
  },
  "skills": [
    "skill_flame_bite",
    "skill_ember_burst"
  ]
}
```

### 9.3. Validation

Content Validator phải kiểm tra:

- ID không trùng.
- Reference hợp lệ.
- Skill tồn tại.
- Evolution target tồn tại.
- Sprite asset tồn tại.
- Giá trị stat nằm trong giới hạn.
- Không có vòng lặp evolution không hợp lệ.
- Không có map spawn reference bị thiếu.

### 9.4. Versioning

Mỗi data package có:

- Version.
- Build ID.
- Created timestamp.
- Compatibility version.
- Checksum.

Client phải kiểm tra compatibility trước khi tải nội dung mới.

### 9.5. Remote content

Các nội dung có thể cập nhật từ server:

- Balance.
- Event configuration.
- Shop catalog.
- Spawn rates.
- Quest configuration.
- Summoning rates.
- Feature flags.

Thay đổi cấu trúc dữ liệu hoặc logic simulation cần kiểm soát phiên bản riêng, không chỉ cập nhật JSON.

---

## 10. BACKEND SERVICE SPECIFICATION

### 10.1. Authentication Service

Chức năng:

- Register.
- Login.
- Logout.
- Refresh Token.
- Device Session.
- Password Reset.
- Account Recovery.

Dùng access token ngắn hạn và refresh token có cơ chế thu hồi.

Không lưu password dạng plain text.

### 10.2. Player Service

- Player Profile.
- Character Data.
- Player Progress.
- Player Settings.
- Player Statistics.
- Account Binding.

### 10.3. Creature Service

- Creature Collection.
- Creature Details.
- Level Up.
- Evolution.
- Skill Management.
- Trait Management.
- Equipment Assignment.
- Bond Progression.

### 10.4. World Service

- Enter Zone.
- Leave Zone.
- Movement.
- NPC Interaction.
- Wild Encounter.
- Resource Gathering.
- World Events.
- Map Transition.

### 10.5. Battle Service

- Create Battle.
- Join Battle.
- Validate Team.
- Start Simulation.
- Resolve Battle.
- Save Result.
- Generate Replay.

### 10.6. Economy Service

- Wallet.
- Currency Transaction.
- Shop Purchase.
- Reward Claim.
- Summoning.
- Trading.
- Refund Handling.

Tất cả thao tác thay đổi tài sản phải chạy trong transaction phù hợp.

---

## 11. API SPECIFICATION

### 11.1. REST API

Base path: `/api/v1`

Các endpoint chính:

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập |
| POST | /auth/refresh | Refresh token |
| GET | /player/me | Hồ sơ |
| GET | /player/progress | Tiến trình |
| GET | /creatures | Danh sách Eidolon |
| GET | /creatures/:id | Chi tiết Eidolon |
| POST | /creatures/:id/level-up | Tăng cấp |
| POST | /creatures/:id/evolve | Tiến hóa |
| GET | /inventory | Túi đồ |
| GET | /world/maps | Danh sách bản đồ |
| POST | /world/enter | Vào bản đồ |
| POST | /battle/create | Tạo trận |
| GET | /battle/:id/replay | Xem replay |
| GET | /shop/catalog | Danh sách cửa hàng |
| POST | /shop/purchase | Mua vật phẩm |

### 11.2. Response format

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "req_123"
}
```

Khi lỗi:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_CURRENCY",
    "message": "Not enough currency"
  },
  "requestId": "req_124"
}
```

### 11.3. Idempotency

Các request có thể tạo ra giao dịch hoặc phần thưởng phải hỗ trợ idempotency.

Ví dụ:

- Mua vật phẩm.
- Summoning.
- Claim quest reward.
- Claim event reward.
- Evolution.
- Trading.

Client gửi Idempotency-Key; server kiểm tra để tránh xử lý trùng khi người chơi bấm nhiều lần hoặc reconnect.

---

## 12. WEBSOCKET PROTOCOL

### 12.1. Connection

Endpoint: `wss://game.example.com/ws`

Xác thực session trước khi cho phép tham gia zone.

### 12.2. Message structure

```ts
interface GameMessage {
  type: string;
  requestId?: string;
  timestamp: number;
  payload: unknown;
}
```

### 12.3. Client messages

- world.move
- world.interact
- world.enter
- world.leave
- party.invite
- party.leave
- chat.send
- battle.join
- battle.action

### 12.4. Server messages

- world.snapshot
- world.entity.spawn
- world.entity.update
- world.entity.despawn
- world.player.move
- world.event
- battle.started
- battle.event
- battle.completed
- chat.message
- party.updated
- session.expired

### 12.5. Network reliability

- Sequence number cho message quan trọng.
- Acknowledgement cho request cần xác nhận.
- Heartbeat.
- Reconnect.
- Duplicate message detection.
- Timeout.
- Rate limit.

Không dùng WebSocket để thay thế toàn bộ REST API. REST dùng cho truy vấn và thao tác nghiệp vụ thông thường; WebSocket dùng cho dữ liệu realtime.

---

## 13. DATABASE ENGINEERING

### 13.1. PostgreSQL

PostgreSQL là database chính.

Các nhóm dữ liệu:

**Account:** users, player_profiles, player_settings, player_sessions, player_progress

**Creature:** creatures, creature_instances, creature_stats, creature_skills, creature_evolutions, creature_traits, creature_bonds, creature_equipment

**World:** world_regions, world_zones, world_maps, world_objects, spawn_tables, encounter_templates, resource_nodes, world_events

**Combat:** battle_sessions, battle_participants, battle_teams, battle_units, battle_actions, battle_results, battle_replays

**Economy:** player_wallets, currency_transactions, inventory, items, shops, shop_products, purchases, reward_claims

**Multiplayer:** guilds, guild_members, guild_messages, player_friends, trade_orders, trade_logs, pvp_ratings, leaderboards

### 13.2. Database rules

- Sử dụng UUID hoặc ID có khả năng phân phối duy nhất.
- Foreign key cho quan hệ cần đảm bảo.
- Index các trường truy vấn thường xuyên.
- Unique constraint cho dữ liệu không được trùng.
- Không dùng số thực cho tiền tệ.
- Có transaction cho thao tác liên quan nhiều bảng.
- Có audit log cho giao dịch tài sản.

### 13.3. Index examples

```sql
CREATE INDEX idx_creature_owner
ON creature_instances(player_id);
CREATE INDEX idx_battle_player
ON battle_participants(player_id);
CREATE INDEX idx_inventory_owner
ON inventory(player_id);
CREATE INDEX idx_guild_member
ON guild_members(guild_id, player_id);
```

### 13.4. Redis

Redis sử dụng cho:

- Player session.
- Online presence.
- Zone state cache.
- Rate limit.
- Temporary matchmaking state.
- Short-lived leaderboard cache.
- Distributed locks khi thực sự cần thiết.

Redis không được coi là nguồn dữ liệu lâu dài duy nhất cho tiền tệ, inventory hoặc tiến trình người chơi.

---

## 14. ECONOMY & TRANSACTION SAFETY

### 14.1. Wallet

Wallet lưu số dư các loại currency.

Mỗi giao dịch cần có:

- Transaction ID.
- Player ID.
- Currency type.
- Amount.
- Transaction type.
- Source.
- Reference ID.
- Created timestamp.

### 14.2. Transaction processing

Quy trình mua vật phẩm:

1. Kiểm tra session.
2. Kiểm tra sản phẩm.
3. Kiểm tra giá.
4. Kiểm tra số dư.
5. Tạo transaction.
6. Trừ currency.
7. Cấp item.
8. Ghi audit log.
9. Commit transaction.

Nếu bất kỳ bước quan trọng nào thất bại, transaction phải rollback.

### 14.3. Summoning

Server chịu trách nhiệm:

- Kiểm tra currency.
- Kiểm tra banner.
- Kiểm tra pity.
- Tạo random result.
- Cấp Eidolon hoặc shard.
- Ghi lịch sử.
- Cập nhật pity counter.

Không để client tự quyết định kết quả summoning.

### 14.4. Trading

Trading phải có escrow hoặc cơ chế khóa tài sản.

Quy trình:

1. Người chơi A tạo offer.
2. Server khóa vật phẩm hoặc currency được đưa vào giao dịch.
3. Người chơi B xác nhận.
4. Server kiểm tra lại điều kiện.
5. Thực hiện chuyển tài sản trong transaction.
6. Ghi lịch sử.
7. Mở khóa tài sản còn lại.

Nếu giao dịch bị hủy hoặc hết hạn, tài sản phải được hoàn trả.

---

## 15. SECURITY & ANTI-CHEAT

### 15.1. Security principles

- Không tin tưởng dữ liệu gameplay từ client.
- Kiểm tra quyền truy cập ở backend.
- Giới hạn request theo tài khoản và IP.
- Xác thực quyền sở hữu tài sản.
- Validate mọi input.
- Chống replay request giao dịch.
- Chống giả mạo kết quả battle.
- Bảo vệ API bằng token và rate limit.

### 15.2. Anti-cheat

Phát hiện các trường hợp:

- Di chuyển vượt tốc độ.
- Di chuyển xuyên collision.
- Gửi request quá nhanh.
- Tăng tài sản bất thường.
- Sử dụng Eidolon không sở hữu.
- Skill cooldown không hợp lệ.
- Thay đổi kết quả battle phía client.
- Giao dịch lặp hoặc bất thường.

Không tự động khóa tài khoản chỉ dựa trên một tín hiệu bất thường. Cần ghi log, phân loại mức độ và hỗ trợ kiểm tra thủ công.

---

## 16. ADMIN PANEL & LIVE OPERATIONS

Admin Panel phải hỗ trợ:

### 16.1. Player Management

- Tìm kiếm người chơi.
- Xem hồ sơ.
- Xem lịch sử giao dịch.
- Xem lịch sử battle.
- Kiểm tra báo cáo gian lận.
- Ban và unban theo quyền hạn.

### 16.2. Content Management

- Quản lý Eidolon.
- Quản lý skill.
- Quản lý item.
- Quản lý quest.
- Quản lý map.
- Quản lý spawn.
- Quản lý boss.
- Quản lý event.

### 16.3. Economy Management

- Quản lý shop.
- Quản lý banner.
- Quản lý giá.
- Quản lý reward.
- Xem transaction log.
- Xử lý hỗ trợ giao dịch.

### 16.4. Live Operations

- Tạo event.
- Cài đặt thời gian.
- Cấu hình nhiệm vụ.
- Cấu hình phần thưởng.
- Bật/tắt tính năng.
- Theo dõi người chơi online.

Mọi thao tác admin quan trọng phải có phân quyền và audit log.

---

## 17. PERFORMANCE REQUIREMENTS

### 17.1. Client performance

| Chỉ tiêu | Mục tiêu |
|---|---|
| FPS | 60 FPS mục tiêu |
| Minimum fallback | 30 FPS |
| Portrait layout | 9:16 |
| Map rendering | Culling theo camera |
| Sprite loading | Asset streaming |
| Texture | Atlas khi phù hợp |
| Memory | Theo dõi theo nhóm thiết bị |
| Network | Chỉ đồng bộ dữ liệu cần thiết |

### 17.2. Rendering optimization

- Sprite batching.
- Texture atlas.
- Object pooling.
- Camera culling.
- Animation reuse.
- Giới hạn particle.
- Giải phóng texture khi rời khu vực.
- Không tạo object mới liên tục trong vòng lặp update.

### 17.3. Backend performance

- API pagination.
- Database indexing.
- Redis cache.
- Background jobs.
- WebSocket AOI.
- Batch writes khi phù hợp.
- Query timeout.
- Connection pooling.

Các ngưỡng latency, concurrent players và dung lượng bộ nhớ cần được xác định bằng benchmark trên thiết bị và hạ tầng mục tiêu trước khi phát hành.

---

## 18. LOGGING, MONITORING & ANALYTICS

### 18.1. Logging

Các loại log:

- Application Log.
- API Log.
- Authentication Log.
- Economy Log.
- Battle Log.
- World Event Log.
- Admin Audit Log.
- Security Log.

Mỗi request nên có Request ID để truy vết.

Không ghi password, token hoặc thông tin thanh toán nhạy cảm vào log.

### 18.2. Monitoring

Theo dõi:

- API latency.
- Error rate.
- WebSocket connections.
- Online players.
- Zone population.
- Battle completion.
- Database performance.
- Redis performance.
- Queue backlog.
- Server CPU và RAM.

### 18.3. Game analytics

Event đề xuất:

- player_registered
- player_login
- tutorial_completed
- zone_entered
- eidolon_captured
- eidolon_summoned
- eidolon_evolved
- battle_started
- battle_completed
- dungeon_completed
- pvp_match_completed
- purchase_completed
- player_session_ended

Analytics phải có chính sách bảo mật và lưu trữ dữ liệu phù hợp.

---

## 19. DEPLOYMENT & DEVOPS

### 19.1. Environments

- Local.
- Development.
- Staging.
- Production.

Mỗi môi trường sử dụng database, Redis và credentials riêng.

### 19.2. Deployment architecture

```
                  CDN
                   |
              Game Assets
                   |
             API Gateway
                   |
          +--------+--------+
          |                 |
       REST API         WebSocket
          |                 |
          +--------+--------+
                   |
               Game Backend
                   |
       +-----------+-----------+
       |           |           |
   PostgreSQL    Redis      Storage
```

### 19.3. CI/CD

Pipeline:

1. Install dependencies.
2. TypeScript check.
3. Lint.
4. Unit tests.
5. Integration tests.
6. Build client.
7. Build server.
8. Validate game data.
9. Deploy staging.
10. Smoke test.
11. Deploy production.

### 19.4. Backup

- PostgreSQL backup định kỳ.
- Kiểm tra khả năng restore.
- Lưu bản backup tách biệt với production.
- Version hóa game data.
- Có quy trình rollback.

---

## 20. TESTING STRATEGY

### 20.1. Unit Test

Kiểm thử:

- Damage calculator.
- Element multiplier.
- Skill resolver.
- Status effect.
- Evolution requirements.
- Inventory operations.
- Currency calculation.
- Pathfinding.
- Coordinate conversion.

### 20.2. Integration Test

Kiểm thử:

- Login.
- Enter map.
- Movement synchronization.
- Capture Eidolon.
- Summoning.
- Evolution.
- Battle result.
- Quest reward.
- Trading.
- Reconnect.

### 20.3. Simulation Test

Chạy số lượng lớn battle simulation tự động.

Mục tiêu:

- Phát hiện lỗi combat.
- Kiểm tra balance.
- Kiểm tra deterministic replay.
- Kiểm tra skill interaction.
- Phát hiện AI behavior bất thường.

### 20.4. Load Test

Kiểm thử:

- Concurrent login.
- Online players.
- Zone population.
- WebSocket throughput.
- Battle simulation throughput.
- Database query load.
- Trading concurrency.

### 20.5. Mobile Test

Kiểm tra trên:

- Thiết bị cấu hình thấp.
- Thiết bị Android tầm trung.
- Thiết bị Android cao cấp.
- iPhone nhiều kích thước màn hình.
- Mạng Wi-Fi.
- Mạng di động.
- Mạng không ổn định.
- Trường hợp ứng dụng bị đưa xuống background.

---

## 21. MVP IMPLEMENTATION PLAN

**Phase 1 – Foundation**

- Khởi tạo monorepo.
- Cấu hình Phaser 3.
- Cấu hình TypeScript.
- Khởi tạo backend.
- PostgreSQL.
- Redis.
- Authentication.
- Basic API.
- Asset pipeline.

Deliverable: Người chơi có thể đăng nhập và vào game.

**Phase 2 – Isometric World**

- Tiled pipeline.
- Isometric rendering.
- Player movement.
- Camera.
- Collision.
- Navigation.
- NPC.
- Map transition.
- World networking.

Deliverable: Người chơi có thể khám phá Meadow Village và Whispering Forest.

**Phase 3 – Eidolon Collection**

- Creature database.
- Wild spawn.
- Encounter.
- Capture.
- Summoning.
- Collection UI.
- Inventory.

Deliverable: Người chơi có thể thu thập và quản lý Eidolon.

**Phase 4 – Combat System**

- Combat Core.
- Team formation.
- AI.
- Free movement.
- Skill resolver.
- Status effects.
- Battle UI.
- Replay.

Deliverable: Trận đấu Auto Battle 5 vs 5 hoạt động ổn định.

**Phase 5 – Progression**

- Level up.
- Evolution.
- Bond.
- Quest.
- Equipment.
- Sanctuary.
- Dungeon.
- Boss.

Deliverable: Hoàn thiện vòng lặp gameplay chính.

**Phase 6 – Multiplayer**

- Friends.
- Chat.
- Party.
- PvP.
- Guild.
- Trading.
- Co-op.

Deliverable: Các tính năng multiplayer hoạt động trong môi trường staging.

**Phase 7 – Production Preparation**

- Admin Panel.
- Monitoring.
- Analytics.
- Anti-cheat.
- Load testing.
- Security testing.
- Backup.
- Deployment.

Deliverable: Bản MVP đủ điều kiện phát hành thử nghiệm.

---

## 22. DEFINITION OF DONE

Một tính năng chỉ được coi là hoàn thành khi:

1. Có mô tả chức năng.
2. Có TypeScript types.
3. Có validation.
4. Có unit test cho logic quan trọng.
5. Có integration test nếu liên quan backend.
6. Có loading, success và error state.
7. Có xử lý mất kết nối nếu cần.
8. Có logging phù hợp.
9. Không làm ảnh hưởng các hệ thống hiện có.
10. Được kiểm thử trên thiết bị mục tiêu.

---

## 23. TECHNICAL ACCEPTANCE CRITERIA

| ID | Tiêu chí |
|---|---|
| TDD-001 | Client chạy ổn định ở portrait 9:16 |
| TDD-002 | Isometric coordinate conversion chính xác |
| TDD-003 | Player movement không xuyên collision |
| TDD-004 | Map chuyển đổi không làm mất trạng thái |
| TDD-005 | Client reconnect được sau mất mạng |
| TDD-006 | Combat Engine độc lập Phaser |
| TDD-007 | Battle replay tái hiện đúng trong cùng combat version |
| TDD-008 | Economy transaction không cấp trùng tài sản |
| TDD-009 | Summoning do server xử lý |
| TDD-010 | Trading bảo vệ tài sản trong quá trình giao dịch |
| TDD-011 | Game data có version và validation |
| TDD-012 | Có logging và monitoring cơ bản |
| TDD-013 | Có backup và kiểm tra restore |
| TDD-014 | Không có lỗi nghiêm trọng trong các luồng MVP |

---

## 24. FINAL TECHNICAL DECISIONS

Các quyết định kỹ thuật được khóa cho giai đoạn MVP:

| Hạng mục | Công nghệ |
|---|---|
| Game Engine | Phaser 3 |
| Language | TypeScript |
| Game Art | 2D Pixel Art |
| Camera | Isometric |
| Orientation | Portrait 9:16 |
| Map Editor | Tiled |
| Backend | Node.js + TypeScript |
| API | REST |
| Realtime | WebSocket |
| Database | PostgreSQL |
| Cache | Redis |
| Object Storage | S3-compatible / Cloudflare R2 |
| Combat | Custom Deterministic Engine |
| Pathfinding | A* |
| Architecture | Modular Monolith |
| Deployment | Container-based |

Nguyên tắc quan trọng: Không triển khai microservices, persistent open world quy mô lớn hoặc hệ thống matchmaking phức tạp ngay từ đầu. Ưu tiên hoàn thiện trải nghiệm khám phá, thu thập Eidolon và Auto Battle trước; sau đó mở rộng multiplayer dựa trên kiến trúc đã tách module.

*END OF PART 4 – TECHNICAL DESIGN DOCUMENT v1.0*
