# EIDOLITH – WORLD & EXPLORATION SYSTEM DESIGN DOCUMENT

## PART 8: OPEN WORLD, ISOMETRIC MAP & EXPLORATION

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** World & Exploration System Design Document
**Version:** 1.0
**Status:** Development Specification
**World:** Aetheria
**Camera:** Isometric 2D
**Art Style:** Pixel Art
**Platform:** Android / iOS
**Orientation:** Portrait 9:16
**Movement:** Free Movement
**Map Editor:** Tiled

> Tài liệu này là bản World Part 8 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. WORLD DESIGN OVERVIEW

### 1.1. Mục tiêu

Thế giới Aetheria là môi trường khám phá chính của EIDOLITH.

Người chơi không chỉ di chuyển giữa các menu mà trực tiếp điều khiển Wanderer đi qua những khu vực khác nhau, gặp NPC, tìm kiếm tài nguyên, phát hiện Eidolon hoang dã và tham gia các sự kiện thế giới.

World System cần tạo cảm giác:

- Một thế giới sống động.
- Có nhiều khu vực với bản sắc riêng.
- Có những bí mật để khám phá.
- Eidolon xuất hiện tự nhiên trong môi trường.
- NPC có lịch trình và hoạt động.
- Người chơi có thể gặp nhau trong cùng khu vực.
- Có thể mở rộng nội dung qua các bản cập nhật.

### 1.2. World design principles

- **Exploration First:** Khuyến khích người chơi khám phá thay vì chỉ di chuyển giữa các menu.
- **Environmental Storytelling:** Môi trường, kiến trúc, vật thể và NPC kể câu chuyện về Aetheria.
- **Living World:** Thế giới có thời gian, thời tiết, hoạt động và sự kiện.
- **Discoverability:** Người chơi có thể phát hiện Eidolon, vật phẩm và khu vực bí mật.
- **Scalable World:** Bản đồ được chia thành Region, Zone và Area để dễ mở rộng.

---

## 2. WORLD STRUCTURE

### 2.1. Hierarchy

Thế giới được tổ chức thành 4 cấp:

```
Aetheria
   |
   ├── Region
   |     |
   |     ├── Zone
   |     |     |
   |     |     ├── Area
   |     |     |     |
   |     |     |     ├── NPC
   |     |     |     ├── Wild Eidolon
   |     |     |     ├── Resource
   |     |     |     ├── Treasure
   |     |     |     └── Dungeon
```

- **Region:** Một vùng địa lý lớn có khí hậu, kiến trúc và hệ sinh thái riêng.
- **Zone:** Khu vực gameplay nằm trong Region.
- **Area:** Các phân khu nhỏ trong một Zone, phục vụ khám phá và bố trí nội dung.

### 2.2. Initial regions

Aetheria có 5 Region chính.

| Region | Theme | Primary Elements |
|---|---|---|
| Verdant Plains | Đồng cỏ và rừng | Grove, Gale |
| Emberfall | Núi lửa và vùng đất cháy | Flame, Stone |
| Frostveil | Băng tuyết | Frost, Tide |
| Hollowreach | Vùng đất cổ và bóng tối | Shade, Venom |
| Celestia | Vùng đất thiên thể | Astral, Volt |

### 2.3. Region progression

Người chơi bắt đầu tại Verdant Plains.

Các vùng tiếp theo được mở khóa thông qua: Main Story, Player Level, Quest Completion, Boss Defeat, Special Exploration, World Event.

Không nên khóa toàn bộ Region chỉ bằng level. Một số khu vực có thể mở qua nhiệm vụ hoặc khám phá đặc biệt.

---

## 3. INITIAL WORLD – VERDANT PLAINS

### 3.1. Overview

Verdant Plains là khu vực khởi đầu của EIDOLITH. Đây là vùng đất có đồng cỏ rộng, rừng xanh, hồ nước và các di tích cổ.

