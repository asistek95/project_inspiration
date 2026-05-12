import type { Category, PaymentMethod, ReceiptType } from "./types";

export interface ExtractedReceipt {
  supplier_name: string;
  receipt_date: string;
  category: Category;
  receipt_type: ReceiptType;
  payment_method: PaymentMethod;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  currency: "EUR";
  confidence_score: number;
  warnings: string[];
}

// Realistische Lieferanten mit typischen Beträgen + bevorzugter Zahlungsart
const SUPPLIERS: {
  name: string;
  cat: Category;
  type: ReceiptType;
  min: number;
  max: number;
  pay: PaymentMethod;
  keywords: string[];
}[] = [
  { name: "Hornbach", cat: "Werkzeug & Material", type: "Kassenbon", min: 18, max: 320, pay: "Karte", keywords: ["hornbach", "baumarkt"] },
  { name: "Bauhaus", cat: "Werkzeug & Material", type: "Kassenbon", min: 22, max: 290, pay: "Karte", keywords: ["bauhaus"] },
  { name: "OBI", cat: "Werkzeug & Material", type: "Kassenbon", min: 15, max: 240, pay: "Karte", keywords: ["obi"] },
  { name: "Würth", cat: "Werkzeug & Material", type: "Rechnung", min: 80, max: 720, pay: "Überweisung", keywords: ["wuerth", "wurth"] },
  { name: "Metro", cat: "Wareneinkauf", type: "Rechnung", min: 110, max: 880, pay: "Karte", keywords: ["metro"] },
  { name: "Edeka", cat: "Bewirtung", type: "Kassenbon", min: 12, max: 95, pay: "Karte", keywords: ["edeka"] },
  { name: "Rewe", cat: "Bewirtung", type: "Kassenbon", min: 9, max: 78, pay: "Karte", keywords: ["rewe"] },
  { name: "Shell", cat: "Fahrtkosten", type: "Tankbeleg", min: 45, max: 140, pay: "Karte", keywords: ["shell"] },
  { name: "Aral", cat: "Fahrtkosten", type: "Tankbeleg", min: 48, max: 150, pay: "Karte", keywords: ["aral"] },
  { name: "Esso", cat: "Fahrtkosten", type: "Tankbeleg", min: 42, max: 145, pay: "Karte", keywords: ["esso"] },
  { name: "Amazon Business", cat: "Bürobedarf", type: "Rechnung", min: 14, max: 260, pay: "Karte", keywords: ["amazon"] },
  { name: "Telekom", cat: "Telefon & Internet", type: "Rechnung", min: 39, max: 119, pay: "Lastschrift", keywords: ["telekom"] },
  { name: "Vodafone", cat: "Telefon & Internet", type: "Rechnung", min: 35, max: 99, pay: "Lastschrift", keywords: ["vodafone"] },
  { name: "Canva", cat: "Software", type: "Rechnung", min: 11, max: 35, pay: "Karte", keywords: ["canva"] },
  { name: "Microsoft 365", cat: "Software", type: "Rechnung", min: 12, max: 48, pay: "Karte", keywords: ["microsoft", "office"] },
  { name: "Adobe", cat: "Software", type: "Rechnung", min: 24, max: 75, pay: "Karte", keywords: ["adobe"] },
  { name: "DATEV", cat: "Software", type: "Rechnung", min: 49, max: 180, pay: "Lastschrift", keywords: ["datev"] },
  { name: "Allianz", cat: "Versicherungen", type: "Rechnung", min: 89, max: 320, pay: "Lastschrift", keywords: ["allianz"] },
  { name: "DHL", cat: "Sonstiges", type: "Quittung", min: 6, max: 35, pay: "Karte", keywords: ["dhl", "paket"] },
  { name: "Restaurant Sonne", cat: "Bewirtung", type: "Bewirtungsbeleg", min: 28, max: 165, pay: "Karte", keywords: ["restaurant", "gasthaus", "sonne"] },
  { name: "Google Ads", cat: "Werbung & Marketing", type: "Rechnung", min: 45, max: 480, pay: "Karte", keywords: ["google", "ads"] },
  { name: "Meta Ads", cat: "Werbung & Marketing", type: "Rechnung", min: 30, max: 350, pay: "Karte", keywords: ["meta", "facebook"] },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function vatFor(cat: Category, gross: number) {
  // 7 % bei Bewirtung (Speisen), sonst 19 %
  const rate = cat === "Bewirtung" ? 0.07 : 0.19;
  const net = round2(gross / (1 + rate));
  const vat = round2(gross - net);
  return { net, vat };
}

// Versucht Lieferant anhand des Dateinamens zu erraten — sonst zufällig.
function pickSupplier(fileName: string) {
  const lower = fileName.toLowerCase();
  const match = SUPPLIERS.find((s) => s.keywords.some((k) => lower.includes(k)));
  if (match) return { sup: match, fromName: true };
  return { sup: SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)], fromName: false };
}

function recentDate() {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 28));
  return d.toISOString().slice(0, 10);
}

/**
 * extractReceiptData — simulierte Vision-Erkennung.
 *
 * Realistische Confidence-Verteilung (saubere Belege, gute Vision-API):
 *   ~95 % hohe Sicherheit (>= 0.90)
 *   ~4  % mittlere Sicherheit (0.78 – 0.89) → Prüfung empfohlen
 *   ~1  % niedrige Sicherheit (< 0.70)      → unsicher
 *
 * In Produktion: Server-Route mit echter Vision-API (OpenAI / Anthropic /
 * Google Document AI). Confidence kommt aus Modell + Regelvalidierung
 * (Datum plausibel, Brutto = Netto + MwSt, Rundung, Lieferantenliste).
 */
export async function extractReceiptData(file: File): Promise<ExtractedReceipt> {
  // Simulierte Lese-Zeit
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

  const { sup, fromName } = pickSupplier(file.name);
  const gross = round2(sup.min + Math.random() * (sup.max - sup.min));
  const { net, vat } = vatFor(sup.cat, gross);

  const rnd = Math.random();
  let confidence: number;
  const warnings: string[] = [];

  if (rnd < 0.01) {
    confidence = 0.55 + Math.random() * 0.14; // < 0.70 → unsicher
    warnings.push("Beleg teilweise unleserlich");
    warnings.push("Bitte Lieferant und Beträge prüfen");
  } else if (rnd < 0.05) {
    confidence = 0.78 + Math.random() * 0.1; // 0.78 – 0.88
    warnings.push("Prüfung empfohlen");
  } else {
    confidence = 0.92 + Math.random() * 0.07; // 0.92 – 0.99
  }
  if (fromName) confidence = Math.min(0.99, confidence + 0.02);

  return {
    supplier_name: sup.name,
    receipt_date: recentDate(),
    category: sup.cat,
    receipt_type: sup.type,
    payment_method: sup.pay,
    net_amount: net,
    vat_amount: vat,
    gross_amount: gross,
    currency: "EUR",
    confidence_score: round2(confidence),
    warnings,
  };
}

export function confidenceTier(c: number): "high" | "medium" | "low" {
  if (c >= 0.9) return "high";
  if (c >= 0.7) return "medium";
  return "low";
}
