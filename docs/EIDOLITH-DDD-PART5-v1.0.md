# EIDOLITH – DATABASE DESIGN DOCUMENT

## PART 5: DATABASE SCHEMA & DATA MANAGEMENT SPECIFICATION

**Project:** EIDOLITH – The Forgotten Wilds
**Document:** Database Design Document (DDD)
**Version:** 1.0
**Database Engine:** PostgreSQL
**Cache:** Redis
**Backend:** Node.js + TypeScript
**Schema Strategy:** Relational + JSONB for flexible configuration
**Status:** Development Specification

> Tài liệu này là bản DDD Part 5 v1.0 do Tín gửi ngày 2026-11-10, lưu nguyên văn (chỉ chuyển định dạng sang Markdown).

---

## 1. DATABASE ARCHITECTURE

### 1.1. Mục tiêu

Database phải hỗ trợ:

- Tài khoản và hồ sơ người chơi.
- Nhân vật Wanderer.
- Eidolon collection.
- Creature progression và evolution.
- Skill, trait, equipment.
- Inventory và currency.
- World map và spawn.
- Quest và achievement.
- Battle và replay.
- Dungeon và boss.
- PvP và ranking.
- Friends, party và guild.
- Trading.
- Shop, purchase và event.
- Audit log và anti-cheat.

### 1.2. Database principles

1. PostgreSQL là nguồn dữ liệu lâu dài.
2. Redis chỉ dùng cho cache và realtime state.
3. Các bảng quan trọng sử dụng primary key.
4. Các quan hệ quan trọng phải có foreign key.
5. Giao dịch tài sản phải có transaction.
6. Không lưu tiền tệ bằng floating point.
7. Dữ liệu gameplay có version.
8. Dữ liệu lịch sử quan trọng không được xóa tùy tiện.
9. Dữ liệu linh hoạt có thể sử dụng JSONB.
10. Không lưu trạng thái realtime tần suất cao trực tiếp vào PostgreSQL theo từng frame.

### 1.3. Schema organization

```
eidolith
├── auth
├── players
├── creatures
├── world
├── combat
├── progression
├── inventory
├── economy
├── social
├── guild
├── trading
├── events
├── operations
└── analytics
```

MVP có thể triển khai chung một PostgreSQL database nhưng phân chia schema logic để quản lý.

---

## 2. ACCOUNT & PLAYER DATABASE

### 2.1. users

Lưu thông tin tài khoản.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email |
| username | VARCHAR(32) | Username |
| password_hash | TEXT | Password hash |
| status | VARCHAR(20) | Account status |
| email_verified_at | TIMESTAMPTZ | Verification |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |
| last_login_at | TIMESTAMPTZ | Last login |

Constraints:

- id là primary key.
- Email unique nếu được cung cấp.
- Username unique.
- Password không lưu dạng plain text.
- Status giới hạn: active, suspended, banned, deleted.

### 2.2. player_profiles

Thông tin nhân vật Wanderer.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK users |
| display_name | VARCHAR(32) | Character name |
| avatar_id | VARCHAR(64) | Avatar |
| level | INTEGER | Player level |
| experience | BIGINT | Experience |
| current_region_id | VARCHAR(64) | Current region |
| current_map_id | VARCHAR(64) | Current map |
| position_x | REAL | Last known X |
| position_y | REAL | Last known Y |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

Một tài khoản MVP có một player profile. Nếu sau này hỗ trợ nhiều nhân vật, có thể mở rộng quan hệ một-nhiều.

### 2.3. player_settings

| Column | Type | Description |
|---|---|---|
| player_id | UUID | PK, FK |
| language | VARCHAR(10) | Language |
| music_volume | SMALLINT | Music volume |
| sfx_volume | SMALLINT | Sound volume |
| graphics_quality | VARCHAR(20) | Quality |
| notifications_enabled | BOOLEAN | Notification |
| updated_at | TIMESTAMPTZ | Updated |

