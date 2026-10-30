import { pi } from "@/lib/pi";

export interface Profile {
  email: string;
  salt: string;
  hash: string;
}

export interface Session {
  username: string;
  email: string;
}

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

async function sha256(text: string) {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

export async function loadProfile(): Promise<Profile | null> {
  const rec = await pi.userState.get("profile");
  const b = rec?.blob as Partial<Profile> | undefined;
  return b?.email && b.salt && b.hash ? (b as Profile) : null;
}

export async function saveProfile(email: string, password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await sha256(salt + password);
  await pi.userState.set("profile", { email: email.trim().toLowerCase(), salt, hash });
}

export async function checkPassword(profile: Profile, password: string) {
  return (await sha256(profile.salt + password)) === profile.hash;
}

export async function loadAdminCred(): Promise<Profile | null> {
  const rec = await pi.userState.get("admin-cred");
  const b = rec?.blob as Partial<Profile> | undefined;
  return b?.email && b.salt && b.hash ? (b as Profile) : null;
}

export async function saveAdminCred(email: string, password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await sha256(salt + password);
  await pi.userState.set("admin-cred", { email: email.trim().toLowerCase(), salt, hash });
}

export async function loadAdmins(): Promise<string[]> {
  const rec = await pi.userState.get("admins");
  const list = (rec?.blob as { emails?: unknown } | undefined)?.emails;
  return Array.isArray(list) ? list.filter((e): e is string => typeof e === "string") : [];
}

export async function saveAdmins(emails: string[]) {
  await pi.userState.set("admins", { emails });
}
