"use client";

import { getSupabaseBrowser } from "./supabase";
import type { Receipt } from "./types";

// ─────────────────────────────────────────────
// FILE UPLOAD → Supabase Storage
// ─────────────────────────────────────────────

/**
 * Lädt eine Belegdatei in den Supabase Storage-Bucket "receipts" hoch.
 * Pfad: {userId}/{receiptId}.{ext}
 * Gibt eine signierte URL (7 Jahre Laufzeit = GoBD-Aufbewahrung) zurück.
 */
export async function uploadReceiptFile(
  file: File,
  receiptId: string
): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${user.id}/${receiptId}.${ext}`;

  const { error: uploadError } = await sb.storage
    .from("receipts")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return null;

  // Signierte URL — 7 Jahre (§ 132 BAO Aufbewahrungspflicht)
  const { data } = await sb.storage
    .from("receipts")
    .createSignedUrl(path, 7 * 365 * 24 * 3600);
  return data?.signedUrl ?? null;
}

// ─────────────────────────────────────────────
// RECEIPT → Supabase row mapping
// ─────────────────────────────────────────────

function toRow(r: Receipt, userId: string): Record<string, unknown> {
  const rec = r as Receipt & {
    direction?: string;
    rechnung_subtyp?: string;
    vat_treatment?: string;
    reverse_charge?: boolean;
  };
  return {
    id: rec.id,
    user_id: userId,
    file_url: rec.file_url,
    file_name: rec.file_name,
    supplier_name: rec.supplier_name,
    receipt_date: rec.receipt_date,
    category: rec.custom_category || rec.category,
    custom_category: rec.custom_category || null,
    receipt_type: rec.receipt_type,
    payment_method: rec.payment_method,
    net_amount: rec.net_amount,
    vat_amount: rec.vat_amount,
    gross_amount: rec.gross_amount,
    currency: rec.currency,
    confidence_score: rec.confidence_score,
    status: rec.status,
    warnings: rec.warnings,
    notes: rec.notes,
    project: rec.project,
    receipt_number: rec.receipt_number || null,
    payment_terms: rec.payment_terms || null,
    is_recurring: rec.is_recurring || false,
    paid_at: rec.paid_at || null,
    iban: rec.iban || null,
    fingerprint: rec.fingerprint || null,
    locked: rec.locked || false,
    // OCR-Klassifizierung (Migration 001)
    invoice_type: rec.invoice_type || "unknown",
    vendor_uid: rec.vendor_uid || null,
    vendor_identifier_confidence: rec.vendor_identifier_confidence || 0,
    is_vendor_match: rec.is_vendor_match || false,
    // Erweiterte Felder (Migration 002)
    direction: rec.direction || "eingang",
    rechnung_subtyp: rec.rechnung_subtyp || null,
    recipient_name: rec.recipient_name || null,
    recipient_uid: rec.recipient_uid || null,
    invoice_type_reason: rec.invoice_type_reason || null,
    original_invoice_number: rec.original_invoice_number || null,
    vorsteuerabzug: rec.vorsteuerabzug ?? null,
    vat_treatment: rec.vat_treatment || null,
    reverse_charge: rec.reverse_charge || false,
    audit_log: rec.audit_log || [],
    updated_at: rec.updated_at || new Date().toISOString(),
  };
}

function fromRow(row: Record<string, unknown>): Receipt {
  const r: Receipt & Record<string, unknown> = {
    id: String(row.id),
    user_id: String(row.user_id),
    file_url: (row.file_url as string) || null,
    file_name: (row.file_name as string) || null,
    supplier_name: String(row.supplier_name || ""),
    receipt_date: String(row.receipt_date || "").slice(0, 10),
    category: (row.category as any) || "Sonstiges",
    custom_category: (row.custom_category as string) || null,
    receipt_type: (row.receipt_type as any) || "Quittung",
    payment_method: (row.payment_method as any) || "Karte",
    net_amount: Number(row.net_amount) || 0,
    vat_amount: Number(row.vat_amount) || 0,
    gross_amount: Number(row.gross_amount) || 0,
    currency: "EUR",
    confidence_score: Number(row.confidence_score) || 0,
    status: (row.status as any) || "ungeprueft",
    warnings: (row.warnings as string[]) || [],
    notes: (row.notes as string) || null,
    project: (row.project as string) || null,
    receipt_number: (row.receipt_number as string) || null,
    payment_terms: (row.payment_terms as any) || null,
    is_recurring: Boolean(row.is_recurring),
    paid_at: (row.paid_at as string) || null,
    iban: (row.iban as string) || null,
    fingerprint: (row.fingerprint as string) || undefined,
    locked: Boolean(row.locked),
    invoice_type: (row.invoice_type as any) || "unknown",
    vendor_uid: (row.vendor_uid as string) || null,
    vendor_identifier_confidence: Number(row.vendor_identifier_confidence) || 0,
    is_vendor_match: Boolean(row.is_vendor_match),
    recipient_name: (row.recipient_name as string) || null,
    recipient_uid: (row.recipient_uid as string) || null,
    invoice_type_reason: (row.invoice_type_reason as string) || null,
    original_invoice_number: (row.original_invoice_number as string) || null,
    vorsteuerabzug: row.vorsteuerabzug != null ? Boolean(row.vorsteuerabzug) : null,
    audit_log: (row.audit_log as any[]) || [],
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
    // Migration 002 extras (as dynamic props)
    direction: (row.direction as any) || "eingang",
    rechnung_subtyp: (row.rechnung_subtyp as any) || undefined,
    vat_treatment: (row.vat_treatment as string) || null,
    reverse_charge: Boolean(row.reverse_charge),
  };
  return r as Receipt;
}

// ─────────────────────────────────────────────
// SYNC OPERATIONS
// ─────────────────────────────────────────────

/** Upsert eines Belegs in Supabase (fire-and-forget geeignet). */
export async function syncReceiptToSupabase(receipt: Receipt): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { error } = await sb
    .from("receipts")
    .upsert(toRow(receipt, user.id), { onConflict: "id" });
  return !error;
}

/** Löscht einen Beleg in Supabase (nur wenn nicht locked). */
export async function syncDeleteFromSupabase(receiptId: string): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { error } = await sb
    .from("receipts")
    .delete()
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .eq("locked", false);
  return !error;
}

/** Lädt alle Belege des aktuellen Users aus Supabase. */
export async function loadReceiptsFromSupabase(): Promise<Receipt[] | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from("receipts")
    .select("*")
    .eq("user_id", user.id)
    .order("receipt_date", { ascending: false });

  if (error || !data) return null;
  return data.map(fromRow);
}

/**
 * Push-Sync: schreibt alle localStorage-Belege, die noch nicht in Supabase
 * sind (nach fingerprint/id). Nützlich nach dem ersten Login.
 */
export async function pushLocalToSupabase(receipts: Receipt[]): Promise<number> {
  const sb = getSupabaseBrowser();
  if (!sb) return 0;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return 0;

  let synced = 0;
  // In Batches von 50 um Rate-Limits zu vermeiden
  const BATCH = 50;
  for (let i = 0; i < receipts.length; i += BATCH) {
    const batch = receipts.slice(i, i + BATCH).map((r) => toRow(r, user.id));
    const { error } = await sb
      .from("receipts")
      .upsert(batch, { onConflict: "id" });
    if (!error) synced += batch.length;
  }
  return synced;
}
