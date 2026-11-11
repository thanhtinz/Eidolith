# EIDOLITH – API & WEBSOCKET PROTOCOL SPECIFICATION

## PART 6: CLIENT-SERVER COMMUNICATION

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** API & WebSocket Protocol Specification
**Version:** 1.0
**Status:** Development Specification
**API:** REST · **Realtime:** WebSocket · **Protocol:** JSON
**Backend:** Node.js + TypeScript · **Client:** Phaser 3 + TypeScript

> Tài liệu này là bản API Spec Part 6 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. API ARCHITECTURE

### 1.1. Mục tiêu

API chịu trách nhiệm kết nối Game Client với Backend.

Các chức năng: Authentication, Player profile, Character progression, Eidolon collection, Inventory, Currency, World exploration, Wild encounters, Capture, Battle, Quest, Sanctuary, Dungeon, PvP, Guild, Trading, Events, Shop.

### 1.2. Communication model

| Communication | Protocol | Purpose |
|---|---|---|
| Authentication | REST | Login, register |
| Player Data | REST | Profile, progression |
| Collection | REST | Eidolon management |
| Inventory | REST | Items |
| Economy | REST | Currency, purchase |
| World Movement | WebSocket | Realtime movement |
| World Events | WebSocket | Dynamic events |
| Chat | WebSocket | Realtime messaging |
| Battle Events | WebSocket | Battle updates |
| Party | WebSocket | Party synchronization |
| Notifications | WebSocket | Realtime notification |

### 1.3. Base URLs

Development:

```
https://dev-api.eidolith.example.com/api/v1
wss://dev-api.eidolith.example.com/ws/v1
```

Staging:

```
https://staging-api.eidolith.example.com/api/v1
wss://staging-api.eidolith.example.com/ws/v1
```

Production:

```
https://api.eidolith.example.com/api/v1
wss://api.eidolith.example.com/ws/v1
```

Các domain trên là placeholder, không phải domain production đã đăng ký.

---

## 2. STANDARD API FORMAT

### 2.1. Request headers

```
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN
X-Request-ID: req_123456
X-Client-Version: 1.0.0
X-Content-Version: 1
Idempotency-Key: operation_123
```

Các header không cần thiết có thể được bỏ qua tùy endpoint.

### 2.2. Success response

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2026-11-10T12:00:00Z"
  }
}
```

### 2.3. Error response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_CURRENCY",
    "message": "Not enough currency",
    "details": {}
  },
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2026-11-10T12:00:00Z"
  }
}
```

### 2.4. Pagination

Các API trả về danh sách lớn sử dụng cursor pagination.

```json
{
  "success": true,
  "data": {
    "items": [],
    "nextCursor": "cursor_value",
    "hasMore": true
  }
}
```

Không sử dụng offset pagination cho các danh sách có lượng dữ liệu lớn và thường xuyên thay đổi nếu cursor pagination phù hợp hơn.

---

## 3. AUTHENTICATION API

### 3.1. Register

`POST /auth/register`

Request:

```json
{
  "email": "player@example.com",
  "username": "wanderer01",
  "password": "SecurePassword123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "emailVerificationRequired": true
  }
}
```

Validation:

- Email hợp lệ.
- Username từ 3–32 ký tự.
- Username không trùng.
- Password đạt chính sách bảo mật.
- Có rate limit.

### 3.2. Login

`POST /auth/login`

Request:

```json
{
  "email": "player@example.com",
  "password": "SecurePassword123",
  "deviceId": "device_123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "ACCESS_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "username": "wanderer01"
    }
  }
}
```

### 3.3. Refresh token

`POST /auth/refresh`