### 2.4. player_sessions

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK users |
| device_id | VARCHAR(128) | Device identifier |
| refresh_token_hash | TEXT | Token hash |
| expires_at | TIMESTAMPTZ | Expiration |
| revoked_at | TIMESTAMPTZ | Revocation |
| created_at | TIMESTAMPTZ | Created |

Không lưu refresh token nguyên bản.

### 2.5. player_progress

Lưu tiến trình tổng thể.

| Column | Type | Description |
|---|---|---|
| player_id | UUID | PK, FK |
| main_story_stage | VARCHAR(64) | Story stage |
| tutorial_completed | BOOLEAN | Tutorial |
| unlocked_regions | JSONB | Unlocked regions |
| unlocked_features | JSONB | Unlocked features |
| total_playtime_seconds | BIGINT | Playtime |
| updated_at | TIMESTAMPTZ | Updated |

---

## 3. CREATURE DATABASE

### 3.1. creatures

Định nghĩa Eidolon gốc. Đây là dữ liệu template, không phải Eidolon riêng của người chơi.

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Name |
| element | VARCHAR(20) | Element |
| rarity | VARCHAR(20) | Rarity |
| role | VARCHAR(20) | Role |
| description | TEXT | Description |
| base_stats | JSONB | Base stats |
| growth_curve_id | VARCHAR(64) | Growth curve |
| asset_key | VARCHAR(128) | Asset reference |
| content_version | INTEGER | Data version |
| is_active | BOOLEAN | Availability |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

Ví dụ base_stats:

```json
{
  "hp": 100,
  "atk": 25,
  "def": 10,
  "spd": 15
}
```

### 3.2. creature_instances

Mỗi Eidolon mà người chơi sở hữu là một instance riêng.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| creature_id | VARCHAR(64) | FK creatures |
| nickname | VARCHAR(32) | Nickname |
| level | INTEGER | Level |
| experience | BIGINT | Experience |
| evolution_stage | SMALLINT | Evolution stage |
| bond_level | SMALLINT | Bond |
| acquired_method | VARCHAR(32) | Capture, summon, reward |
| acquired_at | TIMESTAMPTZ | Acquired |
| is_favorite | BOOLEAN | Favorite |
| locked_at | TIMESTAMPTZ | Protection lock |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

### 3.3. creature_instance_stats

Lưu chỉ số đã tính toán hoặc chỉ số cá nhân.

| Column | Type | Description |
|---|---|---|
| creature_instance_id | UUID | PK, FK |
| hp_bonus | INTEGER | HP bonus |
| atk_bonus | INTEGER | ATK bonus |
| def_bonus | INTEGER | DEF bonus |
| spd_bonus | INTEGER | SPD bonus |
| stat_revision | INTEGER | Revision |
| updated_at | TIMESTAMPTZ | Updated |

Base stats được lấy từ template và growth curve. Chỉ lưu các giá trị bổ sung cần thiết, tránh lưu trùng toàn bộ dữ liệu có thể tính lại.

### 3.4. creature_skills

Danh sách skill được học hoặc mở khóa.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| creature_instance_id | UUID | FK instance |
| skill_id | VARCHAR(64) | Skill template |
| slot_index | SMALLINT | Skill slot |
| unlocked_at | TIMESTAMPTZ | Unlock time |

### 3.5. creature_traits

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| creature_instance_id | UUID | FK instance |
| trait_id | VARCHAR(64) | Trait template |
| source | VARCHAR(32) | Source |
| created_at | TIMESTAMPTZ | Created |

### 3.6. creature_evolutions

Bảng template mô tả nhánh tiến hóa.

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| source_creature_id | VARCHAR(64) | Source creature |
| target_creature_id | VARCHAR(64) | Target creature |
| required_level | INTEGER | Required level |
| required_items | JSONB | Item requirements |
| required_bond | INTEGER | Bond requirement |
| branch_key | VARCHAR(64) | Evolution branch |
| is_active | BOOLEAN | Active |

Việc tiến hóa phải được xử lý trong transaction để không trừ nguyên liệu nhiều lần.

### 3.7. creature_bonds

