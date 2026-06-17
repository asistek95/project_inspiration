"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileBarChart2,
  Mail,
  Link2,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  Wallet,
  Receipt as ReceiptIcon,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  PieChart,
  ListChecks,
  FileText,
  Sparkles,
} from "lucide-react";
import { loadReceipts } from "@/lib/store";
import { CATEGORIES, STATUS_LABEL } from "@/lib/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import {
  buildInsights,
  groupByCategory,
  groupByCustomer,
  groupByMonth,
  groupBySupplier,
  periodStats,
} from "@/lib/insights";
import { formatDate, formatEUR } from "@/lib/utils";
import { CategoryChart, SupplierChart } from "@/components/Charts";
import { InsightCard } from "@/components/InsightCard";
import { exportCSV, generateReportPDF } from "@/lib/pdf";
import { DEMO_COMPANY } from "@/lib/demo-data";

type TabId = "overview" | "categories" | "suppliers" | "kunden" | "taxcheck" | "receipts";

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: "overview", label: "Übersicht", Icon: PieChart },
  { id: "categories", label: "Kategorien", Icon: Sparkles },
  { id: "suppliers", label: "Lieferanten", Icon: Users },
  { id: "kunden", label: "Kunden", Icon: TrendingUp },
  { id: "taxcheck", label: "Steuer-Check", Icon: ListChecks },
  { id: "receipts", label: "Belege", Icon: FileText },
];