Request: `{ "refreshToken": "REFRESH_TOKEN" }`

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN",
    "expiresIn": 900
  }
}
```

Refresh token rotation phải được triển khai để giảm nguy cơ token bị đánh cắp.

### 3.4. Logout

`POST /auth/logout` — Thu hồi session hiện tại.

### 3.5. Verify email

`POST /auth/verify-email`

### 3.6. Password reset

- `POST /auth/password/forgot`
- `POST /auth/password/reset`

Không tiết lộ email có tồn tại trong hệ thống hay không thông qua response dễ bị khai thác.

---

## 4. PLAYER API

### 4.1. Get profile

`GET /player/me`

Response:

```json
{
  "success": true,
  "data": {
    "playerId": "uuid",
    "displayName": "Wanderer",
    "level": 10,
    "experience": 2500,
    "avatarId": "avatar_default",
    "currentRegion": "verdant_plains",
    "currentMap": "meadow_village"
  }
}
```

### 4.2. Update profile

`PATCH /player/me`

Request: `{ "displayName": "NewWanderer", "avatarId": "avatar_02" }`

### 4.3. Player progression

`GET /player/progress`

Response:

```json
{
  "success": true,
  "data": {
    "mainStoryStage": "chapter_01_03",
    "tutorialCompleted": true,
    "unlockedRegions": ["verdant_plains"],
    "unlockedFeatures": ["sanctuary", "summoning"]
  }
}
```

### 4.4. Player statistics

`GET /player/statistics`

Trả về: Total playtime, Total battles, Wins, Losses, Captured Eidolons, Summoned Eidolons, Evolution count, Dungeon completions.

---

## 5. EIDOLON API

### 5.1. Get collection

`GET /creatures` — Query: `?pageSize=20&cursor=...`

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "instanceId": "uuid",
        "creatureId": "eidolon_emberling",
        "name": "Emberling",
        "level": 10,
        "rarity": "common",
        "element": "flame",
        "role": "striker",
        "isFavorite": false
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

### 5.2. Get Eidolon detail

`GET /creatures/{instanceId}`

Trả về: Template data, Level, Experience, Stats, Skills, Traits, Bond, Evolution branches, Equipment, Acquisition information.

### 5.3. Rename Eidolon

`PATCH /creatures/{instanceId}` — `{ "nickname": "Little Ember" }`

### 5.4. Favorite Eidolon

`POST /creatures/{instanceId}/favorite`

### 5.5. Lock Eidolon

`POST /creatures/{instanceId}/lock`

### 5.6. Level up

`POST /creatures/{instanceId}/level-up`

```json
{
  "materials": [
    { "itemId": "exp_crystal", "quantity": 5 }
  ]
}
```

Server phải tự tính lượng EXP và xác nhận tài nguyên.

### 5.7. Evolution

`POST /creatures/{instanceId}/evolve` — `{ "evolutionBranch": "ignidrake" }`

Server kiểm tra điều kiện và cập nhật tiến hóa trong transaction.

### 5.8. Skill configuration

- `GET /creatures/{instanceId}/skills`
- `PUT /creatures/{instanceId}/skills`

Request:

```json
{
  "skillSlots": [
    "skill_flame_bite",
    "skill_ember_burst",
    "skill_guardian_roar"
  ]
}
```

Server phải kiểm tra các skill đã được mở khóa và số slot hợp lệ.

### 5.9. Equipment

- `GET /creatures/{instanceId}/equipment`
- `PUT /creatures/{instanceId}/equipment`
- `DELETE /creatures/{instanceId}/equipment/{slot}`

---

## 6. COLLECTION & CAPTURE API

### 6.1. Start wild encounter

`POST /encounters/start`

Request: `{ "spawnId": "spawn_verdant_001" }`

Server kiểm tra:

- Spawn còn tồn tại.
- Người chơi đang ở đúng khu vực.
- Khoảng cách hợp lệ.
- Spawn chưa bị sử dụng.
- Người chơi không đang ở encounter khác.

Response:

```json
{
  "success": true,
  "data": {
    "encounterId": "uuid",
    "creature": {
      "creatureId": "eidolon_mossling",
      "level": 4
    },
    "captureAvailable": true,
    "expiresAt": "2026-11-10T12:05:00Z"
  }
}
```

### 6.2. Capture Eidolon

`POST /encounters/{encounterId}/capture`

Request: `{ "captureItemId": "basic_capture_orb" }`

Server xử lý:

1. Xác thực encounter.
2. Kiểm tra thời hạn.
3. Kiểm tra vị trí và trạng thái.
4. Kiểm tra vật phẩm.
5. Tính tỷ lệ capture.
6. Tiêu thụ vật phẩm.
7. Tạo creature instance nếu thành công.
8. Ghi lịch sử.
9. Trả kết quả.

Response:

```json
{
  "success": true,
  "data": {
    "captured": true,
    "creatureInstanceId": "uuid",
    "creatureId": "eidolon_mossling"
  }
}
```

Tỷ lệ capture phải được tính ở server, không nhận trực tiếp từ client.

---

## 7. SUMMONING API

### 7.1. Banner list

`GET /summoning/banners`

Response:

```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": "banner_standard",
        "name": "Standard Resonance",
        "startsAt": "2026-11-01T00:00:00Z",
        "endsAt": "2026-12-01T00:00:00Z",
        "cost": { "currency": "crystal", "amount": 100 },
        "pullCountOptions": [1, 10]
      }
    ]
  }
}
```

### 7.2. Summon

`POST /summoning/pull` — Headers: `Idempotency-Key: summon_operation_001`

Request: `{ "bannerId": "banner_standard", "pullCount": 10 }`

Response:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "creatureInstanceId": "uuid",
        "creatureId": "eidolon_emberling",
        "rarity": "common",
        "isDuplicate": false
      }
    ],
    "pity": { "current": 10, "guaranteeAt": 80 },
    "remainingCurrency": 1000
  }
}
```

