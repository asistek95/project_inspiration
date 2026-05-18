// Fortlaufende Belegnummerierung — User-konfigurierbar
// Format z.B. "ER-2026-0001", "BEL-001", "R/2026/47"

export type NumberingConfig = {
  enabled: boolean;
  prefix: string;     // "ER-2026-"
  next: number;       // 1
  padding: number;    // 4  =>  0001
  suffix: string;     // ""
};

const KEY = "klarblick.numbering";

export const DEFAULT_NUMBERING: NumberingConfig = {
  enabled: true,
  prefix: "ER-2026-",
  next: 1,
  padding: 4,
  suffix: "",
};

export function loadNumbering(): NumberingConfig {
  if (typeof window === "undefined") return DEFAULT_NUMBERING;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NUMBERING;
    const obj = JSON.parse(raw);
    return { ...DEFAULT_NUMBERING, ...obj };
  } catch {
    return DEFAULT_NUMBERING;
  }
}

export function saveNumbering(cfg: NumberingConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function formatNumber(cfg: NumberingConfig, n: number): string {
  return `${cfg.prefix}${String(n).padStart(cfg.padding, "0")}${cfg.suffix}`;
}

export function previewNext(cfg: NumberingConfig = loadNumbering()): string {
  return formatNumber(cfg, cfg.next);
}

// Reserviert die aktuelle Nummer und erhöht den Zähler.
export function reserveNextNumber(): string {
  const cfg = loadNumbering();
  if (!cfg.enabled) return "";
  const out = formatNumber(cfg, cfg.next);
  saveNumbering({ ...cfg, next: cfg.next + 1 });
  return out;
}
