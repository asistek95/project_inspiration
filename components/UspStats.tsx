"use client";

import {
  TrendingUp,
  Receipt as ReceiptIcon,
  PiggyBank,
  RefreshCw,
  AlertTriangle,
  Target,
  Gauge,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { computeUspStats } from "@/lib/usp-stats";
import { formatEUR } from "@/lib/utils";
import type { Receipt } from "@/lib/types";

/**
 * USP-Stats — die Kennzahlen, die uns von DATEV / sevDesk / lexoffice abheben.
 * Vorhersage, Steuer-Ersparnis, Branchen-Benchmark, Confidence-gewichtet.
 */
export function UspStats({ receipts }: { receipts: Receipt[] }) {
  const s = computeUspStats(receipts);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Klarblick-Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kennzahlen, die andere Buchhaltungs-Tools nicht liefern — basierend auf deinen Belegen.
          </p>
        </div>
        <span className="pill bg-brand-50 text-brand-700 border border-brand-100 text-[11px]">
          BETA · KI-Modelle
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <UspCard
          Icon={TrendingUp}
          accent="brand"
          label="Cashflow-Prognose (30 Tage)"
          value={formatEUR(s.cashflow_forecast_30d)}
          sub="Gewichteter Schnitt der letzten 3 Monate"
        />
        <UspCard
          Icon={PiggyBank}
          accent="accent"
          label="Geschätzte Steuer-Ersparnis"
          value={formatEUR(s.tax_saving_estimate)}
          sub="Betriebsausgaben × 23 % (KöSt + grobe ESt)"
        />
        <UspCard
          Icon={ReceiptIcon}
          accent="brand"
          label="Vorsteuer-Rückerstattung"
          value={formatEUR(s.vat_refund)}
          sub="Aus erfasster MwSt. — UVA-bereit"
        />
        <UspCard
          Icon={RefreshCw}
          accent="muted"
          label="Fixkosten-Anteil"
          value={`${s.recurring_share_pct} %`}
          sub="Abos, Miete, Telefon, Versicherungen"
        />
        <UspCard
          Icon={Gauge}
          accent="brand"
          label="Belastbare Brutto-Summe"
          value={formatEUR(s.weighted_total)}
          sub="Confidence-gewichtet (unsichere zählen weniger)"
        />
        <UspCard
          Icon={AlertTriangle}
          accent={s.advisor_risk_count > 5 ? "warn" : "muted"}
          label="Steuerberater-Risiken"
          value={String(s.advisor_risk_count)}
          sub="Belege mit fehlender MwSt., unsicher oder > 1.000 € ohne Rechnung"
        />

        {/* Branchen-Benchmark */}
        <div className="card-soft p-4 md:col-span-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <Target className="h-3.5 w-3.5" /> Branchen-Benchmark
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">
                {s.material_ratio.value_pct} %{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  Material- &amp; Wareneinkauf
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Typisch für AT-Handwerk: {s.material_ratio.benchmark_pct} %
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  s.material_ratio.value_pct > s.material_ratio.benchmark_pct + 10
                    ? "text-warn"
                    : s.material_ratio.value_pct < s.material_ratio.benchmark_pct - 10
                      ? "text-accent"
                      : "text-slate-600"
                }`}
              >
                {s.material_ratio.value_pct - s.material_ratio.benchmark_pct >= 0 ? "+" : ""}
                {s.material_ratio.value_pct - s.material_ratio.benchmark_pct} pp
              </p>
              <p className="text-[11px] text-muted-foreground">vs. Median KMU</p>
            </div>
          </div>
          {/* Benchmark Bar */}
          <div className="mt-3 relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-accent"
              style={{ width: `${Math.min(s.material_ratio.value_pct, 100)}%` }}
            />
            <div
              className="absolute top-[-2px] h-3 w-0.5 bg-foreground"
              style={{ left: `${s.material_ratio.benchmark_pct}%` }}
              title={`Branchen-Median: ${s.material_ratio.benchmark_pct} %`}
            />
          </div>
        </div>

        {/* Time-to-advisor */}
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" /> Steuerberater-Übergabe in
          </div>
          <p className="mt-2 text-2xl font-bold">
            {s.days_to_advisor_ready === 0 ? "Heute" : `${s.days_to_advisor_ready} Tagen`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            bei 5 geprüften Belegen pro Tag
          </p>
        </div>
      </div>

      {/* Biggest jump CTA */}
      {s.biggest_jump && (
        <div className="card p-4 border-warn/30 bg-warn-soft/40 flex items-start gap-3">
          <span className="h-9 w-9 rounded-lg bg-warn/15 text-warn grid place-content-center shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              Größter Kostensprung: <span className="text-warn">{s.biggest_jump.supplier}</span> +
              {s.biggest_jump.delta_pct} %
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aktuell {formatEUR(s.biggest_jump.current)} — prüfe, ob die Steigerung gewollt ist.
            </p>
          </div>
          <a
            href="/receipts"
            className="text-xs font-semibold text-brand-700 hover:underline inline-flex items-center gap-1"
          >
            Belege ansehen <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
}

function UspCard({
  Icon,
  label,
  value,
  sub,
  accent,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent: "brand" | "accent" | "warn" | "muted";
}) {
  const colors = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    muted: "bg-slate-100 text-slate-600",
  }[accent];
  return (
    <div className="card-soft p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <span className={`h-8 w-8 rounded-lg ${colors} grid place-content-center`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>
    </div>
  );
}
