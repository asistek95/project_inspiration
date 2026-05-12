"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Sparkles,
  CheckCircle2,
  FileBarChart2,
  Send,
  TrendingUp,
  Loader2,
} from "lucide-react";

/**
 * DemoVideo — auto-loopendes, animiertes Mini-„Video" der App.
 * Reine CSS-Animation, keine externen Dependencies.
 * 4 Schritte à 3 s = 12 s Loop.
 */
const STEPS = [
  { label: "1 · Beleg fotografieren", Icon: Camera, color: "#2563eb" },
  { label: "2 · KI liest Daten", Icon: Sparkles, color: "#0ea5e9" },
  { label: "3 · Du prüfst — 1 Klick", Icon: CheckCircle2, color: "#10b981" },
  { label: "4 · Report fertig", Icon: FileBarChart2, color: "#10b981" },
];

export function DemoVideo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-br from-brand-400/30 via-accent/20 to-brand-200/30 rounded-[2rem] blur-3xl" />

      {/* Browser-Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-slate-900/10">
        {/* Browser-Bar */}
        <div className="flex items-center gap-2 px-4 h-9 bg-slate-800 border-b border-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="mx-auto px-3 py-0.5 rounded-md bg-slate-700/80 text-[10px] text-slate-300 font-medium">
            klarblick.app/upload
          </div>
        </div>

        {/* Bühne */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-white overflow-hidden">
          {/* Step-Inhalte */}
          <Step1 active={step === 0} />
          <Step2 active={step === 1} />
          <Step3 active={step === 2} />
          <Step4 active={step === 3} />

          {/* Bottom-Bar mit Fortschritt */}
          <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              {STEPS.map((s, i) => {
                const Icon = s.Icon;
                const isActive = i === step;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-[11px] font-medium transition-all duration-300 ${
                      isActive ? "text-foreground" : "text-slate-400"
                    }`}
                    style={{ flex: isActive ? 2 : 1 }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: isActive ? s.color : undefined }} />
                    {isActive ? <span className="truncate">{s.label}</span> : null}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all"
                    style={{
                      width: i < step ? "100%" : i === step ? "100%" : "0%",
                      transitionDuration: i === step ? "3000ms" : "300ms",
                      transitionTimingFunction: "linear",
                    }}
                    key={`${i}-${step}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Live-Demo · läuft direkt im Browser · kein Setup
      </p>
    </div>
  );
}

/* ───────────────────────────── Steps ───────────────────────────── */

function StageWrap({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-0 px-6 pt-6 pb-20 transition-all duration-700 ${
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}

function Step1({ active }: { active: boolean }) {
  return (
    <StageWrap active={active}>
      <div className="h-full grid place-content-center">
        <div className="text-center">
          <div className="relative mx-auto w-44 h-56">
            {/* Drei Belege fliegen rein */}
            <Bon delay={0} rot={-8} top={0} left={0}>HORNBACH · 142,90</Bon>
            <Bon delay={300} rot={4} top={20} left={40}>SHELL · 78,40</Bon>
            <Bon delay={600} rot={-3} top={50} left={20}>METRO · 891,20</Bon>
          </div>
          <p className="mt-4 text-sm text-slate-600">Foto · PDF · Drag & Drop</p>
        </div>
      </div>
    </StageWrap>
  );
}

function Bon({
  delay,
  rot,
  top,
  left,
  children,
}: {
  delay: number;
  rot: number;
  top: number;
  left: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute w-32 h-40 bg-[#fdfaf2] shadow-lg rounded-sm font-mono text-[9px] text-slate-700 p-2 ring-1 ring-slate-200"
      style={{
        top,
        left,
        transform: `rotate(${rot}deg)`,
        animation: `bonIn 700ms ${delay}ms cubic-bezier(.2,.9,.3,1.2) both`,
      }}
    >
      <div className="text-center font-bold text-[10px] tracking-wider border-b border-dashed border-slate-300 pb-1">
        {children}
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1 bg-slate-200 rounded w-full" />
        <div className="h-1 bg-slate-200 rounded w-4/5" />
        <div className="h-1 bg-slate-200 rounded w-3/5" />
        <div className="h-1 bg-slate-200 rounded w-4/5" />
        <div className="h-1 bg-slate-300 rounded w-full mt-2" />
      </div>
      <style jsx>{`
        @keyframes bonIn {
          from {
            opacity: 0;
            transform: translateY(-40px) rotate(${rot - 20}deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotate(${rot}deg);
          }
        }
      `}</style>
    </div>
  );
}

function Step2({ active }: { active: boolean }) {
  return (
    <StageWrap active={active}>
      <div className="h-full grid grid-cols-2 gap-4 items-center">
        {/* Beleg links */}
        <div className="relative">
          <div className="bg-[#fdfaf2] shadow-xl rounded-sm p-3 font-mono text-[10px] mx-auto w-40 ring-1 ring-slate-200">
            <p className="text-center font-bold tracking-wider">HORNBACH</p>
            <p className="text-center text-[8px] text-slate-500">12.05.2026</p>
            <div className="mt-2 border-t border-dashed border-slate-300 pt-1 space-y-0.5">
              <div className="flex justify-between"><span>Schrauben</span><span>14,90</span></div>
              <div className="flex justify-between"><span>Bohrer-Set</span><span>49,00</span></div>
              <div className="flex justify-between"><span>Material</span><span>79,00</span></div>
              <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 mt-1 font-bold">
                <span>SUMME</span><span>142,90 €</span>
              </div>
            </div>
          </div>
          {/* Scan-Linie */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-full pointer-events-none overflow-hidden">
            <div
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-brand-400/40 to-transparent"
              style={{ animation: "scan 2.5s linear infinite" }}
            />
          </div>
          <style jsx>{`
            @keyframes scan {
              0% { top: -20%; }
              100% { top: 110%; }
            }
          `}</style>
        </div>

        {/* Erkennung rechts */}
        <div className="space-y-1.5">
          <ExtractRow label="Lieferant" value="Hornbach" delay={200} />
          <ExtractRow label="Datum" value="12.05.2026" delay={500} />
          <ExtractRow label="Kategorie" value="Werkzeug & Material" delay={800} />
          <ExtractRow label="Netto" value="120,08 €" delay={1100} />
          <ExtractRow label="MwSt. 19 %" value="22,82 €" delay={1400} />
          <ExtractRow label="Brutto" value="142,90 €" delay={1700} bold />
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
            style={{ animation: "fadeIn 400ms 2000ms both" }}
          >
            <Sparkles className="h-3 w-3" /> Confidence 97 %
          </div>
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </StageWrap>
  );
}

function ExtractRow({
  label,
  value,
  delay,
  bold = false,
}: {
  label: string;
  value: string;
  delay: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm ${
        bold ? "font-bold text-foreground" : "text-slate-700"
      }`}
      style={{ animation: `slideIn 400ms ${delay}ms cubic-bezier(.2,.9,.3,1.2) both` }}
    >
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums">{value}</span>
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function Step3({ active }: { active: boolean }) {
  return (
    <StageWrap active={active}>
      <div className="h-full grid place-content-center">
        <div className="max-w-xs mx-auto card-soft p-5 bg-white">
          <p className="text-xs text-slate-500">Beleg #142</p>
          <p className="font-bold mt-0.5">Hornbach · 142,90 €</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
              97 % Sicher
            </span>
            <span className="pill bg-slate-100 text-slate-700 text-[10px]">Werkzeug</span>
          </div>
          <button
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-semibold py-2.5 text-sm shadow-md hover:bg-emerald-700"
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          >
            <CheckCircle2 className="h-4 w-4" /> Stimmt alles
          </button>
          <p className="mt-2 text-[10px] text-center text-slate-500">
            … oder Daten anpassen
          </p>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
            50% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
          }
        `}</style>
      </div>
    </StageWrap>
  );
}

function Step4({ active }: { active: boolean }) {
  return (
    <StageWrap active={active}>
      <div className="h-full grid place-content-center">
        <div className="mx-auto w-56 card-soft p-4 bg-white" style={{ animation: "rise 500ms both" }}>
          <p className="text-[10px] text-slate-500">Mai 2026 · Musterbau GmbH</p>
          <p className="font-bold text-sm">Management-Report</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Kpi label="Ausgaben" value="12.480 €" />
            <Kpi label="MwSt." value="1.996 €" />
          </div>
          <div className="mt-2 space-y-1">
            <Bar label="Wareneinkauf" pct={86} delay={200} />
            <Bar label="Material" pct={62} delay={400} />
            <Bar label="Fahrtkosten" pct={48} delay={600} color="#f59e0b" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] bg-amber-50 text-amber-700 rounded-md px-2 py-1 border border-amber-200">
            <TrendingUp className="h-3 w-3" /> Fahrtkosten +38 % zum Vormonat
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 border border-emerald-200">
            <Send className="h-3 w-3" /> Steuerberater-Paket bereit
          </div>
        </div>
        <style jsx>{`
          @keyframes rise {
            from { opacity: 0; transform: translateY(20px) scale(.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </StageWrap>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5">
      <p className="text-[9px] text-slate-500">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Bar({ label, pct, delay, color = "#2563eb" }: { label: string; pct: number; delay: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] text-slate-500">
        <span>{label}</span>
        <span>{pct} %</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            animation: `grow 700ms ${delay}ms cubic-bezier(.2,.9,.3,1) both`,
            transformOrigin: "left",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes grow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
