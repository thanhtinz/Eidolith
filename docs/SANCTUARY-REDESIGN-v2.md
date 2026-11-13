# SANCTUARY REDESIGN v2 — thiết kế lại chi tiết

> **TRẠNG THÁI: Tín duyệt Mockup A 2026-11-11 22:13 ("A ok nhưng mà bị
> dính nhau quá") → bản A2 nới thoáng (ô lưới 2 cột, thẻ cao, panel cuộn
> tự nhiên) → ĐỢT 1 ĐÃ CODE XONG + kiểm chứng (test API 32/32, tour Chrome
> thật). ĐỢT 2 CŨNG ĐÃ XONG (Tín lệnh "Tiếp tục" 2026-11-12): Expedition
> Gate 3 chuyến như §3 đợt 2 (phần thưởng roll lúc xuất phát, khoá Eidolon
> khỏi phân công + ra trận tới khi nhận kết quả) và Workshop 2 công thức
> Orb — test API 27/27 + tour Chrome thật (shots/sanc-v2-expedition.png,
> sanc-v2-exp-picker.png, sanc-v2-workshop.png, sanc-v2-exp-ready.png).
> Sanctuary v2 coi như hoàn thiện; còn lại thuộc các hệ thống khác:
> Đài tiến hoá chờ duyệt EVOLUTION-DRAFT, Market thuộc Phase 6.** Hai chỉnh so với bản trình đầu: (1) giá nâng Nhà chính chốt
> 300/600/1.200/2.400 Gold cho Lv.2–5 (theo đúng số trên mockup đã duyệt);
> (2) Research Lab mở ngay từ đầu như mockup thể hiện (không khoá theo
> Nhà chính Lv.3 như đề xuất §5.4 ban đầu).
>
> Tín lệnh 2026-11-11 22:04 EST: "Sanctuary ấy thiết kế lại chi tiết hơn".
> Bản này đối chiếu Sanctuary hiện tại (Phase 5b, main bc18344) với tài liệu
> gốc: Part 1 §9 (8 công trình + hoạt động theo nguyên tố/đặc tính),
> Part 2 §27 (cấp công trình, 6 chức năng, quản lý căn cứ) + §28 (Expedition),
> Part 6 §13 (API build/upgrade/assign/collect), Part 8 §18 (Sanctuary là khu
> vực riêng, trạng thái lưu server). Mọi con số tài liệu không cho đều ghi
> **BASELINE** — Bé đặt, Tín duyệt mới code hoá.
> Ngữ pháp giao diện giữ nguyên Hướng A "Chuẩn Pokémon" đã chốt
> (docs/UI-POKEMON-A.md): tấm slate, vàng #ffd83d cho hành động chính,
> pill màu hệ, **số nằm trong thanh**, icon Font Awesome tự host, không emoji.

## 1. Hiện tại thiếu gì (đã soi code + ảnh chụp thật p5b-sanctuary2)

1. **Thiếu 4/8 công trình của Part 1 §9**: chưa có Research Lab, Workshop,
   Expedition Gate, Market. Panel chỉ có Nhà chính (thẻ thông tin trống),
   Vườn gắn kết, Sân tập, Đài tiến hoá khoá.
2. **Không có cấp công trình thật**: mọi thẻ đều ghi "Lv.1" cứng trong code;
   Part 2 §27.1 yêu cầu cấp ảnh hưởng sản lượng / số ô / mở khoá chức năng,
   Part 6 §13 có endpoint upgrade — cả hai chưa làm.
3. **Thẻ công trình quá sơ sài**: tất cả dùng chung một icon nhà, một dòng
   mô tả; không thấy sản lượng, số ô, trần tích luỹ, thời gian đã tích,
   còn bao lâu tới điểm tiếp theo / tới khi đầy.
4. **Ô phân công thiếu thông tin**: chỉ có tên + Lv + Bond + "+N" — không có
   pill hệ, thanh XP/Bond có số, thanh tiến độ tích luỹ của từng con.
5. **Không có cộng hưởng nguyên tố**: Part 1 §9.2 chốt "mỗi hoạt động yêu cầu
   nguyên tố hoặc đặc tính phù hợp" — hiện phân con nào vào cũng như nhau,
   picker không gợi ý con nào hợp.
6. **Không có dải tổng quan**: không biết toàn Sanctuary đang có bao nhiêu
   con đang làm việc, tổng chờ thu hoạch là bao nhiêu; thu hoạch phải bấm
   từng công trình, không có "Thu hoạch tất cả".
