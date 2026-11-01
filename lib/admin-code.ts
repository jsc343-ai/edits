const TTL_MS = 10 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

async function sign(payload: string, code: string) {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("ADMIN_AUTH_SECRET is not set");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${payload}.${code}`));
  return toBase64Url(new Uint8Array(signature));
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function newChallenge(email: string) {
  const [random] = crypto.getRandomValues(new Uint32Array(1));
  const code = String(random % 100_000_000).padStart(8, "0");
  const payload = toBase64Url(encoder.encode(JSON.stringify({ e: email, x: Date.now() + TTL_MS })));
  return { code, challenge: `${payload}.${await sign(payload, code)}` };
}

export async function checkChallenge(email: string, code: string, challenge: string) {
  const [payload, signature] = challenge.split(".");
  if (!payload || !signature || !/^\d{8}$/.test(code)) return false;
  try {
    const data = JSON.parse(decoder.decode(fromBase64Url(payload))) as { e?: string; x?: number };
    if (data.e !== email || typeof data.x !== "number" || data.x < Date.now()) return false;
    return sameText(await sign(payload, code), signature);
  } catch {
    return false;
  }
}
