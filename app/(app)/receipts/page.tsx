"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Download,
  Send,
  X,
  ChevronDown,
} from "lucide-react";
import { loadReceipts, deleteReceipts, setStatusBulk } from "@/lib/store";
import { CATEGORIES, STATUS_LABEL } from "@/lib/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import { StatusBadge, ConfidenceBadge } from "@/components/Badges";
import { formatDate, formatEUR } from "@/lib/utils";
import { exportCSV } from "@/lib/pdf";

export default function ReceiptsListPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (filterCat !== "all" && r.category !== filterCat) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (from && r.receipt_date < from) return false;
      if (to && r.receipt_date > to) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !r.supplier_name.toLowerCase().includes(s) &&
          !r.category.toLowerCase().includes(s) &&
          !(r.notes || "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [all, search, filterCat, filterStatus, from, to]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  function reload() {
    setAll(loadReceipts());
    setSelected(new Set());
  }

  function bulkSetStatus(status: ReceiptStatus) {
    setStatusBulk(Array.from(selected), status);
    reload();
  }

  function bulkDelete() {
    if (!confirm(`${selected.size} Belege wirklich löschen?`)) return;
    deleteReceipts(Array.from(selected));
    reload();
  }

  function bulkExportCSV() {
    const sel = filtered.filter((r) => selected.has(r.id));
    exportCSV(sel.length ? sel : filtered, "belege_auswahl.csv");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Belegliste</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} von {all.length} Belegen
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload" className="btn-primary">
            + Beleg hinzufügen
          </Link>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="card p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="input pl-10"
              placeholder="Lieferant, Kategorie, Notiz suchen …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn-secondary"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" /> Filter <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        {showFilters ? (
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
            <div>
              <label className="label">Kategorie</label>
              <select className="input" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="all">Alle</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Alle</option>
                {(Object.keys(STATUS_LABEL) as ReceiptStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Von</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Bis</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Bulk Bar */}
      {selected.size > 0 ? (
        <div className="card-soft p-3 flex flex-wrap items-center gap-2 bg-brand-50/50 border-brand-200">
          <span className="text-sm font-medium pl-1">{selected.size} ausgewählt</span>
          <div className="flex-1" />
          <button className="btn-secondary !py-2" onClick={() => bulkSetStatus("geprueft")}>
            <CheckCircle2 className="h-4 w-4" /> Als geprüft markieren
          </button>
          <button className="btn-secondary !py-2" onClick={() => bulkSetStatus("freigegeben")}>
            <Send className="h-4 w-4" /> An Steuerberater freigeben
          </button>
          <button className="btn-secondary !py-2" onClick={bulkExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button className="btn-ghost !py-2 text-danger" onClick={bulkDelete}>
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
          <button className="btn-ghost !p-2" onClick={() => setSelected(new Set())}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Tabelle (Desktop) */}
      <div className="card overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3">Datum</th>
              <th className="p-3">Lieferant</th>
              <th className="p-3">Kategorie</th>
              <th className="p-3 text-right">Brutto</th>
              <th className="p-3 text-right">MwSt.</th>
              <th className="p-3">Status</th>
              <th className="p-3">Confidence</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-slate-50/60">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="p-3 whitespace-nowrap">{formatDate(r.receipt_date)}</td>
                <td className="p-3 font-medium">{r.supplier_name}</td>
                <td className="p-3 text-slate-600">{r.category}</td>
                <td className="p-3 text-right font-medium">{formatEUR(r.gross_amount)}</td>
                <td className="p-3 text-right text-slate-600">{formatEUR(r.vat_amount)}</td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-3">
                  <ConfidenceBadge value={r.confidence_score} />
                </td>
                <td className="p-3 text-right">
                  <Link href={`/receipts/${r.id}`} className="text-brand-600 font-medium hover:underline">
                    Öffnen
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-muted-foreground">
                  Keine Belege gefunden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Karten (Mobile) */}
      <div className="space-y-2 md:hidden">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/receipts/${r.id}`}
            className="card p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{r.supplier_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(r.receipt_date)} · {r.category}
              </p>
              <div className="mt-1">
                <StatusBadge status={r.status} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{formatEUR(r.gross_amount)}</p>
              <p className="text-xs text-muted-foreground">MwSt. {formatEUR(r.vat_amount)}</p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-muted-foreground">Keine Belege gefunden.</div>
        ) : null}
      </div>
    </div>
  );
}
