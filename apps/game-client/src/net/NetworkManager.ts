// Network Manager — API Part 6 §26: single entry point for REST + (later) WebSocket.
// Handles envelope, bearer token, automatic refresh on AUTH_TOKEN_EXPIRED, retry once.
import type { ApiResponse, AuthTokens } from "@eidolith/shared-types";
import type { ConnectionState } from "@eidolith/protocol";
const API_BASE = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_BASE ?? "http://localhost:8787/api/v1";
const LS_ACCESS = "eidolith.accessToken";
const LS_REFRESH = "eidolith.refreshToken";
export class ApiClientError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) { super(message); }
}
export class NetworkManager {
  state: ConnectionState = "DISCONNECTED";
  private accessToken: string | null = localStorage.getItem(LS_ACCESS);
  private refreshToken: string | null = localStorage.getItem(LS_REFRESH);
  get isAuthenticated(): boolean { return !!this.accessToken; }
  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken; this.refreshToken = tokens.refreshToken;
    localStorage.setItem(LS_ACCESS, tokens.accessToken); localStorage.setItem(LS_REFRESH, tokens.refreshToken);
  }
  clearTokens(): void {
    this.accessToken = null; this.refreshToken = null;
    localStorage.removeItem(LS_ACCESS); localStorage.removeItem(LS_REFRESH);
  }
  async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    this.state = "CONNECTING";
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) {
      const code = json.error.code;
      if (retry && code === "AUTH_TOKEN_EXPIRED" && this.refreshToken) {
        await this.refresh();
        return this.request<T>(method, path, body, false);
      }
      this.state = "CONNECTED";
      throw new ApiClientError(code, json.error.message, res.status);
    }
    this.state = "CONNECTED";
    return json.data;
  }
  private async refresh(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<AuthTokens>;
    if (!json.success) { this.clearTokens(); throw new ApiClientError(json.error.code, json.error.message, res.status); }
    this.setTokens(json.data);
  }
}
export const network = new NetworkManager();
