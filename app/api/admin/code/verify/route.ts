import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/app-config";
import { checkChallenge } from "@/lib/admin-code";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; code?: unknown; challenge?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const challenge = typeof body?.challenge === "string" ? body.challenge : "";
  const ok = isAdminEmail(email) && (await checkChallenge(email, code, challenge));
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