Mục tiêu thiết kế: Dễ khám phá, có nhiều NPC hướng dẫn, có Eidolon cấp thấp, có tài nguyên cơ bản, có các bí mật nhỏ, giới thiệu hệ thống thế giới.

### 3.2. Initial areas

**Meadow Village** — Loại: Village / Safe Zone

Nội dung: Player Spawn, NPC Elder, General Shop, Summoning Shrine, Quest Board, Sanctuary Portal, Resource Shop, Social Meeting Point.

Đây là trung tâm sinh hoạt ban đầu.

**Whispering Forest** — Loại: Exploration Zone

Nội dung: Wild Eidolon, Gathering Nodes, Hidden Treasure, Ancient Ruins, Forest NPC, Mini Boss.

**Crystal Lake** — Loại: Water Exploration Zone

Nội dung: Tide Eidolon, Fishing, Water Resources, Hidden Cave, Rare Spawn, Environmental Puzzle.

**Ancient Grove** — Loại: High-level Exploration Zone

Nội dung: Ancient Trees, Elite Eidolon, Grove Boss, Ancient Shrine, Evolution Materials, Story Quest.

---

## 4. ISOMETRIC WORLD SYSTEM

### 4.1. Camera perspective

Game sử dụng 2D Isometric Pixel Art. Nhân vật và vật thể được thể hiện theo góc nhìn 3/4 từ trên xuống. Không sử dụng perspective 3D thực.

### 4.2. Coordinate system

Hai hệ tọa độ: World Coordinate, Screen Coordinate.

Công thức chuyển đổi:

```ts
function worldToScreen(x: number, y: number) {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2)
  };
}
```

Tọa độ logic và tọa độ render phải thống nhất giữa client, server và map tools.

### 4.3. Tile configuration

MVP đề xuất:

| Property | Value |
|---|---|
| Tile Width | 64 px |
| Tile Height | 32 px |
| Reference Resolution | 720 × 1280 |
| Camera | Isometric |
| Art Style | Pixel Art |
| Rendering | WebGL |
| Sorting | Depth Sorting |

Kích thước tile có thể thay đổi theo tileset thực tế, nhưng phải giữ cùng quy ước tọa độ.

### 4.4. Depth sorting

Đối tượng được sắp xếp theo vị trí chân hoặc sorting anchor.

Ví dụ: Player, NPC, Wild Eidolon, Resource Node, Trees, Buildings, Props.

Các vật thể lớn có thể tách thành lower object và upper object để nhân vật đi phía trước hoặc phía sau đúng cách.

### 4.5. Environment layers

| Layer | Content |
|---|---|
| Ground | Terrain |
| Ground Detail | Grass, flowers |
| Lower Object | Rocks, roots |
| Collision | Obstacles |
| Interactive | NPC, resource |
| Entity | Player, Eidolon |
| Upper Object | Tree canopy, roof |
| Atmosphere | Fog, rain, light |
| Effects | Particles |

---

## 5. MAP SYSTEM

### 5.1. Map definition

Mỗi map có: Map ID, Region ID, Zone ID, Dimensions, Tileset, Navigation data, Collision data, Spawn points, Interactive objects, Weather profile, Music, Ambient effects.

### 5.2. Map types

| Type | Description |
|---|---|
| Village | Khu vực an toàn |
| Field | Đồng cỏ |
| Forest | Rừng |
| Lake | Hồ |
| Cave | Hang động |
| Ruins | Di tích |
| Dungeon | Phó bản |
| Boss Arena | Đấu trường boss |
| Sanctuary | Khu vực riêng |
| Event Map | Bản đồ sự kiện |

### 5.3. Map transition

Chuyển map qua: Road, Gate, Portal, Cave Entrance, NPC Transport, Story Event.

Quy trình:

1. Người chơi đến transition point.
2. Client gửi request.
3. Server kiểm tra quyền truy cập.
4. Server cấp zone instance.
5. Client tải tài nguyên.
6. Client chuyển map.
7. Server đồng bộ vị trí.

### 5.4. Map streaming

