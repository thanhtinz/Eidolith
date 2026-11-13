# MAP DESIGN PLAYBOOK v1 — Chưng cất từ nghiên cứu Pokémon & game thuần phục quái

> Nguồn: đợt nghiên cứu 2026-11-12 (báo cáo đầy đủ: `~/workspace/research_notes/pokemon-monster-map-design-20261112-1901/report.md`, có trích nguồn từng mục). Số liệu ghi **[derived]** là quy đổi cho Eidolith (iso 64×32, chạm-để-đi, online) — không có nguồn nào công bố sẵn cho iso. Playbook này là chuẩn bắt buộc cho mọi map từ Đợt 1 (CONTENT-SCALE-ROADMAP-v1) trở đi.

## 0. Mô hình xương sống

**Nút an toàn → Hành lang rủi ro → Điểm cuối có cổng**, lặp lại không ngừng:
Thị trấn (0 encounter, hồi phục/mua sắm/lưu trữ) → Đường hoang (đường an toàn ĐI ĐƯỢC, cỏ là LỰA CHỌN, đường cụt nào cũng có thưởng, lối tắt một chiều về nhà) → Dungeon/boss (một cơ chế được dạy rồi kiểm tra) → thị trấn kế + một tầng di chuyển mới. Vùng mở (open zone) là mô hình này nén lại: một map chứa nhiều tiểu khu, có trại an toàn ở cửa vào + ở trung tâm.

## 1. Thị trấn / hub (số đo thật từ 16 thị trấn Pokémon giải mã)

- Dịch vụ thiết yếu GỘM MỘT CỤM quanh quảng trường; **hồi phục là cánh cửa đầu tiên** người chơi gặp: cửa đầu tiên cách điểm vào **5–17 ô (trung vị 12)**; điểm hồi sinh ngay phía nam cửa hồi phục (13/13 thị trấn).
- Đích xa nhất của thị trấn (đấu trường/phòng lab) nằm ở **đầu xa** (44–48 ô) — thị trấn có nhịp: dịch vụ gần, mục tiêu xa.
- Đường phố rộng 3–7 ô; tỉ lệ đi được 45–63%; nhà không vào được dùng để giả mật độ (Goldenrod ~45 nhà không cửa / 12 nhà vào được).
- Biển tên thị trấn đặt ở **15 ô từ cửa vào, tại ngã rẽ** — không đặt ngay cổng. Thị trấn thường có **2–4 lối ra**; làng khởi đầu đúng 1.
- Temtem: gộp hồi phục + lưu trữ + shop vào MỘT toà nhà (Temporium) ở mọi thị trấn + trạm mini ngay trên đường dài.

## 2. Đường hoang (Giải phẫu Route 1 Kanto — sống sót qua 5 bản remake)

Gateway hẹp → tường gờ (ledge) có khe hở → **cỏ tuỳ chọn + NPC dạy cơ chế ở 1/3 đầu** (cho Potion miễn phí) → đường cong chữ S → **hai bãi cỏ bắt buộc liên tiếp, tăng dần độ khó** → thị trấn. Chiều về: nhảy gờ tránh được TOÀN BỘ cỏ — **đi thì tốn, về thì miễn phí**. Gờ là công cụ cam kết: luôn hướng mặt về phía nhà.
- Unova: cỏ tối (dark grass) = rủi ro/phần thưởng tường minh, phải đánh đổi với đường an toàn và tầm nhìn trainer — hai hệ nguy hiểm không chồng lên nhau miễn phí. Cỏ rung (rustling) = spawn hiếm bắt người chơi băng qua nguy hiểm mới tới được.
- Độ sâu bãi cỏ **[derived từ tỉ lệ encounter ~11%/bước ở Emerald]**: 2–4 ô = cảm giác tuỳ chọn (~30% gặp ít nhất 1 trận ở 3 ô), 6+ ô = cam kết. Đường bắt buộc chỉ nên cắt qua ~10–20 ô cỏ mỗi tuyến.

