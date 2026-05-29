/**
 * Neue Dashboard-Struktur:
 * Jahr-Selector → Quartale (Q1-Q4) → Monate → Details
 *
 * Dies ist die neue Komponente die das alte Dashboard ersetzt.
 * Fokus: Österreichisches Steuerjahr (1. Jan - 31. Dez)
 * Steuerberater-Übergabe bis 15. des Monats (optional)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Upload as UploadIcon,
  FileBarChart2,
  Send,
} from "lucide-react";
import { Receipt } from "@/lib/types";
import { loadReceipts } from "@/lib/store";
import { formatEUR, monthLabel, monthKey } from "@/lib/utils";

interface MonthStats {
  month: number; // 1-12
  count: number;
  gross: number;
  vat: number;
  net: number;
  eingang_gross: number;
  ausgang_gross: number;
}

interface QuarterData {
  q: number; // 1-4
  months: MonthStats[];
  total_gross: number;
  total_vat: number;
  is_expanded: boolean;
}

export default function DashboardRestructured() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set([1])); // Q1 default expanded

  useEffect(() => {
    setReceipts(loadReceipts());
    setLoaded(true);
  }, []);

  // Quartals-Daten berechnen
  const quarterData = useMemo<QuarterData[]>(() => {
    if (receipts.length === 0) return [];

    const yearReceipts = receipts.filter((r) => {
      const d = new Date(r.receipt_date);
      return d.getFullYear() === year;
    });

    const quarters: QuarterData[] = [
      { q: 1, months: [], total_gross: 0, total_vat: 0, is_expanded: false },
      { q: 2, months: [], total_gross: 0, total_vat: 0, is_expanded: false },
      { q: 3, months: [], total_gross: 0, total_vat: 0, is_expanded: false },
      { q: 4, months: [], total_gross: 0, total_vat: 0, is_expanded: false },
    ];

    // Gruppiere nach Monaten
    const monthMap = new Map<number, Receipt[]>();
    yearReceipts.forEach((r) => {
      const d = new Date(r.receipt_date);
      const m = d.getMonth() + 1; // 1-12
      if (!monthMap.has(m)) monthMap.set(m, []);
      monthMap.get(m)!.push(r);
    });

    // Für jeden Quartal: Monate berechnen
    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3 + 1; // Q1: 1,2,3 | Q2: 4,5,6 etc.
      const endMonth = q * 3;

      for (let m = startMonth; m <= endMonth; m++) {
        const monthReceipts = monthMap.get(m) || [];
        const gross = monthReceipts.reduce((s, r) => s + r.gross_amount, 0);
        const vat = monthReceipts.reduce((s, r) => s + r.vat_amount, 0);
        const net = monthReceipts.reduce((s, r) => s + r.net_amount, 0);
        const eingang_gross = monthReceipts
          .filter((r) => r.invoice_type === "eingang")
          .reduce((s, r) => s + r.gross_amount, 0);
        const ausgang_gross = monthReceipts
          .filter((r) => r.invoice_type === "ausgang")
          .reduce((s, r) => s + r.gross_amount, 0);

        quarters[q - 1].months.push({
          month: m,
          count: monthReceipts.length,
          gross,
          vat,
          net,
          eingang_gross,
          ausgang_gross,
        });

        quarters[q - 1].total_gross += gross;
        quarters[q - 1].total_vat += vat;
      }

      quarters[q - 1].is_expanded = expandedQuarters.has(q);
    }

    return quarters;
  }, [receipts, year, expandedQuarters]);

  const toggleQuarter = (q: number) => {
    const newSet = new Set(expandedQuarters);
    if (newSet.has(q)) {
      newSet.delete(q);
    } else {
      newSet.add(q);
    }
    setExpandedQuarters(newSet);
  };

  if (!loaded) {
    return <div className="p-8 text-muted-foreground">Lade …</div>;
  }

  const totalYear = quarterData.reduce((s, q) => s + q.total_gross, 0);

  return (
    <div className="space-y-6">
      {/* Header mit Jahr-Navigation */}
      <div className="flex items-center justify-between flex-col lg:flex-row gap-4">
        <div>
          <p className="text-sm text-brand-600 font-semibold uppercase tracking-wider">
            Monatsabschluss-Assistent
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Steuerjahr {year}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gesamtumsatz: <span className="font-semibold">{formatEUR(totalYear)}</span>
          </p>
        </div>

        {/* Jahr-Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setYear(year - 1)}
            className="btn-secondary"
          >
            <ChevronLeft className="h-4 w-4" /> {year - 1}
          </button>
          <span className="text-lg font-semibold w-20 text-center">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
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
          <Send className="h-4 w-4" /> Paket vorbereiten
        </Link>
      </div>

      {/* Quartals-Übersicht */}
      {quarterData.length === 0 ? (
        <div className="p-8 border rounded-lg border-dashed border-gray-300 text-center">
          <p className="text-muted-foreground">Keine Belege für {year} vorhanden.</p>
          <p className="text-sm mt-2">
            <Link href="/upload" className="text-brand-600 hover:underline">
              Jetzt Belege hochladen
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {quarterData.map((quarter) => (
            <QuarterCard
              key={quarter.q}
              quarter={quarter}
              onToggle={toggleQuarter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QuarterCardProps {
  quarter: QuarterData;
  onToggle: (q: number) => void;
}

function QuarterCard({ quarter, onToggle }: QuarterCardProps) {
  const title = `Q${quarter.q} ${getQuarterMonths(quarter.q)}`;
  const trend = quarter.total_gross > 0 ? "up" : "neutral";

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-sm transition">
      {/* Quartal Header — clickable to expand */}
      <button
        onClick={() => onToggle(quarter.q)}
        className="w-full text-left flex items-center justify-between hover:bg-accent/50 p-2 rounded -m-2 mb-3"
      >
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {quarter.months.reduce((s, m) => s + m.count, 0)} Belege
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{formatEUR(quarter.total_gross)}</p>
          <p className="text-xs text-muted-foreground">
            {trend === "up" ? "📈" : "—"}
          </p>
        </div>
      </button>

      {/* Monate — expandierbar */}
      {quarter.is_expanded && (
        <div className="space-y-2 mt-4 border-t pt-4">
          {quarter.months.map((month) => (
            <MonthSummary key={month.month} month={month} />
          ))}
        </div>
      )}
    </div>
  );
}

interface MonthSummaryProps {
  month: MonthStats;
}

function MonthSummary({ month }: MonthSummaryProps) {
  const monthName = new Date(2000, month.month - 1).toLocaleString("de-AT", {
    month: "long",
  });

  return (
    <div className="flex items-center justify-between p-3 bg-muted/40 rounded hover:bg-muted/60 transition">
      <div>
        <p className="font-medium capitalize">{monthName}</p>
        <p className="text-xs text-muted-foreground">
          {month.count} Belege • Eingang: {formatEUR(month.eingang_gross)} • Ausgang:{" "}
          {formatEUR(month.ausgang_gross)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatEUR(month.gross)}</p>
        <p className="text-xs text-muted-foreground">USt: {formatEUR(month.vat)}</p>
      </div>
    </div>
  );
}

function getQuarterMonths(q: number): string {
  const months = [
    "Jan–Mär",
    "Apr–Jun",
    "Jul–Sep",
    "Okt–Dez",
  ];
  return months[q - 1] || "";
}
