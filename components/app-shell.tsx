"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Globe, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangContext } from "@/components/lang-context";
import { LanguageSheet } from "@/components/language-sheet";
import { HomeView } from "@/components/views/home-view";
import { SelectView } from "@/components/views/select-view";
import { EditorView } from "@/components/views/editor-view";
import { PosterEditor } from "@/components/views/poster-editor";
import { FUNCS, type EditFunc } from "@/lib/funcs";
import { SettingsView } from "@/components/views/settings-view";
import { AdminView } from "@/components/views/admin-view";
import { NoticesView } from "@/components/views/notices-view";
import { PayView } from "@/components/views/pay-view";
import { WalletProvider, useWallet } from "@/components/wallet-context";
import { AdminGate } from "@/components/admin-gate";
import { LATEST_NOTICE_ID } from "@/lib/announcements";
import { isAdminEmail } from "@/lib/app-config";
import type { Session } from "@/lib/profile";
import { RTL_LANGS, isLangCode, translate, type LangCode } from "@/lib/i18n";
import { pi } from "@/lib/pi";

export type EditKind = "photo" | "video";
export type EditMode = "hand" | "ai";
type View = "home" | "select" | "editor" | "settings" | "admin" | "notices" | "pay";

export function AppShell() {
  return (
    <WalletProvider>
      <AppShellInner />
    </WalletProvider>
  );
}

function AppShellInner() {
  const [seenNotice, setSeenNotice] = useState(0);
  const wallet = useWallet();
  const [adminVerified, setAdminVerified] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [lang, setLangState] = useState<LangCode>("zh-TW");
  const [view, setView] = useState<View>("home");
  const [func, setFunc] = useState<EditFunc | null>(null);
  const [mode, setMode] = useState<EditMode | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pi.userState
      .get("settings")
      .then((record) => {
        const saved = (record?.blob as { lang?: unknown } | undefined)?.lang;
        if (isLangCode(saved)) setLangState(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    pi.userState
      .get("notices-seen")
      .then((record) => {
        const id = (record?.blob as { id?: unknown } | undefined)?.id;
        if (typeof id === "number") setSeenNotice(id);
      })
      .catch(() => {});
  }, []);

  const markNoticesSeen = useCallback((id: number) => {
    setSeenNotice((prev) => {
      if (prev >= id) return prev;
      pi.userState.set("notices-seen", { id }).catch(() => {});
      return id;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pi.userState.set("settings", { lang: code }).catch(() => {});
    }, 1000);
  }, []);

  const ctx = useMemo(() => {
    const zh = lang === "zh-TW" || lang === "zh-CN";
    return {
      lang,
      setLang,
      t: (key: string) => translate(lang, key),
      L: (zhText: string, enText: string) => (zh ? zhText : enText),
    };
  }, [lang, setLang]);

  const { t } = ctx;
  const isAdmin = isAdminEmail(session?.email);

  const goBack = () => {
    if (view === "editor") setView("select");
    else if (view === "admin") setView("settings");
    else setView("home");
  };

  const signOut = () => {
    setAdminVerified(false);
    wallet.setAdmin(false);
    setSession(null);
    setFunc(null);
    setMode(null);
    setView("home");
  };

  const pickFunc = (f: EditFunc) => {
    setFunc(f);
    if (f === "single") {
      setMode("ai");
      setView("editor");
    } else if (f === "card" || f === "collage") {
      setMode(null);
      setView("editor");
    } else {
      setMode(null);
    }
  };

  const funcTitle = FUNCS.find((x) => x.id === func);

  const titles: Record<View, string> = {
    home: t("appName"),
    select: t("chooseType"),
    editor: funcTitle ? ctx.L(funcTitle.zh, funcTitle.en) : t("appName"),
    settings: t("settings"),
    admin: t("adminEntry"),
    notices: ctx.L("通告", "Notices"),
    pay: ctx.L("Pi 支付", "Pi Pay"),
  };

  return (
    <LangContext.Provider value={ctx}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
          {view !== "home" ? (
            <Button variant="ghost" size="icon" onClick={goBack} aria-label={t("back")}>
              <ArrowLeft className="size-5 rtl:rotate-180" />
            </Button>
          ) : (
            <span className="size-9" aria-hidden="true" />
          )}
          <h1 className="flex-1 truncate text-center text-base font-semibold">{titles[view]}</h1>
          <Button variant="ghost" size="icon" onClick={() => setLangOpen(true)} aria-label={t("language")}>
            <Globe className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setView("settings")} aria-label={t("settings")}>
            <Settings className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("signOut")}>
            <LogOut className="size-5" />
          </Button>
        </header>

        <main className="flex-1 px-4 py-5">
          {view === "home" && (
            <HomeView
              session={session}
              hasNewNotice={seenNotice < LATEST_NOTICE_ID}
              onLogin={setSession}
              onStart={() => setView("select")}
              onOpenLanguage={() => setLangOpen(true)}
              onOpenNotices={() => setView("notices")}
              onOpenPay={() => setView("pay")}
            />
          )}
          {view === "notices" && <NoticesView seenId={seenNotice} onSeen={markNoticesSeen} />}
          {view === "pay" && <PayView />}
          {view === "select" && session && (
            <SelectView
              func={func}
              onPickFunc={pickFunc}
              onPickMode={(m) => {
                setMode(m);
                setView("editor");
              }}
            />
          )}
          {view === "editor" && session && (func === "card" || func === "collage") && (
            <PosterEditor key={func} variant={func} />
          )}
          {view === "editor" && session && (func === "single" || func === "photos" || func === "video") && mode && (
            <EditorView key={`${func}-${mode}`} func={func} mode={mode} onOpenPay={() => setView("pay")} />
          )}
          {view === "settings" && (
            <SettingsView
              isAdmin={isAdmin}
              onOpenLanguage={() => setLangOpen(true)}
              onOpenAdmin={() => setView("admin")}
              onSignOut={signOut}
            />
          )}
          {view === "admin" && isAdmin && session && !adminVerified && (
            <AdminGate
              session={session}
              onVerified={() => {
                setAdminVerified(true);
                wallet.setAdmin(true);
              }}
            />
          )}
          {view === "admin" && isAdmin && session && adminVerified && <AdminView session={session} />}
        </main>

        <LanguageSheet open={langOpen} onOpenChange={setLangOpen} />
      </div>
    </LangContext.Provider>
  );
}
