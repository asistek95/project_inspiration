"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload as UploadIcon,
  Camera,
  FileText,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  MessageCircle,
  Mail,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Link2,
} from "lucide-react";
import { extractReceiptData, findDuplicate, suggestCategory } from "@/lib/ocr";
import { uploadReceiptFile } from "@/lib/supabase-sync";
import { Select } from "@/components/Select";
import { detectVorsteuerabzug } from "@/lib/vorsteuer";
import { upsertReceipt, loadReceipts } from "@/lib/store";
import { loadNumbering, previewNext, reserveNextNumber } from "@/lib/numbering";
import { ConfidenceBadge } from "@/components/Badges";
import {
  CATEGORIES,
  RECEIPT_TYPES,
  PAYMENT_METHODS,
  DIRECTIONS,
  DIRECTION_LABEL,
  DIRECTION_FRIENDLY,
  DIRECTION_FRIENDLY_HINT,
  DIRECTION_EMOJI,
  RECHNUNG_SUBTYPEN,
  RECHNUNG_SUBTYP_LABEL,
  RECHNUNG_SUBTYP_HINT,
} from "@/lib/types";
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

// Lädt ATU + Firmennamen aus localStorage (gespeichert in Einstellungen)
function loadCompanyProfile(): { company_name: string; atu_nummer: string } {
  if (typeof window === "undefined") return { company_name: "", atu_nummer: "" };
  try {
    const raw = localStorage.getItem("klarblick.profile");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        company_name: p.company_name || "",
        atu_nummer: p.atu_nummer || "",
      };
    }
  } catch {}
  return { company_name: "", atu_nummer: "" };
}

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<FileState[]>([]);
  const [activeChannel, setActiveChannel] = useState<"file" | "whatsapp" | "email" | "folder" | null>(null);
  const [hasAtu, setHasAtu] = useState(true);

  useEffect(() => {
    const profile = loadCompanyProfile();
    setHasAtu(!!profile.atu_nummer);
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    const profile = loadCompanyProfile();
    const newItems: FileState[] = accepted.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "reading",
    }));
    setItems((prev) => [...newItems, ...prev]);

    for (const item of newItems) {
      try {
        const extracted = await extractReceiptData(item.file, profile.company_name, profile.atu_nummer);
        const existing = loadReceipts();
        const dupe = findDuplicate(extracted, existing);
        if (dupe) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "duplicate", duplicate_of: dupe.id, extracted } : p
            )
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
          invoice_type: extracted.invoice_type || "unknown",
          vendor_uid: extracted.vendor_uid || null,
          vendor_identifier_confidence: extracted.vendor_identifier_confidence || 0,
          is_vendor_match: extracted.is_vendor_match || false,
          recipient_name: extracted.recipient_name || null,
          recipient_uid: extracted.recipient_uid || null,
          invoice_type_reason: extracted.invoice_type_reason || null,
          original_invoice_number: extracted.original_invoice_number || null,
          ocr_filename: null,
          user_custom_name: null,
          vorsteuerabzug: extracted.direction === "eingang" ? true : null,
        };
        (draft as any).direction = extracted.direction;
        (draft as any).rechnung_subtyp = extracted.rechnung_subtyp;
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "ready", extracted, draft } : p))
        );
      } catch {
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "ready" } : p)));
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
        if (patch.supplier_name && patch.supplier_name !== p.draft.supplier_name) {
          const sug = suggestCategory(patch.supplier_name);
          if (sug) next = { ...next, category: sug.category, payment_method: sug.payment };
        }
        return { ...p, draft: next };
      })
    );
  }

  async function saveDraft(id: string, status: Receipt["status"]) {
    const item = items.find((p) => p.id === id);
    if (!item || !item.draft) return;
    const cfg = loadNumbering();
    const autoPreview = previewNext(cfg);
    let receipt_number = item.draft.receipt_number || null;
    if (cfg.enabled && (!receipt_number || receipt_number === autoPreview)) {
      receipt_number = reserveNextNumber(item.draft.receipt_type);
    }
    const ocr_filename = receipt_number
      ? `${receipt_number}_${item.draft.supplier_name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20)}`
      : null;

    let file_url = item.draft.file_url;
    // Datei zu Supabase Storage hochladen wenn real user + blob-URL (flüchtig)
    if (item.file && file_url?.startsWith("blob:") && localStorage.getItem("klarblick.realUser") === "1") {
      const storageUrl = await uploadReceiptFile(item.file, item.id);
      if (storageUrl) file_url = storageUrl;
    }

    const final = { ...item.draft, status, receipt_number, ocr_filename, file_url };
    upsertReceipt(final);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "saved" } : p)));
  }

  function setDirection(id: string, direction: ReceiptDirection) {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.draft) return p;
        const newNumber = previewNext(undefined, p.draft.receipt_type, direction);
        const vorsteuerabzug = direction === "eingang" ? true : direction === "ausgang" ? false : null;
        return { ...p, draft: { ...p.draft, direction, receipt_number: newNumber, vorsteuerabzug } };
      })
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gib mir deinen Beleg</h1>
        <p className="text-muted-foreground mt-1">
          Alle Belege an einem Ort — hochladen, fotografieren, per WhatsApp oder E-Mail senden.
        </p>
      </div>

      {/* ATU-Warnung — kritisch für Eingang/Ausgang-Erkennung */}
      {!hasAtu && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-700">ATU-Nummer fehlt — Eingang/Ausgang kann nicht automatisch erkannt werden</p>
            <p className="text-sm text-red-600 mt-1">
              Ohne deine ATU-Nummer kann das System nicht unterscheiden ob du der Aussteller oder Empfänger einer Rechnung bist.
              Du musst dann bei jedem Beleg manuell wählen.
            </p>
          </div>
          <a href="/settings" className="btn-primary shrink-0 !bg-red-600 hover:!bg-red-700">
            ATU eintragen →
          </a>
        </div>
      )}

      {/* Kanal-Auswahl */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ChannelCard
          icon={<UploadIcon className="h-6 w-6" />}
          label="Datei hochladen"
          sublabel="PDF, JPG, PNG"
          color="brand"
          active={activeChannel === "file"}
          onClick={() => setActiveChannel(activeChannel === "file" ? null : "file")}
        />
        <ChannelCard
          icon={<Camera className="h-6 w-6" />}
          label="Foto machen"
          sublabel="Kamera / Handy"
          color="brand"
          active={activeChannel === "file"}
          onClick={() => { setActiveChannel("file"); open(); }}
        />
        <ChannelCard
          icon={<MessageCircle className="h-6 w-6" />}
          label="WhatsApp"
          sublabel="Bild senden"
          color="green"
          active={activeChannel === "whatsapp"}
          onClick={() => setActiveChannel(activeChannel === "whatsapp" ? null : "whatsapp")}
        />
        <ChannelCard
          icon={<Mail className="h-6 w-6" />}
          label="E-Mail"
          sublabel="Weiterleiten"
          color="blue"
          active={activeChannel === "email"}
          onClick={() => setActiveChannel(activeChannel === "email" ? null : "email")}
        />
      </div>

      {/* Kanal-Detail-Panels — immer gemounted, kein Re-Mount-Delay */}
      <div className={activeChannel === "whatsapp" ? "" : "hidden"}>
        <WhatsAppPanel />
      </div>
      <div className={activeChannel === "email" ? "" : "hidden"}>
        <EmailPanel />
      </div>

      {/* Drag & Drop Zone — aktiv wenn "file" oder nichts ausgewählt */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
          isDragActive
            ? "border-brand-500 bg-brand-50"
            : "border-border hover:border-brand-300 bg-white"
        }`}
      >
        <input {...getInputProps()} />
        <span className="h-14 w-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 grid place-content-center">
          <UploadIcon className="h-6 w-6" />
        </span>
        <p className="mt-4 font-semibold text-lg">Belege hier ablegen</p>
        <p className="text-sm text-muted-foreground mt-1">
          oder klicken zum Auswählen · PDF, JPG, PNG, HEIC · mehrere gleichzeitig
        </p>
        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="btn-primary">
            <FolderOpen className="h-4 w-4" /> Dateien auswählen
          </button>
          <label className="btn-secondary cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <Camera className="h-4 w-4" /> Kamera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              multiple
              onChange={(e) => { if (e.target.files) onDrop(Array.from(e.target.files)); }}
            />
          </label>
        </div>
      </div>

      {/* Erkannte Belege */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">
              Erkannte Belege
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.filter((i) => i.status !== "saved").length} ausstehend)
              </span>
            </h2>
            {items.some((i) => i.status === "saved") && (
              <button
                onClick={() => setItems((prev) => prev.filter((p) => p.status !== "saved"))}
                className="btn-ghost text-xs"
              >
                Gespeicherte ausblenden
              </button>
            )}
          </div>
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
      )}

      {/* Hinweis Vorsteuer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
        <p className="text-slate-600">
          <span className="font-semibold">Österreichisches Steuerrecht:</span> Klarblick erkennt
          automatisch ob ein Beleg eine Eingangs- oder Ausgangsrechnung ist (über Firmenwortlaut,
          ATU-Nummer und Rechnungsmerkmale). Die Vorsteuer-Zuordnung erfolgt entsprechend automatisch.
        </p>
      </div>
    </div>
  );
}

function ChannelCard({
  icon,
  label,
  sublabel,
  color,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: "brand" | "green" | "blue";
  active: boolean;
  onClick: () => void;
}) {
  const colors = {
    brand: active
      ? "border-brand-500 bg-brand-50 text-brand-700"
      : "border-border bg-white text-slate-700 hover:border-brand-300",
    green: active
      ? "border-green-500 bg-green-50 text-green-700"
      : "border-border bg-white text-slate-700 hover:border-green-300",
    blue: active
      ? "border-blue-500 bg-blue-50 text-blue-700"
      : "border-border bg-white text-slate-700 hover:border-blue-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition flex flex-col gap-2 ${colors[color]}`}
    >
      {icon}
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs opacity-70">{sublabel}</p>
      </div>
    </button>
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
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (item.status === "reading") {
    return (
      <div className="rounded-xl border bg-white p-5 flex items-center gap-4">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{item.file.name}</p>
          <p className="text-sm text-muted-foreground">OCR läuft — Beleg wird gelesen …</p>
        </div>
      </div>
    );
  }

  if (item.status === "duplicate") {
    return (
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warn mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-warn">Dublette — Beleg existiert bereits</p>
          <p className="text-sm text-warn/90 mt-0.5">
            {item.file.name} — {item.extracted?.supplier_name} · {item.extracted?.gross_amount?.toFixed(2)} €
          </p>
        </div>
        <button onClick={onRemove} className="btn-ghost !p-2"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  if (item.status === "saved") {
    return (
      <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
        <span className="font-medium">Beleg gespeichert.</span>
        <button onClick={onRemove} className="ml-auto btn-ghost !p-2"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  const draft = item.draft;
  if (!draft) return null;

  const direction = (draft as any).direction || "eingang";
  const invoiceType = draft.invoice_type || "unknown";
  const invoiceConfidence = draft.vendor_identifier_confidence || 0;
  const isConfirmed = invoiceType !== "unknown" && invoiceConfidence >= 0.85;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">

      {/* Kopfzeile — Datei + Status */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {item.preview ? (
            <button type="button" onClick={() => setLightbox(true)}
              className="h-9 w-9 rounded border overflow-hidden shrink-0 hover:opacity-80">
              <img src={item.preview} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span className="h-9 w-9 rounded bg-slate-100 grid place-content-center shrink-0">
              <FileText className="h-4 w-4 text-slate-400" />
            </span>
          )}
          <span className="text-sm text-slate-500 truncate">{item.file.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge value={draft.confidence_score} />
          {draft.vendor_uid && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {draft.vendor_uid}
            </span>
          )}
          <button onClick={onRemove} className="btn-ghost !p-1.5"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Aussteller + Empfänger + Betrag */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Aussteller */}
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aussteller</p>
            <p className="text-lg font-bold text-slate-900 truncate">{draft.supplier_name}</p>
            {draft.vendor_uid && (
              <p className="text-[11px] font-mono text-slate-400">{draft.vendor_uid}</p>
            )}
            {/* Empfänger — nur anzeigen wenn vorhanden */}
            {(draft as any).recipient_name && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Empfänger</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{(draft as any).recipient_name}</p>
                {(draft as any).recipient_uid && (
                  <p className="text-[11px] font-mono text-slate-400">{(draft as any).recipient_uid}</p>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {new Date(draft.receipt_date).toLocaleDateString("de-AT")}
              {draft.custom_category || draft.category ? ` · ${draft.custom_category || draft.category}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Brutto</p>
            <p className="text-2xl font-bold text-slate-900">{formatEUR(draft.gross_amount)}</p>
            <p className="text-xs text-slate-400">Netto {formatEUR(draft.net_amount)} · USt {formatEUR(draft.vat_amount)}</p>
            {/* Original-Rechnungsnummer vom Aussteller */}
            {(draft as any).original_invoice_number && (
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                Nr. {(draft as any).original_invoice_number}
              </p>
            )}
            {/* Klarblick-interne Belegnummer */}
            {draft.receipt_number && (
              <p className="text-[11px] font-mono text-slate-400">
                KB: {draft.receipt_number}
              </p>
            )}
          </div>
        </div>

        {/* Eingang / Ausgang — bestätigt oder Auswahl */}
        {isConfirmed ? (
          /* Bestätigt → kompaktes Banner mit Erklärungs-Grund */
          <div className={`rounded-md border px-3 py-2.5 ${
            direction === "ausgang" ? "bg-emerald-50 border-emerald-200" :
            direction === "eingang" ? "bg-blue-50 border-blue-200" :
            "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  direction === "ausgang" ? "bg-emerald-500" :
                  direction === "eingang" ? "bg-blue-500" : "bg-slate-400"
                }`} />
                <span className="text-sm font-semibold text-slate-800">
                  {direction === "ausgang" ? "Ausgangsrechnung" :
                   direction === "eingang" ? "Eingangsrechnung" : "Quittung / Spesen"}
                </span>
                <span className="text-xs text-slate-500">
                  {direction === "ausgang" ? "· Umsatz · USt-Schuld" :
                   direction === "eingang" ? "· Kosten · Vorsteuer" : "· Betriebsausgabe"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSetDirection(direction === "eingang" ? "ausgang" : "eingang")}
                className="text-xs text-slate-400 hover:text-slate-700 underline shrink-0"
              >
                Ändern
              </button>
            </div>
            {/* Erklärungs-Grund — zeigt WIE die Entscheidung getroffen wurde */}
            {(draft as any).invoice_type_reason && (
              <p className="text-[11px] text-slate-500 mt-1.5 pl-4">
                Erkannt: {(draft as any).invoice_type_reason}
              </p>
            )}
          </div>
        ) : (
          /* Unbekannt → dezente Radio-Auswahl */
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-700 mb-2">Bitte wählen — Pflichtfeld</p>
            <div className="flex gap-2">
              {DIRECTIONS.map((d) => {
                const current = direction === d;
                const labels: Record<ReceiptDirection, string> = {
                  eingang: "Eingangsrechnung (Kosten)",
                  ausgang: "Ausgangsrechnung (Umsatz)",
                  neutral: "Quittung / Spesen",
                };
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSetDirection(d)}
                    className={`flex-1 py-2 px-3 rounded text-xs font-semibold border transition ${
                      current
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {labels[d]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vorsteuerabzug — mit Auto-Detection */}
        <VorsteuerRow
          draft={draft}
          onUpdate={onUpdate}
          direction={direction}
        />

        {/* Details collapsible */}
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="w-full mt-3 flex items-center justify-between text-sm font-semibold text-slate-600 hover:text-foreground py-2"
        >
          <span>Details ändern (Lieferant, Beträge, Kategorie …)</span>
          {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {detailsOpen && (
          <div className="space-y-4 mt-2 border-t pt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Lieferant">
                <input className="input" value={draft.supplier_name} onChange={(e) => onUpdate({ supplier_name: e.target.value })} />
              </Field>
              <Field label="Datum">
                <input type="date" className="input" value={draft.receipt_date} onChange={(e) => onUpdate({ receipt_date: e.target.value })} />
              </Field>
              <Field label="Kategorie">
                <Select value={draft.category} onChange={(v) => onUpdate({ category: v as any })} options={[...CATEGORIES]} />
              </Field>
              <Field label="Eigene Kategorie (optional)">
                <input
                  className="input"
                  value={draft.custom_category || ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    const vst = detectVorsteuerabzug(e.target.value, direction, draft.category);
                    onUpdate({
                      custom_category: val,
                      ...(vst.berechtigt !== null ? { vorsteuerabzug: vst.berechtigt } : {}),
                    });
                  }}
                  placeholder="z.B. Caddy Kastenwagen, BMW 5er, Firmenwagen"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tipp: „Caddy Kastenwagen" → Vorsteuer ✓ · „5er BMW" → kein Vorsteuer ✗
                </p>
              </Field>
              <Field label="Interne Notiz">
                <input
                  className="input"
                  value={draft.notes || ""}
                  onChange={(e) => onUpdate({ notes: e.target.value || null })}
                  placeholder="z.B. 7er BMW — kein Vorsteuerabzug"
                />
              </Field>
              <Field label="Belegart">
                <Select value={draft.receipt_type} onChange={(v) => onUpdate({ receipt_type: v as any })} options={[...RECEIPT_TYPES]} />
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
                      <button key={p} type="button" onClick={() => onUpdate({ payment_method: p })}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex-1 min-w-fit ${current ? "bg-white shadow-sm text-foreground" : "text-slate-600 hover:text-foreground"}`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Brutto">
                <input type="number" step="0.01" className="input" value={draft.gross_amount}
                  onChange={(e) => onUpdate({ gross_amount: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="Netto">
                <input type="number" step="0.01" className="input" value={draft.net_amount}
                  onChange={(e) => onUpdate({ net_amount: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="MwSt. (USt.)">
                <input type="number" step="0.01" className="input" value={draft.vat_amount}
                  onChange={(e) => onUpdate({ vat_amount: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>

            {draft.receipt_type === "Rechnung" && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Rechnungs-Art</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {RECHNUNG_SUBTYPEN.map((s) => {
                    const current = ((draft as any).rechnung_subtyp || "standard") === s;
                    const label = s === "standard"
                      ? direction === "ausgang" ? "Ausgangsrechnung" : direction === "eingang" ? "Eingangsrechnung" : "Standardrechnung"
                      : RECHNUNG_SUBTYP_LABEL[s];
                    return (
                      <button key={s} type="button" onClick={() => onUpdate({ rechnung_subtyp: s } as any)}
                        className={`px-2 py-2 rounded-md text-xs font-semibold transition ${current ? "bg-brand-600 text-white shadow-sm" : "text-slate-700 hover:bg-white"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnungen — klein, sachlich */}
        {draft.warnings.length > 0 && (
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 space-y-1">
            {draft.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                {w}
              </p>
            ))}
          </div>
        )}


        {/* Aktionen */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {invoiceType === "unknown" ? (
            <p className="text-xs text-red-600 font-medium py-2">
              Bitte oben Eingang oder Ausgang wählen um zu speichern.
            </p>
          ) : (
            <>
              <button className="btn-primary flex-1" onClick={() => onSave("geprueft")}>
                <CheckCircle2 className="h-4 w-4" /> Speichern
              </button>
              <button className="btn-secondary" onClick={() => onSave("unsicher")}>
                Später prüfen
              </button>
            </>
          )}
        </div>
      </div>

      {lightbox && item.preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-content-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-content-center">
            <X className="h-5 w-5" />
          </button>
          <img src={item.preview} alt={item.file.name}
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
          <p className="text-center text-white/70 text-xs mt-3">{item.file.name}</p>
        </div>
      )}
    </div>
  );
}

function VorsteuerRow({
  draft,
  onUpdate,
  direction,
}: {
  draft: Receipt;
  onUpdate: (p: Partial<Receipt>) => void;
  direction: string;
}) {
  const detected = detectVorsteuerabzug(
    draft.custom_category || draft.notes || "",
    direction,
    draft.category,
  );
  const isChecked = draft.vorsteuerabzug === true;
  const isAuto = detected.berechtigt !== null;

  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5">
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onUpdate({ vorsteuerabzug: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span className="text-sm font-medium text-slate-800">
          Vorsteuerabzugsberechtigt
          <span className="text-slate-400 font-normal text-xs ml-1">§ 12 UStG</span>
        </span>
        {isAuto && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto ${
            detected.berechtigt
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}>
            Auto-erkannt
          </span>
        )}
      </label>
      {detected.hinweis && (
        <p className="text-[11px] text-slate-500 mt-1.5 ml-6">{detected.hinweis}</p>
      )}
    </div>
  );
}

// ── WhatsApp-Panel ─────────────────────────────────────────────────────────────

function WhatsAppPanel() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const waAvailable = !!waNumber && !waNumber.includes("XXX");
  const waLink = waAvailable ? `https://wa.me/${waNumber.replace(/[\s+]/g, "")}` : "#";
  const [copiedWa, setCopiedWa] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "entering" | "otp" | "done">("idle");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("klarblick.profile") || "{}");
      // Nur echte verifizierte Nummern anzeigen (keine Demo-Daten)
      if (p.whatsapp_phone && p.whatsapp_verified) {
        setVerifiedPhone(p.whatsapp_phone);
        setStep("done");
      }
    } catch {}
  }, []);

  async function getAuthToken(): Promise<string | null> {
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabase");
      const sb = getSupabaseBrowser();
      if (!sb) return null;
      const { data: { session } } = await sb.auth.getSession();
      return session?.access_token ?? null;
    } catch { return null; }
  }

  async function sendOtp() {
    setLoading(true); setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden");
      if (data.dev_code) setDevCode(data.dev_code);
      setStep("otp");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function verifyOtp() {
    setLoading(true); setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falscher Code");
      try {
        const p = JSON.parse(localStorage.getItem("klarblick.profile") || "{}");
        localStorage.setItem("klarblick.profile", JSON.stringify({ ...p, whatsapp_phone: phone, whatsapp_verified: true }));
      } catch {}
      setVerifiedPhone(phone); setStep("done");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (!waAvailable) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-start gap-3">
        <MessageCircle className="h-5 w-5 text-green-700 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">WhatsApp-Eingang</p>
          <p className="text-sm text-green-700 mt-1">
            Foto per WhatsApp schicken — Beleg landet automatisch im Eingang.
            <span className="ml-2 inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">Bald verfügbar</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-4">
      <div className="flex items-center gap-2 font-semibold text-green-800">
        <MessageCircle className="h-5 w-5" /> WhatsApp-Eingang einrichten
      </div>

      {/* Schritt 1: Nummernverifizierung */}
      {step === "done" ? (
        <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium text-emerald-800">Verifiziert:</span>
          <span className="font-mono text-sm font-bold text-emerald-900">{verifiedPhone}</span>
          <button onClick={() => { setStep("entering"); setVerifiedPhone(null); }}
            className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline shrink-0">Ändern</button>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-green-200 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Schritt 1 — Deine Handynummer bestätigen
          </p>
          <p className="text-xs text-slate-500">
            Einmalig nötig, damit eingehende WhatsApp-Fotos deinem Konto zugeordnet werden.
          </p>

          {step === "idle" && (
            <button onClick={() => setStep("entering")}
              className="btn bg-green-600 text-white hover:bg-green-700 w-full justify-center">
              <MessageCircle className="h-4 w-4" /> Nummer jetzt verifizieren
            </button>
          )}

          {step === "entering" && (
            <div className="space-y-2">
              <input
                type="tel" className="input" placeholder="+43 664 123 456 7"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-slate-400">Format: +43 für Österreich, +49 für Deutschland</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep("idle"); setError(null); }}
                  className="btn-secondary flex-1 text-sm">Abbrechen</button>
                <button onClick={sendOtp} disabled={loading || !phone.trim()}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex-1 text-sm disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Code senden
                </button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Wir haben einen 6-stelligen Code per WhatsApp an <strong>{phone}</strong> geschickt.
              </p>
              <input
                type="text" inputMode="numeric" maxLength={6}
                className="input tracking-widest text-center text-xl font-mono"
                placeholder="123456" value={devCode ?? code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setDevCode(null); }}
                autoFocus
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {devCode && <p className="text-xs text-amber-600 text-center">DEV-Modus: Code oben vorausgefüllt</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep("entering"); setCode(""); setError(null); setDevCode(null); }}
                  className="btn-secondary flex-1 text-sm">Zurück</button>
                <button onClick={verifyOtp} disabled={loading || (devCode ? false : code.length !== 6)}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex-1 text-sm disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Bestätigen
                </button>
              </div>
              <button onClick={sendOtp} className="text-xs text-green-700 underline w-full text-center">
                Code nochmal senden
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schritt 2: Klarblick-Nummer */}
      <div className="rounded-lg bg-white border border-green-200 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
            Schritt 2 — Klarblick WhatsApp-Nummer
          </p>
          <p className="font-mono font-bold text-lg text-slate-900">{waNumber}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { navigator.clipboard.writeText(waNumber).catch(() => {}); setCopiedWa(true); setTimeout(() => setCopiedWa(false), 2000); }}
            className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1">
            {copiedWa ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
            {copiedWa ? "Kopiert" : "Kopieren"}
          </button>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="btn text-xs px-2.5 py-1.5 bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5" /> Öffnen
          </a>
        </div>
      </div>

      <p className="text-xs text-green-700">
        <strong>Schritt 3</strong> — Belegfoto (JPG, PNG, HEIC) oder PDF an diese Nummer schicken. Der Beleg landet sofort in deinem Eingang.
      </p>

      <Link href="/inbox" className="btn bg-green-700 text-white hover:bg-green-800 w-full justify-center flex items-center gap-2">
        <MessageCircle className="h-4 w-4" /> Eingang öffnen
      </Link>
    </div>
  );
}

// ── E-Mail-Panel ────────────────────────────────────────────────────────────────

function EmailPanel() {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const forwardAddr = "belege@klarblick.at";

  function copyAddr() {
    navigator.clipboard.writeText(forwardAddr).catch(() => {});
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-blue-800">
          <Mail className="h-5 w-5" /> E-Mail-Eingang einrichten
        </div>
        <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">Beta</span>
      </div>

      {/* Weiterleitungsadresse */}
      <div className="rounded-lg bg-white border border-blue-200 p-4 space-y-2">
        <p className="text-sm font-medium text-slate-700">Deine Klarblick-Eingangsadresse</p>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
          <span className="font-mono text-sm font-bold text-slate-900">{forwardAddr}</span>
          <button onClick={copyAddr} className="btn-secondary text-xs px-2.5 py-1.5 shrink-0 flex items-center gap-1">
            {copiedAddr ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
            {copiedAddr ? "Kopiert" : "Kopieren"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Rechnungs-Mails einfach an diese Adresse weiterleiten — sie landen automatisch im Eingang.
        </p>
      </div>

      {/* Gmail-Anleitung */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Gmail-Weiterleitung einrichten</p>
        {[
          "Gmail → Einstellungen (Zahnrad) → Alle Einstellungen anzeigen",
          "Tab \"Weiterleitung und POP/IMAP\" → \"Weiterleitungsadresse hinzufügen\"",
          `Adresse eintragen: ${forwardAddr} → Bestätigungslink klicken`,
          "Fertig — Rechnungs-Mails landen automatisch im Eingang.",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-blue-800">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold grid place-content-center shrink-0 mt-0.5">{i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      <Link href="/inbox" className="btn bg-blue-700 text-white hover:bg-blue-800 w-full justify-center flex items-center gap-2">
        <Mail className="h-4 w-4" /> Eingang öffnen
      </Link>

      <p className="text-[11px] text-slate-400 text-center">
        Auch Outlook, GMX, Yahoo möglich · konfigurierbar unter{" "}
        <a href="/settings" className="underline">Einstellungen → E-Mail</a>
      </p>
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