| Column | Type | Description |
|---|---|---|
| creature_instance_id | UUID | PK, FK |
| bond_xp | BIGINT | Bond experience |
| bond_level | SMALLINT | Current bond |
| last_updated_at | TIMESTAMPTZ | Updated |

### 3.8. creature_equipment

| Column | Type | Description |
|---|---|---|
| creature_instance_id | UUID | PK, FK |
| slot_type | VARCHAR(32) | Equipment slot |
| inventory_item_id | UUID | Equipped item |
| equipped_at | TIMESTAMPTZ | Equipped time |

Một item không thể đồng thời được trang bị bởi nhiều Eidolon.

---

## 4. COMBAT DATABASE

### 4.1. battle_sessions

Thông tin trận đấu.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| battle_type | VARCHAR(32) | PVE, PVP, DUNGEON, BOSS |
| status | VARCHAR(20) | Status |
| seed | BIGINT | RNG seed |
| combat_version | VARCHAR(32) | Engine version |
| duration_ms | INTEGER | Duration |
| started_at | TIMESTAMPTZ | Start |
| completed_at | TIMESTAMPTZ | Completion |
| result_data | JSONB | Result summary |

### 4.2. battle_participants

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| battle_id | UUID | FK battle_sessions |
| player_id | UUID | FK player_profiles |
| team_index | SMALLINT | Team |
| result | VARCHAR(16) | Win, lose, draw |
| rating_before | INTEGER | Rating before |
| rating_after | INTEGER | Rating after |

### 4.3. battle_units

Snapshot Eidolon tại thời điểm trận đấu.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| battle_id | UUID | FK battle |
| participant_id | UUID | FK participant |
| creature_instance_id | UUID | Original instance |
| creature_id | VARCHAR(64) | Creature template |
| initial_stats | JSONB | Battle stats |
| initial_skills | JSONB | Skill snapshot |
| initial_traits | JSONB | Trait snapshot |
| position_x | REAL | Initial X |
| position_y | REAL | Initial Y |

Snapshot giúp replay không bị thay đổi khi người chơi nâng cấp Eidolon sau trận đấu.

### 4.4. battle_actions

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| battle_id | UUID | FK battle |
| tick | INTEGER | Simulation tick |
| sequence | INTEGER | Event sequence |
| actor_unit_id | UUID | Actor |
| action_type | VARCHAR(32) | Action |
| payload | JSONB | Action data |

### 4.5. battle_replays

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| battle_id | UUID | FK battle |
| replay_version | INTEGER | Replay format |
| storage_key | TEXT | Object storage key |
| checksum | VARCHAR(128) | Checksum |
| size_bytes | BIGINT | File size |
| created_at | TIMESTAMPTZ | Created |

Replay dung lượng lớn có thể lưu ở Object Storage, chỉ lưu metadata và reference trong PostgreSQL.

---

## 5. WORLD DATABASE

### 5.1. world_regions

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Region name |
| description | TEXT | Description |
| recommended_level_min | INTEGER | Minimum level |
| recommended_level_max | INTEGER | Maximum level |
| sort_order | INTEGER | Display order |
| is_unlocked_by_default | BOOLEAN | Default unlock |

### 5.2. world_zones

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| region_id | VARCHAR(64) | FK region |
| name | VARCHAR(100) | Zone name |
| zone_type | VARCHAR(32) | Village, Forest, Lake |
| map_id | VARCHAR(64) | Map template |
| player_capacity | INTEGER | Capacity |
| is_active | BOOLEAN | Active |

### 5.3. world_maps

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Map name |
| map_asset_key | TEXT | JSON map asset |
| tileset_version | INTEGER | Tileset version |
| width | INTEGER | Width |
| height | INTEGER | Height |
| tile_width | INTEGER | Tile width |
| tile_height | INTEGER | Tile height |
| navigation_asset_key | TEXT | Navigation data |
| content_version | INTEGER | Version |

### 5.4. world_objects

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| map_id | VARCHAR(64) | FK map |
| object_type | VARCHAR(32) | NPC, portal, chest |
| object_key | VARCHAR(64) | Template ID |
| position_x | REAL | X |
| position_y | REAL | Y |
| interaction_radius | REAL | Radius |
| properties | JSONB | Configuration |

