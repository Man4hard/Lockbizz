import { hexToBytes } from "./offline-code";

const MAX_SKEW_MS = 10 * 60 * 1000;

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export type VerifiedDevice = { deviceId: string; tenantId: string; raw: string };

/** Verifies the phone's HMAC-signed request. Returns the device or a ready error Response. */
export async function verifyDeviceRequest(
  request: Request,
  path: string,
): Promise<{ ok: true; device: VerifiedDevice } | { ok: false; response: Response }> {
  const fail = (status: number, msg: string) => ({
    ok: false as const,
    response: Response.json({ error: msg }, { status }),
  });
  const raw = await request.text();
  if (raw.length > 200_000) return fail(413, "too large");
  const deviceId = request.headers.get("x-device-id") ?? "";
  const ts = request.headers.get("x-timestamp") ?? "";
  const nonce = request.headers.get("x-nonce") ?? "";
  const sig = (request.headers.get("x-signature") ?? "").toLowerCase();
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!/^[0-9a-f-]{36}$/i.test(deviceId) || !ts || !nonce || !sig || !bearer) return fail(401, "unauthorized");
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > MAX_SKEW_MS) return fail(401, "stale request");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: sec } = await supabaseAdmin
    .from("device_secrets")
    .select("secret_hex, enroll_token")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (!sec || !safeEqual(sec.enroll_token, bearer)) return fail(401, "unauthorized");

  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(sec.secret_hex) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}|${nonce}|POST|${path}|${raw}`),
  );
  if (!safeEqual(toHex(mac), sig)) return fail(401, "bad signature");

  const { data: dev } = await supabaseAdmin
    .from("devices")
    .select("id, tenant_id, deleted_at")
    .eq("id", deviceId)
    .maybeSingle();
  if (!dev || dev.deleted_at) return fail(404, "device not found");
  return { ok: true, device: { deviceId: dev.id, tenantId: dev.tenant_id, raw } };
}
