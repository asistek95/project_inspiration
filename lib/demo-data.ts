import type { Receipt, Category, PaymentMethod, ReceiptType } from "./types";

const SUPPLIERS_BY_CAT: Record<Category, string[]> = {
  Wareneinkauf: ["GC Gienger", "Richter+Frenzel", "Sonepar", "Metro", "Klöckner"],
  "Lebensmittel / Supermarkt": ["EUROSPAR", "Billa", "Hofer", "Lidl", "Penny"],
  "Werkzeug & Material": ["Hornbach", "Bauhaus", "OBI", "Würth", "Hilti", "Festool", "Berner"],
  Fahrtkosten: ["Shell", "Aral", "Esso", "ATU"],
  Treibstoff: ["Shell", "OMV", "Aral"],
  Bewirtung: ["Rewe", "Restaurant Sonne", "Edeka"],
  "Werbung & Marketing": ["Google Ads", "Meta Ads", "Canva"],
  Bürobedarf: ["Amazon Business"],
  "Telefon & Internet": ["Telekom", "Vodafone"],
  Software: ["DATEV", "Microsoft 365", "Adobe"],
  Miete: ["Vermietung Müller"],
  Versicherungen: ["Allianz", "HDI"],
  "Personal / Lohn": ["Lohnabrechnung Mai", "Lohnabrechnung April"],
  "Reise & Diäten": ["ÖBB Tickets", "Austrian Airlines"],
  "Bau & Instandhaltung": ["Infocom GmbH", "Bauservice KG"],
  Anlagegut: ["Würth Maschinen", "Festool Direktkauf"],
  Sonstiges: ["DHL"],
  // Erlöse (Ausgangsrechnungen) — Beispiele für Demo
  "Erlöse Bauleistung": ["PKE Facility Management GmbH", "Strabag AG", "Porr GmbH"],
  "Erlöse Personalüberlassung": ["PKE Facility Management GmbH", "Siemens AG"],
  "Erlöse Dienstleistung": ["Kunde Wien GmbH", "Mustermann AG"],
  "Erlöse Wartung & Service": ["Wartungskunde GmbH"],
  "Erlöse Warenverkauf": ["Handelskunde GmbH"],
  "Erlöse Sonstiges": ["Diverses"],
};

// Wiederkehrende Lieferanten (Abos)
const RECURRING_SUPPLIERS = new Set([
  "Telekom", "Vodafone", "DATEV", "Microsoft 365", "Adobe", "Canva",
  "Allianz", "HDI", "Google Ads", "Meta Ads",
]);

const RANGES: Record<Category, [number, number]> = {
  Wareneinkauf: [180, 1800],
  "Lebensmittel / Supermarkt": [8, 150],
  "Werkzeug & Material": [40, 650],
  Fahrtkosten: [55, 140],
  Treibstoff: [50, 140],
  Bewirtung: [25, 180],
  "Werbung & Marketing": [49, 350],
  Bürobedarf: [8, 90],
  "Telefon & Internet": [45, 95],
  Software: [12, 79],
  Miete: [1200, 1200],
  Versicherungen: [120, 320],
  "Personal / Lohn": [1800, 4500],
  "Reise & Diäten": [45, 350],
  "Bau & Instandhaltung": [200, 2500],
  Anlagegut: [500, 8000],
  Sonstiges: [15, 220],
  // Erlöse (Ausgangsrechnungen)
  "Erlöse Bauleistung": [400, 8000],
  "Erlöse Personalüberlassung": [300, 5000],
  "Erlöse Dienstleistung": [200, 3000],
  "Erlöse Wartung & Service": [150, 1500],
  "Erlöse Warenverkauf": [100, 2000],
  "Erlöse Sonstiges": [50, 500],
};

const TYPES: ReceiptType[] = ["Quittung", "Rechnung", "Kassenbon", "Tankbeleg", "Bewirtungsbeleg"];
const PAYMENTS: PaymentMethod[] = ["Bar", "Karte", "Überweisung", "Lastschrift"];

// deterministischer Pseudo-Random
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260512);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Verteilung der Belege über 4 Monate: Feb–Mai 2026
const MONTHS = [
  { y: 2026, m: 1, count: 18 }, // Feb
  { y: 2026, m: 2, count: 22 }, // Mar
  { y: 2026, m: 3, count: 18 }, // Apr
  { y: 2026, m: 4, count: 24 }, // Mai (aktuell, Fahrtkosten-Peak)
];

// Kategorie-Gewichtung je Monat
const CAT_WEIGHTS: Record<number, [Category, number][]> = {
  1: [
    ["Wareneinkauf", 5],
    ["Werkzeug & Material", 3],
    ["Fahrtkosten", 2],
    ["Bewirtung", 1],
    ["Bürobedarf", 2],
    ["Software", 1],
    ["Telefon & Internet", 1],
    ["Miete", 1],
    ["Versicherungen", 1],
    ["Werbung & Marketing", 1],
  ],
  2: [
    ["Wareneinkauf", 6],
    ["Werkzeug & Material", 4],
    ["Fahrtkosten", 2],
    ["Bewirtung", 1],
    ["Bürobedarf", 2],
    ["Software", 1],
    ["Telefon & Internet", 1],
    ["Miete", 1],
    ["Versicherungen", 1],
    ["Werbung & Marketing", 2],
    ["Sonstiges", 1],
  ],
  3: [
    ["Wareneinkauf", 5],
    ["Werkzeug & Material", 3],
    ["Fahrtkosten", 2],
    ["Bewirtung", 2],
    ["Bürobedarf", 1],
    ["Software", 1],
    ["Telefon & Internet", 1],
    ["Miete", 1],
    ["Werbung & Marketing", 1],
    ["Sonstiges", 1],
  ],
  4: [
    // Mai: Fahrtkosten-Peak
    ["Wareneinkauf", 6],
    ["Werkzeug & Material", 4],
    ["Fahrtkosten", 7],
    ["Bewirtung", 2],
    ["Bürobedarf", 2],
    ["Software", 1],
    ["Telefon & Internet", 1],
    ["Miete", 1],
    ["Werbung & Marketing", 2],
    ["Versicherungen", 1],
    ["Sonstiges", 1],
  ],
};