Tỷ lệ xuất hiện, pity và quy tắc chuyển đổi duplicate phải được công khai trong giao diện và được server áp dụng chính xác.

---

## 8. INVENTORY API

- `GET /inventory` — Query: `?category=material&pageSize=50&cursor=...`
- `GET /inventory/{itemInstanceId}`
- `POST /inventory/use` — `{ "itemInstanceId": "uuid", "targetType": "creature", "targetId": "uuid", "quantity": 1 }`
- `POST /inventory/{itemInstanceId}/lock`
- `POST /inventory/split` — Chỉ áp dụng cho vật phẩm có thể stack.

### 8.6. Inventory restrictions

Server phải xác nhận:

- Item thuộc quyền sở hữu.
- Item có thể sử dụng.
- Số lượng hợp lệ.
- Target hợp lệ.
- Không vượt stack limit.
- Item không bị khóa hoặc escrow.

---

## 9. ECONOMY API

### 9.1. Wallet

`GET /economy/wallet`

Response:

```json
{
  "success": true,
  "data": {
    "balances": [
      { "currency": "gold", "balance": 10000 },
      { "currency": "crystal", "balance": 500 },
      { "currency": "arena_token", "balance": 100 }
    ]
  }
}
```

### 9.2. Transaction history

`GET /economy/transactions`

### 9.3. Shop catalog

`GET /shop/catalog`

### 9.4. Purchase product

`POST /shop/purchase` — `{ "productId": "item_capture_orb_bundle", "quantity": 1 }`

Phải hỗ trợ Idempotency-Key.

### 9.5. Purchase validation

Server chịu trách nhiệm kiểm tra: Product đang hoạt động, Giá hiện tại, Giới hạn mua, Currency, Số dư, Điều kiện mở khóa, Thời gian event.

Không nhận giá mua do client tự gửi làm giá giao dịch chính thức.

---

## 10. WORLD API

- `GET /world/regions`
- `GET /world/maps` — Query: `?regionId=verdant_plains`
- `POST /world/enter` — `{ "mapId": "meadow_village" }`

Response:

```json
{
  "success": true,
  "data": {
    "zoneId": "zone_meadow_001",
    "instanceId": "uuid",
    "spawnPosition": { "x": 120, "y": 240 },
    "mapVersion": 1
  }
}
```