Không tải toàn bộ tài nguyên thế giới cùng lúc. Sử dụng: Texture atlas, Asset bundles, Map chunk, Lazy loading, Resource cache, Asset unloading.

### 5.5. Map chunks

Map lớn được chia thành chunk logic. Client tải các chunk cần thiết theo camera và vùng lân cận.

Chunk không phải một server instance riêng. Đây là cách tổ chức và streaming nội dung bản đồ.

---

## 6. PLAYER MOVEMENT

### 6.1. Movement types

Người chơi có thể: Walk, Run, Idle, Turn, Interact.

### 6.2. Control modes

**Tap-to-Move:** Người chơi chạm vị trí muốn đến. Client tìm đường bằng navigation và gửi movement intent lên server.

**Virtual Joystick:** Người chơi điều khiển hướng di chuyển trực tiếp.

Có thể hỗ trợ đồng thời hai kiểu điều khiển trong Settings.

### 6.3. Movement rules

- Không xuyên vật cản.
- Không đi ngoài map boundary.
- Không đi xuyên NPC hoặc object cứng.
- Có thể đi qua vùng có collision mềm nếu được định nghĩa.
- Không vượt quá movement speed.
- Server xác nhận vị trí hợp lệ.

### 6.4. Movement animation

Hỗ trợ: Idle, Walk, Run, Directional turning. Sprite phải có animation tương ứng với hướng di chuyển isometric.

### 6.5. Movement speed

Movement speed được quản lý bằng player configuration.

Một số khu vực có thể áp dụng: Slow terrain, Water movement restriction, Special movement effect, Temporary speed buff.

Các modifier phải được server kiểm tra.

---

## 7. PLAYER INTERACTION SYSTEM

### 7.1. Interactive object types

NPC, Wild Eidolon, Resource Node, Treasure Chest, Portal, Quest Object, Dungeon Entrance, Ancient Shrine, Hidden Object, Environmental Puzzle.

### 7.2. Interaction flow

1. Người chơi chạm object.
2. Client kiểm tra khoảng cách sơ bộ.
3. Hiển thị interaction prompt.
4. Người chơi xác nhận.
5. Client gửi interaction request.
6. Server kiểm tra quyền và khoảng cách.
7. Server trả kết quả.
8. Client hiển thị nội dung.

### 7.3. Interaction priority

Khi nhiều object nằm gần nhau:

1. Object được chọn trực tiếp.
2. NPC đang có quest.
3. Quest object.
4. Wild Eidolon.
5. Resource node.
6. Generic object.

Người chơi phải có thể chọn đúng mục tiêu, tránh tự động tương tác nhầm.

---

## 8. NPC SYSTEM

### 8.1. NPC categories

| Category | Function |
|---|---|
| Story NPC | Cốt truyện |
| Quest NPC | Nhiệm vụ |
| Merchant | Mua bán |
| Researcher | Nghiên cứu |
| Guide | Hướng dẫn |
| Guild NPC | Guild |
| Event NPC | Sự kiện |
| Special NPC | Nội dung đặc biệt |

### 8.2. NPC data

```ts
interface NPCDefinition {
  id: string;
  name: string;
  mapId: string;
  position: {
    x: number;
    y: number;
  };
  dialogueId?: string;
  scheduleId?: string;
  services: string[];
  interactionRadius: number;
}
```

### 8.3. NPC schedules

NPC có thể thay đổi hoạt động theo thời gian.

Ví dụ:

| Time | Activity |
|---|---|
| Morning | Mở cửa hàng |
| Day | Làm việc |
| Evening | Trở về nhà |
| Night | Nghỉ ngơi |

Lịch trình là dữ liệu cấu hình, không cần mọi NPC đều có AI phức tạp.

### 8.4. Dialogue system

Hỗ trợ: Text dialogue, Multiple choices, Quest trigger, Shop opening, Event trigger, Story flags, Conditional dialogue.

### 8.5. NPC services

