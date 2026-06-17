import type { Receipt } from "./types";

// ── Bekannte RC-Lieferanten ─────────────────────────────────────────────────

export const RC_SUPPLIERS: { name: string; country: string; vatId?: string; type: string }[] = [
  { name: "Meta",             country: "IE", vatId: "IE9692928F",  type: "digital_service" },
  { name: "Facebook",         country: "IE", vatId: "IE9692928F",  type: "digital_service" },
  { name: "Google",           country: "IE", vatId: "IE6388047V",  type: "digital_service" },
  { name: "Google Ireland",   country: "IE", vatId: "IE6388047V",  type: "digital_service" },
  { name: "OpenAI",           country: "US",                        type: "digital_service" },
  { name: "Anthropic",        country: "US",                        type: "digital_service" },
  { name: "Microsoft",        country: "IE", vatId: "IE8256796U",  type: "digital_service" },
  { name: "Amazon",           country: "LU", vatId: "LU20260743",  type: "digital_service" },
  { name: "AWS",              country: "LU",                        type: "digital_service" },
  { name: "Canva",            country: "AU",                        type: "digital_service" },
  { name: "Adobe",            country: "IE", vatId: "IE4170032H",  type: "digital_service" },
  { name: "Figma",            country: "US",                        type: "digital_service" },
  { name: "Notion",           country: "US",                        type: "digital_service" },
  { name: "Shopify",          country: "IE",                        type: "digital_service" },
  { name: "Stripe",           country: "IE", vatId: "IE3206488LH", type: "financial_service" },
  { name: "PayPal",           country: "LU", vatId: "LU22557857",  type: "financial_service" },
  { name: "LinkedIn",         country: "IE", vatId: "IE9740425P",  type: "digital_service" },
  { name: "TikTok",           country: "IE",                        type: "digital_service" },
  { name: "Apple",            country: "IE", vatId: "IE9700053D",  type: "digital_service" },
  { name: "Zoom",             country: "IE",                        type: "digital_service" },
  { name: "Dropbox",          country: "IE",                        type: "digital_service" },
  { name: "Slack",            country: "IE",                        type: "digital_service" },
  { name: "Spotify",          country: "LU",                        type: "digital_service" },
  { name: "Cloudflare",       country: "US",                        type: "digital_service" },
  { name: "Twilio",           country: "US",                        type: "digital_service" },
  { name: "GitHub",           country: "US",                        type: "digital_service" },
  { name: "Vercel",           country: "US",                        type: "digital_service" },
  { name: "Netlify",          country: "US",                        type: "digital_service" },
  { name: "Heroku",           country: "US",                        type: "digital_service" },
  { name: "HubSpot",          country: "IE",                        type: "digital_service" },
  { name: "Mailchimp",        country: "US",                        type: "digital_service" },
];

// RC-Schlüsselwörter auf Rechnungen
const RC_KEYWORDS = [
  "reverse charge",
  "steuerschuldnerschaft des leistungsempfängers",
  "vat reverse charge",
  "intra-community supply",
  "vat to be accounted for by the recipient",
  "article 196 vat directive",
  "§19 ustg",
  "vat id customer",
  "steuer schuldet der leistungsempfänger",
  "innergemeinschaftliche leistung",
  "igb",
];

export interface RCResult {
  detected: boolean;
  confidence: number;
  reason: string;
  country: string;
  supplierVatId?: string;
  customerVatId?: string;
  serviceType: string;
  matchedSupplier?: string;
  matchedKeyword?: string;
  warnings: string[];
  // Steuerwirkung
  netAmount: number;
  calculatedVat: number;
  deductibleVat: number;
  nonDeductibleVat: number;
  saldo: number;
  requiresManualReview: boolean;
}

