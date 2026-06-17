"use client";

// Interne Kategorien — pro Mandant, localStorage-basiert
// Ebene 2 des Kategorie-Systems (Ebene 1 = Steuerkategorie)

const CATS_KEY = "klarblick.intern_cats.v1";
const SUPPLIER_KEY = "klarblick.supplier_cats.v1";

function isBrowser() { return typeof window !== "undefined"; }

export const STARTER_CATS = [
  "Subunternehmer",
  "Material",
  "Werkzeug",
  "Fahrzeug / KFZ",
  "Büro & IT",
  "Marketing",
  "Reise & Spesen",
  "Personalkosten",
  "Miete & Leasing",
];

export function loadInternCats(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (!raw) return [...STARTER_CATS];
    return JSON.parse(raw) as string[];
  } catch { return [...STARTER_CATS]; }
}

export function addInternCat(name: string): string[] {
  if (!isBrowser()) return [];
  const cats = loadInternCats();
  const trimmed = name.trim();
  if (!trimmed || cats.includes(trimmed)) return cats;
  const next = [...cats, trimmed];
  localStorage.setItem(CATS_KEY, JSON.stringify(next));
  return next;
}

export function removeInternCat(name: string): string[] {
  if (!isBrowser()) return [];
  const next = loadInternCats().filter((c) => c !== name);
  localStorage.setItem(CATS_KEY, JSON.stringify(next));
  return next;
}

/** Merkt sich: Lieferant X → interne Kategorie Y */
export function rememberSupplierCat(supplier: string, cat: string): void {
  if (!isBrowser() || !supplier || !cat) return;
  const map: Record<string, string> = JSON.parse(
    localStorage.getItem(SUPPLIER_KEY) || "{}"
  );
  map[supplier.toLowerCase().slice(0, 50)] = cat;
  localStorage.setItem(SUPPLIER_KEY, JSON.stringify(map));
}

/** Schlägt interne Kategorie basierend auf Lieferantname vor */
export function suggestInternCat(supplier: string): string | null {
  if (!isBrowser() || !supplier) return null;
  try {
    const map: Record<string, string> = JSON.parse(
      localStorage.getItem(SUPPLIER_KEY) || "{}"
    );
    const key = supplier.toLowerCase().slice(0, 50);
    if (map[key]) return map[key];
    // Fuzzy: erster Treffer mit gemeinsamen 5-Zeichen-Präfix
    const prefix = key.slice(0, 5);
    const fuzzy = Object.keys(map).find((k) => k.startsWith(prefix));
    return fuzzy ? map[fuzzy] : null;
  } catch { return null; }
}
