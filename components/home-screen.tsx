"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Megaphone, MessageSquare, Mic, Settings, Type } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { LanguagePicker } from "@/components/language-picker";
import { AccountCard } from "@/components/account-card";
import { GuideSection } from "@/components/guide-section";
import { StorePanel } from "@/components/store-panel";
import { Button } from "@/components/ui/button";

const HIDDEN_TAPS = 7;

export function HomeScreen() {
  const { t, mode, setMode } = useApp();
  const router = useRouter();
  const taps = useRef({ count: 0, last: 0 });

  function onBrandTap() {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 800 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= HIDDEN_TAPS) {
      taps.current.count = 0;
      router.push("/admin");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-4">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBrandTap}
          className="flex items-center gap-2 rounded-lg py-1 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="size-5" aria-hidden="true" />
          </span>
          <span className="font-semibold">{t("appName")}</span>
        </button>
        <div className="flex items-center gap-1">
          <LanguagePicker />
          <Button asChild variant="ghost" size="icon" className="size-10">
            <Link href="/settings" aria-label={t("settings")}>
              <Settings className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-5 pt-2">
        <div className="scene-3d flex justify-center pb-2 pt-6" aria-hidden="true">
          <div className="float-3d relative h-44 w-72">
            <div className="absolute inset-0 -rotate-6 rounded-3xl border border-border bg-card shadow-xl">
              <div className="flex h-full flex-col justify-between p-3">
                <div className="flex justify-between">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="size-2 rounded-sm bg-muted-foreground/30" />
                  ))}
                </div>
                <div className="flex justify-between">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="size-2 rounded-sm bg-muted-foreground/30" />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 translate-x-2 translate-y-1 rotate-3 rounded-3xl bg-primary shadow-2xl" />
            <div className="absolute inset-3 flex items-center justify-center rounded-2xl bg-card/95 shadow-inner">
              <Clapperboard className="size-14 text-primary" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="mx-auto mb-3 w-fit rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            {t("appName")}
          </p>
          <h1 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {t("heroSub")}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-1 shadow-sm">
          <AccountCard />
        </div>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("modeText")}>
          {(
            [
              { id: "text", icon: Type, title: "modeText", desc: "modeTextDesc" },
              { id: "voice", icon: Mic, title: "modeVoice", desc: "modeVoiceDesc" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                mode === m.id ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <m.icon className="size-6 text-primary" aria-hidden="true" />
              <span className="font-medium">{t(m.title)}</span>
              <span className="text-sm text-muted-foreground">{t(m.desc)}</span>
            </button>
          ))}
        </div>
        <Button asChild size="lg" className="h-12 text-base">
          <Link href="/pro">{t("openStudio")}</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">{t("notSaved")}</p>
      </section>

      <GuideSection />
      <StorePanel />

      <nav aria-label={t("announcements")} className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link href="/announcements">
            <Megaphone className="size-4" aria-hidden="true" />
            {t("announcements")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link href="/feedback">
            <MessageSquare className="size-4" aria-hidden="true" />
            {t("feedbackTitle")}
          </Link>
        </Button>
      </nav>
    </div>
  );
}
