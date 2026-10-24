import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest, validateProfile, SITE_ORIGIN } from "../src/worker.js";

const sample = { nickname: "Player_77", mode: "BedWars", color: "#8539D9", avatarData: "" };
const msftAuth = () => "private-user-sub-001";

function mockDatabase() {
  const items = new Map();
  return {
    items,
    prepare(sql) {
      let binds;
      return {
        bind(...values) { binds = values; return this; },
        async first() {
          const value = items.get(binds[0]);
          return value && { nickname: value.nickname, mode: value.mode,
            color: value.color, avatar_data: value.avatarData, updated_at: "2026-10-24T00:00:00Z" };
        },
        async run() {
          if (sql.startsWith("DELETE")) items.delete(binds[0]);
          else if (sql.startsWith("INSERT")) {
            items.set(binds[0], {nickname:binds[1],mode:binds[2],color:binds[3],avatarData:binds[4]});
          }
        }
      };
    }
  };
}
function req(method, path, body, origin = SITE_ORIGIN) {
  return new Request("https://minevora-profile-api.workers.dev" + path, {
    method, headers: {
      "Content-Type": "application/json",
      "Origin": origin,
      "Authorization": "Bearer FAKE.TEST.ONLY"
    }, ...(body ? { body: JSON.stringify(body) } : {})
  });
}

test("valid profile accepted", () => {
  assert.deepEqual(validateProfile(sample), sample);
});
test("unsafe avatar, markup nickname, external URL, extra long nick rejected", () => {
  for (const p of [
    { ...sample, nickname:"<script>" },
    { ...sample, nickname:"../admin" },
    { ...sample, avatarData:"https://example.com/avatar.svg" },
    { ...sample, avatarData:"data:image/svg+xml;base64,AA==" },
    { ...sample, color:"#fff" },
    { ...sample, mode:"NOT_A_GAME" }
  ]) assert.equal(validateProfile(p), null);
});
test("health does not expose database content", async () => {
  const response = await handleRequest(req("GET", "/health"), {});
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).ok, true);
});
test("blocked foreign origin returns no CORS permission", async () => {
  const response = await handleRequest(req("GET", "/v1/profile",null,"https://evil.example"),
    {DB:mockDatabase()}, msftAuth);
  assert.equal(response.status,403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});
test("anonymous requests cannot read or write private profile", async () => {
  const db = mockDatabase();
  for (const method of ["GET","PUT","DELETE"]) {
    const response = await handleRequest(req(method, "/v1/profile", method==="PUT"?sample:null),
      {DB:db},async()=>null);
    assert.equal(response.status, 401);
  }
});
test("GET/PUT/DELETE apply only to authenticated subject", async () => {
  const db = mockDatabase();
  const env = {DB:db};
  const write = await handleRequest(req("PUT", "/v1/profile", sample),env, async()=>"account-A");
  assert.equal(write.status, 200);
  const other = await handleRequest(req("GET", "/v1/profile"),env,async()=>"account-B");
  assert.equal((await other.json()).profile,null);
  const read = await handleRequest(req("GET", "/v1/profile"),env,async()=>"account-A");
  assert.equal((await read.json()).profile.nickname,"Player_77");
  const deleted = await handleRequest(req("DELETE","/v1/profile"),env,async()=>"account-A");
  assert.equal(deleted.status,200);
  assert.equal(db.items.size,0);
});
test("CORS preflight permits only the official site origin", async () => {
  const r=await handleRequest(req("OPTIONS","/v1/profile"),{});
  assert.equal(r.status,204);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), SITE_ORIGIN);
  assert.match(r.headers.get("Access-Control-Allow-Headers"),/Authorization/);
});
