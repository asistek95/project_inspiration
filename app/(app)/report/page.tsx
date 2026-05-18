"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart2, Mail, Link2, FileSpreadsheet } from "lucide-react";
import { loadReceipts } from "@/lib/store";
import { CATEGORIES, STATUS_LABEL } from "@/lib/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import {
  buildInsights,
  groupByCategory,
  groupBySupplier,
  periodStats,
} from "@/lib/insights";
import { formatDate, formatEUR, monthLabel } from "@/lib/utils";
import { CategoryChart, SupplierChart } from "@/components/Charts";
import { InsightCard } from "@/components/InsightCard";
import { exportCSV, generateReportPDF } from "@/lib/pdf";
import { DEMO_COMPANY } from "@/lib/demo-data";

export default function ReportPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked">("all");
  const [excludedCats, setExcludedCats] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<{ company_name: string; tax_advisor_email?: string }>({
    company_name: DEMO_COMPANY.company_name,
    tax_advisor_email: DEMO_COMPANY.tax_advisor_email || undefined,
  });

  useEffect(() => {
    const r = loadReceipts();
    setAll(r);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("klarblick.profile");
        if (raw) {
          const p = JSON.parse(raw);
          setProfile({
            company_name: p.company_name || DEMO_COMPANY.company_name,
            tax_advisor_email: p.tax_advisor_email || undefined,
          });
        }
      } catch {}
    }
    if (r.length > 0) {
      // Defaults: gesamter Zeitraum aller Belege (statt nur letzter Monat)
      const dates = r.map((x) => x.receipt_date).sort();
      setFrom(dates[0]);
      setTo(dates[dates.length - 1]);
    } else {
      // Keine Belege ? letzter Monat als Default
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(start.toISOString().slice(0, 10));
      setTo(end.toISOString().slice(0, 10));
    }
  }, []);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (from && r.receipt_date < from) return false;
      if (to && r.receipt_date > to) return false;
      if (excludedCats.has(r.category)) return false;
      if (statusFilter === "checked" && r.status !== "geprueft" && r.status !== "freigegeben") return false;
      return true;
    });
  }, [all, from, to, statusFilter, excludedCats]);

  const stats = periodStats(filtered);
  const insights = buildInsights(filtered);
  const cats = groupByCategory(filtered);
  const sups = groupBySupplier(filtered, 10);
  const periodLabel = from && to ? `${formatDate(from)} � ${formatDate(to)}` : "Zeitraum";

  function downloadPDF() {
    generateReportPDF({
      company: profile.company_name,
      periodLabel,
      receipts: filtered,
      insights: insights.map((i) => ({ title: i.title, description: i.description })),
    });
  }

  function downloadCSV() {
    exportCSV(filtered, `klarblick_${from}_${to}.csv`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Management-Report</h1>
        <p className="text-muted-foreground mt-1">
          W�hle Zeitraum und Filter � Klarblick erstellt deinen Report automatisch.
        </p>
      </div>

      {/* Builder */}
      <div className="card-soft p-5 grid lg:grid-cols-4 gap-4">
        <div>
          <label className="label">Von</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Bis</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">Alle Belege</option>
            <option value="checked">Nur gepr�fte</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={downloadPDF} className="btn-primary flex-1">
            <Download className="h-4 w-4" /> PDF herunterladen
          </button>
        </div>
        <div className="lg:col-span-4">
          <label className="label">Kategorien ausschlie�en</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const off = excludedCats.has(c);
              return (
                <button
                  key={c}
                  onClick={() =>
                    setExcludedCats((prev) => {
                      const next = new Set(prev);
                      if (next.has(c)) next.delete(c);
                      else next.add(c);
                      return next;
                    })
                  }
                  className={`pill border ${
                    off
                      ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                      : "bg-brand-50 text-brand-700 border-blue-100"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap gap-2">
        <button onClick={downloadCSV} className="btn-secondary">
          <FileSpreadsheet className="h-4 w-4" /> CSV exportieren
        </button>
        <button
          className="btn-secondary"
          onClick={() => alert("Steuerberater-Link wurde kopiert (Mock).\nIn Produktion: signierter Supabase-Link.")}
        >
          <Link2 className="h-4 w-4" /> Steuerberater-Link
        </button>
        <button
          className="btn-secondary"
          onClick={() =>
            (window.location.href = `mailto:${profile.tax_advisor_email || ""}?subject=Management-Report%20${periodLabel}&body=Hallo,%20anbei%20mein%20Monatsreport%20aus%20Klarblick.`)
          }
        >
          <Mail className="h-4 w-4" /> Per E-Mail vorbereiten
        </button>
      </div>

      {/* Report-Vorschau */}
      <div className="card-soft p-6 lg:p-10 space-y-8 bg-white">
        {/* Cover */}
        <div className="text-center pb-8 border-b border-border">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-widest">Management-Report</p>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">{profile.company_name}</h2>
          <p className="text-muted-foreground mt-1">{periodLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">Automatisch erstellt aus gepr�ften Belegdaten</p>
        </div>

        {/* Executive Summary */}
        <section>
          <SectionHeading n={1} title="Executive Summary" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Stat label="Gesamtausgaben" value={formatEUR(stats.total_gross)} />
            <Stat label="MwSt.-Summe" value={formatEUR(stats.total_vat)} />
            <Stat label="Belege" value={String(stats.count)} />
            <Stat label="Gepr�ft" value={`${stats.checked}`} />
            <Stat label="Unsicher" value={`${stats.uncertain}`} accent="warn" />
            <Stat label="Ungepr�ft" value={`${stats.unchecked}`} accent="muted" />
            <Stat label="Paket bereit" value={`${stats.advisorReadyPct} %`} accent="accent" />
            <Stat
              label="Wichtigster Hinweis"
              value={insights[0]?.title || "�"}
              accent="brand"
              small
            />
          </div>
        </section>

        {/* Kostenanalyse */}
        <section>
          <SectionHeading n={2} title="Kostenanalyse" />
          <div className="grid lg:grid-cols-2 gap-5 mt-4">
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium mb-2">Ausgaben nach Kategorie</p>
              <CategoryChart data={cats} />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium mb-2">Top 10 Lieferanten</p>
              <SupplierChart data={sups} />
            </div>
          </div>
        </section>

        {/* Lieferantenanalyse */}
        <section>
          <SectionHeading n={3} title="Lieferantenanalyse" />
          <div className="rounded-lg border border-border overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Lieferant</th>
                  <th className="text-right p-3">Ausgaben</th>
                  <th className="text-right p-3">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {sups.map((s) => (
                  <tr key={s.name} className="border-t border-border">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-right">{formatEUR(s.value)}</td>
                    <td className="p-3 text-right text-slate-600">
                      {stats.total_gross ? `${Math.round((s.value / stats.total_gross) * 100)} %` : "�"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Steuerberater-Check */}
        <section>
          <SectionHeading n={4} title="Steuerberater-Check" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Stat label="Belege gepr�ft" value={`${stats.checked} / ${stats.count}`} accent="accent" />
            <Stat label="Unsichere Belege" value={`${stats.uncertain}`} accent="warn" />
            <Stat
              label="Belege ohne MwSt."
              value={`${filtered.filter((r) => r.vat_amount === 0).length}`}
            />
            <Stat label="Paket-Fortschritt" value={`${stats.advisorReadyPct} %`} accent="brand" />
          </div>
        </section>

        {/* Handlungsempfehlungen */}
        <section>
          <SectionHeading n={5} title="Handlungsempfehlungen" />
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </section>

        {/* Anhang */}
        <section>
          <SectionHeading n={6} title="Anhang � Belegliste" />
          <div className="rounded-lg border border-border overflow-hidden mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-2.5">Datum</th>
                  <th className="text-left p-2.5">Lieferant</th>
                  <th className="text-left p-2.5">Kategorie</th>
                  <th className="text-right p-2.5">Netto</th>
                  <th className="text-right p-2.5">MwSt.</th>
                  <th className="text-right p-2.5">Brutto</th>
                  <th className="text-left p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2.5 whitespace-nowrap">{formatDate(r.receipt_date)}</td>
                    <td className="p-2.5 font-medium">{r.supplier_name}</td>
                    <td className="p-2.5 text-slate-600">{r.category}</td>
                    <td className="p-2.5 text-right">{formatEUR(r.net_amount)}</td>
                    <td className="p-2.5 text-right">{formatEUR(r.vat_amount)}</td>
                    <td className="p-2.5 text-right font-medium">{formatEUR(r.gross_amount)}</td>
                    <td className="p-2.5 text-xs text-muted-foreground">
                      {STATUS_LABEL[r.status as ReceiptStatus]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 60 ? (
              <p className="p-3 text-xs text-muted-foreground text-center">
                � {filtered.length - 60} weitere Belege im PDF.
              </p>
            ) : null}
          </div>
        </section>

        <div className="pt-6 border-t border-border">
</div>
      </div>

      <div className="flex justify-center pb-6">
        <button onClick={downloadPDF} className="btn-primary btn-lg">
          <FileBarChart2 className="h-5 w-5" /> Report als PDF herunterladen
        </button>
      </div>
    </div>
  );
}

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-content-center text-sm font-bold">
        {n}
      </span>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "muted",
  small = false,
}: {
  label: string;
  value: string;
  accent?: "brand" | "accent" | "warn" | "muted";
  small?: boolean;
}) {
  const map: Record<string, string> = {
    brand: "text-brand-700",
    accent: "text-accent",
    warn: "text-warn",
    muted: "text-foreground",
  };
  return (
    <div className="rounded-lg border border-border p-4 bg-white">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-bold ${small ? "text-sm" : "text-2xl"} ${map[accent]}`}>{value}</p>
    </div>
  );
}
