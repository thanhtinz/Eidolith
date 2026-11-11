# EIDOLITH – Part 12 – Multiplayer, Guild, PvP, Trading & Co-op

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

MULTIPLAYER, GUILD, PvP, TRADING & CO-OP DESIGN DOCUMENT

PART 12 – Social Systems and Shared World Architecture

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-12 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Multiplayer Vision

- 2. Player Presence & Social Graph

- 3. Shared World Zones

- 4. Party & Co-op

- 5. Guild System

- 6. PvP Modes

- 7. Battle Integrity

- 8. Trading System

- 9. Anti-Abuse & Moderation

- 10. Network & Reconnect

- 11. MVP Scope

- 12. Acceptance Criteria

# 1. Multiplayer Vision

EIDOLITH là game online có shared world zones, hoạt động nhóm và cạnh tranh không bắt buộc. Multiplayer phải tăng cảm giác thế giới sống nhưng không làm gián đoạn trải nghiệm solo.

Kiến trúc MVP dùng instanced zones và authoritative server; không giả định một world shard khổng lồ duy nhất.

# 2. Player Presence & Social Graph

Presence states: Online, Away, In Battle, In Dungeon, Offline. Người chơi có thể ẩn trạng thái nếu thiết kế privacy cho phép.

Friend requests có pending/accepted/blocked; block phải ngăn lời mời, chat và giao dịch.

Party gồm leader và tối đa 4–5 người tùy mode; quy tắc party phải nhất quán với encounter và dungeon.

# 3. Shared World Zones

Zone instance có capacity, region, mapVersion, serverId và lifecycle. Matchmaking hoặc zone manager phân bổ người chơi.

AOI (Area of Interest) chỉ gửi entity trong phạm vi quan tâm; server quyết định entity visibility và interaction validity.

Người chơi khác không được làm chặn lối đi hoặc gây griefing tại điểm quest bắt buộc.

# 4. Party & Co-op

Party flow: invite → accept → ready → enter activity → complete → distribute rewards → leave.

Co-op dungeon có vai trò và cơ chế boss phối hợp nhưng phải cân bằng cho party không đủ role lý tưởng.

Scaling dựa trên số người thực tế; người rời mạng có reconnect window. Loot distribution phải được công bố trước khi vào.

Không cho người chơi cấp thấp bị kéo vào nội dung không thể sống sót mà không có cảnh báo.

# 5. Guild System

Guild fields: guildId, name, tag, emblem, level, leaderId, createdAt, settings.

Roles: Leader, Officer, Member. Permission matrix quản lý invite, kick, promote, announcement, treasury và event.

Guild features: roster, chat, bulletin, contribution, weekly objective, guild progression và cosmetic identity.

Guild leadership transfer và disband cần xác nhận, cooldown và audit log.

# 6. PvP Modes

Arena 1v1 hoặc asynchronous team battle là lựa chọn MVP ít yêu cầu đồng bộ realtime.

Ranked seasons có rating, placement, tiers, decay policy nếu cần và end-of-season reward.

Friendly/custom battle cho phép mời bạn bè, chọn luật và không ảnh hưởng rating.

PvP matchmaking dùng team power bands, rating, latency và queue time; ưu tiên fairness hơn tìm trận tức thời.

# 7. Battle Integrity

Battle simulation authoritative; client gửi command hợp lệ chứ không gửi kết quả thắng/thua.

Server snapshot đội hình, level, skill, equipment, trait và combat version khi trận bắt đầu.

Replay lưu event hoặc input stream có seed/version để kiểm tra kết quả.

Phát hiện disconnect, timeout, surrender và AFK theo quy tắc được công bố.

# 8. Trading System

Trading chỉ mở khi tài khoản đạt điều kiện chống bot và tutorial completion.

Chỉ cho giao dịch item được đánh dấu tradable; không giao dịch premium currency, bound item hoặc tài sản có hạn chế.

Trade flow: create offer → lock items → counterparty accept → final confirmation → atomic transfer → ledger.

Escrow giữ tài sản trong thời gian giao dịch. Hủy/timeout phải trả tài sản về đúng chủ.

Không cho phép sửa offer sau khi bên kia xác nhận; thay đổi nội dung phải reset confirmation.

# 9. Anti-Abuse & Moderation

Rate limit friend requests, chat, guild invites và trade offers.

Chat có mute, block, report, profanity filtering theo ngôn ngữ và moderation queue.

Trade abuse detection: giá bất thường, luân chuyển tài sản, nhiều tài khoản liên quan và giao dịch lặp.

Không tự động kết luận gian lận chỉ từ một tín hiệu; cần review và appeal workflow.

# 10. Network & Reconnect

WebSocket dùng heartbeat, session token ngắn hạn, sequence number và reconnect token.

Client có thể resume trạng thái zone hoặc battle trong thời gian cho phép; server gửi snapshot mới nếu event buffer không còn đủ.

Duplicate commands bị loại qua commandId/idempotency key.

Không để reconnect cấp lại reward hoặc thực thi lặp lệnh trade.

# 11. MVP Scope

MVP: friends, party, shared starter zone, chat cơ bản có moderation, co-op boss prototype, friendly battle và asynchronous arena.

Deferred: real-time action PvP, guild territory wars, auction house toàn server và world-scale events.

# 12. Acceptance Criteria

Party và guild permission được server xác thực; item trade không thể nhân đôi; PvP result authoritative; reconnect không tạo duplicate reward; block/mute có hiệu lực trên mọi kênh liên quan.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
