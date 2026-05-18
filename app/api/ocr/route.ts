import { NextRequest, NextResponse } from "next/server";

// OCR-Endpoint: Beleg-Bild (URL) → strukturierte Daten via Claude Vision
// Wird vom WhatsApp-Webhook UND vom Upload-Frontend genutzt.
//
// Input:  { imageUrl: string }  oder  multipart/form-data mit "file"
// Output: { vendor, date, gross_amount, net_amount, vat_amount, vat_rate, category, raw_text }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OCR_PROMPT = `Du bist ein präziser Beleg-Extraktor für österreichisches Steuerrecht.
Analysiere das Bild SORGFÄLTIG (auch unscharfe Kassenbons, Tankquittungen, Kartenzahlungsbelege, handschriftliche Quittungen, Rechnungen).

Gib AUSSCHLIESSLICH dieses JSON zurück (keine Erklärung, kein Markdown, kein Code-Fence):
{
  "vendor": "Name des Geschäfts/Lieferanten (z.B. 'Shell', 'Hornbach', 'OBI', 'BKV Card', 'METRO')",
  "date": "YYYY-MM-DD oder null",
  "gross_amount": Zahl (Gesamtbetrag/Total),
  "net_amount": Zahl (oder berechnet aus gross/(1+rate/100)),
  "vat_amount": Zahl (oder berechnet),
  "vat_rate": 20 | 13 | 10 | 0,
  "currency": "EUR",
  "category": "Material" | "Werkzeug" | "Treibstoff" | "Büro" | "Bewirtung" | "Sonstiges",
  "receipt_type": "Rechnung" | "Kassenbon" | "Quittung" | "Tankbeleg" | "Bewirtungsbeleg" | "Kartenzahlungsbeleg",
  "confidence": 0.0-1.0
}

WICHTIG:
- Wenn nur ein Gesamtbetrag erkennbar ist (z.B. Kartenzahlungsbeleg ohne Steueraufschlüsselung): trotzdem vendor + gross_amount extrahieren, vat_rate auf 20 schätzen, net/vat berechnen, confidence niedriger.
- Erkenne ALLE Beträge im Bild (auch "Gesamtbetrag", "Total", "Summe", "EUR ..."). Nimm den höchsten plausiblen Endbetrag.
- Bei Tankstellen-Kartenbelegen: receipt_type = "Tankbeleg" oder "Kartenzahlungsbeleg", category = "Treibstoff".
- Zahlen IMMER als Number (Punkt als Dezimaltrenner, kein €).
- Niemals "null" für vendor oder gross_amount — versuche IMMER zu lesen, auch wenn unscharf. Im äußersten Notfall: vendor = "Unbekannt", confidence = 0.3.`;

async function callClaudeVision(imageUrl: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Demo-Fallback
    return {
      vendor: "Demo-Lieferant GmbH",
      date: new Date().toISOString().slice(0, 10),
      gross_amount: 247.5,
      net_amount: 206.25,
      vat_amount: 41.25,
      vat_rate: 20,
      currency: "EUR",
      category: "Material",
      receipt_type: "Rechnung",
      confidence: 0.0,
      _demo: true,
    };
  }

  // Bild als Base64 laden (Twilio-URLs brauchen Auth, http(s)-URLs frei)
  let imageBlock: any;
  if (imageUrl.startsWith("data:")) {
    const [, mediaType, base64] = imageUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    imageBlock = {
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    };
  } else {
    // Versuch: Direkt-URL (Claude unterstützt source.type=url)
    imageBlock = { type: "image", source: { type: "url", url: imageUrl } };
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
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [imageBlock, { type: "text", text: OCR_PROMPT }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude Vision: ${res.status} ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "{}";

  // JSON aus Text extrahieren (manchmal in ```json ... ``` verpackt)
  const match = text.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : "{}";
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { _error: "JSON-Parse-Fehler", raw: text.slice(0, 400) };
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    let imageUrl = "";

    if (ct.includes("application/json")) {
      const body = await req.json();
      imageUrl = body.imageUrl || "";
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        const b64 = buf.toString("base64");
        imageUrl = `data:${file.type};base64,${b64}`;
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl oder file fehlt" }, { status: 400 });
    }

    const result = await callClaudeVision(imageUrl);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ _error: (e as Error).message, vendor: null }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST { imageUrl } oder multipart file",
    ai_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