7. **Picker phẳng**: danh sách chọn Eidolon không có hệ/vai trò/thanh XP,
   không sắp xếp theo độ phù hợp, con đang ở công trình khác cũng không ghi.
8. **Sanctuary không có hình hài một căn cứ**: Part 8 §18 + TDD Part 4 có
   SanctuaryScene / map `sanctuary_home` (P1) — hiện Sanctuary chỉ là một
   danh sách trong panel, không nhìn thấy công trình và Eidolon đang ở đó.

## 2. Cấu trúc mới — panel Sanctuary v2

Panel giữ nguyên khung 950px của hub, chia 3 tầng:

### 2.1. Dải tổng quan (đầu panel, luôn thấy)

- **Cấp Sanctuary** (= cấp Nhà chính): pill vàng "Sanctuary Lv.2" + thanh
  tiến độ nâng cấp Nhà chính.
- **Đang làm việc**: "5 / 9 ô đang có Eidolon".
- **Chờ thu hoạch**: tổng hợp mọi công trình, ví dụ "+14 Bond · +386 XP ·
  +6 Research Data". Nút vàng **Thu hoạch tất cả** (chỉ sáng khi > 0) nằm
  ở HÀNG RIÊNG ngay dưới dải tổng quan kèm dòng tổng đang chờ — vị trí do
  Tín chốt 2026-11-11 22:26 ("Nút thu hoạch tất cả để chỗ khác"); để nút
  trong dải tổng quan thì dải bị chật, bản thanh dính đáy panel cũng đã
  thử và bỏ vì nổi che thẻ công trình khi cuộn.
- Đồng hồ tích luỹ: "Trần tích luỹ 8 giờ" + con nào sắp đầy thì có chấm
  vàng cảnh báo trên thẻ công trình của nó.

### 2.2. Thẻ công trình chi tiết (thay thẻ 1 dòng hiện tại)

Mỗi công trình một thẻ riêng, icon Font Awesome riêng (không dùng chung
icon nhà nữa), gồm:

- Hàng đầu: icon trong ô vuông màu riêng + **Tên + pill Lv.N** + nút
  **Nâng cấp** (hiện giá Gold; bấm mở khối xác nhận nhỏ ngay trong thẻ:
  cấp mới được gì — thêm ô / tăng sản lượng bao nhiêu — đúng luật
  "một việc một cửa", không thêm panel lồng panel).
- Hàng thông số (chữ nhỏ, nhãn vàng hoa): **Sản lượng** (vd "1 Bond /
  10 phút / con"), **Ô** (3/3), **Cộng hưởng** (hệ hợp, vd Grove · Tide
  +20%), **Trần** (8 giờ).
- **Thanh tích luỹ của công trình**: lõi xanh lá, số nằm trong thanh —
  "Đã tích 386 / 960 XP · đầy sau 4 giờ 47 phút nữa".
- Hàng ô phân công: mỗi ô là một thẻ con ngang bằng nhau (luật cân đối):
  sprite, tên, pill Lv, pill hệ, **thanh Bond (tim) hoặc thanh XP có số**,
  dòng "+đã tích · còn X phút tới điểm tiếp theo", nút rút (x) — rút vẫn mất
  phần chưa thu, ghi rõ ngay dưới hàng ô như hiện tại.
- Ô trống: nút "+ Phân công" + dòng gợi ý hệ hợp ("Hợp: Grove · Tide").
- Công trình chưa xây (Đài tiến hoá / Workshop khi chưa mở): thẻ mờ,
  ghi điều kiện mở khoá cụ thể thay cho chữ "Chưa xây" chung chung —
  vd Đài tiến hoá: "Mở khi Tín duyệt bản tiến hoá + người chơi Lv.10".

### 2.3. Picker (chọn Eidolon phân công) chi tiết hơn

- Mỗi hàng: sprite, tên, pill Lv, pill hệ, nhãn vai trò, thanh XP có số,
  Bond dạng tim, và **nhãn cộng hưởng** khi hợp công trình đang chọn:
  pill vàng "Hợp hệ +20%" — các con hợp được xếp lên đầu, có mục nhỏ
  "GỢI Ý CHO CÔNG TRÌNH NÀY" tách khỏi "TẤT CẢ EIDOLON".
- Con đang phân công ở công trình khác: hàng mờ + ghi đang ở đâu,
  không bấm được (tránh rút nhầm mất tích luỹ).

