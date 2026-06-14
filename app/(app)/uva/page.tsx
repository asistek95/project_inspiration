"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Info, ExternalLink, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { loadReceipts } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { formatEUR } from "@/lib/utils";

// Österreich UVA U30 — Voranmeldungszeitraum wahlweise Monat oder Quartal
const STORAGE_KEY = "klarblick_uva_v2";

type ManualFields = {
  // Ausgangsumsätze
  kz010: number;  // Umsätze 20% Basis (auto)
  kz022: number;  // Umsätze 10% Basis (auto)
  kz029: number;  // Umsätze 13% Basis (manual)
  kz057: number;  // Übergang Steuerschuld Basis (RC-Ausgang, auto)
  // Vorsteuer
  kz061: number;  // Vorsteuer innergem. Erwerb
  kz065: number;  // Einfuhrumsatzsteuer
  kz066: number;  // Vorsteuer RC (auto, = kz056)
  kz083: number;  // Berichtigungen
};

const EMPTY: ManualFields = {
  kz010: 0, kz022: 0, kz029: 0, kz057: 0,
  kz061: 0, kz065: 0, kz066: 0, kz083: 0,
};

function loadManual(period: string): ManualFields {
  if (typeof window === "undefined") return EMPTY;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...EMPTY, ...(all[period] || {}) };
  } catch { return EMPTY; }
}

