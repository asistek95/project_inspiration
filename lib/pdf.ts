"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Receipt } from "./types";
import { formatDate, formatEUR } from "./utils";
import { groupByCategory, groupBySupplier, periodStats } from "./insights";

interface ReportParams {
  company: string;
  periodLabel: string;
  receipts: Receipt[];
  insights: { title: string; description: string }[];
}

const BRAND = "#2563eb";
const TEXT = "#0f172a";
const MUTED = "#64748b";

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
