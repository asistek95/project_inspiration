import { NextRequest, NextResponse } from "next/server";

// OCR-Endpoint: Beleg-Bild (URL) → strukturierte Daten via Claude Vision
// Wird vom WhatsApp-Webhook UND vom Upload-Frontend genutzt.
//
// Input:  { imageUrl: string }  oder  multipart/form-data mit "file"
// Output: { vendor, date, gross_amount, net_amount, vat_amount, vat_rate, category, raw_text }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OCR_PROMPT = `Analysiere diesen Beleg/diese Rechnung und extrahiere die Daten als striktes JSON.

Format (KEINE zusätzlichen Felder, KEINE Erklärung, NUR das JSON):
{
  "vendor": "Name des Lieferanten/Geschäfts",
  "date": "YYYY-MM-DD",
  "gross_amount": 0.00,
  "net_amount": 0.00,
  "vat_amount": 0.00,
  "vat_rate": 20,
  "currency": "EUR",
  "category": "Material | Werkzeug | Treibstoff | Büro | Bewirtung | Sonstiges",
  "receipt_type": "Rechnung | Kassenbon | Quittung",
  "confidence": 0.0
}

Wenn ein Wert nicht erkennbar ist: null. Beträge als Zahlen (kein €-Zeichen, Punkt als Dezimaltrenner).`;

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
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 600,
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
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST { imageUrl } oder multipart file",
    ai_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
