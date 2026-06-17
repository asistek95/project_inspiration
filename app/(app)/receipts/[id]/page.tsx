"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRole } from "@/hooks/useRole";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  History,
  Lock,
  Download,
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
  getCategoriesForDirection,
  RECHNUNG_SUBTYP_HINT,
} from "@/lib/types";
import type { Receipt, ReceiptStatus, ReceiptDirection, RechnungSubtyp } from "@/lib/types";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";
import { formatEUR, formatDate } from "@/lib/utils";
import { Select } from "@/components/Select";
export default function ReceiptDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const { permissions } = useRole();

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
        {permissions.canDelete && (
          <button onClick={remove} className="btn-ghost text-danger">
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
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
        {/* Vorschau — echter Beleg */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-700">Belegvorschau</h2>
            {receipt.receipt_number && (
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded">
                {receipt.receipt_number}
              </span>
            )}
          </div>

          <div className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden" style={{ minHeight: "320px" }}>
            {receipt.file_url ? (
              receipt.file_name?.toLowerCase().endsWith(".pdf") ? (
                <div className="flex flex-col h-full" style={{ minHeight: "400px" }}>
                  <iframe
                    src={`${receipt.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                    title={receipt.file_name}
                    className="w-full flex-1 rounded border-0"
                    style={{ minHeight: "380px" }}
                  />
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <a href={receipt.file_url} target="_blank" rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline py-1">
                      PDF in neuem Tab öffnen →
                    </a>
                    <a
                      href={receipt.file_url}
                      download={receipt.file_name || "beleg.pdf"}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> Herunterladen
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <img
                    src={receipt.file_url}
                    alt={receipt.file_name || "Beleg"}
                    className="w-full object-contain"
                    style={{ maxHeight: "440px" }}
                  />
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <a href={receipt.file_url} target="_blank" rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline py-1">
                      In neuem Tab öffnen →
                    </a>
                    <a
                      href={receipt.file_url}
                      download={receipt.file_name || "beleg"}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> Herunterladen
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-slate-400" style={{ minHeight: "280px" }}>
                <FileText className="h-10 w-10" />
                <p className="text-sm text-center">Kein Beleg hochgeladen</p>
                <p className="text-xs text-center text-slate-300">{receipt.file_name}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ConfidenceBadge value={receipt.confidence_score} />
            <StatusBadge status={receipt.status} />
            {receipt.vendor_uid && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{receipt.vendor_uid}</span>
            )}
          </div>

          {receipt.warnings.length > 0 && (
            <div className="rounded border border-slate-200 bg-slate-50 p-2.5 space-y-1">
              {receipt.warnings.map((w, i) => (
                <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {w}
                </p>
              ))}
            </div>
          )}
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

          {/* Direction — kompakt */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500 font-medium shrink-0">Belegart:</span>
            <div className="flex gap-1.5 flex-1">
              {DIRECTIONS.map((d) => {
                const current = (receipt.direction || "eingang") === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update({ direction: d })}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold border transition ${
                      current ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {DIRECTION_FRIENDLY[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OCR-Erkennungs-Info */}
          {(receipt.invoice_type_reason || receipt.recipient_name || receipt.original_invoice_number || receipt.vendor_uid) && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-1.5 text-xs">
              {receipt.original_invoice_number && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-semibold shrink-0 w-24">Orig.-Nr.</span>
                  <span className="font-mono font-bold text-blue-800">{receipt.original_invoice_number}</span>
                </div>
              )}
              {receipt.supplier_name && receipt.vendor_uid && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-semibold shrink-0 w-24">Aussteller</span>
                  <span className="text-slate-700">{receipt.supplier_name} <span className="font-mono text-slate-400 ml-1">{receipt.vendor_uid}</span></span>
                </div>
              )}
              {receipt.recipient_name && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-semibold shrink-0 w-24">Empfänger</span>
                  <span className="text-slate-700">{receipt.recipient_name}
                    {receipt.recipient_uid && <span className="font-mono text-slate-400 ml-1">{receipt.recipient_uid}</span>}
                  </span>
                </div>
              )}
              {receipt.invoice_type_reason && (
                <div className="flex items-start gap-2 pt-1 border-t border-blue-100">
                  <span className="text-blue-500 font-semibold shrink-0 w-24">Erkennung</span>
                  <span className="text-slate-600">{receipt.invoice_type_reason}</span>
                </div>
              )}
            </div>
          )}

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
              <Select
                value={receipt.category}
                onChange={(v) => update({ category: v as any })}
                options={[...getCategoriesForDirection((receipt as any).direction)]}
              />
            </Field>
            <Field label="Belegart">
              <Select
                value={receipt.receipt_type}
                onChange={(v) => update({ receipt_type: v as any })}
                options={[...RECEIPT_TYPES]}
              />
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
          <Field label="Eigene Kategorie (Freitext)">
            <input
              className="input"
              value={receipt.custom_category || ""}
              onChange={(e) => update({ custom_category: e.target.value || null })}
              placeholder="z.B. Caddy Kastenwagen, BMW 5er, Kundenbewirtung …"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Überschreibt die Kategorie in Auswertungen · Tipp: Fahrzeugbezeichnung → Vorsteuer auto-erkannt
            </p>
          </Field>

          {/* Vorsteuerabzug */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={receipt.vorsteuerabzug === true}
                onChange={(e) => update({ vorsteuerabzug: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Vorsteuerabzugsberechtigt
                <span className="text-slate-400 font-normal text-xs ml-1">§ 12 UStG</span>
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1.5 ml-6.5">
              Aktivieren wenn die Vorsteuer aus diesem Beleg beim Finanzamt geltend gemacht werden kann.
            </p>
          </div>

          <Field label="Notiz / Verwendungszweck">
            <textarea className="input" rows={3} value={receipt.notes || ""} onChange={(e) => update({ notes: e.target.value || null })} />
          </Field>

          <div className="rounded-lg bg-slate-50 border border-border p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Summe</span>
            <span className="font-bold text-lg">{formatEUR(receipt.gross_amount)}</span>
          </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border sticky bottom-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 -mx-5 px-5 py-3">
            {permissions.isReadOnly ? (
              <div className="flex-1 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5">
                <Lock className="h-4 w-4" />
                Steuerberater-Modus — nur Lesen. Änderungen nicht möglich.
              </div>
            ) : (
              <>
                {permissions.canApprove && (
                  <button className="btn-primary btn-lg flex-1 min-w-[180px]" onClick={() => save("geprueft")}>
                    <CheckCircle2 className="h-4 w-4" /> Stimmt alles
                  </button>
                )}
                <button className="btn-secondary btn-lg" onClick={() => save("unsicher")}>
                  <AlertTriangle className="h-4 w-4" /> Unsicher
                </button>
                {permissions.canHandover && (
                  <button className="btn-secondary btn-lg" onClick={() => save("freigegeben")}>
                    <Send className="h-4 w-4" /> An Steuerberater
                  </button>
                )}
              </>
            )}
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
