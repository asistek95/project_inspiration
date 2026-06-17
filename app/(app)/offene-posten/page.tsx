"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Landmark,
} from "lucide-react";
import { loadReceipts, upsertReceipt } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/utils";
import { buildSepaXML, downloadXML } from "@/lib/sepa";
import { DEMO_COMPANY } from "@/lib/demo-data";

export default function OffenePostenPage() {
  const [all, setAll] = useState<Receipt[]>([]);

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  const { forderungen, verbindlichkeiten } = useMemo(() => {
    const unpaid = all.filter(
      (r) => !r.paid_at && r.receipt_type === "Rechnung"
    );
    return {
      forderungen: unpaid.filter(
        (r) => r.invoice_type === "ausgang" || r.direction === "ausgang"
      ),
      verbindlichkeiten: unpaid.filter(
        (r) => r.invoice_type === "eingang" || r.direction === "eingang"
      ),
    };
  }, [all]);

  const totalForderungen = forderungen.reduce((s, r) => s + r.gross_amount, 0);
  const totalVerbindlichkeiten = verbindlichkeiten.reduce((s, r) => s + r.gross_amount, 0);
  const saldo = totalForderungen - totalVerbindlichkeiten;

  function markPaid(id: string) {
    const r = all.find((x) => x.id === id);
    if (!r) return;
    upsertReceipt({ ...r, paid_at: new Date().toISOString().slice(0, 10) });
    setAll(loadReceipts());
  }

  function sepaExport() {
    if (!verbindlichkeiten.length) {
      alert("Keine offenen Verbindlichkeiten für SEPA-Export.");
      return;
    }
    downloadXML(
      `sepa_verbindlichkeiten_${new Date().toISOString().slice(0, 10)}.xml`,
      buildSepaXML({
        debtorName: DEMO_COMPANY.company_name,
        debtorIban: "AT63201118278479 5500",
        receipts: verbindlichkeiten,
      })
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offene Posten</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Unbezahlte Rechnungen — Forderungen &amp; Verbindlichkeiten
          </p>
        </div>
        <button onClick={sepaExport} className="btn-secondary">
          <Landmark className="h-4 w-4" /> SEPA-Sammelzahlung
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <ArrowUpRight className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-700">{formatEUR(totalForderungen)}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Forderungen</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {forderungen.length} offene Ausgangsrechnungen
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Kunden schulden mir</div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <ArrowDownLeft className="h-5 w-5 text-red-500 mb-2" />
          <div className="text-2xl font-black text-red-700">{formatEUR(totalVerbindlichkeiten)}</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Verbindlichkeiten</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {verbindlichkeiten.length} offene Eingangsrechnungen
          </div>
          <div className="text-[10px] text-red-600 mt-1 font-medium">Ich schulde Lieferanten</div>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            saldo >= 0
              ? "border-brand-200 bg-brand-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <FileText
            className={`h-5 w-5 mb-2 ${saldo >= 0 ? "text-brand-500" : "text-amber-500"}`}
          />
          <div
            className={`text-2xl font-black ${
              saldo >= 0 ? "text-brand-700" : "text-amber-700"
            }`}
          >
            {saldo >= 0 ? "+" : ""}
            {formatEUR(saldo)}
          </div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Netto-Saldo</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Forderungen − Verbindlichkeiten
          </div>
          <div
            className={`text-[10px] mt-1 font-medium ${
              saldo >= 0 ? "text-brand-600" : "text-amber-600"
            }`}
          >
            {saldo >= 0 ? "Netto-Gläubiger" : "Netto-Schuldner"}
          </div>
        </div>
      </div>

      {/* Forderungen */}
      <OffeneTable
        title="Forderungen"
        subtitle="Kunden schulden mir Geld"
        icon={<ArrowUpRight className="h-4 w-4 text-emerald-500" />}
        rows={forderungen}
        amountColor="text-emerald-700"
        total={totalForderungen}
        onMarkPaid={markPaid}
        emptyText="Keine offenen Forderungen — alle Ausgangsrechnungen bezahlt"
      />

      {/* Verbindlichkeiten */}
      <OffeneTable
        title="Verbindlichkeiten"
        subtitle="Ich schulde Lieferanten Geld"
        icon={<ArrowDownLeft className="h-4 w-4 text-red-500" />}
        rows={verbindlichkeiten}
        amountColor="text-red-700"
        total={totalVerbindlichkeiten}
        onMarkPaid={markPaid}
        emptyText="Keine offenen Verbindlichkeiten — alle Eingangsrechnungen bezahlt"
      />
    </div>
  );
}

function OffeneTable({
  title,
  subtitle,
  icon,
  rows,
  amountColor,
  total,
  onMarkPaid,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: Receipt[];
  amountColor: string;
  total: number;
  onMarkPaid: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold">
          {title}{" "}
          <span className="text-slate-400 font-normal">({rows.length})</span>
        </h2>
        <span className="text-xs text-slate-400 ml-auto">{subtitle}</span>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                  Datum
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                  Lieferant / Kunde
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">
                  Rechnungsnr.
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">
                  Betrag
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">
                  Hinweise
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {formatDate(r.receipt_date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.supplier_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                    {r.receipt_number || "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${amountColor}`}>
                    {formatEUR(r.gross_amount)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {(r.warnings || []).length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {r.warnings![0]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onMarkPaid(r.id)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition font-medium"
                    >
                      Als bezahlt markieren
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600"
                >
                  Gesamt offen
                </td>
                <td className={`px-4 py-2.5 text-right font-black text-base ${amountColor}`}>
                  {formatEUR(total)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
