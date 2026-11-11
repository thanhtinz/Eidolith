# EIDOLITH – Part 16 – Admin Panel & Live Operations

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

ADMIN PANEL & LIVE OPERATIONS SPECIFICATION

PART 16 – Content Management, Player Support, Moderation and Operational Controls

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-16 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Objectives & Roles

- 2. Core Modules

- 3. Authentication & Authorization

- 4. Content Publishing Workflow

- 5. Player Support Tools

- 6. Economy Operations

- 7. Moderation & Safety

- 8. LiveOps Calendar

- 9. Monitoring & Incident Management

- 10. Audit & Compliance

- 11. MVP Scope

# 1. Objectives & Roles

Admin Panel là công cụ vận hành nội bộ để quản lý nội dung, sự kiện, người chơi, economy, moderation và sức khỏe hệ thống.

Roles: Super Admin, Game Designer, LiveOps Manager, Customer Support, Moderator, Analyst, Read-only Auditor.

Least privilege: mỗi role chỉ có quyền cần thiết; hành động nhạy cảm cần approval hoặc re-authentication.

# 2. Core Modules

Dashboard: DAU/WAU/MAU, concurrency, errors, economy health, active events.

Player Lookup: tra cứu theo playerId, trạng thái, tiến độ và lịch sử giao dịch.

Content Management: Eidolon, skill, item, quest, map, spawn, drop table.

LiveOps: banner, event, shop rotation, battle pass, announcement.

Economy: wallet ledger, grant/revoke workflow, purchase status, refund reference.

Moderation: reports, chat actions, mute, suspend, appeal.

Operations: server status, maintenance, feature flags, deployment version.

Audit: actor, action, target, before/after, timestamp, reason.

# 3. Authentication & Authorization

Admin dùng SSO hoặc MFA; không dùng chung tài khoản.

RBAC kết hợp permission scope theo environment và region.

Production access có thời hạn; mọi elevated permission đều audit.

Không cho support agent sửa trực tiếp balance mà không qua grant workflow.

# 4. Content Publishing Workflow

Draft → Validate → Review → Approved → Scheduled → Published → Archived.

Validation kiểm tra schema, reference, localization, asset, time window và reward budget.

Content version được pin vào game build hoặc live config version.

Rollback phải phục hồi version trước; không xóa lịch sử publish.

# 5. Player Support Tools

Player profile view, session history, progression summary, purchase lookup và error reference.

Support actions: resend eligible reward, restore purchase entitlement, correct documented issue, lock account pending review.

Sensitive action cần reason code, ticket ID và approval theo policy.

Không hiển thị thông tin thanh toán đầy đủ hoặc bí mật xác thực cho support.

# 6. Economy Operations

Manual grant/revoke dùng transaction ledger, amount limits và dual approval khi vượt ngưỡng.

Không sửa số dư trực tiếp trong database.

Refund phải liên kết purchase reference và payment provider status.

Fraud flags hỗ trợ điều tra, không tự động ban chỉ dựa trên một heuristic.

# 7. Moderation & Safety

Report queue gồm chat, player name, guild, trade scam và harassment.

Actions: dismiss, warn, mute, temporary suspend, permanent ban; có evidence và reason.

Appeal workflow tách người xử lý ban đầu khi quy mô cho phép.

Retention và quyền truy cập dữ liệu moderation phải theo policy.

# 8. LiveOps Calendar

Calendar hiển thị event, banner, shop, maintenance, reset, announcement và release windows.

Conflict detection cảnh báo hai campaign dùng chung slot hoặc điều kiện chồng lấn.

Preview mode cho phép kiểm tra theo player segment trước khi publish.

Emergency kill switch tắt tính năng lỗi mà không xóa entitlement đã cấp.

# 9. Monitoring & Incident Management

Health checks cho API, WebSocket, database, Redis, storage và battle workers.

Alert theo latency, error rate, queue depth, disconnect rate, economy anomaly và purchase verification failure.

Incident record gồm severity, owner, timeline, impact, mitigation, root cause và postmortem.

Maintenance announcement phải hỗ trợ timezone và in-game notification.

# 10. Audit & Compliance

Audit log append-only; export có permission và watermark.

Log không chứa password, access token, full payment data hoặc dữ liệu nhạy cảm không cần thiết.

Data access được giới hạn theo role; retention policy được cấu hình và rà soát.

Production database access qua công cụ được kiểm soát, không qua SQL console mở rộng cho mọi admin.

# 11. MVP Scope

MVP: dashboard cơ bản, player lookup, content config, event/banner management, grant workflow có audit, moderation queue và maintenance toggle.

Acceptance: không có thao tác nhạy cảm không audit; publish có validation; rollback có thể thực hiện; RBAC được kiểm thử.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
