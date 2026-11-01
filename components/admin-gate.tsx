"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useLang } from "@/components/lang-context";
import { checkPassword, loadAdminCred, saveAdminCred, type Profile, type Session } from "@/lib/profile";

type Mode = "login" | "first" | "forgot";

async function post<T extends { detail?: string }>(url: string, body: unknown): Promise<{ ok: boolean; data: T | null }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text().catch(() => "");
    let data: T | null = null;
    try {
      data = JSON.parse(raw) as T;
    } catch {
      data = null;
    }
    if (!res.ok && !data?.detail) {
      const snippet = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
      return { ok: false, data: { ...(data ?? {}), detail: snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}` } as T };
    }
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { detail: `network: ${err instanceof Error ? err.message : "failed"}` } as T };
  }
}

export function AdminGate({ session, onVerified }: { session: Session; onVerified: () => void }) {
  const { L } = useLang();
  const [mode, setMode] = useState<Mode>("login");
  const [cred, setCred] = useState<Profile | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAdminCred()
      .then((c) => {
        setCred(c);
        if (!c) setMode("first");
      })
      .catch(() => setCred(null));
  }, []);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setChallenge(null);
    setCode("");
    setPassword("");
    setConfirm("");
  };

  const sendCode = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError(null);
    const r = await post<{ challenge?: string; error?: string; detail?: string }>("/api/admin/code/send", { email: session.email });
    setBusy(false);
    if (!r.ok || !r.data?.challenge) {
      const base =
        r.data?.error === "not_configured"
          ? L("寄信服務尚未啟用，請先完成郵件設定。", "The mail service is not set up yet.")
          : L("驗證碼寄送失敗，請稍後再試。", "Could not send the code. Please try again.");
      setError(r.data?.detail ? `${base} (${r.data.detail})` : base);
      return;
    }
    setChallenge(r.data.challenge);
    setInfo(L(`驗證碼已寄到 ${session.email}，10 分鐘內有效。`, `A code was sent to ${session.email}. It is valid for 10 minutes.`));
    setCooldown(60);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) clearInterval(timer.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!cred || cred.email !== session.email || !(await checkPassword(cred, password))) {
        setError(L("密碼不正確。", "Incorrect password."));
        return;
      }
      onVerified();
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !challenge) return;
    if (password.length < 8) return setError(L("密碼至少 8 碼。", "Password must be at least 8 characters."));
    if (password !== confirm) return setError(L("兩次密碼不一致。", "Passwords do not match."));
    setBusy(true);
    setError(null);
    const r = await post<{ ok?: boolean }>("/api/admin/code/verify", { email: session.email, code: code.trim(), challenge });
    if (!r.ok || !r.data?.ok) {
      setBusy(false);
      return setError(L("驗證碼不正確或已過期。", "The code is wrong or expired."));
    }
    try {
      await saveAdminCred(session.email, password);
      onVerified();
    } catch {
      setError(L("暫時無法儲存，請稍後再試。", "Could not save. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const codeOk = /^\d{8}$/.test(code.trim());

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{L("後台管理員驗證", "Admin verification")}</h2>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" role="tablist">
        {(["login", "first", "forgot"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          >
            {m === "login" ? L("登入", "Sign in") : m === "first" ? L("首次登入", "First login") : L("忘記密碼", "Forgot")}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="adm-mail">{L("管理員郵箱", "Admin email")}</Label>
        <Input id="adm-mail" value={session.email} readOnly />
      </div>

      {cred === undefined ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : mode === "login" ? (
        <form onSubmit={submitLogin} className="flex flex-col gap-4">
          {!cred && <p className="text-sm text-muted-foreground">{L("尚未設定密碼，請先使用「首次登入」。", "No password yet. Use First login.")}</p>}
          <PasswordField id="adm-pass" label={L("後台密碼", "Admin password")} value={password} onChange={setPassword} show={show} onToggle={() => setShow((s) => !s)} L={L} autoComplete="current-password" />
          <Feedback error={error} info={info} />
          <Button type="submit" className="h-12" disabled={busy || !password || !cred}>
            {busy && <Spinner />}
            {L("進入後台", "Enter back office")}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {mode === "first"
              ? L("首次登入需先以郵箱驗證碼確認身分，再設定後台密碼。", "First login: confirm your identity with an emailed code, then set a password.")
              : L("忘記密碼：以郵箱驗證碼確認身分後，重新設定密碼。", "Forgot password: confirm with an emailed code, then set a new password.")}
          </p>
          <Button type="button" variant="outline" className="h-11" onClick={sendCode} disabled={busy || cooldown > 0}>
            {busy && !challenge && <Spinner />}
            {cooldown > 0 ? L(`重新寄送（${cooldown}）`, `Resend (${cooldown})`) : challenge ? L("重新寄送驗證碼", "Resend code") : L("寄送驗證碼到郵箱", "Email me a code")}
          </Button>
          {challenge && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="adm-code">{L("8 碼驗證碼", "8-digit code")}</Label>
                <Input id="adm-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="tracking-widest tabular-nums" />
              </div>
              <PasswordField id="adm-new" label={L("新密碼（至少 8 碼）", "New password (min 8)")} value={password} onChange={setPassword} show={show} onToggle={() => setShow((s) => !s)} L={L} autoComplete="new-password" />
              <div className="flex flex-col gap-2">
                <Label htmlFor="adm-confirm">{L("再輸入一次密碼", "Confirm password")}</Label>
                <Input id="adm-confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={64} />
              </div>
            </>
          )}
          <Feedback error={error} info={info} />
          {challenge && (
            <Button type="submit" className="h-12" disabled={busy || !codeOk || !password || !confirm}>
              {busy && <Spinner />}
              {L("驗證並進入後台", "Verify & enter")}
            </Button>
          )}
        </form>
      )}
    </div>
  );
}

function Feedback({ error, info }: { error: string | null; info: string | null }) {
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  return info ? (
    <p role="status" className="text-sm text-muted-foreground">
      {info}
    </p>
  ) : null;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  L,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  L: (zh: string, en: string) => string;
  autoComplete: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} maxLength={64} className="pe-11" />
        <button type="button" onClick={onToggle} aria-label={show ? L("隱藏密碼", "Hide password") : L("顯示密碼", "Show password")} className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
