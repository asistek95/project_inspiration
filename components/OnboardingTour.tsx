"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const TOUR_KEY = "klarblick.tourDone";

const STEPS = [
  {
    title: "Willkommen bei Klarblick",
    desc: "Dein Monatsabschluss-Assistent für österreichische KMU. In 2 Minuten erklären wir dir wie es funktioniert.",
    icon: "👋",
    action: null,
  },
  {
    title: "1. Sammelstelle — Belege rein",
    desc: "Alle Belege an einem Ort. Lade PDFs oder Fotos hoch, leite E-Mails weiter oder schick Bilder per WhatsApp. Der OCR-Schlitz erkennt alles automatisch.",
    icon: "📥",
    action: { label: "Zur Sammelstelle", href: "/upload" },
  },
  {
    title: "2. OCR erkennt Eingang & Ausgang",
    desc: "Claude AI liest Lieferant, Datum, Betrag und MwSt — und entscheidet via deiner ATU-Nummer ob es eine Eingangs- oder Ausgangsrechnung ist. Reverse Charge §19 wird erkannt.",
    icon: "🔍",
    action: null,
  },
  {
    title: "3. Dashboard — dein Überblick",
    desc: "Jahr → Quartal → Monat. KPI-Kacheln zeigen dir Eingang, Ausgang, Vorsteuer und USt-Schuld auf einen Blick.",
    icon: "📊",
    action: { label: "Zum Dashboard", href: "/dashboard" },
  },
  {
    title: "4. UVA — fertig bis zum 15.",
    desc: "Alle KZ für das österreichische Formular U30 (KZ 010–096) werden automatisch aus deinen geprüften Belegen berechnet. Export als CSV für den Steuerberater.",
    icon: "🧮",
    action: { label: "Zur UVA", href: "/uva" },
  },
  {
    title: "5. Steuerberater-Übergabe",
    desc: "PDF-Report, DATEV-CSV (SKR04), SEPA-Sammelüberweisung — alles per Klick. Der Steuerberater bekommt einen eigenen Leserechte-Zugang.",
    icon: "📤",
    action: { label: "Zur Übergabe", href: "/tax-advisor" },
  },
  {
    title: "Wichtig: ATU-Nummer eintragen",
    desc: "Ohne deine ATU-Nummer kann Klarblick nicht automatisch erkennen ob eine Rechnung von dir ausgestellt wurde. Bitte jetzt in den Einstellungen eintragen.",
    icon: "⚠️",
    action: { label: "Zu den Einstellungen", href: "/settings" },
  },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem(TOUR_KEY, "1");
    setShow(false);
  }

  function reset() {
    localStorage.removeItem(TOUR_KEY);
    setStep(0);
    setShow(true);
  }

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? "bg-brand-600" : i === step ? "bg-brand-400" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="text-5xl">{current.icon}</div>
          <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{current.desc}</p>
          <p className="text-xs text-slate-400">{step + 1} / {STEPS.length}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Überspringen
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary !py-2 !px-3">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {current.action && (
              <Link href={current.action.href} className="btn-secondary !py-2 !px-3 text-sm">
                {current.action.label}
              </Link>
            )}
            {isLast ? (
              <button onClick={finish} className="btn-primary !py-2">
                <CheckCircle2 className="h-4 w-4" /> Los geht&apos;s
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary !py-2">
                Weiter <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Kleiner "Tour neu starten" Link für Einstellungen
export function RestartTourButton() {
  function restart() {
    localStorage.removeItem(TOUR_KEY);
    window.location.reload();
  }
  return (
    <button onClick={restart} className="text-xs text-brand-600 hover:underline">
      Onboarding-Tour neu starten
    </button>
  );
}
