"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { loadReceipts } from "@/lib/store";
import { buildCashflow, type CashflowMonth, type CashflowSummary } from "@/lib/cashflow";
import { buildExcelWorkbook, downloadExcel } from "@/lib/excel-export";
import { DEMO_COMPANY } from "@/lib/demo-data";

const DE_MONTHS_LONG = [
  "Jänner", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function CashflowPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [all, setAll] = useState<any[]>([]);

  useEffect(() => { setAll(loadReceipts()); }, []);

  const cf = useMemo(() => buildCashflow(all, year), [all, year]);

  const currentMonth = new Date().getMonth(); // 0-indexed

  function exportExcel() {
    const blob = buildExcelWorkbook(all, `Cashflow ${year}`, DEMO_COMPANY.company_name);
    downloadExcel(`klarblick_cashflow_${year}.xlsx`, blob);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Liquidität & Planung</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Cashflow</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operativer Cashflow · Steuerrückstellungen · 90-Tage-Prognose
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="btn-secondary">
            <ChevronLeft className="h-4 w-4" /> {year - 1}
          </button>
          <span className="font-bold w-12 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="btn-secondary"
          >
            {year + 1} <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={exportExcel} className="btn-secondary hidden sm:flex">
            Excel Export
          </button>
        </div>
      </div>

      {/* Kontostand-Box (Steuer-Cashflow) */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">Liquiditäts-Übersicht</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-800">{formatEUR(cf.freierCashflow)}</span>
              <span className="text-sm text-brand-600">freier Cashflow</span>
            </div>
          </div>
          <div className="text-xs text-brand-700 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Freier Cashflow = Umsatz − Kosten + offene Forderungen − Verbindlichkeiten − Steuerrückstellungen
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SteuerBox label="Umsatzsteuer" value={cf.gesamtRueckstellungen > 0 ? cf.months[currentMonth]?.ustRueckstellung ?? 0 : 0} sub="Rückstellung" color="amber" />
          <SteuerBox label="KöSt / ESt" value={cf.months[currentMonth]?.koestRueckstellung ?? 0} sub="23% auf Gewinn" color="orange" />
          <SteuerBox label="SVS" value={cf.months[currentMonth]?.svsRueckstellung ?? 0} sub="27,5% auf Gewinn" color="red" />
          <div className="rounded-xl bg-white/70 border border-brand-100 p-3">
            <p className="text-[10px] text-brand-600 font-semibold uppercase">Gesamt-Rückstellung</p>
            <p className="text-xl font-black text-brand-800 mt-1">{formatEUR(cf.gesamtRueckstellungen)}</p>
            <p className="text-[10px] text-brand-500 mt-0.5">im Jahr {year}</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<ArrowUpRight className="h-4 w-4 text-emerald-500" />} label="Umsatz YTD" value={formatEUR(cf.ytdUmsatz)} sub={`${year}`} color="emerald" />
        <KpiCard icon={<ArrowDownLeft className="h-4 w-4 text-red-500" />} label="Kosten YTD" value={formatEUR(cf.ytdKosten)} sub={`${year}`} color="red" />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-brand-500" />} label="Offene Forderungen" value={formatEUR(cf.offeneForderungen)} sub="Kunden schulden" color="brand" />
        <KpiCard icon={<TrendingDown className="h-4 w-4 text-slate-500" />} label="Verbindlichkeiten" value={formatEUR(cf.offeneVerbindlichkeiten)} sub="Ich schulde" color="slate" />
      </div>

      {/* Prognose 30/60/90 */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">Cashflow-Prognose</h2>
          <span className="text-xs text-slate-400 ml-auto">Basiert auf Durchschnitt der letzten 3 Monate</span>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {[cf.forecast30, cf.forecast60, cf.forecast90].map((f) => (
            <div key={f.label} className="p-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">{f.label}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 text-xs">Einnahmen erwartet</span>
                  <span className="font-semibold text-emerald-700">+{formatEUR(f.expectedIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 text-xs">Ausgaben erwartet</span>
                  <span className="font-semibold text-red-600">-{formatEUR(f.expectedCosts)}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="text-xs font-bold text-slate-600">Netto-Prognose</span>
                  <span className={cn("font-black text-base", f.netForecast >= 0 ? "text-emerald-700" : "text-red-600")}>
                    {f.netForecast >= 0 ? "+" : ""}{formatEUR(f.netForecast)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monatliche Übersicht */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Euro className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">Monatliche Cashflow-Übersicht {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Monat</th>
                <th className="px-3 py-2.5 text-right font-semibold text-emerald-600">Umsatz</th>
                <th className="px-3 py-2.5 text-right font-semibold text-red-600">Kosten</th>
                <th className="px-3 py-2.5 text-right font-semibold text-brand-600">Gewinn</th>
                <th className="px-3 py-2.5 text-right font-semibold text-amber-600 hidden md:table-cell">USt-Rücks.</th>
                <th className="px-3 py-2.5 text-right font-semibold text-orange-600 hidden md:table-cell">KöSt/ESt</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-600 hidden lg:table-cell">Forderungen</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 hidden lg:table-cell">Verbindl.</th>
                <th className="px-3 py-2.5 text-right font-semibold text-brand-800">Freier CF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cf.months.map((m, idx) => {
                const isCurrentMonth = idx === currentMonth && year === new Date().getFullYear();
                const isEmpty = m.umsatz === 0 && m.kosten === 0;
                return (
                  <tr
                    key={m.month}
                    className={cn(
                      "hover:bg-slate-50 transition",
                      isCurrentMonth && "bg-brand-50",
                      isEmpty && "opacity-40"
                    )}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {DE_MONTHS_LONG[m.month - 1].slice(0, 3)}
                      {isCurrentMonth && (
                        <span className="ml-1.5 text-[10px] bg-brand-100 text-brand-700 px-1 rounded-full font-bold">jetzt</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">{isEmpty ? "—" : formatEUR(m.umsatz)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{isEmpty ? "—" : formatEUR(m.kosten)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-bold", m.gewinn >= 0 ? "text-brand-700" : "text-red-600")}>
                      {isEmpty ? "—" : (m.gewinn >= 0 ? "+" : "") + formatEUR(m.gewinn)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-amber-600 hidden md:table-cell">{isEmpty ? "—" : formatEUR(m.ustRueckstellung)}</td>
                    <td className="px-3 py-2.5 text-right text-orange-600 hidden md:table-cell">{isEmpty ? "—" : formatEUR(m.koestRueckstellung)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 hidden lg:table-cell">{isEmpty ? "—" : formatEUR(m.forderungen)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 hidden lg:table-cell">{isEmpty ? "—" : formatEUR(m.verbindlichkeiten)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-black", m.freieCashflow >= 0 ? "text-brand-800" : "text-red-600")}>
                      {isEmpty ? "—" : (m.freieCashflow >= 0 ? "+" : "") + formatEUR(m.freieCashflow)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-2.5 font-black text-slate-700">GESAMT</td>
                <td className="px-3 py-2.5 text-right font-black text-emerald-700">{formatEUR(cf.ytdUmsatz)}</td>
                <td className="px-3 py-2.5 text-right font-black text-red-600">{formatEUR(cf.ytdKosten)}</td>
                <td className={cn("px-3 py-2.5 text-right font-black", cf.ytdGewinn >= 0 ? "text-brand-800" : "text-red-600")}>
                  {cf.ytdGewinn >= 0 ? "+" : ""}{formatEUR(cf.ytdGewinn)}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-amber-600 hidden md:table-cell">
                  {formatEUR(cf.months.reduce((s, m) => s + m.ustRueckstellung, 0))}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-orange-600 hidden md:table-cell">
                  {formatEUR(cf.months.reduce((s, m) => s + m.koestRueckstellung, 0))}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-500 hidden lg:table-cell">{formatEUR(cf.offeneForderungen)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-500 hidden lg:table-cell">{formatEUR(cf.offeneVerbindlichkeiten)}</td>
                <td className={cn("px-3 py-2.5 text-right font-black text-base", cf.freierCashflow >= 0 ? "text-brand-800" : "text-red-600")}>
                  {cf.freierCashflow >= 0 ? "+" : ""}{formatEUR(cf.freierCashflow)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Hinweis */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
        <span>
          Steuerrückstellungen sind Schätzungen (USt 20%, KöSt 23%, SVS 27,5%) und ersetzen keine Steuerberatung.
          Tatsächliche Beträge hängen von Abzügen, Sonderausgaben und Unternehmensform ab.
        </span>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-700",
    red: "text-red-700",
    brand: "text-brand-700",
    slate: "text-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-semibold text-slate-500">{label}</span></div>
      <div className={cn("text-xl font-black", colorMap[color] ?? "text-slate-800")}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function SteuerBox({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-700",
    orange: "text-orange-700",
    red: "text-red-700",
  };
  return (
    <div className="rounded-xl bg-white/70 border border-brand-100 p-3">
      <p className="text-[10px] text-brand-600 font-semibold uppercase">{label}</p>
      <p className={cn("text-xl font-black mt-1", colorMap[color])}>{formatEUR(value)}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
