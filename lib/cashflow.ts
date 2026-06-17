import type { Receipt } from "./types";

// AT-Steuersätze für Rückstellungen
const UST_RATE = 0.2;       // Umsatzsteuer 20%
const KOEST_RATE = 0.23;    // KöSt / Einkommensteuer-Schätzung
const SVS_RATE = 0.275;     // SVS-Rückstellung (Selbständige)

export interface CashflowMonth {
  year: number;
  month: number;
  label: string;
  umsatz: number;
  kosten: number;
  gewinn: number;
  forderungen: number;    // offene Ausgangsrechnungen
  verbindlichkeiten: number; // offene Eingangsrechnungen
  ustRueckstellung: number;
  koestRueckstellung: number;
  svsRueckstellung: number;
  gesamtRueckstellung: number;
  freieCashflow: number;
  anlagenkaeufe: number;
}

export interface CashflowForecast {
  label: string;
  expectedIncome: number;
  expectedCosts: number;
  netForecast: number;
}

export interface CashflowSummary {
  months: CashflowMonth[];
  ytdUmsatz: number;
  ytdKosten: number;
  ytdGewinn: number;
  offeneForderungen: number;
  offeneVerbindlichkeiten: number;
  gesamtRueckstellungen: number;
  freierCashflow: number;
  forecast30: CashflowForecast;
  forecast60: CashflowForecast;
  forecast90: CashflowForecast;
}

export function buildCashflow(receipts: Receipt[], year: number): CashflowSummary {
  const monthData = new Map<string, {
    eingang: Receipt[];
    ausgang: Receipt[];
    offeneEin: Receipt[];
    offeneAus: Receipt[];
    anlagen: Receipt[];
  }>();

  for (let m = 1; m <= 12; m++) {
    monthData.set(`${year}-${m}`, { eingang: [], ausgang: [], offeneEin: [], offeneAus: [], anlagen: [] });
  }

  receipts.forEach((r) => {
    const d = new Date(r.receipt_date);
    if (d.getFullYear() !== year) return;
    const m = d.getMonth() + 1;
    const key = `${year}-${m}`;
    const bucket = monthData.get(key);
    if (!bucket) return;

    const isEingang = r.invoice_type === "eingang" || (r as any).direction === "eingang";
    const isAusgang = r.invoice_type === "ausgang" || (r as any).direction === "ausgang";
    const isAnlage = (r.category || "").toLowerCase().includes("anlage") || (r.notes || "").toLowerCase().includes("anlage");
    const isUnpaid = !r.paid_at && r.receipt_type === "Rechnung";

    if (isEingang) {
      bucket.eingang.push(r);
      if (isUnpaid) bucket.offeneEin.push(r);
    }
    if (isAusgang) {
      bucket.ausgang.push(r);
      if (isUnpaid) bucket.offeneAus.push(r);
    }
    if (isAnlage) bucket.anlagen.push(r);
  });

  const months: CashflowMonth[] = [];
  const DE_MONTHS = ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  for (let m = 1; m <= 12; m++) {
    const bucket = monthData.get(`${year}-${m}`)!;
    const umsatz = bucket.ausgang.reduce((s, r) => s + r.gross_amount, 0);
    const kosten = bucket.eingang.reduce((s, r) => s + r.gross_amount, 0);
    const gewinn = umsatz - kosten;
    const forderungen = bucket.offeneAus.reduce((s, r) => s + r.gross_amount, 0);
    const verbindlichkeiten = bucket.offeneEin.reduce((s, r) => s + r.gross_amount, 0);
    const anlagenkaeufe = bucket.anlagen.reduce((s, r) => s + r.gross_amount, 0);

    // Steuerrückstellungen auf Nettoumsatz
    const netUmsatz = bucket.ausgang.reduce((s, r) => s + r.net_amount, 0);
    const ustRueckstellung = Math.round(netUmsatz * UST_RATE * 100) / 100;
    const koestRueckstellung = Math.max(0, Math.round(gewinn * KOEST_RATE * 100) / 100);
    const svsRueckstellung = Math.max(0, Math.round(gewinn * SVS_RATE * 100) / 100);
    const gesamtRueckstellung = ustRueckstellung + koestRueckstellung + svsRueckstellung;

    const freieCashflow = umsatz - kosten + forderungen - verbindlichkeiten - gesamtRueckstellung - anlagenkaeufe;

    months.push({
      year,
      month: m,
      label: `${DE_MONTHS[m - 1]} ${year}`,
      umsatz,
      kosten,
      gewinn,
      forderungen,
      verbindlichkeiten,
      ustRueckstellung,
      koestRueckstellung,
      svsRueckstellung,
      gesamtRueckstellung,
      freieCashflow,
      anlagenkaeufe,
    });
  }

  const ytdUmsatz = months.reduce((s, m) => s + m.umsatz, 0);
  const ytdKosten = months.reduce((s, m) => s + m.kosten, 0);
  const ytdGewinn = ytdUmsatz - ytdKosten;
  const offeneForderungen = months.reduce((s, m) => s + m.forderungen, 0);
  const offeneVerbindlichkeiten = months.reduce((s, m) => s + m.verbindlichkeiten, 0);
  const gesamtRueckstellungen = months.reduce((s, m) => s + m.gesamtRueckstellung, 0);
  const freierCashflow = ytdUmsatz - ytdKosten + offeneForderungen - offeneVerbindlichkeiten - gesamtRueckstellungen;

  // Forecast basiert auf Durchschnitt der letzten 3 Monate
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const last3 = months.filter((m) => m.month <= currentMonth && m.month >= Math.max(1, currentMonth - 2));
  const avgUmsatz = last3.length > 0 ? last3.reduce((s, m) => s + m.umsatz, 0) / last3.length : 0;
  const avgKosten = last3.length > 0 ? last3.reduce((s, m) => s + m.kosten, 0) / last3.length : 0;

  const forecast30: CashflowForecast = {
    label: "Nächste 30 Tage",
    expectedIncome: Math.round(avgUmsatz * 100) / 100 + offeneForderungen,
    expectedCosts: Math.round(avgKosten * 100) / 100 + offeneVerbindlichkeiten,
    netForecast: 0,
  };
  forecast30.netForecast = forecast30.expectedIncome - forecast30.expectedCosts;

  const forecast60: CashflowForecast = {
    label: "Nächste 60 Tage",
    expectedIncome: Math.round(avgUmsatz * 2 * 100) / 100 + offeneForderungen,
    expectedCosts: Math.round(avgKosten * 2 * 100) / 100 + offeneVerbindlichkeiten,
    netForecast: 0,
  };
  forecast60.netForecast = forecast60.expectedIncome - forecast60.expectedCosts;

  const forecast90: CashflowForecast = {
    label: "Nächste 90 Tage",
    expectedIncome: Math.round(avgUmsatz * 3 * 100) / 100 + offeneForderungen,
    expectedCosts: Math.round(avgKosten * 3 * 100) / 100 + offeneVerbindlichkeiten,
    netForecast: 0,
  };
  forecast90.netForecast = forecast90.expectedIncome - forecast90.expectedCosts;

  return {
    months,
    ytdUmsatz,
    ytdKosten,
    ytdGewinn,
    offeneForderungen,
    offeneVerbindlichkeiten,
    gesamtRueckstellungen,
    freierCashflow,
    forecast30,
    forecast60,
    forecast90,
  };
}
