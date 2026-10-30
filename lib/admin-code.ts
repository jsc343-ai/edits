import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;

const sign = (payload: string, code: string) =>
  createHmac("sha256", process.env.ADMIN_AUTH_SECRET ?? "").update(`${payload}.${code}`).digest("base64url");

export function newChallenge(email: string) {
  const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
  const payload = Buffer.from(JSON.stringify({ e: email, x: Date.now() + TTL_MS })).toString("base64url");
  return { code, challenge: `${payload}.${sign(payload, code)}` };
}

export function checkChallenge(email: string, code: string, challenge: string) {
  const [payload, sig] = challenge.split(".");
  if (!payload || !sig || !/^\d{8}$/.test(code)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e?: string; x?: number };
    if (data.e !== email || typeof data.x !== "number" || data.x < Date.now()) return false;
  } catch {
    return false;
  }
  const expected = Buffer.from(sign(payload, code));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
