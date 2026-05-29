import { NextRequest, NextResponse } from "next/server";

// OCR-Endpoint: Beleg-Bild (URL) → strukturierte Daten via Claude Vision
// Wird vom WhatsApp-Webhook UND vom Upload-Frontend genutzt.
//
// Input:  { imageUrl: string, userCompanyName?: string, userCompanyUid?: string }  oder  multipart/form-data mit "file"
// Output: { vendor, date, gross_amount, net_amount, vat_amount, vat_rate, category, receipt_type, 
//           invoice_type, vendor_uid, vendor_identifier_confidence, raw_text }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Basis-OCR Prompt — extrahiert strukturierte Daten
const OCR_PROMPT = `Du bist ein präziser Beleg-Extraktor für österreichisches Steuerrecht.
Analysiere das Bild SORGFÄLTIG (auch unscharfe Kassenbons, Tankquittungen, Kartenzahlungsbelege, handschriftliche Quittungen, Rechnungen).
Untersuche Kopf- und Fußdaten sowie Firmenwortlaut (z.B. "ÖBB", "SHELL", "HORNBACH", "Metall-Werk GmbH", etc.).

Gib AUSSCHLIESSLICH dieses JSON zurück (keine Erklärung, kein Markdown, kein Code-Fence):
{
  "vendor": "Name des Geschäfts/Lieferanten (z.B. 'Shell AG', 'Hornbach GmbH', 'ÖBB', 'METRO Cash & Carry')",
  "vendor_uid": "UID-Nummer falls sichtbar (z.B. 'ATU12345678'), sonst null",
  "date": "YYYY-MM-DD oder null",
  "gross_amount": Zahl (Gesamtbetrag/Total),
  "net_amount": Zahl (oder berechnet aus gross/(1+rate/100)),
  "vat_amount": Zahl (oder berechnet),
  "vat_rate": 20 | 13 | 10 | 0,
  "currency": "EUR",
  "category": "Material" | "Werkzeug" | "Treibstoff" | "Büro" | "Bewirtung" | "Sonstiges",
  "receipt_type": "Rechnung" | "Kassenbon" | "Quittung" | "Tankbeleg" | "Bewirtungsbeleg" | "Kartenzahlungsbeleg",
  "confidence": 0.0-1.0,
  
  "invoice_type_guess": "eingang" | "ausgang" | "unknown",
  "invoice_type_reason": "kurze Begründung (z.B. 'Kopfzeile enthält Rechnungs-Format mit Zahlungszielen', 'Kassenbon-Format = Einkauf')"
}

WICHTIG:
- Wenn nur ein Gesamtbetrag erkennbar ist (z.B. Kartenzahlungsbeleg ohne Steueraufschlüsselung): trotzdem vendor + gross_amount extrahieren, vat_rate auf 20 schätzen, net/vat berechnen, confidence niedriger.
- Erkenne ALLE Beträge im Bild (auch "Gesamtbetrag", "Total", "Summe", "EUR ..."). Nimm den höchsten plausiblen Endbetrag.
- Bei Tankstellen-Kartenbelegen: receipt_type = "Tankbeleg", category = "Treibstoff", invoice_type_guess = "eingang" (Einkauf).
- Zahlen IMMER als Number (Punkt als Dezimaltrenner, kein €).
- Niemals "null" für vendor oder gross_amount — versuche IMMER zu lesen, auch wenn unscharf. Im äußersten Notfall: vendor = "Unbekannt", confidence = 0.3.
- invoice_type_guess: Versuche zu erkennen ob es eine Eingangs-/Ausgangsrechnung ist basierend auf:
  * Rechnungs-Format (Rechnung = eher Ausgang, wenn "Kunde berechnet werden", "Zahlung bis ...")
  * Kassenbon/Tankbeleg = immer Eingang (Einkauf)
  * Quittung = neutral / material
  * Firmenwortlaut (wenn nicht selbst-bekannt, = Eingang als Lieferant)`;

// Neue Funktion: Klassifiziert basierend auf User-Company-Daten
interface InvoiceClassificationResult {
  invoice_type: "eingang" | "ausgang" | "unknown";
  is_vendor_match: boolean;
  vendor_identifier_confidence: number;
  reason: string;
}

