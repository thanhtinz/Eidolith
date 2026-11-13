// Phase 6 wave 1 tests: friends + zone chat + friendly battle.
// Run: node tools/test-phase6-social.mjs  (server on :8787, PG on :5433)
import { createRequire } from "node:module";
const require = createRequire(new URL("../apps/game-server/package.json", import.meta.url));
const { Client } = require("pg");
const WebSocket = require("ws");
const API = "http://127.0.0.1:8787/api/v1";
let pass = 0, fail = 0;
const ok = (cond, name, extra = "") => { if (cond) { pass++; console.log(`  ok ${name}`); } else { fail++; console.log(`  FAIL ${name} ${extra}`); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json.data, code: json.error?.code };
}
async function makeUser(tag) {
  const email = `${tag}@test.dev`;
  await call("POST", "/auth/register", null, { email, password: "SecurePass123", username: tag, gender: "male" });
  const login = await call("POST", "/auth/login", null, { email, password: "SecurePass123" });
  const token = login.data.accessToken;
  const me = await call("GET", "/player/me", token);
  return { token, playerId: me.data.playerId, name: tag };
}

// --- character-name rule: no special characters (Tín, 2026-11-12) ---
{
  const bad1 = await call("POST", "/auth/register", null, { email: `bad1_${Date.now()}@test.dev`, password: "SecurePass123", username: "bad_name", gender: "male" });
  ok(bad1.status === 422 && bad1.code === "VALIDATION_ERROR", "register rejects underscore name");
  const bad2 = await call("POST", "/auth/register", null, { email: `bad2_${Date.now()}@test.dev`, password: "SecurePass123", username: "Ten Dep!", gender: "male" });
  ok(bad2.status === 422, "register rejects spaces/punctuation in name");
  const good = await call("POST", "/auth/register", null, { email: `good_${Date.now()}@test.dev`, password: "SecurePass123", username: "TínĐẹp123", gender: "male" });
  ok(good.status === 200 || good.status === 201, "Vietnamese letters + digits name accepted", `status=${good.status}`);
}
const A = await makeUser(`p6ax${Date.now() % 100000}`);
const B = await makeUser(`p6bx${Date.now() % 100000}`);
const C = await makeUser(`p6cx${Date.now() % 100000}`);
// display-name rename obeys the same no-special-characters rule
{
  const bad = await call("PATCH", "/player/me", C.token, { displayName: "ten_dep" });
  ok(bad.status === 422 && bad.code === "PLAYER_INVALID_NAME", "rename rejects underscore display name");
  const goodName = `Dep${Date.now() % 100000}`;
  const good = await call("PATCH", "/player/me", C.token, { displayName: goodName });
  ok(good.status === 200 && good.data.displayName === goodName, "rename accepts clean name");
}
console.log("users:", A.name, B.name, C.name);

// --- search ---
let r = await call("GET", `/social/search?q=p`, A.token);
ok(r.status === 422 && r.code === "SOCIAL_QUERY_SHORT", "search too short 422");
r = await call("GET", `/social/search?q=${B.name.slice(0, 4)}`, A.token);
const foundB = (r.data.results ?? []).find(x => x.playerId === B.playerId);
ok(!!foundB && foundB.relation === "none", "search finds B, relation none");

// --- request flow ---
r = await call("POST", "/social/friends/request", A.token, { playerId: A.playerId });
ok(r.status === 422 && r.code === "SOCIAL_SELF", "self request 422");
r = await call("POST", "/social/friends/request", A.token, { playerId: B.playerId });
ok(r.status === 200 && r.data.status === "pending", "A requests B -> pending");
r = await call("POST", "/social/friends/request", A.token, { playerId: B.playerId });
ok(r.status === 422 && r.code === "SOCIAL_ALREADY_REQUESTED", "duplicate request 422");
r = await call("GET", "/social/friends", B.token);
ok(r.data.incoming.length === 1 && r.data.incoming[0].playerId === A.playerId, "B sees incoming from A");
const reqId = r.data.incoming[0].requestId;
r = await call("POST", `/social/friends/${reqId}/accept`, B.token);
ok(r.status === 200 && r.data.status === "accepted", "B accepts");
r = await call("GET", "/social/friends", A.token);
ok(r.data.friends.length === 1 && r.data.friends[0].playerId === B.playerId && r.data.friends[0].online === false, "A lists B as friend (offline)");
ok(Array.isArray(r.data.friends[0].team) && r.data.friends[0].mapId === null, "friend carries team preview + mapId fields");

