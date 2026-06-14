import { NextRequest, NextResponse } from "next/server";

// Rate-Limiting für AI-Analyse (teurer als OCR)
const AI_RATE_WINDOW = 60_000;
const AI_RATE_LIMIT = 5; // max 5 AI-Anfragen pro Minute pro IP
const aiIpCounter = new Map<string, { count: number; windowStart: number }>();
function checkAiRateLimit(ip: string) {
  const now = Date.now();
  const e = aiIpCounter.get(ip);
  if (!e || now - e.windowStart > AI_RATE_WINDOW) { aiIpCounter.set(ip, { count: 1, windowStart: now }); return true; }
  if (e.count >= AI_RATE_LIMIT) return false;
  e.count++; return true;
}

// Anthropic Claude Sonnet — direkt via fetch (kein SDK nötig)
// Erwartet: { prompt: string, context: { receipts: Receipt[], periodLabel: string, company: string } }
// Liefert: { text: string, model: string, tokensIn: number, tokensOut: number }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Du bist Klarblick, ein KI-Assistent für Management-Reporting und Steuerberater-Vorbereitung für österreichische und deutsche KMUs — speziell Handwerksbetriebe.

Antworte:
- auf Deutsch (Sie-Form Geschäftsführung, ansonsten "du")
- in klarer, prägnanter Geschäftssprache
- strukturiert mit Markdown-Überschriften (##), Bullet-Points und Zahlen
- mit konkreten Empfehlungen, keinen Floskeln
- WICHTIG: Du bist KEIN Steuerberater. Bei steuerlichen Fragen empfiehlst du, den Steuerberater zu fragen.
- Beträge in Euro mit Tausenderpunkt, z.B. 12.450 €

Du arbeitest auf Basis der mitgegebenen Belege/Zahlen. Wenn Daten fehlen, sage es ehrlich.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          text:
            "## Demo-Modus aktiv\n\nFür echte KI-Auswertungen wird ein Anthropic-API-Key benötigt.\n\nIn der Zwischenzeit hier eine **Beispiel-Auswertung** auf Basis deiner Demo-Daten:\n\n### Auffällig\n- Materialkosten +12 % gegenüber Vormonat\n- Skonto-Potenzial 340 € (3 offene Rechnungen mit Skonto-Frist diese Woche)\n- 1 Lieferant ohne USt-ID auf Rechnung — bitte klären\n\n### Empfehlung\n1. Skonto-Rechnungen heute zahlen → 340 € sparen\n2. Materialpreis bei Hauptlieferant prüfen\n3. Fehlende USt-ID beim Lieferanten anfordern, bevor Übergabe an Steuerberater\n\n_Setze `ANTHROPIC_API_KEY` in den Railway-ENV-Variablen, um echte Auswertungen zu aktivieren._",
          model: "demo-mode",
          tokensIn: 0,
          tokensOut: 0,
        },
        { status: 200 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkAiRateLimit(ip)) {
      return NextResponse.json({ error: "Rate-Limit: max 5 KI-Anfragen pro Minute.", code: "RATE_LIMIT" }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, context } = body as {
      prompt: string;
      context?: { receipts?: unknown[]; periodLabel?: string; company?: string };
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt fehlt" }, { status: 400 });
    }

    const contextBlock = context
      ? `\n\n--- DATEN-KONTEXT ---\nUnternehmen: ${context.company ?? "n/a"}\nZeitraum: ${context.periodLabel ?? "n/a"}\nAnzahl Belege: ${context.receipts?.length ?? 0}\nBelege (JSON, max. 60):\n${JSON.stringify((context.receipts ?? []).slice(0, 60), null, 2)}\n--- ENDE KONTEXT ---`
      : "";

    const userMessage = `${prompt}${contextBlock}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Anthropic-Fehler", detail: errText.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      Array.isArray(data?.content) && data.content[0]?.type === "text"
        ? data.content[0].text
        : "(Keine Antwort erhalten)";

    return NextResponse.json({
      text,
      model: data?.model ?? "unknown",
      tokensIn: data?.usage?.input_tokens ?? 0,
      tokensOut: data?.usage?.output_tokens ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Server-Fehler", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
