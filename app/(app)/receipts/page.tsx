"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
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
  Upload as UploadIcon,
  Loader2,
} from "lucide-react";
import { loadReceipts, deleteReceipts, setStatusBulk, upsertReceipt } from "@/lib/store";
import { CATEGORIES, STATUS_LABEL } from "@/lib/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import { StatusBadge, ConfidenceBadge } from "@/components/Badges";
import { formatDate, formatEUR } from "@/lib/utils";
import { exportCSV } from "@/lib/pdf";
import { extractReceiptData, findDuplicate } from "@/lib/ocr";
import { previewNext } from "@/lib/numbering";

export default function ReceiptsListPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<{ total: number; done: number } | null>(null);

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setImporting({ total: accepted.length, done: 0 });
    let done = 0;
    for (const file of accepted) {
      try {
        const extracted = await extractReceiptData(file);
        const existing = loadReceipts();
        const dupe = findDuplicate(extracted, existing);
        if (!dupe) {
          const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const draft: Receipt = {
            id,
            user_id: "demo-user",
            file_url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
            file_name: file.name,
            supplier_name: extracted.supplier_name,
            receipt_date: extracted.receipt_date,
            category: extracted.category,
            receipt_type: extracted.receipt_type,
            payment_method: extracted.payment_method,
            net_amount: extracted.net_amount,
            vat_amount: extracted.vat_amount,
            gross_amount: extracted.gross_amount,
            currency: "EUR",
            confidence_score: extracted.confidence_score,
            status: extracted.confidence_score < 0.7 ? "unsicher" : "ungeprueft",
            warnings: extracted.warnings,
            notes: null,
            project: null,
            receipt_number: previewNext(),
            payment_terms: extracted.payment_terms || null,
            is_recurring: !!extracted.is_recurring,
            paid_at: null,
            fingerprint: extracted.fingerprint,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          upsertReceipt(draft);
        }
      } catch {
        /* ignore single failure */
      }
      done += 1;
      setImporting({ total: accepted.length, done });
    }
    setAll(loadReceipts());
    setTimeout(() => setImporting(null), 1200);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".heic", ".heif"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
      "application/pdf": [".pdf"],
    },
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

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
    <div {...getRootProps()} className="space-y-5 relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-brand-600/20 backdrop-blur-sm grid place-content-center pointer-events-none">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl ring-2 ring-brand-500 text-center">
            <UploadIcon className="h-10 w-10 mx-auto text-brand-600 mb-2" />
            <p className="text-lg font-bold">Belege hier fallenlassen</p>
            <p className="text-xs text-slate-500 mt-1">PDF · JPG · PNG · HEIC · mehrere gleichzeitig</p>
          </div>
        </div>
      )}
      {importing && (
        <div className="card-soft p-3 bg-brand-50/60 border-brand-200 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <span className="text-sm font-medium">
            Importiere Belege … {importing.done}/{importing.total}
          </span>
          <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${(importing.done / importing.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-start justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Belegliste</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} von {all.length} Belegen
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={open} className="btn-secondary">
            <UploadIcon className="h-4 w-4" /> Dateien wählen
          </button>
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
        <div className="grid grid-cols-[40px_110px_1fr_160px_120px_100px_120px_140px_80px] items-center gap-3 px-5 py-3 bg-slate-50/60 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selected.size === filtered.length}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <span>Datum</span>
          <span>Lieferant</span>
          <span>Kategorie</span>
          <span className="text-right">Brutto</span>
          <span className="text-right">MwSt.</span>
          <span>Status</span>
          <span>Confidence</span>
          <span></span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-[40px_110px_1fr_160px_120px_100px_120px_140px_80px] items-center gap-3 px-5 py-3.5 transition group ${
                selected.has(r.id) ? "bg-brand-50/40" : "hover:bg-slate-50/60"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(r.receipt_date)}</span>
              <Link
                href={`/receipts/${r.id}`}
                className="font-semibold text-foreground hover:text-brand-600 truncate"
                title={r.supplier_name}
              >
                {r.supplier_name}
              </Link>
              <span className="text-sm text-slate-600 truncate">{r.category}</span>
              <span className="text-right font-semibold text-sm">{formatEUR(r.gross_amount)}</span>
              <span className="text-right text-sm text-slate-500">{formatEUR(r.vat_amount)}</span>
              <span><StatusBadge status={r.status} /></span>
              <span><ConfidenceBadge value={r.confidence_score} /></span>
              <Link
                href={`/receipts/${r.id}`}
                className="text-right text-sm text-brand-600 font-medium opacity-60 group-hover:opacity-100 hover:underline"
              >
                Öffnen →
              </Link>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="p-14 text-center text-muted-foreground">
              <p className="text-sm">Keine Belege gefunden.</p>
            </div>
          ) : null}
        </div>
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
