"use client";

import { Clapperboard, Images, LayoutGrid, LayoutTemplate, PenLine, Sparkles } from "lucide-react";
import { useLang } from "@/components/lang-context";
import { FUNCS, type EditFunc } from "@/lib/funcs";
import type { EditMode } from "@/components/app-shell";

interface Props {
  func: EditFunc | null;
  onPickFunc: (f: EditFunc) => void;
  onPickMode: (m: EditMode) => void;
}

const ICONS: Record<EditFunc, React.ReactNode> = {
  card: <LayoutTemplate className="size-6" aria-hidden="true" />,
  collage: <LayoutGrid className="size-6" aria-hidden="true" />,
  single: <Sparkles className="size-6" aria-hidden="true" />,
  photos: <Images className="size-6" aria-hidden="true" />,
  video: <Clapperboard className="size-6" aria-hidden="true" />,
};

function Choice({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-start transition-colors ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

export function SelectView({ func, onPickFunc, onPickMode }: Props) {
  const { t, L } = useLang();
  const needsMode = func === "photos" || func === "video";
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{L("選擇編輯功能", "Choose an editor")}</h2>
        <p className="text-sm text-muted-foreground">
          {L("五種功能各自獨立分頁，互不影響。", "Each of the five editors is its own page and never mixes with the others.")}
        </p>
        {FUNCS.map((f) => (
          <Choice
            key={f.id}
            selected={func === f.id}
            onClick={() => onPickFunc(f.id)}
            icon={ICONS[f.id]}
            title={L(f.zh, f.en)}
            desc={L(f.descZh, f.descEn)}
          />
        ))}
      </section>

      {needsMode && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("chooseMode")}</h2>
          <Choice
            onClick={() => onPickMode("hand")}
            icon={<PenLine className="size-6" aria-hidden="true" />}
            title={t("hand")}
            desc={t("handDesc")}
          />
          <Choice
            onClick={() => onPickMode("ai")}
            icon={<Sparkles className="size-6" aria-hidden="true" />}
            title={t("ai3d")}
            desc={t("aiDesc")}
          />
        </section>
      )}
    </div>
  );
}
