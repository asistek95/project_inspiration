/**
 * Zentrale Marken-Infos für Klarblick — verwendet in PDFs, Rechnungen, E-Mails.
 * Passe Anschrift, UID, Bank etc. hier zentral an.
 */
export const KLARBLICK_BRAND = {
  legal_name: "Klarblick e.U.",
  owner: "Amin Sistek",
  address_line1: "Icon Tower",
  address_line2: "Wienerbergstraße 11 / 16. OG",
  zip_city: "1100 Wien",
  country: "Österreich",
  email: "office@klarblick.at",
  web: "klarblick.at",
  phone: "",
  uid: "ATU—— (Beta)",
  bank_name: "",
  iban: "",
  bic: "",
  // Farben (Tailwind brand-600 / accent)
  color_brand: "#2563eb",
  color_accent: "#10b981",
  color_text: "#0f172a",
  color_muted: "#64748b",
};

export function brandFullAddress(): string {
  const b = KLARBLICK_BRAND;
  return [
    `${b.legal_name} · ${b.owner}`,
    `${b.address_line1} · ${b.address_line2}`,
    `${b.zip_city} · ${b.country}`,
    `${b.email} · ${b.web}`,
  ].join("\n");
}
