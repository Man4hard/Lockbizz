/**
 * Offline unlock codes. MUST stay byte-identical to OfflineCode.kt in the Android app:
 *   msg  = "deviceId|counter|expiryHour|action"
 *   h    = HMAC-SHA256(secret, msg)
 *   code = 2-digit (counter % 100) + 6 digits of RFC4226 dynamic truncation
 */
export type CodeAction = "unlock" | "release" | "extend";

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function generateOfflineCode(
  secretHex: string,
  deviceId: string,
  counter: number,
  expiryHour: number,
  action: CodeAction = "unlock",
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(secretHex) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const msg = new TextEncoder().encode(`${deviceId}|${counter}|${expiryHour}|${action}`);
  const h: number[] = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, msg)));
  const b = (i: number) => h[i] ?? 0;
  const off = b(h.length - 1) & 0x0f;
  const bin =
    ((b(off) & 0x7f) << 24) | ((b(off + 1) & 0xff) << 16) | ((b(off + 2) & 0xff) << 8) | (b(off + 3) & 0xff);
  return String(counter % 100).padStart(2, "0") + String(bin % 1_000_000).padStart(6, "0");
}

export async function sha256Hex(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(d));
}

export const MAX_CODE_HOURS = 48;
