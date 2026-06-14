/**
 * Österreichisches Steuerrecht — automatische Vorsteuerabzug-Erkennung
 *
 * §12 Abs 2 Z 2 lit. b UStG 1994:
 * PKW/Kombi → KEIN Vorsteuerabzug (außer Ausnahmen: Taxi, Fahrschule, Kfz-Handel)
 * Kastenwagen/LKW → Vorsteuerabzug möglich
 */

export type VorsteuerResult = {
  berechtigt: boolean | null;  // null = unbekannt
  grund: string;
  hinweis?: string;
};

// Fahrzeuge ohne Vorsteuerabzug (§12 Abs 2 Z 2)
const KEIN_VORSTEUER_KFZ = [
  // BMW PKW
  "1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er",
  "bmw x1", "bmw x2", "bmw x3", "bmw x4", "bmw x5", "bmw x6", "bmw x7",
  "bmw m2", "bmw m3", "bmw m4", "bmw m5",
  // Audi PKW
  "audi a1", "audi a2", "audi a3", "audi a4", "audi a5", "audi a6", "audi a7", "audi a8",
  "audi q2", "audi q3", "audi q4", "audi q5", "audi q7", "audi q8",
  "audi tt", "audi r8", "audi e-tron suv",
  // Mercedes PKW
  "a-klasse", "b-klasse", "c-klasse", "e-klasse", "s-klasse", "cl-klasse", "clk",
  "mercedes glb", "mercedes glc", "mercedes gle", "mercedes gls", "mercedes gla",
  "mercedes eqs", "mercedes eqc", "mercedes eqa", "mercedes eqb",
  "mercedes slk", "mercedes sl ", "mercedes amg",
  // VW PKW
  "vw golf", "vw polo", "vw passat", "vw tiguan", "vw touareg",
  "vw arteon", "vw id.3", "vw id.4", "vw id.5",
  "golf ", "polo ", "passat ", "touareg",
  // Skoda
  "skoda octavia", "skoda superb", "skoda fabia", "skoda scala",
  "skoda kodiaq", "skoda karoq", "skoda kamiq", "skoda enyaq",
  // Seat / Cupra
  "seat ibiza", "seat leon", "seat arona", "seat ateca", "seat tarraco",
  "cupra formentor", "cupra leon", "cupra born",
  // Opel
  "opel astra", "opel insignia", "opel corsa", "opel crossland", "opel grandland",
  "opel mokka", "opel zafira",
  // Toyota PKW
  "toyota corolla", "toyota camry", "toyota rav4", "toyota c-hr", "toyota yaris",
  "toyota auris", "toyota prius", "toyota aygo",
  // Ford PKW
  "ford focus", "ford fiesta", "ford puma", "ford kuga", "ford mondeo",
  "ford mustang", "ford explorer",
  // Renault PKW
  "renault clio", "renault megane", "renault captur", "renault arkana",
  "renault austral", "renault zoe", "renault scenic",
  // Peugeot PKW
  "peugeot 208", "peugeot 308", "peugeot 508", "peugeot 2008", "peugeot 3008", "peugeot 5008",
  "peugeot e-208",
  // Citroen PKW
  "citroen c3", "citroen c4", "citroen c5",
  // Hyundai / Kia
  "hyundai i20", "hyundai i30", "hyundai tucson", "hyundai ioniq",
  "kia rio", "kia ceed", "kia sportage", "kia stonic", "kia niro", "kia ev6",
  // Volvo PKW
  "volvo s60", "volvo s90", "volvo v60", "volvo v90", "volvo xc40", "volvo xc60", "volvo xc90",
  // Allgemein
  "pkw", "personenkraftwagen", "kombi", "limousine", "cabriolet", "coupe", "coupé",
  "suv", "geländewagen",
];