export function analyzeReverseCharge(receipt: Receipt): RCResult {
  const supplierRaw = (receipt.supplier_name || "").toLowerCase();
  const notesRaw = (receipt.notes || "").toLowerCase();
  const fullText = `${supplierRaw} ${notesRaw}`;

  const net = receipt.net_amount ?? 0;
  const displayedVat = receipt.vat_amount ?? 0;

  // Vorsteuerabzug: Standard 100% für B2B digitale Dienste
  // Bewirtung: 50%, vorsteuerabzug=false → 0
  const deductiblePct =
    receipt.receipt_type === "Bewirtungsbeleg" ? 0.5 :
    receipt.vorsteuerabzug === false ? 0 :
    1.0;

  const vatRate = 0.2; // AT Standardsatz
  const calculatedVat = Math.round(net * vatRate * 100) / 100;
  const deductible = Math.round(calculatedVat * deductiblePct * 100) / 100;
  const nonDeductible = Math.round((calculatedVat - deductible) * 100) / 100;

  const warnings: string[] = [];

  // 1. Bekannter Lieferant?
  const matchedSupplier = RC_SUPPLIERS.find((s) =>
    supplierRaw.includes(s.name.toLowerCase())
  );

  // 2. RC-Keyword im Text?
  const matchedKeyword = RC_KEYWORDS.find((kw) => fullText.includes(kw));

  // 3. Lieferant hat AT-USt verrechnet? (dann kein RC)
  const hasAtVat = displayedVat > 0 && !matchedKeyword;

  // 4. UID-Prüfung: vendor_uid ist die UID des Lieferanten, auf Eingangsrechnungen
  const hasCustomerVatId = !!(receipt.vendor_uid);
  const hasSupplierVatId = !!(receipt.vendor_uid || matchedSupplier?.vatId);

  if (!matchedSupplier && !matchedKeyword) {
    return {
      detected: false,
      confidence: 0,
      reason: "Kein Reverse-Charge-Indikator gefunden",
      country: "",
      serviceType: "unknown",
      warnings: [],
      netAmount: net,
      calculatedVat: 0,
      deductibleVat: 0,
      nonDeductibleVat: 0,
      saldo: 0,
      requiresManualReview: false,
    };
  }

  // Confidence berechnen
  let confidence = 0;
  if (matchedSupplier) confidence += 0.6;
  if (matchedKeyword) confidence += 0.3;
  if (hasCustomerVatId) confidence += 0.05;
  if (hasSupplierVatId) confidence += 0.05;
  confidence = Math.min(confidence, 0.99);

  // Warnungen
  if (!hasCustomerVatId) {
    warnings.push("UID des eigenen Unternehmens fehlt auf der Rechnung");
  }
  if (displayedVat > 0 && matchedKeyword) {
    warnings.push("Ausländische USt verrechnet — Vorsteuer möglicherweise nicht in AT abzugsfähig");
  }
  if (!matchedKeyword && matchedSupplier) {
    warnings.push("Reverse-Charge-Hinweis fehlt, Lieferant sitzt aber im EU-Ausland");
  }
  if (!hasCustomerVatId && matchedSupplier) {
    warnings.push("Reverse Charge wahrscheinlich, aber UID fehlt");
  }

  const requiresManualReview = warnings.length > 0 || confidence < 0.7;

  const reason = matchedKeyword
    ? `Schlüsselwort erkannt: "${matchedKeyword}"`
    : matchedSupplier
    ? `Bekannter RC-Lieferant: ${matchedSupplier.name} (${matchedSupplier.country})`
    : "Unbekannt";

  return {
    detected: true,
    confidence,
    reason,
    country: matchedSupplier?.country ?? "EU",
    supplierVatId: matchedSupplier?.vatId ?? receipt.vendor_uid ?? undefined,
    customerVatId: receipt.vendor_uid ?? undefined,
    serviceType: matchedSupplier?.type ?? "digital_service",
    matchedSupplier: matchedSupplier?.name,
    matchedKeyword,
    warnings,
    netAmount: net,
    calculatedVat,
    deductibleVat: deductible,
    nonDeductibleVat: nonDeductible,
    saldo: nonDeductible,
    requiresManualReview,
  };
}

// Alle RC-Fälle in einem Array
export function findAllRC(receipts: Receipt[]): { receipt: Receipt; rc: RCResult }[] {
  return receipts
    .map((r) => ({ receipt: r, rc: analyzeReverseCharge(r) }))
    .filter((x) => x.rc.detected);
}

// Monatsscore: Anzahl offener RC-Fälle
export function openRCCount(receipts: Receipt[]): number {
  return findAllRC(receipts).filter((x) => x.rc.requiresManualReview).length;
}
