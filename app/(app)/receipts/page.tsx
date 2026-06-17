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
import { CATEGORIES, STATUS_LABEL, DIRECTION_SHORT } from "@/lib/types";
import type { Receipt, ReceiptStatus, ReceiptDirection } from "@/lib/types";
import { StatusBadge, ConfidenceBadge } from "@/components/Badges";
import { formatDate, formatEUR } from "@/lib/utils";
import { exportCSV } from "@/lib/pdf";
import { buildReceiptsZip, downloadBlob } from "@/lib/zip-export";
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
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [onlyMissingCat, setOnlyMissingCat] = useState(false);
  const [filterDirection, setFilterDirection] = useState<"all" | ReceiptDirection>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<{ total: number; done: number } | null>(null);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  // URL-Filter (kommt z. B. aus Monatsabschluss-Checkliste)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const status = sp.get("status");
    const cat = sp.get("cat");
    const unpaid = sp.get("unpaid");
    if (status === "ungeprueft") {
      setFilterStatus("ungeprueft");
      setShowFilters(true);
    }
    if (cat === "missing") {
      setOnlyMissingCat(true);
      setShowFilters(true);
    }
    if (unpaid === "1") {
      setOnlyUnpaid(true);
      setShowFilters(true);
    }
    const direction = sp.get("direction");
    if (direction === "eingang" || direction === "ausgang" || direction === "neutral") {
      setFilterDirection(direction as ReceiptDirection);
      setShowFilters(true);
    }
    // ?filter=ungeprueft aus Dashboard-Kacheln
    const filterParam = sp.get("filter");
    if (filterParam === "ungeprueft" || filterParam === "unsicher") {
      setFilterStatus(filterParam);
      setShowFilters(true);
    }
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setImporting({ total: accepted.length, done: 0 });
    let done = 0;

    // Snapshot vor dem Batch (verhindert Race auf localStorage)
    const existingSnapshot = loadReceipts();
    const drafts: Receipt[] = [];

    // Parallel-Verarbeitung mit kleinem Batch (3 gleichzeitig), damit OCR nicht alles blockiert
    const queue = [...accepted];
    const CONCURRENCY = 3;

    async function worker() {
      while (queue.length) {
        const file = queue.shift();
        if (!file) break;
        try {
          const extracted = await extractReceiptData(file);
          const dupe = findDuplicate(extracted, [...existingSnapshot, ...drafts]);
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
              receipt_number: previewNext(undefined, extracted.receipt_type, extracted.direction),
              payment_terms: extracted.payment_terms || null,
              is_recurring: !!extracted.is_recurring,
              paid_at: null,
              fingerprint: extracted.fingerprint,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            // Direction direkt mitspeichern
            (draft as any).direction = extracted.direction;
            drafts.push(draft);
          }
        } catch {
          /* skip single failure */
        }
        done += 1;
        setImporting({ total: accepted.length, done });
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    // Einmal am Ende speichern — verhindert Layout-Flackern während des Imports
    for (const d of drafts) upsertReceipt(d);
    setAll(loadReceipts());
    setTimeout(() => setImporting(null), 1200);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
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
      if (filterDirection !== "all" && (r.direction || "eingang") !== filterDirection) return false;
      if (onlyUnpaid && (r.receipt_type !== "Rechnung" || r.paid_at)) return false;
      if (onlyMissingCat && r.category && r.category !== "Sonstiges") return false;
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
  }, [all, search, filterCat, filterStatus, from, to, onlyUnpaid, onlyMissingCat, filterDirection]);

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

  async function bulkExportZip() {
    const sel = filtered.filter((r) => selected.has(r.id));
    const toExport = sel.length ? sel : filtered;
    setZipping(true);
    try {
      const profile = (() => { try { return JSON.parse(localStorage.getItem("klarblick.profile") || "{}"); } catch { return {}; } })();
      const blob = await buildReceiptsZip(toExport, profile.company_name || "Mein Unternehmen");
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `Klarblick_Belege_${today}.zip`);
    } finally {
      setZipping(false);
    }
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
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={open} className="btn-secondary">
            <UploadIcon className="h-4 w-4" /> Dateien wählen
          </button>
          <button type="button" onClick={bulkExportZip} disabled={zipping} className="btn-secondary">
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {zipping ? "ZIP …" : "ZIP-Archiv"}
          </button>
          <Link href="/upload" className="btn-primary">
            + Beleg hinzufügen
          </Link>
        </div>
      </div>

      {/* Aktive URL-Filter aus Checkliste */}
      {(filterStatus !== "all" || onlyUnpaid || onlyMissingCat) && (
        <div className="card-soft p-3 bg-warn-soft border border-amber-200 flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-warn" />
          <span className="text-sm font-medium flex-1">
            Gefiltert aus Monatsabschluss-Checkliste:{" "}
            {filterStatus === "ungeprueft" && <span className="font-bold">Nur ungeprüfte Belege</span>}
            {onlyUnpaid && <span className="font-bold">Nur offene Rechnungen</span>}
            {onlyMissingCat && <span className="font-bold">Nur Belege ohne klare Kategorie</span>}
          </span>
          <Link href="/tax-advisor" className="btn-secondary btn-sm">
            ← Zurück zum Monatsabschluss
          </Link>
          <button
            onClick={() => {
              setFilterStatus("all");
              setOnlyUnpaid(false);
              setOnlyMissingCat(false);
            }}
            className="btn-secondary btn-sm"
          >
            <X className="h-3 w-3" /> Filter aufheben
          </button>
        </div>
      )}

      {/* Direction-Tabs — nur Eingang/Ausgang, Material ist immer Eingang */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
        {(["all", "eingang", "ausgang"] as const).map((d) => {
          const count =
            d === "all"
              ? all.length
              : all.filter((r) => (r.invoice_type || r.direction || "eingang") === d).length;
          const labels: Record<typeof d, string> = {
            all: "Alle",
            eingang: "Eingangsrechnungen",
            ausgang: "Ausgangsrechnungen",
          };
          return (
            <button
              key={d}
              onClick={() => setFilterDirection(d)}
              className={`flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                filterDirection === d
                  ? "bg-white shadow-sm text-foreground"
                  : "text-slate-600 hover:text-foreground"
              }`}
            >
              {labels[d]}
              <span className="text-xs text-slate-400 font-normal">({count})</span>
            </button>
          );
        })}
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
          <div className="mt-3 pt-3 border-t border-border space-y-4">
            {/* Status als Chips */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={filterStatus === "all"} onClick={() => setFilterStatus("all")}>
                  Alle
                </FilterChip>
                {(Object.keys(STATUS_LABEL) as ReceiptStatus[]).map((s) => (
                  <FilterChip
                    key={s}
                    active={filterStatus === s}
                    onClick={() => setFilterStatus(s)}
                  >
                    {STATUS_LABEL[s]}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* Zeitraum: Quick-Presets + Range */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Zeitraum
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <FilterChip
                  active={!from && !to}
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                >
                  Alle
                </FilterChip>
                <FilterChip
                  onClick={() => {
                    const t = new Date().toISOString().slice(0, 10);
                    setFrom(t);
                    setTo(t);
                  }}
                >
                  Heute
                </FilterChip>
                <FilterChip
                  onClick={() => {
                    const now = new Date();
                    const day = now.getDay() || 7;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - day + 1);
                    setFrom(monday.toISOString().slice(0, 10));
                    setTo(now.toISOString().slice(0, 10));
                  }}
                >
                  Diese Woche
                </FilterChip>
                <FilterChip
                  onClick={() => {
                    const now = new Date();
                    setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
                    setTo(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));
                  }}
                >
                  Dieser Monat
                </FilterChip>
                <FilterChip
                  onClick={() => {
                    const now = new Date();
                    setFrom(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10));
                    setTo(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10));
                  }}
                >
                  Letzter Monat
                </FilterChip>
                <FilterChip
                  onClick={() => {
                    const now = new Date();
                    setFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
                    setTo(new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10));
                  }}
                >
                  Dieses Jahr
                </FilterChip>
              </div>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="date"
                  className="input flex-1"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="Von"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="date"
                  className="input flex-1"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="Bis"
                />
              </div>
            </div>

            {/* Kategorie als Chips (horizontal scroll) */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Kategorie
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={filterCat === "all"} onClick={() => setFilterCat("all")}>
                  Alle
                </FilterChip>
                {CATEGORIES.map((c) => (
                  <FilterChip key={c} active={filterCat === c} onClick={() => setFilterCat(c)}>
                    {c}
                  </FilterChip>
                ))}
              </div>
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
          <button className="btn-secondary !py-2" onClick={bulkExportZip} disabled={zipping}>
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {zipping ? "Erstelle ZIP …" : "ZIP-Archiv"}
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
            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
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
              className={`grid grid-cols-[40px_110px_1fr_160px_120px_100px_120px_140px_80px] items-center gap-3 px-5 py-4 transition group ${
                selected.has(r.id) ? "bg-brand-50/40" : "hover:bg-slate-50/60"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(r.receipt_date)}</span>
              <Link
                href={`/receipts/${r.id}`}
                className="font-semibold text-foreground hover:text-brand-600 truncate flex items-center gap-2"
                title={r.supplier_name}
              >
                <span className="truncate">{r.supplier_name}</span>
                <DirectionPill direction={r.direction} />
                {r.vorsteuerabzug === true && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold shrink-0">VSt</span>
                )}
              </Link>
              <span className="text-sm text-slate-600 truncate" title={r.custom_category || r.category}>
                {r.custom_category || r.category}
              </span>
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
            <div className="p-14 text-center text-muted-foreground space-y-3">
              {all.length === 0 ? (
                <>
                  <p className="text-base font-semibold text-slate-700">Noch keine Belege vorhanden</p>
                  <p className="text-sm">Lade deinen ersten Beleg hoch — per Datei, Foto, WhatsApp oder E-Mail.</p>
                  <Link href="/upload" className="btn-primary inline-flex mt-2">
                    <UploadIcon className="h-4 w-4" /> Ersten Beleg hinzufügen
                  </Link>
                </>
              ) : (
                <p className="text-sm">Keine Belege für diesen Filter gefunden.</p>
              )}
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
            className="card p-4 flex items-center justify-between gap-3 min-h-[72px] active:bg-slate-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{r.supplier_name}</p>
                <DirectionPill direction={r.direction} />
              </div>
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
          <div className="card p-10 text-center text-muted-foreground space-y-3">
            {all.length === 0 ? (
              <>
                <p className="font-semibold text-slate-700">Noch keine Belege</p>
                <p className="text-sm">Jetzt ersten Beleg hochladen.</p>
                <Link href="/upload" className="btn-primary inline-flex mt-1">
                  <UploadIcon className="h-4 w-4" /> Hochladen
                </Link>
              </>
            ) : (
              <p className="text-sm">Keine Belege für diesen Filter.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold border transition ${
        active
          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50"
      }`}
    >
      {children}
    </button>
  );
}

function DirectionPill({ direction }: { direction?: ReceiptDirection }) {
  const d = direction || "eingang";
  const map: Record<ReceiptDirection, { bg: string; text: string; label: string }> = {
    eingang: { bg: "bg-blue-50", text: "text-blue-700", label: "Eingang" },
    ausgang: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Ausgang" },
    neutral: { bg: "bg-slate-100", text: "text-slate-600", label: "Material" },
  };
  const c = map[d];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}
