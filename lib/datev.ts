import type { Receipt } from "./types";

/**
 * DATEV EXTF Buchungsstapel — Format-Version 13, Versionsnummer 700
 *
 * Österreich SKR04 — Aufwandskonten
 * BU-Schlüssel: 10=20% (AT), 08=10% (AT), 13=13% (AT), 90=RC/steuerfrei
 */

const SKR04_AT: Record<string, string> = {
  "Wareneinkauf":          "5100",
  "Werkzeug & Material":   "5600",
  "Fahrtkosten":           "7320",
  "Bewirtung":             "7650",
  "Werbung & Marketing":   "7200",
  "Bürobedarf":            "7400",
  "Telefon & Internet":    "7410",
  "Software":              "7430",
  "Miete":                 "7300",
  "Versicherungen":        "7510",
  "Sonstiges":             "7800",
};

const GEGENKONTO: Record<string, string> = {
  "Bar":          "2700",
  "Karte":        "2800",
  "Überweisung":  "2800",
  "Lastschrift":  "2800",
  "PayPal":       "2810",
};

function getBuKey(receipt: Receipt): string {
  const vat = receipt.vat_amount || 0;
  const net = receipt.net_amount || 0;
  if (vat === 0) {
    const t = (receipt as any).vat_treatment || "";
    if (t.includes("reverse_charge")) return "90";
    return "";
  }
  const rate = net > 0 ? Math.round((vat / net) * 100) : 0;
  if (rate >= 19 && rate <= 21) return "10";
  if (rate >= 9 && rate <= 11) return "08";
  if (rate >= 12 && rate <= 14) return "13";
  return "10";
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function deNumber(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function datevDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}${m}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function buildDatevCSV(receipts: Receipt[], periodLabel: string): string {
  const now = new Date();
  const ts =
    now.getFullYear() +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds()) +
    String(now.getMilliseconds()).padStart(3, "0");

  const filtered = receipts.filter(
    (r) => r.status === "geprueft" || r.status === "freigegeben",
  );

  const dates = filtered.map((r) => r.receipt_date).sort();
  const firstIso = dates[0] || now.toISOString().slice(0, 10);
  const lastIso = dates[dates.length - 1] || firstIso;
  const datumVon = firstIso.replace(/-/g, "");
  const datumBis = lastIso.replace(/-/g, "");
  const wjBeginn = datumVon.slice(0, 4) + "0101";

  // EXTF Vorlaufsatz (Zeile 1) — Formatversion 13, Versionsnummer 700
  const headerLine =
    `"EXTF";700;21;"Buchungsstapel";13;${ts};;` +
    `"KL";"Klarblick";"";0;0;${wjBeginn};4;${datumVon};${datumBis};` +
    `"${periodLabel.slice(0, 30)}";"";1;0;0;"EUR"`;

  // Feldnamen (Zeile 2)
  const colLine =
    `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";` +
    `"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";` +
    `"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext";"Postensperre"`;

  const rows = filtered.map((r) => {
    const konto = SKR04_AT[r.category] || "7800";
    const gegenkonto = GEGENKONTO[r.payment_method] || "2800";
    const buKey = getBuKey(r);
    const datum = datevDate(r.receipt_date);
    const belegnr = r.receipt_number || r.id.slice(0, 12);
    const buchungstext = `${r.supplier_name} - ${r.category}${r.notes ? ` - ${r.notes.slice(0, 30)}` : ""}`;

    return [
      deNumber(r.gross_amount),
      "S",
      "EUR",
      "",
      "",
      "",
      konto,
      gegenkonto,
      buKey,
      datum,
      belegnr,
      "",
      "",
      buchungstext.slice(0, 60),
      "0",
    ]
      .map(csvEscape)
      .join(";");
  });

  return [headerLine, colLine, ...rows].join("\r\n");
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
