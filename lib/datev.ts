import type { Receipt } from "./types";

/**
 * DATEV Buchungsstapel-Export (Format EXTF)
 *
 * Österreich-spezifische Anpassungen:
 * - SKR04 (Österreich) statt SKR03 (Deutschland)
 * - BU-Schlüssel nach österr. Kontenrahmen:
 *     BU 10 = 20% USt (AT-Normalsteuersatz)
 *     BU 08 = 10% USt (ermäßigt AT)
 *     BU 13 = 13% USt (Sonder AT)
 *     BU 90 = steuerfrei / Reverse Charge
 *     ""    = kein Steuerschlüssel (Versicherungen, etc.)
 *
 * WICHTIG: Dieses Mapping ist ein Vorschlag — der Steuerberater
 * muss die Kontonummern an seinen spezifischen Kontenrahmen anpassen.
 */

// Österreich SKR04 — Aufwandskonten
const SKR04_AT: Record<string, string> = {
  "Wareneinkauf":          "5100",  // Wareneinsatz
  "Werkzeug & Material":   "5600",  // Materialaufwand
  "Fahrtkosten":           "7320",  // Reise- und Fahrtkosten
  "Bewirtung":             "7650",  // Bewirtungsaufwand (50% steuerlich)
  "Werbung & Marketing":   "7200",  // Werbeaufwand
  "Bürobedarf":            "7400",  // Büro- und Verwaltungskosten
  "Telefon & Internet":    "7410",  // Fernmeldegebühren
  "Software":              "7430",  // EDV-Kosten, Lizenzen
  "Miete":                 "7300",  // Raumkosten/Miete
  "Versicherungen":        "7510",  // Versicherungen
  "Sonstiges":             "7800",  // Sonstige betriebliche Aufwendungen
};

// Gegenkonten (Zahlung)
const GEGENKONTO: Record<string, string> = {
  "Bar":          "2700",  // Kasse (SKR04 AT)
  "Karte":        "2800",  // Girokonten
  "Überweisung":  "2800",  // Girokonten
  "Lastschrift":  "2800",  // Girokonten
  "PayPal":       "2810",  // Sonstige Zahlungsmittel
};

// BU-Schlüssel nach österr. USt-Satz
function getBuKey(receipt: Receipt): string {
  const vat = receipt.vat_amount || 0;
  const net = receipt.net_amount || 0;
  if (vat === 0) {
    // Steuerfrei oder Reverse Charge
    const t = (receipt as any).vat_treatment || "";
    if (t.includes("reverse_charge")) return "90"; // RC §19
    if (t.includes("steuerfrei")) return "";
    return "";
  }
  const rate = net > 0 ? Math.round((vat / net) * 100) : 0;
  if (rate >= 19 && rate <= 21) return "10"; // 20% AT
  if (rate >= 9 && rate <= 11) return "08";  // 10% AT
  if (rate >= 12 && rate <= 14) return "13"; // 13% AT
  return "10"; // Fallback 20%
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
  // DDMM (DATEV-Format ohne Jahr)
  const [, m, d] = iso.split("-");
  return `${d}${m}`;
}

export function buildDatevCSV(receipts: Receipt[], periodLabel: string): string {
  // DATEV EXTF Header (vereinfacht)
  const exportDate = new Date().toLocaleDateString("de-AT").replace(/\./g, "");
  const metaHeader = [
    `"EXTF";510;21;"Buchungsstapel";7;${exportDate};;;;"Klarblick";"";1;0;;;"";"EUR"`,
    `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext";"Postensperre";"Info 1";"Info 2"`,
  ].join("\r\n");

  const rows = receipts
    .filter((r) => r.status === "geprueft" || r.status === "freigegeben")
    .map((r) => {
      const konto = SKR04_AT[r.category] || "7800";
      const gegenkonto = GEGENKONTO[r.payment_method] || "2800";
      const buKey = getBuKey(r);
      const datum = datevDate(r.receipt_date);
      const belegnr = r.receipt_number || r.id.slice(0, 12);
      const buchungstext = `${r.supplier_name} - ${r.category}${r.notes ? ` - ${r.notes.slice(0, 30)}` : ""}`;

      return [
        deNumber(r.gross_amount),   // Umsatz
        "S",                         // Soll/Haben (S = Soll = Aufwand)
        "EUR",                       // WKZ
        "",                          // Kurs
        "",                          // Basis-Umsatz
        "",                          // WKZ Basis-Umsatz
        konto,                       // Aufwandskonto SKR04 AT
        gegenkonto,                  // Gegenkonto (Bank/Kasse)
        buKey,                       // BU-Schlüssel (Steuer)
        datum,                       // Belegdatum DDMM
        belegnr,                     // Belegfeld 1
        "",                          // Belegfeld 2
        "",                          // Skonto
        buchungstext.slice(0, 60),   // Buchungstext max 60 Zeichen
        "0",                         // Postensperre
        r.id,                        // Info 1 (interne ID)
        "",                          // Info 2
      ].map(csvEscape).join(";");
    });

  const footer = `# Klarblick DATEV-Export AT · ${periodLabel} · ${rows.length} Buchungen · SKR04 · ${new Date().toLocaleString("de-AT")}`;
  const hint = `# HINWEIS: Kontenrahmen SKR04 AT (Vorschlag). Steuerberater muss Konten prüfen und ggf. anpassen.`;

  return [metaHeader, ...rows, "", footer, hint].join("\r\n");
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