Một NPC có thể cung cấp nhiều dịch vụ. Ví dụ Elder: Main Story, Tutorial, Region Unlock, World Information.

---

## 9. WILD EIDOLON SPAWN SYSTEM

### 9.1. Overview

Wild Eidolon xuất hiện trong thế giới và có thể được người chơi phát hiện. Mỗi spawn được server quản lý.

### 9.2. Spawn data

```ts
interface SpawnDefinition {
  id: string;
  mapId: string;
  creaturePool: string[];
  position: {
    x: number;
    y: number;
  };
  radius: number;
  minLevel: number;
  maxLevel: number;
  respawnSeconds: number;
  timeConditions?: string[];
  weatherConditions?: string[];
}
```

### 9.3. Spawn rules

Spawn có thể phụ thuộc: Map, Zone, Level range, Time of day, Weather, Story progression, Event, Player progression.

### 9.4. Spawn states

```ts
type SpawnState =
  | "AVAILABLE"
  | "ACTIVE"
  | "ENCOUNTER"
  | "DEFEATED"
  | "RESPAWNING"
  | "DISABLED";
```

### 9.5. Spawn lifecycle

```
AVAILABLE
    |
    v
ACTIVE
    |
    v
ENCOUNTER
    |
    +------ Capture Failed
    |             |
    |             v
    |          ACTIVE
    |
    +------ Defeated / Captured
                  |
                  v
              RESPAWNING
                  |
                  v
               ACTIVE
```

Quy tắc thất bại encounter, tiêu thụ vật phẩm và respawn phải được định nghĩa riêng cho từng loại encounter.

### 9.6. Spawn distribution

Không để Eidolon xuất hiện dày đặc hoặc quá thưa.

Cần có: Spawn density, Minimum distance, Maximum active count, Respawn control, Spawn group, Rare spawn chance.

### 9.7. Rare Eidolon

Rare spawn có thể: Có hiệu ứng đặc biệt, có animation riêng, xuất hiện theo điều kiện, có tỷ lệ thấp, có thông báo khám phá.

Không sử dụng spawn rate bí mật để gây hiểu lầm về tỷ lệ gặp Eidolon.

---

## 10. WILD ENCOUNTER SYSTEM

### 10.1. Encounter types

Normal Encounter, Rare Encounter, Elite Encounter, Boss Encounter, Event Encounter, Scripted Encounter.

### 10.2. Encounter initiation

Người chơi có thể bắt đầu encounter khi: Tiếp cận Wild Eidolon, tương tác với object, kích hoạt event, đi vào khu vực trigger, nhận nhiệm vụ.

### 10.3. Encounter flow

1. Spawn được phát hiện.
2. Player tương tác.
3. Server xác nhận.
4. Encounter được tạo.
5. Battle hoặc Capture UI xuất hiện.
6. Encounter kết thúc.
7. Server cập nhật spawn state.
8. Client trở lại World Scene.

### 10.4. Encounter isolation

Một encounter có thể được chuyển thành battle instance riêng để tránh ảnh hưởng đến người chơi khác.

---

## 11. GATHERING SYSTEM

### 11.1. Resource categories

| Category | Examples |
|---|---|
| Wood | Forest Wood |
| Stone | Ancient Stone |
| Ore | Iron Ore |
| Herb | Healing Herb |
| Crystal | Energy Crystal |
| Flower | Moonflower |
| Water | Crystal Water |
| Special | Ancient Fragment |

### 11.2. Resource nodes

Mỗi node có: Resource ID, Map ID, Position, Required tool, Yield table, Respawn time, Interaction range, Node state.

### 11.3. Gathering actions

Chop, Mine, Harvest, Collect, Research.

### 11.4. Gathering flow

1. Người chơi tương tác.
2. Server kiểm tra node.
3. Kiểm tra công cụ.
4. Kiểm tra cooldown.
5. Tạo gathering result.
6. Cấp tài nguyên.
7. Ghi lịch sử.
8. Đặt node vào trạng thái cooldown.

