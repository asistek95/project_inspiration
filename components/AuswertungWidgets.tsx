/**
 * Auswertungs-Widgets für Österreichisches Steuerrecht
 * 
 * Widgets:
 * 1. Belege (Ein/Ausgang trennen)
 * 2. Fremdbelege (extern verwaltet)
 * 3. USt-Rückzahlung (Eingangsrechnungen)
 * 4. Gewinn/Kosten (rot/grün Visualisierung)
 */

"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { Receipt } from "@/lib/types";
import { formatEUR } from "@/lib/utils";

interface AuswertungStats {
  belege_eingang: number;
  belege_ausgang: number;
  belege_unknown: number;
  betrag_eingang: number;
  betrag_ausgang: number;
  betrag_unknown: number;
  vorsteuer_gesamt: number;
  umsatz_steuerpflichtig: number;
  gewinn_kosten_netto: number;
  fremdbelege_count: number;
}

/**
 * Berechne Auswertungs-Statistiken aus Belegen
 */
export function calculateAuswertungsStats(receipts: Receipt[]): AuswertungStats {
  let belege_eingang = 0;
  let belege_ausgang = 0;
  let belege_unknown = 0;
  let betrag_eingang = 0;
  let betrag_ausgang = 0;
  let betrag_unknown = 0;
  let vorsteuer_gesamt = 0;
  let umsatz_steuerpflichtig = 0;
  let gewinn_kosten_netto = 0;
  let fremdbelege_count = 0;

  for (const r of receipts) {
    const invoiceType = r.invoice_type || "unknown";

    if (invoiceType === "eingang") {
      belege_eingang++;
      betrag_eingang += r.gross_amount;
      vorsteuer_gesamt += r.vat_amount; // Vorsteuer-Abzug
    } else if (invoiceType === "ausgang") {
      belege_ausgang++;
      betrag_ausgang += r.gross_amount;
      umsatz_steuerpflichtig += r.gross_amount; // Umsatz für USt-Erklärung
    } else {
      belege_unknown++;
      betrag_unknown += r.gross_amount;
      gewinn_kosten_netto += r.net_amount; // Material/Spesen als Betriebsausgaben
    }

    // Fremdbelege: Manual marked (z.B. durch Steuerberater eingegeben)
    if (r.notes?.includes("Fremdbeleg")) {
      fremdbelege_count++;
    }
  }

  return {
    belege_eingang,
    belege_ausgang,
    belege_unknown,
    betrag_eingang,
    betrag_ausgang,
    betrag_unknown,
    vorsteuer_gesamt,
    umsatz_steuerpflichtig,
    gewinn_kosten_netto,
    fremdbelege_count,
  };
}

interface AuswertungWidgetProps {
  receipts: Receipt[];
  period_start?: string; // YYYY-MM-DD
  period_end?: string;
}

/**
 * Auswertungs-Dashboard für Österreichisches Steuerrecht
 */
