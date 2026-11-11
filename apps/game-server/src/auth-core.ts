import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { query } from "./db.js";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function signAccessToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId }, config.jwtSecret, { expiresIn: config.accessTokenTtlSeconds });
}
export interface AccessPayload { sub: string; sid: string; }
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, config.jwtSecret) as AccessPayload;
}
/** Creates a session row with a hashed refresh token; returns the raw token pair. */
export async function createSession(userId: string, deviceId?: string) {
  const refreshToken = randomBytes(48).toString("hex");
  const expires = new Date(Date.now() + config.refreshTokenTtlDays * 86400_000);
  const { rows } = await query<{ id: string }>(
    `INSERT INTO players.player_sessions (user_id, device_id, refresh_token_hash, expires_at) VALUES ($1,$2,$3,$4) RETURNING id`,
    [userId, deviceId ?? null, hashToken(refreshToken), expires.toISOString()]);
  const sessionId = rows[0].id;
  return { accessToken: signAccessToken(userId, sessionId), refreshToken, expiresIn: config.accessTokenTtlSeconds, sessionId };
}