### 5.5. spawn_tables

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| map_id | VARCHAR(64) | FK map |
| creature_id | VARCHAR(64) | FK creature |
| weight | INTEGER | Spawn weight |
| min_level | INTEGER | Min level |
| max_level | INTEGER | Max level |
| time_conditions | JSONB | Time conditions |
| weather_conditions | JSONB | Weather conditions |
| respawn_seconds | INTEGER | Respawn |

### 5.6. zone_instances

Đây là dữ liệu runtime, có thể giữ trong Redis ở MVP.

Nếu cần persistence hoặc audit:

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| zone_id | VARCHAR(64) | Zone |
| instance_number | INTEGER | Instance |
| status | VARCHAR(20) | Status |
| created_at | TIMESTAMPTZ | Created |
| closed_at | TIMESTAMPTZ | Closed |

Không ghi toàn bộ movement của người chơi xuống PostgreSQL liên tục.

---

## 6. INVENTORY DATABASE

### 6.1. items

Template vật phẩm.

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Name |
| category | VARCHAR(32) | Category |
| rarity | VARCHAR(20) | Rarity |
| description | TEXT | Description |
| stack_limit | INTEGER | Max stack |
| is_tradeable | BOOLEAN | Tradeable |
| is_consumable | BOOLEAN | Consumable |
| properties | JSONB | Item properties |
| is_active | BOOLEAN | Active |

### 6.2. inventory

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| item_id | VARCHAR(64) | FK item |
| quantity | BIGINT | Quantity |
| metadata | JSONB | Instance data |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

Đối với vật phẩm có tính chất độc lập, ví dụ equipment có chỉ số riêng, cần lưu instance riêng thay vì gộp thành stack.

### 6.3. item_instances

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| item_id | VARCHAR(64) | Template |
| enhancement_level | SMALLINT | Enhancement |
| random_attributes | JSONB | Attributes |
| locked_at | TIMESTAMPTZ | Lock |
| created_at | TIMESTAMPTZ | Created |

### 6.4. inventory_history

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| item_id | VARCHAR(64) | Item |
| quantity_change | BIGINT | Change |
| reason | VARCHAR(64) | Reason |
| reference_id | VARCHAR(128) | Source reference |
| created_at | TIMESTAMPTZ | Created |

History giúp truy vết item được thêm hoặc tiêu thụ từ đâu.

---

## 7. ECONOMY DATABASE

### 7.1. currency_types

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(32) | Primary key |
| name | VARCHAR(64) | Currency name |
| is_premium | BOOLEAN | Premium currency |
| is_tradeable | BOOLEAN | Tradeable |
| is_active | BOOLEAN | Active |

Các currency mặc định:

- Gold
- Crystal
- Bond Essence
- Evolution Core
- Arena Token
- Guild Coin
- Research Data

### 7.2. player_wallets

| Column | Type | Description |
|---|---|---|
| player_id | UUID | FK player |
| currency_id | VARCHAR(32) | FK currency |
| balance | BIGINT | Balance |
| updated_at | TIMESTAMPTZ | Updated |

Primary key: (player_id, currency_id).

### 7.3. currency_transactions

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| currency_id | VARCHAR(32) | Currency |
| amount | BIGINT | Signed amount |
| balance_after | BIGINT | Balance after |
| transaction_type | VARCHAR(32) | Type |
| reference_id | VARCHAR(128) | Reference |
| idempotency_key | VARCHAR(128) | Idempotency |
| created_at | TIMESTAMPTZ | Created |

Các giao dịch phải được ghi trong cùng transaction với thao tác cập nhật wallet.

### 7.4. purchases

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Buyer |
| product_id | VARCHAR(64) | Product |
| payment_method | VARCHAR(32) | Payment method |
| amount_minor | BIGINT | Amount in smallest unit |
| currency_code | VARCHAR(8) | ISO currency |
| status | VARCHAR(20) | Payment status |
| provider_reference | VARCHAR(128) | Provider reference |
| created_at | TIMESTAMPTZ | Created |
| completed_at | TIMESTAMPTZ | Completed |