## 3. Vùng mở (Wild Area — Galar)

- 18 tiểu khu có tên riêng; **tiểu khu cửa vào có 0 encounter**; sông + cầu vừa là ranh giới vừa là bậc cấp độ.
- Mỗi tiểu khu = **1 biome + 1 bảng encounter + 1 landmark nhỏ**; ~5–6 điểm nội dung lặp lại được (hang ổ/trader) mỗi tiểu khu.
- Quái lang thang cấp cao hơn hẳn người chơi = **cổng mềm** tự nhiên. Một phần khu vực khoá bằng khả năng vượt nước.
- Bài học Monster Hunter Stories 2: hang ổ ngẫu nhiên BỐ CỤC thì được, ngẫu nhiên DANH TÍNH thì thành việc vặt bị chê — **ngẫu nhiên hoá bố cục, không bao giờ ngẫu nhiên hoá bản sắc**.

## 4. Dungeon / hang

- Gen 1 là một chương trình học: mỗi dungeon dạy đúng **một cơ chế** theo nhịp *giới thiệu → làm khó → đảo ngược → kiểm tra ở boss*. Đường bắt buộc chỉ "lướt" qua dungeon; chiều sâu là tuỳ chọn và trả bằng loài hiếm.
- **Mọi ngõ cụt đều phải trả thưởng** (vật phẩm/loài/thông tin). Phòng nghỉ trước boss là bắt buộc (hồi phục + điểm chuẩn bị, "point of no return" rõ ràng); boss ở điểm xa nhất; **lối tắt một chiều từ điểm sâu nhất về cửa vào là phần thưởng tốt nhất và tốn 0 chi phí thiết kế**.
- Vẽ sơ đồ nhiệm vụ (chuỗi khoá–chìa có nhánh) TRƯỚC khi vẽ hình học; người chơi phải THẤY khoá trước khi có chìa.

## 5. Cổng & nhịp (gating)

- Cổng mềm: cấp độ, quái lang thang quá mạnh, bóng tối, NPC chặn đường, cờ cốt truyện, hạng (rank — Nexomon cho ĐÁNH THẲNG qua trạm kiểm soát để vào khu cấp cao sớm: cổng mềm tốt nhất từng thấy).
- Cổng cứng = chìa khả năng (lướt sóng/bay/leo…): mỗi khả năng mới phải (a) qua được 1 cổng, (b) mở lối tắt trong không gian cũ, (c) mở kho báu cũ chưa lấy được. **Mỗi lần mở khoá phải thay đổi thấy được ≥2 map cũ** (mô hình mạng Hoenn: chuyến về được gieo hạt ngay từ đầu game).
- Không cho dịch chuyển nhanh vượt qua chuyến quay lại đã gieo hạt đầu tiên.

## 6. Định hướng không cần minimap

- Hệ "weenie": **1 landmark vĩ mô** nhìn thấy từ hầu hết map (tháp/cây khổng lồ/núi lửa) + **1 landmark vi mô** cho từng tiểu khu/phòng. Kiểm tra cuối: người chơi thử phải gọi tên được từng khu ("khu có đài phun", "lùm cây có tháp đổ") — không gọi được thì thêm đặc điểm, đừng thêm marker.
- **Hợp đồng vật liệu — không bao giờ phối lại**: đường lát = an toàn · cỏ = có encounter · cỏ tối = nguy hiểm hơn · mép nước = ranh giới cổng · cầu thang = hai chiều · gờ = một chiều về nhà.
- Điểm spawn luôn hướng mặt về phía landmark; cửa vào nhất quán theo hướng giữa các map.

## 7. Chuẩn số cho Eidolith **[derived]**