export function AuswertungWidgets({ receipts, period_start, period_end }: AuswertungWidgetProps) {
  // Filter nach Periode falls gegeben
  const filteredReceipts = useMemo(() => {
    if (!period_start || !period_end) return receipts;
    return receipts.filter((r) => r.receipt_date >= period_start && r.receipt_date <= period_end);
  }, [receipts, period_start, period_end]);

  const stats = useMemo(() => calculateAuswertungsStats(filteredReceipts), [filteredReceipts]);

  return (
    <div className="space-y-6">
      {/* Hauptauswertung: Ein/Ausgang */}
      <div className="grid lg:grid-cols-2 gap-4">
        <BelegeEingangWidget stats={stats} />
        <BelegeAusgangWidget stats={stats} />
      </div>

      {/* Steuer-Auswertung */}
      <div className="grid lg:grid-cols-2 gap-4">
        <UstRückzahlungWidget stats={stats} />
        <GewinnKostenWidget stats={stats} />
      </div>

      {/* Fremdbelege */}
      {stats.fremdbelege_count > 0 && (
        <FremdbeelegeWidget stats={stats} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Widget: Eingangsrechnungen (Einkauf)
// ────────────────────────────────────────────────────────────

function BelegeEingangWidget({ stats }: { stats: AuswertungStats }) {
  return (
    <div className="border rounded-lg p-5 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">📥 Einkauf (Eingangsrechnungen)</h3>
          <p className="text-sm text-muted-foreground">
            Lieferantenrechnungen — Vorsteuer-Abzug möglich
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-blue-600" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Belege</span>
          <span className="text-2xl font-bold">{stats.belege_eingang}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Gesamtsumme (brutto)</span>
          <span className="text-lg font-semibold">{formatEUR(stats.betrag_eingang)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-blue-200">
          <span className="text-muted-foreground font-medium">Vorsteuer (abzugsfähig)</span>
          <span className="text-lg font-bold text-green-600">+{formatEUR(stats.vorsteuer_gesamt)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100/50 rounded text-sm text-blue-900">
        💡 Diese Belege reduzieren deine Steuerlast durch Vorsteuer-Abzug.
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Widget: Ausgangsrechnungen (Verkauf)
// ────────────────────────────────────────────────────────────

function BelegeAusgangWidget({ stats }: { stats: AuswertungStats }) {
  return (
    <div className="border rounded-lg p-5 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">📤 Verkauf (Ausgangsrechnungen)</h3>
          <p className="text-sm text-muted-foreground">
            Rechnungen an Kunden — USt-pflichtig
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-orange-600" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Belege</span>
          <span className="text-2xl font-bold">{stats.belege_ausgang}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Gesamtsumme (brutto)</span>
          <span className="text-lg font-semibold">{formatEUR(stats.betrag_ausgang)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-orange-200">
          <span className="text-muted-foreground font-medium">Umsatz (steuer­pflicht)</span>
          <span className="text-lg font-bold text-orange-600">{formatEUR(stats.umsatz_steuerpflichtig)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-orange-100/50 rounded text-sm text-orange-900">
        ⚠️ Diese Belege sind in der Umsatzsteuererklärung (USt) anzugeben.
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Widget: USt-Rückzahlung
// ────────────────────────────────────────────────────────────

function UstRückzahlungWidget({ stats }: { stats: AuswertungStats }) {
  // Vereinfachte Logik: 20% USt-Satz angenommen
  const ust_einnahmen = stats.umsatz_steuerpflichtig * 0.20; // USt auf Ausgang
  const netto_ausgang = stats.betrag_ausgang / 1.20;
  const vorsteuer = stats.vorsteuer_gesamt; // Aus Eingangsrechnungen

  const netto_einnahmen = stats.umsatz_steuerpflichtig / 1.20;
  const ust_schuldig = netto_einnahmen * 0.20;
  const ust_vorsteuer = vorsteuer;
  const ust_rückzahlung = ust_vorsteuer - ust_schuldig;

  const isGreen = ust_rückzahlung > 0;

  return (
    <div className={`border rounded-lg p-5 bg-gradient-to-br ${isGreen ? "from-green-50 to-emerald-50" : "from-red-50 to-rose-50"}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">💰 USt-Rückzahlung</h3>
          <p className="text-sm text-muted-foreground">
            Differenz Vorsteuer − USt-Schuld
          </p>
        </div>
        {isGreen ? (
          <TrendingUp className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">Vorsteuer (Einkauf)</span>
          <span className="font-semibold text-green-600">+{formatEUR(ust_vorsteuer)}</span>
        </div>
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">USt-Schuld (Verkauf)</span>
          <span className="font-semibold text-red-600">−{formatEUR(ust_schuldig)}</span>
        </div>
        <div className={`flex justify-between items-baseline pt-2 border-t ${isGreen ? "border-green-200" : "border-red-200"}`}>
          <span className="text-muted-foreground font-medium">
            {isGreen ? "Rückzahlung vom Finanzamt" : "Nachzahlung fällig"}
          </span>
          <span className={`text-lg font-bold ${isGreen ? "text-green-600" : "text-red-600"}`}>
            {isGreen ? "+" : ""}{formatEUR(ust_rückzahlung)}
          </span>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded text-sm ${isGreen ? "bg-green-100/50 text-green-900" : "bg-red-100/50 text-red-900"}`}>
        {isGreen
          ? "✅ Finanzamt zahlt dir Geld zurück"
          : "⚠️ Du musst Umsatzsteuer nachzahlen"}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Widget: Gewinn/Kosten (Rot/Grün)
// ────────────────────────────────────────────────────────────

function GewinnKostenWidget({ stats }: { stats: AuswertungStats }) {
  const kosten = stats.betrag_eingang + stats.betrag_unknown; // Einkauf + Material
  const einnahmen = stats.betrag_ausgang; // Verkauf brutto
  const gewinn_brutto = einnahmen - kosten;
  const gewinn_netto = stats.umsatz_steuerpflichtig - (stats.betrag_eingang / 1.20); // netto Betrachtung

  const isProfit = gewinn_brutto > 0;

  return (
    <div className={`border rounded-lg p-5 bg-gradient-to-br ${isProfit ? "from-purple-50 to-violet-50" : "from-yellow-50 to-amber-50"}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">📊 Gewinn / Kosten</h3>
          <p className="text-sm text-muted-foreground">
            Einfache Gewinn-Kalkulation
          </p>
        </div>
        {isProfit ? (
          <TrendingUp className="h-5 w-5 text-purple-600" />
        ) : (
          <TrendingDown className="h-5 w-5 text-amber-600" />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">Einnahmen (Brutto)</span>
          <span className="font-semibold text-green-600">+{formatEUR(einnahmen)}</span>
        </div>
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">Kosten (Einkauf + Material)</span>
          <span className="font-semibold text-red-600">−{formatEUR(kosten)}</span>
        </div>
        <div className={`flex justify-between items-baseline pt-2 border-t ${isProfit ? "border-purple-200" : "border-yellow-200"}`}>
          <span className="text-muted-foreground font-medium">Gewinn</span>
          <span className={`text-lg font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
            {isProfit ? "+" : ""}{formatEUR(gewinn_brutto)}
          </span>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded text-sm ${isProfit ? "bg-purple-100/50 text-purple-900" : "bg-yellow-100/50 text-yellow-900"}`}>
        {isProfit
          ? "✅ Du machst Gewinn — gute Entwicklung!"
          : "⚠️ Kosten > Einnahmen — überprüfe deine Kalkulation"}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Widget: Fremdbelege
// ────────────────────────────────────────────────────────────

function FremdbeelegeWidget({ stats }: { stats: AuswertungStats }) {
  return (
    <div className="border rounded-lg p-5 bg-gray-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">📋 Fremdbelege</h3>
          <p className="text-sm text-muted-foreground">
            Extern verwaltete Belege (z.B. vom Steuerberater eingegeben)
          </p>
        </div>
        <AlertCircle className="h-5 w-5 text-gray-600" />
      </div>

      <div className="flex justify-between items-baseline">
        <span className="text-muted-foreground">Anzahl</span>
        <span className="text-2xl font-bold">{stats.fremdbelege_count}</span>
      </div>

      <div className="mt-4 p-3 bg-gray-100/50 rounded text-sm text-gray-700">
        🔍 Diese Belege wurden nicht vom OCR erkannt oder manuell von dir/dem Steuerberater eingegeben.
      </div>
    </div>
  );
}