### 11.5. Resource respawn

Respawn có thể dựa trên: Thời gian, Zone population, Event multiplier, Daily reset, Server schedule.

Không cho phép client tự đặt thời gian hồi.

---

## 12. TREASURE & SECRET EXPLORATION

### 12.1. Treasure types

Common Chest, Rare Chest, Ancient Chest, Hidden Chest, Puzzle Chest, Event Chest.

### 12.2. Treasure requirements

Có thể yêu cầu: Quest, Key item, Puzzle completion, Hidden path, Special weather, Time condition.

### 12.3. Hidden exploration

Các bí mật có thể gồm: Lối đi sau thác nước, cây cổ thụ có thể tương tác, hang động bị che khuất, di tích cần kích hoạt, NPC bí mật, Rare Eidolon spawn, Hidden treasure.

### 12.4. Reward rules

Treasure reward phải được server xác nhận và có cơ chế claim chống trùng.

---

## 13. WORLD TIME SYSTEM

### 13.1. Time cycle

Thế giới có chu kỳ: Morning, Day, Evening, Night.

### 13.2. Time configuration

```ts
interface WorldTimeConfig {
  cycleDurationSeconds: number;
  morningStart: number;
  dayStart: number;
  eveningStart: number;
  nightStart: number;
}
```

MVP đề xuất một chu kỳ thế giới dài 60 phút thực tế. Thời gian cụ thể có thể điều chỉnh qua cấu hình.

### 13.3. Time-based content

Thời gian có thể ảnh hưởng: NPC schedule, Wild Eidolon spawn, Quest condition, Ambient lighting, Background music, Special event.

### 13.4. Time authority

World time được server quản lý. Client chỉ render thời gian được đồng bộ từ server.

---

## 14. WEATHER SYSTEM

### 14.1. Weather types

Sunny, Cloudy, Rain, Storm, Fog, Wind, Snow, Special Weather.

### 14.2. Weather effects

| Weather | World Effect |
|---|---|
| Sunny | Ánh sáng bình thường |
| Cloudy | Giảm độ sáng |
| Rain | Hiệu ứng mưa |
| Storm | Sấm sét |
| Fog | Giảm tầm nhìn |
| Wind | Lá và cây chuyển động |
| Snow | Tuyết rơi |
| Special | Hiệu ứng theo event |

### 14.3. Gameplay impact

Weather có thể ảnh hưởng: Spawn pool, Encounter conditions, Resource availability, NPC schedules, Environmental puzzles.

Không phải mọi thời tiết đều cần tác động gameplay. Các hiệu ứng cần có giá trị rõ ràng và dễ nhận biết.

### 14.4. Weather transitions

Weather thay đổi theo cấu hình server.

Client nhận event: world.weather.update, world.weather.warning, world.weather.special.

---

## 15. WORLD EVENT SYSTEM

### 15.1. Event categories

Rare Eidolon Appearance, Resource Surge, Ancient Shrine Activation, Weather Event, World Boss, Exploration Event, Seasonal Event.

### 15.2. Event lifecycle

```
SCHEDULED
    |
    v
ANNOUNCED
    |
    v
ACTIVE
    |
    v
COMPLETED
    |
    v
REWARDED
```

### 15.3. World boss event

World Boss có thể: Xuất hiện theo lịch, có khu vực riêng, cho nhiều người chơi tham gia, có reward theo contribution, có bảng xếp hạng event.

Để tránh xung đột giữa các người chơi, World Boss cần một mô hình instance riêng, thay vì mặc định mọi người cùng điều khiển một battle state.

### 15.4. Event notification

Thông báo: Event sắp diễn ra, Event bắt đầu, Boss xuất hiện, Event kết thúc, Reward đã sẵn sàng.

---

## 16. WORLD MULTIPLAYER

### 16.1. Shared zones

Người chơi có thể nhìn thấy người chơi khác trong cùng zone.