- `POST /world/interact` — `{ "objectId": "npc_village_elder", "interactionType": "talk" }`
- `POST /world/gather` — `{ "resourceNodeId": "resource_001" }` — Server kiểm tra khoảng cách, trạng thái node, thời gian hồi và điều kiện công cụ.
- `GET /world/state` — Trả về: Time of day, Weather, Active world events, Current zone information. Các thay đổi realtime sẽ được gửi qua WebSocket.

---

## 11. BATTLE API

### 11.1. Create battle

`POST /battle/create`

```json
{
  "battleType": "pve",
  "encounterId": "uuid",
  "teamId": "team_default"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "battleId": "uuid",
    "status": "preparing",
    "combatVersion": "1.0",
    "estimatedDuration": 120
  }
}
```

- `GET /battle/{battleId}`
- `GET /battle/{battleId}/result`
- `GET /battle/{battleId}/replay` — Response chứa replay metadata hoặc signed URL nếu replay được lưu ở Object Storage.

### 11.5. Battle team

- `GET /battle/teams`
- `POST /battle/teams`
- `PUT /battle/teams/{teamId}`
- `DELETE /battle/teams/{teamId}`

Mỗi team có tối đa 5 Eidolon.

### 11.6. Combat authority

Trong Auto Battle:

- Server tạo battle snapshot.
- Server chạy simulation.
- Client nhận combat events.
- Client render animation.
- Server xác nhận kết quả cuối cùng.

Không cho client tự gửi kết quả thắng hoặc thua.

---

## 12. QUEST & PROGRESSION API

- `GET /quests` — Query: `?type=main&status=active`
- `POST /quests/{questId}/accept`
- `GET /quests/{questId}/progress`
- `POST /quests/{questId}/claim` — Request: `{ "rewardSelection": "option_a" }`. Chỉ gửi rewardSelection khi quest có lựa chọn phần thưởng.
- `GET /achievements`
- `GET /achievements/{achievementId}`
- `POST /achievements/{achievementId}/claim`

### 12.6. Quest progress authority

Các sự kiện quan trọng như capture, battle completion, dungeon clear phải được ghi nhận từ server. Client không được tự gửi trạng thái quest hoàn thành.

---

## 13. SANCTUARY API

- `GET /sanctuary`
- `POST /sanctuary/build` — `{ "buildingId": "eidolon_habitat", "position": { "x": 10, "y": 12 } }`
- `POST /sanctuary/buildings/{buildingId}/upgrade`
- `POST /sanctuary/assign` — `{ "buildingId": "eidolon_habitat", "creatureInstanceId": "uuid" }`
- `POST /sanctuary/collect` — Server xác nhận thời gian sản xuất và số lượng phần thưởng.

---

## 14. DUNGEON & BOSS API

- `GET /dungeons`
- `POST /dungeons/{dungeonId}/enter`
- `GET /dungeons/{dungeonId}/state`
- `POST /dungeons/{dungeonId}/claim`
- `POST /bosses/{bossId}/challenge`
- `GET /bosses/{bossId}/state`

Server quản lý lượt đánh, thời gian, phần thưởng và trạng thái boss.

---

## 15. PVP API

- `GET /pvp/ranking` — Query: `?seasonId=season_01&pageSize=50&cursor=...`
- `POST /pvp/matchmaking` — `{ "mode": "ranked", "teamId": "team_default" }`
- `DELETE /pvp/matchmaking`
- `GET /pvp/matches/{matchId}`

### 15.5. PvP rules

- Rating được cập nhật bởi server.
- Team được snapshot trước trận.
- Disconnect phải có quy tắc xử lý.
- Không cho phép thay đổi đội hình sau khi trận đã bắt đầu.
- Reward phải có cơ chế chống claim trùng.

---

## 16. SOCIAL API

### 16.1. Friends

- `GET /friends`
- `POST /friends/request`
- `POST /friends/{playerId}/accept`
- `DELETE /friends/{playerId}`
- `POST /friends/{playerId}/block`