## 3. Hệ thống mới đi kèm (theo đúng spec, chia 2 đợt code)

### Đợt 1 — làm ngay khi Tín duyệt mockup

1. **Cấp công trình Lv.1 → Lv.5** (Part 2 §27.1, Part 6 §13 upgrade):
   cấp công trình không vượt quá cấp Nhà chính. BASELINE:

   | Công trình | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
   |---|---|---|---|---|---|
   | Nhà chính (Hall) | mở khoá cơ bản | trần tích luỹ 10h | mở Research Lab | trần 12h | mở Workshop |
   | Vườn gắn kết (Habitat) — ô / tốc độ Bond | 3 ô · 1/10' | 3 ô · 1/9' | 4 ô · 1/8' | 4 ô · 1/7' | 5 ô · 1/6' |
   | Sân tập (Training) — ô / XP mỗi phút | 2 ô · 2 | 3 ô · 2 | 3 ô · 3 | 4 ô · 3 | 4 ô · 4 |
   | Research Lab — ô / Data mỗi giờ | — | — | 2 ô · 1 | 3 ô · 1 | 3 ô · 2 |

   Giá nâng cấp BASELINE: Lv.2 = 150 Gold, Lv.3 = 400 Gold,
   Lv.4 = 900 Gold, Lv.5 = 1.800 Gold; Nhà chính 300/600/1.200/2.400
   (số đã chốt theo mockup duyệt). Nâng lên Lv.4/Lv.5 tốn thêm
   10/25 Research Data (mọi công trình, gồm Nhà chính).
   Trần tích luỹ theo Nhà chính: 8h → 10h → 12h (Lv.1 / 2–3 / 4–5).
2. **Cộng hưởng nguyên tố** (Part 1 §9.2) BASELINE: đúng hệ gợi ý hoặc
   đúng vai trò gợi ý → **+20% sản lượng** (làm tròn xuống như luật tích
   luỹ hiện tại). Gợi ý: Vườn gắn kết = Grove · Tide / Support;
   Sân tập = Stone · Gale / Striker · Guardian;
   Research Lab = Astral · Volt / Controller · Specialist.
3. **Research Lab** (Part 2 §27.2): phân công Eidolon → sinh **Research
   Data** (tiền tệ có sẵn trong Part 1 §10.1) theo thời gian, trần như
   các công trình khác. Research Data dùng để: trả giá nâng cấp công
   trình Lv.4–5 (thay một phần Gold, BASELINE Lv.4 = 10 Data, Lv.5 =
   25 Data) và sau này mở nghiên cứu kỹ năng/nhánh tiến hoá (giai đoạn
   sau, chưa code ở đợt 1 ngoài việc tích trữ + hiện trong dải tổng quan).
4. **Thu hoạch tất cả** + số liệu thời gian thật từ server: API GET
   /sanctuary bổ sung cho mỗi phân công: phần đã tích, tỉ lệ đầy (0–1),
   giây tới điểm nguyên tiếp theo, giây tới trần. Client chỉ hiển thị,
   server vẫn là nơi chốt số (Part 8 §18.2).
5. **Chấm báo thu hoạch**: khi tổng chờ thu hoạch > 0, nút Sanctuary
   trong menu có chấm vàng nhỏ (giống cách game khác báo) — đề xuất,
   Tín không thích thì bỏ, không tự áp.

### Đợt 2 — thiết kế sẵn ở bản này, code sau khi đợt 1 chạy ổn

6. **Expedition Gate** (Part 2 §27.2 + §28): phái 1–3 Eidolon đi chuyến
   cố định — có Destination / Duration / yêu cầu hệ + vai trò / mức rủi
   ro / bảng thưởng công khai trước khi đi:
   - "Rìa rừng Whispering" — 30 phút — thưởng Gold + Bond Essence.
   - "Bờ hồ Crystal" — 2 giờ — yêu cầu có hệ Tide — thưởng Gold +
     nguyên liệu + ít Research Data. (Map Crystal Lake chưa dựng —
     chuyến vẫn đi được, chỉ là tên điểm đến.)
   - "Sâu trong Ancient Grove" — 8 giờ — yêu cầu tổng Lv ≥ 30 —
     thưởng có tỉ lệ Evolution Core (BASELINE 20%).
   Eidolon đang đi thám hiểm bị khoá khỏi phân công/đội hình; hết giờ
   vào Sanctuary nhận kết quả (thành công theo chỉ số + hệ + trait —
   công thức theo §28.4, số BASELINE chốt khi code đợt 2).
