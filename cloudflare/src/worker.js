// MINEVORA profile API: Cloudflare Worker + D1.
// ID tokens are verified server-side against Microsoft public signing keys.
// No passwords, refresh tokens, access tokens or Microsoft email are persisted.
import { createRemoteJWKSet, jwtVerify } from "jose";

export const SITE_ORIGIN = "https://cubeverse12.github.io";
export const CONSUMER_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";
export const ISSUER = "https://login.microsoftonline.com/" + CONSUMER_TENANT + "/v2.0";
const JWKS = createRemoteJWKSet(new URL("https://login.microsoftonline.com/consumers/discovery/v2.0/keys"));
const MODES = new Set(["BedWars", "SkyWars", "TNT Run", "Parkour", "Build Battle", "Spleef", "Duels", "Crystal PvP"]);
const MAX_JSON = 180_000;
const MAX_AVATAR = 120_000;

function cors(origin) {
  const result = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin"
  };
  if (origin === SITE_ORIGIN) {
    result["Access-Control-Allow-Origin"] = SITE_ORIGIN;
    result["Access-Control-Allow-Methods"] = "GET, PUT, DELETE, OPTIONS";
    result["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    result["Access-Control-Max-Age"] = "600";
  }
  return result;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

export function validateProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { nickname, mode, color, avatarData } = value;
  if (typeof nickname !== "string" || !/^[A-Za-z0-9_-]{3,20}$/.test(nickname)) return null;
  if (typeof mode !== "string" || !MODES.has(mode)) return null;
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  if (typeof avatarData !== "string" || avatarData.length > MAX_AVATAR) return null;
  // Browser exports a local resized WebP image. No remote URLs, SVG or HTML.
  if (avatarData !== "" && !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarData)) return null;
  return { nickname, mode, color, avatarData };
}

async function verifyMicrosoftIDToken(request, env) {
  const header = request.headers.get("Authorization") || "";
  const matched = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(header);
  if (!matched || matched[1].length > 16000) return null;
  if (!env.MS_CLIENT_ID || !/^[0-9a-fA-F-]{36}$/.test(env.MS_CLIENT_ID)) {
    throw new Error("Missing Microsoft client configuration");
  }
  try {
    const { payload } = await jwtVerify(matched[1], JWKS, {
      algorithms: ["RS256"],
      audience: env.MS_CLIENT_ID,
      issuer: ISSUER,
      clockTolerance: 30,
      maxTokenAge: "90m"
    });
    if (payload.tid !== CONSUMER_TENANT || typeof payload.sub !== "string" ||
        payload.sub.length < 8 || payload.sub.length > 256 || payload.ver !== "2.0") return null;
    // The OIDC subject is stable for the same client application.
    return payload.sub;
  } catch {
    return null;
  }
}

function serializeProfile(row) {
  if (!row) return null;
  return { nickname: row.nickname, mode: row.mode, color: row.color,
           avatarData: row.avatar_data, updatedAt: row.updated_at };
}

export async function handleRequest(request, env, authenticate = verifyMicrosoftIDToken) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== SITE_ORIGIN) return json({ error: "origin_not_allowed" }, 403, origin);
  if (request.method === "OPTIONS") {
    if (origin !== SITE_ORIGIN) return json({ error: "origin_not_allowed" }, 403, origin);
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (url.pathname === "/health" && request.method === "GET")
    return json({ ok: true, name: "MINEVORA profile API", version: 1 }, 200, origin);
  if (url.pathname !== "/v1/profile") return json({ error: "not_found" }, 404, origin);
  if (!["GET", "PUT", "DELETE"].includes(request.method))
    return json({ error: "method_not_allowed" }, 405, origin);
  if (!env.DB) return json({ error: "database_not_configured" }, 503, origin);

  let subject;
  try { subject = await authenticate(request, env); }
  catch { return json({ error: "auth_configuration_error" }, 503, origin); }
  if (!subject) return json({ error: "authentication_required" }, 401, origin);

  try {
    if (request.method === "GET") {
      const row = await env.DB.prepare(
        "SELECT nickname, mode, color, avatar_data, updated_at FROM profiles WHERE user_sub = ?"
      ).bind(subject).first();
      return json({ profile: serializeProfile(row) }, 200, origin);
    }
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM profiles WHERE user_sub = ?").bind(subject).run();
      return json({ deleted: true }, 200, origin);
    }

    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json"))
      return json({ error: "json_required" }, 415, origin);
    const length = Number(request.headers.get("Content-Length"));
    if (Number.isFinite(length) && length > MAX_JSON)
      return json({ error: "profile_too_large" }, 413, origin);
    let raw = "";
    if (request.body) {
      const reader = request.body.getReader();
      const decoder = new TextDecoder();
      let lengthRead = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        lengthRead += value.byteLength;
        if (lengthRead > MAX_JSON) {
          await reader.cancel();
          return json({ error: "profile_too_large" }, 413, origin);
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    }
    let proposed;
    try { proposed = JSON.parse(raw); }
    catch { return json({ error: "invalid_json" }, 400, origin); }
    const profile = validateProfile(proposed);
    if (!profile) return json({ error: "invalid_profile" }, 400, origin);
    await env.DB.prepare(
      "INSERT INTO profiles (user_sub, nickname, mode, color, avatar_data, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) " +
      "ON CONFLICT(user_sub) DO UPDATE SET nickname=excluded.nickname, mode=excluded.mode, " +
      "color=excluded.color, avatar_data=excluded.avatar_data, updated_at=excluded.updated_at"
    ).bind(subject, profile.nickname, profile.mode, profile.color, profile.avatarData).run();
    return json({ saved: true }, 200, origin);
  } catch {
    // Never expose database errors, raw tokens or account identifiers to the client.
    return json({ error: "storage_unavailable" }, 503, origin);
  }
}

export default {
  fetch(request, env) { return handleRequest(request, env); }
};