| Loại map | Cỡ (ô iso) | Ghi chú |
|---|---|---|
| Làng khởi đầu | 24×24 (hiện tại) → 36×32 khi mở rộng | 1 lối ra đầu game, dịch vụ trong nhà |
| Thị trấn chuẩn | 40×40 → 64×56 | Cụm dịch vụ ở quảng trường, arena đầu xa |
| Đường hoang ngắn | dài 40–60, rộng 24–32 | 1 nhánh, 2 bảng encounter, NPC dạy ở 1/3 đầu |
| Đường hoang dài | dài 80–120 | Trạm nghỉ ở giữa, nghỉ mỗi 60–80 ô |
| Tiểu khu hồ/rừng | 26×22 → 40×40 | 1 landmark, 1–2 bảng, trại ở cửa vào |
| Sàn dungeon | 32×32 → 48×48, 2–3 tầng | 1 cơ chế, 2–4 nhánh/tầng |
| Đấu trường boss | 20×20 + phòng đệm 6–10 ô | Chuẩn hiện tại của Ancient Grove ✓ |

Encounter: ô cỏ chiếm 25–40% diện tích đi được của map hoang; điểm nghỉ cách nhau ≤ 90 ô ở vùng mở.

## 8. Luật riêng cho isometric 64×32

1. Chỉ thấy mặt SW + SE → **mọi cửa, biển hiệu, mặt tiền PHẢI nằm ở mặt SW/SE**; cửa mặt NW/NE là cửa vô hình.
2. Vật cao che ô phía BẮC của nó → giữ **1–2 ô "bóng che" phía bắc mọi nhà/cây lớn trống** (không đặt vật tương tác, cửa, ngã rẽ ở đó).
3. Cửa vào chính đặt ở góc **Đông/Tây** (sạch nhất) hoặc **Bắc** (hiệu ứng "mở ra" toàn cảnh); góc **Nam chỉ dành cho đường về/lối tắt**. Spawn hướng về landmark.
4. Đường phố iso phải rộng hơn top-down: **chính 4–6 ô, tối thiểu 3 ô** (online nhiều người chen nhau); quảng trường ≥ 10×10 trống.
5. Cao độ ≤ 2 mức/map (3+ mức chỉ dành cho landmark); cầu thang đặt ở mặt nhìn thấy được; gờ một chiều phải có mặt vách riêng, kẻo thành bug vô hình.
6. Ngân sách chiều cao: nhà thường ≤ 2 tầng extrude, landmark ≥ gấp đôi — hệ silhouettes phải sống sót.
7. Di chuyển chéo làm quãng đường ngắn ~30% → cỡ map nhân 1,2–1,4 so với số top-down, hoặc chặn cắt góc bằng hàng rào/góc bụi.

## 9. Checklist master (theo thứ tự dựng, cho MỌI map)

1. Map này có đúng MỘT việc (hub an toàn / hành lang rủi ro / dungeon dạy cơ chế / vùng săn mở / điểm cuối boss) — hai việc thì tách hoặc chia tiểu khu.
2. Vẽ sơ đồ nhiệm vụ (vào → các nhịp → cổng → boss/lối ra) trước khi đặt ô.
3. Đặt điểm nghỉ TRƯỚC: hồi phục gần cửa vào; dịch vụ cụm ≤ 7–15 ô; đích xa ở đầu xa.
4. Rải đường an toàn trước, rồi mới đặt nguy hiểm (cỏ/quái) BÊN CẠNH nó.
5. Thêm: một nhánh, một lối tắt về, một "preview" của thứ sắp tới.
6. Một landmark, một bảng màu, một loài biểu tượng cho mỗi map/tiểu khu; kiểm tra silhouette từ spawn.
7. Cổng: khoá hiện trước chìa; mỗi khả năng mới mở lại ≥2 map cũ.
8. Đếm: cỡ map, khoảng cách cửa đầu tiên, bề rộng đường, ngõ cụt (cái nào cũng phải trả), số lối ra (≥2 trừ làng khởi đầu), khoảng cách điểm nghỉ.
9. Lượt iso: mặt cửa, bóng che phía bắc, góc vào, ngân sách chiều cao, mặt cầu thang/gờ.
10. Câu hỏi nghiệm thu: người chơi có gọi tên được từng khu không?

