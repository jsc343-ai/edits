"use client";

import { Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLang } from "@/components/lang-context";
import { LANGS } from "@/lib/i18n";

export function LanguageSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lang, setLang, t } = useLang();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("language")}</SheetTitle>
        </SheetHeader>
        <ul className="grid grid-cols-2 gap-2 px-4 pb-6">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code);
                  onOpenChange(false);
                }}
                aria-pressed={lang === l.code}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium ${
                  lang === l.code ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-secondary"
                }`}
              >
                {l.name}
                {lang === l.code && <Check className="size-4" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
