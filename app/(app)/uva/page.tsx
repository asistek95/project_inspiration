"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  AlertTriangle,
  Download,
  Info,
  ShieldCheck,
  ArrowRight,
  Send,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { loadReceipts } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { formatEUR } from "@/lib/utils";

/**
 * UVA-Vorerfassung (Österreich)
 *
 * Diese Seite RECHNET keine UVA — sie BEREITET die wichtigsten Kennzahlen
 * für die Übergabe an den Steuerberater auf. Klarblick reicht NICHTS bei
 * FinanzOnline ein.
 *
 * Wichtige Kennzahlen (AT):
 *  - KZ 022  Eigene Umsätze 20 %             (Ausgangsumsätze – manuell)
 *  - KZ 029  Eigene Umsätze 10 %             (manuell)
 *  - KZ 060  Vorsteuer                       (aus Eingangsbelegen)
 *  - KZ 065  Einfuhrumsatzsteuer             (selten – manuell)
 *  - KZ 072  Innergemeinschaftliche Erwerbe  (selten – manuell)
 */

const STORAGE_KEY = "klarblick_uva_manual_v1";

type Manual = {
  umsatz20: number;
  umsatz10: number;
  einfuhrust: number;
  igErwerbVst: number;
};

const EMPTY: Manual = { umsatz20: 0, umsatz10: 0, einfuhrust: 0, igErwerbVst: 0 };

function loadManual(period: string): Manual {
  if (typeof window === "undefined") return EMPTY;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...EMPTY, ...(all[period] || {}) };
  } catch {
    return EMPTY;
  }
}

function saveManual(period: string, data: Manual) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[period] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
}

