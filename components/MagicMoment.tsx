"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, Sparkles, Receipt, FileText, Scale, Calculator, Brain } from "lucide-react";

type Result = {
  vendor: string;
  date: string;
  gross: string;
  net: string;
  vat: string;
  vatRate: string;
  category: string;
  legalNotes: string[];
  confidence: "Hoch" | "Mittel";
};

type Step = { label: string; detail: string; Icon: typeof Brain };

const STEPS: Step[] = [
  { label: "Bild analysieren", detail: "OCR · Text aus Beleg extrahieren", Icon: FileText },
  { label: "Lieferant erkennen", detail: "Abgleich mit AT/DE-Firmenregister", Icon: Sparkles },
  { label: "Beträge prüfen", detail: "Brutto · Netto · USt-Berechnung", Icon: Calculator },
  { label: "Recht abgleichen", detail: "§ 11 UStG · § 12 EStG · SKR03", Icon: Scale },
  { label: "Kategorisieren", detail: "Wareneinkauf · Fahrt · Material", Icon: Brain },
];

const DEMO_RESULTS: Result[] = [
  {
    vendor: "Hornbach Baumarkt GmbH",
    date: "12.05.2026",
    gross: "142,90 €",
    net: "119,08 €",
    vat: "23,82 €",
    vatRate: "20 %",
    category: "Wareneinkauf (SKR03 3400)",
    legalNotes: [
      "§ 11 UStG: Rechnungspflichtangaben vollständig",
      "§ 12 EStG: Voll betrieblich absetzbar",
      "Vorsteuerabzug zulässig",
    ],
    confidence: "Hoch",
  },
  {
    vendor: "Shell Tankstelle Wien-Mitte",
    date: "11.05.2026",
    gross: "78,40 €",
    net: "65,33 €",
    vat: "13,07 €",
    vatRate: "20 %",
    category: "Fahrtkosten (SKR03 4530)",
    legalNotes: [
      "§ 26 EStG: Fahrtkosten betrieblich",
      "Kilometergeld alternativ: 0,42 €/km",
      "Treibstoff voll absetzbar bei betrieblichem Kfz",
    ],
    confidence: "Hoch",
  },
  {
    vendor: "Metro Cash & Carry Österreich",
    date: "08.05.2026",
    gross: "891,20 €",
    net: "742,67 €",
    vat: "148,53 €",
    vatRate: "20 %",
    category: "Material (SKR03 3000)",
    legalNotes: [
      "§ 11 UStG: UID-Nummer vorhanden",
      "Großhandel: Vorsteuerabzug zulässig",
      "Achtung: Skonto 3 % möglich (Zahlung binnen 10 Tagen)",
    ],
    confidence: "Mittel",
  },
];

export function MagicMoment() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runDemo = (fileName?: string) => {
    if (state === "scanning") return;
    setState("scanning");
    setResult(null);
    setActiveStep(0);
    setUploadedName(fileName || null);

    const stepDuration = 650;
    STEPS.forEach((_, i) => {
      setTimeout(() => setActiveStep(i), i * stepDuration);
    });

    setTimeout(() => {
      const pick = DEMO_RESULTS[Math.floor(Math.random() * DEMO_RESULTS.length)];
      setResult(pick);
      setState("done");
      setActiveStep(STEPS.length);
    }, STEPS.length * stepDuration + 400);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    runDemo(f.name);
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-brand-50 via-white to-accent-soft border-y border-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Live ausprobieren</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Beleg hochladen — KI denkt mit.
          </h2>
          <p className="mt-3 text-slate-600">
            Eigener Beleg oder Demo. Du siehst Schritt für Schritt, was die KI prüft — inkl. Verweis auf österr. Steuerrecht.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LINKS: Upload */}
          <div className="card p-6">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={state === "scanning"}
              className="w-full h-44 rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/40 hover:bg-brand-50 transition grid place-content-center text-center px-4 disabled:opacity-60"
            >
              <Upload className="h-8 w-8 text-brand-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Eigenen Beleg hochladen</p>
              <p className="text-[11px] text-slate-500 mt-1">JPG · PNG · PDF · max. 10 MB</p>
            </button>

            <div className="flex items-center gap-2 my-4 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />oder<div className="flex-1 h-px bg-slate-200" />
            </div>

            <button onClick={() => runDemo()} disabled={state === "scanning"} className="btn-secondary w-full">
              <Sparkles className="h-4 w-4" /> Demo-Beleg verwenden
            </button>

            {uploadedName && <p className="text-[11px] text-slate-500 mt-3 truncate">📎 {uploadedName}</p>}
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              ⓘ In dieser Demo läuft die Analyse simuliert — kein Upload, keine Speicherung. Im echten Produkt wird verschlüsselt an Claude (Anthropic, EU) gesendet.
            </p>
          </div>

          {/* MITTE: Thinking Steps */}
          <div className="card p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" /> KI-Denkprozess
            </p>
            <div className="space-y-2.5">
              {STEPS.map((s, i) => {
                const done = activeStep > i;
                const active = activeStep === i;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                      active ? "bg-brand-50 border border-brand-200" : done ? "opacity-80" : "opacity-40"
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-full grid place-content-center shrink-0 ${
                        done ? "bg-accent text-white" : active ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <s.Icon className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{s.label}</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{s.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECHTS: Ergebnis */}
          <div className="card p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" /> Ergebnis
            </p>
            {!result && state !== "scanning" && (
              <div className="h-44 grid place-content-center text-center text-slate-400">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Lade einen Beleg hoch…</p>
              </div>
            )}
            {state === "scanning" && !result && (
              <div className="h-44 grid place-content-center text-center text-slate-500">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-brand-600" />
                <p className="text-xs">KI prüft Schritt {Math.min(activeStep + 1, STEPS.length)} von {STEPS.length}…</p>
              </div>
            )}
            {result && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="pill bg-accent-soft text-accent border border-emerald-200 text-[10px]">KI-Auswertung</span>
                  <span className={`pill border text-[10px] ${result.confidence === "Hoch" ? "bg-accent-soft text-accent border-emerald-200" : "bg-warn-soft text-warn border-amber-200"}`}>
                    {result.confidence}
                  </span>
                </div>
                <Row label="Lieferant" value={result.vendor} />
                <Row label="Datum" value={result.date} />
                <Row label="Brutto" value={result.gross} bold />
                <Row label="Netto" value={result.net} />
                <Row label="USt." value={`${result.vat} (${result.vatRate})`} />
                <Row label="Kategorie" value={result.category} />

                <div className="pt-2 mt-3 border-t border-border">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Scale className="h-3 w-3" /> Rechts-Check (AT)
                  </p>
                  <ul className="space-y-1">
                    {result.legalNotes.map((n, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-accent mt-0.5">•</span>
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
