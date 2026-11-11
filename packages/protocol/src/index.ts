// WebSocket protocol — API Part 6 §20-22 (envelope, events, reconnect/resume).
export interface WsEnvelope<T = unknown> {
  type: string; seq?: number; timestamp: number; payload: T;
}
export const WsClientEvents = {
  Authenticate: "auth.authenticate",
  PlayerMove: "world.player.move",
  ChatSend: "chat.send",
  Ping: "system.ping",
} as const;
export const WsServerEvents = {
  Authenticated: "auth.authenticated",
  PlayerJoined: "world.player.joined",
  PlayerLeft: "world.player.left",
  PlayerMoved: "world.player.moved",
  Snapshot: "world.snapshot",
  ChatMessage: "chat.message",
  Pong: "system.pong",
  Error: "system.error",
} as const;
export type ConnectionState = "DISCONNECTED"|"CONNECTING"|"CONNECTED"|"RECONNECTING"|"AUTHENTICATING"|"FAILED";