## 10. Hợp đồng vật liệu của Eidolith (theo gid tileset verdant)

| Gid | Vật liệu | Ý nghĩa với người chơi |
|---|---|---|
| 3 | Đường đá | An toàn — không spawn quái trên đường |
| 1 | Cỏ sáng | Trung tính — đi lại tự do |
| 5 | Cỏ hoa | Vùng có quái hiền (spawn điểm gần đó) |
| 6 / 2 | Cỏ tối | Nguy hiểm — bảng encounter cấp cao/elite |
| 4 | Nước | Cổng cứng — cần khả năng vượt nước (đợt sau) |

## 11. Composition v2 — why the maps all looked the same (2026-11-12, Tín's call)

Root cause found by re-reading the generators, not the tiles: every map was
built from ONE recipe — a flat rectangle, one ground texture, one uniform
random scatter of the same 5 props, a uniform tree-ring edge, one straight
path. Swapping ground gids and sprinkling new props does not change that
recipe, so the silhouette of every screenshot stayed "grass box in a tree
wall". Sources re-checked: Lynch's five elements (paths / edges / districts
/ nodes / landmarks), measured Pokémon town research (blakecrosley), route
identity ("every route its own look"), density-over-breadth and
environmental storytelling notes. The binding rules from now on:

1. **Bubble diagram first.** Every map is 3–5 named districts, each with its
   own ground mix, prop palette and density — zones in the generator, never
   one scatter over the whole map.
2. **Edges are geography, not a wall.** Each side gets a different edge
   treatment (giant pines, rock outcrop, hedge, water, cliff) that hints at
   what lies beyond it.
3. **One landmark per map, visible from spawn** (the weenie). Oversized
   props are a first-class tool: prop objects may carry a `scale` property.
4. **Paths have character per district**: stone belongs to towns, dirt to
   the wilds; width varies (2-wide mains, 1-wide trails); curves over
   straight lines. Paths are leading lines toward the landmark.
5. **Colour grade per map** (`GRADES` in WorldScene): the light itself
   differs — cool forest, warm fields, fresh lakeside. White = neutral.
6. **Cluster, don't scatter.** Props gather at nodes and landmarks;
   deliberate empty clearings are part of the design. Density contrast is
   what makes districts readable.
7. **A district earns a name + its own encounter flavour** (extends §5's
   material contract from tiles to whole districts).

Proof build: Whispering Forest rebuilt under these rules (entry meadow /
pine deep / south mire / rune clearing, dirt trail, giant-tree landmark at
the grove gate, per-side edges, cool grade). Every older map gets the same
treatment as its wave revisits it; every new map is designed this way from
the bubble diagram up.

## 12. Sprite families — the dominant layer (2026-11-12, Tín's second call)

Composition v2 was necessary but not sufficient: Tín still read every map
as the same because the DOMINANT sprites — the one broadleaf tree and the
one orange-roof house — filled most of every frame. Rule 8: **every map
owns a sprite family**; the most-repeated tree and building in a map must
be that map's own. First family sheet (8 sprites, tools/extract_families_v1.py):
darkwood, willow, blossom, elder, dead, autumn, slate house (house2),
thatch house (house3). Assignments: Forest = darkwood + pine (blossom only
at the entry meadow), Grove = elders everywhere + elder boss, Fields =
blossom, Lake = willows on the shores, Riverbend = slate houses + willows,
Meadow Village keeps the original family as "home" (+ one thatch cottage),
Cave = rock/crystal (already its own). Dead + autumn are reserved for
Forest Deep / Grove Ruins. Extraction note: tree canopies need flood(85) +
a hard cream key (<38) — enclosed see-through pockets are painted with the
sheet's background colour and no flood threshold reaches them without
eating pale foliage.

