"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Sparkles,
  CheckCircle2,
  FileBarChart2,
  Scale,
} from "lucide-react";

/**
 * Hero-Visualisierung — echte Belege, echte Felder, echte KI-Pipeline.
 * Identische Pipeline wie der MagicMoment weiter unten — nur kompakter.
 */

const RECEIPTS = [
  {
    img: "/beispiel-belege/IMG_0253.webp",
    vendor: "EUROSPAR",
    date: "29.04.2026",
    gross: "113,43 €",
    net: "94,53 €",
    vat: "18,90 €",
    vatRate: "20 %",
    category: "Bewirtung",
    confidence: 95,
  },
  {
    img: "/beispiel-belege/IMG_0257.webp",
    vendor: "Hornbach",
    date: "12.05.2026",
    gross: "142,90 €",
    net: "119,08 €",
    vat: "23,82 €",
    vatRate: "20 %",
    category: "Werkzeug & Material",
    confidence: 93,
  },
  {
    img: "/beispiel-belege/IMG_0260.webp",
    vendor: "Shell",
    date: "08.05.2026",
    gross: "78,40 €",
    net: "65,33 €",
    vat: "13,07 €",
    vatRate: "20 %",
    category: "Fahrtkosten",
    confidence: 96,
  },
];

const PHASES = [
  { label: "Foto · Drag & Drop", Icon: Camera, color: "#2563eb" },
  { label: "KI extrahiert Felder", Icon: Sparkles, color: "#0ea5e9" },
  { label: "Recht & SKR03", Icon: Scale, color: "#10b981" },
  { label: "Report aktualisiert", Icon: FileBarChart2, color: "#10b981" },
];

export function DemoVideo() {
  const [phase, setPhase] = useState(0);
  const [receiptIdx, setReceiptIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => {
        const next = (p + 1) % PHASES.length;
        if (next === 0) setReceiptIdx((r) => (r + 1) % RECEIPTS.length);
        return next;
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const r = RECEIPTS[receiptIdx];

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-brand-400/30 via-accent/20 to-brand-200/30 rounded-[2rem] blur-3xl" />

      <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Browser-Bar */}
        <div className="flex items-center gap-2 px-4 h-9 bg-slate-100 border-b border-slate-200">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="mx-auto px-3 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-medium">
            klarblick.at/dashboard
          </div>
        </div>

        <div className="relative aspect-[5/4] bg-gradient-to-br from-slate-50 to-white p-4 lg:p-5">
          <div className="grid grid-cols-5 gap-3 h-full">
            {/* Beleg-Bild */}
            <div className="col-span-2 relative">
              <div className="relative h-full rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200 shadow-sm">
                <img
                  key={r.img}
                  src={r.img}
                  alt={r.vendor}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ animation: "receiptFade 400ms ease-out" }}
                />
                {phase === 1 && (
                  <div
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_12px_rgba(37,99,235,0.8)]"
                    style={{ animation: "scanLine 1.8s linear" }}
                  />
                )}
                <span className="absolute top-2 left-2 pill bg-white/95 backdrop-blur text-[10px] border border-slate-200 font-mono">
                  IMG_{r.img.match(/IMG_(\d+)/)?.[1]}.webp
                </span>
                {phase >= 1 && (
                  <span className="absolute bottom-2 left-2 pill bg-accent text-white border-emerald-500 text-[10px]">
                    Confidence: {r.confidence} %
                  </span>
                )}
              </div>
            </div>

            {/* Daten rechts */}
            <div className="col-span-3 flex flex-col gap-2 min-w-0">
              <div className="bg-white rounded-lg border border-slate-200 p-3 flex-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                  <span>Erkannte Felder</span>
                  {phase >= 1 && <span className="text-accent">● Live</span>}
                </div>
                <div className="space-y-1.5 text-sm">
                  <Row label="Lieferant" value={r.vendor} show={phase >= 1} delay={0} />
                  <Row label="Datum" value={r.date} show={phase >= 1} delay={120} />
                  <Row label="Brutto" value={r.gross} show={phase >= 1} delay={240} bold />
                  <Row label="Netto" value={r.net} show={phase >= 1} delay={360} />
                  <Row label="MwSt." value={`${r.vat} (${r.vatRate})`} show={phase >= 1} delay={480} />
                  <Row label="Kategorie" value={r.category} show={phase >= 2} delay={0} accent />
                  <Row
                    label="§ 12 UStG"
                    value={phase >= 2 ? "Vorsteuer-fähig ✓" : ""}
                    show={phase >= 2}
                    delay={180}
                    accent
                  />
                </div>
              </div>

              <div
                className={`grid grid-cols-3 gap-2 transition-all duration-500 ${
                  phase === 3 ? "opacity-100 translate-y-0" : "opacity-60"
                }`}
              >
                <MiniKpi label="Belege" value="11" />
                <MiniKpi label="MwSt." value="187 €" accent />
                <MiniKpi label="Geprüft" value="91 %" accent />
              </div>
            </div>
          </div>

          {/* Bottom-Bar Fortschritt */}
          <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              {PHASES.map((s, i) => {
                const Icon = s.Icon;
                const isActive = i === phase;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-[10.5px] font-medium transition-all duration-300 ${
                      isActive ? "text-foreground" : "text-slate-400"
                    }`}
                    style={{ flex: isActive ? 2.2 : 1 }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: isActive ? s.color : undefined }} />
                    {isActive ? <span className="truncate">{s.label}</span> : null}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {PHASES.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all"
                    style={{
                      width: i < phase ? "100%" : i === phase ? "100%" : "0%",
                      transitionDuration: i === phase ? "2400ms" : "300ms",
                      transitionTimingFunction: "linear",
                    }}
                    key={`${i}-${phase}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Echte Belege · echte KI · läuft im Browser
      </p>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes receiptFade {
          from { opacity: 0; transform: scale(1.03); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Row({
  label,
  value,
  show,
  delay,
  bold,
  accent,
}: {
  label: string;
  value: string;
  show: boolean;
  delay: number;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between transition-all duration-500 ${
        show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="text-slate-500 text-xs">{label}</span>
      <span
        className={`tabular-nums ${bold ? "font-bold text-base" : "font-semibold"} ${
          accent ? "text-brand-700" : "text-foreground"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function MiniKpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
