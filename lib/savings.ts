import type { Receipt } from "./types";
import { monthKey } from "./utils";

export interface PriceWatchItem {
  supplier: string;
  category: string;
  prev_avg: number;
  current_avg: number;
  delta_pct: number;
  delta_eur: number;
  receipts_count: number;
}

export interface SkontoLossItem {
  receipt_id: string;
  supplier: string;
  date: string;
  gross: number;
  skonto_pct: number;
  days: number;
  lost_eur: number;
  paid_late: boolean;
}

export interface RecurringItem {
  supplier: string;
  category: string;
  monthly_eur: number;
  yearly_eur: number;
  last_seen: string;
  count: number;
}

/**
 * Preis-Wächter — vergleicht Durchschnitts-Brutto pro Lieferant aktueller
 * Monat vs. Vormonat. Zeigt nur Lieferanten mit Anstieg ab +5 %.
 */
export function priceWatch(receipts: Receipt[]): PriceWatchItem[] {
  if (receipts.length === 0) return [];
  const months = Array.from(new Set(receipts.map((r) => monthKey(r.receipt_date)))).sort();
  const current = months[months.length - 1];
  const prev = months[months.length - 2];
  if (!current || !prev) return [];

  const cur: Record<string, { sum: number; n: number; cat: string }> = {};
  const pre: Record<string, { sum: number; n: number; cat: string }> = {};
  for (const r of receipts) {
    const k = monthKey(r.receipt_date);
    const bucket = k === current ? cur : k === prev ? pre : null;
    if (!bucket) continue;
    if (!bucket[r.supplier_name]) bucket[r.supplier_name] = { sum: 0, n: 0, cat: r.category };
    bucket[r.supplier_name].sum += r.gross_amount;
    bucket[r.supplier_name].n += 1;
  }

  const out: PriceWatchItem[] = [];
  for (const sup of Object.keys(cur)) {
    if (!pre[sup]) continue;
    const a = cur[sup].sum / cur[sup].n;
    const b = pre[sup].sum / pre[sup].n;
    if (b <= 0) continue;
    const delta = ((a - b) / b) * 100;
    if (delta >= 5) {
      out.push({
        supplier: sup,
        category: cur[sup].cat,
        prev_avg: Math.round(b * 100) / 100,
        current_avg: Math.round(a * 100) / 100,
        delta_pct: Math.round(delta * 10) / 10,
        delta_eur: Math.round((a - b) * 100) / 100,
        receipts_count: cur[sup].n,
      });
    }
  }
  return out.sort((a, b) => b.delta_pct - a.delta_pct);
}

/**
 * Skonto-Alarm — berechnet verlorenes Skonto bei Rechnungen mit
 * Zahlungsbedingungen, die zu spät bezahlt wurden.
 */
export function skontoLoss(receipts: Receipt[]): { total: number; items: SkontoLossItem[] } {
  const items: SkontoLossItem[] = [];
  for (const r of receipts) {
    if (!r.payment_terms || r.receipt_type !== "Rechnung") continue;
    const dateObj = new Date(r.receipt_date);
    const paidObj = r.paid_at ? new Date(r.paid_at) : null;
    const skontoDeadline = new Date(dateObj);
    skontoDeadline.setDate(skontoDeadline.getDate() + r.payment_terms.days);

    const paidLate = paidObj ? paidObj > skontoDeadline : new Date() > skontoDeadline;
    const lost = Math.round(r.gross_amount * (r.payment_terms.skonto_pct / 100) * 100) / 100;

    items.push({
      receipt_id: r.id,
      supplier: r.supplier_name,
      date: r.receipt_date,
      gross: r.gross_amount,
      skonto_pct: r.payment_terms.skonto_pct,
      days: r.payment_terms.days,
      lost_eur: lost,
      paid_late: paidLate,
    });
  }
  const lostItems = items.filter((i) => i.paid_late);
  const total = lostItems.reduce((s, i) => s + i.lost_eur, 0);
  return { total: Math.round(total * 100) / 100, items: lostItems.sort((a, b) => b.lost_eur - a.lost_eur) };
}

/**
 * Abo-Falle — alle wiederkehrenden Belege gruppiert mit
 * geschätzter Monats- und Jahresbelastung.
 */
export function recurringSubscriptions(receipts: Receipt[]): RecurringItem[] {
  const grouped: Record<string, { sum: number; n: number; cat: string; last: string }> = {};
  for (const r of receipts) {
    if (!r.is_recurring) continue;
    if (!grouped[r.supplier_name]) {
      grouped[r.supplier_name] = { sum: 0, n: 0, cat: r.category, last: r.receipt_date };
    }
    grouped[r.supplier_name].sum += r.gross_amount;
    grouped[r.supplier_name].n += 1;
    if (r.receipt_date > grouped[r.supplier_name].last) {
      grouped[r.supplier_name].last = r.receipt_date;
    }
  }
  return Object.entries(grouped)
    .map(([sup, g]) => {
      const monthly = g.sum / Math.max(g.n, 1);
      return {
        supplier: sup,
        category: g.cat,
        monthly_eur: Math.round(monthly * 100) / 100,
        yearly_eur: Math.round(monthly * 12 * 100) / 100,
        last_seen: g.last,
        count: g.n,
      };
    })
    .sort((a, b) => b.monthly_eur - a.monthly_eur);
}

/**
 * Gesamt-Spar-Potenzial in EUR (Skonto verloren + 20% Abo-Reduktion möglich).
 */
export function savingsPotential(receipts: Receipt[]) {
  const skonto = skontoLoss(receipts).total;
  const subs = recurringSubscriptions(receipts);
  const subsYearly = subs.reduce((s, x) => s + x.yearly_eur, 0);
  const subsPotential = Math.round(subsYearly * 0.2 * 100) / 100; // konservative Schätzung
  return {
    skonto_lost: skonto,
    subs_yearly: Math.round(subsYearly * 100) / 100,
    subs_potential: subsPotential,
    total: Math.round((skonto + subsPotential) * 100) / 100,
  };
}
