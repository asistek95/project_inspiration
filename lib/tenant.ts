export interface TenantConfig {
  slug: string;
  name: string;              // z.B. "Kanzlei Müller & Partner"
  logoUrl?: string;          // URL zum Logo
  primaryColor?: string;     // z.B. "#1a56db" — überschreibt Brand-Blau
  welcomeHeadline?: string;  // "Ihr Steuerberater-Portal"
  welcomeText?: string;      // "Bitte melden Sie sich mit Ihren Zugangsdaten an."
  contactEmail?: string;
  domain?: string;           // Custom Domain z.B. "portal.mueller-steuer.at"
  footerText?: string;
}

export const DEFAULT_TENANT: TenantConfig = {
  slug: "klarblick",
  name: "Klarblick",
  logoUrl: "/klar.png",
  welcomeHeadline: "Mein Monat ist bis zum 15. fertig.",
  welcomeText: "Belege rein. Monat bis zum 15. steuerberaterbereit. Dein digitaler Monatsabschluss-Assistent.",
  contactEmail: "office@klarblick.at",
};

// Client-side: liest aus URL-Parameter oder localStorage
export function getTenantSlugFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("tenant") || params.get("kanzlei") || null;
}

// Speichert zuletzt verwendeten Tenant im Browser
export function persistTenantSlug(slug: string) {
  try { localStorage.setItem("klarblick.tenant", slug); } catch {}
}

export function getStoredTenantSlug(): string | null {
  try { return localStorage.getItem("klarblick.tenant"); } catch { return null; }
}

export function clearStoredTenant() {
  try { localStorage.removeItem("klarblick.tenant"); } catch {}
}
