import type { Request, Response, NextFunction } from "express";
import { ApiError, Errors, fail } from "./http.js";
import { verifyAccessToken } from "./auth-core.js";
export interface AuthedRequest extends Request { userId?: string; sessionId?: string; }
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return next(Errors.unauthorized());
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub; req.sessionId = payload.sid;
    next();
  } catch (e) {
    next(e instanceof Error && e.name === "TokenExpiredError" ? Errors.tokenExpired() : Errors.unauthorized());
  }
}
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) return fail(req, res, err);
  console.error("Unhandled error:", err);
  fail(req, res, Errors.internal());
}
/** Tiny in-memory fixed-window rate limiter (per key). Login uses it strictly (API §24). */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) { hits.set(key, { count: 1, resetAt: now + windowMs }); return next(); }
    entry.count++;
    if (entry.count > max) return next(Errors.rateLimited());
    next();
  };
}