### 16.2. Party

- `POST /party/create`
- `POST /party/invite`
- `POST /party/{partyId}/join`
- `POST /party/{partyId}/leave`
- `GET /party/current`

### 16.3. Chat

Lịch sử chat dùng REST: `GET /chat/channels/{channelId}/messages`

Gửi và nhận message realtime qua WebSocket.

### 16.4. Chat moderation

- Rate limit.
- Message length limit.
- Block list.
- Report message.
- Moderator tools.
- Spam detection.

---

## 17. GUILD API

- `GET /guilds`
- `POST /guilds`
- `GET /guilds/{guildId}`
- `POST /guilds/{guildId}/join`
- `POST /guilds/{guildId}/leave`
- `POST /guilds/{guildId}/invite`
- `PATCH /guilds/{guildId}`
- `GET /guilds/{guildId}/members`
- `GET /guilds/{guildId}/ranking`
- `POST /guilds/{guildId}/donate`

Server phải xác nhận quyền của leader và officer trước các thao tác quản trị.

---

## 18. TRADING API

### 18.1. Create trade

`POST /trading/orders`

```json
{
  "receiverId": "uuid",
  "offeredItems": [
    { "itemInstanceId": "uuid", "quantity": 1 }
  ],
  "offeredCurrency": [
    { "currencyId": "gold", "amount": 1000 }
  ]
}
```

- `POST /trading/orders/{tradeId}/confirm`
- `POST /trading/orders/{tradeId}/cancel`
- `GET /trading/orders/{tradeId}`

### 18.5. Trading security

- Lock asset khi offer được tạo.
- Kiểm tra owner.
- Không cho trade item bị khóa.
- Không cho trade Eidolon đang tham gia đội hình hoặc bị khóa theo gameplay rules.
- Kiểm tra giới hạn số lượng.
- Có expiration.
- Ghi audit log.
- Chuyển tài sản trong một transaction.

---

## 19. EVENT API

- `GET /events`
- `GET /events/{eventId}`
- `GET /events/{eventId}/progress`
- `POST /events/{eventId}/claim`
- `GET /events/{eventId}/leaderboard`

Event data phải có thời gian bắt đầu và kết thúc theo server time.

---

## 20. WEBSOCKET ARCHITECTURE

### 20.1. Connection

`wss://api.eidolith.example.com/ws/v1`

Sau khi kết nối, client xác thực session bằng access token.

Token không nên truyền trong query string vì có thể bị ghi vào access log.

### 20.2. Message envelope

Tất cả message sử dụng cấu trúc:

```ts
interface GameMessage<T = unknown> {
  type: string;
  requestId?: string;
  sequence?: number;
  timestamp: number;
  payload: T;
}
```

### 20.3. Client-to-server messages

| Event | Purpose |
|---|---|
| auth.authenticate | Authenticate |
| world.move | Movement |
| world.interact | Interaction |
| world.ping | Heartbeat |
| party.invite | Invite |
| party.join | Join party |
| chat.send | Send message |
| battle.join | Join battle |
| battle.leave | Leave battle |
| matchmaking.cancel | Cancel queue |

### 20.4. Server-to-client messages

| Event | Purpose |
|---|---|
| auth.authenticated | Auth success |
| auth.failed | Auth failure |
| world.snapshot | Zone snapshot |
| world.entity.spawn | Entity spawn |
| world.entity.update | Entity update |
| world.entity.despawn | Entity despawn |
| world.player.move | Player movement |
| world.weather.update | Weather update |
| world.event.start | Event start |
| battle.started | Battle start |
| battle.event | Combat event |
| battle.completed | Battle result |
| party.updated | Party update |
| chat.message | New message |
| notification.push | Notification |
| system.error | System error |

---

## 21. WEBSOCKET MESSAGE EXAMPLES

### 21.1. Authenticate

Client:

```json
{
  "type": "auth.authenticate",
  "requestId": "req_001",
  "timestamp": 1794312000000,
  "payload": { "accessToken": "ACCESS_TOKEN" }
}
```