7. **Workshop** (Part 2 §27.2): chế tạo từ nguyên liệu thám hiểm —
   MVP đợt 2 chỉ 2 công thức BASELINE: Orb thường ×3 (60 Gold) và
   Orb cao cấp ×1 (150 Gold + 2 Bond Essence). Cần chốt cùng đợt
   danh mục vật phẩm 50+ đang treo (điểm mở số 4 ở KE-HOACH-MVP).
8. **Đài tiến hoá**: giao diện đã thiết kế sẵn trong mockup (thẻ khoá có
   điều kiện) — chỉ mở khi Tín duyệt docs/EVOLUTION-DRAFT-v1.md.
9. **Market**: Part 1 §9 có nhưng Part 11 chốt giao dịch thuộc hệ thống
   chợ người chơi (Phase 6 multiplayer) — KHÔNG đưa vào Sanctuary v2,
   ghi rõ để khỏi trùng hệ thống.

### Về "Sanctuary thành một khu vực nhìn thấy được" (điểm 8 ở §1)

Có 2 cách trình bày — Bé dựng 2 mockup để Tín chọn (kèm ảnh):

- **Mockup A — "Thẻ chi tiết"**: giữ dạng panel như hiện tại nhưng thay
  toàn bộ nội dung bằng cấu trúc §2 (tổng quan + thẻ công trình chi tiết
  + picker gợi ý). Làm nhanh, chắc chắn chạy mượt trên điện thoại, mọi
  số liệu đọc rõ. Yếu: vẫn là "một cái panel", chưa có cảm giác căn cứ.
- **Mockup B — "Sơ đồ căn cứ"**: nửa trên panel là **sơ đồ Sanctuary vẽ
  bằng asset thật của game** (nền cỏ, nhà chính, vườn, sân tập, đài —
  Eidolon đang phân công đứng tại công trình của chúng, nhãn tên + bong
  bóng "+N" khi có tích luỹ chờ thu); bấm vào một công trình thì nửa
  dưới hiện đúng thẻ chi tiết của công trình đó (cùng nội dung như A).
  Đây là bước đệm hình ảnh cho map `sanctuary_home` thật ở giai đoạn
  sau: khi đó bấm "Vào Sanctuary" sẽ đi hẳn vào một map riêng đi lại
  được. Yếu: tốn diện tích dọc hơn, xem nhanh số liệu toàn căn cứ kém
  hơn A một chút (phải bấm từng công trình).

Hệ thống bên dưới (đợt 1 + đợt 2) giống nhau ở cả hai phương án — Tín
chọn A hay B chỉ đổi cách trình bày, không đổi API/số liệu.

## 4. Thay đổi kỹ thuật dự kiến (đợt 1)

- Migration `007_sanctuary_v2.sql`: bảng `sanctuary.buildings`
  (player_id, building_id, level) + cột Research Data vào ví (dùng
  bảng ví hiện có, thêm currency `research_data`) — không đụng bảng
  `assignments` hiện tại ngoài việc đọc thêm creature element/role
  (lấy từ game-data, không lưu trùng).
- Server: `BUILDINGS` thành bảng cấp (slots/tốc độ theo level), thêm
  `POST /sanctuary/buildings/:id/upgrade`, `POST /sanctuary/collect-all`;
  GET /sanctuary trả thêm `level`, `progress01`, `nextUnitInSec`,
  `capInSec`, `synergy` cho từng phân công và tổng chờ thu hoạch.
- Client: viết lại renderer `sanctuary` trong hub.ts + CSS mới theo
  token Pokémon A; picker có mục gợi ý; nút Nâng cấp xác nhận tại chỗ.
- Kiểm chứng: test API mới (nâng cấp đúng giá/khoá theo Nhà chính,
  cộng hưởng +20% đúng, thu hoạch tất cả không trùng/không mất phần lẻ)
  + tour Chrome thật chụp panel ở trạng thái có tích luỹ.

## 5. Điểm cần Tín chốt khi duyệt

1. Chọn **Mockup A hay B** (hoặc B cho giao diện + giữ dải tổng quan của A).
2. Bảng cấp + giá nâng cấp ở §3 đợt 1 (BASELINE) — giữ hay chỉnh số.
3. Cộng hưởng +20% — giữ, hay bỏ để phân công tự do hoàn toàn.
4. Research Lab mở ở Nhà chính Lv.3 — hay mở ngay từ đầu.