export default function ReportPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selQ, setSelQ] = useState<number | null>(null); // null = ganzes Jahr
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked">("all");
  const [excludedCats, setExcludedCats] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [profile, setProfile] = useState<{ company_name: string; tax_advisor_email?: string }>({
    company_name: DEMO_COMPANY.company_name,
    tax_advisor_email: DEMO_COMPANY.tax_advisor_email || undefined,
  });

  // Berechne from/to aus Jahr/Quartal/Monat
  useEffect(() => {
    let f: string, t: string;
    if (selMonth !== null) {
      f = new Date(selYear, selMonth - 1, 1).toISOString().slice(0, 10);
      t = new Date(selYear, selMonth, 0).toISOString().slice(0, 10);
    } else if (selQ !== null) {
      const startM = (selQ - 1) * 3;
      f = new Date(selYear, startM, 1).toISOString().slice(0, 10);
      t = new Date(selYear, startM + 3, 0).toISOString().slice(0, 10);
    } else {
      f = `${selYear}-01-01`;
      t = `${selYear}-12-31`;
    }
    setFrom(f);
    setTo(t);
  }, [selYear, selQ, selMonth]);

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
  const cust = groupByCustomer(filtered, 10);
  const months = groupByMonth(filtered);
  const periodLabel = from && to ? `${formatDate(from)} – ${formatDate(to)}` : "Zeitraum";

  const topCat = cats[0];
  const topCatShare = stats.total_costs && topCat ? Math.round((topCat.value / stats.total_costs) * 100) : 0;
  const noVat = filtered.filter((r) => r.vat_amount === 0).length;

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

  function quickRange(months: number) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Auswertung</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {periodLabel} · {stats.count} Belege · {profile.company_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadCSV} className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </button>
          <button
            className="btn-secondary"
            onClick={() => alert("Steuerberater-Link wurde kopiert (Mock).\nIn Produktion: signierter Supabase-Link.")}
          >
            <Link2 className="h-4 w-4" /> Link
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              (window.location.href = `mailto:${profile.tax_advisor_email || ""}?subject=Monatsabschluss%20${periodLabel}&body=Hallo,%20anbei%20mein%20Monatsabschluss%20aus%20Klarblick.`)
            }
          >
            <Mail className="h-4 w-4" /> E-Mail
          </button>
          <button onClick={downloadPDF} className="btn-primary">
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* FILTERBAR — Jahr/Quartal/Monat wie Dashboard */}
      <div className="sticky top-0 z-10 -mx-4 px-4 lg:mx-0 lg:px-0 py-2 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-2">

          {/* Jahr */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-2 py-1">
            <button onClick={() => { setSelYear(y => y - 1); setSelQ(null); setSelMonth(null); }}
              className="px-1.5 py-1 text-slate-500 hover:text-slate-800 font-bold text-sm">‹</button>
            <span className="font-semibold text-sm w-12 text-center">{selYear}</span>
            <button onClick={() => { setSelYear(y => y + 1); setSelQ(null); setSelMonth(null); }}
              className="px-1.5 py-1 text-slate-500 hover:text-slate-800 font-bold text-sm"
              disabled={selYear >= new Date().getFullYear()}>›</button>
          </div>

          {/* Quartale */}
          <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button onClick={() => { setSelQ(null); setSelMonth(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${selQ === null && selMonth === null ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
              Jahr
            </button>
            {[1, 2, 3, 4].map(q => (
              <button key={q} onClick={() => { setSelQ(q); setSelMonth(null); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${selQ === q && selMonth === null ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
                Q{q}
              </button>
            ))}
          </div>

          {/* Monate (nur wenn Quartal gewählt) */}
          {selQ !== null && (
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
              {[0, 1, 2].map(offset => {
                const m = (selQ - 1) * 3 + 1 + offset;
                const name = new Date(selYear, m - 1).toLocaleString("de-AT", { month: "short" });
                return (
                  <button key={m} onClick={() => setSelMonth(selMonth === m ? null : m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${selMonth === m ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          <select
            className="input h-9 text-sm w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Alle Belege</option>
            <option value="checked">Nur geprüfte</option>
          </select>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className="btn-secondary h-9 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Kategorien
            {excludedCats.size > 0 ? (
              <span className="ml-1 pill bg-warn-soft text-warn border border-amber-200 text-[10px]">
                {excludedCats.size} aus
              </span>
            ) : null}
            <ChevronDown className={`h-4 w-4 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters ? (
          <div className="mt-2 p-3 rounded-lg border border-border bg-white">
            <p className="text-xs text-muted-foreground mb-2">
              Kategorien ausschließen — Klick zum Aus-/Einblenden
            </p>
            <div className="flex flex-wrap gap-1.5">
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
                    className={`pill border text-xs ${
                      off
                        ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                        : "bg-brand-50 text-brand-700 border-blue-100"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
              {excludedCats.size > 0 ? (
                <button
                  onClick={() => setExcludedCats(new Set())}
                  className="pill bg-white border border-slate-200 text-slate-500 hover:text-foreground text-xs"
                >
                  Zurücksetzen
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* KPI HERO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          Icon={Wallet}
          tone="brand"
          label="Gesamtkosten (Eingang)"
          value={formatEUR(stats.total_costs)}
          sub={`${stats.eingang_count} Eingangsbelege`}
        />
        <KpiCard
          Icon={TrendingUp}
          tone="accent"
          label="Gesamtumsatz (Ausgang)"
          value={formatEUR(stats.total_revenue)}
          sub={`${stats.ausgang_count} Ausgangsrechnungen`}
        />
        <KpiCard
          Icon={CheckCircle2}
          tone={stats.advisorReadyPct >= 80 ? "accent" : "brand"}
          label="Paket-Fortschritt"
          value={`${stats.advisorReadyPct}%`}
          sub="bereit für Steuerberater"
          progress={stats.advisorReadyPct}
        />
        <KpiCard
          Icon={AlertTriangle}
          tone={stats.uncertain > 0 ? "warn" : "slate"}
          label="Klärbedarf"
          value={String(stats.uncertain)}
          sub={`${noVat} ohne MwSt.`}
        />
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-foreground"
              }`}
            >
              <t.Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {tab === "overview" ? (
        <div className="space-y-5">
          {/* Monats-Trend */}
          <div className="card-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                <p className="font-semibold">Ausgaben pro Monat</p>
              </div>
              <p className="text-xs text-muted-foreground">{months.length} Monate</p>
            </div>
            {months.length > 0 ? (
              <MonthlyTrend data={months} />
            ) : (
              <EmptyHint text="Keine Daten im gewählten Zeitraum." />
            )}
          </div>

          {/* Top-Kategorie + Top-Lieferant + Top-Kunde */}
          <div className="grid md:grid-cols-3 gap-3">
            <MiniHighlight
              label="Größter Kostenblock"
              value={topCat?.name || "—"}
              amount={topCat ? formatEUR(topCat.value) : "—"}
              share={topCat ? `${topCatShare}% der Kosten` : ""}
              tone="brand"
            />
            <MiniHighlight
              label="Wichtigster Lieferant"
              value={sups[0]?.name || "—"}
              amount={sups[0] ? formatEUR(sups[0].value) : "—"}
              share={
                sups[0] && stats.total_costs
                  ? `${Math.round((sups[0].value / stats.total_costs) * 100)}% der Kosten`
                  : ""
              }
              tone="slate"
            />
            <MiniHighlight
              label="Wichtigster Kunde"
              value={cust[0]?.name || "—"}
              amount={cust[0] ? formatEUR(cust[0].value) : "—"}
              share={
                cust[0] && stats.total_revenue
                  ? `${Math.round((cust[0].value / stats.total_revenue) * 100)}% des Umsatzes`
                  : cust.length === 0 ? "Keine Ausgangsrechnungen" : ""
              }
              tone="accent"
            />
          </div>

          {/* Handlungsempfehlungen */}
          {insights.length > 0 ? (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" /> Empfehlungen
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {insights.slice(0, 4).map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="space-y-4">
          <div className="card-soft p-5">
            <p className="font-semibold mb-3">Ausgaben nach Kategorie</p>
            {cats.length > 0 ? <CategoryChart data={cats} /> : <EmptyHint text="Keine Daten." />}
          </div>
          <div className="card-soft p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p className="font-semibold">Detail</p>
              <p className="text-xs text-muted-foreground">{cats.length} Kategorien</p>
            </div>
            <ul className="divide-y divide-border">
              {cats.map((c) => {
                const pct = stats.total_gross ? Math.round((c.value / stats.total_gross) * 100) : 0;
                return (
                  <li key={c.name} className="px-5 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="tabular-nums">{formatEUR(c.value)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "suppliers" ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-xs text-slate-600">
            Nur <strong>Eingangsrechnungen</strong> (Kosten) — nach Lieferant / Aussteller gruppiert.
          </div>
          <div className="card-soft p-5">
            <p className="font-semibold mb-3">Top 10 Lieferanten</p>
            {sups.length > 0 ? <SupplierChart data={sups} /> : <EmptyHint text="Keine Eingangsrechnungen im Zeitraum." />}
          </div>
          <div className="card-soft p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Lieferant</th>
                  <th className="text-right p-3">Kosten</th>
                  <th className="text-right p-3">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {sups.map((s, i) => (
                  <tr key={s.name} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-right tabular-nums">{formatEUR(s.value)}</td>
                    <td className="p-3 text-right text-slate-600 tabular-nums">
                      {stats.total_costs ? `${Math.round((s.value / stats.total_costs) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "kunden" ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-700">
            Nur <strong>Ausgangsrechnungen</strong> (Umsatz) — nach Empfänger / Kunde gruppiert.
          </div>
          <div className="card-soft p-5">
            <p className="font-semibold mb-3">Top 10 Kunden</p>
            {cust.length > 0 ? <SupplierChart data={cust} /> : <EmptyHint text="Keine Ausgangsrechnungen im Zeitraum." />}
          </div>
          <div className="card-soft p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Kunde</th>
                  <th className="text-right p-3">Umsatz</th>
                  <th className="text-right p-3">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {cust.map((c, i) => (
                  <tr key={c.name} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-right tabular-nums">{formatEUR(c.value)}</td>
                    <td className="p-3 text-right text-slate-600 tabular-nums">
                      {stats.total_revenue ? `${Math.round((c.value / stats.total_revenue) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "taxcheck" ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="Belege geprüft" value={`${stats.checked} / ${stats.count}`} tone="accent" />
            <MiniStat label="Unsichere Belege" value={String(stats.uncertain)} tone="warn" />
            <MiniStat label="Belege ohne MwSt." value={String(noVat)} />
            <MiniStat label="Paket-Fortschritt" value={`${stats.advisorReadyPct}%`} tone="brand" />
          </div>

          <div className="card-soft p-5">
            <p className="font-semibold mb-3">Fortschritt zum Steuerberater-Paket</p>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500"
                style={{ width: `${stats.advisorReadyPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="pill bg-accent-soft text-accent border border-emerald-200">
                ✓ {stats.checked} geprüft
              </span>
              {stats.uncertain > 0 ? (
                <span className="pill bg-warn-soft text-warn border border-amber-200">
                  ! {stats.uncertain} unsicher
                </span>
              ) : null}
              {stats.unchecked > 0 ? (
                <span className="pill bg-slate-50 text-slate-600 border border-slate-200">
                  • {stats.unchecked} ungeprüft
                </span>
              ) : null}
            </div>
          </div>

          {insights.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "receipts" ? (
        <div className="card-soft p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
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
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="p-2.5 whitespace-nowrap">{formatDate(r.receipt_date)}</td>
                  <td className="p-2.5 font-medium">{r.supplier_name}</td>
                  <td className="p-2.5 text-slate-600">{r.category}</td>
                  <td className="p-2.5 text-right tabular-nums">{formatEUR(r.net_amount)}</td>
                  <td className="p-2.5 text-right tabular-nums">{formatEUR(r.vat_amount)}</td>
                  <td className="p-2.5 text-right font-medium tabular-nums">{formatEUR(r.gross_amount)}</td>
                  <td className="p-2.5 text-xs">
                    <StatusPill status={r.status as ReceiptStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 ? (
            <p className="p-3 text-xs text-muted-foreground text-center border-t border-border">
              + {filtered.length - 100} weitere Belege im PDF-Export.
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-sm text-muted-foreground text-center">Keine Belege im Zeitraum.</p>
          ) : null}
        </div>
      ) : null}

      {/* CTA */}
      <div className="flex justify-center pt-2 pb-4">
        <button onClick={downloadPDF} className="btn-primary btn-lg">
          <FileBarChart2 className="h-5 w-5" /> Report als PDF herunterladen
        </button>
      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function KpiCard({
  Icon,
  tone,
  label,
  value,
  sub,
  progress,
}: {
  Icon: any;
  tone: "brand" | "accent" | "warn" | "slate";
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-soft text-accent",
    warn: "bg-warn-soft text-warn",
    slate: "bg-slate-100 text-slate-600",
  };
  const bar: Record<string, string> = {
    brand: "bg-brand-500",
    accent: "bg-emerald-500",
    warn: "bg-amber-500",
    slate: "bg-slate-400",
  };
  return (
    <div className="card-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <span className={`h-8 w-8 rounded-lg grid place-content-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p> : null}
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${bar[tone]}`} style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function MiniHighlight({
  label,
  value,
  amount,
  share,
  tone,
}: {
  label: string;
  value: string;
  amount: string;
  share: string;
  tone: "brand" | "accent" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 border-blue-100 text-brand-700",
    accent: "bg-accent-soft border-emerald-200 text-accent",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold truncate">{value}</p>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="tabular-nums font-medium">{amount}</span>
        <span className="text-xs opacity-80">{share}</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "brand" | "accent" | "warn" | "slate";
}) {
  const map: Record<string, string> = {
    brand: "text-brand-700",
    accent: "text-accent",
    warn: "text-warn",
    slate: "text-foreground",
  };
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${map[tone]}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ReceiptStatus }) {
  const tones: Record<string, string> = {
    geprueft: "bg-accent-soft text-accent border-emerald-200",
    freigegeben: "bg-accent-soft text-accent border-emerald-200",
    unsicher: "bg-warn-soft text-warn border-amber-200",
    ungeprueft: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span className={`pill border text-[11px] ${tones[status] || tones.ungeprueft}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{text}</p>;
}

function MonthlyTrend({ data }: { data: { key: string; name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.key} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{d.name}</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-24 text-right">
              {formatEUR(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