Có thể: Gặp nhau, di chuyển cùng nhau, chat, tham gia party, tương tác social, cùng tham gia event nếu chế độ hỗ trợ.

### 16.2. Zone instance

Mỗi zone có giới hạn người chơi. Khi zone đầy, server tạo instance mới.

### 16.3. Player visibility

Client chỉ nhận entity trong AOI. AOI dựa trên khoảng cách và có thể kết hợp map region.

### 16.4. Player interaction

Hỗ trợ: View profile, Add friend, Invite party, Trade request, Report player, Block player.

### 16.5. World chat

World chat có thể giới hạn theo Region hoặc Zone. Không broadcast mọi message đến tất cả người chơi trên toàn server.

---

## 17. DUNGEON & EXPLORATION AREAS

### 17.1. Dungeon structure

Một Dungeon gồm: Entrance, Room, Encounter, Puzzle, Boss Room, Reward Room.

### 17.2. Dungeon types

Story Dungeon, Material Dungeon, Element Dungeon, Boss Dungeon, Challenge Dungeon.

### 17.3. Dungeon instance

Dungeon chạy trong instance riêng. Có thể hỗ trợ: Solo, Party, Co-op.

### 17.4. Dungeon progression

Người chơi hoàn thành từng encounter để mở khu vực tiếp theo.

Dungeon có thể sử dụng: Key, Daily attempt, Energy, Quest unlock.

---

## 18. SANCTUARY WORLD INTEGRATION

Sanctuary là khu vực riêng của người chơi. Nó được liên kết với World System nhưng có lifecycle riêng.

Các chức năng: Eidolon Habitat, Resource Production, Building, Decoration, Research, Breeding hoặc Bond activities nếu được bổ sung sau này, Visitor Interaction.

### 18.1. Sanctuary access

Người chơi vào Sanctuary qua: Portal, NPC, World menu.

### 18.2. Sanctuary persistence

Trạng thái công trình, vị trí và tài nguyên phải được lưu trên server. Client không được tự xác nhận thời gian sản xuất.

---

## 19. WORLD AUDIO & ATMOSPHERE

### 19.1. Ambient audio

Mỗi Region có: Background Music, Ambient Loop, Environmental Sounds, Weather Sounds, NPC Sounds.

### 19.2. Audio transitions

Âm thanh chuyển theo: Region, Zone, Time of day, Weather, Combat state, Event state.

### 19.3. Pixel art atmosphere

Các hiệu ứng: Animated grass, Water movement, Falling leaves, Fireflies, Fog, Rain, Snow, Sunlight particles.

Phải có giới hạn particle và hiệu ứng trên thiết bị cấu hình thấp.

---

## 20. MAP PRODUCTION PIPELINE

### 20.1. Map editor

Sử dụng Tiled. Mỗi map có: Tile layers, Object layers, Collision layers, Navigation layers, Spawn points, Trigger points.

### 20.2. Export process

1. Thiết kế map trong Tiled.
2. Kiểm tra tile alignment.
3. Kiểm tra collision.
4. Kiểm tra navigation.
5. Kiểm tra object placement.
6. Export JSON.
7. Validate asset reference.
8. Build map package.
9. Test trong game.
10. Publish content version.

### 20.3. Map validation tool

Tool phải phát hiện: Tile thiếu, object thiếu ID, spawn không hợp lệ, NPC nằm trong collision, portal không có destination, navigation bị đứt đoạn, asset reference sai, layer thiếu.

### 20.4. Map content version

Mỗi map có version riêng. Client kiểm tra version trước khi sử dụng tài nguyên.

---

## 21. WORLD PERFORMANCE

### 21.1. Client optimization

Camera culling, Chunk streaming, Texture atlas, Object pooling, Depth sorting optimization, Particle limits, Asset unloading, Animation reuse.

### 21.2. Server optimization

AOI, Zone instances, Spawn caching, Event-driven updates, Movement throttling, Snapshot batching.

### 21.3. World entity budget

MVP phải xác định số entity hiển thị theo từng loại thiết bị.

