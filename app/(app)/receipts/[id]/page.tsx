"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  History,
  Lock,
} from "lucide-react";
import { ReceiptPaper } from "@/components/ReceiptPaper";
import {
  loadReceipts,
  updateReceipt,
  deleteReceipts,
} from "@/lib/store";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  RECEIPT_TYPES,
  DIRECTIONS,
  DIRECTION_LABEL,
  DIRECTION_FRIENDLY,
  DIRECTION_FRIENDLY_HINT,
  DIRECTION_EMOJI,
  RECHNUNG_SUBTYPEN,
  RECHNUNG_SUBTYP_LABEL,
  RECHNUNG_SUBTYP_HINT,
} from "@/lib/types";
import type { Receipt, ReceiptStatus, ReceiptDirection, RechnungSubtyp } from "@/lib/types";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";
import { formatEUR, formatDate } from "@/lib/utils";
export default function ReceiptDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    const all = loadReceipts();
    const r = all.find((x) => x.id === params.id) || null;
    setReceipt(r);
  }, [params.id]);

  if (!receipt) {
    return (
      <div className="card p-10 text-center text-muted-foreground">
        Beleg nicht gefunden. <Link href="/receipts" className="text-brand-600 underline">Zur Belegliste</Link>
      </div>
    );
  }

  function update(patch: Partial<Receipt>) {
    setReceipt((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function save(status?: ReceiptStatus) {
    if (!receipt) return;
    const final = status ? { ...receipt, status } : receipt;
    updateReceipt(final.id, final);
    setReceipt(final);
  }

  function remove() {
    if (!receipt) return;
    if (!confirm("Beleg wirklich löschen?")) return;
    deleteReceipts([receipt.id]);
    router.push("/receipts");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/receipts" className="btn-ghost !px-0">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <button onClick={remove} className="btn-ghost text-danger">
          <Trash2 className="h-4 w-4" /> Löschen
        </button>
      </div>

      {receipt.confidence_score < 0.7 ? (
        <div className="rounded-lg bg-warn-soft border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warn">Dieser Beleg sollte geprüft werden.</p>
            <p className="text-sm text-warn/90 mt-0.5">
              Die KI ist sich bei einigen Werten nicht sicher. Bitte Datum, MwSt. und Lieferant kontrollieren.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Vorschau */}
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Belegvorschau</h2>
          <div className="rounded-lg border border-border bg-gradient-to-br from-slate-100 to-slate-50 aspect-[3/4] grid place-content-center p-4 overflow-hidden">
            {receipt.file_url ? (
              <img src={receipt.file_url} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <ReceiptPaper receipt={receipt} tilt={-1.5} />
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ConfidenceBadge value={receipt.confidence_score} />
            <StatusBadge status={receipt.status} />
          </div>
          {receipt.warnings.length > 0 ? (
            <ul className="mt-3 text-sm text-warn space-y-1 list-disc list-inside">
              {receipt.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Daten */}
        <div className="card p-5 space-y-4">
          {/* Summary — immer sichtbar, Klartext */}
          <div className="rounded-xl bg-gradient-to-br from-brand-50/60 to-white border border-brand-100 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              {DIRECTION_EMOJI[(receipt.direction || "eingang") as ReceiptDirection]}{" "}
              {DIRECTION_FRIENDLY[(receipt.direction || "eingang") as ReceiptDirection]}
            </div>
            <div className="text-2xl font-bold leading-tight truncate" title={receipt.supplier_name}>
              {receipt.supplier_name || "Unbekannter Lieferant"}
            </div>
            <div className="text-3xl font-extrabold text-brand-700 mt-1">
              {formatEUR(receipt.gross_amount)}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {formatDate(receipt.receipt_date)} · {receipt.category}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge status={receipt.status} />
              <ConfidenceBadge value={receipt.confidence_score} />
              {receipt.receipt_number ? (
                <span className="text-xs text-slate-500 font-mono">{receipt.receipt_number}</span>
              ) : null}
            </div>
          </div>

          {/* Direction-Toggle — groß, Klartext, das WICHTIGSTE Feld */}
          <div>
            <label className="label">Was ist das für ein Beleg?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DIRECTIONS.map((d) => {
                const current = (receipt.direction || "eingang") === d;
                const ringMap: Record<ReceiptDirection, string> = {
                  eingang: current ? "bg-blue-600 text-white border-blue-700" : "bg-white text-blue-900 border-slate-200 hover:border-blue-300",
                  ausgang: current ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-emerald-900 border-slate-200 hover:border-emerald-300",
                  neutral: current ? "bg-slate-700 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200 hover:border-slate-400",
                };
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update({ direction: d })}
                    className={`px-3 py-3 rounded-xl border-2 text-left transition shadow-sm min-h-[64px] ${ringMap[d]}`}
                  >
                    <div className="text-xl leading-none mb-1">{DIRECTION_EMOJI[d]}</div>
                    <div className="text-sm font-bold leading-tight">{DIRECTION_FRIENDLY[d]}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {DIRECTION_FRIENDLY_HINT[(receipt.direction || "eingang") as ReceiptDirection]}
            </p>
          </div>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/40">
            <summary className="cursor-pointer select-none flex items-center justify-between px-4 py-3 min-h-[44px] text-sm font-semibold text-slate-700 hover:bg-slate-100/60 rounded-lg">
              <span>Details bearbeiten (Lieferant, Beträge, Belegart …)</span>
              <span className="text-xs text-slate-400 group-open:rotate-180 transition">▾</span>
            </summary>
            <div className="px-4 pb-4 pt-1 space-y-4">
          <Field label="Lieferant">
            <input className="input" value={receipt.supplier_name} onChange={(e) => update({ supplier_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum">
              <input type="date" className="input" value={receipt.receipt_date} onChange={(e) => update({ receipt_date: e.target.value })} />
            </Field>
            <Field label="Kategorie">
              <select className="input" value={receipt.category} onChange={(e) => update({ category: e.target.value as any })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Belegart">
              <select className="input" value={receipt.receipt_type} onChange={(e) => update({ receipt_type: e.target.value as any })}>
                {RECEIPT_TYPES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Zahlungsart">
              <SegmentedControl
                options={PAYMENT_METHODS.map((p) => ({ value: p, label: p }))}
                value={receipt.payment_method}
                onChange={(v) => update({ payment_method: v as any })}
              />
            </Field>
          </div>

          {receipt.receipt_type === "Rechnung" ? (
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="label !mb-0">Rechnungs-Art</label>
                <span className="text-[10px] text-slate-400">
                  (Eingang/Ausgang oben wählen)
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {RECHNUNG_SUBTYPEN.map((s) => {
                  const current = (receipt.rechnung_subtyp || "standard") === s;
                  const label =
                    s === "standard"
                      ? receipt.direction === "ausgang"
                        ? "Ausgangsrechnung"
                        : receipt.direction === "eingang"
                        ? "Eingangsrechnung"
                        : "Standardrechnung"
                      : RECHNUNG_SUBTYP_LABEL[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update({ rechnung_subtyp: s })}
                      className={`px-2 py-1.5 rounded-md text-xs font-semibold transition ${
                        current
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {RECHNUNG_SUBTYP_HINT[(receipt.rechnung_subtyp || "standard") as RechnungSubtyp]}
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Netto">
              <input type="number" step="0.01" className="input" value={receipt.net_amount} onChange={(e) => update({ net_amount: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="MwSt.">
              <input type="number" step="0.01" className="input" value={receipt.vat_amount} onChange={(e) => update({ vat_amount: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Brutto">
              <input type="number" step="0.01" className="input" value={receipt.gross_amount} onChange={(e) => update({ gross_amount: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label="Projekt / Kostenstelle (optional)">
            <input className="input" value={receipt.project || ""} onChange={(e) => update({ project: e.target.value || null })} />
          </Field>
          <Field label="Notiz">
            <textarea className="input" rows={3} value={receipt.notes || ""} onChange={(e) => update({ notes: e.target.value || null })} />
          </Field>

          <div className="rounded-lg bg-slate-50 border border-border p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Summe</span>
            <span className="font-bold text-lg">{formatEUR(receipt.gross_amount)}</span>
          </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border sticky bottom-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 -mx-5 px-5 py-3">
            <button className="btn-primary btn-lg flex-1 min-w-[180px]" onClick={() => save("geprueft")}>
              <CheckCircle2 className="h-4 w-4" /> Stimmt alles
            </button>
            <button className="btn-secondary btn-lg" onClick={() => save("unsicher")}>
              <AlertTriangle className="h-4 w-4" /> Unsicher
            </button>
            <button className="btn-secondary btn-lg" onClick={() => save("freigegeben")}>
              <Send className="h-4 w-4" /> An Steuerberater
            </button>
          </div>
        </div>
      </div>

      <AuditTrail receipt={receipt} />
</div>
  );
}

function AuditTrail({ receipt }: { receipt: Receipt }) {
  if (!receipt.audit_log || receipt.audit_log.length === 0) return null;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-slate-500" />
        <h2 className="font-semibold">Änderungshistorie (GoBD)</h2>
        {receipt.locked ? (
          <span className="pill bg-slate-100 text-slate-600 border border-slate-200">
            <Lock className="h-3 w-3" /> Gesperrt
          </span>
        ) : null}
      </div>
      <ul className="text-sm space-y-1.5 font-mono max-h-60 overflow-y-auto">
        {receipt.audit_log.map((e, i) => (
          <li key={i} className="text-xs text-slate-600">
            <span className="text-slate-400">
              {new Date(e.ts).toLocaleString("de-DE")}
            </span>{" "}
            · <span className="text-foreground font-semibold">{e.action}</span>
            {e.field ? <span> · {e.field}</span> : null}
            {e.before !== undefined && e.after !== undefined ? (
              <span className="text-slate-500">
                : "{e.before}" → "{e.after}"
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
      {options.map((o) => {
        const current = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex-1 min-w-fit ${
              current ? "bg-white shadow-sm text-foreground" : "text-slate-600 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
