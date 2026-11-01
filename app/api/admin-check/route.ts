import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/app-config";
import { newChallenge } from "@/lib/admin-code";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps: Record<string, string> = {
    ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET ? "set" : "missing",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "set" : "missing",
    ADMIN_MAIL_FROM: process.env.ADMIN_MAIL_FROM ? "set" : "missing",
  };
  try {
    const { challenge } = await newChallenge("check@example.com");
    steps.challenge = challenge ? "ok" : "empty";
  } catch (err) {
    steps.challenge = `failed: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
  }
  try {
    steps.adminList = isAdminEmail("jangshihchang@gmail.com") ? "ok" : "email not in list";
  } catch (err) {
    steps.adminList = `failed: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
  }
  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}` },
    });
    steps.resendKey = r.ok ? "ok" : `rejected HTTP ${r.status}`;
  } catch (err) {
    steps.resendKey = `network: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
  }
  return NextResponse.json(steps);
}
