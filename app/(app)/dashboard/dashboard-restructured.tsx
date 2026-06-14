"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Upload as UploadIcon,
  FileBarChart2,
  Send,
  TrendingUp,
  TrendingDown,
  Receipt as ReceiptIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Euro,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Receipt } from "@/lib/types";
import { loadReceipts } from "@/lib/store";
import { formatEUR, cn } from "@/lib/utils";

interface MonthStats {
  month: number;
  count: number;
  gross: number;
  vat: number;
  net: number;
  eingang_gross: number;
  eingang_vat: number;
  ausgang_gross: number;
  ausgang_vat: number;
}

interface QuarterData {
  q: number;
  months: MonthStats[];
  total_gross: number;
  total_vat: number;
  eingang_total: number;
  ausgang_total: number;
  is_expanded: boolean;
}

// Österr. Steuerrecht: Vorsteuer (aus Eingang) vs. USt-Schuld (aus Ausgang)
// UVA-Ergebnis: Vorsteuer - USt = positiv → Rückzahlung, negativ → Zahlung
interface YearKPIs {
  total_eingang: number;       // Summe Eingangsrechnungen (Kosten Brutto)
  total_ausgang: number;       // Summe Ausgangsrechnungen (Umsatz Brutto)
  vorsteuer: number;           // VSt aus Eingangsrechnungen (bekomme ich zurück)
  ust_schuld: number;          // USt aus Ausgangsrechnungen (muss ich zahlen)
  uva_result: number;          // vorsteuer - ust_schuld (positiv = Erstattung)
  count_ungeprueft: number;
  count_unsicher: number;
  count_geprueft: number;
}