Server:

```json
{
  "type": "auth.authenticated",
  "requestId": "req_001",
  "timestamp": 1794312000100,
  "payload": { "playerId": "uuid", "serverTime": 1794312000100 }
}
```

### 21.2. Movement

Client:

```json
{
  "type": "world.move",
  "requestId": "move_001",
  "sequence": 100,
  "timestamp": 1794312001000,
  "payload": {
    "directionX": 1,
    "directionY": 0,
    "inputDurationMs": 100
  }
}
```

Client gửi input hoặc ý định di chuyển, không gửi tọa độ đích tùy ý để server chấp nhận.

Server:

```json
{
  "type": "world.player.move",
  "sequence": 100,
  "timestamp": 1794312001100,
  "payload": {
    "playerId": "uuid",
    "x": 120.5,
    "y": 240.2,
    "direction": 2,
    "state": "moving"
  }
}
```

### 21.3. Entity spawn

```json
{
  "type": "world.entity.spawn",
  "timestamp": 1794312001200,
  "payload": {
    "entityId": "npc_001",
    "entityType": "npc",
    "templateId": "village_elder",
    "position": { "x": 150, "y": 180 }
  }
}
```

### 21.4. Combat event

```json
{
  "type": "battle.event",
  "sequence": 120,
  "timestamp": 1794312005000,
  "payload": {
    "battleId": "uuid",
    "tick": 120,
    "eventType": "damage",
    "sourceUnitId": "unit_001",
    "targetUnitId": "unit_002",
    "damage": 125,
    "element": "flame"
  }
}
```

### 21.5. Battle completed

```json
{
  "type": "battle.completed",
  "timestamp": 1794312100000,
  "payload": {
    "battleId": "uuid",
    "result": "victory",
    "durationMs": 95000,
    "rewards": { "gold": 100, "experience": 250 }
  }
}
```

Client chỉ hiển thị kết quả được server xác nhận.

---

## 22. WEBSOCKET RECONNECT

### 22.1. Reconnect procedure

1. Phát hiện connection lost.
2. Chuyển trạng thái UI sang reconnecting.
3. Thử kết nối lại bằng exponential backoff.
4. Refresh access token nếu cần.
5. Authenticate lại.
6. Gửi yêu cầu resume session.
7. Server kiểm tra session.
8. Server gửi snapshot mới.
9. Client khôi phục trạng thái.

### 22.2. Resume message

Client:

```json
{
  "type": "session.resume",
  "requestId": "resume_001",
  "timestamp": 1794312200000,
  "payload": {
    "lastKnownSequence": 120,
    "zoneId": "zone_meadow_001"
  }
}
```

Server quyết định gửi event còn thiếu hay gửi snapshot đầy đủ tùy trạng thái lưu trữ.

### 22.3. Reconnect rules

- Không phát lại request giao dịch đã hoàn thành.
- Không tạo battle mới khi battle cũ còn tồn tại.
- Không tạo encounter trùng.
- Không cộng reward lần thứ hai.
- Không tin trạng thái local khi server đã có snapshot mới hơn.

---

## 23. ERROR CODE REGISTRY

### 23.1. Authentication

| Code | Description |
|---|---|
| AUTH_INVALID_CREDENTIALS | Sai thông tin đăng nhập |
| AUTH_TOKEN_EXPIRED | Token hết hạn |
| AUTH_TOKEN_REVOKED | Token bị thu hồi |
| AUTH_ACCOUNT_BANNED | Tài khoản bị khóa |
| AUTH_EMAIL_NOT_VERIFIED | Chưa xác minh email |

### 23.2. Player

| Code | Description |
|---|---|
| PLAYER_NOT_FOUND | Không tìm thấy player |
| PLAYER_NAME_TAKEN | Tên đã tồn tại |
| PLAYER_INVALID_NAME | Tên không hợp lệ |
| PLAYER_LEVEL_TOO_LOW | Cấp độ không đủ |

