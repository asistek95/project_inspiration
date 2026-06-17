"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Globe,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { loadReceipts, upsertReceipt } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { findAllRC, type RCResult } from "@/lib/reverse-charge";

type RCStatus = "detected" | "confirmed" | "rejected" | "needs_review";

interface RCCase {
  receipt: Receipt;
  rc: RCResult;
  status: RCStatus;
}

function getRCStatus(receipt: Receipt, rc: RCResult): RCStatus {
  const stored = (receipt as any).rc_status as RCStatus | undefined;
  if (stored) return stored;
  if (rc.requiresManualReview) return "needs_review";
  return "detected";
}

export default function ReverseChargePage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { setAll(loadReceipts()); }, []);

  const cases = useMemo<RCCase[]>(() => {
    return findAllRC(all).map(({ receipt, rc }) => ({
      receipt,
      rc,
      status: getRCStatus(receipt, rc),
    }));
  }, [all]);

  const confirmed = cases.filter((c) => c.status === "confirmed").length;
  const needsReview = cases.filter((c) => c.status === "needs_review" || c.status === "detected").length;
  const rejected = cases.filter((c) => c.status === "rejected").length;

  const totalNetRC = cases
    .filter((c) => c.status !== "rejected")
    .reduce((s, c) => s + c.rc.netAmount, 0);
  const totalVatRC = cases
    .filter((c) => c.status !== "rejected")
    .reduce((s, c) => s + c.rc.calculatedVat, 0);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setStatus(receipt: Receipt, status: RCStatus) {
    upsertReceipt({ ...receipt, rc_status: status } as any);
    setAll(loadReceipts());
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Österreich § 19 UStG
        </p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Reverse-Charge-Engine</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Automatische Erkennung und Prüfung von Steuerschuldnerschaft des Leistungsempfängers
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Globe className="h-4 w-4 text-brand-500 mb-2" />
          <div className="text-2xl font-black text-slate-800">{cases.length}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">RC-Fälle erkannt</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-700">{confirmed}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Bestätigt</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-4 w-4 text-amber-500 mb-2" />
          <div className="text-2xl font-black text-amber-700">{needsReview}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Prüfung nötig</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <ShieldCheck className="h-4 w-4 text-brand-500 mb-2" />
          <div className="text-lg font-black text-brand-700">{formatEUR(totalVatRC)}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">USt rechnerisch</div>
          <div className="text-[10px] text-slate-400">auf {formatEUR(totalNetRC)} Netto</div>
        </div>
      </div>

      {/* Erklärung */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 flex gap-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Was ist Reverse Charge?</strong> Bei Dienstleistungen von ausländischen Anbietern
          (Google, Meta, OpenAI, Adobe, …) schuldet nicht der Lieferant, sondern du die österreichische
          Umsatzsteuer (§ 19 UStG). Die Steuer muss in der UVA gemeldet werden — auch wenn kein Geld
          fließt. Vorsteuer ist in der Regel gleichzeitig abzugsfähig → Saldo 0.
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm">
          <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
          Keine Reverse-Charge-Fälle erkannt
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <RCCard
              key={c.receipt.id}
              c={c}
              expanded={expanded.has(c.receipt.id)}
              onToggle={() => toggleExpand(c.receipt.id)}
              onConfirm={() => setStatus(c.receipt, "confirmed")}
              onReject={() => setStatus(c.receipt, "rejected")}
              onNeedsReview={() => setStatus(c.receipt, "needs_review")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RCCard({
  c,
  expanded,
  onToggle,
  onConfirm,
  onReject,
  onNeedsReview,
}: {
  c: RCCase;
  expanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onNeedsReview: () => void;
}) {
  const statusCfg: Record<RCStatus, { label: string; color: string; bg: string; border: string; Icon: any }> = {
    confirmed: { label: "Bestätigt", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", Icon: CheckCircle2 },
    rejected: { label: "Abgelehnt", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", Icon: XCircle },
    needs_review: { label: "Prüfung nötig", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", Icon: AlertTriangle },
    detected: { label: "Erkannt", color: "text-brand-700", bg: "bg-brand-50", border: "border-brand-200", Icon: Clock },
  };

  const s = statusCfg[c.status];
  const pct = Math.round(c.rc.confidence * 100);

  return (
    <div className={cn("rounded-xl border bg-white overflow-hidden transition", c.status === "rejected" && "opacity-60")}>
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition text-left"
      >
        <span className={cn("h-7 w-7 rounded-lg grid place-content-center shrink-0", s.bg, s.border, "border")}>
          <s.Icon className={cn("h-3.5 w-3.5", s.color)} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">{c.receipt.supplier_name}</p>
          <p className="text-xs text-slate-400 truncate">
            {c.receipt.receipt_date} · {formatEUR(c.rc.netAmount)} Netto · {c.rc.reason}
          </p>
        </div>

        {/* Confidence badge */}
        <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
          KI: {pct}%
        </span>

        {/* Status badge */}
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0", s.bg, s.color, "border", s.border)}>
          {s.label}
        </span>

        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4">
          {/* Steuerwirkung */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Steuerwirkung</p>
              <TaxRow label="Netto" value={formatEUR(c.rc.netAmount)} />
              <TaxRow label="USt rechnerisch (20%)" value={formatEUR(c.rc.calculatedVat)} hint="muss in UVA gemeldet werden" />
              <TaxRow label="Vorsteuer abzugsfähig" value={formatEUR(c.rc.deductibleVat)} color="text-emerald-700" />
              {c.rc.nonDeductibleVat > 0 && (
                <TaxRow label="Nicht abzugsfähig" value={formatEUR(c.rc.nonDeductibleVat)} color="text-red-600" />
              )}
              <div className="border-t border-slate-200 pt-1.5 mt-1">
                <TaxRow
                  label="Saldo"
                  value={c.rc.saldo === 0 ? "0 € (neutral)" : formatEUR(c.rc.saldo) + " Zahllast"}
                  color={c.rc.saldo === 0 ? "text-emerald-700" : "text-red-600"}
                  bold
                />
              </div>
              {c.rc.saldo === 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  USt-Schuld und Vorsteuer heben sich auf → steuerlich neutral, aber UVA-Meldung erforderlich
                </p>
              )}
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pflichtprüfung</p>
              <CheckRow ok={c.rc.country !== "AT"} label="Lieferant im Ausland" />
              <CheckRow ok={!!c.rc.customerVatId} label="UID des Unternehmens auf Rechnung" />
              <CheckRow ok={!((c.receipt.vat_amount ?? 0) > 0 && !c.rc.matchedKeyword)} label="Keine österreichische USt ausgewiesen" />
              <CheckRow ok={!!c.rc.matchedKeyword} label="RC-Hinweis auf Rechnung" warn={!c.rc.matchedKeyword} />
              <CheckRow ok={c.rc.serviceType === "digital_service"} label="Dienstleistung (nicht Ware)" warn />
              <CheckRow ok={true} label="Vorsteuer gleichzeitig abzugsfähig" />
            </div>
          </div>

          {/* Warnungen */}
          {c.rc.warnings.length > 0 && (
            <div className="space-y-1">
              {c.rc.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Audit Trail */}
          <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            <strong className="text-slate-500">Audit-Trail:</strong> OCR erkannt: {c.receipt.supplier_name} ·
            KI-Confidence: {pct}% · Grund: {c.rc.reason} ·
            Service-Typ: {c.rc.serviceType} · Land: {c.rc.country}
            {c.rc.supplierVatId && ` · Lieferant-UID: ${c.rc.supplierVatId}`}
          </div>

          {/* Actions */}
          {c.status !== "confirmed" && c.status !== "rejected" && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={onConfirm} className="btn-primary text-sm">
                <CheckCircle2 className="h-4 w-4" /> Reverse Charge bestätigen
              </button>
              <button onClick={onReject} className="btn-secondary text-sm">
                <XCircle className="h-4 w-4" /> Kein Reverse Charge
              </button>
            </div>
          )}
          {c.status === "confirmed" && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Bestätigt — wird in UVA-Auswertung berücksichtigt
              <button onClick={onNeedsReview} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}
          {c.status === "rejected" && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <XCircle className="h-4 w-4" />
              Als kein Reverse Charge markiert
              <button onClick={onNeedsReview} className="ml-auto text-xs hover:text-slate-600">
                Rückgängig
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaxRow({ label, value, hint, color, bold }: { label: string; value: string; hint?: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-500">{label}{hint && <span className="text-[10px] text-slate-400 block">{hint}</span>}</span>
      <span className={cn("text-xs font-semibold text-right", color ?? "text-slate-700", bold && "font-black text-sm")}>{value}</span>
    </div>
  );
}

function CheckRow({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : warn ? (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
      )}
      <span className={ok ? "text-slate-600" : warn ? "text-amber-700" : "text-red-600"}>{label}</span>
    </div>
  );
}