Không lưu dữ liệu thẻ thanh toán trực tiếp. Giao dịch tiền thật phải được xác nhận từ payment provider hoặc nền tảng phân phối ứng dụng.

---

## 8. PROGRESSION DATABASE

### 8.1. quests

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Quest name |
| quest_type | VARCHAR(32) | Main, side, daily |
| requirements | JSONB | Requirements |
| rewards | JSONB | Rewards |
| prerequisites | JSONB | Prerequisites |
| is_repeatable | BOOLEAN | Repeatable |
| is_active | BOOLEAN | Active |

### 8.2. player_quests

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Owner |
| quest_id | VARCHAR(64) | Quest |
| status | VARCHAR(20) | Status |
| progress | JSONB | Progress |
| accepted_at | TIMESTAMPTZ | Accepted |
| completed_at | TIMESTAMPTZ | Completed |
| claimed_at | TIMESTAMPTZ | Claimed |

Unique constraint phù hợp phải ngăn người chơi nhận cùng một nhiệm vụ không lặp lại nhiều lần.

### 8.3. achievements

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Name |
| requirements | JSONB | Requirements |
| rewards | JSONB | Rewards |

### 8.4. player_achievements

| Column | Type | Description |
|---|---|---|
| player_id | UUID | FK player |
| achievement_id | VARCHAR(64) | FK achievement |
| progress | JSONB | Progress |
| unlocked_at | TIMESTAMPTZ | Unlock |

---

## 9. SOCIAL DATABASE

### 9.1. player_friends

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| requester_id | UUID | Requester |
| receiver_id | UUID | Receiver |
| status | VARCHAR(20) | Pending, accepted, blocked |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

Không cho phép tạo quan hệ bạn bè trùng lặp theo hai chiều.

### 9.2. player_blocks

| Column | Type | Description |
|---|---|---|
| player_id | UUID | Blocker |
| blocked_player_id | UUID | Blocked |
| created_at | TIMESTAMPTZ | Created |

### 9.3. chat_channels

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| channel_type | VARCHAR(20) | World, party, guild |
| reference_id | VARCHAR(128) | Related entity |
| created_at | TIMESTAMPTZ | Created |

### 9.4. chat_messages

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| channel_id | UUID | FK channel |
| sender_id | UUID | Sender |
| message_type | VARCHAR(20) | Text, system |
| content | TEXT | Message |
| created_at | TIMESTAMPTZ | Created |
| deleted_at | TIMESTAMPTZ | Moderation |

Chat phải có giới hạn độ dài, rate limit và cơ chế moderation.

---

## 10. GUILD DATABASE

### 10.1. guilds

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR(32) | Guild name |
| tag | VARCHAR(8) | Guild tag |
| leader_id | UUID | Leader |
| level | INTEGER | Level |
| experience | BIGINT | Experience |
| description | TEXT | Description |
| settings | JSONB | Settings |
| created_at | TIMESTAMPTZ | Created |

### 10.2. guild_members

| Column | Type | Description |
|---|---|---|
| guild_id | UUID | FK guild |
| player_id | UUID | FK player |
| role | VARCHAR(20) | Role |
| contribution | BIGINT | Contribution |
| joined_at | TIMESTAMPTZ | Joined |

Primary key: (guild_id, player_id).

### 10.3. guild_transactions

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| guild_id | UUID | Guild |
| player_id | UUID | Contributor |
| currency_id | VARCHAR(32) | Currency |
| amount | BIGINT | Amount |
| transaction_type | VARCHAR(32) | Type |
| created_at | TIMESTAMPTZ | Created |

---

## 11. TRADING DATABASE

### 11.1. trade_orders

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| seller_id | UUID | Seller |
| buyer_id | UUID | Buyer |
| status | VARCHAR(20) | Status |
| expires_at | TIMESTAMPTZ | Expiry |
| created_at | TIMESTAMPTZ | Created |
| completed_at | TIMESTAMPTZ | Completed |