### 23.3. Creature

| Code | Description |
|---|---|
| CREATURE_NOT_FOUND | Không tìm thấy Eidolon |
| CREATURE_NOT_OWNED | Không sở hữu Eidolon |
| CREATURE_LOCKED | Eidolon đang khóa |
| CREATURE_MAX_LEVEL | Đã đạt cấp tối đa |
| CREATURE_EVOLUTION_INVALID | Nhánh tiến hóa không hợp lệ |
| CREATURE_SKILL_INVALID | Skill không hợp lệ |

### 23.4. Inventory & Economy

| Code | Description |
|---|---|
| ITEM_NOT_FOUND | Không tìm thấy item |
| ITEM_NOT_OWNED | Không sở hữu item |
| ITEM_INSUFFICIENT | Không đủ số lượng |
| INVENTORY_FULL | Túi đồ đầy |
| INSUFFICIENT_CURRENCY | Không đủ currency |
| PURCHASE_LIMIT_REACHED | Đạt giới hạn mua |
| IDEMPOTENCY_CONFLICT | Request bị trùng hoặc xung đột |

### 23.5. World & Battle

| Code | Description |
|---|---|
| WORLD_INVALID_MAP | Map không hợp lệ |
| WORLD_ZONE_FULL | Zone đầy |
| WORLD_INVALID_POSITION | Vị trí không hợp lệ |
| ENCOUNTER_EXPIRED | Encounter hết hạn |
| ENCOUNTER_NOT_FOUND | Không tìm thấy encounter |
| BATTLE_NOT_FOUND | Không tìm thấy battle |
| BATTLE_ALREADY_STARTED | Battle đã bắt đầu |
| BATTLE_TEAM_INVALID | Đội hình không hợp lệ |

### 23.6. Trading & Social

| Code | Description |
|---|---|
| TRADE_NOT_FOUND | Không tìm thấy giao dịch |
| TRADE_EXPIRED | Giao dịch hết hạn |
| TRADE_ALREADY_COMPLETED | Đã hoàn thành |
| TRADE_ASSET_LOCKED | Tài sản đang khóa |
| PARTY_NOT_FOUND | Không tìm thấy party |
| GUILD_PERMISSION_DENIED | Không đủ quyền guild |

### 23.7. HTTP status mapping

| HTTP | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Invalid request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Service unavailable |

---

## 24. RATE LIMITING

Rate limit cần được áp dụng theo endpoint và loại hoạt động.

| Category | Policy |
|---|---|
| Login | Strict |
| Password Reset | Strict |
| Profile Update | Moderate |
| Movement | Realtime throttling |
| Chat | Message throttling |
| Summoning | Transaction protection |
| Shop Purchase | Transaction protection |
| Trading | Strict |
| Admin API | Very strict |

Không dùng một mức rate limit chung cho toàn bộ API.

Server phải trả HTTP 429 và thông tin thời gian chờ phù hợp khi vượt giới hạn.

---

## 25. API SECURITY

- HTTPS bắt buộc.
- WSS bắt buộc.
- Access token ngắn hạn.
- Refresh token rotation.
- Request validation.
- Authorization ở từng endpoint.
- Idempotency cho thao tác tài sản.
- Rate limiting.
- CORS allowlist.
- Không để lộ stack trace.
- Không log token.
- WebSocket authenticate trước khi tham gia zone.
- Admin API có quyền riêng.
- Kiểm tra chữ ký webhook từ payment provider.

---

## 26. CLIENT NETWORK MANAGER

Game Client cần có một lớp Network Manager thống nhất.

```ts
interface NetworkManager {
  connect(): Promise<void>;
  disconnect(): void;
  request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T>;
  send(
    type: string,
    payload: unknown
  ): void;
  subscribe(
    event: string,
    callback: (payload: unknown) => void
  ): () => void;
  reconnect(): Promise<void>;
}
```

Các module gameplay không được tự tạo kết nối WebSocket riêng.

### 26.1. Network states

