"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Landmark,
  Upload as UploadIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  loadReceipts,
  loadBankTransactions,
  importBankTransactions,
  assignTransaction,
  dismissTransaction,
} from "@/lib/store";
import type { Receipt, BankTransaction } from "@/lib/types";
import { parseBankCSV, suggestMatch, toBankTransaction } from "@/lib/bank-import";
import { formatEUR, formatDate } from "@/lib/utils";
import { Select } from "@/components/Select";

type TabId = "offen" | "zugewiesen" | "eingehend";

export default function KontoauszuegePage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [txs, setTxs] = useState<BankTransaction[]>([]);
  const [tab, setTab] = useState<TabId>("offen");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  function reload() {
    setReceipts(loadReceipts());
    setTxs(loadBankTransactions());
  }

  useEffect(() => {
    reload();
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const text = await file.text();
    const { transactions, warnings } = parseBankCSV(text);
    if (transactions.length === 0) {
      setImportMsg(null);
      setImportWarnings(warnings.length ? warnings : ["Keine Transaktionen in der Datei gefunden."]);
      return;
    }
    const statementRef = file.name.replace(/\.csv$/i, "");
    const userId = (() => {
      try {
        return JSON.parse(localStorage.getItem("klarblick.profile") || "{}").id || "demo-user";
      } catch {
        return "demo-user";
      }
    })();
    const bankTxs = transactions.map((t) => toBankTransaction(t, statementRef, userId));
    const added = importBankTransactions(bankTxs);
    setImportMsg(`${added} neue Transaktion${added === 1 ? "" : "en"} aus „${file.name}" importiert.`);
    setImportWarnings(warnings);
    reload();
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  const outgoing = useMemo(() => txs.filter((t) => t.amount < 0 && !t.dismissed), [txs]);
  const incoming = useMemo(() => txs.filter((t) => t.amount > 0 && !t.dismissed), [txs]);
  const assigned = useMemo(() => txs.filter((t) => t.matched_receipt_id && !t.dismissed), [txs]);
  const openOutgoing = useMemo(
    () => outgoing.filter((t) => !t.matched_receipt_id),
    [outgoing],
  );

  const totalAssigned = assigned.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalOpen = openOutgoing.reduce((s, t) => s + Math.abs(t.amount), 0);

  const visible = tab === "offen" ? openOutgoing : tab === "zugewiesen" ? assigned : incoming;

  return (
    <div {...getRootProps()} className="space-y-6 relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-brand-600/20 backdrop-blur-sm grid place-content-center pointer-events-none">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl ring-2 ring-brand-500 text-center">
            <UploadIcon className="h-10 w-10 mx-auto text-brand-600 mb-2" />
            <p className="text-lg font-bold">Kontoauszug (CSV) hier fallenlassen</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontoauszüge</h1>
          <p className="text-muted-foreground mt-1">
            Bankauszug importieren und Transaktionen automatisch Belegen zuordnen
          </p>
        </div>
        <button type="button" onClick={open} className="btn-primary">
          <UploadIcon className="h-4 w-4" /> Kontoauszug importieren (CSV)
        </button>
      </div>

      {importMsg && (
        <div className="card-soft p-3 bg-emerald-50 border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {importMsg}
          <button onClick={() => setImportMsg(null)} className="ml-auto btn-ghost !p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {importWarnings.length > 0 && (
        <div className="card-soft p-3 bg-amber-50 border-amber-200 text-sm text-amber-700 space-y-1">
          {importWarnings.slice(0, 5).map((w, i) => (
            <p key={i} className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {w}
            </p>
          ))}
          <button onClick={() => setImportWarnings([])} className="text-xs underline text-amber-600">
            Ausblenden
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-700">{formatEUR(totalAssigned)}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Zugewiesen</div>
          <div className="text-xs text-slate-500 mt-0.5">{assigned.length} Transaktionen</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
          <div className="text-2xl font-black text-amber-700">{formatEUR(totalOpen)}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Offen</div>
          <div className="text-xs text-slate-500 mt-0.5">{openOutgoing.length} ohne Beleg-Zuordnung</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <ArrowDownLeft className="h-5 w-5 text-blue-500 mb-2" />
          <div className="text-2xl font-black text-blue-700">{incoming.length}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Eingehend</div>
          <div className="text-xs text-slate-500 mt-0.5">Kundenzahlungen am Konto</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
        {([
          { id: "offen" as const, label: "Offen", count: openOutgoing.length },
          { id: "zugewiesen" as const, label: "Zugewiesen", count: assigned.length },
          { id: "eingehend" as const, label: "Eingehend", count: incoming.length },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
              tab === t.id ? "bg-white shadow-sm text-foreground" : "text-slate-600 hover:text-foreground"
            }`}
          >
            {t.label} <span className="text-xs text-slate-400 font-normal">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <div className="card p-10 text-center text-muted-foreground space-y-3">
            {txs.length === 0 ? (
              <>
                <Landmark className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700">Noch kein Kontoauszug importiert</p>
                <p className="text-sm">Lade eine CSV-Datei deiner Bank hoch — wir gleichen automatisch mit deinen Belegen ab.</p>
                <button onClick={open} className="btn-primary inline-flex mt-2">
                  <UploadIcon className="h-4 w-4" /> Kontoauszug importieren
                </button>
              </>
            ) : (
              <p className="text-sm">Keine Transaktionen in dieser Ansicht.</p>
            )}
          </div>
        ) : (
          visible.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              receipts={receipts}
              onReload={reload}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TransactionRow({
  tx,
  receipts,
  onReload,
}: {
  tx: BankTransaction;
  receipts: Receipt[];
  onReload: () => void;
}) {
  const matched = tx.matched_receipt_id ? receipts.find((r) => r.id === tx.matched_receipt_id) : null;
  const suggestion = !tx.matched_receipt_id ? suggestMatch(
    { booking_date: tx.booking_date, valuta_date: tx.valuta_date ?? null, amount: tx.amount, counterparty: tx.counterparty, purpose: tx.purpose, iban: tx.iban ?? null },
    receipts,
  ) : null;
  const [manualPick, setManualPick] = useState(false);

  const candidateOptions = receipts
    .filter((r) => !r.paid_at && Math.abs(r.gross_amount - Math.abs(tx.amount)) < 0.01)
    .map((r) => ({ value: r.id, label: `${r.supplier_name} · ${formatEUR(r.gross_amount)} · ${formatDate(r.receipt_date)}` }));

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`h-9 w-9 rounded-lg grid place-content-center shrink-0 ${
              tx.amount < 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
            }`}
          >
            {tx.amount < 0 ? <ArrowUpRight className="h-4 w-4 rotate-90" /> : <ArrowDownLeft className="h-4 w-4 rotate-90" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{tx.counterparty}</p>
            <p className="text-xs text-slate-500 truncate">
              {formatDate(tx.booking_date)} {tx.purpose ? `· ${tx.purpose}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold ${tx.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
            {tx.amount < 0 ? "−" : "+"}
            {formatEUR(Math.abs(tx.amount))}
          </p>
        </div>
      </div>

      {matched ? (
        <div className="flex items-center gap-2 text-sm pl-12">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-slate-600">Zugewiesen zu</span>
          <Link href={`/receipts/${matched.id}`} className="font-semibold text-brand-600 hover:underline">
            {matched.supplier_name}
          </Link>
          <button
            onClick={() => { assignTransaction(tx.id, null); onReload(); }}
            className="ml-auto text-xs text-slate-400 hover:text-red-600 underline"
          >
            Zuweisung aufheben
          </button>
        </div>
      ) : suggestion && !manualPick ? (
        <div className="flex items-center gap-2 text-sm pl-12 flex-wrap">
          <Sparkles className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="text-slate-600">Vorschlag:</span>
          <span className="font-semibold">{suggestion.receipt.supplier_name}</span>
          <span className="text-xs text-slate-400">({Math.round(suggestion.confidence * 100)}% sicher)</span>
          <button
            onClick={() => { assignTransaction(tx.id, suggestion.receipt.id, suggestion.confidence); onReload(); }}
            className="btn-secondary !py-1.5 !px-3 text-xs ml-auto"
          >
            Bestätigen
          </button>
          <button onClick={() => setManualPick(true)} className="text-xs text-slate-400 hover:text-foreground underline">
            Anderen Beleg wählen
          </button>
          <button
            onClick={() => { dismissTransaction(tx.id, true); onReload(); }}
            className="text-xs text-slate-400 hover:text-red-600 underline"
          >
            Kein Beleg nötig
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm pl-12 flex-wrap">
          {candidateOptions.length > 0 ? (
            <>
              <span className="text-slate-500 text-xs">Beleg zuweisen:</span>
              <Select
                value=""
                onChange={(id) => { assignTransaction(tx.id, id); onReload(); }}
                options={candidateOptions}
                placeholder="Beleg wählen …"
                className="max-w-xs"
              />
            </>
          ) : (
            <span className="text-xs text-slate-400">Kein passender offener Beleg (gleicher Betrag) gefunden.</span>
          )}
          {manualPick && (
            <button onClick={() => setManualPick(false)} className="text-xs text-slate-400 hover:text-foreground underline">
              Abbrechen
            </button>
          )}
          <button
            onClick={() => { dismissTransaction(tx.id, true); onReload(); }}
            className="text-xs text-slate-400 hover:text-red-600 underline ml-auto"
          >
            Kein Beleg nötig
          </button>
        </div>
      )}
    </div>
  );
}
