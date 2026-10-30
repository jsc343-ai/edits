"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLang } from "@/components/lang-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { pi } from "@/lib/pi";
import { ADMIN_EMAILS, ADMIN_DAILY_POINTS } from "@/lib/app-config";
import type { Session } from "@/lib/profile";

function useStoredList<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    pi.userState
      .get(key)
      .then((r) => setItems(((r?.blob as { items?: T[] } | undefined)?.items ?? []) as T[]))
      .catch(() => setError(true));
  }, [key]);

  const save = useCallback(
    async (next: T[]) => {
      setItems(next);
      try {
        await pi.userState.set(key, { items: next });
        setError(false);
      } catch {
        setError(true);
      }
    },
    [key],
  );

  return { items, save, error };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 pt-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">{text}</p>;
}

interface Faq {
  q: string;
  a: string;
}
interface Notice {
  title: string;
  body: string;
  at: number;
}
interface FeedbackItem {
  body: string;
  at: number;
  reply?: string;
}

interface AdminProps {
  session: Session;
}

export function AdminView({ session }: AdminProps) {
  const { L } = useLang();
  const { user } = usePiAuth();
  const faq = useStoredList<Faq>("admin-faq");
  const notices = useStoredList<Notice>("admin-notices");
  const feedback = useStoredList<FeedbackItem>("feedback");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [sysNote, setSysNote] = useState("");

  const tabs = [
    ["players", L("玩家資訊", "Players")],
    ["online", L("在線資訊", "Online")],
    ["pay", L("收付 Pi", "Pi payments")],
    ["reply", L("自動回覆", "Auto-reply")],
    ["notice", L("通告", "Notices")],
    ["feedback", L("反饋", "Feedback")],
    ["system", L("設定", "System")],
  ];

  return (
    <Tabs defaultValue="players" className="w-full">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="shrink-0 px-3 py-2">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="players">
        <Panel title={L("玩家資訊", "Players")}>
          <Row label={L("目前登入玩家", "Signed-in player")} value={user?.username ?? "-"} />
          <Row label="UID" value={user?.uid ?? "-"} />
          <Empty text={L("每位玩家一個帳戶，已註冊玩家名單將在正式管理網址建立後顯示。", "One account per player. The full registered list will appear once the official admin site is live.")} />
        </Panel>
      </TabsContent>

      <TabsContent value="online">
        <Panel title={L("在線資訊", "Online")}>
          <Row label={L("目前連線", "This session")} value={L("在線", "Online")} />
          <Empty text={L("全體玩家在線狀況將在正式管理網址建立後顯示。", "Live status for all players will appear once the official admin site is live.")} />
        </Panel>
      </TabsContent>

      <TabsContent value="pay">
        <Panel title={L("收付 Pi 資訊", "Pi payments")}>
          <Row label={L("兌換比率", "Exchange rate")} value={L("1 Pi = 1,000 點", "1 Pi = 1,000 points")} />
          <Row label={L("相片編輯", "Photo edit")} value={L("每次扣 30 點", "30 points each")} />
          <Row label={L("短視頻編輯", "Video edit")} value={L("每次扣 50 點，不分長度", "50 points each, any length")} />
          <Empty text={L("Pi 支付由 Pi 官方處理；全體玩家的收款明細將在正式管理網址建立後顯示。", "Pi payments are handled by Pi. A full ledger across all players will appear once the official admin site is live.")} />
        </Panel>
      </TabsContent>

      <TabsContent value="reply">
        <Panel title={L("自動回覆常見問答", "Auto-reply Q&A")}>
          {faq.items.length === 0 && <Empty text={L("尚未建立問答。", "No Q&A yet.")} />}
          {faq.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.q}</p>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={L("刪除", "Delete")}
                onClick={() => faq.save(faq.items.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("常見問題", "Question")} maxLength={120} />
          <Textarea value={a} onChange={(e) => setA(e.target.value)} placeholder={L("自動回覆內容", "Reply")} rows={3} maxLength={400} />
          <Button
            disabled={!q.trim() || !a.trim()}
            onClick={() => {
              faq.save([...faq.items, { q: q.trim(), a: a.trim() }].slice(-20));
              setQ("");
              setA("");
            }}
          >
            <Plus className="size-4" />
            {L("新增問答", "Add Q&A")}
          </Button>
          {faq.error && <p className="text-sm text-destructive">{L("保存失敗，請稍後再試。", "Could not save. Try again later.")}</p>}
        </Panel>
      </TabsContent>

      <TabsContent value="notice">
        <Panel title={L("通告編輯發送", "Compose notice")}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("標題", "Title")} maxLength={80} />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={L("通告內容", "Message")} rows={4} maxLength={600} />
          <Button
            disabled={!title.trim() || !body.trim()}
            onClick={() => {
              notices.save([{ title: title.trim(), body: body.trim(), at: Date.now() }, ...notices.items].slice(0, 10));
              setTitle("");
              setBody("");
            }}
          >
            {L("發送通告", "Publish")}
          </Button>
          {notices.items.map((n) => (
            <div key={n.at} className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="font-medium">{n.title}</p>
              <p className="text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.at).toLocaleString()}</p>
            </div>
          ))}
        </Panel>
      </TabsContent>

      <TabsContent value="feedback">
        <Panel title={L("反饋收集回覆", "Feedback inbox")}>
          {feedback.items.length === 0 && <Empty text={L("目前沒有反饋。", "No feedback yet.")} />}
          {feedback.items.map((f, i) => (
            <div key={f.at} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-sm">
              <p>{f.body}</p>
              {f.reply ? (
                <p className="rounded-lg bg-secondary p-2 text-muted-foreground">{f.reply}</p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={replies[i] ?? ""}
                    onChange={(e) => setReplies((r) => ({ ...r, [i]: e.target.value }))}
                    placeholder={L("回覆", "Reply")}
                    maxLength={300}
                  />
                  <Button
                    disabled={!(replies[i] ?? "").trim()}
                    onClick={() =>
                      feedback.save(feedback.items.map((x, j) => (j === i ? { ...x, reply: replies[i].trim() } : x)))
                    }
                  >
                    {L("送出", "Send")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </Panel>
      </TabsContent>

      <TabsContent value="system">
        <Panel title={L("管理員", "Administrators")}>
          <Row label={L("目前登入", "Signed in as")} value={session.email} />
          <Row label={L("每日點數", "Daily points")} value={L(`每日凌晨歸 0，發 ${ADMIN_DAILY_POINTS} 點`, `Reset at midnight, ${ADMIN_DAILY_POINTS} pts`)} />
          {ADMIN_EMAILS.map((email) => (
            <div key={email} className="rounded-xl border border-border bg-card px-4 py-2 text-sm">
              <span className="truncate">{email}</span>
            </div>
          ))}
        </Panel>
        <Panel title={L("系統設定", "System settings")}>
          <Textarea
            value={sysNote}
            onChange={(e) => setSysNote(e.target.value)}
            placeholder={L("管理備註（僅此裝置顯示）", "Admin notes (this session only)")}
            rows={4}
          />
          <Empty text={L("此暫時入口待正式管理網址建立後即可撤出，不影響前台功能。", "This temporary entry can be removed once the official admin address is ready, without affecting the player app.")} />
        </Panel>
      </TabsContent>
    </Tabs>
  );
}
