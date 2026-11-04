"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Download, Eraser, ImagePlus, Loader2, Share2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { EditorView } from "@/components/views/editor-view";
import { FormatPanel } from "@/components/format-panel";
import { autoClear } from "@/lib/inpaint";
import { canvasToBlob, loadImage } from "@/lib/cutout";
import { aspectSize, type Aspect } from "@/lib/compositor";
import type { EditMode } from "@/components/app-shell";

type Step = "upload" | "format" | "erase" | "result";
type Fit = "cover" | "contain";

const FORMATS: Aspect[] = ["9:16", "3:4", "4:5", "1:1", "4:3", "16:9", "2:3", "3:2"];
const SCALE = 1.5;

export function RestoreEditor({ mode, onOpenPay }: { mode: EditMode; onOpenPay: () => void }) {
  const { L } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const framedRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState<Step>("upload");
  const [aspect, setAspect] = useState<Aspect>("3:4");
  const [fit, setFit] = useState<Fit>("cover");
  const [brush, setBrush] = useState(24);
  const [hasMarks, setHasMarks] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<File | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const frameInto = (canvas: HTMLCanvasElement) => {
    const img = imgRef.current;
    if (!img) return;
    const { w, h } = aspectSize(aspect);
    const cw = Math.round(w * SCALE);
    const ch = Math.round(h * SCALE);
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, ch);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = fit === "cover" ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
    const dw = iw * r;
    const dh = ih * r;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  useEffect(() => {
    if (step === "format" && previewRef.current) frameInto(previewRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, aspect, fit]);

  if (handoff) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setHandoff(null);
            setStep("result");
          }}
          className="self-start"
        >
          <ArrowLeft aria-hidden="true" />
          {L("回到修復結果", "Back to the result")}
        </Button>
        <EditorView key="restore-edit" func="single" mode={mode} onOpenPay={onOpenPay} initialFile={handoff} initialAspect={aspect} />
      </div>
    );
  }

  const load = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    try {
      imgRef.current = await loadImage(url);
      setStep("format");
    } catch {
      setMessage(L("圖片讀取失敗，請換一張。", "Could not read that image. Try another."));
    }
  };

  const startErase = () => {
    setStep("erase");
    setHasMarks(false);
    setMessage(null);
    requestAnimationFrame(() => {
      const base = baseRef.current;
      const mark = markRef.current;
      if (!base || !mark) return;
      frameInto(base);
      mark.width = base.width;
      mark.height = base.height;
      mark.getContext("2d")?.clearRect(0, 0, mark.width, mark.height);
    });
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = markRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  const radius = () => {
    const c = markRef.current!;
    const r = c.getBoundingClientRect();
    return (brush * c.width) / r.width / 2;
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = markRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "rgba(229,72,77,0.65)";
    ctx.lineWidth = radius() * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    drawing.current = p;
    stroke(p, p);
    setHasMarks(true);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = point(e);
    stroke(drawing.current, p);
    drawing.current = p;
  };
  const onUp = () => {
    drawing.current = null;
  };

  const clearMarks = () => {
    const c = markRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasMarks(false);
  };

  const run = () => {
    const base = baseRef.current;
    const mark = markRef.current;
    if (!base || !mark) return;
    setBusy(true);
    setTimeout(() => {
      const w = base.width;
      const h = base.height;
      const bctx = base.getContext("2d");
      const mctx = mark.getContext("2d");
      if (!bctx || !mctx) return setBusy(false);
      const marks = mctx.getImageData(0, 0, w, h).data;
      const painted = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) if (marks[i * 4 + 3] > 20) painted[i] = 1;
      const img = bctx.getImageData(0, 0, w, h);
      autoClear(img, painted, Math.round(radius() * 2));
      bctx.putImageData(img, 0, 0);
      clearMarks();
      setBusy(false);
      setMessage(L("已清除。還有要清的地方可以再塗一次，都處理好就按「確認」。", "Cleared. Mark more areas if needed, then tap Confirm."));
    }, 30);
  };

  const confirmErase = () => {
    const base = baseRef.current;
    if (!base) return;
    const copy = document.createElement("canvas");
    copy.width = base.width;
    copy.height = base.height;
    copy.getContext("2d")?.drawImage(base, 0, 0);
    framedRef.current = copy;
    setMessage(null);
    setStep("result");
  };

  const makeBlob = async () => {
    const c = framedRef.current;
    return c ? canvasToBlob(c) : null;
  };

  const proceed = async () => {
    const blob = await makeBlob();
    if (blob) setHandoff(new File([blob], "restored.png", { type: "image/png" }));
  };

  const download = async () => {
    const blob = await makeBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jsc343-restore-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage(L("已開始下載。", "Download started."));
  };

  const share = async () => {
    const blob = await makeBlob();
    if (!blob) return;
    const file = new File([blob], "restored.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "JSC343 AI EDITS" });
      } else {
        setMessage(L("這個裝置不支援直接分享，請改用「下載存檔」再分享。", "This device cannot share directly. Download the image and share it from there."));
      }
    } catch {
      // 使用者取消分享時不需提示
    }
  };

  const steps: [Step, string][] = [
    ["upload", L("圖片", "Image")],
    ["format", L("格式", "Format")],
    ["erase", L("擦除", "Erase")],
    ["result", L("完成", "Done")],
  ];
  const currentIndex = steps.findIndex(([id]) => id === step);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex items-center gap-1" aria-label={L("步驟", "Steps")}>
        {steps.map(([id, label], i) => (
          <li
            key={id}
            aria-current={i === currentIndex ? "step" : undefined}
            className={`flex-1 rounded-full px-2 py-1 text-center text-xs font-medium ${
              i === currentIndex ? "bg-primary text-primary-foreground" : i < currentIndex ? "bg-secondary text-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          load(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {step === "upload" && (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {L(
              "加入你想延用的問候圖片或照片。接著選屏幕格式、擦去不要的文字或物件，就能繼續編輯、下載或分享。",
              "Add the greeting image or photo you want to reuse. Then pick a screen format, erase unwanted text or objects, and continue editing, download or share.",
            )}
          </p>
          <Button size="lg" className="h-28 flex-col gap-2" variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-6" aria-hidden="true" />
            {L("加入延用圖片、照片", "Add an image or photo")}
          </Button>
        </>
      )}

      {step === "format" && (
        <>
          <FormatPanel options={FORMATS} value={aspect} onChange={setAspect} />
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("圖片放入方式", "How the image fits")}>
            <Button variant={fit === "cover" ? "default" : "outline"} aria-pressed={fit === "cover"} onClick={() => setFit("cover")}>
              {L("填滿畫面（可能裁切）", "Fill frame (may crop)")}
            </Button>
            <Button variant={fit === "contain" ? "default" : "outline"} aria-pressed={fit === "contain"} onClick={() => setFit("contain")}>
              {L("完整放入（留白邊）", "Fit whole image")}
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-secondary p-2">
            <canvas ref={previewRef} className="mx-auto block h-auto max-h-[40dvh] w-auto max-w-full" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden="true" />
              {L("換圖片", "Change image")}
            </Button>
            <Button className="flex-1" onClick={startErase}>
              {L("下一步：擦去區域", "Next: erase areas")}
            </Button>
          </div>
        </>
      )}

      {step === "erase" && (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {L(
              "用手指塗抹想去掉的文字或物件，按「自動清除」，系統會判斷範圍並補上周圍背景。",
              "Paint over the text or objects to remove, then tap Auto clear. The app finds the area and fills in the background.",
            )}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-secondary p-2">
            <div className="relative mx-auto w-fit max-w-full">
              <canvas ref={baseRef} className="block h-auto max-h-[50dvh] w-auto max-w-full" />
              <canvas
                ref={markRef}
                className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                aria-label={L("在這裡塗抹要清除的區域", "Paint the area to clear here")}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Eraser className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Slider value={[brush]} min={6} max={80} step={2} onValueChange={(v) => setBrush(v[0])} aria-label={L("筆刷大小", "Brush size")} />
            <span className="w-8 text-end text-sm text-muted-foreground">{brush}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={run} disabled={!hasMarks || busy} className="h-12">
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Wand2 aria-hidden="true" />}
              {L("自動清除", "Auto clear")}
            </Button>
            <Button variant="outline" onClick={clearMarks} disabled={!hasMarks || busy} className="h-12">
              <Trash2 aria-hidden="true" />
              {L("取消塗抹", "Reset marks")}
            </Button>
            <Button variant="secondary" onClick={() => setStep("format")} disabled={busy} className="h-12">
              <ArrowLeft aria-hidden="true" />
              {L("上一步", "Back")}
            </Button>
            <Button onClick={confirmErase} disabled={busy || hasMarks} className="h-12">
              <Check aria-hidden="true" />
              {L("確認", "Confirm")}
            </Button>
          </div>
          {hasMarks && (
            <p className="text-xs text-muted-foreground">{L("還有塗抹尚未清除，請先按「自動清除」或「取消塗抹」。", "You have marks that are not cleared yet. Tap Auto clear or Reset marks first.")}</p>
          )}
        </>
      )}

      {step === "result" && (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {L("修復完成。你可以繼續編輯、下載存檔，或直接分享。", "Restore complete. Continue editing, download, or share it.")}
          </p>
          <ResultPreview source={framedRef.current} />
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={proceed} className="h-12">
              <Sparkles aria-hidden="true" />
              {L("繼續編輯（文字、插圖、3D 動態）", "Continue editing (text, artwork, 3D)")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={download} className="h-12">
                <Download aria-hidden="true" />
                {L("下載存檔", "Download")}
              </Button>
              <Button variant="secondary" onClick={share} className="h-12">
                <Share2 aria-hidden="true" />
                {L("直接分享", "Share")}
              </Button>
            </div>
            <Button variant="outline" onClick={startErase} className="h-12">
              <ArrowLeft aria-hidden="true" />
              {L("回去再擦一次", "Back to erasing")}
            </Button>
          </div>
        </>
      )}

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

function ResultPreview({ source }: { source: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !source) return;
    c.width = source.width;
    c.height = source.height;
    c.getContext("2d")?.drawImage(source, 0, 0);
  }, [source]);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary p-2">
      <canvas ref={ref} className="mx-auto block h-auto max-h-[50dvh] w-auto max-w-full" />
    </div>
  );
}