### 11.2. trade_order_items

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| trade_order_id | UUID | FK order |
| item_instance_id | UUID | Offered item |
| quantity | BIGINT | Quantity |
| locked_at | TIMESTAMPTZ | Lock |

### 11.3. trade_confirmations

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| trade_order_id | UUID | FK order |
| player_id | UUID | Confirming player |
| confirmed_at | TIMESTAMPTZ | Confirmed |

Trading phải khóa tài sản, kiểm tra quyền sở hữu và hoàn tất chuyển giao trong transaction.

---

## 12. EVENT DATABASE

### 12.1. game_events

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Event name |
| event_type | VARCHAR(32) | Event type |
| configuration | JSONB | Configuration |
| starts_at | TIMESTAMPTZ | Start |
| ends_at | TIMESTAMPTZ | End |
| status | VARCHAR(20) | Status |

### 12.2. player_event_progress

| Column | Type | Description |
|---|---|---|
| player_id | UUID | Player |
| event_id | VARCHAR(64) | Event |
| progress | JSONB | Progress |
| score | BIGINT | Score |
| reward_claimed | BOOLEAN | Claimed |
| updated_at | TIMESTAMPTZ | Updated |

### 12.3. reward_claims

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Player |
| source_type | VARCHAR(32) | Quest, event, achievement |
| source_id | VARCHAR(128) | Source |
| reward_data | JSONB | Reward |
| claimed_at | TIMESTAMPTZ | Claimed |

Phải có unique key phù hợp để không thể claim cùng một phần thưởng nhiều lần.

---

## 13. PVP DATABASE

### 13.1. pvp_ratings

| Column | Type | Description |
|---|---|---|
| player_id | UUID | PK, FK player |
| rating | INTEGER | Rating |
| tier | VARCHAR(32) | Tier |
| wins | INTEGER | Wins |
| losses | INTEGER | Losses |
| season_id | VARCHAR(64) | Season |
| updated_at | TIMESTAMPTZ | Updated |

### 13.2. pvp_seasons

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(64) | Primary key |
| name | VARCHAR(100) | Season name |
| starts_at | TIMESTAMPTZ | Start |
| ends_at | TIMESTAMPTZ | End |
| status | VARCHAR(20) | Status |

### 13.3. pvp_matchmaking

Trạng thái matchmaking ngắn hạn nên lưu trong Redis.

PostgreSQL chỉ lưu kết quả và lịch sử trận đấu.

---

## 14. ADMIN & AUDIT DATABASE

### 14.1. admin_users

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email |
| password_hash | TEXT | Password hash |
| role_id | UUID | Role |
| status | VARCHAR(20) | Status |
| created_at | TIMESTAMPTZ | Created |

### 14.2. admin_roles

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR(64) | Role |
| permissions | JSONB | Permissions |

### 14.3. admin_audit_logs

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| admin_id | UUID | Admin |
| action | VARCHAR(64) | Action |
| target_type | VARCHAR(64) | Target type |
| target_id | VARCHAR(128) | Target ID |
| before_data | JSONB | Before |
| after_data | JSONB | After |
| ip_address | INET | IP |
| created_at | TIMESTAMPTZ | Created |

---

## 15. DATABASE RELATIONSHIPS

### 15.1. Core relationships

```
users
 └── player_profiles
      ├── player_settings
      ├── player_progress
      ├── creature_instances
      │    ├── creature_skills
      │    ├── creature_traits
      │    ├── creature_bonds
      │    └── creature_equipment
      │
      ├── inventory
      ├── player_wallets
      ├── player_quests
      ├── player_achievements
      ├── player_friends
      ├── guild_members
      ├── pvp_ratings
      └── battle_participants

creatures
 ├── creature_instances
 ├── creature_evolutions
 └── spawn_tables

battle_sessions
 ├── battle_participants
 ├── battle_units
 ├── battle_actions
 └── battle_replays

world_regions
 └── world_zones
      └── world_maps
           ├── world_objects
           └── spawn_tables
```

---

## 16. INDEXING STRATEGY

Các truy vấn quan trọng phải có index.