export default function DashboardRestructured() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set());

  useEffect(() => {
    setReceipts(loadReceipts());
    setLoaded(true);
  }, []);

  const yearReceipts = useMemo(
    () => receipts.filter((r) => new Date(r.receipt_date).getFullYear() === year),
    [receipts, year]
  );

  const kpis = useMemo<YearKPIs>(() => {
    const eingang = yearReceipts.filter((r) => r.invoice_type === "eingang" || (r as any).direction === "eingang");
    const ausgang = yearReceipts.filter((r) => r.invoice_type === "ausgang" || (r as any).direction === "ausgang");
    return {
      total_eingang: eingang.reduce((s, r) => s + r.gross_amount, 0),
      total_ausgang: ausgang.reduce((s, r) => s + r.gross_amount, 0),
      vorsteuer: eingang.reduce((s, r) => s + r.vat_amount, 0),
      ust_schuld: ausgang.reduce((s, r) => s + r.vat_amount, 0),
      uva_result: eingang.reduce((s, r) => s + r.vat_amount, 0) - ausgang.reduce((s, r) => s + r.vat_amount, 0),
      count_ungeprueft: yearReceipts.filter((r) => r.status === "ungeprueft").length,
      count_unsicher: yearReceipts.filter((r) => r.status === "unsicher").length,
      count_geprueft: yearReceipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length,
    };
  }, [yearReceipts]);

  const quarterData = useMemo<QuarterData[]>(() => {
    const quarters: QuarterData[] = [1, 2, 3, 4].map((q) => ({
      q,
      months: [],
      total_gross: 0,
      total_vat: 0,
      eingang_total: 0,
      ausgang_total: 0,
      is_expanded: expandedQuarters.has(q),
    }));

    const monthMap = new Map<number, Receipt[]>();
    yearReceipts.forEach((r) => {
      const m = new Date(r.receipt_date).getMonth() + 1;
      if (!monthMap.has(m)) monthMap.set(m, []);
      monthMap.get(m)!.push(r);
    });

    for (let q = 1; q <= 4; q++) {
      const start = (q - 1) * 3 + 1;
      for (let m = start; m <= start + 2; m++) {
        const mr = monthMap.get(m) || [];
        const eingang = mr.filter((r) => r.invoice_type === "eingang" || (r as any).direction === "eingang");
        const ausgang = mr.filter((r) => r.invoice_type === "ausgang" || (r as any).direction === "ausgang");
        const ms: MonthStats = {
          month: m,
          count: mr.length,
          gross: mr.reduce((s, r) => s + r.gross_amount, 0),
          vat: mr.reduce((s, r) => s + r.vat_amount, 0),
          net: mr.reduce((s, r) => s + r.net_amount, 0),
          eingang_gross: eingang.reduce((s, r) => s + r.gross_amount, 0),
          eingang_vat: eingang.reduce((s, r) => s + r.vat_amount, 0),
          ausgang_gross: ausgang.reduce((s, r) => s + r.gross_amount, 0),
          ausgang_vat: ausgang.reduce((s, r) => s + r.vat_amount, 0),
        };
        quarters[q - 1].months.push(ms);
        quarters[q - 1].total_gross += ms.gross;
        quarters[q - 1].total_vat += ms.vat;
        quarters[q - 1].eingang_total += ms.eingang_gross;
        quarters[q - 1].ausgang_total += ms.ausgang_gross;
        quarters[q - 1].is_expanded = expandedQuarters.has(q);
      }
    }
    return quarters;
  }, [yearReceipts, expandedQuarters]);

  function toggleQuarter(q: number) {
    setExpandedQuarters((prev) => {
      const next = new Set(prev);
      next.has(q) ? next.delete(q) : next.add(q);
      return next;
    });
  }

  if (!loaded) return <div className="p-8 text-muted-foreground animate-pulse">Lade …</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Österreichisches Steuerjahr</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard {year}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {yearReceipts.length} Belege · Umsatz gesamt:{" "}
            <span className="font-semibold">{formatEUR(kpis.total_ausgang)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="btn-secondary">
            <ChevronLeft className="h-4 w-4" /> {year - 1}
          </button>
          <span className="font-bold w-16 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="btn-secondary"
            disabled={year >= new Date().getFullYear()}
          >
            {year + 1} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Schnell-Aktionen */}
      <div className="flex flex-wrap gap-2">
        <Link href="/upload" className="btn-primary">
          <UploadIcon className="h-4 w-4" /> Gib mir deinen Beleg
        </Link>
        <Link href="/report" className="btn-secondary">
          <FileBarChart2 className="h-4 w-4" /> Auswertung
        </Link>
        <Link href="/tax-advisor" className="btn-secondary">
          <Send className="h-4 w-4" /> Steuerberater-Paket
        </Link>
        <Link href="/" className="btn-ghost text-slate-500 ml-auto hidden sm:inline-flex">
          ← Zur Startseite
        </Link>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Eingangsrechnungen — Kosten (ROT) */}
        <KpiTile
          label="Eingangsrechnungen"
          sublabel="Meine Kosten"
          value={formatEUR(kpis.total_eingang)}
          sub={`Vorsteuer: ${formatEUR(kpis.vorsteuer)}`}
          icon={<ArrowDownLeft className="h-5 w-5" />}
          color="red"
          href="/receipts?direction=eingang"
        />
        {/* Ausgangsrechnungen — Umsatz (GRÜN) */}
        <KpiTile
          label="Ausgangsrechnungen"
          sublabel="Mein Umsatz"
          value={formatEUR(kpis.total_ausgang)}
          sub={`USt-Schuld: ${formatEUR(kpis.ust_schuld)}`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          color="green"
          href="/receipts?direction=ausgang"
        />
        {/* UVA-Ergebnis */}
        <KpiTile
          label="UVA-Ergebnis"
          sublabel={kpis.uva_result >= 0 ? "Erstattung" : "Zahllast"}
          value={formatEUR(Math.abs(kpis.uva_result))}
          sub={kpis.uva_result >= 0 ? "Finanzamt zahlt zurück" : "An Finanzamt zu zahlen"}
          icon={<Euro className="h-5 w-5" />}
          color={kpis.uva_result >= 0 ? "green" : "orange"}
          href="/uva"
        />
        {/* Belege geprüft */}
        <KpiTile
          label="Geprüft"
          sublabel={`${kpis.count_geprueft} von ${yearReceipts.length}`}
          value={`${yearReceipts.length > 0 ? Math.round((kpis.count_geprueft / yearReceipts.length) * 100) : 0}%`}
          sub={`${kpis.count_ungeprueft} ungeprüft`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="brand"
          href="/receipts"
        />
        {/* Offene Belege */}
        <KpiTile
          label="Zu prüfen"
          sublabel="Brauchen Aufmerksamkeit"
          value={`${kpis.count_unsicher + kpis.count_ungeprueft}`}
          sub={`${kpis.count_unsicher} unsicher`}
          icon={<AlertCircle className="h-5 w-5" />}
          color={kpis.count_unsicher > 0 ? "orange" : "slate"}
          href="/receipts?filter=ungeprueft"
        />
      </div>

      {/* Quartals-Übersicht */}
      {yearReceipts.length === 0 ? (
        <div className="p-10 border-2 border-dashed rounded-xl text-center">
          <UploadIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-muted-foreground font-medium">Keine Belege für {year}</p>
          <Link href="/upload" className="btn-primary mt-4 inline-flex">
            <UploadIcon className="h-4 w-4" /> Ersten Beleg hochladen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quarterData.map((quarter) => (
            <QuarterCard key={quarter.q} quarter={quarter} onToggle={toggleQuarter} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// KPI Kachel
// ────────────────────────────────────────────────────────
type KpiColor = "red" | "green" | "orange" | "brand" | "slate";

const kpiColors: Record<KpiColor, { bg: string; text: string; icon: string; border: string }> = {
  red:    { bg: "bg-red-50",     text: "text-red-700",    icon: "text-red-500",    border: "border-red-200" },
  green:  { bg: "bg-emerald-50", text: "text-emerald-700",icon: "text-emerald-500",border: "border-emerald-200" },
  orange: { bg: "bg-amber-50",   text: "text-amber-700",  icon: "text-amber-500",  border: "border-amber-200" },
  brand:  { bg: "bg-brand-50",   text: "text-brand-700",  icon: "text-brand-500",  border: "border-brand-200" },
  slate:  { bg: "bg-slate-50",   text: "text-slate-700",  icon: "text-slate-400",  border: "border-slate-200" },
};

function KpiTile({
  label,
  sublabel,
  value,
  sub,
  icon,
  color,
  href,
}: {
  label: string;
  sublabel: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: KpiColor;
  href?: string;
}) {
  const c = kpiColors[color];
  const inner = (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 h-full transition hover:shadow-md`}>
      <div className={`${c.icon} mb-2`}>{icon}</div>
      <div className={`text-2xl font-black ${c.text} leading-tight`}>{value}</div>
      <div className="text-xs font-semibold text-slate-600 mt-1">{label}</div>
      <div className="text-[10px] text-slate-500">{sublabel}</div>
      <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-200 pt-1">{sub}</div>
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <div>{inner}</div>;
}

// ────────────────────────────────────────────────────────
// Quartal-Karte — Monate fahren horizontal aus
// ────────────────────────────────────────────────────────
function QuarterCard({ quarter, onToggle }: { quarter: QuarterData; onToggle: (q: number) => void }) {
  const QUARTER_LABELS = ["Jan – Mär", "Apr – Jun", "Jul – Sep", "Okt – Dez"];
  const totalBelege = quarter.months.reduce((s, m) => s + m.count, 0);
  const hasData = quarter.total_gross > 0;

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      hasData ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/50",
      quarter.is_expanded && hasData && "border-slate-300 shadow-sm"
    )}>
      {/* Quartal-Header */}
      <button
        onClick={() => onToggle(quarter.q)}
        className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition rounded-xl"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0",
            hasData ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
          )}>
            Q{quarter.q}
          </span>
          <div>
            <span className="font-semibold text-slate-800">{QUARTER_LABELS[quarter.q - 1]}</span>
            {hasData ? (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="text-blue-600 font-medium">⬇ {formatEUR(quarter.eingang_total)}</span>
                <span className="text-emerald-600 font-medium">⬆ {formatEUR(quarter.ausgang_total)}</span>
                <span>{totalBelege} Belege</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Keine Belege</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasData && (
            <span className="font-bold text-slate-900">{formatEUR(quarter.total_gross)}</span>
          )}
          <span className={cn(
            "text-xs text-slate-400 transition-transform",
            quarter.is_expanded && "rotate-180"
          )}>▼</span>
        </div>
      </button>

      {/* Monate — horizontal in einer Reihe ausfahren */}
      {quarter.is_expanded && (
        <div className="border-t border-slate-100 p-3 grid grid-cols-3 gap-2">
          {quarter.months.map((m) => (
            <MonthTile key={m.month} month={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthTile({ month }: { month: MonthStats }) {
  const name = new Date(2000, month.month - 1).toLocaleString("de-AT", { month: "long" });
  const hasData = month.count > 0;

  return (
    <Link
      href={`/receipts?month=${month.month}`}
      className={cn(
        "rounded-lg p-3 border transition hover:shadow-sm block",
        hasData
          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          : "border-dashed border-slate-100 bg-slate-50/50 pointer-events-none"
      )}
    >
      <p className={cn("text-xs font-semibold mb-2", hasData ? "text-slate-700" : "text-slate-400")}>
        {name}
      </p>
      {hasData ? (
        <>
          <p className="text-base font-bold text-slate-900 leading-tight">{formatEUR(month.gross)}</p>
          <div className="mt-1.5 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-blue-600">
              <span>Eingang</span>
              <span className="font-medium">{formatEUR(month.eingang_gross)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Ausgang</span>
              <span className="font-medium">{formatEUR(month.ausgang_gross)}</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-100 pt-1">
              <span>USt</span>
              <span>{formatEUR(month.vat)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">{month.count} Belege</p>
        </>
      ) : (
        <p className="text-xs text-slate-300">Keine Belege</p>
      )}
    </Link>
  );
}
