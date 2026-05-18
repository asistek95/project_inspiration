export type ReceiptStatus = "ungeprueft" | "unsicher" | "geprueft" | "freigegeben";

export const STATUS_LABEL: Record<ReceiptStatus, string> = {
  ungeprueft: "Ungeprüft",
  unsicher: "Unsicher",
  geprueft: "Geprüft",
  freigegeben: "An Steuerberater übergeben",
};

export const CATEGORIES = [
  "Wareneinkauf",
  "Werkzeug & Material",
  "Fahrtkosten",
  "Bewirtung",
  "Werbung & Marketing",
  "Bürobedarf",
  "Telefon & Internet",
  "Software",
  "Miete",
  "Versicherungen",
  "Sonstiges",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const RECEIPT_TYPES = [
  "Quittung",
  "Rechnung",
  "Kassenbon",
  "Tankbeleg",
  "Bewirtungsbeleg",
  "Sonstiges",
] as const;
export type ReceiptType = (typeof RECEIPT_TYPES)[number];

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

export type InsightSeverity = "low" | "medium" | "high";
export interface Insight {
  type: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  action?: string;
}