Ví dụ:

```sql
CREATE INDEX idx_profiles_user
ON players.player_profiles(user_id);
CREATE INDEX idx_creature_owner
ON creatures.creature_instances(player_id);
CREATE INDEX idx_creature_template
ON creatures.creature_instances(creature_id);
CREATE INDEX idx_inventory_owner
ON inventory.inventory(player_id);
CREATE INDEX idx_battle_created
ON combat.battle_sessions(started_at DESC);
CREATE INDEX idx_battle_participant
ON combat.battle_participants(player_id, battle_id);
CREATE INDEX idx_chat_channel_time
ON social.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_guild_members_player
ON guild.guild_members(player_id);
CREATE INDEX idx_trade_status_expiry
ON trading.trade_orders(status, expires_at);
CREATE INDEX idx_quest_player_status
ON progression.player_quests(player_id, status);
```

Index cần được đánh giá dựa trên query thực tế. Không tạo index tràn lan vì chúng làm tăng chi phí ghi dữ liệu.

---

## 17. TRANSACTION SPECIFICATION

### 17.1. Summoning transaction

Quy trình:

1. Lock wallet row.
2. Kiểm tra số dư.
3. Kiểm tra banner và pity.
4. Trừ currency.
5. Tạo creature instance hoặc shard.
6. Cập nhật pity.
7. Ghi transaction log.
8. Commit.

Nếu thất bại phải rollback toàn bộ.

### 17.2. Evolution transaction

1. Lock creature instance.
2. Kiểm tra level.
3. Kiểm tra bond.
4. Kiểm tra evolution branch.
5. Lock inventory item.
6. Trừ nguyên liệu.
7. Cập nhật creature template hoặc tạo instance tiến hóa theo quy ước dữ liệu.
8. Ghi lịch sử.
9. Commit.

### 17.3. Quest reward transaction

1. Lock player quest.
2. Kiểm tra trạng thái completed.
3. Kiểm tra chưa claim.
4. Cấp currency và item.
5. Ghi reward claim.
6. Cập nhật trạng thái claimed.
7. Commit.

### 17.4. Trading transaction

1. Lock trade order.
2. Lock tài sản liên quan.
3. Kiểm tra hai bên.
4. Kiểm tra offer.
5. Chuyển item và currency.
6. Ghi lịch sử.
7. Cập nhật trạng thái completed.
8. Commit.

---

## 18. REDIS DATA STRUCTURE

Redis sử dụng cho dữ liệu tạm thời.

| Key Pattern | Type | Purpose |
|---|---|---|
| session:{id} | Hash | Session |
| player:online:{id} | String | Online state |
| zone:{id}:players | Set | Player list |
| zone:{id}:entities | Hash | Entity state |
| matchmaking:{mode} | Sorted Set | Matchmaking |
| rate_limit:{key} | String | Rate limit |
| leaderboard:{season} | Sorted Set | Ranking cache |
| presence:{player} | Hash | Presence |

Quy tắc:

- Có TTL cho dữ liệu tạm thời.
- Không xem Redis là nguồn dữ liệu duy nhất của tài sản.
- Có cơ chế phục hồi khi Redis restart.
- Dữ liệu cần giữ lâu dài phải được ghi xuống PostgreSQL.

---

## 19. MIGRATION & SEED DATA

### 19.1. Migration

Mỗi thay đổi cấu trúc database phải có migration.

Ví dụ:

```
database/migrations/
├── 001_create_auth_schema.sql
├── 002_create_player_schema.sql
├── 003_create_creature_schema.sql
├── 004_create_world_schema.sql
├── 005_create_combat_schema.sql
├── 006_create_inventory_schema.sql
├── 007_create_economy_schema.sql
├── 008_create_progression_schema.sql
├── 009_create_social_schema.sql
├── 010_create_guild_schema.sql
└── 011_create_trading_schema.sql
```

Không sửa migration đã chạy trên production theo cách làm mất khả năng nâng cấp. Tạo migration mới để thay đổi cấu trúc.

### 19.2. Seed data

Dữ liệu khởi tạo:

