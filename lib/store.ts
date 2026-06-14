"use client";

import type { Receipt, ReceiptStatus, AuditEntry } from "./types";
import { generateDemoReceipts } from "./demo-data";

const KEY = "klarblick.receipts.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function audit(entry: Omit<AuditEntry, "ts" | "by">, user = "demo-user"): AuditEntry {
  return { ts: new Date().toISOString(), by: user, ...entry };
}

function isRealUser(): boolean {
  return isBrowser() && localStorage.getItem("klarblick.realUser") === "1";
}

export function loadReceipts(): Receipt[] {
  if (!isBrowser()) return generateDemoReceipts();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // Eingeloggter Supabase-User startet mit leerer Liste
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
  if (idx >= 0) {
    if (all[idx].locked) return; // GoBD-Sperre
    const log = all[idx].audit_log || [];
    all[idx] = { ...r, audit_log: [...log, audit({ action: "updated" })] };
  } else {
    all.unshift({ ...r, audit_log: [audit({ action: "created" })] });
  }
  saveReceipts(all);
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
  all[idx] = {
    ...before,
    ...patch,
    audit_log: [...log, ...entries],
    updated_at: new Date().toISOString(),
  };
  saveReceipts(all);
}

export function deleteReceipts(ids: string[]) {
  // GoBD: gesperrte Belege bleiben erhalten
  const all = loadReceipts().filter((r) => !(ids.includes(r.id) && !r.locked));
  saveReceipts(all);
}

export function setStatusBulk(ids: string[], status: ReceiptStatus) {
  const all = loadReceipts();
  for (const r of all) {
    if (!ids.includes(r.id) || r.locked) continue;
    const log = r.audit_log || [];
    log.push(audit({ action: "status_change", field: "status", before: r.status, after: status }));
    r.status = status;
    r.audit_log = log;
    if (status === "freigegeben") r.locked = true; // Übergabe = Sperre
  }
  saveReceipts(all);
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
}

export function resetToDemo() {
  saveReceipts(generateDemoReceipts());
}