function classifyInvoiceType(
  ocrGuess: string,
  vendor: string,
  vendorUid: string | null,
  receiptType: string,
  userCompanyName?: string,
  userCompanyUid?: string
): InvoiceClassificationResult {
  let confidence = 0.5;
  let reason = "";

  // Schritt 1: UID-Match prüfen
  if (vendorUid && userCompanyUid && vendorUid === userCompanyUid) {
    return {
      invoice_type: "ausgang",
      is_vendor_match: true,
      vendor_identifier_confidence: 0.95,
      reason: "Vendor-UID stimmt mit Unternehmens-UID überein → Ausgangsrechnung",
    };
  }

  // Schritt 2: Firmenwortlaut-Match
  if (userCompanyName && vendor.toLowerCase().includes(userCompanyName.toLowerCase())) {
    return {
      invoice_type: "ausgang",
      is_vendor_match: true,
      vendor_identifier_confidence: 0.85,
      reason: "Firmenwortlaut enthält Unternehmens-Name → Ausgangsrechnung",
    };
  }

  // Schritt 3: Receipt-Type Heuristik
  if (["Kassenbon", "Tankbeleg", "Kartenzahlungsbeleg"].includes(receiptType)) {
    return {
      invoice_type: "eingang",
      is_vendor_match: false,
      vendor_identifier_confidence: 0.7,
      reason: `${receiptType}-Format → typischer Einkaufsbeleg (Eingang)`,
    };
  }

  // Schritt 4: OCR-Guess verwenden
  if (ocrGuess === "ausgang") {
    confidence = 0.6;
    reason = "OCR erkannte Ausgangsrechnung (Rechnungs-Format, Zahlungsziele, etc.)";
  } else if (ocrGuess === "eingang") {
    confidence = 0.65;
    reason = "OCR erkannte Eingangsrechnung (Lieferanten-Beleg)";
  } else {
    confidence = 0.4;
    reason = "Klassifizierung unklar — Benutzer sollte manuell prüfen";
  }

  return {
    invoice_type: ocrGuess === "ausgang" ? "ausgang" : ocrGuess === "eingang" ? "eingang" : "unknown",
    is_vendor_match: false,
    vendor_identifier_confidence: confidence,
    reason,
  };
}

async function callClaudeVision(imageUrl: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Demo-Fallback
    return {
      vendor: "Demo-Lieferant GmbH",
      vendor_uid: null,
      date: new Date().toISOString().slice(0, 10),
      gross_amount: 247.5,
      net_amount: 206.25,
      vat_amount: 41.25,
      vat_rate: 20,
      currency: "EUR",
      category: "Material",
      receipt_type: "Rechnung",
      invoice_type_guess: "eingang",
      invoice_type_reason: "Demo-Modus",
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
      max_tokens: 1200,
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
    let userCompanyName: string | undefined;
    let userCompanyUid: string | undefined;

    if (ct.includes("application/json")) {
      const body = await req.json();
      imageUrl = body.imageUrl || "";
      userCompanyName = body.userCompanyName;
      userCompanyUid = body.userCompanyUid;
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      userCompanyName = (form.get("userCompanyName") as string) || undefined;
      userCompanyUid = (form.get("userCompanyUid") as string) || undefined;
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        const b64 = buf.toString("base64");
        imageUrl = `data:${file.type};base64,${b64}`;
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl oder file fehlt" }, { status: 400 });
    }

    const ocrResult = await callClaudeVision(imageUrl);

    if (ocrResult._error) {
      return NextResponse.json(ocrResult, { status: 500 });
    }

    // Klassifizierung: Eingangs- vs. Ausgangsrechnung
    const classification = classifyInvoiceType(
      ocrResult.invoice_type_guess || "unknown",
      ocrResult.vendor || "Unbekannt",
      ocrResult.vendor_uid || null,
      ocrResult.receipt_type || "Quittung",
      userCompanyName,
      userCompanyUid
    );

    return NextResponse.json({
      ...ocrResult,
      invoice_type: classification.invoice_type,
      is_vendor_match: classification.is_vendor_match,
      vendor_identifier_confidence: classification.vendor_identifier_confidence,
      classification_reason: classification.reason,
    });
  } catch (e) {
    return NextResponse.json({ _error: (e as Error).message, vendor: null }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST { imageUrl, userCompanyName?, userCompanyUid? } oder multipart file",
    ai_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
