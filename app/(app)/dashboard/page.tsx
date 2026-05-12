"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Receipt as ReceiptIcon,
  Percent,
  AlertTriangle,
  Clock,
  Send,
  Upload as UploadIcon,
  FileBarChart2,
  ArrowRight,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { InsightCard } from "@/components/InsightCard";
import {
  CategoryChart,
  MonthlyTrendChart,
  SupplierChart,
  StatusPieChart,
} from "@/components/Charts";
import { Disclaimer } from "@/components/Disclaimer";
import { loadReceipts } from "@/lib/store";
import {
  buildInsights,
  groupByCategory,
  groupByMonth,
  groupBySupplier,
  periodStats,
  statusDistribution,
} from "@/lib/insights";
import { formatEUR, monthLabel, monthKey } from "@/lib/utils";
import type { Receipt } from "@/lib/types";

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReceipts(loadReceipts());
    setLoaded(true);
  }, []);

  const { currentReceipts, prevReceipts, currentLabel, allStats } = useMemo(() => {
    if (receipts.length === 0)
      return { currentReceipts: [], prevReceipts: [], currentLabel: "", allStats: null };
    const months = Array.from(new Set(receipts.map((r) => monthKey(r.receipt_date)))).sort();
    const current = months[months.length - 1];
    const prev = months[months.length - 2];
    const cur = receipts.filter((r) => monthKey(r.receipt_date) === current);
    const prv = prev ? receipts.filter((r) => monthKey(r.receipt_date) === prev) : [];
    return {
      currentReceipts: cur,
      prevReceipts: prv,
      currentLabel: monthLabel(cur[0].receipt_date),
      allStats: periodStats(receipts),
    };
  }, [receipts]);

  if (!loaded) return <div className="p-8 text-muted-foreground">Lade …</div>;

  if (receipts.length === 0) {
    return <EmptyState />;
  }

  const stats = periodStats(currentReceipts);
  const prevStats = periodStats(prevReceipts);
  const insights = buildInsights(receipts);
  const trend =
    prevStats.total_gross > 0
      ? Math.round(((stats.total_gross - prevStats.total_gross) / prevStats.total_gross) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-col lg:flex-row gap-4">
        <div>
          <p className="text-sm text-brand-600 font-semibold uppercase tracking-wider">Dein Monatsreport</p>
          <h1 className="text-3xl font-bold tracking-tight">{currentLabel}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatisch erstellt aus {stats.count} Belegen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/upload" className="btn-primary">
            <UploadIcon className="h-4 w-4" /> Beleg hochladen
          </Link>
          <Link href="/report" className="btn-secondary">
            <FileBarChart2 className="h-4 w-4" /> Report erstellen
          </Link>
          <Link href="/tax-advisor" className="btn-secondary">
            <Send className="h-4 w-4" /> An Steuerberater
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <MetricCard
          label="Gesamtausgaben"
          value={formatEUR(stats.total_gross)}
          Icon={Wallet}
          accent="brand"
          trend={prevStats.total_gross ? { value: trend, up: trend > 0 } : undefined}
          hint="vs. Vormonat"
          className="col-span-2"
        />
        <MetricCard label="Belege" value={stats.count} Icon={ReceiptIcon} accent="muted" />
        <MetricCard label="MwSt.-Summe" value={formatEUR(stats.total_vat)} Icon={Percent} accent="accent" />
        <MetricCard
          label="Ungeprüft"
          value={stats.unchecked}
          Icon={Clock}
          accent="muted"
          hint="warten auf Prüfung"
        />
        <MetricCard
          label="Unsicher"
          value={stats.uncertain}
          Icon={AlertTriangle}
          accent="warn"
          hint="bitte prüfen"
        />
      </div>

      {/* Tax Advisor Progress */}
      <div className="card-soft p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="h-12 w-12 rounded-lg bg-brand-50 text-brand-700 grid place-content-center">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">
                Dein Steuerberater-Paket ist zu {allStats!.advisorReadyPct} % bereit
              </p>
              <p className="text-sm text-muted-foreground">
                {allStats!.checked} von {allStats!.count} Belegen geprüft · {allStats!.uncertain} unsicher
              </p>
            </div>
          </div>
          <Link href="/tax-advisor" className="btn-primary">
            Paket öffnen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-accent transition-all"
            style={{ width: `${allStats!.advisorReadyPct}%` }}
          />
        </div>
      </div>

      {/* Insights */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold tracking-tight">Was diesen Monat auffällt</h2>
          <span className="text-xs text-muted-foreground">{insights.length} Hinweise</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <InsightCard key={i} insight={ins} />
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Ausgaben nach Monat" subtitle="Letzte Monate">
          <MonthlyTrendChart data={groupByMonth(receipts)} />
        </ChartCard>
        <ChartCard title="Ausgaben nach Kategorie" subtitle={currentLabel}>
          <CategoryChart data={groupByCategory(currentReceipts)} />
        </ChartCard>
        <ChartCard title="Top 10 Lieferanten" subtitle={currentLabel}>
          <SupplierChart data={groupBySupplier(currentReceipts, 10)} />
        </ChartCard>
        <ChartCard title="Status der Belege" subtitle="Gesamt">
          <StatusPieChart data={statusDistribution(receipts)} />
        </ChartCard>
      </div>

      <Disclaimer />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-soft p-10 text-center">
      <span className="h-16 w-16 mx-auto rounded-2xl bg-brand-50 text-brand-700 grid place-content-center">
        <UploadIcon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-bold">Noch keine Belege.</h2>
      <p className="mt-2 text-muted-foreground max-w-md mx-auto">
        Lade deinen ersten Beleg hoch — Klarblick erstellt automatisch deinen Monatsreport.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/upload" className="btn-primary">
          <UploadIcon className="h-4 w-4" /> Beleg hochladen
        </Link>
        <button
          onClick={() => {
            import("@/lib/store").then(({ resetToDemo }) => {
              resetToDemo();
              location.reload();
            });
          }}
          className="btn-secondary"
        >
          Demo-Daten laden
        </button>
      </div>
    </div>
  );
}
