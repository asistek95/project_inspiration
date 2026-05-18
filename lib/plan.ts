// Plan-Gating: definiert welche Features pro Abo verfügbar sind.
// Im Demo-Modus wird der Plan aus localStorage gelesen (Default: "profi").
// Im Live-Modus liest die Funktion aus Supabase `companies.plan`.

export type Plan = "starter" | "profi" | "betrieb";

export type Feature =
  | "ocr"                // Beleg-OCR (alle)
  | "report_pdf"         // Monatsreport PDF (alle)
  | "datev_export"       // DATEV/RZL-Export (alle)
  | "ai_reports"         // 13 Premium-AI-Prompts (Profi+)
  | "skonto_alarm"       // Skonto + Preis-Wächter (Profi+)
  | "sepa_xml"           // SEPA-Sammelüberweisung (Profi+)
  | "audit_log"          // GoBD-Audit-Log (Profi+)
  | "whatsapp_bot"       // WhatsApp-Bot (Profi+)
  | "multi_user"         // Mehrere Nutzer + Rollen (Betrieb)
  | "kostenstellen"      // Projekt-Kostenstellen (Betrieb)
  | "api_access"         // API-Zugang (Betrieb)
  | "white_label";       // White-Label (Betrieb, optional)

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  starter: ["ocr", "report_pdf", "datev_export"],
  profi: [
    "ocr", "report_pdf", "datev_export",
    "ai_reports", "skonto_alarm", "sepa_xml", "audit_log", "whatsapp_bot",
  ],
  betrieb: [
    "ocr", "report_pdf", "datev_export",
    "ai_reports", "skonto_alarm", "sepa_xml", "audit_log", "whatsapp_bot",
    "multi_user", "kostenstellen", "api_access", "white_label",
  ],
};

export const PLAN_LIMITS: Record<Plan, { receiptsPerMonth: number | null; users: number }> = {
  starter: { receiptsPerMonth: 100, users: 1 },
  profi: { receiptsPerMonth: 500, users: 5 },
  betrieb: { receiptsPerMonth: null, users: 20 }, // null = unbegrenzt
};

export const PLAN_LABELS: Record<Plan, { name: string; priceEur: number; badgeColor: string }> = {
  starter: { name: "Starter", priceEur: 49, badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  profi: { name: "Profi", priceEur: 119, badgeColor: "bg-brand-50 text-brand-700 border-blue-200" },
  betrieb: { name: "Betrieb", priceEur: 199, badgeColor: "bg-accent-soft text-accent border-emerald-200" },
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export function requiredPlan(feature: Feature): Plan {
  if (PLAN_FEATURES.starter.includes(feature)) return "starter";
  if (PLAN_FEATURES.profi.includes(feature)) return "profi";
  return "betrieb";
}

// Demo-Mode: liest aus localStorage. Live: lese aus Supabase.
export function getCurrentPlan(): Plan {
  if (typeof window === "undefined") return "profi";
  const stored = window.localStorage.getItem("klarblick_plan") as Plan | null;
  return stored && ["starter", "profi", "betrieb"].includes(stored) ? stored : "profi";
}

export function setCurrentPlan(plan: Plan) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("klarblick_plan", plan);
}
