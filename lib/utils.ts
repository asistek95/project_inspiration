import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value || 0);
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function monthLabel(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(date);
}

export function monthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Berechnet die Fälligkeit eines Belegs aus receipt_date + payment_terms.net_days.
 * Fällt auf 14 Tage zurück wenn keine payment_terms gesetzt sind.
 */
export function computeDueDate(receipt: {
  receipt_date: string;
  payment_terms?: { net_days: number } | null;
}): string {
  const netDays = receipt.payment_terms?.net_days ?? 14;
  const d = new Date(receipt.receipt_date);
  d.setDate(d.getDate() + netDays);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string, paidAt?: string | null): boolean {
  if (paidAt) return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
