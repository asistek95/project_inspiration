"use client";

import { CheckCircle2, AlertTriangle, Info, ExternalLink } from "lucide-react";

interface TaxCase {
  paragraph: string;
  title: string;
  desc: string;
  examples: string[];
  klarblick_support: "vollständig" | "teilweise" | "hinweis";
}

const CASES: TaxCase[] = [
  {
    paragraph: "§ 12 UStG 1994",
    title: "Vorsteuerabzug",
    desc: "Unternehmer können die auf Eingangsrechnungen ausgewiesene USt als Vorsteuer vom Finanzamt zurückfordern.",
    examples: ["Wareneinkauf 20% USt", "Werkzeug & Material", "Software-Abos", "Bürobedarf"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 12 Abs 2 Z 2 UStG",
    title: "Kein Vorsteuerabzug PKW/Kombi",
    desc: "Für PKW und Kombinationskraftwagen ist der Vorsteuerabzug grundsätzlich ausgeschlossen. Ausnahmen: Taxi, Fahrschule, Kfz-Handel.",
    examples: ["BMW 5er", "Mercedes E-Klasse", "Audi A6", "VW Golf, Passat"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 12 UStG — Kastenwagen",
    title: "Vorsteuerabzug Kastenwagen/LKW",
    desc: "Kastenwagen, Kleintransporter und LKW sind vom PKW-Ausschluss ausgenommen. Vorsteuerabzug möglich.",
    examples: ["VW Caddy Kastenwagen", "Mercedes Sprinter", "Ford Transit", "VW Crafter"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 19 Abs 1a UStG 1994",
    title: "Reverse Charge — Bauleistungen",
    desc: "Bei Bauleistungen im Inland geht die Steuerschuld auf den Leistungsempfänger über. Der Auftragnehmer stellt keine USt in Rechnung.",
    examples: ["Subunternehmer Bauarbeiten", "Montage", "Instandhaltung", "Sanierung"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 19 Abs 1 UStG — B2B EU",
    title: "Reverse Charge — EU-Dienstleistungen",
    desc: "Sonstige Leistungen von EU-Unternehmern an österreichische Unternehmer. Empfänger schuldet die USt.",
    examples: ["Adobe (Irland)", "Google Workspace (Irland)", "Spotify Business", "EU-Software-Abos"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 19 Abs 1 UStG — Drittland",
    title: "Reverse Charge — Drittland-Dienstleistungen",
    desc: "Dienstleistungen aus Nicht-EU-Ländern (USA, UK, CH) an AT-Unternehmer. Empfänger schuldet AT-USt.",
    examples: ["GitHub (USA)", "AWS (USA)", "Stripe (USA)", "Shopify", "US-SaaS allgemein"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 6 Abs 1 Z 6 UStG",
    title: "Innergemeinschaftliche Lieferung (IGL)",
    desc: "Warenlieferungen in andere EU-Mitgliedstaaten sind steuerfrei, wenn beide Unternehmer UID-Nummern haben.",
    examples: ["Warenexport nach Deutschland", "Lieferung an EU-Firma mit UID"],
    klarblick_support: "teilweise",
  },
  {
    paragraph: "§ 1 Abs 1 Z 1 UStG",
    title: "Innergemeinschaftlicher Erwerb (IGE)",
    desc: "Warenkauf von EU-Unternehmer: Erwerbsteuer in Österreich. Muss in UVA unter KZ 070 erfasst werden.",
    examples: ["Warenimport aus Deutschland", "Einkauf von EU-Lieferant ohne AT-USt"],
    klarblick_support: "teilweise",
  },
  {
    paragraph: "§ 7 UStG",
    title: "Ausfuhr in Drittland (Export)",
    desc: "Lieferungen in Nicht-EU-Länder sind steuerfrei. Ausfuhrnachweis erforderlich.",
    examples: ["Warenexport in die Schweiz", "Export in die USA"],
    klarblick_support: "hinweis",
  },
  {
    paragraph: "§ 6 UStG — Steuerfreie Umsätze",
    title: "Steuerfreie Umsätze ohne Vorsteuerabzug",
    desc: "Bestimmte Leistungen sind steuerfrei, berechtigen aber nicht zum Vorsteuerabzug.",
    examples: ["Versicherungsprämien", "Bankgebühren", "Arztleistungen", "Grundstücksverkauf"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 20 Abs 1 Z 3 EStG",
    title: "Bewirtungsaufwand 50%",
    desc: "Bewirtungsaufwendungen sind nur zu 50% als Betriebsausgabe absetzbar. Kein Vorsteuerabzug.",
    examples: ["Geschäftsessen", "Kundenbewirtung", "Restaurantbesuche mit Geschäftspartnern"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 132 BAO",
    title: "7 Jahre Aufbewahrungspflicht",
    desc: "Alle Belege müssen 7 Jahre aufbewahrt werden. Klarblick archiviert automatisch mit Zeitstempel und Audit-Log.",
    examples: ["Alle Rechnungen", "Kassenbelege", "Bankbelege", "Verträge"],
    klarblick_support: "vollständig",
  },
  {
    paragraph: "§ 11 UStG",
    title: "Rechnungspflichtangaben",
    desc: "Vollrechnungen (>400€) müssen bestimmte Pflichtangaben enthalten: Aussteller, Empfänger, Datum, Betrag, UID, laufende Nummer.",
    examples: ["Rechnungen über 400€ brutto", "Kleinbetragsrechnungen bis 400€ (vereinfacht)"],
    klarblick_support: "teilweise",
  },
  {
    paragraph: "§ 21 UStG",
    title: "Voranmeldung (UVA)",
    desc: "Monatliche oder vierteljährliche Umsatzsteuer-Voranmeldung. Vorsteuer wird mit USt-Schuld verrechnet.",
    examples: ["KZ 010: Lieferungen 20%", "KZ 057: Reverse Charge Basis", "KZ 066: Vorsteuer RC", "KZ 020: Vorsteuer 20%"],
    klarblick_support: "teilweise",
  },
  {
    paragraph: "Einfuhrumsatzsteuer (EUSt)",
    title: "Import aus Drittland",
    desc: "Beim Import aus Nicht-EU-Ländern wird Einfuhrumsatzsteuer fällig. Kann als Vorsteuer geltend gemacht werden.",
    examples: ["Zollbescheid", "Speditionsrechnung mit EUSt", "Import aus China/USA"],
    klarblick_support: "hinweis",
  },
];

const SUPPORT_COLOR = {
  vollständig: "bg-emerald-50 text-emerald-700 border-emerald-200",
  teilweise:   "bg-amber-50 text-amber-700 border-amber-200",
  hinweis:     "bg-slate-50 text-slate-600 border-slate-200",
};
const SUPPORT_ICON = {
  vollständig: <CheckCircle2 className="h-3.5 w-3.5" />,
  teilweise:   <AlertTriangle className="h-3.5 w-3.5" />,
  hinweis:     <Info className="h-3.5 w-3.5" />,
};
const SUPPORT_LABEL = {
  vollständig: "Automatisch erkannt",
  teilweise:   "Teilweise unterstützt",
  hinweis:     "Hinweis / manuell",
};

export default function SteuerfaellePage() {
  const vollCount  = CASES.filter((c) => c.klarblick_support === "vollständig").length;
  const teilCount  = CASES.filter((c) => c.klarblick_support === "teilweise").length;
  const hinweisCount = CASES.filter((c) => c.klarblick_support === "hinweis").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abgedeckte Steuerfälle</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welche österreichischen Steuergesetze Klarblick automatisch erkennt und verarbeitet.
        </p>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{vollCount}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Automatisch erkannt</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{teilCount}</p>
          <p className="text-xs text-amber-600 mt-0.5">Teilweise unterstützt</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-600">{hinweisCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Nur Hinweis</p>
        </div>
      </div>

      {/* Fälle */}
      <div className="space-y-2">
        {CASES.map((c) => (
          <div key={c.paragraph} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {c.paragraph}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SUPPORT_COLOR[c.klarblick_support]}`}>
                    {SUPPORT_ICON[c.klarblick_support]}
                    {SUPPORT_LABEL[c.klarblick_support]}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.examples.map((ex) => (
                    <span key={ex} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 pb-4">
        Stand: Österreichisches UStG 1994, EStG 1988, BAO. Klarblick ersetzt keine Steuerberatung —
        bei Unklarheiten bitte mit dem Steuerberater abklären.
      </p>
    </div>
  );
}
