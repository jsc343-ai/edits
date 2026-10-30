"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useLang } from "@/components/lang-context";
import { ANNOUNCEMENTS, LATEST_NOTICE_ID } from "@/lib/announcements";

export function NoticesView({ seenId, onSeen }: { seenId: number; onSeen: (id: number) => void }) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const initialSeen = useRef(seenId);

  useEffect(() => {
    onSeen(LATEST_NOTICE_ID);
  }, [onSeen]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-primary">
        <Bell className="size-5" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">{L("通告", "Announcements")}</h2>
      </div>
      {ANNOUNCEMENTS.map((a) => (
        <article key={a.id} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            {a.id > initialSeen.current && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {L("新", "NEW")}
              </span>
            )}
            <time className="text-xs text-muted-foreground">{a.date}</time>
          </div>
          <h3 className="text-base font-semibold">{zh ? a.zhTitle : a.enTitle}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{zh ? a.zhBody : a.enBody}</p>
        </article>
      ))}
    </div>
  );
}
