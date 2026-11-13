import { Router } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { isValidEmail, isValidPassword, isValidUsername } from "@eidolith/validation";
import type { RegisterRequest, LoginRequest, RefreshRequest, AuthTokens, LoginResponse, RegisterResponse } from "@eidolith/shared-types";
import { query, pool } from "../db.js";
import { Errors } from "../http.js";
import { ok } from "../http.js";
import { createSession, hashToken } from "../auth-core.js";
import { rateLimit, requireAuth, type AuthedRequest } from "../middleware.js";
export const authRouter = Router();
const loginLimiter = rateLimit(10, 60_000);

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = req.body as RegisterRequest;
    const details: Record<string, unknown> = {};
    if (!isValidEmail(body.email ?? "")) details.email = "Email không hợp lệ";
    // Username is OPTIONAL since the character-creation flow (2026-11-12): the
    // name is chosen at creation, not at register. Clients that still send one
    // (legacy/tests) keep the old named-at-register path.
    const namedAtRegister = typeof body.username === "string" && body.username.trim().length > 0;
    if (namedAtRegister && !isValidUsername(body.username ?? "")) details.username = "Tên nhân vật 3–20 ký tự, chỉ gồm chữ cái và số — không dùng ký tự đặc biệt";
    if (!isValidPassword(body.password ?? "")) details.password = "Mật khẩu tối thiểu 8 ký tự, gồm chữ và số";
    if (Object.keys(details).length) throw Errors.validation(details);
    const username = namedAtRegister ? body.username!.trim() : `w${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const existing = await query(`SELECT id FROM auth.users WHERE lower(email)=lower($1) OR lower(username)=lower($2)`, [body.email, username]);
    if (existing.rows.length) {
      const row = await query<{ email: string; username: string }>(`SELECT email, username FROM auth.users WHERE lower(email)=lower($1) OR lower(username)=lower($2)`, [body.email, username]);
      throw row.rows[0].email.toLowerCase() === body.email.toLowerCase() ? Errors.emailTaken() : Errors.usernameTaken();
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO auth.users (email, username, password_hash) VALUES ($1,$2,$3) RETURNING id`, [body.email, username, passwordHash]);
      const userId = rows[0].id;
      const { rows: profileRows } = await client.query<{ id: string }>(
        `INSERT INTO players.player_profiles (user_id, display_name) VALUES ($1,$2) RETURNING id`, [userId, username]);
      if (namedAtRegister) {
        await client.query(`UPDATE players.player_profiles SET character_created_at = now() WHERE user_id = $1`, [userId]);
      }
      const playerId = profileRows[0].id;
      await client.query(`INSERT INTO players.player_settings (player_id) VALUES ($1)`, [playerId]);
      await client.query(`INSERT INTO players.player_progress (player_id) VALUES ($1)`, [playerId]);
      // Wallet (Part 5 §7) + starter grant — MVP baseline amounts, audited as
      // currency_transactions with reason 'starter_grant' (see HUD-TOP-DESIGN-v1).
      const STARTER: [string, number][] = [["gold", 500], ["crystal", 30], ["bond_essence", 0], ["evolution_core", 0]];
      await client.query(
        `INSERT INTO inventory.player_inventory (player_id, item_id, quantity) VALUES ($1,'basic_capture_orb',5)`, [playerId]);
      for (const [currency, amount] of STARTER) {
        await client.query(`INSERT INTO economy.player_wallets (player_id, currency_id, balance) VALUES ($1,$2,$3)`, [playerId, currency, amount]);
        if (amount > 0) await client.query(
          `INSERT INTO economy.currency_transactions (player_id, currency_id, amount, balance_after, reason) VALUES ($1,$2,$3,$3,'starter_grant')`, [playerId, currency, amount]);
      }
      await client.query("COMMIT");
      const response: RegisterResponse = { userId, emailVerificationRequired: true };
      ok(req, res, response, 201);
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
  } catch (e) { next(e); }
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const body = req.body as LoginRequest;
    if (!body.email || !body.password) throw Errors.validation({ credentials: "Thiếu email hoặc mật khẩu" });
    const { rows } = await query<{ id: string; username: string; password_hash: string; status: string }>(
      `SELECT id, username, password_hash, status FROM auth.users WHERE lower(email)=lower($1)`, [body.email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) throw Errors.invalidCredentials();
    if (user.status === "banned" || user.status === "suspended") throw Errors.accountBanned();
    if (user.status === "deleted") throw Errors.invalidCredentials();
    await query(`UPDATE auth.users SET last_login_at = now() WHERE id = $1`, [user.id]);
    const tokens = await createSession(user.id, body.deviceId);
    const response: LoginResponse = { ...tokens, user: { id: user.id, username: user.username } };
    ok(req, res, response);
  } catch (e) { next(e); }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const body = req.body as RefreshRequest;
    if (!body.refreshToken) throw Errors.unauthorized();
    const { rows } = await query<{ id: string; user_id: string; expires_at: string; revoked_at: string | null }>(
      `SELECT id, user_id, expires_at, revoked_at FROM players.player_sessions WHERE refresh_token_hash = $1`, [hashToken(body.refreshToken)]);
    const session = rows[0];
    if (!session) throw Errors.unauthorized();
    if (session.revoked_at) throw Errors.tokenRevoked();
    if (new Date(session.expires_at) < new Date()) throw Errors.tokenExpired();
    // Rotation: revoke the old session, issue a fresh pair (API Part 6 §3.3).
    await query(`UPDATE players.player_sessions SET revoked_at = now() WHERE id = $1`, [session.id]);
    const tokens = await createSession(session.user_id);
    const response: AuthTokens = tokens;
    ok(req, res, response);
  } catch (e) { next(e); }
});

authRouter.post("/logout", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await query(`UPDATE players.player_sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2`, [req.sessionId, req.userId]);
    ok(req, res, { loggedOut: true });
  } catch (e) { next(e); }
});
