"use client";

import { useRef, useState } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  Receipt as ReceiptIcon,
  Scale,
  Calculator,
  Brain,
  Camera,
  AlertTriangle,
  Image as ImageIcon,
  ChevronDown,
  FilePlus2,
} from "lucide-react";

type Result = {
  vendor: string;
  date: string;
  gross: string;
  net: string;
  vat: string;
  vatRate: string;
  category: string;
  receiptType: string;
  legalNotes: string[];
  confidence: "Hoch" | "Mittel" | "Niedrig";
  rawConfidence: number;
};

type Step = { label: string; detail: string; Icon: typeof Brain };

const STEPS: Step[] = [
  { label: "Bild analysieren", detail: "Claude Vision liest jeden Text", Icon: Camera },
  { label: "Daten extrahieren", detail: "Lieferant · Datum · Beträge · USt", Icon: Calculator },
  { label: "Recht abgleichen", detail: "§ 11 UStG · § 12 UStG · SKR03", Icon: Scale },
  { label: "Report fertig", detail: "Bereit für Steuerberater", Icon: CheckCircle2 },
];

// Echte Belegfotos (komprimiert in public/beispiel-belege/)
const SAMPLE_RECEIPTS = [
  { src: "/beispiel-belege/IMG_0253.webp", label: "Beleg 1" },
  { src: "/beispiel-belege/IMG_0254.webp", label: "Beleg 2" },
  { src: "/beispiel-belege/IMG_0255.webp", label: "Beleg 3" },
  { src: "/beispiel-belege/IMG_0256.webp", label: "Beleg 4" },
  { src: "/beispiel-belege/IMG_0257.webp", label: "Beleg 5" },
  { src: "/beispiel-belege/IMG_0258.webp", label: "Beleg 6" },
  { src: "/beispiel-belege/IMG_0259.webp", label: "Beleg 7" },
  { src: "/beispiel-belege/IMG_0260.webp", label: "Beleg 8" },
  { src: "/beispiel-belege/IMG_0261.webp", label: "Beleg 9" },
  { src: "/beispiel-belege/IMG_0262.webp", label: "Beleg 10" },
  { src: "/beispiel-belege/IMG_0263.webp", label: "Beleg 11" },
];

function classifyConfidence(c: number): "Hoch" | "Mittel" | "Niedrig" {
  if (c >= 0.85) return "Hoch";
  if (c >= 0.65) return "Mittel";
  return "Niedrig";
}

function legalNotesFor(data: any): string[] {
  const notes: string[] = [];
  const gross = Number(data.gross_amount) || 0;
  const net = Number(data.net_amount) || 0;
  const vat = Number(data.vat_amount) || 0;
  const rate = Number(data.vat_rate) || 0;

  if (data.vendor) notes.push(`§ 11 UStG: Lieferant „${data.vendor}" identifiziert`);
  if (rate > 0) notes.push(`USt-Satz ${rate} % erkannt · Vorsteuerabzug möglich`);
  if (gross > 0 && Math.abs(net + vat - gross) < 0.05) {
    notes.push("Brutto = Netto + USt ✓ Rechnung plausibel");
  } else if (gross > 0 && net > 0) {
    notes.push("Achtung: Brutto/Netto/USt prüfen — Differenz erkannt");
  }
  if (data.receipt_type === "Tankbeleg" || /tank|shell|omv|bp|aral/i.test(String(data.vendor || ""))) {
    notes.push("§ 26 EStG: Treibstoff bei betrieblichem Kfz absetzbar");
  }
  if (data.receipt_type === "Bewirtungsbeleg") {
    notes.push("§ 4 Abs 4 Z 1 EStG: 50 % als BA, 50 % nicht abzugsfähig");
  }
  if (gross >= 400) {
    notes.push("> 400 € · vollständige Pflichtangaben nach § 11 UStG erforderlich");
  }
  return notes.slice(0, 4);
}

function categoryWithSkr(cat: string): string {
  const map: Record<string, string> = {
    Material: "Wareneinkauf (SKR03 3400)",
    Werkzeug: "Werkzeug & Material (SKR03 4985)",
    Treibstoff: "Fahrtkosten (SKR03 4530)",
    "Büro": "Bürobedarf (SKR03 4930)",
    Bewirtung: "Bewirtung (SKR03 4650)",
    Sonstiges: "Sonstige Aufwendungen (SKR03 4990)",
  };
  return map[cat] || cat || "Wird geprüft";
}