## 13. Placement physics — the scale & grounding contract (2026-11-12)

Researched after Tín's call that placement and cutting were sloppy
(isometric sprite guides, footprint-first building workflow, the Makko
scale-ratios brief, FrameSprite prop contract). The contract, measured
against the shipped sprites (player reference: wanderer texture displayed
at 0.5 = **104 world px tall = 1.00**):

1. **One reference, ratios not vibes.** Every world sprite is a ratio of
   the player: ordinary tree 1.7–1.85×, elder/boss class 2.0–3.5×, house
   height ~1.9×, small props 0.4–1.2×. A sprite outside its class ratio is
   rescaled at placement (`scale` property) — never silently.
2. **Footprint first.** Collision = the tiles the object's BASE covers,
   decided before the sprite. Sprite width ≤ footprint width × ~1.55
   (roof/canopy overhang is normal; 2× is not — house2 at 254px on a
   2×2 footprint was the violation, now placed at 0.78).
3. **Grounding.** Origin is bottom-center at the base point; a sprite may
   rise above its tile freely but never sinks below its ground diamond.
   Depth sorts by the base Y only. One light direction (sun model) and
   shadow length ∝ sprite height class — no per-prop improvisation.
4. **Occlusion clearance.** No tall-canopy prop within Chebyshev 2 of a
   spawn, portal, NPC or boss ring: the arriving player must never be
   hidden behind a canopy. Solid walls of identical tall sprites are
   banned at borders too — alternate tall/low (checker) so edges breathe.
