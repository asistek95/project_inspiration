"use client";

// Kontoauszug-Import — CSV-Parser + automatisches Matching gegen Belege.
// Unterstützt die gängigen österreichischen/deutschen Bank-Exportformate
// (semikolon-getrennt, deutsches Zahlenformat, dd.mm.yyyy-Daten).

import type { BankTransaction, Receipt } from "./types";

export interface ParsedTransaction {
  booking_date: string;       // ISO yyyy-mm-dd
  valuta_date: string | null;
  amount: number;
  counterparty: string;
  purpose: string | null;
  iban: string | null;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  warnings: string[];
}

// Spaltennamen-Varianten verschiedener Banken (AT/DE), lowercase ohne Sonderzeichen
const COLUMN_ALIASES = {
  booking_date: ["buchungstag", "buchungsdatum", "datum", "date", "buchungsdat"],
  valuta_date: ["valuta", "valutadatum", "wertstellung", "wertstellungsdatum"],
  amount: ["betrag", "umsatz", "amount", "betragdeskontos"],
  amount_debit: ["soll", "debit", "ausgang", "lastschrift"],
  amount_credit: ["haben", "credit", "eingang", "gutschrift"],
  counterparty: [
    "empfaenger",
    "empfanger",
    "auftraggeber",
    "name",
    "zahlungsempfaengerzahlungspflichtiger",
    "zahlungsempfaenger",
    "begunstigterzahlungspflichtiger",
    "beguenstigterzahlungspflichtiger",
  ],
  purpose: ["verwendungszweck", "buchungstext", "text", "beschreibung", "umsatztext", "vorgang"],
  iban: ["iban", "kontonummeriban", "konto"],
} as const;

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Umlaute -> Basisbuchstabe
    .replace(/[̀-ͯ]/g, "");
}

function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;
  for (const c of candidates) {
    const count = headerLine.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  // Einfacher CSV-Split mit Quote-Handling ("Feld;mit;Semikolon")
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

function parseGermanNumber(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[̀-ͯ]/g, "");
  if (!s) return null;
  // Format "1.234,56" -> "1234.56"; Format "1234.56" bleibt unverändert
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseFlexDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // dd.mm.yyyy oder dd.mm.yy
  const dmy = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd (schon ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dd/mm/yyyy
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function matchColumn(headers: string[], aliases: readonly string[]): number {
  for (let i = 0; i < headers.length; i++) {
    if (aliases.includes(headers[i])) return i;
  }
  return -1;
}

/** Parst eine Bank-CSV-Datei (Text-Inhalt) in strukturierte Transaktionen. */
export function parseBankCSV(text: string): ParseResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { transactions: [], warnings: ["Datei enthält keine verwertbaren Zeilen."] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);

  const idx = {
    booking_date: matchColumn(headers, COLUMN_ALIASES.booking_date),
    valuta_date: matchColumn(headers, COLUMN_ALIASES.valuta_date),
    amount: matchColumn(headers, COLUMN_ALIASES.amount),
    amount_debit: matchColumn(headers, COLUMN_ALIASES.amount_debit),
    amount_credit: matchColumn(headers, COLUMN_ALIASES.amount_credit),
    counterparty: matchColumn(headers, COLUMN_ALIASES.counterparty),
    purpose: matchColumn(headers, COLUMN_ALIASES.purpose),
    iban: matchColumn(headers, COLUMN_ALIASES.iban),
  };

  if (idx.booking_date === -1) {
    warnings.push("Keine Buchungsdatum-Spalte erkannt — Datei-Format wird evtl. nicht unterstützt.");
  }
  if (idx.amount === -1 && idx.amount_debit === -1 && idx.amount_credit === -1) {
    warnings.push("Keine Betrags-Spalte erkannt — Datei-Format wird evtl. nicht unterstützt.");
  }

  const transactions: ParsedTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.every((c) => !c)) continue;

    const bookingRaw = idx.booking_date >= 0 ? cols[idx.booking_date] : "";
    const booking_date = parseFlexDate(bookingRaw);
    if (!booking_date) {
      warnings.push(`Zeile ${i + 1}: Datum „${bookingRaw}" konnte nicht gelesen werden — übersprungen.`);
      continue;
    }

    let amount: number | null = null;
    if (idx.amount >= 0) {
      amount = parseGermanNumber(cols[idx.amount]);
    } else {
      const debit = idx.amount_debit >= 0 ? parseGermanNumber(cols[idx.amount_debit]) : null;
      const credit = idx.amount_credit >= 0 ? parseGermanNumber(cols[idx.amount_credit]) : null;
      if (credit) amount = Math.abs(credit);
      else if (debit) amount = -Math.abs(debit);
    }
    if (amount === null) {
      warnings.push(`Zeile ${i + 1}: Betrag konnte nicht gelesen werden — übersprungen.`);
      continue;
    }

    const valuta_date = idx.valuta_date >= 0 ? parseFlexDate(cols[idx.valuta_date]) : null;
    const counterparty = idx.counterparty >= 0 ? cols[idx.counterparty] || "Unbekannt" : "Unbekannt";
    const purpose = idx.purpose >= 0 ? cols[idx.purpose] || null : null;
    const iban = idx.iban >= 0 ? cols[idx.iban] || null : null;

    transactions.push({ booking_date, valuta_date, amount, counterparty, purpose, iban });
  }

  return { transactions, warnings };
}

