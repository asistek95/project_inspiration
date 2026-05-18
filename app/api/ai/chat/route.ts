import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Du bist der "Klarblick-Assistent", der freundliche, kompetente Berater von Klarblick (klarblick.at).

KLARBLICK in einem Satz:
Beleg-Scan & Buchhaltungs-Vorbereitung per KI für österreichische Handwerker, Einzelunternehmer und kleine GmbH/FlexCo. KEIN Ersatz für Steuerberater — wir liefern den vorbereiteten Monatsreport an deinen Steuerberater.

PREISE (monatlich, EUR, exkl. USt):
- Starter 49 € · 100 Belege/Monat · 1 User · OCR + Monatsreport + DATEV-Export
- Profi 119 € · 500 Belege/Monat · 5 User · alles aus Starter + AI-Reports (13 Premium-Prompts) + Skonto-Wächter + SEPA-Sammelüberweisung + GoBD-Audit-Log + WhatsApp-Bot
- Betrieb 199 € · unbegrenzt · 20 User · alles aus Profi + Mehrbenutzer-Rollen + Projekt-Kostenstellen + API-Zugang + White-Label optional

KI-Modell: Claude Sonnet 4 (Anthropic, EU-Hosting). Daten verschlüsselt in EU (Supabase Frankfurt).

GESETZE die wir abdecken (Österreich):
- § 11 UStG (Rechnungspflichtangaben)
- § 12 UStG (Vorsteuerabzug)
- § 26 EStG (Fahrtkosten / Kilometergeld 0,42 €/km)
- GoBD-konformes Audit-Log (unveränderlich)
- SKR03-Kontenrahmen für Buchhaltung

UNTERSCHIED zu sevDesk/BMD/Buchhalter365:
- Wir ersetzen NICHT die Buchhaltung — wir bereiten sie vor (1/3 Preis)
- Steuerberater bleibt im Spiel, bekommt sauberen Monatsreport
- Speziell auf Handwerker zugeschnitten (Lieferanten-DB: Hornbach, Würth, GC Gienger, OMV, Shell etc.)

WHATSAPP-BOT (Profi+): User fotografiert Beleg → schickt an Klarblick-WhatsApp-Nummer → in 5 Sek vorerfasst im Dashboard.

KOSTENLOS TESTEN: 14 Tage Trial, keine Kreditkarte nötig.

STIL:
- Du antwortest auf DEUTSCH (Du-Form, freundlich, ehrlich, direkt — wie ein guter Geschäftspartner aus Österreich)
- KURZ: max. 3–4 Sätze pro Antwort
- Bei Steuerfragen: Verweise auf den Steuerberater, gib aber den Paragrafen mit
- Wenn du etwas NICHT weißt: ehrlich sagen + anbieten, dass Amin sich per Mail meldet
- Nie über Konkurrenz schimpfen — sachlich vergleichen
- Keine Emojis außer einem 👋 / ✓ wenn natürlich

WICHTIG: Sage nie "Ich bin ein KI-Modell von Anthropic" — du bist der Klarblick-Assistent.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages fehlt" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        text: "Demo-Modus: KI-Chat braucht ANTHROPIC_API_KEY. Bitte über das Kontaktformular schreiben.",
        _demo: true,
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 350,
        system: SYSTEM,
        messages: messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: String(m.content || "").slice(0, 2000),
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Claude-Fehler", detail: err.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      Array.isArray(data?.content) && data.content[0]?.type === "text"
        ? data.content[0].text
        : "(keine Antwort)";

    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    ai_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
