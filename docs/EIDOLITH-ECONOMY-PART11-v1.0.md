# EIDOLITH – Part 11 – Economy, Shop, Monetization & Live Ops

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

ECONOMY, SHOP, MONETIZATION & LIVE OPS DESIGN DOCUMENT

PART 11 – Currency, Sources & Sinks, Storefronts, Ethical Monetization

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-11 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Economy Objectives

- 2. Currency Catalog

- 3. Sources & Sinks

- 4. Wallet & Ledger

- 5. Shop Catalog

- 6. Monetization Products

- 7. Summoning Economy

- 8. Pricing & Regionalization

- 9. Purchase Flow

- 10. Economy Telemetry

- 11. Live Operations

- 12. MVP Scope & Acceptance

# 1. Economy Objectives

Kinh tế EIDOLITH phải hỗ trợ tiến trình dài hạn, duy trì giá trị hoạt động trong game và tạo doanh thu mà không biến chi tiêu thành điều kiện bắt buộc để cạnh tranh.

Nguyên tắc: mọi currency có nguồn và nơi tiêu rõ ràng; giao dịch server-authoritative; giá và xác suất được công bố; không bán chỉ số chiến đấu độc quyền.

# 2. Currency Catalog

Gold: currency phổ thông, nhận từ quest, battle, bán vật phẩm; dùng nâng cấp và dịch vụ.

Crystal: premium currency; có thể có loại paid và earned riêng để xử lý quy định nền tảng và hoàn tiền.

Bond Essence: phát triển Bond.

Evolution Core: tiến hóa Eidolon.

Arena Token: phần thưởng PvP, đổi vật phẩm theo mùa.

Guild Coin: hoạt động guild.

Research Data: nghiên cứu và mở khóa tiện ích.

Event Token: currency giới hạn theo event, có chính sách chuyển đổi hoặc hết hạn được công bố.

# 3. Sources & Sinks

Xây economy matrix theo từng currency: nguồn PvE, quest, daily, weekly, event, PvP; sink gồm enhancement, crafting, exchange, cosmetics và convenience.

Mỗi nguồn phải có giới hạn hoặc kiểm soát tốc độ phát sinh. Mỗi sink phải có giá trị rõ ràng, không tạo cảm giác phạt người chơi vì tham gia gameplay.

Không cho phép tạo currency từ client; mọi grant/spend đều có ledger.

# 4. Wallet & Ledger

Wallet lưu số dư hiện tại theo player và currency. Ledger lưu giao dịch bất biến gồm transactionId, playerId, currency, delta, reason, referenceId, idempotencyKey, createdAt.

Balance update và ledger insert nằm trong cùng database transaction. Dùng unique constraint cho idempotencyKey.

Refund và reversal là giao dịch bù trừ, không sửa/xóa lịch sử cũ.

# 5. Shop Catalog

Permanent Shop: vật phẩm tiện ích và cosmetic có sẵn.

Rotating Shop: danh mục luân phiên có thời gian bắt đầu/kết thúc.

Cosmetic Shop: skin, emote, profile frame, Sanctuary decoration.

Exchange Shop: đổi Shard, Arena Token, Guild Coin và Event Token.

Bundle Shop: gói khởi đầu hoặc gói chủ đề; hiển thị đầy đủ nội dung và giá trị.

# 6. Monetization Products

Battle Pass: free track và premium track; nhiệm vụ tiến triển theo mùa; không đặt phần thưởng sức mạnh độc quyền ở premium track.

Monthly Card: phần thưởng đăng nhập theo ngày, có cơ chế claim và xử lý ngày bỏ lỡ được công bố.

Cosmetic Purchase: skin, hiệu ứng, animation, profile decoration.

Premium Currency: mua qua nền tảng thanh toán iOS/Android; xác minh receipt phía server.

Starter Bundle: mua một lần, hiển thị rõ giới hạn tài khoản và nội dung.

Không triển khai quảng cáo ép buộc trong MVP.

# 7. Summoning Economy

Banner phải lưu snapshot cấu hình xác suất, pool, pity và featured rules theo version.

Hiển thị xác suất theo từng rarity và từng featured item khi cần; công bố quy tắc pity, guarantee, reset và carry-over.

Không thay đổi kết quả sau khi server đã tạo transaction. Lưu seed/audit metadata ở phạm vi bảo mật phù hợp.

Không dùng dark pattern, countdown giả hoặc thông báo gây áp lực chi tiêu.

# 8. Pricing & Regionalization

Giá được cấu hình theo storefront và quốc gia theo chính sách nền tảng. Không hardcode giá trong client.

Hiển thị giá cuối cùng, chu kỳ thanh toán, điều kiện gia hạn và quyền lợi trước khi mua.

Currency earned và purchased cần phân biệt nếu quy định, hoàn tiền hoặc hạn chế chuyển nhượng yêu cầu.

# 9. Purchase Flow

Client khởi tạo purchase intent; nền tảng xử lý thanh toán; client gửi receipt/token; server xác minh với nền tảng; server cấp entitlement; client nhận kết quả.

Phải hỗ trợ pending, success, failed, canceled, refunded và chargeback.

Receipt verification và entitlement grant phải idempotent. Không tin trạng thái success do client tự khai.

# 10. Economy Telemetry

Track currency source/sink, balance distribution, time-to-upgrade, purchase conversion, refund, summon distribution và inflation.

Dashboard cần cohort, percentile và phân tách người chơi free/paying mà không đưa dữ liệu cá nhân nhạy cảm vào báo cáo sản phẩm.

Alert khi grant bất thường, sink đột biến, giao dịch lặp hoặc chênh lệch số dư.

# 11. Live Operations

LiveOps calendar quản lý banner, event, shop rotation, pass, maintenance và thông báo.

Mỗi campaign có owner, start/end, timezone, target version, eligibility, rollback plan và QA checklist.

Ưu tiên feature flags và staged rollout; có khả năng tắt campaign mà không làm mất entitlement đã mua.

# 12. MVP Scope & Acceptance

MVP: Gold, Crystal, Bond Essence, Evolution Core; wallet/ledger; cosmetic shop prototype; exchange shop; một banner có pity; purchase sandbox; admin configuration và audit.

Acceptance: không nhân đôi giao dịch; số dư không âm trừ khi currency cho phép overdraft; receipt được xác minh server; mọi xác suất và giá có thể truy xuất theo version.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
