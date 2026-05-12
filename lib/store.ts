"use client";

import type { Receipt, ReceiptStatus } from "./types";
import { generateDemoReceipts } from "./demo-data";

const KEY = "klarblick.receipts.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadReceipts(): Receipt[] {
  if (!isBrowser()) return generateDemoReceipts();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const demo = generateDemoReceipts();
      localStorage.setItem(KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw) as Receipt[];
  } catch {
    return generateDemoReceipts();
  }
}

export function saveReceipts(receipts: Receipt[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(receipts));
}

export function upsertReceipt(r: Receipt) {
  const all = loadReceipts();
  const idx = all.findIndex((x) => x.id === r.id);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  saveReceipts(all);
}

export function updateReceipt(id: string, patch: Partial<Receipt>) {
  const all = loadReceipts();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch, updated_at: new Date().toISOString() };
  saveReceipts(all);
}

export function deleteReceipts(ids: string[]) {
  const all = loadReceipts().filter((r) => !ids.includes(r.id));
  saveReceipts(all);
}

export function setStatusBulk(ids: string[], status: ReceiptStatus) {
  const all = loadReceipts();
  for (const r of all) if (ids.includes(r.id)) r.status = status;
  saveReceipts(all);
}

export function resetToDemo() {
  saveReceipts(generateDemoReceipts());
}