// ─────────────────────────────────────────────────────────
// MATCHING — Transaktion ↔ Beleg
// ─────────────────────────────────────────────────────────

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[̀-ͯ]/g, "");
}

export interface MatchSuggestion {
  receipt: Receipt;
  confidence: number; // 0..1
}

/**
 * Schlägt den wahrscheinlichsten Beleg für eine Banktransaktion vor.
 * Score: Betrag exakt (0.6) + Name fuzzy enthalten (0.3) + Datum max 60 Tage nach Belegdatum (0.1).
 */
export function suggestMatch(tx: ParsedTransaction, receipts: Receipt[]): MatchSuggestion | null {
  const txAmount = Math.abs(tx.amount);
  const txName = normalizeName(tx.counterparty);
  const txDate = new Date(tx.booking_date).getTime();

  let best: MatchSuggestion | null = null;
  for (const r of receipts) {
    if (r.paid_at) continue; // schon bezahlt — kein Kandidat
    // Richtung muss passen: negative Tx (Ausgang vom Konto) -> Eingangsrechnung; positive Tx -> Ausgangsrechnung
    const expectedDirection = tx.amount < 0 ? "eingang" : "ausgang";
    const direction = r.direction || "eingang";
    if (direction !== expectedDirection && r.receipt_type === "Rechnung") continue;

    const amountDiff = Math.abs(r.gross_amount - txAmount);
    if (amountDiff > 0.01) continue; // Betrag muss exakt passen

    const rName = normalizeName(r.supplier_name);
    const nameMatch = rName.length > 2 && (txName.includes(rName) || rName.includes(txName));

    const rDate = new Date(r.receipt_date).getTime();
    const daysDiff = (txDate - rDate) / (1000 * 60 * 60 * 24);
    const dateOk = daysDiff >= -5 && daysDiff <= 60;

    let score = 0.6; // Betrag exakt
    if (nameMatch) score += 0.3;
    if (dateOk) score += 0.1;

    if (!best || score > best.confidence) {
      best = { receipt: r, confidence: Math.min(1, score) };
    }
  }
  return best && best.confidence >= 0.6 ? best : null;
}

export function toBankTransaction(
  parsed: ParsedTransaction,
  statementRef: string,
  userId: string,
): BankTransaction {
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    statement_ref: statementRef,
    booking_date: parsed.booking_date,
    valuta_date: parsed.valuta_date,
    amount: parsed.amount,
    currency: "EUR",
    counterparty: parsed.counterparty,
    purpose: parsed.purpose,
    iban: parsed.iban,
    matched_receipt_id: null,
    match_confidence: null,
    dismissed: false,
    created_at: new Date().toISOString(),
  };
}

/** Erkennt ob eine Transaktion (nach Datum+Betrag+Empfänger) schon importiert wurde. */
export function transactionFingerprint(tx: Pick<BankTransaction, "booking_date" | "amount" | "counterparty">): string {
  return `${tx.booking_date}|${tx.amount.toFixed(2)}|${normalizeName(tx.counterparty)}`;
}