```ts
type ConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "AUTHENTICATING"
  | "FAILED";
```

### 26.2. Client-side responsibilities

- Request timeout.
- Retry policy.
- Token refresh.
- Message dispatch.
- Sequence tracking.
- Duplicate detection.
- Reconnect.
- Error handling.
- Local prediction.
- Snapshot reconciliation.

---

## 27. END-TO-END GAMEPLAY FLOWS

### 27.1. Login to world

```
Client
  |
  | POST /auth/login
  v
Authentication Service
  |
  | Access Token
  v
Client
  |
  | WebSocket Connect
  v
WebSocket Gateway
  |
  | auth.authenticate
  v
Game Server
  |
  | auth.authenticated
  v
Client
  |
  | POST /world/enter
  v
World Service
  |
  | Zone Snapshot
  v
Client
  |
  | Render World
  v
Player Gameplay
```

### 27.2. Wild Eidolon capture

```
Player approaches spawn
          |
          v
Client requests encounter
          |
          v
Server validates position
          |
          v
Encounter created
          |
          v
Player uses capture item
          |
          v
Server calculates result
          |
      +---+---+
      |       |
    Success  Failed
      |       |
      v       v
Create      Consume item
instance    and resolve
      |       |
      +---+---+
          |
          v
Update collection and inventory
```

### 27.3. Battle flow

```
Player selects team
          |
          v
Create battle request
          |
          v
Server validates team
          |
          v
Create battle snapshot
          |
          v
Run Combat Engine
          |
          v
Publish combat events
          |
          v
Client renders battle
          |
          v
Server completes battle
          |
          v
Save result and rewards
          |
          v
Client receives result
```

### 27.4. Purchase flow

```
Client requests purchase
          |
          v
Server validates product
          |
          v
Lock wallet
          |
          v
Check balance
          |
          v
Deduct currency
          |
          v
Grant item
          |
          v
Write transaction log
          |
          v
Commit
          |
          v
Return success
```

---

## 28. API VERSIONING

API path sử dụng:

```
/api/v1
/ws/v1
```

Khi có thay đổi phá vỡ tương thích:

- Tạo version mới.
- Duy trì version cũ trong thời gian chuyển đổi.
- Công bố thời gian ngừng hỗ trợ.
- Kiểm thử client compatibility.

Các thay đổi thêm field không bắt buộc có thể tương thích nếu client xử lý field chưa biết một cách an toàn.

---

## 29. ACCEPTANCE CRITERIA

| ID | Requirement |
|---|---|
| API-001 | Đăng ký và đăng nhập thành công |
| API-002 | Token refresh hoạt động |
| API-003 | Player profile truy xuất chính xác |
| API-004 | Collection trả về đúng Eidolon |
| API-005 | Capture được server xác nhận |
| API-006 | Summoning không thể giả mạo |
| API-007 | Inventory transaction an toàn |
| API-008 | World movement đồng bộ |
| API-009 | Battle events được phát đúng thứ tự |
| API-010 | Battle result chỉ do server xác nhận |
| API-011 | Quest reward không thể claim trùng |
| API-012 | Trading bảo vệ tài sản |
| API-013 | WebSocket reconnect hoạt động |
| API-014 | Rate limit hoạt động |
| API-015 | Error code nhất quán |
| API-016 | API có logging và request ID |

---

## 30. FINAL API DECISIONS

| Component | Standard |
|---|---|
| REST API | JSON |
| Base Path | /api/v1 |
| Realtime | WebSocket |
| WS Path | /ws/v1 |
| Authentication | Bearer Token |
| Refresh | Rotating Refresh Token |
| Pagination | Cursor |
| Errors | Standard Error Registry |
| Transactions | Idempotency |
| Movement | Client Input + Server Authority |
| Combat | Server Simulation |
| Chat | WebSocket |
| Replay | REST + Object Storage |
| Versioning | URL Versioning |

*END OF PART 6 – API & WEBSOCKET PROTOCOL SPECIFICATION v1.0*
