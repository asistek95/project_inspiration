import * as XLSX from "xlsx";
import type { Receipt } from "./types";

export function buildExcelWorkbook(
  receipts: Receipt[],
  periodLabel: string,
  companyName: string
): Blob {
  const wb = XLSX.utils.book_new();

  const eingang = receipts.filter(
    (r) => r.invoice_type === "eingang" || r.direction === "eingang"
  );
  const ausgang = receipts.filter(
    (r) => r.invoice_type === "ausgang" || r.direction === "ausgang"
  );
  const offene = receipts.filter(
    (r) => !r.paid_at && r.receipt_type === "Rechnung"
  );

  const totalEingang = eingang.reduce((s, r) => s + r.gross_amount, 0);
  const totalAusgang = ausgang.reduce((s, r) => s + r.gross_amount, 0);
  const vorsteuer = eingang.reduce((s, r) => s + r.vat_amount, 0);
  const ustSchuld = ausgang.reduce((s, r) => s + r.vat_amount, 0);

  // ── Tab 1: Übersicht ──────────────────────────────────────────────────────
  addSheet(wb, "Übersicht", [
    ["Klarblick — Monatsbericht", periodLabel],
    ["Unternehmen", companyName],
    ["Erstellt am", new Date().toLocaleDateString("de-AT")],
    [],
    ["KENNZAHL", "BETRAG (EUR)"],
    ["Umsatz (Ausgangsrechnungen)", fmtNum(totalAusgang)],
    ["Kosten (Eingangsrechnungen)", fmtNum(totalEingang)],
    ["Schätz-Gewinn", fmtNum(totalAusgang - totalEingang)],
    [],
    ["Umsatzsteuer (schulde ich)", fmtNum(ustSchuld)],
    ["Vorsteuer (bekomme ich zurück)", fmtNum(vorsteuer)],
    ["Zahllast (+ = Zahlung, − = Erstattung)", fmtNum(ustSchuld - vorsteuer)],
    [],
    ["BELEGE", "ANZAHL"],
    ["Gesamt", receipts.length],
    ["Geprüft", receipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length],
    ["Unsicher", receipts.filter((r) => r.status === "unsicher").length],
    ["Ungeprüft", receipts.filter((r) => r.status === "ungeprueft").length],
    ["Offene Rechnungen (unbezahlt)", offene.length],
  ]);

  // ── Tab 2: Eingangsrechnungen ─────────────────────────────────────────────
  addSheet(wb, "Eingangsrechnungen", [
    ["Datum", "Lieferant", "Rechnungsnr.", "Kategorie", "Netto (EUR)", "USt-Satz", "USt (EUR)", "Brutto (EUR)", "Bezahlt", "Status", "Hinweise"],
    ...eingang.map((r) => [
      r.receipt_date,
      r.supplier_name,
      r.receipt_number || "",
      r.category,
      fmtNum(r.net_amount),
      r.vat_amount > 0 ? `${Math.round((r.vat_amount / Math.max(r.net_amount, 0.01)) * 100)}%` : "0%",
      fmtNum(r.vat_amount),
      fmtNum(r.gross_amount),
      r.paid_at ? "Ja" : "Nein",
      r.status,
      (r.warnings || []).join(" | "),
    ]),
    [],
    ["SUMME", "", "", "", fmtNum(eingang.reduce((s, r) => s + r.net_amount, 0)), "", fmtNum(vorsteuer), fmtNum(totalEingang)],
  ]);

  // ── Tab 3: Ausgangsrechnungen ─────────────────────────────────────────────
  addSheet(wb, "Ausgangsrechnungen", [
    ["Datum", "Kunde", "Rechnungsnr.", "Kategorie", "Netto (EUR)", "USt-Satz", "USt (EUR)", "Brutto (EUR)", "Bezahlt", "Status", "Hinweise"],
    ...ausgang.map((r) => [
      r.receipt_date,
      r.supplier_name,
      r.receipt_number || "",
      r.category,
      fmtNum(r.net_amount),
      r.vat_amount > 0 ? `${Math.round((r.vat_amount / Math.max(r.net_amount, 0.01)) * 100)}%` : "0%",
      fmtNum(r.vat_amount),
      fmtNum(r.gross_amount),
      r.paid_at ? "Ja" : "Nein",
      r.status,
      (r.warnings || []).join(" | "),
    ]),
    [],
    ["SUMME", "", "", "", fmtNum(ausgang.reduce((s, r) => s + r.net_amount, 0)), "", fmtNum(ustSchuld), fmtNum(totalAusgang)],
  ]);

  // ── Tab 4: Offene Posten ──────────────────────────────────────────────────
  const forderungen = offene.filter((r) => r.invoice_type === "ausgang" || r.direction === "ausgang");
  const verbindlichkeiten = offene.filter((r) => r.invoice_type === "eingang" || r.direction === "eingang");

  addSheet(wb, "Offene Posten", [
    ["TYP", "Datum", "Lieferant / Kunde", "Rechnungsnr.", "Betrag (EUR)", "Fällig bis"],
    ...forderungen.map((r) => [
      "Forderung (Kunde schuldet mir)",
      r.receipt_date,
      r.supplier_name,
      r.receipt_number || "",
      fmtNum(r.gross_amount),
      "",
    ]),
    ...verbindlichkeiten.map((r) => [
      "Verbindlichkeit (ich schulde Lieferant)",
      r.receipt_date,
      r.supplier_name,
      r.receipt_number || "",
      fmtNum(r.gross_amount),
      "",
    ]),
    [],
    ["Forderungen gesamt", "", "", "", fmtNum(forderungen.reduce((s, r) => s + r.gross_amount, 0))],
    ["Verbindlichkeiten gesamt", "", "", "", fmtNum(verbindlichkeiten.reduce((s, r) => s + r.gross_amount, 0))],
  ]);

  // ── Tab 5: Cashflow ───────────────────────────────────────────────────────
  const byDate = new Map<string, { eingang: number; ausgang: number }>();
  receipts.forEach((r) => {
    const d = r.receipt_date;
    if (!byDate.has(d)) byDate.set(d, { eingang: 0, ausgang: 0 });
    const e = byDate.get(d)!;
    if (r.invoice_type === "eingang" || r.direction === "eingang") e.eingang += r.gross_amount;
    if (r.invoice_type === "ausgang" || r.direction === "ausgang") e.ausgang += r.gross_amount;
  });

  addSheet(wb, "Cashflow", [
    ["Datum", "Ausgaben (EUR)", "Einnahmen (EUR)", "Tagessaldo (EUR)"],
    ...Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => [date, fmtNum(v.eingang), fmtNum(v.ausgang), fmtNum(v.ausgang - v.eingang)]),
    [],
    ["GESAMT", fmtNum(totalEingang), fmtNum(totalAusgang), fmtNum(totalAusgang - totalEingang)],
  ]);

  // ── Tab 6: Steuerberater-Notizen ──────────────────────────────────────────
  const uncertain = receipts.filter((r) => r.status === "unsicher");
  const withWarnings = receipts.filter((r) => (r.warnings || []).length > 0);

  addSheet(wb, "Steuerberater", [
    ["Klarblick — Steuerberater-Notizen", periodLabel],
    ["Unternehmen", companyName],
    [],
    uncertain.length > 0 ? ["PRÜFUNG ERFORDERLICH — Unsichere Belege:"] : ["Keine unsicheren Belege"],
    ...(uncertain.length > 0
      ? [
          ["Belegnr.", "Lieferant", "Betrag (EUR)", "Hinweis"],
          ...uncertain.map((r) => [
            r.receipt_number || r.id.slice(0, 8),
            r.supplier_name,
            fmtNum(r.gross_amount),
            (r.warnings || []).join(" | "),
          ]),
        ]
      : []),
    [],
    withWarnings.length > 0 ? ["STEUERLICHE HINWEISE:"] : ["Keine steuerlichen Hinweise"],
    ...(withWarnings.length > 0
      ? [
          ["Belegnr.", "Lieferant", "Betrag (EUR)", "Hinweis"],
          ...withWarnings.map((r) => [
            r.receipt_number || r.id.slice(0, 8),
            r.supplier_name,
            fmtNum(r.gross_amount),
            (r.warnings || []).join(" | "),
          ]),
        ]
      : []),
    [],
    ["ZUSAMMENFASSUNG"],
    [`Geprüfte Belege: ${receipts.filter((r) => r.status === "geprueft" || r.status === "freigegeben").length} von ${receipts.length}`],
    [`Reverse-Charge-Belege: ${receipts.filter((r) => (r.warnings || []).some((w) => w.includes("Reverse Charge"))).length}`],
    [`Bewirtungsbelege (50% abzugsfähig): ${receipts.filter((r) => r.receipt_type === "Bewirtungsbeleg").length}`],
  ]);

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadExcel(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function addSheet(wb: XLSX.WorkBook, name: string, data: (string | number | null | undefined)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(data as any);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function fmtNum(n: number): number {
  return Math.round(n * 100) / 100;
}
