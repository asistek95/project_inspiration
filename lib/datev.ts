import type { Receipt } from "./types";

/**
 * DATEV-Kontenrahmen SKR03 (vereinfachtes Mapping für MVP).
 * Für echte Buchhaltung muss der Steuerberater diese Konten konfigurieren.
 */
const SKR03_MAP: Record<string, string> = {
  Wareneinkauf: "3400",
  "Werkzeug & Material": "4985",
  Fahrtkosten: "4530",
  Bewirtung: "4650",
  "Werbung & Marketing": "4610",
  Bürobedarf: "4930",
  "Telefon & Internet": "4920",
  Software: "4940",
  Miete: "4210",
  Versicherungen: "4360",
  Sonstiges: "4900",
};

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

/**
 * Erzeugt DATEV-kompatiblen CSV-Buchungsstapel-Export (vereinfachtes Format).
 * Echtes DATEV-Format hat 116 Spalten + Header — dies ist eine
 * exportierbare CSV, die Steuerberater einlesen oder als Beleg-Liste nutzen können.
 */
export function buildDatevCSV(receipts: Receipt[], periodLabel: string): string {
  const header = [
    "Umsatz (ohne Soll/Haben-Kz)",
    "Soll/Haben-Kennzeichen",
    "WKZ Umsatz",
    "Kurs",
    "Basis-Umsatz",
    "WKZ Basis-Umsatz",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Belegdatum",
    "Belegfeld 1",
    "Belegfeld 2",
    "Skonto",
    "Buchungstext",
    "Beleg-Link",
  ].map(csvEscape).join(";");

  const rows = receipts.map((r) => {
    const konto = SKR03_MAP[r.category] || "4900";
    const gegenkonto = r.payment_method === "Bar" ? "1000" : "1200"; // Kasse vs Bank
    const buKey =
      r.vat_amount === 0 ? "" : r.category === "Bewirtung" ? "8" : "9"; // 8=7%, 9=19%
    const datum = r.receipt_date.split("-").reverse().join(""); // DDMMYYYY
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
      r.id.slice(0, 12),
      "",
      "",
      `${r.supplier_name} - ${r.category}`,
      r.file_url || "",
    ].map(csvEscape).join(";");
  });

  const meta = `# Klarblick DATEV-Export · ${periodLabel} · ${receipts.length} Belege · Erstellt ${new Date().toLocaleString("de-DE")}`;
  return [meta, header, ...rows].join("\r\n");
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
