import type { Receipt } from "./types";
import { monthKey } from "./utils";

export interface UspStats {
  /** Prognose der Brutto-Ausgaben für die nächsten 30 Tage. */
  cashflow_forecast_30d: number;
  /** Wahrscheinliche Vorsteuer-Rückerstattung (Summe der erfassten MwSt.). */
  vat_refund: number;
  /** Geschätzte Einkommensteuer-Ersparnis durch Betriebsausgaben (KöSt 23 % AT default). */
  tax_saving_estimate: number;
  /** Anteil wiederkehrender Lieferanten (Abos / Fixkosten) an den Ausgaben in %. */
  recurring_share_pct: number;
  /** Top 1 Sparpotenzial: Lieferant + Betrag, der im aktuellen Monat überproportional gewachsen ist. */
  biggest_jump: { supplier: string; delta_pct: number; current: number } | null;
  /** Confidence-gewichtete Brutto-Summe (Belege mit niedriger Confidence zählen weniger). */
  weighted_total: number;
  /** Belege, die Steuerberater-Risiko bergen (fehlende MwSt., unsicher, >EUR 1000 ohne Rechnung). */
  advisor_risk_count: number;
  /** Branchen-Benchmark: Material/Wareneinkauf in % vs. 60 % Median KMU AT (vereinfacht). */
  material_ratio: { value_pct: number; benchmark_pct: number };
  /** Tage bis Steuerberater-Übergabe wenn aktuelles Tempo gehalten wird. */
  days_to_advisor_ready: number;
}

const AT_TAX_RATE = 0.23; // KöSt + grobe ESt-Annahme für KMU
const RECURRING_HINTS = [
  /telekom/i,
  /vodafone/i,
  /magenta/i,
  /a1/i,
  /microsoft/i,
  /adobe/i,
  /canva/i,
  /google ads/i,
  /meta ads/i,
  /allianz/i,
  /uniqa/i,
  /hdi/i,
  /datev/i,
  /miete/i,
  /vermietung/i,
];

function isRecurring(supplier: string, category: string): boolean {
  if (["Telefon & Internet", "Software", "Versicherungen", "Miete"].includes(category)) return true;
  return RECURRING_HINTS.some((re) => re.test(supplier));
}

export function computeUspStats(receipts: Receipt[]): UspStats {
  if (receipts.length === 0) {
    return {
      cashflow_forecast_30d: 0,
      vat_refund: 0,
      tax_saving_estimate: 0,
      recurring_share_pct: 0,
      biggest_jump: null,
      weighted_total: 0,
      advisor_risk_count: 0,
      material_ratio: { value_pct: 0, benchmark_pct: 60 },
      days_to_advisor_ready: 0,
    };
  }

  // ── Monatsaggregat
  const byMonth: Record<string, { total: number; bySupplier: Record<string, number>; byCat: Record<string, number> }> = {};
  for (const r of receipts) {
    const k = monthKey(r.receipt_date);
    if (!byMonth[k]) byMonth[k] = { total: 0, bySupplier: {}, byCat: {} };
    byMonth[k].total += r.gross_amount;
    byMonth[k].bySupplier[r.supplier_name] = (byMonth[k].bySupplier[r.supplier_name] || 0) + r.gross_amount;
    byMonth[k].byCat[r.category] = (byMonth[k].byCat[r.category] || 0) + r.gross_amount;
  }
  const months = Object.keys(byMonth).sort();
  const lastK = months[months.length - 1];
  const prevK = months[months.length - 2];

  // ── Cashflow Forecast: gewichteter Schnitt letzte 3 Monate
  const recent = months.slice(-3);
  const avg =
    recent.reduce((s, k, i) => s + byMonth[k].total * (i + 1), 0) /
    Math.max(recent.reduce((s, _, i) => s + (i + 1), 0), 1);

  // ── Vorsteuer
  const vat_refund = receipts.reduce((s, r) => s + (r.vat_amount || 0), 0);

  // ── Steuer-Ersparnis = Netto-Betriebsausgaben × Steuersatz
  const total_net = receipts.reduce((s, r) => s + (r.net_amount || 0), 0);
  const tax_saving_estimate = total_net * AT_TAX_RATE;

  // ── Wiederkehrend
  const total = receipts.reduce((s, r) => s + r.gross_amount, 0);
  const recurring = receipts
    .filter((r) => isRecurring(r.supplier_name, r.category))
    .reduce((s, r) => s + r.gross_amount, 0);
  const recurring_share_pct = total > 0 ? Math.round((recurring / total) * 100) : 0;

  // ── Biggest jump
  let biggest_jump: UspStats["biggest_jump"] = null;
  if (lastK && prevK) {
    let maxDelta = 0;
    const cur = byMonth[lastK].bySupplier;
    const prv = byMonth[prevK].bySupplier;
    for (const sup of Object.keys(cur)) {
      const now = cur[sup];
      const before = prv[sup] || 0;
      if (before > 50 && now > before) {
        const d = ((now - before) / before) * 100;
        if (d > maxDelta && d >= 20) {
          maxDelta = d;
          biggest_jump = { supplier: sup, delta_pct: Math.round(d), current: now };
        }
      }
    }
  }

  // ── Weighted total (Confidence)
  const weighted_total = receipts.reduce(
    (s, r) => s + r.gross_amount * (r.confidence_score || 0.8),
    0
  );

  // ── Advisor-Risk
  const advisor_risk_count = receipts.filter((r) => {
    if (r.status === "unsicher") return true;
    if (r.vat_amount === 0 && r.gross_amount > 50 && r.category !== "Versicherungen" && r.category !== "Miete")
      return true;
    if (r.gross_amount > 1000 && r.receipt_type !== "Rechnung") return true;
    return false;
  }).length;

  // ── Branchen-Vergleich Material-Anteil
  const matCats = ["Wareneinkauf", "Werkzeug & Material"];
  const matSum = receipts
    .filter((r) => matCats.includes(r.category))
    .reduce((s, r) => s + r.gross_amount, 0);
  const value_pct = total > 0 ? Math.round((matSum / total) * 100) : 0;

  // ── Days to advisor ready
  const checked = receipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length;
  const ratio = receipts.length > 0 ? checked / receipts.length : 0;
  const remaining = Math.max(receipts.length - checked, 0);
  // Annahme: User prüft 5 Belege/Tag
  const days_to_advisor_ready = ratio >= 1 ? 0 : Math.ceil(remaining / 5);

  return {
    cashflow_forecast_30d: Math.round(avg),
    vat_refund: Math.round(vat_refund),
    tax_saving_estimate: Math.round(tax_saving_estimate),
    recurring_share_pct,
    biggest_jump,
    weighted_total: Math.round(weighted_total),
    advisor_risk_count,
    material_ratio: { value_pct, benchmark_pct: 60 },
    days_to_advisor_ready,
  };
}
