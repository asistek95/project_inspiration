"use client";

import type { Receipt, ReceiptStatus, AuditEntry } from "./types";
import { generateDemoReceipts } from "./demo-data";
import {
  syncReceiptToSupabase,
  syncDeleteFromSupabase,
  loadReceiptsFromSupabase,
  pushLocalToSupabase,
} from "./supabase-sync";

const KEY = "klarblick.receipts.v1";
const SYNC_PENDING_KEY = "klarblick.sync_pending";

function isBrowser() {
  return typeof window !== "undefined";
}

function audit(entry: Omit<AuditEntry, "ts" | "by">, user = "demo-user"): AuditEntry {
  return { ts: new Date().toISOString(), by: user, ...entry };
}

function isRealUser(): boolean {
  return isBrowser() && localStorage.getItem("klarblick.realUser") === "1";
}

// Feuert Supabase-Sync im Hintergrund — niemals den UI-Thread blockieren
function bgSync(r: Receipt) {
  if (!isRealUser()) return;
  syncReceiptToSupabase(r).catch(() => {
    // Offline: ID zur Pending-Queue hinzufügen → wird beim nächsten Sync nachgeholt
    if (isBrowser()) {
      const pending: string[] = JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) || "[]");
      if (!pending.includes(r.id)) pending.push(r.id);
      localStorage.setItem(SYNC_PENDING_KEY, JSON.stringify(pending));
    }
  });
}

function bgDelete(id: string) {
  if (!isRealUser()) return;
  syncDeleteFromSupabase(id).catch(() => {});
}

export function loadReceipts(): Receipt[] {
  if (!isBrowser()) return generateDemoReceipts();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      if (isRealUser()) return [];
      const demo = generateDemoReceipts();
      localStorage.setItem(KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw) as Receipt[];
  } catch {
    return isRealUser() ? [] : generateDemoReceipts();
  }
}

export function saveReceipts(receipts: Receipt[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(receipts));
}

export function upsertReceipt(r: Receipt) {
  const all = loadReceipts();
  const idx = all.findIndex((x) => x.id === r.id);
  let final: Receipt;
  if (idx >= 0) {
    if (all[idx].locked) return;
    const log = all[idx].audit_log || [];
    final = { ...r, audit_log: [...log, audit({ action: "updated" })] };
    all[idx] = final;
  } else {
    final = { ...r, audit_log: [audit({ action: "created" })] };
    all.unshift(final);
  }
  saveReceipts(all);
  bgSync(final);
}

export function updateReceipt(id: string, patch: Partial<Receipt>) {
  const all = loadReceipts();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return;
  if (all[idx].locked) return;

  const before = all[idx];
  const log = before.audit_log || [];
  const entries: AuditEntry[] = [];
  for (const k of Object.keys(patch) as (keyof Receipt)[]) {
    const b = (before as any)[k];
    const a = (patch as any)[k];
    if (b !== a && typeof a !== "object") {
      entries.push(
        audit({
          action: k === "status" ? "status_change" : "updated",
          field: String(k),
          before: b !== undefined && b !== null ? String(b) : "",
          after: a !== undefined && a !== null ? String(a) : "",
        }),
      );
    }
  }
  const updated: Receipt = {
    ...before,
    ...patch,
    audit_log: [...log, ...entries],
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  saveReceipts(all);
  bgSync(updated);
}

export function deleteReceipts(ids: string[]) {
  const all = loadReceipts().filter((r) => !(ids.includes(r.id) && !r.locked));
  saveReceipts(all);
  ids.forEach(bgDelete);
}

export function setStatusBulk(ids: string[], status: ReceiptStatus) {
  const all = loadReceipts();
  for (const r of all) {
    if (!ids.includes(r.id) || r.locked) continue;
    const log = r.audit_log || [];
    log.push(audit({ action: "status_change", field: "status", before: r.status, after: status }));
    r.status = status;
    r.audit_log = log;
    if (status === "freigegeben") r.locked = true;
  }
  saveReceipts(all);
  const updated = all.filter((r) => ids.includes(r.id));
  updated.forEach(bgSync);
}

export function markPaid(ids: string[], date: string) {
  const all = loadReceipts();
  for (const r of all) {
    if (!ids.includes(r.id) || r.locked) continue;
    const log = r.audit_log || [];
    log.push(audit({ action: "updated", field: "paid_at", before: r.paid_at || "", after: date }));
    r.paid_at = date;
    r.audit_log = log;
  }
  saveReceipts(all);
  const updated = all.filter((r) => ids.includes(r.id));
  updated.forEach(bgSync);
}

export function resetToDemo() {
  saveReceipts(generateDemoReceipts());
}

// ─────────────────────────────────────────────────────────
// Cloud-Sync: Supabase ↔ localStorage
// ─────────────────────────────────────────────────────────

/**
 * Beim ersten App-Start eines echten Users:
 * Lädt Belege aus Supabase wenn localStorage leer ist.
 * Gibt true zurück wenn Daten geladen wurden.
 */
export async function initFromSupabase(): Promise<boolean> {
  if (!isBrowser() || !isRealUser()) return false;
  const raw = localStorage.getItem(KEY);
  if (raw && raw !== "[]") return false; // localStorage hat schon Daten

  const receipts = await loadReceiptsFromSupabase();
  if (!receipts || receipts.length === 0) return false;

  localStorage.setItem(KEY, JSON.stringify(receipts));
  return true;
}

/**
 * Synchronisiert alle noch nicht gesyncten Belege aus der Pending-Queue.
 * Aufrufen z.B. beim App-Start nach Reconnect.
 */
export async function flushPendingSync(): Promise<void> {
  if (!isBrowser() || !isRealUser()) return;
  const pending: string[] = JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) || "[]");
  if (pending.length === 0) return;

  const all = loadReceipts();
  const toSync = all.filter((r) => pending.includes(r.id));
  if (toSync.length === 0) {
    localStorage.removeItem(SYNC_PENDING_KEY);
    return;
  }

  const synced = await pushLocalToSupabase(toSync);
  if (synced === toSync.length) {
    localStorage.removeItem(SYNC_PENDING_KEY);
  }
}
