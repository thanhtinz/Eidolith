# EIDOLITH – Part 13 – UI/UX Design Specification

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

UI/UX DESIGN SPECIFICATION

PART 13 – Mobile Portrait Information Architecture, Interaction & Accessibility

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-13 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. UI Design Principles

- 2. Global Navigation

- 3. Screen Inventory

- 4. World HUD

- 5. Collection UX

- 6. Battle UX

- 7. Feedback & Error States

- 8. Accessibility

- 9. Localization

- 10. UX Analytics

- 11. Design Tokens & Components

- 12. MVP Deliverables

# 1. UI Design Principles

Thiết kế portrait 9:16 cho Android/iOS, ưu tiên thao tác một tay, vùng chạm đủ lớn và thông tin phân cấp rõ.

Phong cách UI phải hòa với 2D Pixel Art Isometric: khung giao diện hiện đại, viền pixel tinh tế, bảng màu tự nhiên, tránh hiệu ứng glow quá mức.

Gameplay world cần ưu tiên không gian hiển thị; menu hệ thống dùng panel và bottom navigation.

# 2. Global Navigation

Primary navigation: World, Eidolons, Sanctuary, Quests, Menu.

Menu mở các mục Inventory, Summon, Shop, Friends, Guild, Arena, Settings và Mail.

Badge chỉ xuất hiện khi có hành động thật sự cần chú ý; không dùng chấm đỏ cho mọi nội dung.

# 3. Screen Inventory

Loading/Splash: logo, version, connection status.

Login/Account: sign-in providers, guest flow nếu được hỗ trợ, account linking.

Character setup: Wanderer appearance/name.

World HUD: minimap, quest tracker, interaction prompt, party status, menu shortcuts.

Collection: grid/list toggle, filters, sort, detail tabs.

Battle preparation: team slots, power summary, recommended role coverage.

Battle HUD: speed, pause/auto settings nếu mode cho phép, unit status, combat log.

Sanctuary: building overview, creature assignment, upgrade actions.

Quest Journal: category tabs, objective details, reward preview.

Shop/Summon: rates, pity, price, banner timer, purchase confirmation.

Social: friends, party, guild, chat, reports.

Settings: audio, graphics, language, accessibility, account and privacy.

# 4. World HUD

Top area: player status, currency summary, connection indicator.

Center: unobstructed world and character; avoid permanent large overlays.

Left/right contextual area: quest tracker and minimap; user can collapse.

Bottom: virtual joystick or tap-to-move controls, interaction action and quick access.

Controls adapt to safe areas and device aspect ratios.

# 5. Collection UX

Collection cards show portrait, name, element, rarity and level. Do not rely on color alone to communicate element.

Detail page uses clear hierarchy: identity, stats, skills, traits, evolution, bond and equipment.

Destructive actions (release, consume, reset) require explicit confirmation and lock/favorite protection.

Team assignment should show duplicate assignment prevention and role coverage.

# 6. Battle UX

Battle camera must keep all relevant units visible; avoid excessive screen shake.

Speed controls 1x/2x/3x are visible and remember user preference where mode allows.

Damage numbers, status icons and telegraphs need contrast and reduced-motion alternatives.

Battle result screen clearly separates base rewards, bonus rewards and first-clear rewards.

# 7. Feedback & Error States

Every async action has loading, success, failure and retry states.

Network interruption should preserve the user's intent where safe; never silently repeat purchases or item consumption.

Errors use actionable language, stable error codes and support reference ID.

Empty states explain how to obtain content rather than displaying blank panels.

# 8. Accessibility

Scalable text, color-independent indicators, high-contrast mode and reduced motion.

Touch targets sized for mobile use; avoid controls placed too close to screen edges.

Text localization must support expansion; no text embedded in sprites except approved decorative art.

Audio cues have visual equivalents; essential information never depends only on sound.

# 9. Localization

All UI strings use localization keys. Support Vietnamese and English at launch-ready architecture.

Date, number, currency and plural formatting use locale-aware formatters.

Font fallback must support Vietnamese diacritics and special symbols.

Test long strings, small screens and dynamic content.

# 10. UX Analytics

Track screen_view, funnel_step, interaction_error, menu_abandon, purchase_confirmation and tutorial_dropoff.

Do not collect unnecessary personal data. Analytics events use pseudonymous player identifiers.

Use funnel analysis to identify friction, not to pressure players into spending.

# 11. Design Tokens & Components

Define tokens for spacing, typography, border, panel, rarity, element, status, motion and elevation.

Reusable components: Button, IconButton, Modal, Tooltip, Tabs, FilterChip, ResourceCounter, EidolonCard, ProgressBar, Toast, ConfirmationDialog.

Component states: default, pressed, focused, disabled, loading, error and selected.

All components require documented responsive behavior and localization constraints.

# 12. MVP Deliverables

Wireframes for login, character setup, world HUD, collection, Eidolon detail, team setup, battle HUD/result, quest journal, inventory, summon, shop and settings.

Prototype critical flows on a real phone: move/interact, capture, inspect Eidolon, form team, start battle, claim reward.

Acceptance: no critical action hidden behind ambiguous icons; core loop usable at common phone resolutions and safe-area configurations.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
