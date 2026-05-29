"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  Upload as UploadIcon,
  Camera,
  FileText,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  ZoomIn,
} from "lucide-react";
import { extractReceiptData, findDuplicate, suggestCategory } from "@/lib/ocr";
import { upsertReceipt, loadReceipts } from "@/lib/store";
import { loadNumbering, previewNext, reserveNextNumber } from "@/lib/numbering";
import { ConfidenceBadge } from "@/components/Badges";
import { CATEGORIES, RECEIPT_TYPES, PAYMENT_METHODS, DIRECTIONS, DIRECTION_LABEL, DIRECTION_FRIENDLY, DIRECTION_FRIENDLY_HINT, DIRECTION_EMOJI, RECHNUNG_SUBTYPEN, RECHNUNG_SUBTYP_LABEL, RECHNUNG_SUBTYP_HINT } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import type { Receipt, ReceiptDirection } from "@/lib/types";

interface FileState {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "reading" | "ready" | "saved" | "duplicate";
  extracted?: any;
  draft?: Receipt;
  duplicate_of?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<FileState[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const newItems: FileState[] = accepted.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "reading",
    }));
    setItems((prev) => [...newItems, ...prev]);

    for (const item of newItems) {
      try {
        const extracted = await extractReceiptData(item.file);
        // Dubletten-Check
        const existing = loadReceipts();
        const dupe = findDuplicate(extracted, existing);
        if (dupe) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "duplicate", duplicate_of: dupe.id, extracted } : p,
            ),
          );
          continue;
        }
        const draft: Receipt = {
          id: item.id,
          user_id: "demo-user",
          file_url: item.preview || null,
          file_name: item.file.name,
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
          // ── NEU: Eingangs/Ausgangsrechnung-Felder ──
          invoice_type: extracted.invoice_type || "unknown",
          vendor_uid: extracted.vendor_uid || null,
          vendor_identifier_confidence: extracted.vendor_identifier_confidence || 0,
          is_vendor_match: extracted.is_vendor_match || false,
          ocr_filename: null, // Wird später beim Speichern generiert
          user_custom_name: null,
        };
        (draft as any).direction = extracted.direction;
        (draft as any).rechnung_subtyp = extracted.rechnung_subtyp;
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "ready", extracted, draft } : p
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "ready" } : p))
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "application/pdf": [".pdf"],
    },
    noClick: true,
    multiple: true,
  });

  function updateDraft(id: string, patch: Partial<Receipt>) {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.draft) return p;
        let next = { ...p.draft, ...patch };
        // Auto-Kategorisierung wenn Lieferant geändert
        if (patch.supplier_name && patch.supplier_name !== p.draft.supplier_name) {
          const sug = suggestCategory(patch.supplier_name);
          if (sug) {
            next = { ...next, category: sug.category, payment_method: sug.payment };
          }
        }
        return { ...p, draft: next };
      }),
    );
  }

  function saveDraft(id: string, status: Receipt["status"]) {
    const item = items.find((p) => p.id === id);
    if (!item || !item.draft) return;
    // Wenn die Nummer noch der Auto-Vorschlag ist (oder leer), echte Nummer reservieren.
    const cfg = loadNumbering();
    const autoPreview = previewNext(cfg);
    let receipt_number = item.draft.receipt_number || null;
    if (cfg.enabled && (!receipt_number || receipt_number === autoPreview)) {
      receipt_number = reserveNextNumber(item.draft.receipt_type);
    }
    const final = { ...item.draft, status, receipt_number };
    upsertReceipt(final);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "saved" } : p)));
  }

  function setDirection(id: string, direction: ReceiptDirection) {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.draft) return p;
        // Belegnummer neu vorschlagen wenn Richtung wechselt (ER- ↔ AR-)
        const newNumber = previewNext(undefined, p.draft.receipt_type, direction);
        return { ...p, draft: { ...p.draft, direction, receipt_number: newNumber } };
      }),
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beleg hochladen</h1>
        <p className="text-muted-foreground mt-1">
          Foto, PDF oder Drag & Drop. Klarblick liest Lieferant, Betrag, MwSt. und Kategorie.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`card border-2 border-dashed p-10 text-center transition cursor-pointer ${
          isDragActive ? "border-brand-500 bg-brand-50" : "border-border hover:border-brand-300"
        }`}
        onClick={open}
      >
        <input {...getInputProps()} capture="environment" />
        <span className="h-14 w-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 grid place-content-center">
          <UploadIcon className="h-6 w-6" />
        </span>
        <p className="mt-4 font-semibold">Belege hierher ziehen</p>
        <p className="text-sm text-muted-foreground">oder klicken zum Auswählen · PDF, JPG, PNG, HEIC · mehrere gleichzeitig</p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={open} className="btn-primary">
            Datei auswählen
          </button>
          <label className="btn-secondary cursor-pointer">
            <Camera className="h-4 w-4" /> Foto vom Handy
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              multiple
              onChange={(e) => {
                if (e.target.files) onDrop(Array.from(e.target.files));
              }}
            />
          </label>
        </div>
      </div>
{items.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Erkannte Belege</h2>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onUpdate={(patch) => updateDraft(item.id, patch)}
              onSave={(status) => saveDraft(item.id, status)}
              onRemove={() => setItems((prev) => prev.filter((p) => p.id !== item.id))}
              onGoToReview={() => router.push(`/receipts/${item.id}`)}
              onSetDirection={(d) => setDirection(item.id, d)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ItemCard({
  item,
  onUpdate,
  onSave,
  onRemove,
  onSetDirection,
}: {
  item: FileState;
  onUpdate: (patch: Partial<Receipt>) => void;
  onSave: (status: Receipt["status"]) => void;
  onRemove: () => void;
  onGoToReview: () => void;
  onSetDirection: (d: ReceiptDirection) => void;
}) {
  const [lightbox, setLightbox] = useState(false);
  if (item.status === "reading") {
    return (
      <div className="card p-5 flex items-center gap-4">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        <div className="flex-1">
          <p className="font-medium">{item.file.name}</p>
          <p className="text-sm text-muted-foreground">Beleg wird gelesen …</p>
        </div>
      </div>
    );
  }

  if (item.status === "duplicate") {
    return (
      <div className="card p-5 flex items-start gap-3 bg-warn-soft border-amber-200">
        <AlertTriangle className="h-5 w-5 text-warn mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-warn">Dublette erkannt — Beleg existiert bereits</p>
          <p className="text-sm text-warn/90 mt-0.5">
            {item.file.name} hat denselben Lieferant, Datum und Betrag wie ein vorhandener Beleg
            ({item.extracted?.supplier_name} · {item.extracted?.gross_amount?.toFixed(2)} €).
          </p>
        </div>
        <button onClick={onRemove} className="btn-ghost !p-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (item.status === "saved") {
    return (
      <div className="card p-5 flex items-center gap-3 bg-accent-soft border-emerald-200">
        <CheckCircle2 className="h-5 w-5 text-accent" />
        <span className="font-medium">Beleg gespeichert.</span>
        <button onClick={onRemove} className="ml-auto btn-ghost !p-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const draft = item.draft;
  if (!draft) return null;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {item.preview ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="relative h-14 w-14 rounded-lg border overflow-hidden group shrink-0"
              aria-label="Beleg vergrößern"
            >
              <img src={item.preview} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </span>
            </button>
          ) : (
            <span className="h-14 w-14 rounded-lg bg-slate-100 grid place-content-center shrink-0">
              <FileText className="h-6 w-6 text-slate-500" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{item.file.name}</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <ConfidenceBadge value={draft.confidence_score} />
              {draft.warnings.length > 0 ? (
                <span className="pill bg-warn-soft text-warn border border-amber-200">
                  <AlertTriangle className="h-3 w-3" /> {draft.warnings.length} Warnung
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="btn-ghost !p-2" aria-label="Entfernen">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm font-medium mb-3">Bitte kurz prüfen: Stimmen diese Daten?</p>

      {/* MAGIC MOMENT — handwerker-freundlich: groß, klar, wenig */}
      <div className="mb-4 rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/70 to-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700 mb-1">
              Klarblick hat erkannt
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold leading-tight truncate">
              {draft.supplier_name}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-brand-700 mt-1 leading-none">
              {formatEUR(draft.gross_amount)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              {new Date(draft.receipt_date).toLocaleDateString("de-AT")} · {draft.category}
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Was ist das für ein Beleg?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIRECTIONS.map((d) => {
            const current = (draft.direction || "eingang") === d;
            const ringMap: Record<ReceiptDirection, string> = {
              eingang: current ? "bg-blue-600 text-white border-blue-700" : "bg-white text-blue-900 border-slate-200 hover:border-blue-300",
              ausgang: current ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-emerald-900 border-slate-200 hover:border-emerald-300",
              neutral: current ? "bg-slate-700 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200 hover:border-slate-400",
            };
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSetDirection(d)}
                className={`px-3 py-3 rounded-xl border-2 text-left transition shadow-sm min-h-[64px] ${ringMap[d]}`}
              >
                <div className="text-xl leading-none mb-1">{DIRECTION_EMOJI[d]}</div>
                <div className="text-sm font-bold leading-tight">{DIRECTION_FRIENDLY[d]}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-snug">
          {DIRECTION_FRIENDLY_HINT[(draft.direction || "eingang") as ReceiptDirection]}
        </p>
      </div>

      {/* Details collapsible */}
      <details className="mb-4 group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-slate-700 hover:text-foreground select-none">
          <span className="flex items-center gap-1.5">
            <span className="transition group-open:rotate-90">›</span>
            Details ändern (Lieferant, Beträge, Belegart …)
          </span>
          <span className="text-xs text-slate-400 font-normal">Beleg-Nr. {draft.receipt_number}</span>
        </summary>
        <div className="mt-4 space-y-4">

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Lieferant">
          <input className="input" value={draft.supplier_name} onChange={(e) => onUpdate({ supplier_name: e.target.value })} />
        </Field>
        <Field label="Datum">
          <input type="date" className="input" value={draft.receipt_date} onChange={(e) => onUpdate({ receipt_date: e.target.value })} />
        </Field>
        <Field label="Kategorie">
          <select className="input" value={draft.category} onChange={(e) => onUpdate({ category: e.target.value as any })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Belegart">
          <select className="input" value={draft.receipt_type} onChange={(e) => onUpdate({ receipt_type: e.target.value as any })}>
            {RECEIPT_TYPES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Belegnummer">
          <input
            className="input font-mono"
            value={draft.receipt_number || ""}
            onChange={(e) => onUpdate({ receipt_number: e.target.value })}
            placeholder={previewNext()}
          />
        </Field>
        <Field label="Zahlungsart">
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
            {PAYMENT_METHODS.map((p) => {
              const current = draft.payment_method === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onUpdate({ payment_method: p })}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex-1 min-w-fit ${
                    current ? "bg-white shadow-sm text-foreground" : "text-slate-600 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Brutto">
          <input
            type="number"
            step="0.01"
            className="input"
            value={draft.gross_amount}
            onChange={(e) => onUpdate({ gross_amount: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Netto">
          <input
            type="number"
            step="0.01"
            className="input"
            value={draft.net_amount}
            onChange={(e) => onUpdate({ net_amount: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="MwSt.">
          <input
            type="number"
            step="0.01"
            className="input"
            value={draft.vat_amount}
            onChange={(e) => onUpdate({ vat_amount: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Summe (aktuell)">
          <div className="input bg-slate-50 font-semibold">{formatEUR(draft.gross_amount)}</div>
        </Field>
      </div>

      {draft.receipt_type === "Rechnung" ? (
        <div className="mt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Rechnungs-Art (Detail)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {RECHNUNG_SUBTYPEN.map((s) => {
              const current = ((draft as any).rechnung_subtyp || "standard") === s;
              const label =
                s === "standard"
                  ? draft.direction === "ausgang"
                    ? "Ausgangsrechnung"
                    : draft.direction === "eingang"
                    ? "Eingangsrechnung"
                    : "Standardrechnung"
                  : RECHNUNG_SUBTYP_LABEL[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ rechnung_subtyp: s } as any)}
                  className={`px-2 py-2 rounded-md text-xs font-semibold transition ${
                    current ? "bg-brand-600 text-white shadow-sm" : "text-slate-700 hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {RECHNUNG_SUBTYP_HINT[(((draft as any).rechnung_subtyp || "standard") as keyof typeof RECHNUNG_SUBTYP_HINT)]}
          </p>
        </div>
      ) : null}
        </div>
      </details>

      {draft.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg bg-warn-soft border border-amber-200 p-3 text-sm">
          <p className="font-medium text-warn flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Hinweise der KI
          </p>
          <ul className="list-disc list-inside text-warn/90 mt-1 space-y-0.5">
            {draft.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-primary btn-lg flex-1 min-w-[180px]" onClick={() => onSave("geprueft")}>
          <CheckCircle2 className="h-5 w-5" /> Passt, speichern
        </button>
        <button className="btn-secondary btn-lg" onClick={() => onSave("unsicher")}>
          <AlertTriangle className="h-5 w-5" /> Später prüfen
        </button>
      </div>

      {lightbox && item.preview ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-content-center p-4 animate-in fade-in"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-content-center transition"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.preview}
            alt={item.file.name}
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-center text-white/70 text-xs mt-3">{item.file.name} — klicke zum Schließen</p>
        </div>
      ) : null}
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
