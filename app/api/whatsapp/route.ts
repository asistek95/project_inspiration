import { NextRequest, NextResponse } from "next/server";

// Twilio WhatsApp Webhook
// Twilio postet x-www-form-urlencoded mit Feldern wie:
//   From=whatsapp:+436641234567
//   To=whatsapp:+14155238886
//   Body=Wie viel habe ich diesen Monat ausgegeben?
//   NumMedia=1
//   MediaUrl0=https://api.twilio.com/.../Media/ME...
//   MediaContentType0=image/jpeg
//
// Antwort: TwiML XML mit <Response><Message>…</Message></Response>

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Du bist Klarblick, ein WhatsApp-Assistent für Handwerksbetriebe.
Antworte:
- kurz (max. 3 Sätze, WhatsApp-tauglich)
- auf Deutsch
- konkret und nützlich
- bei Belegen: bestätige Empfang, nenne erkannten Betrag & Lieferant, sage "Beleg gespeichert"
- bei Fragen: gib die Zahl direkt, dann Link für Details
Wenn du etwas nicht weißt, sag es ehrlich.`;

async function askClaude(userMessage: string, hasImage: boolean): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return hasImage
      ? "📸 Beleg empfangen! (Demo-Modus — sobald die KI verbunden ist, lese ich Betrag & Lieferant automatisch aus.)"
      : "Hallo! Ich bin Klarblick. Sobald der API-Key gesetzt ist, antworte ich mit echten Zahlen aus deinem Konto.";
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 400,
        system: SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) return "Tut mir leid, gerade ist ein Fehler passiert. Bitte später nochmal.";

    const data = await res.json();
    return data?.content?.[0]?.text ?? "OK.";
  } catch {
    return "Verbindungsfehler. Bitte später nochmal.";
  }
}

function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const from = String(form.get("From") || "");
    const body = String(form.get("Body") || "");
    const numMedia = Number(form.get("NumMedia") || 0);
    const mediaUrl = numMedia > 0 ? String(form.get("MediaUrl0") || "") : "";

    // TODO: Hier prüfen ob `from` (Telefonnummer) zu einem Kunden gehört (Supabase-Lookup).
    // TODO: Bei Bild: Media-URL an /api/ocr senden, Beleg speichern.
    // TODO: Nachricht im Log speichern (Supabase: whatsapp_messages).

    const userMessage = mediaUrl
      ? `[Kunde sendet Bild eines Belegs — URL: ${mediaUrl}]\n\nBegleittext: ${body || "(kein Text)"}`
      : body || "(leere Nachricht)";

    const reply = await askClaude(userMessage, !!mediaUrl);

    return new NextResponse(twiml(reply), {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  } catch (e) {
    return new NextResponse(twiml("Fehler. Bitte später nochmal."), {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }
}

// GET nur als Health-Check
export async function GET() {
  const hasTwilio =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_WHATSAPP_FROM;
  const hasAi = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    ok: true,
    webhook: "POST hier für Twilio-Inbound",
    twilio_configured: hasTwilio,
    ai_configured: hasAi,
  });
}
