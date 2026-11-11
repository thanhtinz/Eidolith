# EIDOLITH – Part 10 – Quest, Story & Narrative Design

> Tài liệu do Tín gửi ngày 2026-11-10 trong file EIDOLITH_Remaining_Documents_Parts_10-17.zip (bản gốc .docx), chuyển nguyên văn sang Markdown.

---

EIDOLITH

QUEST, STORY & NARRATIVE DESIGN DOCUMENT

PART 10 – Aetheria Story Framework, Quest Architecture & Narrative Delivery

Project: EIDOLITH – The Forgotten Wilds | Version: 1.0 | Status: Development Specification


# Document Control

| Document ID | EIDOLITH-PART-10 |
|---|---|
| Version | 1.0 |
| Scope | Mobile MMORPG-inspired Monster Collection Strategy RPG |
| Dependencies | Parts 1–9: GDS, TDD, Database, API, Combat, World and Collection specifications |

# Table of Contents

- 1. Purpose & Design Goals

- 2. Narrative Premise

- 3. Story Structure

- 4. Quest Taxonomy

- 5. Quest Data Model

- 6. Quest State Machine

- 7. Dialogue & Choice

- 8. NPC & Character Writing

- 9. Rewards & Progression

- 10. UX & Presentation

- 11. Live Content & Scheduling

- 12. Analytics & QA

- 13. MVP Scope

# 1. Purpose & Design Goals

EIDOLITH kể câu chuyện về Aetheria, một thế giới nơi các Eidolon và con người từng cộng sinh thông qua Resonance. Hệ thống nhiệm vụ dẫn dắt người chơi khám phá thế giới, mở khóa vùng đất, hiểu lịch sử và xây dựng mối liên kết với Eidolon.

Nguyên tắc: cốt truyện chính có nhịp tuyến tính rõ ràng; nhiệm vụ phụ mở rộng nhân vật và địa điểm; nhiệm vụ lặp lại không được thay thế nội dung kể chuyện; tiến trình nhiệm vụ phải lưu phía server.

# 2. Narrative Premise

Người chơi nhập vai Wanderer, một người tỉnh dậy tại Meadow Village sau một sự kiện Resonance bất thường. Một số cột mốc cổ đại đã ngừng hoạt động và các Wild Eidolon trở nên bất ổn. Wanderer cùng các cư dân điều tra nguồn gốc hiện tượng này.

Chủ đề: ký ức, cộng sinh, trách nhiệm với thiên nhiên, lựa chọn và sự cân bằng. Tránh mô-típ nhân vật chính được tiên tri hoặc giải quyết mọi vấn đề một mình; NPC và Eidolon phải có động cơ độc lập.

# 3. Story Structure

Arc 0 – Awakening: hướng dẫn điều khiển, gặp Eidolon đầu tiên, làm quen Meadow Village.

Arc 1 – The Whispering Forest: điều tra các điểm Resonance nhiễu loạn; mở khóa Whispering Forest và cơ chế Wild Capture.

Arc 2 – Crystal Lake: truy tìm nguồn năng lượng bị rò rỉ; giới thiệu dungeon, boss telegraph và hệ Tide/Frost.

Arc 3 – Ancient Grove: khám phá dấu tích cộng sinh cổ đại; mở rộng Sanctuary và hệ thống Evolution.

Arc 4 – Beyond the Plains: mở tuyến sang vùng kế tiếp; kết thúc mùa truyện đầu bằng một bí ẩn lớn, không đóng toàn bộ lore.

# 4. Quest Taxonomy

Main Story: nhiệm vụ bắt buộc theo chapter, mở khóa tính năng và vùng.

Side Quest: tuyến chuyện NPC, khám phá địa phương, phần thưởng một lần.

World Quest: nhiệm vụ gắn với địa điểm hoặc sự kiện thế giới, có thể có chuỗi nhiều bước.

Daily/Weekly: mục tiêu ngắn, lặp lại theo lịch server; không yêu cầu đăng nhập quá nhiều lần trong ngày.

Discovery Quest: kích hoạt bởi vật thể, địa danh, Eidolon hoặc điều kiện khám phá.

Bond Quest: nhiệm vụ riêng theo Eidolon, mở hội thoại, animation hoặc cosmetic.

# 5. Quest Data Model

QuestDefinition gồm questId, version, category, chapterId, prerequisites, objectives, rewards, availability, repeatPolicy, localizationKey và failurePolicy.