5. **Cut QA.** An extracted sprite must be ONE connected object: detached
   components under 4% of the main mass are deleted in the extractor
   (the elder's floating moss fleck was the violation). Judge every asset
   in the map at in-game size, in front of and behind a character — never
   on the sheet alone.
6. **Canopy fade (runtime half of rule 4).** Clearance rules govern new
   placements, but a player can walk behind ANY tall prop on any path.
   WorldScene therefore fades a tall prop (trees, houses) to 22% alpha
   whenever the player's base is behind its canopy footprint, restoring
   it as they step clear. The character must never be invisible in play.

## 14. Ground redraw v7 (2026-11-12, Tín's order "Vẽ lại nền đất")

All 17 ground frames were redrawn from two generated atlases
(tools/build_tileset_v7.py -> verdant-v7.png; frame indices unchanged,
so no map or bake changes were needed). Two lessons came with it:
- **Variant tiles must be tone-matched to their base tile.** The bake
  mixes frames 0/5/6/7 per cell for gid 1; the raw variants' luminance
  spread (51..141) rendered as a checkerboard, not texture. The build
  now pulls variant means ~78% toward the base frame (spread ~10).
- **Latent data patterns surface when tiles change.** Meadow Village's
  ground data was a literal (x+y)%2 gid 1/2 checkerboard — invisible
  while gid 2 was a sibling grass tone, glaring once gid 2 became true
  dark grass. Village ground is now gid 1 with soft dark patches only
  at the shady edges. When a tile's meaning changes, grep the map data
  for patterns that relied on the old meaning.
- The rocky tile's cracks showed the atlas background; the build fills
  background-coloured pixels inside a tile with the tile's own dark
  tone before applying the diamond mask.

## 15. Reference style (2026-11-12, Tín's Pokémon-village screenshot)

Tín's reference reads calm because of structure, not detail: nearly
FLAT ground (the quietest layer), WIDE dirt crossroads, buildings far
apart on big empty lawns, dressing only at nodes. Applied as the house
style: tileset v9/v10 (grass + dirt calm-flattened twice, dirt lifted
to pale tan) and Meadow Village rebuilt spacious — 3-wide dirt cross
streets, one house per quadrant + cottage with dirt aprons, signpost
in the middle of the cross, well/stall/lanterns only at the crossing,
no interior scatter. Known gap vs the reference: its road edges
feather into the grass; ours end at the diamond edge (transition tiles
are future work). The reference's camera is top-down; Eidolith stays
isometric (Part 8/14 lock + every asset is drawn for iso) unless Tín
orders a projection rebuild.

## 16. TOP-DOWN switch (2026-11-12, Tín's decision — supersedes the iso lock)

Tín chose the reference's projection outright: the world is now a
SQUARE top-down grid (tile 64×64 screen units). Implementation notes:
the client always read tileX/tileY (never the baked iso pixel coords),
so all 10 map JSONs carried over untouched; the switch lives in
WorldScene (worldFromGrid = tile centre, feet anchor at centre + 32,
camera zoom 1.25) and tileset verdant-top-v3 (square frames, same 17
indices). Sun disc is no longer drawn (no horizon in top-down; the
hour reads through light/shadows/rays/darkness — the moon ruling
generalised). Lessons: variant tiles must be picked by HASH, not a
linear formula (diagonal stripes/checkers on a square grid), variant
means must sit within ~7 luminance of the base, and atlas tiles need
their rims softened toward their own mean or every cell prints a hard
square border. Portal chain re-walked after the switch: village →
forest → grove PASS, wilds alive. The iso tilesets and code path are
recoverable from git history if ever needed.

## 17. Sharpness + flow pass (2026-11-12, Tín: "ko nét, ko uyển chuyển, thô")

Three root causes, all in the pipeline rather than the art itself:
(1) FRACTIONAL ZOOM 1.25 with NEAREST filtering scales texture pixels
unevenly (2px/3px mix) — shimmer. Camera zoom is now exactly 1.
(2) TILESET MUSH: the square tiles went through blur-calm + a 32px
half-res lean. v5 keeps native 64px grain, calm reduced to a whisper
(keep 0.8, r 0.8), palette widened to 160 — calm now comes from tone
matching, not blur.
(3) RIGHT-ANGLE WALKING: A* was 4-directional. findPath is now
8-directional with corner guards (no diagonal through blocked
corners) + line-of-sight smoothing — an open-field trip compresses to
a single diagonal glide (verified in a Node test against the real
village grid; the crossing still routes around the signpost cell,
correctly). A gentle walk sway stands in until real walk-cycle frames
exist (art batch, sample-first like all character art).

## 18. 2.5D oblique (2026-11-12, Tín: "Chuyển qua map kiểu 2.5d đi cho nét")

The square top-down read too flat, so the ground plane is now PITCHED:
worldFromGrid compresses rows by SQUASH = 0.8 while every sprite keeps
its full upright height — the classic oblique RPG presentation of the
reference family (roofs + fronts + canopies all read, characters stand
ON the plane instead of being pasted on a board). One-place change by
construction: bake, bounds, anchors (feet at centre + 26), shadows and
tap conversion all derive from worldFromGrid/gridFromWorld. Grid,
paths, portals and data are untouched; zoom stays integer 1.

## 19. Continuous ground (2026-11-12, Tín: "cỏ phải vẽ cỏ thật, không vẽ ô vuông nữa")

The bake is now four passes (WorldScene.buildMap): (1) ONE grass
texture at double size across the whole map — a single field, no
per-cell mosaic; (2) hard tiles for interior feature cells; (3) border
cells rebuilt from DIRECTIONAL feather variants (verdant-top-edge-v1,
frame*4+dir, feather on the shared edge only) over the neighbour's
surface — surfaces melt across their shared edge; (4) soft light/shade
blobs across cell boundaries. LESSON (measured, Python replica of the
bake): a full-frame feather over a full neighbour underlay FRAMES
every border cell in the neighbour's colour (tan picture-frames in
the forest shade) — feather must be directional, per shared edge.

## 20. Seamless painted ground (2026-11-12, Tín: "vẫn cứ ô vuông, nó phải liền")

