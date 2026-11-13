// Phase 6 wave 1 — Friends (Part 12 MVP, docs/PHASE6-MULTIPLAYER-v1.md §1).
import { Router } from "express";
import { query } from "../db.js";
import { ApiError, Errors, ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { onlinePlayerIds, onlinePlayerMap } from "../world.js";

export const socialRouter = Router();
socialRouter.use(requireAuth);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}
const err = (status: number, code: string, message: string) => new ApiError(status, code, message);

interface ProfileRow { id: string; display_name: string; level: number; avatar_id: string }
const view = (r: ProfileRow, online: Set<string>) => ({
  playerId: r.id, displayName: r.display_name, level: Number(r.level), avatarId: r.avatar_id,
  online: online.has(r.id),
});

socialRouter.get("/social/friends", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const online = onlinePlayerIds();
    const { rows: friendRows } = await query<ProfileRow>(
      `SELECT p.id, p.display_name, p.level, p.avatar_id FROM social.friendships f
       JOIN players.player_profiles p ON p.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted' ORDER BY p.display_name`, [me]);
    const { rows: incoming } = await query<ProfileRow & { fid: string }>(
      `SELECT f.id AS fid, p.id, p.display_name, p.level, p.avatar_id FROM social.friendships f
       JOIN players.player_profiles p ON p.id = f.requester_id
       WHERE f.addressee_id = $1 AND f.status = 'pending' ORDER BY f.created_at`, [me]);
    const { rows: outgoing } = await query<ProfileRow & { fid: string }>(
      `SELECT f.id AS fid, p.id, p.display_name, p.level, p.avatar_id FROM social.friendships f
       JOIN players.player_profiles p ON p.id = f.addressee_id
       WHERE f.requester_id = $1 AND f.status = 'pending' ORDER BY f.created_at`, [me]);
    // Companion cards (redesign A): each friend also carries a team preview
    // (first 5 owned) and their current map when online.
    const maps = onlinePlayerMap();
    const teams = new Map<string, { creatureId: string; level: number }[]>();
    if (friendRows.length) {
      const { rows: trows } = await query<{ player_id: string; creature_id: string; level: number }>(
        `SELECT player_id, creature_id, level FROM creatures.creature_instances
         WHERE player_id = ANY($1::uuid[]) ORDER BY acquired_at DESC`, [friendRows.map(r => r.id)]);
      for (const t of trows) {
        const arr = teams.get(t.player_id) ?? [];
        if (arr.length < 5) arr.push({ creatureId: t.creature_id, level: Number(t.level) });
        teams.set(t.player_id, arr);
      }
    }
    ok(req, res, {
      friends: friendRows.map(r => ({ ...view(r, online), team: teams.get(r.id) ?? [], mapId: maps.get(r.id) ?? null })),
      incoming: incoming.map(r => ({ requestId: r.fid, ...view(r, online) })),
      outgoing: outgoing.map(r => ({ requestId: r.fid, ...view(r, online) })),
    });
  } catch (e) { next(e); }
});

socialRouter.get("/social/search", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) throw err(422, "SOCIAL_QUERY_SHORT", "Nhập ít nhất 2 ký tự để tìm người chơi");
    const online = onlinePlayerIds();
    const { rows } = await query<ProfileRow & { rel: string | null }>(
      `SELECT p.id, p.display_name, p.level, p.avatar_id,
         (SELECT CASE WHEN f.status = 'accepted' THEN 'friend'
                      WHEN f.requester_id = $1 THEN 'outgoing'
                      ELSE 'incoming' END
          FROM social.friendships f
          WHERE (f.requester_id = $1 AND f.addressee_id = p.id) OR (f.requester_id = p.id AND f.addressee_id = $1)
          LIMIT 1) AS rel
       FROM players.player_profiles p
       WHERE p.id <> $1 AND p.display_name ILIKE $2 ORDER BY p.display_name LIMIT 10`, [me, `%${q}%`]);
    ok(req, res, { results: rows.map(r => ({ ...view(r, online), relation: r.rel ?? "none" })) });
  } catch (e) { next(e); }
});

socialRouter.post("/social/friends/request", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const { playerId } = req.body as { playerId?: string };
    if (!playerId || typeof playerId !== "string") throw err(422, "SOCIAL_PLAYER_INVALID", "Thiếu người chơi đích");
    if (playerId === me) throw err(422, "SOCIAL_SELF", "Không thể kết bạn với chính mình");
    const { rows: target } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE id = $1`, [playerId]);
    if (!target.length) throw err(404, "SOCIAL_PLAYER_NOT_FOUND", "Người chơi không tồn tại");
    const { rows: existing } = await query<{ id: string; status: string; requester_id: string }>(
      `SELECT id, status, requester_id FROM social.friendships
       WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`, [me, playerId]);
    if (existing.length) {
      const f = existing[0];
      if (f.status === "accepted") throw err(422, "SOCIAL_ALREADY_FRIENDS", "Hai người đã là bạn bè");
      if (f.requester_id === me) throw err(422, "SOCIAL_ALREADY_REQUESTED", "Đã gửi lời mời rồi — chờ phía kia trả lời");
      // They asked first: sending back = accepting theirs.
      await query(`UPDATE social.friendships SET status = 'accepted', responded_at = now() WHERE id = $1`, [f.id]);
      ok(req, res, { status: "accepted" });
      return;
    }
    await query(`INSERT INTO social.friendships (requester_id, addressee_id) VALUES ($1, $2)`, [me, playerId]);
    ok(req, res, { status: "pending" });
  } catch (e) { next(e); }
});

socialRouter.post("/social/friends/:id/accept", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const { rows } = await query(
      `UPDATE social.friendships SET status = 'accepted', responded_at = now()
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING id`, [req.params.id, me]);
    if (!rows.length) throw err(404, "SOCIAL_REQUEST_NOT_FOUND", "Lời mời không tồn tại hoặc đã xử lý");
    ok(req, res, { status: "accepted" });
  } catch (e) { next(e); }
});

socialRouter.post("/social/friends/:id/decline", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const { rows } = await query(
      `DELETE FROM social.friendships WHERE id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING id`, [req.params.id, me]);
    if (!rows.length) throw err(404, "SOCIAL_REQUEST_NOT_FOUND", "Lời mời không tồn tại hoặc đã xử lý");
    ok(req, res, { status: "declined" });
  } catch (e) { next(e); }
});

socialRouter.delete("/social/friends/:playerId", async (req: AuthedRequest, res, next) => {
  try {
    const me = await profileIdOf(req.userId!);
    const { rows } = await query(
      `DELETE FROM social.friendships
       WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1) RETURNING id`,
      [me, req.params.playerId]);
    if (!rows.length) throw err(404, "SOCIAL_RELATION_NOT_FOUND", "Không có quan hệ bạn bè/lời mời với người này");
    ok(req, res, { status: "removed" });
  } catch (e) { next(e); }
});
