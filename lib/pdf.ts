"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Receipt } from "./types";
import { formatDate, formatEUR } from "./utils";
import { groupByCategory, groupBySupplier, periodStats } from "./insights";
import { KLARBLICK_BRAND } from "./brand";

interface ReportParams {
  company: string;
  periodLabel: string;
  receipts: Receipt[];
  insights: { title: string; description: string }[];
}

const BRAND = "#2563eb";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/** Vektor-Logo „K" — Brand-Quadrat + weißer Buchstabe. Kein PNG-Load nötig. */
function drawLogo(doc: jsPDF, x: number, y: number, size = 10) {
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(x, y, size, size, 1.5, 1.5, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.85);
  doc.text("K", x + size / 2, y + size * 0.75, { align: "center" });
}

/** Briefkopf mit Klarblick-Anschrift rechts (für Rechnungen + Reports). */
export function addLetterhead(doc: jsPDF) {
  const b = KLARBLICK_BRAND;
  drawLogo(doc, 14, 14, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(TEXT);
  doc.text("Klarblick", 30, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("Vom Schuhkarton zum Management-Report.", 30, 23.5);

  // Anschrift rechts
  doc.setFontSize(8);
  doc.setTextColor(TEXT);
  const lines = [
    `${b.legal_name} · ${b.owner}`,
    `${b.address_line1}`,
    `${b.address_line2}`,
    `${b.zip_city}, ${b.country}`,
    `${b.email} · ${b.web}`,
  ];
  let yy = 14;
  lines.forEach((l) => {
    doc.text(l, 196, yy, { align: "right" });
    yy += 3.6;
  });
  doc.setDrawColor("#e2e8f0");
  doc.setLineWidth(0.3);
  doc.line(14, 34, 196, 34);
  doc.setTextColor(TEXT);
}

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Klarblick", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Vom Schuhkarton zum Management-Report.", 14, 18);
  if (title) {
    doc.setFontSize(10);
    doc.text(title, 196, 12, { align: "right" });
    if (subtitle) doc.text(subtitle, 196, 18, { align: "right" });
  }
  doc.setTextColor(TEXT);
}

function footer(doc: jsPDF, pageNum: number, pages: number) {
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(
    "Klarblick ersetzt keine Steuerberatung. Automatisch erkannte Daten müssen geprüft werden.",
    14,
    287
  );
  doc.text(`Seite ${pageNum} / ${pages}`, 196, 287, { align: "right" });
  doc.setTextColor(TEXT);
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(TEXT);
  doc.text(text, 14, y);
  doc.setDrawColor(BRAND);
  doc.setLineWidth(0.6);
  doc.line(14, y + 1.5, 50, y + 1.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
}

function kpiBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent = BRAND
) {
  doc.setFillColor("#f8fafc");
  doc.setDrawColor("#e2e8f0");
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(label.toUpperCase(), x + 4, y + 6);
  doc.setFontSize(14);
  doc.setTextColor(accent);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + 4, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT);
}

