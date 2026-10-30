"use client";

import { ArrowRight, Bell, Coins, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginCard } from "@/components/login-card";
import { useLang } from "@/components/lang-context";
import { useWallet } from "@/components/wallet-context";
import type { Session } from "@/lib/profile";

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];

interface Props {
  session: Session | null;
  hasNewNotice: boolean;
  onLogin: (s: Session) => void;
  onStart: () => void;
  onOpenLanguage: () => void;
  onOpenNotices: () => void;
  onOpenPay: () => void;
}

export function HomeView({
  session,
  hasNewNotice,
  onLogin,
  onStart,
  onOpenLanguage,
  onOpenNotices,
  onOpenPay,
}: Props) {
  const { t, L } = useLang();
  const wallet = useWallet();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center gap-6 pt-2 text-center">
        <div className="relative h-48 w-40" style={{ perspective: "900px" }} aria-hidden="true">
          <div className="animate-memory-sway absolute inset-0 rotate-[-4deg] rounded-md bg-card p-2 pb-8 shadow-xl ring-1 ring-border">
            <img src="/placeholder.svg?height=260&width=200" alt="" className="h-full w-full rounded-sm object-cover" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {session && (
            <p className="text-sm font-medium text-primary">{t("hello").replace("{name}", session.username)}</p>
          )}
          <h1 className="text-balance text-3xl font-bold tracking-tight">{t("appName")}</h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">{t("tagline")}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="outline" className="relative h-14 flex-col gap-0 text-base" onClick={onOpenNotices}>
            <span className="flex items-center gap-2">
              <Bell className="size-5" aria-hidden="true" />
              {L("通告", "Notices")}
            </span>
            {hasNewNotice && (
              <span className="absolute -top-2 end-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground shadow">
                {L("新", "NEW")}
              </span>
            )}
          </Button>
          <Button variant="outline" className="h-14 flex-col gap-0 text-base" onClick={onOpenPay}>
            <span className="flex items-center gap-2">
              <Coins className="size-5" aria-hidden="true" />
              {L("Pi 支付", "Pi Pay")}
            </span>
            <span className="text-xs font-normal tabular-nums text-muted-foreground">
              {wallet.ready ? `${wallet.points.toLocaleString()} ${L("點", "pts")}` : "..."}
            </span>
          </Button>
        </div>

        {session ? (
          <div className="flex w-full flex-col gap-2">
            <Button size="lg" className="h-12 text-base" onClick={onStart}>
              {t("start")}
              <ArrowRight className="size-5 rtl:rotate-180" aria-hidden="true" />
            </Button>
            <p className="text-xs text-muted-foreground">{session.email}</p>
          </div>
        ) : (
          <LoginCard onLogin={onLogin} />
        )}

        <div className="flex w-full flex-col gap-2">
          <Button variant="outline" size="lg" className="h-12 w-full" onClick={onOpenLanguage}>
            <Globe className="size-5" aria-hidden="true" />
            {t("language")}
          </Button>
        </div>
      </section>

      <section aria-labelledby="how-title" className="rounded-2xl bg-secondary p-5">
        <h2 id="how-title" className="mb-3 text-lg font-semibold">
          {t("howTitle")}
        </h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((key, i) => (
            <li key={key} className="flex items-center gap-3 text-base">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="leading-snug">{t(key)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          {L("相片可編輯 1～20 張，短視頻可編輯 3～5 分鐘。", "Edit 1-20 photos, or videos of 3-5 minutes.")}
        </p>
      </section>
    </div>
  );
}
