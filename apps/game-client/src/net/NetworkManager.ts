// Network Manager — API Part 6 §26: single entry point for REST + WebSocket.
// REST: envelope, bearer token, automatic refresh on AUTH_TOKEN_EXPIRED.
// WS (Part 6 §20-22): authenticate first message, snapshot on join/resume,
// event subscription, reconnect with backoff. Gameplay modules never open
// their own sockets.
import type { ApiResponse, AuthTokens } from "@eidolith/shared-types";
import type { ConnectionState, WsEnvelope } from "@eidolith/protocol";
const API_BASE = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_BASE ?? "http://localhost:8787/api/v1";
const WS_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_WS_URL ?? API_BASE.replace(/^http/, "ws").replace(/\/api\/v1$/, "/ws/v1");
const LS_ACCESS = "eidolith.accessToken";
const LS_REFRESH = "eidolith.refreshToken";
export class ApiClientError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) { super(message); }
}
export interface RemotePlayer { playerId: string; displayName: string; level: number; avatarId: string; x: number; y: number; mapId: string; }
export interface WorldSnapshot {
  player: RemotePlayer; players: RemotePlayer[];
  wilds?: import("@eidolith/shared-types").WildSpawnInfo[];
  world: { mapId: string; time: { hour: number; minute: number; cycleMinutes: number }; weather: string };
}
type Handler = (payload: never) => void;
export class NetworkManager {
  state: ConnectionState = "DISCONNECTED";
  lastSnapshot: WorldSnapshot | null = null;
  private accessToken: string | null = localStorage.getItem(LS_ACCESS);
  private refreshToken: string | null = localStorage.getItem(LS_REFRESH);
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private reconnectAttempts = 0;
  private wsSeq = 0;
  get isAuthenticated(): boolean { return !!this.accessToken; }
  get accessTokenValue(): string | null { return this.accessToken; }
  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken; this.refreshToken = tokens.refreshToken;
    localStorage.setItem(LS_ACCESS, tokens.accessToken); localStorage.setItem(LS_REFRESH, tokens.refreshToken);
  }
  clearTokens(): void {
    this.accessToken = null; this.refreshToken = null;
    localStorage.removeItem(LS_ACCESS); localStorage.removeItem(LS_REFRESH);
  }
  async request<T>(method: string, path: string, body?: unknown, retry = true, headers: Record<string, string> = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) {
      if (retry && json.error.code === "AUTH_TOKEN_EXPIRED" && this.refreshToken) {
        await this.refresh();
        return this.request<T>(method, path, body, false, headers);
      }
      throw new ApiClientError(json.error.code, json.error.message, res.status);
    }
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
  get worldConnected(): boolean { return this.ws?.readyState === WebSocket.OPEN; }

  // ---- WebSocket ----
  subscribe(event: string, callback: (payload: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(callback as Handler);
    return () => this.handlers.get(event)?.delete(callback as Handler);
  }
  send(type: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const envelope: WsEnvelope = { type, seq: ++this.wsSeq, timestamp: Date.now(), payload };
      this.ws.send(JSON.stringify(envelope));
    }
  }
  connect(): Promise<WorldSnapshot> {
    return new Promise((resolve, reject) => {
      this.state = "CONNECTING";
      const ws = new WebSocket(WS_URL);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error("WS connect timeout")), 8000);
      ws.onopen = () => {
        this.state = "AUTHENTICATING";
        this.send("auth.authenticate", { accessToken: this.accessToken });
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string) as WsEnvelope;
        if (msg.type === "world.snapshot") {
          this.lastSnapshot = msg.payload as WorldSnapshot;
          this.state = "CONNECTED";
          this.reconnectAttempts = 0;
          clearTimeout(timer);
          resolve(this.lastSnapshot);
        }
        this.handlers.get(msg.type)?.forEach(h => h(msg.payload as never));
      };
      ws.onclose = () => {
        if (this.state === "CONNECTED") { this.state = "RECONNECTING"; void this.reconnect(); }
        else if (this.state !== "DISCONNECTED") { clearTimeout(timer); reject(new Error("WS closed")); }
      };
      ws.onerror = () => { /* onclose follows */ };
    });
  }
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= 5) { this.state = "FAILED"; return; }
    this.reconnectAttempts++;
    await new Promise(r => setTimeout(r, Math.min(1000 * this.reconnectAttempts, 5000)));
    try { await this.connect(); } catch { void this.reconnect(); }
  }
  disconnect(): void {
    this.state = "DISCONNECTED";
    this.ws?.close();
    this.ws = null;
  }
  /** Ask the server to move us to another map; resolves with the new snapshot. */
  changeMap(targetMap: string, targetSpawn: string): Promise<WorldSnapshot> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { unsub(); reject(new Error("change_map timeout")); }, 8000);
      const unsub = this.subscribe("world.snapshot", (snap) => {
        if ((snap as WorldSnapshot).world.mapId === targetMap) { clearTimeout(timer); unsub(); resolve(snap as WorldSnapshot); }
      });
      this.send("world.change_map", { targetMap, targetSpawn });
    });
  }
}
export const network = new NetworkManager();
