"use client";

import { useState } from "react";
import { ChevronRight, Globe, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/components/lang-context";
import { LANGS } from "@/lib/i18n";
import { pi } from "@/lib/pi";

interface Props {
  isAdmin: boolean;
  onOpenLanguage: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
}

export function SettingsView({ isAdmin, onOpenLanguage, onOpenAdmin, onSignOut }: Props) {
  const { t, lang } = useLang();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const currentName = LANGS.find((l) => l.code === lang)?.name ?? lang;

  const sendFeedback = async () => {
    const body = text.trim().slice(0, 500);
    if (!body || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const existing = await pi.userState.get("feedback");
      const items = ((existing?.blob as { items?: unknown[] } | undefined)?.items ?? []) as {
        body: string;
        at: number;
      }[];
      await pi.userState.set("feedback", { items: [...items, { body, at: Date.now() }].slice(-20) });
      setText("");
      setNote(t("sent"));
    } catch {
      setNote(t("sendFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("prefs")}</h2>
        <button
          type="button"
          onClick={onOpenLanguage}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-start hover:bg-secondary"
        >
          <Globe className="size-5 text-primary" aria-hidden="true" />
          <span className="flex-1 text-base font-medium">{t("language")}</span>
          <span className="text-sm text-muted-foreground">{currentName}</span>
          <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("feedbackTitle")}</h2>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("feedbackHint")}
          maxLength={500}
          rows={4}
          aria-label={t("feedbackTitle")}
        />
        <Button onClick={sendFeedback} disabled={busy || !text.trim()} className="h-11">
          {t("send")}
        </Button>
        {note && (
          <p role="status" className="text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </section>

      {isAdmin && (
        <section className="flex flex-col gap-3">
          <Button variant="outline" className="h-12 justify-start gap-3" onClick={onOpenAdmin}>
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            {t("adminEntry")}
          </Button>
        </section>
      )}

      <Button variant="secondary" className="h-12" onClick={onSignOut}>
        <LogOut className="size-5" aria-hidden="true" />
        {t("signOut")}
      </Button>
    </div>
  );
}