export default function UvaPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [period, setPeriod] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [manual, setManual] = useState<Manual>(EMPTY);

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  useEffect(() => {
    setManual(loadManual(period));
  }, [period]);

  function updateManual(patch: Partial<Manual>) {
    const next = { ...manual, ...patch };
    setManual(next);
    saveManual(period, next);
  }

  // Receipts im gewählten Monat — nur geprüfte Belege fließen ein
  const inPeriod = useMemo(() => {
    return all.filter((r) => {
      if (!r.receipt_date?.startsWith(period)) return false;
      return r.status === "geprueft" || r.status === "freigegeben";
    });
  }, [all, period]);

  // Ausgangsrechnungen → automatische KZ 022 (20 %) / KZ 029 (10 %)
  const ausgangBuckets = useMemo(() => {
    let net20 = 0;
    let net10 = 0;
    let count20 = 0;
    let count10 = 0;
    for (const r of inPeriod) {
      if (r.direction !== "ausgang") continue;
      if (r.receipt_type !== "Rechnung") continue;
      const net = r.net_amount || 0;
      const vat = r.vat_amount || 0;
      if (net <= 0) continue;
      const rate = vat / net;
      if (rate >= 0.18 && rate <= 0.22) {
        net20 += net;
        count20 += 1;
      } else if (rate >= 0.08 && rate <= 0.12) {
        net10 += net;
        count10 += 1;
      } else {
        // unklarer Steuersatz → zu 20 % als Fallback
        net20 += net;
        count20 += 1;
      }
    }
    return {
      auto20: Math.round(net20 * 100) / 100,
      auto10: Math.round(net10 * 100) / 100,
      count20,
      count10,
    };
  }, [inPeriod]);

  // Verwendete Werte: Auto, außer User hat manuell etwas eingetragen (>0)
  const umsatz20 = manual.umsatz20 > 0 ? manual.umsatz20 : ausgangBuckets.auto20;
  const umsatz10 = manual.umsatz10 > 0 ? manual.umsatz10 : ausgangBuckets.auto10;

  const vorsteuerTotal = useMemo(
    () =>
      inPeriod
        .filter((r) => r.direction !== "ausgang")
        .reduce((sum, r) => sum + (r.vat_amount || 0), 0),
    [inPeriod],
  );

  const unchecked = useMemo(
    () =>
      all.filter(
        (r) =>
          r.receipt_date?.startsWith(period) &&
          (r.status === "ungeprueft" || r.status === "unsicher"),
      ),
    [all, period],
  );

  // KZ-Berechnung
  const ust20 = umsatz20 * 0.2;
  const ust10 = umsatz10 * 0.1;
  const ustGesamt = ust20 + ust10;
  const vstGesamt = vorsteuerTotal + manual.einfuhrust + manual.igErwerbVst;
  const zahllast = ustGesamt - vstGesamt;

  function exportToCsv() {
    const rows = [
      ["Kennzahl", "Bezeichnung", "Betrag EUR"],
      ["022", "Eigene Umsätze 20 %", umsatz20.toFixed(2)],
      ["029", "Eigene Umsätze 10 %", umsatz10.toFixed(2)],
      ["", "Umsatzsteuer Summe", ustGesamt.toFixed(2)],
      ["060", "Vorsteuer (aus Belegen)", vorsteuerTotal.toFixed(2)],
      ["065", "Einfuhrumsatzsteuer", manual.einfuhrust.toFixed(2)],
      ["072", "Vorsteuer innergem. Erwerb", manual.igErwerbVst.toFixed(2)],
      ["", "Vorsteuer Summe", vstGesamt.toFixed(2)],
      ["", "Zahllast/Gutschrift", zahllast.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klarblick_uva_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-brand-700 mb-2">
          <Calculator className="h-3.5 w-3.5" />
          Österreich · Umsatzsteuervoranmeldung
        </div>
        <h1 className="text-3xl font-bold tracking-tight">UVA-Vorerfassung</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Sauberer Zettel für deinen Steuerberater — mit voraussichtlicher Zahllast.
          Klarblick reicht <strong>nichts</strong> bei FinanzOnline ein.
        </p>
      </div>

      {/* HAFTUNGSAUSSCHLUSS — prominent oben */}
      <div className="card p-5 border-2 border-amber-300 bg-warn-soft">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-6 w-6 text-warn shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-bold text-warn text-base uppercase tracking-wide">
              Wichtig — Bitte lesen, bevor du Werte übergibst
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">
              <li>
                Die Berechnung hier ist eine{" "}
                <strong className="bg-amber-200 px-1 rounded">
                  VORAUSSICHTLICHE Schätzung
                </strong>{" "}
                — kein verbindliches Steuerergebnis.
              </li>
              <li>
                <strong>Klarblick übernimmt KEINE Haftung</strong> für die Korrektheit der
                Zahlen, Frist-Verspätungen, Nachzahlungen oder Säumniszuschläge.
              </li>
              <li>
                <strong>Keine Steuerberatung.</strong> Endgültige Werte freigeben darf nur dein
                Steuerberater. Eingereicht wird ausschließlich über FinanzOnline durch dich
                oder deinen Steuerberater.
              </li>
              <li>
                Vorsteuer (KZ 060) wird automatisch aus deinen geprüften{" "}
                <strong>Eingangsbelegen</strong> berechnet. Eigene Umsätze (KZ 022/029) aus
                deinen <strong>Ausgangsrechnungen</strong> — markier sie in der Belegliste.
              </li>
            </ul>
            <p className="text-xs text-slate-700 pt-1">
              Mit dem Export oder der Übergabe bestätigst du, dass du diesen Hinweis gelesen hast.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer (kompakt) */}
      <div className="card p-4 border border-amber-200 bg-warn-soft">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warn">Keine Steuerberatung — keine Einreichung</p>
            <p className="text-slate-700 mt-1">
              Diese Werte sind ein <strong>Entwurf zur Übergabe</strong>. Die UVA
              wird ausschließlich durch deinen Steuerberater oder dich selbst auf
              FinanzOnline eingereicht. Klarblick ersetzt keine steuerliche Beratung.
            </p>
          </div>
        </div>
      </div>

      {/* Period & Datenschutz */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1">
          <label className="label">Voranmeldungszeitraum</label>
          <input
            type="month"
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Es fließen nur Belege mit Status <strong>geprüft</strong> oder{" "}
            <strong>übergeben</strong> ein.
          </p>
          {unchecked.length > 0 && (
            <div className="mt-3 text-xs flex items-start gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {unchecked.length} Beleg{unchecked.length === 1 ? "" : "e"} im
                Zeitraum sind noch ungeprüft.{" "}
                <Link href="/receipts" className="underline">
                  Jetzt prüfen →
                </Link>
              </span>
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2 border border-brand-100 bg-brand-50/40">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-brand-800">
                Aufbewahrung & Datenschutz (§ 132 BAO)
              </p>
              <p className="text-slate-700 mt-1">
                Belege und UVA-Entwürfe werden <strong>7 Jahre</strong> archiviert
                (gesetzliche Aufbewahrungsfrist). Speicherung in der EU.
                Datenübergabe an den Steuerberater wird mit Zeitstempel
                dokumentiert. Mehr in den{" "}
                <Link href="/settings#datenschutz" className="underline">
                  Einstellungen → Datenschutz
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Umsatzsteuer */}
        <div className="card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-brand-50 text-brand-700 grid place-content-center text-xs font-bold">
              USt
            </span>
            Umsatzsteuer (deine Ausgangsumsätze)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {ausgangBuckets.count20 + ausgangBuckets.count10 > 0 ? (
              <>
                <strong className="text-emerald-700">
                  Auto-berechnet aus {ausgangBuckets.count20 + ausgangBuckets.count10} Ausgangsrechnung
                  {ausgangBuckets.count20 + ausgangBuckets.count10 === 1 ? "" : "en"}.
                </strong>{" "}
                Trag nur ein, wenn du überschreiben willst.
              </>
            ) : (
              <>
                Markiere deine Rechnungen in der{" "}
                <Link href="/receipts?direction=ausgang" className="underline text-brand-700">
                  Belegliste
                </Link>{" "}
                als <strong>Ausgang</strong> — dann rechnen wir KZ 022/029 automatisch.
              </>
            )}
          </p>
          <div className="mt-4 space-y-3">
            <KzInput
              kz="022"
              label="Eigene Umsätze 20 %"
              value={manual.umsatz20 > 0 ? manual.umsatz20 : ausgangBuckets.auto20}
              onChange={(v) => updateManual({ umsatz20: v })}
              hint={
                ausgangBuckets.count20 > 0
                  ? `= USt ${formatEUR(ust20)} · ${ausgangBuckets.count20} Rg. erkannt`
                  : `= USt ${formatEUR(ust20)}`
              }
            />
            <KzInput
              kz="029"
              label="Eigene Umsätze 10 %"
              value={manual.umsatz10 > 0 ? manual.umsatz10 : ausgangBuckets.auto10}
              onChange={(v) => updateManual({ umsatz10: v })}
              hint={
                ausgangBuckets.count10 > 0
                  ? `= USt ${formatEUR(ust10)} · ${ausgangBuckets.count10} Rg. erkannt`
                  : `= USt ${formatEUR(ust10)}`
              }
            />
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-medium">Umsatzsteuer-Summe</span>
              <span className="text-lg font-bold">{formatEUR(ustGesamt)}</span>
            </div>
          </div>
        </div>

        {/* Vorsteuer */}
        <div className="card p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-accent-soft text-accent grid place-content-center text-xs font-bold">
              VSt
            </span>
            Vorsteuer (aus deinen Belegen)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Automatisch aus geprüften Eingangsbelegen — manuelle Felder nur für
            Sonderfälle.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between bg-accent-soft/40 border border-emerald-200 rounded-lg px-3 py-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-accent">KZ 060</span>
                  <span className="text-sm font-medium">Vorsteuer aus Belegen</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {inPeriod.filter((r) => r.direction !== "ausgang").length} geprüfte Eingangsbelege
                </span>
              </div>
              <span className="text-lg font-bold text-accent">
                {formatEUR(vorsteuerTotal)}
              </span>
            </div>
            <KzInput
              kz="065"
              label="Einfuhrumsatzsteuer"
              value={manual.einfuhrust}
              onChange={(v) => updateManual({ einfuhrust: v })}
            />
            <KzInput
              kz="072"
              label="VSt innergem. Erwerb"
              value={manual.igErwerbVst}
              onChange={(v) => updateManual({ igErwerbVst: v })}
            />
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-medium">Vorsteuer-Summe</span>
              <span className="text-lg font-bold">{formatEUR(vstGesamt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ergebnis */}
      <div
        className={`card p-6 border-2 ${
          zahllast >= 0
            ? "border-amber-200 bg-warn-soft"
            : "border-emerald-200 bg-accent-soft"
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-warn bg-amber-200/70 px-2 py-0.5 rounded inline-block mb-1.5">
              VORAUSSICHTLICH
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
              {zahllast >= 0 ? "Zahllast (Schätzung)" : "Gutschrift (Schätzung)"}
            </p>
            <p
              className={`text-4xl font-bold mt-1 ${
                zahllast >= 0 ? "text-warn" : "text-accent"
              }`}
            >
              {formatEUR(Math.abs(zahllast))}
            </p>
            <p className="text-sm text-slate-700 mt-1">
              USt {formatEUR(ustGesamt)} − VSt {formatEUR(vstGesamt)}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-md">
              Kein verbindliches Steuerergebnis. Final wird von deinem Steuerberater geprüft und
              über FinanzOnline eingereicht.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportToCsv} className="btn-secondary">
              <FileSpreadsheet className="h-4 w-4" /> CSV exportieren
            </button>
            <Link href="/tax-advisor" className="btn-primary">
              <Send className="h-4 w-4" /> An Steuerberater übergeben
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Erklärblock */}
      <div className="card p-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-600" />
          Was steht in einer UVA?
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
          <KzExplain
            kz="022"
            text="Eigene Umsätze zum Normalsteuersatz 20 % (z. B. Handwerk, Beratung, Verkauf)."
          />
          <KzExplain
            kz="029"
            text="Eigene Umsätze zum ermäßigten Satz 10 % (z. B. Beherbergung, Lebensmittel)."
          />
          <KzExplain
            kz="060"
            text="Abziehbare Vorsteuer aus Eingangsrechnungen — Klarblick summiert hier automatisch."
          />
          <KzExplain
            kz="065"
            text="Einfuhrumsatzsteuer für Importe aus Drittländern (selten — manuell)."
          />
          <KzExplain
            kz="072"
            text="Vorsteuer aus innergemeinschaftlichem Erwerb (EU-Bezug — manuell)."
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Hinweis: UVA-Pflicht in Österreich besteht bei Jahresumsatz über 35.000 €
          (Stand 2025). Kleinunternehmer sind in der Regel befreit.
        </p>
      </div>
    </div>
  );
}

function KzInput({
  kz,
  label,
  value,
  onChange,
  hint,
}: {
  kz: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
      <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">
        KZ {kz}
      </span>
      <label className="text-sm">
        <span className="block text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          className="input !w-36 pr-7 text-right"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0,00"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          €
        </span>
      </div>
    </div>
  );
}

function KzExplain({ kz, text }: { kz: string; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded shrink-0">
        {kz}
      </span>
      <span className="text-slate-700">{text}</span>
    </div>
  );
}
