# EIDOLITH – Part 17 – QA, Analytics, Release & Production Roadmap

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

QA, ANALYTICS, RELEASE & PRODUCTION ROADMAP

PART 17 – Quality Strategy, Telemetry, Build Pipeline and Launch Readiness

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-17 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Production Objectives

- 2. Quality Strategy

- 3. Test Environments

- 4. Device & Performance Matrix

- 5. Analytics Taxonomy

- 6. Privacy & Data Governance

- 7. CI/CD Pipeline

- 8. Release Versioning

- 9. Launch Phases

- 10. Release Gates

- 11. Risk Register

- 12. Team & Ownership

- 13. Definition of Done

- 14. Initial Milestone Plan

- 15. Final Launch Checklist

# 1. Production Objectives

Đưa EIDOLITH từ prototype đến soft launch và global release theo các cổng chất lượng rõ ràng.

Không mở rộng content trước khi core loop, server authority, economy integrity và mobile performance đạt chuẩn.

# 2. Quality Strategy

Unit tests cho math, combat rules, capture formula, economy transaction và progression.

Integration tests cho REST, WebSocket, database, Redis, purchase verification và reconnect.

End-to-end tests cho onboarding, capture, summon, level up, evolution, battle, quest reward và co-op.

Manual exploratory testing cho UX, art, narrative, localization và device compatibility.

# 3. Test Environments

Local: developer iteration.

CI: automated tests và build validation.

Staging: production-like services, test payment and seeded accounts.

Pre-production: release candidate, migration rehearsal và load tests.

Production: staged rollout, monitoring và rollback readiness.

# 4. Device & Performance Matrix

Test low, mid và high tier Android; nhiều aspect ratio, memory class và OS version.

Test iPhone nhiều thế hệ, safe area, background/foreground và thermal throttling.

Đặt target frame rate theo tier; mục tiêu tham chiếu 60 FPS trên thiết bị phù hợp, fallback 30 FPS ổn định trên tier thấp.

Đặt budget cho memory, texture atlas, draw calls, network payload và startup time sau khi có baseline đo thực tế.

# 5. Analytics Taxonomy

Acquisition: install, registration, tutorial start/complete.

Engagement: session start/end, zone enter, battle start/end, quest progress.

Collection: capture attempt/success, summon, duplicate conversion, evolution.

Economy: currency grant/spend, purchase intent/verified, refund.

Social: party join, guild join, co-op completion, report.

Reliability: crash, ANR, disconnect, API error, battle desync.

# 6. Privacy & Data Governance

Chỉ thu thập dữ liệu cần thiết cho vận hành và cải thiện game.

Player identifiers trong analytics nên pseudonymous; giới hạn quyền truy cập và retention.

Không ghi nội dung chat riêng tư vào analytics tổng hợp trừ khi cần cho moderation theo policy.

Tuân thủ yêu cầu nền tảng và luật áp dụng tại các thị trường phát hành.

# 7. CI/CD Pipeline

Pull request: lint, typecheck, unit tests, schema validation, asset validation.

Merge: build client/server, integration tests, artifact signing và version stamping.

Release candidate: staging deploy, migration rehearsal, smoke test, load test và QA sign-off.

Production: staged rollout, health gate, monitoring, rollback plan.

Database migration phải backward-compatible trong giai đoạn rolling deployment.

# 8. Release Versioning

Client semantic version và server build version được lưu trong session.

Game data có content version độc lập; protocol version có compatibility policy.

Server phải xử lý client cũ trong khoảng thời gian hỗ trợ đã công bố hoặc yêu cầu update có kiểm soát.

Combat replay lưu combat engine version và data snapshot/version.

# 9. Launch Phases

Prototype: movement, isometric map, one creature, capture, 5v5 battle prototype.

Vertical Slice: starter area hoàn chỉnh, onboarding, collection, progression, one boss.

Alpha: core systems tích hợp, 20 Eidolon roster prototype, backend persistence, admin essentials.

Closed Beta: stability, balance, economy simulation, co-op and PvP tests.

Soft Launch: limited market, telemetry-driven tuning, payment and support operations.

Global Launch: content calendar, localization, support coverage, incident response and marketing readiness.

# 10. Release Gates

Gate A – Core Loop: exploration → encounter → capture → team → battle hoạt động end-to-end.

Gate B – Integrity: không có exploit nghiêm trọng về currency, item, capture, summon hoặc reward.

Gate C – Performance: đạt frame time, memory và crash targets trên device matrix.

Gate D – Operations: monitoring, backup, support, moderation, rollback và incident runbook sẵn sàng.

Gate E – Compliance: store metadata, privacy disclosures, purchase flows, age rating và localization được duyệt.

# 11. Risk Register

Scope creep: kiểm soát bằng MVP boundaries và change approval.

Content production bottleneck: modular content pipeline và staged roster release.

Economy inflation: source/sink dashboard, simulation và caps hợp lý.

Cheating/exploit: server authority, rate limits, audit và anomaly detection.

Performance on low-end devices: profiling sớm, asset budgets và quality tiers.

LiveOps failure: preview, scheduled publishing, kill switch và rollback.

# 12. Team & Ownership

Game Design: systems, balance, narrative and content acceptance.

Engineering: client, backend, infrastructure, security and tooling.

Art/Animation: characters, environments, UI, VFX.

Audio: music, ambience, SFX and integration.

QA: test plans, regression, device matrix and release sign-off.

LiveOps/Support: calendar, player communication, moderation and incident coordination.

# 13. Definition of Done

Feature có design spec, implementation, server validation, telemetry, localization, QA coverage và admin/operational support khi cần.

Không release feature có blocker, data loss risk, exploit nghiêm trọng hoặc crash phổ biến.

Release notes và known issues phải phản ánh đúng trạng thái build.

# 14. Initial Milestone Plan

M1 Foundation: repo, CI, auth, player profile, Phaser scene and isometric map.

M2 Core Loop: movement, interaction, encounter, capture and collection.

M3 Combat: 5v5 simulation, AI, skill, battle result and replay.

M4 Progression: EXP, Bond, skills, evolution and inventory.

M5 World Content: starter region, NPC, quests, dungeon and boss.

M6 Online: shared zones, friends, party, co-op and arena prototype.

M7 Economy & LiveOps: wallet, shop, summon banner, admin panel and analytics.

M8 Beta Readiness: QA, performance, security, localization and release operations.

Milestone duration is intentionally not fixed here; estimate after team size, staffing and prototype velocity are known.

# 15. Final Launch Checklist

Core gameplay stable; save data verified; migrations rehearsed; backup restore tested; purchase receipts verified; economy audit enabled; moderation staffed; privacy/store review complete; crash reporting active; load test passed; rollback rehearsed; support knowledge base ready.

END OF PART 17 – QA, ANALYTICS, RELEASE & PRODUCTION ROADMAP.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
