"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, TrendingUp } from "lucide-react";
import type { Receipt } from "@/lib/types";
import { cn, formatEUR } from "@/lib/utils";

interface Props {
  receipts: Receipt[];
  month?: number;
  year?: number;
}

type AmpelStatus = "gruen" | "gelb" | "rot";

interface Check {
  label: string;
  ok: boolean;
  warn?: boolean;
  count?: number;
  href?: string;
}

interface AmpelResult {
  status: AmpelStatus;
  score: number;
  checks: Check[];
  monthName: string;
  totalReceipts: number;
  geprueft: number;
  umsatz: number;
  kosten: number;
}

export function MonatsabschlussAmpel({ receipts, month, year }: Props) {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const result = useMemo<AmpelResult>(() => {
    const monthName = new Date(y, m - 1).toLocaleString("de-AT", { month: "long" });
    const mr = receipts.filter((r) => {
      const d = new Date(r.receipt_date);
      return d.getMonth() + 1 === m && d.getFullYear() === y;
    });

    const total = mr.length;
    const geprueft = mr.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length;
    const unsicher = mr.filter((r) => r.status === "unsicher").length;
    const ungeprueft = mr.filter((r) => r.status === "ungeprueft").length;
    const ohneKat = mr.filter((r) => !r.category || r.category === "Sonstiges").length;
    const offene = mr.filter((r) => !r.paid_at && r.receipt_type === "Rechnung").length;
    const mitWarnings = mr.filter((r) => (r.warnings || []).length > 0).length;
    const reverseCharge = mr.filter((r) =>
      (r.warnings || []).some((w) => w.toLowerCase().includes("reverse charge"))
    ).length;

    const ausgang = mr.filter((r) => r.invoice_type === "ausgang" || r.direction === "ausgang");
    const eingang = mr.filter((r) => r.invoice_type === "eingang" || r.direction === "eingang");

    const checks: Check[] = [
      {
        label: `Alle Belege geprüft (${geprueft}/${total})`,
        ok: ungeprueft === 0 && unsicher === 0,
        warn: unsicher > 0,
        count: ungeprueft + unsicher,
        href: ungeprueft + unsicher > 0 ? "/receipts?filter=ungeprueft" : undefined,
      },
      {
        label: "Kategorien vollständig zugeordnet",
        ok: ohneKat === 0,
        count: ohneKat,
        href: ohneKat > 0 ? "/receipts?cat=missing" : undefined,
      },
      {
        label: `Offene Rechnungen geprüft`,
        ok: offene === 0,
        warn: offene > 0,
        count: offene,
        href: offene > 0 ? "/offene-posten" : undefined,
      },
      {
        label: "Steuerliche Hinweise geprüft",
        ok: mitWarnings === 0,
        warn: mitWarnings > 0,
        count: mitWarnings,
        href: mitWarnings > 0 ? "/receipts" : undefined,
      },
    ];

    if (reverseCharge > 0) {
      checks.push({
        label: `Reverse-Charge-Eigenberechnung (${reverseCharge} Belege)`,
        ok: false,
        warn: true,
        count: reverseCharge,
        href: "/uva",
      });
    }

    const okCount = checks.filter((c) => c.ok).length;
    const score = total === 0 ? 0 : Math.round((okCount / checks.length) * 100);

    let status: AmpelStatus;
    if (total === 0 || ungeprueft > 5) status = "rot";
    else if (score === 100) status = "gruen";
    else if (score >= 60) status = "gelb";
    else status = "rot";

    return {
      status,
      score,
      checks,
      monthName,
      totalReceipts: total,
      geprueft,
      umsatz: ausgang.reduce((s, r) => s + r.gross_amount, 0),
      kosten: eingang.reduce((s, r) => s + r.gross_amount, 0),
    };
  }, [receipts, m, y]);

  const cfg: Record<AmpelStatus, { border: string; bg: string; dot: string; text: string; badge: string; label: string; sub: string }> = {
    gruen: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      dot: "bg-emerald-500 shadow-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
      label: "Übergabefähig",
      sub: "Alle Schritte erledigt — Monat kann an den Steuerberater übergeben werden",
    },
    gelb: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      dot: "bg-amber-400 shadow-amber-200",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      label: "Fast fertig",
      sub: "Noch ein paar Punkte offen — danach sofort übergabefähig",
    },
    rot: {
      border: "border-red-200",
      bg: "bg-red-50",
      dot: "bg-red-500 shadow-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
      label: "Nicht abschließbar",
      sub: "Offene Punkte müssen zuerst erledigt werden",
    },
  };

  const c = cfg[result.status];

  return (
    <div className={cn("rounded-xl border p-4 space-y-4", c.border, c.bg)}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={cn("h-4 w-4 rounded-full shrink-0 shadow-lg", c.dot)} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-lg font-bold", c.text)}>{c.label}</span>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", c.badge)}>
                {result.monthName} {y}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{c.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score ring */}
          <div className="text-right">
            <div className={cn("text-3xl font-black leading-none", c.text)}>{result.score}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Abschluss-Score</div>
          </div>
          {result.status === "gruen" && (
            <Link href="/tax-advisor" className="btn-primary">
              Monat freigeben <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {result.status !== "gruen" && (
            <Link href="/tax-advisor" className="btn-secondary text-sm">
              Zur Übergabe
            </Link>
          )}
        </div>
      </div>

      {/* Mini KPIs */}
      {result.totalReceipts > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/70 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-slate-800">{result.totalReceipts}</div>
            <div className="text-[10px] text-slate-500">Belege</div>
          </div>
          <div className="bg-white/70 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-emerald-700">{formatEUR(result.umsatz)}</div>
            <div className="text-[10px] text-slate-500">Umsatz</div>
          </div>
          <div className="bg-white/70 rounded-lg px-3 py-2 text-center">
            <div className="text-base font-bold text-red-700">{formatEUR(result.kosten)}</div>
            <div className="text-[10px] text-slate-500">Kosten</div>
          </div>
        </div>
      )}

      {/* Checkliste */}
      <div className="grid sm:grid-cols-2 gap-1.5">
        {result.checks.map((check, i) => {
          const inner = (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition",
                check.ok
                  ? "bg-white/60 text-emerald-800"
                  : check.warn
                  ? "bg-white/80 text-amber-800 hover:bg-white"
                  : "bg-white/80 text-red-800 hover:bg-white"
              )}
            >
              {check.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : check.warn ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span className="flex-1 font-medium">{check.label}</span>
              {check.count !== undefined && check.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    check.warn ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {check.count}
                </span>
              )}
              {!check.ok && check.href && <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />}
            </div>
          );

          return check.href && !check.ok ? (
            <Link href={check.href} key={i}>
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>

      {result.totalReceipts === 0 && (
        <div className="text-center py-2">
          <Link href="/upload" className="btn-primary text-sm">
            Ersten Beleg hochladen
          </Link>
        </div>
      )}
    </div>
  );
}
