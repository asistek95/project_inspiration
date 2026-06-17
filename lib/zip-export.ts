"use client";

import JSZip from "jszip";
import type { Receipt } from "./types";

const MONTH_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_.]/g, "_").slice(0, 60);
}

function directionFolder(r: Receipt): string {
  if (r.direction === "ausgang") return "Ausgang";
  if (r.direction === "eingang") return "Eingang";
  return "Quittungen";
}

/** Lädt eine Datei als ArrayBuffer — funktioniert für blob:// und data: URLs */
async function fetchBlob(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Erstellt ein ZIP-Archiv aller übergebenen Belege.
 *
 * Ordnerstruktur:
 *   Klarblick_Belege/
 *     2026-05_Mai/
 *       Eingang/
 *         HR260145_Infocom_GmbH.pdf
 *       Ausgang/
 *         AR-2026-0001_Musterkunde.pdf
 *       Quittungen/
 *         Hornbach_Kassenbon.jpg
 *     _Übersicht.csv         ← immer dabei
 */
export async function buildReceiptsZip(
  receipts: Receipt[],
  companyName = "Mein Unternehmen"
): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder("Klarblick_Belege")!;

  // ── CSV-Übersicht ────────────────────────────────────────────────────────
  const csvHeaders = [
    "Datum","Lieferant","Empfänger","Kategorie","Richtung","Belegtyp",
    "Netto €","USt €","Brutto €","Zahlungsart","Rechnungsnummer",
    "Orig. Rechnungsnummer","Status","Vorsteuer","Notiz",
  ];
  const csvRows = receipts.map((r) => [
    r.receipt_date,
    r.supplier_name,
    (r as any).recipient_name || "",
    r.custom_category || r.category,
    r.direction || "neutral",
    r.receipt_type,
    r.net_amount.toFixed(2).replace(".", ","),
    r.vat_amount.toFixed(2).replace(".", ","),
    r.gross_amount.toFixed(2).replace(".", ","),
    r.payment_method,
    r.receipt_number || "",
    (r as any).original_invoice_number || "",
    r.status,
    r.vorsteuerabzug === true ? "Ja" : r.vorsteuerabzug === false ? "Nein" : "",
    (r.notes || "").replace(/[\r\n;]/g, " "),
  ]);
  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  root.file("_Übersicht.csv", "﻿" + csvContent);

  // ── README ───────────────────────────────────────────────────────────────
  const readmeLines = [
    `Klarblick Belegarchiv`,
    `Firma: ${companyName}`,
    `Erstellt: ${new Date().toLocaleDateString("de-AT")}`,
    `Belege gesamt: ${receipts.length}`,
    ``,
    `Ordnerstruktur:`,
    `  YYYY-MM_Monat/`,
    `    Eingang/     — Eingangsrechnungen (Kosten, Vorsteuer)`,
    `    Ausgang/     — Ausgangsrechnungen (Umsatz, USt-Schuld)`,
    `    Quittungen/  — Kassenbons, Tankbelege, Spesen`,
    ``,
    `_Übersicht.csv enthält alle Belegdaten als Tabelle (Excel-kompatibel).`,
    ``,
    `Generiert von Klarblick — www.klarblick.at`,
  ];
  root.file("README.txt", readmeLines.join("\n"));

  // ── Dateien nach Monat + Richtung sortieren ──────────────────────────────
  const filePromises = receipts.map(async (r) => {
    if (!r.file_url) return;

    const date = new Date(r.receipt_date);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const monthName = MONTH_DE[date.getMonth()];
    const folderPath = `${date.getFullYear()}-${mm}_${monthName}/${directionFolder(r)}`;

    // Dateiendung ermitteln
    const origName = r.file_name || "";
    const ext = origName.match(/\.[a-z0-9]+$/i)?.[0] || ".pdf";

    // Dateinamen bauen: OrigNr_Lieferant.ext oder KB-Nr_Lieferant.ext
    const num = (r as any).original_invoice_number || r.receipt_number || r.id.slice(0, 8);
    const filename = `${safeFilename(num)}_${safeFilename(r.supplier_name)}${ext}`;

    const buf = await fetchBlob(r.file_url);
    if (buf) {
      root.folder(folderPath)?.file(filename, buf);
    }
  });

  await Promise.all(filePromises);

  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