QuestInstance gồm playerId, questId, status, currentStep, objectiveProgress, acceptedAt, completedAt, claimedAt và definitionVersion.

Objective types: TalkToNPC, DefeatEntity, CaptureSpecies, CollectItem, VisitLocation, InteractObject, CompleteDungeon, WinBattle, RaiseBond, EvolveEidolon.

Objective event phải có eventId duy nhất để tránh cộng tiến độ hai lần khi reconnect hoặc gửi lại request.

# 6. Quest State Machine

Locked → Available → Active → Completed → RewardClaimed. Các trạng thái Failed và Expired chỉ dùng khi quest có giới hạn hoặc điều kiện thất bại rõ ràng.

Server xác thực prerequisite, mục tiêu, quyền nhận thưởng và trạng thái hiện tại. Claim reward phải idempotent; không cho client tự gửi số lượng reward.

# 7. Dialogue & Choice

Dialogue node gồm speakerId, textKey, portrait, animationCue, choices và nextNodeId. Nội dung hỗ trợ localization và accessibility.

Choice có thể thay đổi quan hệ NPC, mở nhánh hội thoại hoặc chọn cách giải quyết nhiệm vụ. Không dùng lựa chọn giả nếu không có hậu quả hoặc phản hồi.

Quyết định ảnh hưởng dài hạn phải được thông báo rõ, lưu choice history và có khả năng kiểm thử migration.

# 8. NPC & Character Writing

Mỗi NPC có profile: vai trò, mục tiêu, nỗi sợ, quan hệ, giọng nói, lịch hoạt động và các quest liên quan.

NPC chính: trưởng làng Meadow Village, nhà nghiên cứu Resonance, người trông coi Sanctuary, thợ chế tác và người dẫn đường. Tên chính thức cần được chốt trong Character Bible.

NPC schedule là lớp trình diễn; dịch vụ thiết yếu và quest turn-in không được biến mất khiến người chơi mắc kẹt.

# 9. Rewards & Progression

Quest reward có thể gồm Player EXP, Gold, vật phẩm, nguyên liệu, Eidolon Shard, Bond item, cosmetic và mở khóa nội dung.

Reward table phải có budget theo độ dài, độ khó và tần suất. Không cấp trực tiếp vật phẩm premium không kiểm soát.

Quest chain không được yêu cầu tiêu thụ vật phẩm hiếm trước khi người chơi có cơ hội hiểu công dụng.

# 10. UX & Presentation

Quest tracker hiển thị tối đa 3 mục tiêu đang theo dõi; người chơi tự chọn pin/unpin.

Quest journal có tab Main, Side, World, Daily, Bond; hiển thị trạng thái, khu vực và phần thưởng.

Navigation marker dùng hướng dẫn mềm; không tự động kéo nhân vật qua nguy hiểm hoặc bỏ qua khám phá.

Đối thoại hỗ trợ auto-advance tùy chọn, tốc độ chữ, log hội thoại và bỏ qua cảnh đã xem.

# 11. Live Content & Scheduling

Daily reset dùng UTC hoặc một timezone server được công bố thống nhất; không dựa vào đồng hồ thiết bị.

Event quest có startAt, endAt, gracePeriod và claimDeadline. Khi event kết thúc, trạng thái và phần thưởng phải được xử lý rõ ràng.

Quest definitions được version hóa; bản cập nhật không được làm mất tiến độ hợp lệ.

# 12. Analytics & QA

Track: quest_start, objective_progress, quest_complete, reward_claim, abandon, stuck_duration và dialogue_choice.

Kiểm thử prerequisite, objective duplicate, reconnect, server restart, localization overflow, NPC unavailable, event expiry và reward rollback.

Acceptance: người chơi không thể nhận thưởng hai lần; mọi quest chính có đường hoàn thành rõ; tiến độ đồng bộ giữa thiết bị.

# 13. MVP Scope

MVP: 1 tuyến main story qua 4 khu vực starter; 12–18 side quests; 5 daily objectives; 3 Bond quest prototype; dialogue choices cơ bản; quest journal và tracker.

Deferred: cinematic branching quy mô lớn, voice-over toàn bộ, lựa chọn thay đổi thế giới lâu dài và quest editor trực quan đầy đủ.

# Document Governance

Các thông số định lượng trong tài liệu là baseline thiết kế và cần được xác nhận qua prototype, playtest, analytics và balance review. Mọi thay đổi ảnh hưởng đến dữ liệu người chơi, economy, network protocol hoặc content version phải có migration/compatibility plan và audit phù hợp.
