"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useLang } from "@/components/lang-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { checkPassword, loadProfile, saveProfile, type Session } from "@/lib/profile";

type Mode = "login" | "first" | "forgot";

export function LoginCard({ onLogin }: { onLogin: (s: Session) => void }) {
  const { L } = useLang();
  const { user } = usePiAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const complete = username.trim().length > 0 && emailOk && password.length >= 6;

  const labels: Record<Mode, string> = {
    login: L("登入體驗", "Start the experience"),
    first: L("建立帳戶並登入", "Create account & sign in"),
    forgot: L("重設密碼並登入", "Reset password & sign in"),
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    const mail = email.trim().toLowerCase();
    try {
      const profile = await loadProfile();
      if (mode === "login") {
        if (!profile) return setError(L("尚未建立帳戶，請先使用「首次登入」。", "No account yet. Please use First login."));
        if (profile.email !== mail || !(await checkPassword(profile, password)))
          return setError(L("郵箱或密碼不正確。", "Email or password is incorrect."));
      } else if (mode === "first") {
        if (profile) return setError(L("此 Pi 帳號已建立，請直接登入或使用「忘記密碼」。", "This Pi account already exists. Sign in or use Forgot password."));
        await saveProfile(mail, password);
      } else {
        if (!profile) return setError(L("尚未建立帳戶，請先使用「首次登入」。", "No account yet. Please use First login."));
        await saveProfile(mail, password);
      }
      onLogin({ username: username.trim(), email: mail });
    } catch {
      setError(L("暫時無法完成，請稍後再試。", "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-start">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" role="tablist">
        {(["login", "first", "forgot"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "text-foreground"
            }`}
          >
            {m === "login" ? L("登入", "Sign in") : m === "first" ? L("首次登入", "First login") : L("忘記密碼", "Forgot")}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pi-name">{L("Pi 用戶名稱", "Pi username")}</Label>
        <Input id="pi-name" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pi-mail">{L("Pi 用戶郵箱", "Pi email")}</Label>
        <Input id="pi-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pi-pass">
          {mode === "forgot" ? L("新的自設密碼（至少 6 碼）", "New password (min 6)") : L("自設密碼（至少 6 碼）", "Your password (min 6)")}
        </Label>
        <div className="relative">
          <Input
            id="pi-pass"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={64}
            className="pe-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? L("隱藏密碼", "Hide password") : L("顯示密碼", "Show password")}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {mode === "forgot" && (
        <p className="text-xs text-muted-foreground">
          {L("重設時會同時更新此 Pi 帳號綁定的郵箱與密碼。", "Resetting also updates the email and password linked to this Pi account.")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!complete && (
        <p className="text-xs text-muted-foreground">{L("三項填寫完整才可登入。", "Fill in all three fields to continue.")}</p>
      )}
      <Button type="submit" size="lg" className="h-12 text-base" disabled={!complete || busy}>
        {busy && <Spinner />}
        {labels[mode]}
      </Button>
    </form>
  );
}
