import { NextRequest, NextResponse } from "next/server";

// Twilio WhatsApp Webhook (Beleg-Foto-OCR + KI-Antwort)
// Twilio postet x-www-form-urlencoded mit Feldern wie:
//   From=whatsapp:+436641234567
//   Body=...
//   NumMedia=1
//   MediaUrl0=https://api.twilio.com/.../Media/ME...
//
// Antwort: TwiML XML <Response><Message>…</Message></Response>

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Du bist Klarblick, ein WhatsApp-Assistent für Handwerksbetriebe.
Antworte:
- sehr kurz (max. 3 Sätze, WhatsApp-tauglich)
- auf Deutsch
- konkret und nützlich
- bei Belegen: bestätige Empfang, nenne erkannten Betrag & Lieferant
Wenn du etwas nicht weißt, sag es ehrlich.`;

async function fetchTwilioMediaAsDataUrl(mediaUrl: string): Promise<string | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(mediaUrl, { headers: { authorization: `Basic ${auth}` } });
    if (!res.ok) return null;
    const mediaType = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mediaType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function callOcr(imageDataUrl: string): Promise<any | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const [, mediaType, base64] = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: 'Extrahiere als JSON: {"vendor":"...","date":"YYYY-MM-DD","gross_amount":0,"vat_rate":20,"category":"Material|Treibstoff|Büro|Sonstiges"}. Nur JSON.' },
          ],
        }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

async function askClaude(userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Hallo! Ich bin Klarblick. Sobald der API-Key gesetzt ist, antworte ich mit echten Zahlen aus deinem Konto.";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!res.ok) return "Gerade ein Fehler. Bitte später nochmal.";
    const data = await res.json();
    return data?.content?.[0]?.text ?? "OK.";
  } catch { return "Verbindungsfehler."; }
}

function twiml(message: string): string {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const from = String(form.get("From") || "");
    const body = String(form.get("Body") || "");
    const numMedia = Number(form.get("NumMedia") || 0);
    const mediaUrl = numMedia > 0 ? String(form.get("MediaUrl0") || "") : "";

    let reply: string;

    if (mediaUrl) {
      // Beleg-Foto: Bild laden → OCR → Bestätigung
      const dataUrl = await fetchTwilioMediaAsDataUrl(mediaUrl);
      const ocr = dataUrl ? await callOcr(dataUrl) : null;
      if (ocr && ocr.vendor) {
        const amount = ocr.gross_amount ? `${Number(ocr.gross_amount).toFixed(2)} €` : "(Betrag unklar)";
        reply = `📸 Beleg empfangen!\n• Lieferant: ${ocr.vendor}\n• Betrag: ${amount}\n• Datum: ${ocr.date || "?"}\n• Kategorie: ${ocr.category || "?"}\n\nGespeichert. ✅`;
      } else {
        reply = "📸 Beleg empfangen! Verarbeitung läuft — ich schicke dir gleich die Auswertung.";
      }
      // TODO: ocr-Daten in Supabase (receipts-Tabelle für `from`-Nummer) speichern
    } else {
      reply = await askClaude(body || "(leere Nachricht)");
    }

    // TODO: Nachricht + Antwort in Supabase whatsapp_messages loggen (from, body, reply, created_at)

    return new NextResponse(twiml(reply), {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  } catch {
    return new NextResponse(twiml("Fehler. Bitte später nochmal."), {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }
}

export async function GET() {
  const hasTwilio = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_WHATSAPP_FROM;
  const hasAi = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({ ok: true, webhook: "POST hier für Twilio-Inbound", twilio_configured: hasTwilio, ai_configured: hasAi });
}