Theo dõi: Active player count, NPC count, Wild Eidolon count, Resource node count, Particle count, Sprite draw calls, Network update size.

Không đặt một giới hạn entity cứng cho mọi thiết bị trước khi có benchmark thực tế.

---

## 22. WORLD SECURITY

Server kiểm tra: Player position, Movement speed, Map boundary, Interaction distance, Spawn ownership, Encounter state, Resource cooldown, Treasure claim, Dungeon eligibility, Event participation.

Các hành động có phần thưởng phải được xác nhận bởi server.

---

## 23. WORLD MVP CONTENT

### 23.1. Initial map list

| Map ID | Type | Priority |
|---|---|---|
| meadow_village | Village | P0 |
| whispering_forest | Forest | P0 |
| crystal_lake | Lake | P1 |
| ancient_grove | Ancient Forest | P1 |
| starter_dungeon | Dungeon | P1 |
| boss_arena_01 | Boss Arena | P1 |
| sanctuary_home | Private Area | P1 |

### 23.2. Initial content

MVP cần:

- 1 Region hoàn chỉnh.
- 4 Exploration Areas.
- 1 Village.
- 1 Dungeon.
- 1 Boss Arena.
- 10–15 NPC.
- 20 Eidolon templates.
- Resource nodes.
- Treasure chests.
- 1 World Boss event prototype.

Không cần mở toàn bộ 5 Region trong bản MVP.

---

## 24. WORLD TESTING

### 24.1. Functional tests

Map transition, Player movement, NPC interaction, Spawn lifecycle, Capture encounter, Gathering, Treasure, Weather, Day/night, World event.

### 24.2. Navigation tests

Pathfinding, Obstacle avoidance, Collision, Map boundary, Tap-to-move, Joystick movement.

### 24.3. Multiplayer tests

Shared zone, AOI, Player movement synchronization, Zone full, Instance creation, Reconnect, Party transition.

### 24.4. Performance tests

Large map, High entity count, Dense particle, Many visible players, Repeated map transition, Background/resume, Low-memory devices.

---

## 25. WORLD ACCEPTANCE CRITERIA

| ID | Requirement |
|---|---|
| WORLD-001 | Isometric map hiển thị chính xác |
| WORLD-002 | Player di chuyển tự do |
| WORLD-003 | Camera follow hoạt động |
| WORLD-004 | Collision chính xác |
| WORLD-005 | Pathfinding hoạt động |
| WORLD-006 | Map transition hoạt động |
| WORLD-007 | NPC interaction hoạt động |
| WORLD-008 | Wild Eidolon spawn hoạt động |
| WORLD-009 | Encounter được server quản lý |
| WORLD-010 | Resource gathering hoạt động |
| WORLD-011 | Treasure không thể claim trùng |
| WORLD-012 | Day/night đồng bộ |
| WORLD-013 | Weather đồng bộ |
| WORLD-014 | World event hoạt động |
| WORLD-015 | Shared zone hoạt động |
| WORLD-016 | AOI giới hạn dữ liệu hợp lý |
| WORLD-017 | Sanctuary lưu trạng thái |
| WORLD-018 | Map streaming ổn định |

---

## 26. FINAL WORLD DECISIONS

| Category | Decision |
|---|---|
| World | Aetheria |
| Region Count | 5 |
| Starting Region | Verdant Plains |
| Camera | 2D Isometric |
| Art | Pixel Art |
| Movement | Free Movement |
| Map Editor | Tiled |
| Navigation | A* |
| Map Streaming | Chunk-based |
| Spawn | Server-managed |
| NPC | Data-driven |
| Time | Server-authoritative |
| Weather | Server-authoritative |
| Multiplayer | Shared Zone Instances |
| AOI | Enabled |
| Dungeon | Instanced |
| Sanctuary | Private Instance |

*END OF PART 8 – WORLD & EXPLORATION SYSTEM DESIGN DOCUMENT v1.0*