export function MagicMoment() {
  const [state, setState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Kein Auto-Preview mehr — User wählt aktiv.

  async function analyze(formData: FormData, preview: string) {
    setState("scanning");
    setResult(null);
    setErrMsg(null);
    setPreviewSrc(preview);
    setActiveStep(0);

    const stepDuration = 900;
    STEPS.forEach((_, i) => {
      setTimeout(() => setActiveStep(i), i * stepDuration);
    });

    try {
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();
      await new Promise((r) => setTimeout(r, STEPS.length * stepDuration + 300));

      if (!res.ok || data._error || !data.vendor) {
        setErrMsg(
          data?._demo
            ? "Demo-Modus aktiv — ANTHROPIC_API_KEY fehlt im Server."
            : data?._error || "Beleg konnte nicht ausgelesen werden — bitte schärferes Foto probieren."
        );
        setState("error");
        setActiveStep(STEPS.length);
        return;
      }

      const gross = Number(data.gross_amount) || 0;
      const net = Number(data.net_amount) || gross / 1.2;
      const vat = Number(data.vat_amount) || gross - net;
      const rate = Number(data.vat_rate) || 20;
      const conf = typeof data.confidence === "number" ? data.confidence : 0.9;
      const fmt = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

      setResult({
        vendor: String(data.vendor || "Unbekannt"),
        date: data.date || "–",
        gross: fmt(gross),
        net: fmt(net),
        vat: fmt(vat),
        vatRate: `${rate} %`,
        category: categoryWithSkr(data.category),
        receiptType: data.receipt_type || "Beleg",
        legalNotes: legalNotesFor(data),
        confidence: classifyConfidence(conf),
        rawConfidence: conf,
      });
      setState("done");
      setActiveStep(STEPS.length);
    } catch (e: any) {
      setErrMsg(e?.message || "Netzwerk-Fehler");
      setState("error");
      setActiveStep(STEPS.length);
    }
  }

  async function runSample(src: string) {
    if (state === "scanning") return;
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const file = new File([blob], src.split("/").pop() || "beleg.webp", { type: blob.type });
      const fd = new FormData();
      fd.append("file", file);
      analyze(fd, src);
    } catch {
      setErrMsg("Beispiel-Beleg konnte nicht geladen werden");
      setState("error");
    }
  }

  function runUpload(file: File) {
    const preview = URL.createObjectURL(file);
    const fd = new FormData();
    fd.append("file", file);
    analyze(fd, preview);
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    runUpload(f);
  };

  const confColor =
    result?.confidence === "Hoch"
      ? "bg-accent-soft text-accent border-emerald-200"
      : result?.confidence === "Mittel"
        ? "bg-warn-soft text-warn border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-brand-50 via-white to-accent-soft border-y border-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" /> Live mit Claude · keine Fake-Demo
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Echte Belege. Echte KI. In 4 Sekunden.
          </h2>
          <p className="mt-3 text-slate-600">
            Wähle einen echten Test-Beleg unten oder lade deinen eigenen hoch. Claude liest, prüft
            und kategorisiert direkt vor deinen Augen — mit Verweis auf österreichisches Steuerrecht.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100 relative">
            {/* Desk-Look Hintergrund */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
            <div className="relative aspect-[3/4] overflow-hidden flex items-center justify-center p-4 lg:p-6">
              {previewSrc ? (
                <div className="relative max-h-full max-w-full transition-transform duration-500" style={{ transform: state === "scanning" ? "rotate(0deg) scale(0.98)" : "rotate(-0.6deg)" }}>
                  {/* Paper-Schatten */}
                  <div className="absolute -inset-1 bg-black/10 rounded-md blur-md" />
                  <div className="relative bg-white rounded-md overflow-hidden shadow-xl ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt="Beleg-Vorschau"
                      className="block max-h-[58vh] lg:max-h-[480px] w-auto h-auto object-contain"
                    />
                    {state === "scanning" && <div className="mm-scan-line" />}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={state === "scanning"}
                  className="group flex flex-col items-center justify-center text-center w-full max-w-sm py-12 px-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/40 transition disabled:opacity-60"
                >
                  <span className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-50 to-accent-soft grid place-content-center mb-4 ring-1 ring-brand-100 group-hover:scale-105 transition">
                    <FilePlus2 className="h-9 w-9 text-brand-600" />
                  </span>
                  <p className="text-base font-bold text-foreground">Teste mich — Beleg auswählen oder hochladen</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                    Klick hier für eigenen Beleg — oder wähle unten einen unserer 11 Test-Belege.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <Upload className="h-3.5 w-3.5" /> Bild oder PDF
                  </span>
                </button>
              )}
              {state === "scanning" && (
                <div className="absolute top-3 right-3 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2 ring-1 ring-slate-200">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  <span className="text-xs font-medium">Claude analysiert…</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain className="h-3.5 w-3.5" /> Claude-Denkprozess
              </p>
              <div className="space-y-2">
                {STEPS.map((s, i) => {
                  const done = activeStep > i;
                  const active = activeStep === i && state === "scanning";
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        active ? "bg-brand-50 border border-brand-200" : done ? "" : "opacity-40"
                      }`}
                    >
                      <span
                        className={`h-8 w-8 rounded-full grid place-content-center shrink-0 ${
                          done
                            ? "bg-accent text-white"
                            : active
                              ? "bg-brand-600 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <s.Icon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{s.label}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{s.detail}</p>
                      </div>
                      {done && (
                        <span className="text-[10px] font-semibold text-accent uppercase">fertig</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent transition-all duration-500"
                  style={{
                    width:
                      state === "idle"
                        ? "0%"
                        : `${Math.min(100, ((activeStep + 1) / STEPS.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="card p-5 min-h-[220px]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ReceiptIcon className="h-3.5 w-3.5" /> Ergebnis
              </p>
              {state === "idle" && !result && (
                <div className="grid place-content-center text-center text-slate-400 py-6">
                  <p className="text-sm">Wähle einen Beleg unten oder lade deinen eigenen hoch.</p>
                </div>
              )}
              {state === "scanning" && !result && (
                <div className="grid place-content-center text-center py-6">
                  <Loader2 className="h-7 w-7 mx-auto mb-2 animate-spin text-brand-600" />
                  <p className="text-xs text-slate-500">
                    Schritt {Math.min(activeStep + 1, STEPS.length)} von {STEPS.length}…
                  </p>
                </div>
              )}
              {state === "error" && errMsg && (
                <div className="grid place-content-center text-center py-6">
                  <AlertTriangle className="h-7 w-7 mx-auto mb-2 text-warn" />
                  <p className="text-sm text-slate-700">{errMsg}</p>
                </div>
              )}
              {result && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="pill bg-brand-50 text-brand-700 border border-blue-200 text-[10px]">
                        {result.receiptType}
                      </span>
                      <span className="pill bg-accent-soft text-accent border border-emerald-200 text-[10px]">
                        Claude Sonnet 4
                      </span>
                    </div>
                    <span className={`pill border text-[10px] ${confColor}`}>
                      {result.confidence} · {Math.round(result.rawConfidence * 100)} %
                    </span>
                  </div>
                  <Row label="Lieferant" value={result.vendor} />
                  <Row label="Datum" value={result.date} />
                  <Row label="Brutto" value={result.gross} bold />
                  <div className="grid grid-cols-2 gap-2">
                    <Row label="Netto" value={result.net} />
                    <Row label="USt" value={`${result.vat} (${result.vatRate})`} />
                  </div>
                  <Row label="Kategorie" value={result.category} />

                  <div className="pt-2 mt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Scale className="h-3 w-3" /> Rechts-Check (AT)
                    </p>
                    <ul className="space-y-1">
                      {result.legalNotes.map((n, i) => (
                        <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                          <span className="text-accent mt-0.5">✓</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              disabled={state === "scanning"}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-foreground disabled:opacity-60"
            >
              <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-content-center">
                <ImageIcon className="h-4 w-4" />
              </span>
              <span>
                Test-Belege{" "}
                <span className="text-xs font-normal text-slate-500">({SAMPLE_RECEIPTS.length} echte Belege zum Antippen)</span>
              </span>
              <ChevronDown className={`h-4 w-4 transition ${pickerOpen ? "rotate-180" : ""}`} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={onFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={state === "scanning"}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" /> Eigenen Beleg hochladen
            </button>
          </div>
          {pickerOpen ? (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2.5">
                {SAMPLE_RECEIPTS.map((s, idx) => {
                  const isActive = previewSrc === s.src;
                  const tilt = (idx % 3) - 1;
                  return (
                    <button
                      key={s.src}
                      onClick={() => runSample(s.src)}
                      disabled={state === "scanning"}
                      className={`aspect-[3/4] rounded-md overflow-hidden bg-white transition-all relative group disabled:opacity-60 ${
                        isActive
                          ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-white shadow-lg scale-[1.04] z-10"
                          : "ring-1 ring-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-brand-300"
                      }`}
                      style={{ transform: isActive ? "rotate(0deg)" : `rotate(${tilt * 0.8}deg)` }}
                      aria-label={`${s.label} analysieren`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                      <span className={`absolute inset-0 transition ${isActive ? "bg-brand-600/0" : "bg-black/0 group-hover:bg-black/5"}`} />
                      <span className="absolute bottom-1 left-1 text-[8.5px] font-bold text-white bg-black/55 px-1.5 py-0.5 rounded backdrop-blur-sm tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                ⓘ Diese Belege werden tatsächlich verschlüsselt an Claude (Anthropic) gesendet — keine
                Speicherung in dieser Vorschau. Im Produkt: Supabase EU-Hosting, RLS-geschützt.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        @keyframes mmScan {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(calc(100% - 4px)) }
        }
        .mm-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 3px;
          background: linear-gradient(to right, transparent, rgb(37 99 235 / 0.9), transparent);
          box-shadow: 0 0 18px 3px rgb(37 99 235 / 0.6);
          animation: mmScan 2.4s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-right ${bold ? "font-bold text-sm" : "font-medium"}`}>{value}</span>
    </div>
  );
}