The feathered-tile bake still printed squares because every TILE
carries a square tonal signature (bright centre, dark rim). Final
architecture: NO tiles are drawn. The bake paints one canvas per
map — each surface group gets a mask of its cells, the mask is
blurred (canvas filter), and a SEAMLESS texture is composited
through it in painter's order; speckle grain + soft blobs unify the
whole canvas. Textures: tools/build_surfaces_v1.py — the three big
fields (grass/dark/dirt) are cropped as LARGE PAINTED AREAS from the
source atlas cells (560px cells, not the 64px tiles), flattened,
mirror-wrapped to 1024; the small surfaces are mirror-wrapped from
their frames at 512. Lessons: (1) a tile-derived texture keeps its
vignette through any wrapping — flatten + a bigger period only
reduce it, a painted source area removes it; (2) mirror joins
concentrate dark rims into grid lines unless the source is flattened
first.
Crisp pass (same evening, Tín: "asset mờ, lem"): raw painted cells
read as watercolor smear next to pixel sprites — the big-field
textures now go through the game's pixel-lean (average to half,
NEAREST back up, hard quantize 128) so the grain is deliberate pixel
blocks; dirt returned to the frame-derived texture (the source
cell's painted ovals read as stains at field scale).
Prop crisp pass (same evening, Tín named trees/houses/well "lem"):
measured first — the v4 prop family carried 2.9k-12.5k semi-
transparent fringe pixels per sprite; the v1 family kept 124+
painterly colours. tools/lean_props_v2.py: hard alpha cut at 165,
pixel-lean 52%, quantize 56 from the opaque palette -> semi fringe
0 on all 29 in-use props (v4->v5, v1->v2; originals kept for
revert). Designs unchanged — rendering treatment only.

## 21. Full prop rebuild (Tín's order 2026-11-12 23:49 EST)
"Rebuild lại toàn bộ asset đi vẽ chuẩn chỉnh từng chi tiết, không
phông" — assets redrawn properly, transparent background. Method:
generate sheets on a FLAT SOLID MAGENTA background (keying becomes
surgical: no flood-fill fringe at all), pixel-art-native drawing,
extract (tools/extract_rebuild_v1.py: chroma key -> largest
component -> 1px erosion -> hard alpha -> lean 0.72 -> quantize
72), heights normalized to the current sprites so every map
contract holds. Golden batch = village core 6 (house v6, tree v6,
pine v6, well v3, stall v3, lantern v3) installed + shot in-game;
the remaining 23 rebuild after Tín approves the golden style.
Contact AO (Tín: scene read disjointed/"rời rạc"): the sun blob
shadow is offset by the hour, so nothing darkened the ground AT an
object's base — bold new sprites read as pasted stickers. Fix in
WorldScene: addStaticShadow now also pins a tight dark ellipse
exactly at the base (width 52 + 30*hFac, alpha .33, never moves),
and makeChildShadow returns a small container carrying the same
pinned AO (58x20) under every character/wild. Remaining dissonance
is mixed dialects: old soft props (signpost, pots, thatch cottage)
still sit beside the rebuilt bold ones — closing that needs the
full-set rebuild.
Full set DONE (Tín approved the golden style 2026-11-13 00:02
EST): 4 more sheets (forest trees / village dressing / sanctuary /
cave-small, style-matched to the golden sheet by reference image),
tools/extract_rebuild_v2.py extracted all 23 remaining props ->
v3 (v6 for rock/bush). All 29 in-use props now share ONE bold
pixel dialect; verified in-game in village, forest and cave.
Contact AO shipped the same night (see section above).

## 22. Squares, last two sources (Tín 2026-11-13: "vẫn còn ô vuông")
A Python replica of the bake exposed both: (1) the group masks
were full-res per-cell RECTS under a 7px blur, so every region
edge kept a stair-stepped square outline; (2) the surf textures
were built from single 64px frames, whose dark rim vignette
repeats as a visible GRID across fields (worst on dirt), with
mirror seams printing dark lines (grass/dark). Fixes: masks are
now drawn at 3px/cell (circle + core per cell) and upscaled ~21x
with smoothing + blur 5 at composite — edges interpolate into
organic curves; tools/build_surfaces_v2.py rebuilds all 11
surfaces from the v1 textures' INTERIOR (no rim, no seam lines),
lean + mirror + two roll-blends, 1024px. Verified by replica
crops, then in-game (village crossroads + forest shade boundary).

## 23. Rich-detail surfaces (Tín, BDSP reference again: "ko đc rõ
nét như này") — seamless-but-flat was not enough; the reference
ground is DENSE with fine detail. Golden pair rebuilt as
generated paintings: grass (thousands of blades, clover, tiny
flowers) + dirt (pebbles, grit, soil patches), tone-matched,
centre-cropped, mirror-seamed, light roll-blend 0.18, fine lean
0.85, palette 192 (tools/build_surfaces_v3.py; v2 surfaces backed
up in tilesets/backup-v2/). In-game the road and lawn now carry
the reference's detail density. Remaining 9 surfaces follow the
same recipe once the pair is approved.
Batch 2 done (same recipe, tools/build_surfaces_v4.py): dark
forest grass, flower meadow, sand, cobblestone, deep water,
shallow water, swamp, rocky ground, plank deck — all 11 surfaces
now rich-detail paintings. Shallow was cropped from the sheet's
open-water area only (the quadrant was a shoreline scene).
FALLOUT FIX: Mist Marsh pools wore sand (gid 7) shores + shallow
foam rings that were subtle with the old muted textures but read
as bright tropical lagoons with the vivid set — gen_marsh.py now
makes pool shores swamp mud (gid 10) and pools pure deep water.

## 24. Wave 1 maps 11–13 (2026-11-13)
Hilltop Shrine (gen_shrine.py; from Forest Deep's new north
corridor): stone processional steps with paired lanterns climbing
to a shrine terrace, pine slopes, Lv.10–14. Farm Acres
(gen_farm.py; from Windmill Fields' west gate): tilled plots with
planter crop rows, thatch farmhouse yard (house3 + well + hive),
blossom orchard, duck pond, Lv.4–7. Forest Camp (gen_camp.py;
from Forest Deep's west arm): hunters' clearing — thatch lodge,
training dummies, stump ring, mushroom fen corner, Lv.5–9.
Forest Deep gained both new gates (path cells forced before
scatter — the orphan-portal lesson). Whole chain portal-WALKED
both directions in one session (village→fields→farm→…→deep→
shrine→deep→camp→deep); validator 13/13. Tour note: BFS-over-
collision waypoint feeding replaced straight-line hops (the
rebuilt forest's trail winds; straight hops stall on trees).

## 25. Firm-edge pass — "cứ bị lem lem" (2026-11-13)
Diagnosis, measured: the ground's mean gradient is HIGHER than
the BDSP reference (14–17 vs ~3) — the reference is smooth but
CLEAN. Our smear came from the bake itself: melted masks at
3px/cell upscaled ~21x with blur(5px) feathered every region
border into a ~20px blend band, and the finish pass smeared 22
soft radial light/shade blobs (r 130–430, alpha .05–.07) across
every interior. Fix (WorldScene buildMap): masks now 6px/cell
(upscale ~10.7x), circle r 0.62, blur 1.5px → organic corners,
~5px decisive edges; blob finish DELETED; speckle 5200 → 1600
at lower alpha. Verified in-game at confirmed midday (sun hook
elev 0.95): camp clearing + shrine processional — borders are
firm lines, interiors clean, no stain-blobs. Rule going
forward: organic SHAPE, decisive EDGE, clean INTERIOR — melt
the geometry, never the paint.
