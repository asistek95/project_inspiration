export type ReceiptStatus = "ungeprueft" | "unsicher" | "geprueft" | "freigegeben";

export const STATUS_LABEL: Record<ReceiptStatus, string> = {
  ungeprueft: "Ungeprüft",
  unsicher: "Unsicher",
  geprueft: "Geprüft",
  freigegeben: "An Steuerberater übergeben",
};

// ── Kostenkategorien (Eingangsrechnungen) ──────────────────
export const EINGANGSKATEGORIEN = [
  "Wareneinkauf",
  "Lebensmittel / Supermarkt",
  "Werkzeug & Material",
  "Fahrtkosten",
  "Treibstoff",
  "Bewirtung",
  "Werbung & Marketing",
  "Bürobedarf",
  "Telefon & Internet",
  "Software",
  "Miete",
  "Versicherungen",
  "Personal / Lohn",
  "Reise & Diäten",
  "Bau & Instandhaltung",
  "Anlagegut",
  "Sonstiges",
] as const;

// ── Erlöskategorien (Ausgangsrechnungen) ───────────────────
export const AUSGANGSKATEGORIEN = [
  "Erlöse Bauleistung",
  "Erlöse Personalüberlassung",
  "Erlöse Dienstleistung",
  "Erlöse Wartung & Service",
  "Erlöse Warenverkauf",
  "Erlöse Sonstiges",
] as const;

