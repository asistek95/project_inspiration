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
} from "@/lib/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import { ConfidenceBadge, StatusBadge } from "@/components/Badges";
import { formatEUR } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

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
          <h2 className="font-semibold">Erkannte Daten</h2>
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
              <select className="input" value={receipt.payment_method} onChange={(e) => update({ payment_method: e.target.value as any })}>
                {PAYMENT_METHODS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
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

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <button className="btn-primary" onClick={() => save("geprueft")}>
              <CheckCircle2 className="h-4 w-4" /> Stimmt alles
            </button>
            <button className="btn-secondary" onClick={() => save("unsicher")}>
              <AlertTriangle className="h-4 w-4" /> Unsicher
            </button>
            <button className="btn-secondary" onClick={() => save("freigegeben")}>
              <Send className="h-4 w-4" /> An Steuerberater
            </button>
            <button className="btn-ghost" onClick={() => save()}>
              Speichern
            </button>
          </div>
        </div>
      </div>

      <AuditTrail receipt={receipt} />

      <Disclaimer />
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
