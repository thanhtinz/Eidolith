// Phase 5 Progression — quest state + reward claims (Part 10 objectives).
import { Router } from "express";
import { ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { query } from "../db.js";
import { Errors } from "../http.js";
import { questState, claimQuest, acceptSideQuest, claimSideQuest } from "../progression.js";

export const progressionRouter = Router();
progressionRouter.use(requireAuth);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}

progressionRouter.get("/progression/quests", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    ok(req, res, await questState(playerId));
  } catch (e) { next(e); }
});

// Side quests (Phase 5b): accept/claim at the NPC. Registered before the
// generic ":scope/:key/claim" route so "side" is never parsed as a scope.
progressionRouter.post("/progression/quests/side/:key/accept", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    await acceptSideQuest(playerId, req.params.key);
    ok(req, res, await questState(playerId));
  } catch (e) { next(e); }
});

progressionRouter.post("/progression/quests/side/:key/claim", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    ok(req, res, await claimSideQuest(playerId, req.params.key));
  } catch (e) { next(e); }
});

progressionRouter.post("/progression/quests/:scope/:key/claim", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    ok(req, res, await claimQuest(playerId, req.params.scope, req.params.key));
  } catch (e) { next(e); }
});
