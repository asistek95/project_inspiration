"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, Sparkles, Receipt } from "lucide-react";

type Result = {
  vendor: string;
  date: string;
  gross: string;
  vat: string;
  category: string;
  confidence: "Hoch" | "Mittel";
};

const DEMO_RESULTS: Result[] = [
  { vendor: "Hornbach Baumarkt", date: "12.05.2026", gross: "142,90 €", vat: "23,82 € (20 %)", category: "Wareneinkauf", confidence: "Hoch" },
  { vendor: "Shell Tankstelle Wien", date: "11.05.2026", gross: "78,40 €", vat: "13,07 € (20 %)", category: "Fahrtkosten", confidence: "Hoch" },
  { vendor: "Metro Großhandel", date: "08.05.2026", gross: "891,20 €", vat: "148,53 € (20 %)", category: "Material", confidence: "Mittel" },
];

export function MagicMoment() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);

  const run = () => {
    if (state === "scanning") return;
    setState("scanning");
    setResult(null);
    setTimeout(() => {
      setResult(DEMO_RESULTS[Math.floor(Math.random() * DEMO_RESULTS.length)]);
      setState("done");
    }, 2200);
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-brand-50 via-white to-accent-soft border-y border-border">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Live ausprobieren</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Klick & sieh in 3 Sekunden, was Klarblick kann.
          </h2>
          <p className="mt-3 text-slate-600">
            Demo-Beleg auswerten — ohne Anmeldung, ohne E-Mail.
          </p>
        </div>

        <div className="card p-6 lg:p-8 grid md:grid-cols-2 gap-6 items-center">
          {/* Left: Demo upload */}
          <div>
            <button
              onClick={run}
              disabled={state === "scanning"}
              className={`relative w-full h-56 rounded-xl border-2 border-dashed transition-all grid place-content-center text-center px-6 ${
                state === "scanning"
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-300 bg-slate-50 hover:border-brand-600 hover:bg-brand-50"
              }`}
            >
              {state === "idle" && (
                <>
                  <Upload className="h-10 w-10 text-brand-600 mx-auto mb-3" />
                  <p className="font-semibold">Demo-Beleg auswerten</p>
                  <p className="text-xs text-slate-500 mt-1">Klick → KI scannt einen Musterbeleg</p>
                </>
              )}
              {state === "scanning" && (
                <>
                  <Loader2 className="h-10 w-10 text-brand-600 mx-auto mb-3 animate-spin" />
                  <p className="font-semibold">KI analysiert…</p>
                  <p className="text-xs text-slate-500 mt-1">OCR · Kategorisierung · USt-Erkennung</p>
                </>
              )}
              {state === "done" && (
                <>
                  <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
                  <p className="font-semibold">Fertig! Ergebnis rechts →</p>
                  <p className="text-xs text-slate-500 mt-1">Klick nochmal für neuen Beleg</p>
                </>
              )}
            </button>
          </div>

          {/* Right: Result */}
          <div className="min-h-[14rem]">
            {!result && (
              <div className="h-full grid place-content-center text-center text-slate-400">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ergebnis erscheint hier…</p>
              </div>
            )}
            {result && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between">
                  <span className="pill bg-accent-soft text-accent border border-emerald-200">
                    <Sparkles className="h-3 w-3" /> KI-Ergebnis
                  </span>
                  <span
                    className={`pill border ${
                      result.confidence === "Hoch"
                        ? "bg-accent-soft text-accent border-emerald-200"
                        : "bg-warn-soft text-warn border-amber-200"
                    }`}
                  >
                    Confidence: {result.confidence}
                  </span>
                </div>
                <Row label="Lieferant" value={result.vendor} />
                <Row label="Datum" value={result.date} />
                <Row label="Brutto" value={result.gross} bold />
                <Row label="USt." value={result.vat} />
                <Row label="Kategorie" value={result.category} />
                <p className="text-[11px] text-slate-500 pt-2 border-t border-border">
                  ⓘ Bei „Mittel" empfehlen wir kurze manuelle Prüfung. Kein Ersatz für Steuerberatung.
                </p>
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
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-lg" : "font-medium"}>{value}</span>
    </div>
  );
}