// Fahrzeuge MIT Vorsteuerabzug (Kastenwagen, LKW, Kleinbus)
const MIT_VORSTEUER_KFZ = [
  // VW Nutzfahrzeuge
  "caddy kastenwagen", "caddy cargo", "caddy maxi",
  "vw crafter", "crafter",
  "vw transporter kastenwagen", "vw t5 kastenwagen", "vw t6 kastenwagen",
  "vw t6.1 kastenwagen",
  "vw amarok",  // Pick-Up = Vorsteuer OK
  // Mercedes Nutzfahrzeuge
  "sprinter kastenwagen", "sprinter",
  "vito kastenwagen",
  "citan kastenwagen",
  // Ford Nutzfahrzeuge
  "ford transit connect", "ford transit custom", "ford transit kastenwagen",
  "ford ranger", "ford transit courier",
  // Fiat Nutzfahrzeuge
  "fiat ducato", "fiat doblo cargo", "fiat fiorino",
  "fiat fullback",
  // Renault Nutzfahrzeuge
  "renault master", "renault trafic kastenwagen", "renault kangoo kastenwagen",
  "renault express",
  // Citroen Nutzfahrzeuge
  "citroen jumper", "citroen jumpy kastenwagen", "citroen berlingo kastenwagen",
  // Peugeot Nutzfahrzeuge
  "peugeot boxer", "peugeot expert kastenwagen", "peugeot partner kastenwagen",
  // Toyota
  "toyota hiace kastenwagen", "toyota proace kastenwagen",
  "toyota hilux",  // Pick-Up
  // Iveco / MAN / Volvo LKW
  "iveco daily", "iveco ",
  "man tge", "man tgl", "man tgm", "man tgx",
  "volvo fh", "volvo fl",
  "scania",
  // Opel Nutzfahrzeuge
  "opel vivaro kastenwagen", "opel movano",
  "opel combo cargo",
  // Sonstige
  "kastenwagen", "lkw", "lieferwagen", "kleinlastwagen",
  "transporter kastenwagen",
  "pick-up", "pickup", "pritschenwagen",
  "sattelschlepper", "anhänger",
];

// Sonstige Einschränkungen
const BEWIRTUNG_PATTERN = /bewirtung|restaur|gasthaus|gaststätte|hotel.*bewirtung/i;
const PRIVAT_PATTERN = /privat|haushalt|wohnung miete|urlaub|freizeit/i;

export function detectVorsteuerabzug(
  text: string,
  direction?: string,
  category?: string,
): VorsteuerResult {
  const lower = (text || "").toLowerCase();
  const catLower = (category || "").toLowerCase();

  // Ausgangsrechnung → kein Vorsteuerabzug für uns
  if (direction === "ausgang") {
    return {
      berechtigt: false,
      grund: "Ausgangsrechnung — keine Vorsteuer, du schuldest USt ans Finanzamt",
    };
  }

  // Kastenwagen/LKW → JA
  for (const kw of MIT_VORSTEUER_KFZ) {
    if (lower.includes(kw)) {
      return {
        berechtigt: true,
        grund: `Nutzfahrzeug erkannt (${kw}) → Vorsteuerabzug zulässig`,
        hinweis: "Kastenwagen/LKW: Vorsteuer gem. §12 UStG abzugsfähig",
      };
    }
  }

  // PKW/Kombi → NEIN
  for (const kw of KEIN_VORSTEUER_KFZ) {
    if (lower.includes(kw)) {
      return {
        berechtigt: false,
        grund: `PKW/Kombi erkannt (${kw}) → kein Vorsteuerabzug`,
        hinweis: "§12 Abs 2 Z 2 lit. b UStG: PKW/Kombi vom Vorsteuerabzug ausgeschlossen",
      };
    }
  }

  // Bewirtung → nur 50% abzugsfähig, keine Vorsteuer
  if (BEWIRTUNG_PATTERN.test(lower) || catLower === "bewirtung") {
    return {
      berechtigt: false,
      grund: "Bewirtungsaufwand — kein Vorsteuerabzug",
      hinweis: "§20 Abs 1 Z 3 EStG: Bewirtung nur 50% abzugsfähig, USt nicht abziehbar",
    };
  }

  // Private Ausgaben → kein Abzug
  if (PRIVAT_PATTERN.test(lower)) {
    return {
      berechtigt: false,
      grund: "Privater Aufwand erkannt — kein Vorsteuerabzug",
      hinweis: "§12 Abs 2 Z 2 UStG: Privater Anteil schließt Vorsteuerabzug aus",
    };
  }

  // Eingangsrechnung ohne Sonderfall → in der Regel ja
  if (direction === "eingang") {
    return {
      berechtigt: true,
      grund: "Eingangsrechnung — Vorsteuerabzug grundsätzlich zulässig",
    };
  }

  return { berechtigt: null, grund: "Konnte nicht automatisch bestimmt werden" };
}

/** Gibt eine kurze Erklärung für die UI zurück */
export function vorsteuerLabel(berechtigt: boolean | null): string {
  if (berechtigt === true) return "Vorsteuerabzugsberechtigt (§ 12 UStG)";
  if (berechtigt === false) return "Kein Vorsteuerabzug";
  return "Vorsteuerabzug prüfen";
}