function weightedCat(month: number): Category {
  const list = CAT_WEIGHTS[month];
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [c, w] of list) {
    if ((r -= w) < 0) return c;
  }
  return list[0][0];
}

function vatFor(cat: Category, gross: number): { net: number; vat: number; rate: number } {
  // 7% für Bewirtung & Lebensmittel-Anteile, sonst 19%, Versicherungen 0%
  let rate = 0.19;
  if (cat === "Bewirtung") rate = 0.07;
  if (cat === "Versicherungen") rate = 0;
  if (cat === "Miete") rate = 0; // vereinfacht
  const net = round2(gross / (1 + rate));
  const vat = round2(gross - net);
  return { net, vat, rate };
}

export const DEMO_USER_ID = "demo-user";

export function generateDemoReceipts(): Receipt[] {
  const receipts: Receipt[] = [];
  let id = 1;
  for (const { y, m, count } of MONTHS) {
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rand() * 27);
      const date = new Date(y, m, day);
      const cat = weightedCat(m);
      const [lo, hi] = RANGES[cat];
      let gross = round2(lo + rand() * (hi - lo));
      // gelegentlich große Einzelbelege
      if (rand() < 0.06 && cat === "Wareneinkauf") gross = round2(gross * 1.8);
      const { net, vat } = vatFor(cat, gross);
      const supplier = pick(SUPPLIERS_BY_CAT[cat]);
      // 99% hohe Confidence (Klarblick-OCR ist top)
      let confidence = 0.93 + rand() * 0.06;
      const warnings: string[] = [];
      if (rand() < 0.01) {
        confidence = 0.78 + rand() * 0.1;
        warnings.push("Prüfung empfohlen");
      }
      const status =
        confidence < 0.88
          ? "ungeprueft"
          : rand() < 0.6
            ? "geprueft"
            : "ungeprueft";

      // Skonto-Bedingungen + Bezahl-Status (für Skonto-Alarm)
      const isRec = RECURRING_SUPPLIERS.has(supplier);
      let paymentTerms = null as any;
      let paidAt: string | null = null;
      if (!isRec && gross > 80 && rand() < 0.5) {
        paymentTerms = {
          skonto_pct: [2, 2, 3][Math.floor(rand() * 3)],
          days: [7, 10, 14][Math.floor(rand() * 3)],
          net_days: 30,
        };
        // 60% wurden zu spät bezahlt (verlorenes Skonto)
        const lateDays = paymentTerms.days + (rand() < 0.6 ? 5 + Math.floor(rand() * 10) : -2);
        const paid = new Date(date);
        paid.setDate(paid.getDate() + lateDays);
        if (paid <= new Date()) paidAt = paid.toISOString().slice(0, 10);
      }

      // Direction: Infocom GmbH ist Dienstleistungsunternehmen
      // → die meisten Belege sind Eingangsrechnungen (Kosten)
      // → ~20% sind Ausgangsrechnungen (eigene Leistungen an Kunden)
      const isAusgang = cat === "Wareneinkauf" && rand() < 0.25;
      const direction = isAusgang ? "ausgang" : "eingang";
      const invoice_type = direction;

      const receipt: Receipt = {
        id: `r_${String(id).padStart(4, "0")}`,
        user_id: DEMO_USER_ID,
        file_url: null,
        file_name: `beleg_${id}.pdf`,
        supplier_name: isAusgang ? pick(["PKE FM GmbH", "Bau GmbH Muster", "Firma Huber KG", "Kundenauftrag GmbH"]) : supplier,
        receipt_date: date.toISOString().slice(0, 10),
        category: cat,
        receipt_type: pick(TYPES),
        payment_method: pick(PAYMENTS),
        net_amount: net,
        vat_amount: vat,
        gross_amount: gross,
        currency: "EUR",
        direction,
        invoice_type,
        confidence_score: round2(confidence),
        status,
        warnings,
        notes: null,
        project: rand() < 0.18 ? pick(["Projekt Schmidt", "Projekt Müller", "BV Hauptstraße 12"]) : null,
        payment_terms: paymentTerms,
        is_recurring: isRec,
        paid_at: paidAt,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      };
      receipts.push(receipt);
      id++;
    }
  }
  // sortiert nach Datum absteigend
  receipts.sort((a, b) => b.receipt_date.localeCompare(a.receipt_date));
  return receipts;
}

export const DEMO_COMPANY = {
  company_name: "Infocom GmbH",
  owner_name: "Ibrahim Sistek",
  tax_advisor_email: "kanzlei@beispiel-steuerberater.at",
  company_type: "GmbH",
  atu_nummer: "ATU70447037",
};
