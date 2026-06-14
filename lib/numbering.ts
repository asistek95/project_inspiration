// Fortlaufende Belegnummerierung — User-konfigurierbar
// Format z.B. "ER-2026-0001" (Eingangsrechnung), "QT-2026-0001" (Quittung)
// Pro Beleg-Typ eigener Präfix, gemeinsamer fortlaufender Counter (GoBD-konform: lückenlos & eindeutig).

import type { ReceiptType } from "./types";

export type NumberingConfig = {
  enabled: boolean;
  prefix: string;     // Legacy / Fallback
  next: number;
  padding: number;
  suffix: string;
  prefixes?: Partial<Record<ReceiptType, string>>;
};

const KEY = "klarblick.numbering";

const Y = new Date().getFullYear();

export const DEFAULT_PREFIXES: Record<ReceiptType, string> = {
  Rechnung: `ER-${Y}-`,
  Quittung: `QT-${Y}-`,
  Kassenbon: `KB-${Y}-`,
  Tankbeleg: `TB-${Y}-`,
  Bewirtungsbeleg: `BW-${Y}-`,
  Sonstiges: `BL-${Y}-`,
};

export const DEFAULT_NUMBERING: NumberingConfig = {
  enabled: true,
  prefix: `ER-${Y}-`,
  next: 1,
  padding: 4,
  suffix: "",
  prefixes: { ...DEFAULT_PREFIXES },
};

export function loadNumbering(): NumberingConfig {
  if (typeof window === "undefined") return DEFAULT_NUMBERING;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NUMBERING;
    const obj = JSON.parse(raw);
    return {
      ...DEFAULT_NUMBERING,
      ...obj,
      prefixes: { ...DEFAULT_PREFIXES, ...(obj.prefixes || {}) },
    };
  } catch {
    return DEFAULT_NUMBERING;
  }
}

export function saveNumbering(cfg: NumberingConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

function prefixFor(cfg: NumberingConfig, type?: ReceiptType, direction?: "eingang" | "ausgang" | "neutral"): string {
  // Ausgangsrechnung bekommt eigenen Präfix (GoBD: Ausgangs- und Eingangsbelege getrennt nummerieren)
  if (type === "Rechnung" && direction === "ausgang") {
    return cfg.prefixes?.["Rechnung" as ReceiptType] 
      ? (cfg.prefixes?.["Rechnung" as ReceiptType] || "").replace(/^ER-/, "AR-")
      : "AR-2026-";
  }
  if (type && cfg.prefixes?.[type]) return cfg.prefixes[type]!;
  return cfg.prefix;
}

export function formatNumber(cfg: NumberingConfig, n: number, type?: ReceiptType, direction?: "eingang" | "ausgang" | "neutral"): string {
  return `${prefixFor(cfg, type, direction)}${String(n).padStart(cfg.padding, "0")}${cfg.suffix}`;
}

export function previewNext(cfg: NumberingConfig = loadNumbering(), type?: ReceiptType, direction?: "eingang" | "ausgang" | "neutral"): string {
  return formatNumber(cfg, cfg.next, type, direction);
}

// Reserviert die aktuelle Nummer und erhöht den Zähler.
export function reserveNextNumber(type?: ReceiptType, direction?: "eingang" | "ausgang" | "neutral"): string {
  const cfg = loadNumbering();
  if (!cfg.enabled) return "";
  const out = formatNumber(cfg, cfg.next, type, direction);
  saveNumbering({ ...cfg, next: cfg.next + 1 });
  return out;
}
