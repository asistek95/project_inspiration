"use client";

import { useState } from "react";
import {
  LayoutDashboard, Inbox, Mail, Receipt, FileBarChart2,
  Calculator, PackageCheck, Settings, AlertTriangle,
  CheckCircle2, XCircle, Upload, MessageCircle, Camera,
  Loader2, ArrowRight, Download, FileSpreadsheet,
  Database, Landmark, TrendingUp, TrendingDown,
} from "lucide-react";

type View = "dashboard" | "upload" | "inbox" | "receipts" | "report" | "uva" | "handover" | "settings";

const NAV: { key: View; label: string; Icon: any }[] = [
  { key: "dashboard", label: "Dashboard",    Icon: LayoutDashboard },
  { key: "upload",    label: "Sammelstelle", Icon: Inbox },
  { key: "inbox",     label: "Eingang",      Icon: Mail },
  { key: "receipts",  label: "Belege",       Icon: Receipt },
  { key: "report",    label: "Auswertung",   Icon: FileBarChart2 },
  { key: "uva",       label: "UVA",          Icon: Calculator },
  { key: "handover",  label: "Übergabe",     Icon: PackageCheck },
  { key: "settings",  label: "Einstellungen",Icon: Settings },
];

export function DemoDashboard() {
  const [active, setActive] = useState<View>("dashboard");

  return (
    <div className="rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
      {/* Browser Chrome */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5 shrink-0">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 max-w-xs bg-slate-700 rounded px-3 py-1 text-xs text-slate-400 text-center mx-auto">
          app.klarblick.at/{active === "dashboard" ? "dashboard" : active === "handover" ? "tax-advisor" : active}
        </div>
      </div>

      {/* App Shell */}
      <div className="bg-slate-50 flex" style={{ minHeight: 420 }}>
        {/* Sidebar */}
        <div className="w-44 bg-white border-r border-slate-200 p-3 flex-col gap-0.5 hidden md:flex shrink-0">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 shrink-0" />
            <span className="font-bold text-sm text-slate-900">Klarblick</span>
          </div>
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition ${
                active === key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 min-w-0 overflow-hidden">
          {active === "dashboard" && <ViewDashboard />}
          {active === "upload"    && <ViewUpload />}
          {active === "inbox"     && <ViewInbox />}
          {active === "receipts"  && <ViewReceipts />}
          {active === "report"    && <ViewReport />}
          {active === "uva"       && <ViewUVA />}
          {active === "handover"  && <ViewHandover />}
          {active === "settings"  && <ViewSettings />}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */
function ViewDashboard() {
  return (
    <>
      <div className="flex items-start justify-between mb-5 gap-2">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Monatsabschluss</p>
          <h3 className="font-bold text-slate-900 text-lg">Mai 2025</h3>
          <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> 3 Belege noch ausstehend
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          In Bearbeitung
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Umsatz (netto)", value: "12.400 €", sub: "+8 % vs. April", color: "text-emerald-600" },
          { label: "Ausgaben",       value: "4.280 €",  sub: "Eingangsrechnungen", color: "text-slate-800" },
          { label: "Vorsteuer §12",  value: "856 €",    sub: "abzugsfähig",    color: "text-brand-700" },
          { label: "Belege",         value: "23 / 26",  sub: "3 fehlen noch",  color: "text-amber-600" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
            <p className={`text-base font-bold mt-1 tabular-nums ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Letzte Belege</span>
          <span className="text-xs text-brand-600">Alle anzeigen →</span>
        </div>
        {[
          { s: "Shell Tankstelle Wien", d: "14.05.", a: "87,40 €",  c: "KFZ",      ok: true },
          { s: "Würth GmbH",           d: "12.05.", a: "234,00 €", c: "Material", ok: true },
          { s: "Unbekannter Lieferant",d: "10.05.", a: "???",       c: "–",        ok: false },
          { s: "Amazon Business",      d: "08.05.", a: "156,80 €", c: "Büro",     ok: true },
        ].map(({ s, d, a, c, ok }) => (
          <div key={s} className="px-4 py-2.5 flex items-center gap-3 text-xs border-b border-slate-50 last:border-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="flex-1 font-medium text-slate-800 truncate">{s}</span>
            <span className="text-slate-400 shrink-0">{d}</span>
            <span className="font-semibold tabular-nums shrink-0 w-20 text-right">{a}</span>
            <span className="text-slate-400 shrink-0 w-14 text-right">{c}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Sammelstelle ──────────────────────────────────────────── */
function ViewUpload() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-4">Alle Wege, Belege einzureichen</p>
      {/* Drag Drop */}
      <div className="border-2 border-dashed border-brand-200 rounded-xl bg-brand-50/40 p-6 text-center mb-4">
        <Upload className="h-8 w-8 text-brand-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-brand-700">PDF oder Foto hier ablegen</p>
        <p className="text-xs text-slate-500 mt-1">oder klicken zum Hochladen</p>
        <button className="mt-3 px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium">
          Datei auswählen
        </button>
      </div>
      {/* 3 Kanäle */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { Icon: MessageCircle, label: "WhatsApp", desc: "+43 660 123 4567", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { Icon: Mail,          label: "E-Mail",   desc: "belege@klarblick.at", color: "bg-blue-50 text-blue-700 border-blue-100" },
          { Icon: Camera,        label: "Kamera",   desc: "Foto direkt aufnehmen", color: "bg-amber-50 text-amber-700 border-amber-100" },
        ].map(({ Icon, label, desc, color }) => (
          <div key={label} className={`rounded-lg border p-3 text-center ${color}`}>
            <Icon className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs text-slate-600">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        Letzter Upload: vor 5 Min — Shell Tankstelle Wien · 87,40 €
      </div>
    </>
  );
}

/* ── Eingang ───────────────────────────────────────────────── */
function ViewInbox() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-900">KI-Verarbeitung</p>
        <span className="text-xs text-slate-500">3 in Warteschlange</span>
      </div>
      <div className="space-y-2.5">
        {[
          { name: "Würth GmbH",            status: "processing", msg: "KI analysiert …",                                color: "text-brand-600" },
          { name: "Shell Tankstelle Wien",  status: "done",       msg: "KFZ-Aufwand · 20% USt · 87,40 € · geprüft",   color: "text-emerald-600" },
          { name: "Unbekannter Lieferant",  status: "warn",       msg: "Bitte manuell prüfen — Lieferant unklar",      color: "text-amber-600" },
          { name: "Amazon Business",        status: "done",       msg: "Bürobedarf · 20% USt · 156,80 € · geprüft",   color: "text-emerald-600" },
        ].map(({ name, status, msg, color }) => (
          <div key={name} className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
            {status === "processing" && <Loader2 className="h-4 w-4 text-brand-500 animate-spin shrink-0" />}
            {status === "done"       && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
            {status === "warn"       && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900">{name}</p>
              <p className={`text-[11px] mt-0.5 ${color}`}>{msg}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Belege ────────────────────────────────────────────────── */
function ViewReceipts() {
  const [filter, setFilter] = useState("alle");
  const all = [
    { s: "Shell Tankstelle Wien", d: "14.05.", a: "87,40 €",  c: "KFZ",      st: "geprueft" },
    { s: "Würth GmbH",           d: "12.05.", a: "234,00 €", c: "Material", st: "geprueft" },
    { s: "Unbekannter Lieferant",d: "10.05.", a: "???",       c: "–",        st: "unsicher" },
    { s: "Amazon Business",      d: "08.05.", a: "156,80 €", c: "Büro",     st: "geprueft" },
    { s: "Baumit GmbH",          d: "05.05.", a: "412,00 €", c: "Material", st: "geprueft" },
    { s: "ÖAMTC Beitrag",        d: "03.05.", a: "120,00 €", c: "KFZ",      st: "ungeprueft" },
  ];
  const shown = filter === "alle" ? all : all.filter((r) => r.st === filter);
  const filters = [
    { key: "alle",       label: "Alle" },
    { key: "geprueft",   label: "Geprüft" },
    { key: "unsicher",   label: "Unsicher" },
    { key: "ungeprueft", label: "Offen" },
  ];
  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filter === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {shown.map(({ s, d, a, c, st }) => (
          <div key={s} className="px-4 py-2.5 flex items-center gap-3 text-xs border-b border-slate-50 last:border-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${
              st === "geprueft" ? "bg-emerald-400" : st === "unsicher" ? "bg-amber-400" : "bg-slate-300"
            }`} />
            <span className="flex-1 font-medium text-slate-800 truncate">{s}</span>
            <span className="text-slate-400">{d}</span>
            <span className="font-semibold tabular-nums w-20 text-right">{a}</span>
            <span className="text-slate-400 w-14 text-right">{c}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Auswertung ────────────────────────────────────────────── */
function ViewReport() {
  const cats = [
    { label: "Material & Werkzeug", val: 1.280, pct: 100 },
    { label: "KFZ & Fahrtkosten",   val: 890,   pct: 70 },
    { label: "Bürobedarf",          val: 620,   pct: 48 },
    { label: "Telefon & Internet",  val: 320,   pct: 25 },
    { label: "Sonstiges",           val: 190,   pct: 15 },
  ];
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Einnahmen",    value: "12.400 €", Icon: TrendingUp,   color: "text-emerald-600" },
          { label: "Ausgaben",     value: "4.280 €",  Icon: TrendingDown, color: "text-slate-700" },
          { label: "Schätz-Gewinn",value: "8.120 €",  Icon: TrendingUp,   color: "text-brand-700" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
            <p className={`font-bold text-base mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-slate-700 mb-3">Top-Ausgaben Mai</p>
      <div className="space-y-2.5">
        {cats.map(({ label, val, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-800 tabular-nums">{val.toLocaleString("de-AT")} €</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── UVA ───────────────────────────────────────────────────── */
function ViewUVA() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-900">UVA-Vorerfassung Mai 2025</p>
        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Entwurf</span>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-100">
            {[
              { label: "Kennzahl 000 – Gesamtumsatz netto",   val: "12.400,00 €", sub: false },
              { label: "Kennzahl 022 – Umsatzsteuer 20%",     val: "2.480,00 €",  sub: false },
              { label: "Kennzahl 060 – Vorsteuer §12 gesamt", val: "−856,00 €",   sub: false },
              { label: "UVA-Zahllast (voraussichtlich)",       val: "1.624,00 €",  sub: true },
            ].map(({ label, val, sub }) => (
              <tr key={label} className={sub ? "bg-brand-50" : ""}>
                <td className="p-3 text-slate-600">{label}</td>
                <td className={`p-3 text-right font-bold tabular-nums ${sub ? "text-brand-700" : "text-slate-800"}`}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">Nur Vorerfassung — Einreichung bei FinanzOnline erfolgt durch deinen Steuerberater.</p>
    </>
  );
}

/* ── Übergabe ──────────────────────────────────────────────── */
function ViewHandover() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-900">Steuerberater-Übergabe</p>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">23 Belege bereit</span>
      </div>
      {/* Checkliste */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-2">
        {[
          { label: "Alle Belege geprüft",          ok: true },
          { label: "Kategorien vollständig",        ok: true },
          { label: "UVA-Vorerfassung erledigt",     ok: false },
          { label: "Offene Rechnungen markiert",    ok: true },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            {ok
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : <XCircle className="h-4 w-4 text-slate-300 shrink-0" />}
            <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
          </div>
        ))}
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-800 rounded-full" style={{ width: "75%" }} />
        </div>
      </div>
      {/* Downloads */}
      <div className="flex flex-wrap gap-2">
        {[
          { Icon: Download,       label: "PDF-Report" },
          { Icon: FileSpreadsheet,label: "CSV" },
          { Icon: Database,       label: "DATEV" },
          { Icon: Landmark,       label: "SEPA" },
          { Icon: Mail,           label: "E-Mail an StB" },
        ].map(({ Icon, label }) => (
          <button key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
            <Icon className="h-3.5 w-3.5 text-slate-500" /> {label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Einstellungen ─────────────────────────────────────────── */
function ViewSettings() {
  return (
    <>
      <p className="text-sm font-bold text-slate-900 mb-4">Unternehmenseinstellungen</p>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {[
          { label: "Firmenname",         val: "Musterbau GmbH" },
          { label: "ATU-Nummer",         val: "ATU12345678" },
          { label: "Steuerberater",      val: "kanzlei@meinstb.at" },
          { label: "Buchführungsart",    val: "EAR (Einnahmen-Ausgaben-Rechnung)" },
        ].map(({ label, val }) => (
          <div key={label}>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">{val}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Speichern
        </button>
        <button className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 flex items-center gap-1.5">
          Abbrechen
        </button>
      </div>
    </>
  );
}
