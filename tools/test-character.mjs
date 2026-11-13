// Character creation: email-only register -> gate -> POST /player/character.
const BASE = "http://localhost:8787/api/v1";
let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name, extra); } };
const stamp = Date.now().toString().slice(-7);
async function api(method, path, body, token) {
  const res = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
// 1) register WITHOUT username works now
const email = `char${stamp}@test.dev`;
let r = await api("POST", "/auth/register", { email, password: "SecurePass123" });
check("register email-only 201", r.status === 201, JSON.stringify(r.json));
// 2) register WITH username still works (legacy path) and is pre-created
const email2 = `charx${stamp}@test.dev`;
r = await api("POST", "/auth/register", { email: email2, username: `Named${stamp}`, password: "SecurePass123" });
check("register with username 201", r.status === 201);
let login = await api("POST", "/auth/login", { email: email2, password: "SecurePass123", deviceId: "t" });
let me = await api("GET", "/player/me", null, login.json.data.accessToken);
check("legacy account characterCreated=true", me.json.data.characterCreated === true, JSON.stringify(me.json.data));
// 3) email-only account is gated
login = await api("POST", "/auth/login", { email, password: "SecurePass123", deviceId: "t" });
const tok = login.json.data.accessToken;
me = await api("GET", "/player/me", null, tok);
check("new account characterCreated=false", me.json.data.characterCreated === false, JSON.stringify(me.json.data));
// 4) invalid name rejected (special chars)
r = await api("POST", "/player/character", { displayName: "ten_dep!", avatarId: "wanderer_female", hairStyle: "bob", hairColor: "blond", outfit: "floral" }, tok);
check("special-char name 422 PLAYER_INVALID_NAME", r.status === 422 && r.json.error?.code === "PLAYER_INVALID_NAME", JSON.stringify(r.json));
// 5) gender-mismatched appearance rejected (male style on female)
r = await api("POST", "/player/character", { displayName: `Lina${stamp}`, avatarId: "wanderer_female", hairStyle: "curly", hairColor: "blond", outfit: "floral" }, tok);
check("mismatched style 422 CHARACTER_INVALID", r.status === 422 && r.json.error?.code === "CHARACTER_INVALID", JSON.stringify(r.json));
// 6) valid creation succeeds and sticks
r = await api("POST", "/player/character", { displayName: `Lina${stamp}`, avatarId: "wanderer_female", hairStyle: "bob", hairColor: "blond", outfit: "floral" }, tok);
check("create 200 + fields", r.status === 200 && r.json.data.characterCreated === true && r.json.data.displayName === `Lina${stamp}` && r.json.data.hairStyle === "bob" && r.json.data.outfit === "floral", JSON.stringify(r.json));
// 7) second creation blocked
r = await api("POST", "/player/character", { displayName: `Other${stamp}`, avatarId: "wanderer_male", hairStyle: "crop", hairColor: "red", outfit: "work" }, tok);
check("second create 422 CHARACTER_ALREADY_CREATED", r.status === 422 && r.json.error?.code === "CHARACTER_ALREADY_CREATED", JSON.stringify(r.json));
// 8) name collision with an existing character rejected for a fresh account
const email3 = `charz${stamp}@test.dev`;
await api("POST", "/auth/register", { email: email3, password: "SecurePass123" });
const login3 = await api("POST", "/auth/login", { email: email3, password: "SecurePass123", deviceId: "t" });
r = await api("POST", "/player/character", { displayName: `Lina${stamp}`, avatarId: "wanderer_male", hairStyle: "crop", hairColor: "red", outfit: "work" }, login3.json.data.accessToken);
check("taken name rejected", r.status === 409 || (r.status === 422 && r.json.error?.code === "PLAYER_NAME_TAKEN"), JSON.stringify(r.json));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
