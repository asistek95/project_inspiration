"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, Camera, FileBarChart2, Sparkles, ArrowRight } from "lucide-react";

const KEY = "klarblick.onboarding.done.v1";

const STEPS = [
  {
    Icon: Sparkles,
    title: "Willkommen bei Klarblick",
    text: "In 60 Sekunden zeigen wir dir, wie aus deinem Schuhkarton ein DATEV-fertiger Monatsreport wird.",
    cta: "Los geht's",
  },
  {
    Icon: Camera,
    title: "Beleg fotografieren oder hochladen",
    text: "Foto vom Materialschein, Tankquittung oder PDF-Rechnung — Klarblick erkennt automatisch Lieferant, Datum, Beträge und MwSt zu 99 %.",
    cta: "Weiter",
  },
  {
    Icon: FileBarChart2,
    title: "Report &amp; Export",
    text: "Du bekommst sofort einen Management-Report, kannst Skonto-Verluste sehen und mit einem Klick eine DATEV-CSV exportieren.",
    cta: "Demo öffnen",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm grid place-content-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/klar.png" alt="Klarblick" className="h-7 w-7 object-contain" />
            <span className="font-bold">Erste Schritte</span>
          </div>
          <button onClick={close} aria-label="Schließen" className="p-1 hover:bg-slate-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-700 grid place-content-center mb-5">
            <s.Icon className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{s.title}</h2>
          <p className="mt-2 text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.text }} />

          {/* Steps */}
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-brand-600" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={close} className="text-sm text-slate-500 hover:text-slate-700">
              Überspringen
            </button>
            {last ? (
              <Link
                href="/dashboard"
                onClick={close}
                className="btn-primary"
              >
                {s.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                {s.cta} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-border text-xs text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          14 Tage gratis · keine Zahlungsdaten nötig
        </div>
      </div>
    </div>
  );
}