export function generateReportPDF({ company, periodLabel, receipts, insights }: ReportParams) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = periodStats(receipts);

  // ── Deckblatt ───────────────────────────────────────────
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Klarblick", 14, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Vom Schuhkarton zum Management-Report.", 14, 38);

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("Management-Report", 14, 120);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Automatisch erstellt aus geprüften Belegdaten", 14, 130);

  doc.setDrawColor("#ffffff");
  doc.setLineWidth(0.3);
  doc.line(14, 150, 70, 150);

  doc.setFontSize(11);
  doc.text(`Firma: ${company}`, 14, 162);
  doc.text(`Zeitraum: ${periodLabel}`, 14, 170);
  doc.text(`Erstellt am: ${formatDate(new Date())}`, 14, 178);

  doc.setFontSize(9);
  doc.text(
    "Klarblick ersetzt keine Steuerberatung. Automatisch erkannte Daten müssen geprüft werden.",
    14,
    285
  );
  doc.setTextColor(TEXT);

  // ── Seite: Executive Summary ───────────────────────────
  doc.addPage();
  header(doc, company, periodLabel);
  sectionTitle(doc, "Executive Summary", 40);

  const cardW = 58;
  const cardH = 22;
  const startX = 14;
  let y = 48;
  kpiBox(doc, startX, y, cardW, cardH, "Gesamtausgaben", formatEUR(stats.total_gross));
  kpiBox(doc, startX + cardW + 4, y, cardW, cardH, "MwSt.-Summe", formatEUR(stats.total_vat));
  kpiBox(doc, startX + 2 * (cardW + 4), y, cardW, cardH, "Belege gesamt", String(stats.count));
  y += cardH + 4;
  kpiBox(doc, startX, y, cardW, cardH, "Geprüft", String(stats.checked), "#10b981");
  kpiBox(doc, startX + cardW + 4, y, cardW, cardH, "Unsicher", String(stats.uncertain), "#f59e0b");
  kpiBox(
    doc,
    startX + 2 * (cardW + 4),
    y,
    cardW,
    cardH,
    "Bereit Steuerberater",
    `${stats.advisorReadyPct} %`,
    "#2563eb"
  );

  y += cardH + 12;
  sectionTitle(doc, "Wichtigste Hinweise", y);
  y += 8;
  doc.setFontSize(10);
  if (insights.length === 0) {
    doc.setTextColor(MUTED);
    doc.text("Keine besonderen Auffälligkeiten in diesem Zeitraum.", 14, y);
    doc.setTextColor(TEXT);
  } else {
    insights.slice(0, 6).forEach((ins) => {
      doc.setFont("helvetica", "bold");
      doc.text("•", 14, y);
      doc.text(ins.title, 20, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(ins.description, 170);
      doc.setTextColor(MUTED);
      doc.text(lines, 20, y + 5);
      doc.setTextColor(TEXT);
      y += 5 + lines.length * 5 + 3;
    });
  }

  // ── Seite: Kostenanalyse (Tabellen statt Diagramme) ────
  doc.addPage();
  header(doc, company, periodLabel);
  sectionTitle(doc, "Kostenanalyse nach Kategorie", 40);
  const cats = groupByCategory(receipts);
  autoTable(doc, {
    startY: 46,
    head: [["Kategorie", "Ausgaben", "Anteil"]],
    body: cats.map((c) => [
      c.name,
      formatEUR(c.value),
      stats.total_gross ? `${Math.round((c.value / stats.total_gross) * 100)} %` : "0 %",
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Lieferanten
  const yAfter1 = (doc as any).lastAutoTable.finalY + 12;
  sectionTitle(doc, "Top 10 Lieferanten", yAfter1);
  const sups = groupBySupplier(receipts, 10);
  autoTable(doc, {
    startY: yAfter1 + 6,
    head: [["Lieferant", "Ausgaben", "Anteil"]],
    body: sups.map((s) => [
      s.name,
      formatEUR(s.value),
      stats.total_gross ? `${Math.round((s.value / stats.total_gross) * 100)} %` : "0 %",
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // ── Seite: Auffälligkeiten & Steuerberater-Check ──────
  doc.addPage();
  header(doc, company, periodLabel);
  sectionTitle(doc, "Auffälligkeiten", 40);
  let y2 = 48;
  doc.setFontSize(10);
  if (insights.length === 0) {
    doc.setTextColor(MUTED);
    doc.text("Keine Auffälligkeiten erkannt.", 14, y2);
    doc.setTextColor(TEXT);
  } else {
    insights.forEach((ins) => {
      if (y2 > 250) {
        doc.addPage();
        header(doc, company, periodLabel);
        y2 = 40;
      }
      doc.setFont("helvetica", "bold");
      doc.text(ins.title, 14, y2);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(ins.description, 180);
      doc.setTextColor(MUTED);
      doc.text(lines, 14, y2 + 5);
      doc.setTextColor(TEXT);
      y2 += 5 + lines.length * 5 + 4;
    });
  }

  // Steuerberater-Check
  if (y2 > 200) {
    doc.addPage();
    header(doc, company, periodLabel);
    y2 = 40;
  }
  y2 += 4;
  sectionTitle(doc, "Steuerberater-Checkliste", y2);
  const uncertain = receipts.filter((r) => r.status === "unsicher");
  const noVat = receipts.filter((r) => r.vat_amount === 0 && r.category !== "Versicherungen" && r.category !== "Miete");
  autoTable(doc, {
    startY: y2 + 6,
    head: [["Prüfpunkt", "Status"]],
    body: [
      ["Geprüfte Belege", `${stats.checked} von ${stats.count}`],
      ["Unsichere Belege", `${uncertain.length}`],
      ["Belege ohne erkennbare MwSt.", `${noVat.length}`],
      ["Paket-Fortschritt", `${stats.advisorReadyPct} %`],
    ],
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // ── Seite: Belegliste ─────────────────────────────────
  doc.addPage();
  header(doc, company, periodLabel);
  sectionTitle(doc, "Belegliste", 40);
  autoTable(doc, {
    startY: 46,
    head: [["Datum", "Lieferant", "Kategorie", "Netto", "MwSt.", "Brutto", "Status"]],
    body: receipts.map((r) => [
      formatDate(r.receipt_date),
      r.supplier_name,
      r.category,
      formatEUR(r.net_amount),
      formatEUR(r.vat_amount),
      formatEUR(r.gross_amount),
      r.status === "geprueft"
        ? "Geprüft"
        : r.status === "unsicher"
          ? "Unsicher"
          : r.status === "freigegeben"
            ? "An Steuerberater"
            : "Ungeprüft",
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // ── Footer auf allen Seiten ──────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) footer(doc, i, totalPages);
  }

  doc.save(`Klarblick_Report_${periodLabel.replace(/\s+/g, "_")}.pdf`);
}

export function exportCSV(receipts: Receipt[], filename = "belege.csv") {
  const headers = [
    "Datum",
    "Lieferant",
    "Kategorie",
    "Belegtyp",
    "Zahlungsart",
    "Netto",
    "MwSt.",
    "Brutto",
    "Währung",
    "Status",
    "Confidence",
    "Notiz",
  ];
  const rows = receipts.map((r) => [
    r.receipt_date,
    r.supplier_name,
    r.category,
    r.receipt_type,
    r.payment_method,
    r.net_amount.toFixed(2).replace(".", ","),
    r.vat_amount.toFixed(2).replace(".", ","),
    r.gross_amount.toFixed(2).replace(".", ","),
    r.currency,
    r.status,
    r.confidence_score.toFixed(2),
    (r.notes || "").replace(/[\r\n;]/g, " "),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────────────────────────────
 *  AI-Report-PDF  (Markdown-Output von Claude in brandiges PDF gießen)
 * ──────────────────────────────────────────────────────────────────────── */

interface AiReportParams {
  company: string;
  periodLabel: string;
  prompt: string;
  markdown: string;
  receipts: Receipt[];
  model?: string;
}

/** Sehr leichter Markdown-Renderer für jsPDF (Headings, Bold, Lists). */
function renderMarkdownToPdf(doc: jsPDF, md: string, startY: number): number {
  const maxW = 182;
  let y = startY;
  const lineH = 5;
  const lines = md.split(/\r?\n/);

  const ensureSpace = (need: number) => {
    if (y + need > 275) {
      doc.addPage();
      addLetterhead(doc);
      y = 44;
    }
  };

  const writeBoldRun = (text: string, x: number, yy: number) => {
    // **bold** Inline. Sehr einfacher Parser.
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    let cursorX = x;
    parts.forEach((p) => {
      if (!p) return;
      const bold = p.startsWith("**") && p.endsWith("**");
      const t = bold ? p.slice(2, -2) : p;
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const w = doc.getTextWidth(t);
      doc.text(t, cursorX, yy);
      cursorX += w;
    });
    doc.setFont("helvetica", "normal");
  };

  for (let raw of lines) {
    const line = raw.replace(/\t/g, "  ");
    if (line.trim() === "") {
      y += lineH * 0.6;
      continue;
    }
    // ---
    if (/^---+$/.test(line.trim())) {
      ensureSpace(4);
      doc.setDrawColor("#e2e8f0");
      doc.setLineWidth(0.2);
      doc.line(14, y, 196, y);
      y += 3;
      continue;
    }
    // Headings
    let m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      const text = m[2];
      const size = level === 1 ? 16 : level === 2 ? 13 : level === 3 ? 11 : 10;
      ensureSpace(size * 0.7 + 4);
      y += level === 1 ? 4 : 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(level <= 2 ? BRAND : TEXT);
      const wrapped = doc.splitTextToSize(text, maxW);
      doc.text(wrapped, 14, y);
      y += wrapped.length * (size * 0.45) + 2;
      doc.setTextColor(TEXT);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      continue;
    }
    // List item
    m = line.match(/^(\s*)[-*•]\s+(.*)$/);
    if (m) {
      const indent = Math.min(Math.floor(m[1].length / 2), 3);
      const text = m[2];
      ensureSpace(lineH + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(BRAND);
      doc.text("•", 14 + indent * 4, y);
      doc.setTextColor(TEXT);
      const x0 = 18 + indent * 4;
      const wrapped = doc.splitTextToSize(text.replace(/\*\*/g, ""), maxW - (x0 - 14));
      // For multi-line list items render bold runs on first line only (simpler).
      writeBoldRun(wrapped[0], x0, y);
      for (let i = 1; i < wrapped.length; i++) {
        y += lineH;
        ensureSpace(lineH);
        doc.text(wrapped[i], x0, y);
      }
      y += lineH;
      continue;
    }
    // Numbered list
    m = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) {
      ensureSpace(lineH + 1);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND);
      doc.text(`${m[1]}.`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(TEXT);
      const wrapped = doc.splitTextToSize(m[2].replace(/\*\*/g, ""), maxW - 8);
      writeBoldRun(wrapped[0], 22, y);
      for (let i = 1; i < wrapped.length; i++) {
        y += lineH;
        ensureSpace(lineH);
        doc.text(wrapped[i], 22, y);
      }
      y += lineH;
      continue;
    }
    // Paragraph
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(TEXT);
    const wrapped = doc.splitTextToSize(line.replace(/\*\*/g, ""), maxW);
    wrapped.forEach((w: string, idx: number) => {
      ensureSpace(lineH);
      if (idx === 0) writeBoldRun(w, 14, y);
      else doc.text(w, 14, y);
      y += lineH;
    });
  }
  return y;
}

export function generateAiReportPDF({
  company,
  periodLabel,
  prompt,
  markdown,
  receipts,
  model,
}: AiReportParams) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = periodStats(receipts);

  // Briefkopf
  addLetterhead(doc);
  let y = 44;

  // Titel
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(TEXT);
  doc.text("KI-Auswertung", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  const meta = [`Firma: ${company}`, `Zeitraum: ${periodLabel}`, `Erstellt: ${formatDate(new Date())}`];
  if (model) meta.push(`Modell: ${model}`);
  doc.text(meta.join("  ·  "), 14, y);
  y += 8;

  // Prompt-Block (grau-blau hinterlegt)
  const promptLines = doc.splitTextToSize(prompt, 175);
  const blockH = 8 + promptLines.length * 4.2;
  doc.setFillColor("#eff6ff");
  doc.setDrawColor("#bfdbfe");
  doc.roundedRect(14, y, 182, blockH, 2, 2, "FD");
  doc.setTextColor(BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FRAGESTELLUNG", 18, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT);
  doc.setFontSize(9.5);
  doc.text(promptLines, 18, y + 10);
  y += blockH + 8;

  // KPI-Strip
  const cardW = 42;
  const cardH = 18;
  kpiBox(doc, 14, y, cardW, cardH, "Belege", String(stats.count));
  kpiBox(doc, 14 + (cardW + 4), y, cardW, cardH, "Brutto", formatEUR(stats.total_gross));
  kpiBox(doc, 14 + 2 * (cardW + 4), y, cardW, cardH, "MwSt.", formatEUR(stats.total_vat));
  kpiBox(doc, 14 + 3 * (cardW + 4), y, cardW, cardH, "Geprüft", `${stats.advisorReadyPct}%`, "#10b981");
  y += cardH + 8;

  // Markdown
  sectionTitle(doc, "Ergebnis", y);
  y += 7;
  y = renderMarkdownToPdf(doc, markdown, y);

  // Footer auf allen Seiten
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    footer(doc, i, totalPages);
  }

  doc.save(`Klarblick_KI-Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ────────────────────────────────────────────────────────────────────────
 *  Rechnungs-PDF  (für eigene Rechnungen / später Stripe)
 * ──────────────────────────────────────────────────────────────────────── */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number; // netto
  vat_rate?: number; // 0.20 = 20 %
}

export interface InvoiceParams {
  invoice_number: string;
  invoice_date: string; // YYYY-MM-DD
  due_date?: string;
  to: {
    name: string;
    address_line1?: string;
    address_line2?: string;
    zip_city?: string;
    country?: string;
    uid?: string;
  };
  items: InvoiceItem[];
  notes?: string;
  payment_terms?: string;
}

export function generateInvoicePDF(p: InvoiceParams) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addLetterhead(doc);

  let y = 46;
  // Empfänger-Block
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(
    `${KLARBLICK_BRAND.legal_name}, ${KLARBLICK_BRAND.address_line2}, ${KLARBLICK_BRAND.zip_city}`,
    14,
    y
  );
  y += 6;
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(p.to.name, 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (p.to.address_line1) {
    doc.text(p.to.address_line1, 14, y);
    y += 4.5;
  }
  if (p.to.address_line2) {
    doc.text(p.to.address_line2, 14, y);
    y += 4.5;
  }
  if (p.to.zip_city) {
    doc.text(`${p.to.zip_city}${p.to.country ? ", " + p.to.country : ""}`, 14, y);
    y += 4.5;
  }
  if (p.to.uid) {
    doc.text(`UID: ${p.to.uid}`, 14, y);
    y += 4.5;
  }

  // Rechnungs-Meta rechts
  let yMeta = 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(BRAND);
  doc.text("RECHNUNG", 196, yMeta, { align: "right" });
  yMeta += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TEXT);
  const metaRows: [string, string][] = [
    ["Rechnungs-Nr.", p.invoice_number],
    ["Datum", formatDate(p.invoice_date)],
  ];
  if (p.due_date) metaRows.push(["Fällig am", formatDate(p.due_date)]);
  metaRows.forEach(([k, v]) => {
    doc.setTextColor(MUTED);
    doc.text(k, 160, yMeta);
    doc.setTextColor(TEXT);
    doc.text(v, 196, yMeta, { align: "right" });
    yMeta += 5;
  });

  y = Math.max(y, yMeta) + 6;

  // Positionen
  const rows = p.items.map((it) => {
    const vatRate = it.vat_rate ?? 0.2;
    const net = it.quantity * it.unit_price;
    const vat = net * vatRate;
    const gross = net + vat;
    return {
      description: it.description,
      qty: it.quantity,
      unit_price: it.unit_price,
      vat_rate: vatRate,
      net,
      vat,
      gross,
    };
  });

  autoTable(doc, {
    startY: y,
    head: [["Pos.", "Beschreibung", "Menge", "Einzelpreis", "MwSt.", "Netto", "Brutto"]],
    body: rows.map((r, i) => [
      String(i + 1),
      r.description,
      String(r.qty),
      formatEUR(r.unit_price),
      `${Math.round(r.vat_rate * 100)} %`,
      formatEUR(r.net),
      formatEUR(r.gross),
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "right", cellWidth: 26 },
      6: { halign: "right", cellWidth: 26 },
    },
  });

  let yEnd = (doc as any).lastAutoTable.finalY + 6;

  // Summen rechts
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalVat = rows.reduce((s, r) => s + r.vat, 0);
  const totalGross = totalNet + totalVat;

  const xLabel = 140;
  const xVal = 196;
  doc.setFontSize(10);
  doc.setTextColor(TEXT);
  doc.text("Zwischensumme (netto)", xLabel, yEnd);
  doc.text(formatEUR(totalNet), xVal, yEnd, { align: "right" });
  yEnd += 5;
  doc.text("MwSt.", xLabel, yEnd);
  doc.text(formatEUR(totalVat), xVal, yEnd, { align: "right" });
  yEnd += 6;
  doc.setDrawColor(BRAND);
  doc.setLineWidth(0.4);
  doc.line(xLabel, yEnd - 3, xVal, yEnd - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND);
  doc.text("Gesamtbetrag", xLabel, yEnd + 2);
  doc.text(formatEUR(totalGross), xVal, yEnd + 2, { align: "right" });
  yEnd += 12;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT);

  // Zahlungshinweis
  if (p.payment_terms) {
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    const lines = doc.splitTextToSize(p.payment_terms, 182);
    doc.text(lines, 14, yEnd);
    yEnd += lines.length * 4 + 2;
  }

  // Notizen
  if (p.notes) {
    doc.setFontSize(9);
    doc.setTextColor(TEXT);
    const lines = doc.splitTextToSize(p.notes, 182);
    doc.text(lines, 14, yEnd);
    yEnd += lines.length * 4 + 2;
  }

  // Bankdaten / Fußnote
  const fy = 275;
  doc.setDrawColor("#e2e8f0");
  doc.setLineWidth(0.3);
  doc.line(14, fy - 4, 196, fy - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  const b = KLARBLICK_BRAND;
  const bankLine = b.iban
    ? `Bank: ${b.bank_name}  ·  IBAN: ${b.iban}  ·  BIC: ${b.bic}`
    : "Bankdaten auf Anfrage.";
  doc.text(
    [
      `${b.legal_name} · ${b.owner} · ${b.address_line1}, ${b.address_line2}, ${b.zip_city}, ${b.country}`,
      `${b.email} · ${b.web} · UID: ${b.uid}`,
      bankLine,
    ],
    14,
    fy
  );

  doc.save(`Klarblick_Rechnung_${p.invoice_number}.pdf`);
}
