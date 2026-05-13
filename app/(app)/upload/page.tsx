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
} from "lucide-react";
import { extractReceiptData, findDuplicate, suggestCategory } from "@/lib/ocr";
import { upsertReceipt, loadReceipts } from "@/lib/store";
import { Disclaimer } from "@/components/Disclaimer";
import { ConfidenceBadge } from "@/components/Badges";
import { CATEGORIES, RECEIPT_TYPES, PAYMENT_METHODS } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import type { Receipt } from "@/lib/types";

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
          payment_terms: extracted.payment_terms || null,
          is_recurring: !!extracted.is_recurring,
          paid_at: null,
          fingerprint: extracted.fingerprint,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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
    accept: { "image/*": [], "application/pdf": [] },
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
    const final = { ...item.draft, status };
    upsertReceipt(final);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "saved" } : p)));
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
        <p className="text-sm text-muted-foreground">oder klicken zum Auswählen · PDF, JPG, PNG</p>
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

      <Disclaimer />

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
}: {
  item: FileState;
  onUpdate: (patch: Partial<Receipt>) => void;
  onSave: (status: Receipt["status"]) => void;
  onRemove: () => void;
  onGoToReview: () => void;
}) {
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
            <img src={item.preview} alt="" className="h-14 w-14 object-cover rounded-lg border" />
          ) : (
            <span className="h-14 w-14 rounded-lg bg-slate-100 grid place-content-center">
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
        <Field label="Zahlungsart">
          <select className="input" value={draft.payment_method} onChange={(e) => onUpdate({ payment_method: e.target.value as any })}>
            {PAYMENT_METHODS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
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
        <button className="btn-primary" onClick={() => onSave("geprueft")}>
          <CheckCircle2 className="h-4 w-4" /> Stimmt alles
        </button>
        <button className="btn-secondary" onClick={() => onSave("unsicher")}>
          <AlertTriangle className="h-4 w-4" /> Als unsicher markieren
        </button>
        <button className="btn-ghost" onClick={() => onSave("ungeprueft")}>
          Später prüfen
        </button>
      </div>
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
