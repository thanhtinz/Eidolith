# PHASE6-MULTIPLAYER-v1 — Phase 6: Multiplayer MVP (Part 12)

> Phạm vi Part 12 MVP: bạn bè, tổ đội, khu vực đầu chơi chung, chat có kiểm
> duyệt, boss co-op bản thử, đấu giao hữu, đấu trường bất đồng bộ. PvP thời
> gian thực / guild war / chợ đấu giá để sau MVP (Part 12 chốt hoãn).
> Chia 2 đợt: **Đợt 1 (tài liệu này)**: Bạn bè + Chat khu vực + Đấu giao
> hữu. **Đợt 2**: Tổ đội + Boss co-op + Đấu trường bất đồng bộ.

## 1. Bạn bè (đợt 1)

- Bảng `social.friendships`: một hàng cho mỗi cặp (requester → addressee,
  status pending/accepted), chặn tự kết bạn và trùng lặp hai chiều.
- API: `GET /social/friends` (bạn bè + lời mời đến/đi, kèm cờ online từ
  phiên WS đang sống), `GET /social/search?q=` (tìm theo tên hiển thị,
  tối đa 10, kèm quan hệ hiện tại), `POST /social/friends/request`
  (nếu phía kia đã gửi lời mời trước đó thì chấp nhận luôn),
  `POST /social/friends/:id/accept` + `/decline`, `DELETE
  /social/friends/:playerId` (huỷ kết bạn / rút lời mời).
- Panel Bạn bè mở từ ô Bạn bè trong Menu: tìm bạn, lời mời, danh sách
  (chấm online, cấp, nút Đấu giao hữu).

## 2. Chat khu vực + thế giới (đợt 1; tab Thế giới bổ sung 2026-11-12)

- Hai kênh: **Khu vực** (map hiện tại) và **Thế giới** (mọi người chơi
  đang online, mọi map) — khung chat có 2 tab, tab chưa đọc có chấm đỏ.
  Client gửi WS `world.chat.send {content, channel}`; server kiểm tra:
  đã đăng nhập WS, tối đa 200 ký tự, tối thiểu 1.500 ms giữa hai tin của
  cùng người (chung cả hai kênh), lọc từ cấm (danh sách `BANNED_WORDS`
  trong world.ts — thay bằng `***`).
- Server phát `world.chat.message {playerId, displayName, content, ts}`
  cho cả khu vực (kể cả người gửi) và ghi `social.chat_messages` để có
  vết kiểm duyệt (Part 16 moderation queue đọc bảng này ở Phase 7).
- UI: khung chat góc trái-dưới trong thế giới — 5 tin gần nhất + ô nhập;
  vùng chat không chặn chạm di chuyển ngoài chính ô nhập/nút gửi.

## 3. Đấu giao hữu (đợt 1)

- `POST /battles {mode: "friend", opponentPlayerId, instanceIds}`: đội
  địch = 5 cá thể đầu tiên của đối thủ (cùng quy ước đội hình như panel:
  mới nhất trước). Điều kiện: hai người PHẢI là bạn bè (422 nếu chưa).
- Giao hữu **không tính thưởng**: không XP/gold/Core, không tính nhiệm
  vụ/thống kê — thuần giải trí (chống farm tài khoản phụ). Kết quả vẫn
  lưu replay như trận thường (mode = "friend").
- Eidolon đang thám hiểm của phía người thách đấu vẫn bị khoá như mọi
  trận (kiểm tra expedition sẵn có); phía đối thủ là ảnh chụp đội hình
  nên không khoá.

## 4. Đợt 2 (chưa làm)

Tổ đội 2–4 người (mời/chấp nhận, hiển thị trong thế giới), boss co-op
bản thử (hai đội cùng vào trận Treant, server gộp đội hình), đấu trường
bất đồng bộ (đội phòng thủ + bảng xếp hạng theo điểm thắng/thua).
