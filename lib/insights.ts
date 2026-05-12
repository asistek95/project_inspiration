import type { Receipt, Insight } from "./types";
import { monthKey } from "./utils";

interface MonthAgg {
  total: number;
  byCategory: Record<string, number>;
  bySupplier: Record<string, number>;
  count: number;
}

function aggregate(receipts: Receipt[]): Record<string, MonthAgg> {
  const out: Record<string, MonthAgg> = {};
  for (const r of receipts) {
    const k = monthKey(r.receipt_date);
    if (!out[k]) out[k] = { total: 0, byCategory: {}, bySupplier: {}, count: 0 };
    out[k].total += r.gross_amount;
    out[k].count++;
    out[k].byCategory[r.category] = (out[k].byCategory[r.category] || 0) + r.gross_amount;
    out[k].bySupplier[r.supplier_name] = (out[k].bySupplier[r.supplier_name] || 0) + r.gross_amount;
  }
  return out;
}

/**
 * Berechnet Insights für den jüngsten Monat aus den Belegen.
 */
export function buildInsights(receipts: Receipt[]): Insight[] {
  if (receipts.length === 0) return [];
  const agg = aggregate(receipts);
  const months = Object.keys(agg).sort();
  const current = months[months.length - 1];
  const prev = months[months.length - 2];
  const cur = agg[current];
  const insights: Insight[] = [];

  // 1) Kategorie-Steigerungen
  if (prev) {
    const prevAgg = agg[prev];
    for (const cat of Object.keys(cur.byCategory)) {
      const now = cur.byCategory[cat];
      const before = prevAgg.byCategory[cat] || 0;
      if (before > 0 && now > before) {
        const diff = ((now - before) / before) * 100;
        if (diff >= 25) {
          insights.push({
            type: "cost_increase",
            severity: diff >= 60 ? "high" : "medium",
            title: `${cat} deutlich gestiegen`,
            description: `${cat} liegen ${Math.round(diff)} % höher als im Vormonat.`,
            action: `Prüfe, ob alle Buchungen in ${cat} betrieblich sind.`,
          });
        }
      }
    }
  }

  // 2) Größter Kostenblock
  const sortedCats = Object.entries(cur.byCategory).sort((a, b) => b[1] - a[1]);
  if (sortedCats[0]) {
    const [cat, val] = sortedCats[0];
    const share = (val / cur.total) * 100;
    insights.push({
      type: "top_category",
      severity: "low",
      title: `${cat} ist dein größter Kostenblock`,
      description: `${cat} macht ${Math.round(share)} % deiner Ausgaben aus.`,
    });
  }

  // 3) Lieferantenkonzentration
  const sortedSup = Object.entries(cur.bySupplier).sort((a, b) => b[1] - a[1]);
  const top3 = sortedSup.slice(0, 3).reduce((s, [, v]) => s + v, 0);
  if (cur.total > 0 && top3 / cur.total >= 0.4 && sortedSup.length >= 3) {
    insights.push({
      type: "supplier_concentration",
      severity: "medium",
      title: "Hohe Abhängigkeit von wenigen Lieferanten",
      description: `3 Lieferanten machen ${Math.round((top3 / cur.total) * 100)} % deiner Ausgaben aus.`,
      action: "Prüfe, ob du Risiko durch Alternativen reduzieren kannst.",
    });
  }

  // 4) Unsichere Belege
  const uncertain = receipts.filter((r) => r.status === "unsicher").length;
  if (uncertain > 0) {
    insights.push({
      type: "uncertain_receipts",
      severity: uncertain >= 5 ? "high" : "medium",
      title: `${uncertain} unsichere Belege`,
      description: `Die KI ist sich bei ${uncertain} Belegen nicht sicher.`,
      action: "Diese Belege sollten geprüft oder korrigiert werden.",
    });
  }

  // 5) Ungeprüfte Belege
  const ungeprueft = receipts.filter((r) => r.status === "ungeprueft").length;
  if (ungeprueft > 0) {
    insights.push({
      type: "unchecked",
      severity: ungeprueft >= 10 ? "medium" : "low",
      title: `${ungeprueft} Belege müssen noch geprüft werden`,
      description: "Bestätige die erkannten Daten mit einem Klick.",
      action: "Öffne die Belegliste und nutze 'Stimmt alles'.",
    });
  }

  // 6) Auffälliger Einzelbeleg
  const big = [...receipts].sort((a, b) => b.gross_amount - a.gross_amount)[0];
  if (big && big.gross_amount > 1000) {
    insights.push({
      type: "large_single",
      severity: "low",
      title: "Großer Einzelbeleg",
      description: `Ein Beleg von ${big.supplier_name} über ${big.gross_amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}.`,
    });
  }

  // 7) Steuerberater-Status
  const advisorReady = receipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length;
  const total = receipts.length;
  const pct = total ? Math.round((advisorReady / total) * 100) : 0;
  insights.push({
    type: "advisor_progress",
    severity: pct >= 80 ? "low" : "medium",
    title: `Steuerberater-Paket zu ${pct} % bereit`,
    description: `${advisorReady} von ${total} Belegen sind geprüft.`,
    action: pct < 100 ? "Prüfe die offenen Belege, um das Paket abzuschließen." : undefined,
  });

  return insights;
}

export function periodStats(receipts: Receipt[]) {
  const total_gross = receipts.reduce((s, r) => s + r.gross_amount, 0);
  const total_vat = receipts.reduce((s, r) => s + r.vat_amount, 0);
  const total_net = receipts.reduce((s, r) => s + r.net_amount, 0);
  const checked = receipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length;
  const uncertain = receipts.filter((r) => r.status === "unsicher").length;
  const unchecked = receipts.filter((r) => r.status === "ungeprueft").length;
  return {
    total_gross,
    total_vat,
    total_net,
    count: receipts.length,
    checked,
    uncertain,
    unchecked,
    advisorReadyPct: receipts.length ? Math.round((checked / receipts.length) * 100) : 0,
  };
}

export function groupByCategory(receipts: Receipt[]) {
  const map: Record<string, number> = {};
  for (const r of receipts) map[r.category] = (map[r.category] || 0) + r.gross_amount;
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

export function groupBySupplier(receipts: Receipt[], limit = 10) {
  const map: Record<string, number> = {};
  for (const r of receipts) map[r.supplier_name] = (map[r.supplier_name] || 0) + r.gross_amount;
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function groupByMonth(receipts: Receipt[]) {
  const map: Record<string, number> = {};
  for (const r of receipts) {
    const k = monthKey(r.receipt_date);
    map[k] = (map[k] || 0) + r.gross_amount;
  }
  return Object.entries(map)
    .map(([key, value]) => {
      const [y, m] = key.split("-");
      return {
        key,
        name: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("de-DE", {
          month: "short",
          year: "2-digit",
        }),
        value: Math.round(value * 100) / 100,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function statusDistribution(receipts: Receipt[]) {
  const map: Record<string, number> = {
    geprueft: 0,
    ungeprueft: 0,
    unsicher: 0,
    freigegeben: 0,
  };
  for (const r of receipts) map[r.status] = (map[r.status] || 0) + 1;
  return [
    { name: "Geprüft", value: map.geprueft, color: "#10b981" },
    { name: "Ungeprüft", value: map.ungeprueft, color: "#94a3b8" },
    { name: "Unsicher", value: map.unsicher, color: "#f59e0b" },
    { name: "An Steuerberater", value: map.freigegeben, color: "#2563eb" },
  ];
}