// Vereinigung beider Listen — für Typen + Backwards-Compat
export const CATEGORIES = [
  ...EINGANGSKATEGORIEN,
  ...AUSGANGSKATEGORIEN,
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Gibt die passende Kategorienliste je nach Belegrichtung zurück. */
export function getCategoriesForDirection(direction?: string): readonly string[] {
  if (direction === "ausgang") return AUSGANGSKATEGORIEN;
  return EINGANGSKATEGORIEN;
}

export const RECEIPT_TYPES = [
  "Quittung",
  "Rechnung",
  "Kassenbon",
  "Tankbeleg",
  "Bewirtungsbeleg",
  "Sonstiges",
] as const;
export type ReceiptType = (typeof RECEIPT_TYPES)[number];

// Richtung des Belegs — entscheidend für USt vs. Vorsteuer
export const DIRECTIONS = ["eingang", "ausgang", "neutral"] as const;
export type ReceiptDirection = (typeof DIRECTIONS)[number];
export const DIRECTION_LABEL: Record<ReceiptDirection, string> = {
  eingang: "Eingangsbeleg (Vorsteuer)",
  ausgang: "Ausgangsrechnung (Umsatz)",
  neutral: "Material/Spesen",
};
export const DIRECTION_SHORT: Record<ReceiptDirection, string> = {
  eingang: "Eingang",
  ausgang: "Ausgang",
  neutral: "Material",
};

// Klartext-Labels für Handwerker — ohne UVA/KZ/Vorsteuer-Jargon
export const DIRECTION_FRIENDLY: Record<ReceiptDirection, string> = {
  eingang: "Material / Lieferant",
  ausgang: "Rechnung an Kunde",
  neutral: "Quittung / Spesen",
};
export const DIRECTION_FRIENDLY_HINT: Record<ReceiptDirection, string> = {
  eingang: "Du hast eingekauft — das Finanzamt zahlt dir die MwSt. zurück.",
  ausgang: "Du hast deinem Kunden Rechnung gestellt — wird zu deinem Umsatz.",
  neutral: "Tankbeleg, Bewirtung, Quittung — normale Betriebsausgabe.",
};
export const DIRECTION_EMOJI: Record<ReceiptDirection, string> = {
  eingang: "📥",
  ausgang: "📤",
  neutral: "🧾",
};

// Rechnungs-Subtypen — nur relevant wenn receipt_type === "Rechnung"
// Standard österreichischer/deutscher Rechnungs-Arten:
//   • Standard       — normale Rechnung
//   • Kleinbetrag    — bis 250 € brutto, vereinfachte Pflichtangaben
//   • Anzahlung      — Anzahlungs-/Abschlagsrechnung während Projekt
//   • Schluss        — finale Rechnung mit Abzug der Abschläge
//   • Gutschrift     — Rabatt / Rückvergütung
//   • Storno         — Korrekturrechnung
export const RECHNUNG_SUBTYPEN = [
  "standard",
  "kleinbetrag",
  "anzahlung",
  "schluss",
  "gutschrift",
  "storno",
] as const;
export type RechnungSubtyp = (typeof RECHNUNG_SUBTYPEN)[number];
export const RECHNUNG_SUBTYP_LABEL: Record<RechnungSubtyp, string> = {
  standard: "Standardrechnung",
  kleinbetrag: "Kleinbetragsrechnung",
  anzahlung: "Anzahlungsrechnung",
  schluss: "Schlussrechnung",
  gutschrift: "Gutschrift",
  storno: "Stornorechnung",
};
export const RECHNUNG_SUBTYP_HINT: Record<RechnungSubtyp, string> = {
  standard: "Normale Rechnung mit allen Pflichtangaben.",
  kleinbetrag: "Bis 250 € brutto — vereinfachte Pflichtangaben (z. B. Kassenbon).",
  anzahlung: "Vorabzahlung vor Projektabschluss — Schlussrechnung folgt.",
  schluss: "Finale Rechnung, in der Anzahlungen abgezogen werden.",
  gutschrift: "Rabatt oder Rückvergütung an den Kunden / vom Lieferanten.",
  storno: "Storniert eine vorherige Rechnung wegen Fehler / Rückabwicklung.",
};

export const PAYMENT_METHODS = ["Bar", "Karte", "Überweisung", "Lastschrift", "PayPal"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentTerms {
  skonto_pct: number; // z.B. 2 = 2 %
  days: number;       // Skonto-Frist
  net_days: number;   // Netto-Frist
}

export interface AuditEntry {
  ts: string;          // ISO timestamp
  action: "created" | "updated" | "deleted" | "status_change";
  field?: string;
  before?: string;
  after?: string;
  by: string;          // user_id oder "system"
}

export interface Receipt {
  id: string;
  user_id: string;
  file_url: string | null;
  file_name: string | null;
  supplier_name: string;
  receipt_date: string; // ISO yyyy-mm-dd
  category: Category;
  receipt_type: ReceiptType;
  direction?: ReceiptDirection;     // Eingang/Ausgang/Material (Material = Kassenbon/Tankbeleg/etc.)
  rechnung_subtyp?: RechnungSubtyp; // Nur relevant wenn receipt_type === "Rechnung"
  payment_method: PaymentMethod;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  currency: "EUR";
  confidence_score: number; // 0..1
  status: ReceiptStatus;
  warnings: string[];
  notes: string | null;
  project: string | null;
  receipt_number?: string | null;   // fortlaufende Belegnummer (User-konfigurierbar)
  
  // ────────────────────────────────────────────────────
  // OCR: Aussteller + Empfänger + Klassifizierung
  // ────────────────────────────────────────────────────
  invoice_type?: "eingang" | "ausgang" | "unknown";  // OCR-erkannt
  vendor_uid?: string | null;                         // UID-Nummer des Ausstellers
  vendor_identifier_confidence?: number;              // 0..1 wie sicher ist die Erkennung
  is_vendor_match?: boolean;                          // ob der Aussteller unser Unternehmen ist (= Ausgangsrechnung)
  recipient_name?: string | null;                     // Empfänger der Rechnung (wer bekommt sie?)
  recipient_uid?: string | null;                      // ATU/UID des Empfängers
  invoice_type_reason?: string | null;                // Warum Eingang/Ausgang: z.B. "Empfänger-ATU = Unternehmens-ATU"
  original_invoice_number?: string | null;            // Rechnungsnummer vom Aussteller (z.B. HR2600145)
  
  // ────────────────────────────────────────────────────
  // Beleg-Bennung (Audit-Trail für OCR + User)
  // ────────────────────────────────────────────────────
  ocr_filename?: string | null;                       // Von OCR generiert (z.B. "B_157")
  user_custom_name?: string | null;                   // User-definiert / überschrieben
  
  // ────────────────────────────────────────────────────
  // Österreichisches Steuerrecht: Vorsteuerabzug
  // ────────────────────────────────────────────────────
  vorsteuerabzug?: boolean | null;    // Vorsteuerabzugsberechtigt? null = unbekannt
  custom_category?: string | null;    // User-definierte Kategorie (Freitext)

  // GoBD-Erweiterungen
  payment_terms?: PaymentTerms | null;
  is_recurring?: boolean;
  paid_at?: string | null;          // ISO yyyy-mm-dd
  iban?: string | null;             // für SEPA-Export
  fingerprint?: string;             // für Dubletten
  audit_log?: AuditEntry[];         // Änderungshistorie
  locked?: boolean;                 // nach Steuerberater-Übergabe
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_name: string;
  owner_name: string;
  tax_advisor_email: string | null;
  company_type: string | null;
  atu_nummer?: string | null;         // ATU12345678 — für OCR-Matching Ausgangsrechnung
  created_at: string;
}

export interface ReportRun {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_gross: number;
  total_vat: number;
  receipt_count: number;
  checked_count: number;
  uncertain_count: number;
  report_url: string | null;
  created_at: string;
}

export interface CategoryDef {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

// ────────────────────────────────────────────────────
// Kontoauszug-Abgleich (Bank Reconciliation)
// ────────────────────────────────────────────────────

export interface BankTransaction {
  id: string;
  user_id: string;
  statement_ref: string;          // z.B. "004/2026" oder Dateiname des Imports
  booking_date: string;           // ISO yyyy-mm-dd (Buchungstag)
  valuta_date?: string | null;    // Valuta-/Wertstellungsdatum
  amount: number;                 // negativ = Ausgang, positiv = Eingang
  currency: "EUR";
  counterparty: string;           // Empfänger/Auftraggeber laut Bank
  purpose: string | null;         // Verwendungszweck/Buchungstext
  iban?: string | null;
  matched_receipt_id?: string | null;   // zugewiesener Beleg
  match_confidence?: number | null;     // 0..1 Auto-Match-Score
  dismissed?: boolean;             // Nutzer hat "kein Beleg nötig" markiert (z.B. private Buchung)
  created_at: string;
}

export interface BankStatement {
  id: string;
  user_id: string;
  reference: string;        // z.B. "004/2026"
  file_name: string;
  imported_at: string;      // ISO Zeitstempel
  opening_balance: number | null;
  closing_balance: number | null;
  transaction_count: number;
}

export type InsightSeverity = "low" | "medium" | "high";
export interface Insight {
  type: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  action?: string;
}