function saveManual(period: string, data: ManualFields) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[period] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function UvaPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [period, setPeriod] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [manual, setManual] = useState<ManualFields>(EMPTY);

  useEffect(() => { setAll(loadReceipts()); }, []);
  useEffect(() => { setManual(loadManual(period)); }, [period]);

  function set(patch: Partial<ManualFields>) {
    const next = { ...manual, ...patch };
    setManual(next);
    saveManual(period, next);
  }

  // Belege im Zeitraum (nur geprüfte)
  const inPeriod = useMemo(() => all.filter((r) => {
    const match = r.receipt_date?.startsWith(period);
    return match && (r.status === "geprueft" || r.status === "freigegeben");
  }), [all, period]);

  const ungeprueft = useMemo(() => all.filter((r) =>
    r.receipt_date?.startsWith(period) && (r.status === "ungeprueft" || r.status === "unsicher")
  ), [all, period]);

  // ── AUTO-BERECHNUNG aus Belegen ──

  // Ausgangsrechnungen → KZ 010 / 022 / 029
  const autoAusgang = useMemo(() => {
    let net20 = 0, net10 = 0, net13 = 0, rcBasis = 0;
    for (const r of inPeriod) {
      if ((r.invoice_type || r.direction) !== "ausgang") continue;
      const net = r.net_amount || 0;
      const vat = r.vat_amount || 0;
      if (net <= 0) continue;
      // Reverse Charge Ausgang: kein USt-Ausweis → KZ 057
      if (vat === 0 && (r as any).vat_treatment?.includes("reverse_charge")) {
        rcBasis += net; continue;
      }
      const rate = net > 0 ? vat / net : 0;
      if (rate >= 0.18) net20 += net;
      else if (rate >= 0.12) net13 += net;
      else if (rate >= 0.08) net10 += net;
      else net20 += net; // Fallback
    }
    return { net20, net10, net13, rcBasis };
  }, [inPeriod]);

  // Eingangsrechnungen → KZ 060 (Vorsteuer)
  const autoVorsteuer = useMemo(() => {
    let vst = 0, rcVst = 0;
    for (const r of inPeriod) {
      const dir = r.invoice_type || r.direction || "eingang";
      if (dir === "ausgang") continue;
      if (r.vorsteuerabzug === false) continue; // kein Abzug (PKW etc.)
      const vat = r.vat_amount || 0;
      // Reverse Charge Eingang: Eigenberechnung → KZ 066
      if (vat === 0 && (r as any).vat_treatment?.includes("reverse_charge")) {
        rcVst += (r.net_amount || 0) * 0.20; // Schätzung 20%
      } else {
        vst += vat;
      }
    }
    return { vst, rcVst };
  }, [inPeriod]);

  // Effektive Werte (manuell überschreibt auto wenn >0)
  const kz010 = manual.kz010 > 0 ? manual.kz010 : autoAusgang.net20;
  const kz022 = manual.kz022 > 0 ? manual.kz022 : autoAusgang.net10;
  const kz029 = manual.kz029 > 0 ? manual.kz029 : autoAusgang.net13;
  const kz057 = manual.kz057 > 0 ? manual.kz057 : autoAusgang.rcBasis;
  const kz060 = autoVorsteuer.vst; // immer auto
  const kz066 = manual.kz066 > 0 ? manual.kz066 : autoVorsteuer.rcVst;

  // USt-Beträge
  const kz020 = kz010 * 0.20;  // USt aus KZ 010
  const kz024 = kz022 * 0.10;  // USt aus KZ 022
  const kz025 = kz029 * 0.13;  // USt aus KZ 029
  const kz056 = kz057 * 0.20;  // USt aus KZ 057 (RC)

  const ustGesamt = kz020 + kz024 + kz025 + kz056;
  const vstGesamt = kz060 + manual.kz061 + manual.kz065 + kz066 + manual.kz083;
  const zahllast = ustGesamt - vstGesamt; // positiv = zahlen, negativ = Gutschrift

  // Periode-Label
  const [py, pm] = period.split("-");
  const mName = pm ? new Date(Number(py), Number(pm) - 1).toLocaleString("de-AT", { month: "long", year: "numeric" }) : period;

  function exportCsv() {
    const rows = [
      ["UVA-VORERFASSUNG", mName, ""],
      ["", "", ""],
      ["KENNZAHL", "BEZEICHNUNG", "BETRAG (EUR)"],
      ["", "ABSCHNITT 1: AUSGANGSUMSÄTZE / UMSATZSTEUER", ""],
      ["KZ 010", "Lieferungen/Leistungen 20% (Bemessungsgrundlage)", kz010.toFixed(2)],
      ["KZ 020", "Umsatzsteuer 20% (= KZ 010 × 20%)", kz020.toFixed(2)],
      ["KZ 022", "Lieferungen/Leistungen 10% (Bemessungsgrundlage)", kz022.toFixed(2)],
      ["KZ 024", "Umsatzsteuer 10% (= KZ 022 × 10%)", kz024.toFixed(2)],
      ["KZ 029", "Lieferungen/Leistungen 13% (Bemessungsgrundlage)", kz029.toFixed(2)],
      ["KZ 025", "Umsatzsteuer 13% (= KZ 029 × 13%)", kz025.toFixed(2)],
      ["KZ 057", "Übergang der Steuerschuld §19/§27 (Basis)", kz057.toFixed(2)],
      ["KZ 056", "Umsatzsteuer daraus (= KZ 057 × 20%)", kz056.toFixed(2)],
      ["", "SUMME UMSATZSTEUER", ustGesamt.toFixed(2)],
      ["", "", ""],
      ["", "ABSCHNITT 2: VORSTEUER", ""],
      ["KZ 060", "Abziehbare Vorsteuer gesamt (aus Belegen)", kz060.toFixed(2)],
      ["KZ 061", "Vorsteuer innergem. Erwerb", manual.kz061.toFixed(2)],
      ["KZ 065", "Einfuhrumsatzsteuer (§ 12 Abs 1 Z 2)", manual.kz065.toFixed(2)],
      ["KZ 066", "Vorsteuer aus Übergang Steuerschuld", kz066.toFixed(2)],
      ["KZ 083", "Berichtigungen gem. § 12 Abs 10-12", manual.kz083.toFixed(2)],
      ["", "SUMME VORSTEUER", vstGesamt.toFixed(2)],
      ["", "", ""],
      ["KZ 095", zahllast >= 0 ? "ZAHLLAST (= Vorauszahlung)" : "ÜBERSCHUSS (= Gutschrift)", Math.abs(zahllast).toFixed(2)],
      ["", "", ""],
      ["", "Klarblick – Vorerfassung (kein Steuerbescheid). Eingereicht wird über FinanzOnline.", ""],
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `UVA_${period}_Klarblick.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Österreich · UStG 1994 · Formular U30</p>
          <h1 className="text-2xl font-bold tracking-tight">UVA-Vorerfassung</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Umsatzsteuer-Voranmeldung — Entwurf für den Steuerberater.
            Klarblick reicht <strong>nichts</strong> bei FinanzOnline ein.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary">
            <Download className="h-4 w-4" /> CSV (U30)
          </button>
          <Link href="/tax-advisor" className="btn-primary">
            <Send className="h-4 w-4" /> An Steuerberater
          </Link>
        </div>
      </div>

      {/* Zeitraum + Status */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <label className="label">Voranmeldungszeitraum (Monat)</label>
          <input type="month" className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <p className="text-xs text-slate-400 mt-2">
            Fällig: 15. des übernächsten Monats · Einreichung via{" "}
            <a href="https://finanzonline.bmf.gv.at" target="_blank" rel="noreferrer" className="underline">
              FinanzOnline
            </a>
          </p>
        </div>
        <div className={`rounded-lg border p-4 ${ungeprueft.length > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            {ungeprueft.length > 0
              ? <AlertTriangle className="h-4 w-4 text-amber-600" />
              : <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            }
            <span className="font-semibold text-sm">{ungeprueft.length > 0 ? "Belege offen" : "Alle Belege geprüft"}</span>
          </div>
          <p className="text-xs text-slate-600">
            {inPeriod.length} geprüfte Belege fließen ein.
            {ungeprueft.length > 0 && (
              <> <Link href="/receipts" className="underline text-amber-700">{ungeprueft.length} ungeprüft — jetzt prüfen →</Link></>
            )}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ABSCHNITT 1: AUSGANGSUMSÄTZE / UMSATZSTEUER  */}
      {/* ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <span className="font-semibold text-sm">Abschnitt 1 — Ausgangsumsätze &amp; Umsatzsteuer</span>
          <span className="text-xs text-slate-400">automatisch aus Ausgangsrechnungen berechnet</span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 20% */}
          <KzRow
            kz="010/020"
            label="Lieferungen und sonstige Leistungen"
            sublabel="Normaler Steuersatz 20 % — Handwerk, Dienstleistungen, Handel"
            rate="20%"
            auto={autoAusgang.net20}
            manualVal={manual.kz010}
            onManual={(v) => set({ kz010: v })}
            basis={kz010}
            steuer={kz020}
          />
          {/* 10% */}
          <KzRow
            kz="022/024"
            label="Lieferungen und sonstige Leistungen"
            sublabel="Ermäßigter Steuersatz 10 % — Lebensmittel, Beherbergung, ÖPNV"
            rate="10%"
            auto={autoAusgang.net10}
            manualVal={manual.kz022}
            onManual={(v) => set({ kz022: v })}
            basis={kz022}
            steuer={kz024}
          />
          {/* 13% */}
          <KzRow
            kz="029/025"
            label="Lieferungen und sonstige Leistungen"
            sublabel="Sondersteuersatz 13 % — Kultur, Wein ab Hof, Sport"
            rate="13%"
            auto={autoAusgang.net13}
            manualVal={manual.kz029}
            onManual={(v) => set({ kz029: v })}
            basis={kz029}
            steuer={kz025}
          />
          {/* Reverse Charge / §19 */}
          <KzRow
            kz="057/056"
            label="Übergang der Steuerschuld (§ 19 UStG)"
            sublabel="Bauleistungen §19 Abs 1a · EU-Dienstleistungen · Drittland-Services"
            rate="20%"
            auto={autoAusgang.rcBasis}
            manualVal={manual.kz057}
            onManual={(v) => set({ kz057: v })}
            basis={kz057}
            steuer={kz056}
            highlight="rc"
          />
        </div>

        {/* USt-Summe */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-sm text-slate-700">Umsatzsteuer gesamt</span>
          <span className="font-bold text-lg text-slate-900">{formatEUR(ustGesamt)}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ABSCHNITT 2: VORSTEUER                        */}
      {/* ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <span className="font-semibold text-sm">Abschnitt 2 — Vorsteuer</span>
          <span className="text-xs text-slate-400">KZ 060 automatisch · weitere manuell</span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* KZ 060 — auto */}
          <div className="px-4 py-3 grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <KzBadge kz="060" />
                <span className="font-medium text-sm">Abziehbare Vorsteuer (aus Eingangsrechnungen)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Auto</span>
              </div>
              <p className="text-xs text-slate-500 ml-14">{inPeriod.filter(r => (r.invoice_type || r.direction) !== "ausgang").length} Eingangsbelege · exkl. PKW &amp; steuerfreie Umsätze</p>
            </div>
            <span className="font-bold text-base text-emerald-700">{formatEUR(kz060)}</span>
          </div>

          {/* KZ 066 — RC Vorsteuer */}
          <div className="px-4 py-3 grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <KzBadge kz="066" />
                <span className="font-medium text-sm">Vorsteuer aus Übergang der Steuerschuld</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">RC</span>
              </div>
              <p className="text-xs text-slate-500 ml-14">Gegenbuchung zu KZ 057 — Bauleistungen §19, EU/Drittland-Services</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min="0" className="input !w-28 text-right"
                value={manual.kz066 || (autoVorsteuer.rcVst > 0 ? autoVorsteuer.rcVst.toFixed(2) : "")}
                onChange={(e) => set({ kz066: parseFloat(e.target.value) || 0 })}
                placeholder={autoVorsteuer.rcVst > 0 ? autoVorsteuer.rcVst.toFixed(2) : "0,00"} />
              <span className="text-xs text-slate-400">€</span>
            </div>
          </div>

          {/* Manuelle Felder */}
          {[
            { kz: "061", label: "Vorsteuer innergem. Erwerb (§ 12 Abs 1 Z 3 UStG)", field: "kz061" as const },
            { kz: "065", label: "Einfuhrumsatzsteuer (§ 12 Abs 1 Z 2 UStG)", field: "kz065" as const },
            { kz: "083", label: "Berichtigungen gem. § 12 Abs 10–12 UStG", field: "kz083" as const },
          ].map(({ kz, label, field }) => (
            <div key={kz} className="px-4 py-3 grid grid-cols-[1fr_auto] items-center gap-4">
              <div className="flex items-center gap-2">
                <KzBadge kz={kz} />
                <span className="text-sm text-slate-700">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" step="0.01" min="0" className="input !w-28 text-right"
                  value={manual[field] || ""}
                  onChange={(e) => set({ [field]: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00" />
                <span className="text-xs text-slate-400">€</span>
              </div>
            </div>
          ))}
        </div>

        {/* VSt-Summe */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-sm text-slate-700">Vorsteuer gesamt</span>
          <span className="font-bold text-lg text-emerald-700">{formatEUR(vstGesamt)}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ERGEBNIS KZ 095 / 096                         */}
      {/* ══════════════════════════════════════════════ */}
      <div className={`rounded-xl border-2 p-5 ${zahllast > 0 ? "border-red-200 bg-red-50" : zahllast < 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <div className="grid sm:grid-cols-3 gap-4 items-center">
          <div>
            <p className="text-xs font-mono font-bold text-slate-500">{zahllast >= 0 ? "KZ 095 — Zahllast" : "KZ 096 — Überschuss"}</p>
            <p className={`text-3xl font-black mt-1 ${zahllast > 0 ? "text-red-700" : zahllast < 0 ? "text-emerald-700" : "text-slate-600"}`}>
              {formatEUR(Math.abs(zahllast))}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {zahllast > 0 ? "Vorauszahlung ans Finanzamt" : zahllast < 0 ? "Gutschrift vom Finanzamt" : "Ausgeglichen"}
            </p>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 sm:col-span-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Umsatzsteuer (Abschnitt 1)</span>
              <span className="font-semibold">{formatEUR(ustGesamt)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Vorsteuer (Abschnitt 2)</span>
              <span className="font-semibold text-emerald-700">− {formatEUR(vstGesamt)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>{zahllast >= 0 ? "Zahllast" : "Gutschrift"}</span>
              <span>{formatEUR(Math.abs(zahllast))}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-200 pt-2">
          Voraussichtlicher Wert — kein Steuerbescheid. Einreichung durch Steuerberater oder selbst über{" "}
          <a href="https://finanzonline.bmf.gv.at" target="_blank" rel="noreferrer" className="underline">FinanzOnline</a>.
          Fälligkeit: 15. des übernächsten Monats.
        </p>
      </div>

      {/* Quellen & Erklärung */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-sm">KZ-Erklärungen &amp; Quellen</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
          <KzInfo kz="010" text="Ausgangsumsätze 20% — Nettobetrag (ohne USt)" />
          <KzInfo kz="020" text="USt 20% = KZ 010 × 0,20" />
          <KzInfo kz="022" text="Ausgangsumsätze 10% — Nettobetrag" />
          <KzInfo kz="024" text="USt 10% = KZ 022 × 0,10" />
          <KzInfo kz="029" text="Ausgangsumsätze 13% — Nettobetrag" />
          <KzInfo kz="025" text="USt 13% = KZ 029 × 0,13" />
          <KzInfo kz="057" text="Basis Übergang Steuerschuld §19 (Bauleistungen, EU, Drittland)" />
          <KzInfo kz="056" text="USt daraus = KZ 057 × 0,20" />
          <KzInfo kz="060" text="Abziehbare Vorsteuer aus Eingangsrechnungen §12" />
          <KzInfo kz="061" text="Vorsteuer innergemeinschaftl. Erwerb §12 Abs 1 Z 3" />
          <KzInfo kz="065" text="Einfuhrumsatzsteuer §12 Abs 1 Z 2 (Import aus Drittland)" />
          <KzInfo kz="066" text="Vorsteuer aus Übergang der Steuerschuld (= KZ 056)" />
          <KzInfo kz="095" text="Zahllast (Vorauszahlung) — positiv = Zahlung an FA" />
          <KzInfo kz="096" text="Überschuss (Gutschrift) — negativ = Rückerstattung" />
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs">
          <a href="https://www.wko.at/steuern/umsatzsteuervoranmeldung-umsatzsteuerjahreserklaerung"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-brand-600 hover:underline">
            <ExternalLink className="h-3 w-3" /> WKO — UVA Leitfaden
          </a>
          <a href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/entstehen-der-steuerschuld-und-pflichten/umsatzsteuervoranmeldung.html"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-brand-600 hover:underline">
            <ExternalLink className="h-3 w-3" /> USP.gv.at — Umsatzsteuervoranmeldung
          </a>
          <a href="https://finanzonline.bmf.gv.at" target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-brand-600 hover:underline">
            <ExternalLink className="h-3 w-3" /> FinanzOnline (BMF)
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Komponenten ────────────────────────────────────────
function KzBadge({ kz }: { kz: string }) {
  return (
    <span className="inline-block text-[10px] font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded min-w-[42px] text-center shrink-0">
      KZ {kz}
    </span>
  );
}

function KzInfo({ kz, text }: { kz: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <KzBadge kz={kz} />
      <span className="text-slate-600">{text}</span>
    </div>
  );
}

function KzRow({
  kz, label, sublabel, rate, auto, manualVal, onManual, basis, steuer, highlight,
}: {
  kz: string; label: string; sublabel: string; rate: string;
  auto: number; manualVal: number; onManual: (v: number) => void;
  basis: number; steuer: number; highlight?: "rc";
}) {
  const isOverridden = manualVal > 0 && manualVal !== auto;
  return (
    <div className={`px-4 py-3.5 ${highlight === "rc" ? "bg-blue-50/40" : ""}`}>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <KzBadge kz={kz} />
            <span className="font-medium text-sm">{label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${highlight === "rc" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {rate}
            </span>
            {auto > 0 && !isOverridden && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Auto</span>
            )}
            {isOverridden && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Manuell</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 ml-14">{sublabel}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5 text-right">Basis (Netto)</p>
          <input type="number" step="0.01" min="0"
            className="input !w-28 text-right text-sm"
            value={manualVal > 0 ? manualVal : (auto > 0 ? auto.toFixed(2) : "")}
            onChange={(e) => onManual(parseFloat(e.target.value) || 0)}
            placeholder={auto > 0 ? auto.toFixed(2) : "0,00"} />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 mb-0.5">USt ({rate})</p>
          <p className="font-bold text-sm text-slate-900 min-w-[80px]">{formatEUR(steuer)}</p>
        </div>
      </div>
    </div>
  );
}