- 10 Elements.
- 6 Roles.
- 20 Eidolon ban đầu.
- Skill templates.
- Trait templates.
- Evolution branches.
- 5 Regions.
- Initial maps.
- NPC templates.
- Item templates.
- Quest templates.
- Currency types.
- Shop catalog.

Seed phải có thể chạy lại an toàn và không tạo bản ghi trùng.

---

## 20. DATA RETENTION & ARCHIVING

Các nhóm dữ liệu:

| Data | Retention |
|---|---|
| Account | Theo vòng đời tài khoản |
| Player progress | Lưu lâu dài |
| Creature collection | Lưu lâu dài |
| Currency transactions | Lưu lâu dài theo chính sách |
| Battle replay | Theo chính sách lưu trữ |
| Chat messages | Có thời hạn và moderation policy |
| Session | TTL |
| Analytics events | Theo thời hạn phân tích |
| Admin audit logs | Lưu theo chính sách bảo mật |

Dữ liệu lịch sử không cần truy vấn thường xuyên có thể chuyển sang hệ thống lưu trữ phù hợp.

---

## 21. DATABASE SECURITY

- Database không mở trực tiếp ra Internet.
- Backend sử dụng database user riêng.
- Admin database user không dùng cho game server.
- Secret lưu trong secret manager hoặc environment bảo mật.
- Backup được mã hóa.
- Có giới hạn quyền truy cập theo schema.
- Kiểm tra SQL injection.
- Không log thông tin nhạy cảm.
- Có quy trình rotation credentials.
- Có kiểm thử restore định kỳ.

---

## 22. MVP DATABASE IMPLEMENTATION PRIORITY

**Phase 1 – Account:** users, player_profiles, player_settings, player_sessions, player_progress

**Phase 2 – Collection:** creatures, creature_instances, creature_skills, creature_traits, creature_evolutions, creature_bonds

**Phase 3 – World:** world_regions, world_zones, world_maps, world_objects, spawn_tables

**Phase 4 – Battle:** battle_sessions, battle_participants, battle_units, battle_actions, battle_replays

**Phase 5 – Inventory & Economy:** items, inventory, item_instances, player_wallets, currency_transactions, purchases

**Phase 6 – Progression:** quests, player_quests, achievements, player_achievements, reward_claims

**Phase 7 – Multiplayer:** player_friends, player_blocks, chat_channels, chat_messages, guilds, guild_members, trade_orders, trade_order_items, pvp_ratings

---

## 23. DATABASE ACCEPTANCE CRITERIA

| ID | Acceptance Criteria |
|---|---|
| DB-001 | Tài khoản có thể đăng ký và đăng nhập |
| DB-002 | Mỗi người chơi có hồ sơ riêng |
| DB-003 | Có thể sở hữu nhiều Eidolon |
| DB-004 | Eidolon có progression riêng |
| DB-005 | Có thể trang bị skill và equipment |
| DB-006 | Có thể lưu vị trí và tiến trình map |
| DB-007 | Battle lưu được snapshot |
| DB-008 | Replay có thể truy xuất |
| DB-009 | Inventory không bị cấp trùng |
| DB-010 | Currency transaction an toàn |
| DB-011 | Quest reward không thể claim hai lần |
| DB-012 | Trading không làm mất hoặc nhân đôi tài sản |
| DB-013 | Có index cho các truy vấn chính |
| DB-014 | Migration có thể rollback theo quy trình |
| DB-015 | Backup có thể restore thành công |

---

## 24. FINAL DATABASE DECISIONS

| Hạng mục | Quyết định |
|---|---|
| Main Database | PostgreSQL |
| Cache | Redis |
| Primary Key | UUID |
| Flexible Data | JSONB |
| Currency | BIGINT |
| Time | TIMESTAMPTZ |
| Transaction | PostgreSQL ACID |
| Replay Storage | Object Storage |
| Runtime Zone State | Redis |
| Schema Organization | Logical schemas |
| Migration | Versioned SQL migrations |

*END OF PART 5 – DATABASE DESIGN DOCUMENT v1.0*
