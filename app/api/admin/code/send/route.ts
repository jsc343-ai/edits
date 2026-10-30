import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/app-config";
import { newChallenge } from "@/lib/admin-code";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "bad_email" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key || !process.env.ADMIN_AUTH_SECRET) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { code, challenge } = newChallenge(email);
  if (!isAdminEmail(email)) return NextResponse.json({ ok: true, challenge });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ADMIN_MAIL_FROM ?? "JSC343 AI EDITS <onboarding@resend.dev>",
      to: [email],
      subject: "JSC343 AI EDITS 後台驗證碼 / Admin verification code",
      text: `您的後台驗證碼：${code}\n10 分鐘內有效，請勿告訴任何人。\n\nYour admin verification code: ${code}\nValid for 10 minutes. Do not share it.`,
    }),
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, challenge });
}
