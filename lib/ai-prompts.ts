// Premium-Prompts für KMU-Reports + Steuerberater-Vorbereitung
// Zentral verwaltet, damit Marketing & UI synchron bleiben.

import {
  FileBarChart2,
  Briefcase,
  Calculator,
  ListChecks,
  Mail,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Sparkles,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export type PromptCategory = "report" | "steuerberater" | "premium";

export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  label: string; // Quick-Action-Button-Text
  prompt: string; // Voller Prompt für Claude
  Icon: LucideIcon;
}

export const QUICK_ACTIONS: PromptTemplate[] = [
  // ── Management Report ─────────────────────────────────────────────
  {
    id: "executive-summary",
    category: "report",
    label: "Executive Summary",
    Icon: FileBarChart2,
    prompt:
      "Erstelle eine Executive Summary meines aktuellen Monatsabschlusses. Fasse Umsatz, Kosten, Gewinn und Cashflow in maximal 6 Sätzen so zusammen, dass sie der Geschäftsführung in 30 Sekunden alles Wichtige zeigt. Klare Sprache, keine Floskeln.",
  },
  {
    id: "monatsreport",
    category: "report",
    label: "Management Report erstellen",
    Icon: Briefcase,
    prompt:
      "Erstelle einen vollständigen Management Report für den aktuellen Monat. Gliederung: 1) Executive Summary 2) Umsatzentwicklung 3) Kostenstruktur 4) Liquidität 5) Top-Risiken 6) Handlungsempfehlungen. Professionell, investorentauglich.",
  },
  {
    id: "abweichungen",
    category: "report",
    label: "Abweichungen erklären",
    Icon: TrendingUp,
    prompt:
      "Vergleiche die aktuellen Zahlen mit dem Vormonat und dem Vorjahresmonat. Erkläre die 3 größten Abweichungen verständlich und nenne mögliche Ursachen.",
  },
  {
    id: "kpis",
    category: "report",
    label: "Kennzahlen analysieren",
    Icon: Calculator,
    prompt:
      "Welche KPIs aus meinen aktuellen Zahlen sollte ich im Management Report hervorheben? Liste die Top 5 mit aktuellem Wert, Trend und kurzer Bewertung.",
  },
  {
    id: "risiken",
    category: "report",
    label: "Risiken erkennen",
    Icon: AlertTriangle,
    prompt:
      "Analysiere meine Zahlen auf Risiken (Liquidität, Klumpenrisiko Kunden/Lieferanten, Kostentreiber). Nenne pro Risiko: Schweregrad, Ursache, sofortige Gegenmaßnahme.",
  },

  // ── Steuerberater-Vorbereitung ────────────────────────────────────
  {
    id: "checkliste",
    category: "steuerberater",
    label: "Steuerberater-Checkliste",
    Icon: ClipboardCheck,
    prompt:
      "Erstelle eine vollständige Checkliste, die ich abarbeiten muss, bevor ich meine Buchhaltung an den Steuerberater übergebe. Prüfe meine aktuellen Belege auf: fehlende Belege, unklare Kategorien, Skonto-Fristen, USt-Auffälligkeiten. Format: Abhakbare Liste.",
  },
  {
    id: "unterlagen-fehlen",
    category: "steuerberater",
    label: "Fehlende Unterlagen",
    Icon: ListChecks,
    prompt:
      "Welche Unterlagen oder Belege fehlen mir noch, bevor ich den Monatsabschluss an meinen Steuerberater schicken kann? Achte besonders auf wiederkehrende Kosten (Miete, Strom, Versicherung, Leasing) sowie unklare Kategorien.",
  },
  {
    id: "fragen-stb",
    category: "steuerberater",
    label: "Fragen an Steuerberater",
    Icon: ClipboardCheck,
    prompt:
      "Formuliere die 5 wichtigsten Fragen, die ich meinem Steuerberater diesen Monat konkret stellen sollte — basierend auf meinen aktuellen Zahlen, Auffälligkeiten und Steueroptimierungs-Potenzial.",
  },
  {
    id: "email-stb",
    category: "steuerberater",
    label: "E-Mail an Steuerberater",
    Icon: Mail,
    prompt:
      "Formuliere eine professionelle E-Mail an meinen Steuerberater mit: 1) Übergabe der Monatsdaten 2) konkreten offenen Fragen 3) Bitte um Termin. Höflich, präzise, kurz.",
  },
  {
    id: "belege-unsicher",
    category: "steuerberater",
    label: "Auffällige Belege",
    Icon: Receipt,
    prompt:
      "Welche Belege aus meinem aktuellen Zeitraum wirken unvollständig, erklärungsbedürftig oder steuerlich kritisch? Liste sie mit Begründung — damit ich sie vor dem Steuerberater-Termin selbst klären kann.",
  },

  // ── Premium Wow-Prompts ───────────────────────────────────────────
  {
    id: "wow-full",
    category: "premium",
    label: "Komplett-Analyse + Checkliste",
    Icon: Sparkles,
    prompt:
      "Analysiere meine Unternehmenszahlen vollständig und liefere: 1) Executive Summary 2) Auffälligkeiten 3) Risiken 4) Chancen 5) Steuerberater-Checkliste 6) Konkrete nächste Schritte. Professionell, Output-formatiert mit Überschriften.",
  },
  {
    id: "wow-kosten-sparen",
    category: "premium",
    label: "Steuerberaterkosten senken",
    Icon: Calculator,
    prompt:
      "Zeige mir konkret, welche Vorarbeiten ich selbst erledigen kann, um die Stunden meines Steuerberaters (und damit die Rechnung) deutlich zu reduzieren. Pro Punkt: Aufwand für mich, gesparte Steuerberater-Zeit, geschätzte Ersparnis in Euro.",
  },
  {
    id: "wow-todos",
    category: "premium",
    label: "To-do-Liste erstellen",
    Icon: ListChecks,
    prompt:
      "Erstelle drei priorisierte To-do-Listen aus meinen aktuellen Zahlen: 1) für die Buchhaltung (heute/morgen) 2) für die Geschäftsführung (diese Woche) 3) für den Steuerberater (zum Monatsende).",
  },
];

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  report: "Management Report",
  steuerberater: "Steuerberater-Vorbereitung",
  premium: "Premium-Analysen",
};