// --- seed teams + friendly battle ---
const pg = new Client("postgres://postgres@127.0.0.1:5433/eidolith");
await pg.connect();
const seed = async (pid, cid, lv) => {
  const q = await pg.query("INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method) VALUES ($1,$2,$3,'capture') RETURNING id", [pid, cid, lv]);
  return q.rows[0].id;
};
const aTeam = [await seed(A.playerId, "EID-001", 10), await seed(A.playerId, "EID-002", 8)];
await seed(B.playerId, "EID-003", 9); await seed(B.playerId, "EID-004", 7);
const walletOf = async t => (await call("GET", "/player/wallet", t)).data;
const goldBefore = (await walletOf(A.token)).gold;
r = await call("POST", "/battles", A.token, { instanceIds: aTeam, mode: "friend", opponentPlayerId: B.playerId });
ok(r.status === 200 && r.data && !r.data.rewards, "friend battle runs, no rewards", JSON.stringify(r).slice(0, 200));
const enemyCount = (r.data?.teams ?? []).filter(u => u.team === 1).length;
ok(enemyCount === 2, "enemy snapshot = B's 2 creatures", `enemy=${enemyCount}`);
const goldAfter = (await walletOf(A.token)).gold;
ok(goldAfter === goldBefore, "gold unchanged after friendly");
r = await call("GET", "/social/friends", A.token);
ok(r.data.friends[0].team.length === 2 && r.data.friends[0].team.map(t => t.level).sort((a, b) => a - b).join() === "7,9", "team preview shows B's creatures", JSON.stringify(r.data.friends[0].team));
r = await call("POST", "/battles", A.token, { instanceIds: aTeam, mode: "friend", opponentPlayerId: C.playerId });
ok(r.status === 422 && r.code === "BATTLE_NOT_FRIENDS", "friend battle vs non-friend 422");

// --- unfriend + decline + reverse-request auto-accept ---
r = await call("DELETE", `/social/friends/${B.playerId}`, A.token);
ok(r.status === 200, "A unfriends B");
r = await call("GET", "/social/friends", B.token);
ok(r.data.friends.length === 0, "B list empty after unfriend");
await call("POST", "/social/friends/request", A.token, { playerId: B.playerId });
r = await call("GET", "/social/friends", B.token);
const req2 = r.data.incoming[0]?.requestId;
r = await call("POST", `/social/friends/${req2}/decline`, B.token);
ok(r.status === 200 && r.data.status === "declined", "B declines");
await call("POST", "/social/friends/request", A.token, { playerId: B.playerId });
r = await call("POST", "/social/friends/request", B.token, { playerId: A.playerId });
ok(r.status === 200 && r.data.status === "accepted", "reverse request auto-accepts");

// --- zone chat over WS ---
function wsClient(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("ws://127.0.0.1:8787/ws/v1");
    const inbox = [];
    ws.on("open", () => ws.send(JSON.stringify({ type: "auth.authenticate", payload: { accessToken: token } })));
    ws.on("message", raw => {
      const m = JSON.parse(raw.toString());
      inbox.push(m);
      if (m.type === "world.snapshot") resolve({ ws, inbox });
    });
    ws.on("error", reject);
    setTimeout(() => reject(new Error("ws timeout")), 8000);
  });
}
const ca = await wsClient(A.token);
const cb = await wsClient(B.token);
await sleep(300);
const chatOf = inbox => inbox.filter(m => m.type === "world.chat.message").map(m => m.payload);
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "Xin chào mọi người!" } }));
await sleep(600);
ok(chatOf(cb.inbox).some(p => p.content === "Xin chào mọi người!" && p.displayName === A.name), "B receives A's chat");
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "tin hai" } }));
await sleep(500);
ok(!chatOf(cb.inbox).some(p => p.content === "tin hai"), "rate limit drops fast second message");
await sleep(1300);
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "địt nhau không" } }));
await sleep(600);
const filtered = chatOf(cb.inbox).find(p => p.content.includes("nhau"));
ok(!!filtered && !filtered.content.includes("địt") && filtered.content.includes("***"), "banned word filtered to ***", filtered?.content ?? "none");
await sleep(1600);
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "x".repeat(250) } }));
await sleep(600);
const long = chatOf(cb.inbox).find(p => p.content.startsWith("xxx"));
ok(!!long && long.content.length === 200, "long message clipped to 200", `len=${long?.content.length}`);
const logged = await pg.query("SELECT COUNT(*) AS n FROM social.chat_messages WHERE player_id = $1", [A.playerId]);
ok(Number(logged.rows[0].n) >= 3, "chat messages logged for moderation", `n=${logged.rows[0].n}`);
// --- world channel across maps: B moves to the forest ---
cb.ws.send(JSON.stringify({ type: "world.change_map", payload: { targetMap: "whispering_forest", targetSpawn: "from_village" } }));
await sleep(1200);
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "chi khu vuc thoi" } }));
await sleep(600);
ok(!chatOf(cb.inbox).some(p => p.content === "chi khu vuc thoi"), "zone msg does not cross maps");
await sleep(1100);
ca.ws.send(JSON.stringify({ type: "world.chat.send", payload: { content: "chao ca the gioi", channel: "world" } }));
await sleep(600);
const wMsg = chatOf(cb.inbox).find(p => p.content === "chao ca the gioi");
ok(!!wMsg && wMsg.channel === "world", "world msg crosses maps with channel tag");
const wLogged = await pg.query("SELECT COUNT(*) AS n FROM social.chat_messages WHERE player_id = $1 AND channel = 'world'", [A.playerId]);
ok(Number(wLogged.rows[0].n) >= 1, "world msg logged as channel world");
ca.ws.close(); cb.ws.close();
await pg.end();

console.log(`\nPHASE6 SOCIAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
