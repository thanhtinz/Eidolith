// Standard response envelope + error codes — API Part 6 §2 and §23.
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import type { ApiSuccess, ApiFailure } from "@eidolith/shared-types";
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: Record<string, unknown>) {
    super(message);
  }
}
export function requestId(req: Request): string {
  return (req.header("x-request-id") as string) || `req_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
export function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { success: true, data, error: null, meta: { requestId: requestId(req), timestamp: new Date().toISOString() } };
  res.status(status).json(body);
}
export function fail(req: Request, res: Response, err: ApiError): void {
  const body: ApiFailure = { success: false, data: null, error: { code: err.code, message: err.message, details: err.details ?? {} }, meta: { requestId: requestId(req), timestamp: new Date().toISOString() } };
  res.status(err.status).json(body);
}
export const Errors = {
  validation: (details?: Record<string, unknown>) => new ApiError(422, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", details),
  invalidCredentials: () => new ApiError(401, "AUTH_INVALID_CREDENTIALS", "Sai thông tin đăng nhập"),
  tokenExpired: () => new ApiError(401, "AUTH_TOKEN_EXPIRED", "Token hết hạn"),
  tokenRevoked: () => new ApiError(401, "AUTH_TOKEN_REVOKED", "Token bị thu hồi"),
  unauthorized: () => new ApiError(401, "AUTH_UNAUTHORIZED", "Chưa đăng nhập"),
  accountBanned: () => new ApiError(403, "AUTH_ACCOUNT_BANNED", "Tài khoản bị khóa"),
  usernameTaken: () => new ApiError(409, "AUTH_USERNAME_TAKEN", "Username đã tồn tại"),
  emailTaken: () => new ApiError(409, "AUTH_EMAIL_TAKEN", "Email đã tồn tại"),
  playerNotFound: () => new ApiError(404, "PLAYER_NOT_FOUND", "Không tìm thấy player"),
  nameTaken: () => new ApiError(409, "PLAYER_NAME_TAKEN", "Tên đã tồn tại"),
  invalidName: () => new ApiError(422, "PLAYER_INVALID_NAME", "Tên nhân vật 3–20 ký tự, chỉ gồm chữ cái và số — không dùng ký tự đặc biệt"),
  rateLimited: () => new ApiError(429, "RATE_LIMITED", "Quá nhiều yêu cầu, thử lại sau"),
  internal: () => new ApiError(500, "INTERNAL_ERROR", "Lỗi hệ thống"),
};
