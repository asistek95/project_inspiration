import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, ocrSemaphore } from "@/lib/rate-limit";

// OCR-Endpoint: Beleg-Bild (URL) → strukturierte Daten via Claude Vision
// Wird vom WhatsApp-Webhook UND vom Upload-Frontend genutzt.
//
// Input:  { imageUrl: string, userCompanyName?: string, userCompanyUid?: string }  oder  multipart/form-data mit "file"
// Output: { vendor, date, gross_amount, net_amount, vat_amount, vat_rate, category, receipt_type, 
//           invoice_type, vendor_uid, vendor_identifier_confidence, raw_text }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Österreichisches Steuerrecht — vollständige Fallabdeckung (UStG 1994)
const OCR_PROMPT = `Du bist ein österreichischer Steuerexperte und Beleg-OCR.
Analysiere den Beleg VOLLSTÄNDIG (Kopf + Mitte + Fußzeile + alle Seiten).

Gib NUR dieses JSON zurück — kein Markdown, kein Text davor/danach:
{
  "vendor": "Firmenname des AUSSTELLERS (Briefkopf oben, z.B. 'Infocom GmbH', 'GitHub Inc.', 'Shell Austria GmbH')",
  "vendor_uid": "ATU/UID des AUSSTELLERS (z.B. 'ATU70447037'), null wenn nicht vorhanden",
  "customer_uid": "ATU/UID des EMPFÄNGERS falls sichtbar (z.B. 'ATU66952069'), null wenn nicht vorhanden",
  "invoice_number": "Rechnungsnummer (z.B. 'HR260145', 'INV135863718', 'RE-2026-047'), null wenn nicht vorhanden",
  "date": "Rechnungsdatum YYYY-MM-DD, null wenn nicht lesbar",
  "due_date": "Fälligkeitsdatum YYYY-MM-DD, null wenn nicht vorhanden",
  "period": "Leistungszeitraum als Text (z.B. 'Mai 2026', '01.05-31.05.2026'), null wenn nicht vorhanden",
  "gross_amount": Bruttobetrag als Zahl (Dezimalpunkt, kein €, z.B. 964.73),
  "net_amount": Nettobetrag als Zahl,
  "vat_amount": USt-Betrag als Zahl (0 bei Reverse Charge / steuerfreien Umsätzen),
  "vat_rate": 20 | 13 | 10 | 0,
  "currency": "EUR" | "USD" | "GBP" | "CHF",
  "vat_treatment": siehe PFLICHTFELD unten,
  "reverse_charge": true | false,
  "reverse_charge_law": "§19 Abs 1a UStG 1994" | "§19 Abs 1 UStG (sonstige Leistungen EU)" | "Art 196 MwStSystRL" | null,
  "eu_country": "AT" | "DE" | "IT" | "HU" | "SK" | ... | null (nur bei EU-Rechnungen),
  "category": "Personal/Lohn" | "Wareneinkauf" | "Werkzeug/Material" | "Treibstoff/KFZ" | "Bürobedarf" | "Software/IT" | "Bewirtung" | "Versicherung" | "Miete/Leasing" | "Werbung/Marketing" | "Reise/Diäten" | "Bau/Instandhaltung" | "Sonstiges",
  "receipt_type": "Rechnung" | "Kleinbetragsrechnung" | "Kassenbon" | "Tankbeleg" | "Bewirtungsbeleg" | "Kartenzahlungsbeleg" | "Anzahlungsrechnung" | "Schlussrechnung" | "Gutschrift" | "Storno" | "Lohnabrechnung" | "Lieferschein",
  "is_kleinbetrag": true wenn Brutto ≤ 400€ und vereinfachte Rechnung,
  "iban": "IBAN des Ausstellers für Zahlung, null wenn nicht vorhanden",
  "payment_method_hint": "bar" | "überweisung" | "karte" | "lastschrift" | null,
  "invoice_type_guess": "eingang" | "ausgang",
  "invoice_type_reason": "1 klarer Satz warum",
  "confidence": 0.0-1.0,
  "warnings": ["Array mit Hinweisen, leer wenn keine Besonderheiten"]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PFLICHTFELD vat_treatment — JEDEN FALL KORREKT ZUORDNEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"normal_20"        → Österreichische Standardrechnung, 20% USt
                     Erkennbar: österr. Firma, USt-Ausweis 20%, normaler Geschäftsfall
                     Beispiel: Würth-Rechnung, Hornbach-Kassenbon, ÖBB-Ticket

"normal_13"        → 13% USt (Kultur, Beherbergung, Wein ab Hof, Sportveranstaltungen)
                     Erkennbar: Hotel, Weingut, Theater, Freibad, Museum

"normal_10"        → 10% USt (Lebensmittel, Bücher, Zeitungen, Arzneimittel, ÖPNV intern.)
                     Erkennbar: Supermarkt, Buchhandlung, Arztbedarf, Wiener Linien

"reverse_charge_§19_bauleistung"
                   → §19 Abs 1a UStG 1994: Bauleistungen im Inland
                     Erkennbar: "Steuerschuld geht auf Leistungsempfänger über",
                     "§19 Abs 1a", "0,00 % UST", Bauarbeiten, Montage, Instandhaltung,
                     Sanierung, Malerarbeiten, Elektriker, Klempner, Subunternehmer
                     → vat_amount = 0, reverse_charge = true

"reverse_charge_§19_sonstige"
                   → §19 Abs 1 UStG: sonstige Leistungen von EU-Unternehmer an AT-Unternehmer
                     Erkennbar: EU-Firma stellt Rechnung an AT-Firma, keine USt ausgewiesen,
                     Hinweis auf "Reverse Charge", "Tax liability transfers to recipient"
                     Typisch: Software-Abos (GitHub, Adobe, Google, Microsoft aus EU)
                     → vat_amount = 0, reverse_charge = true

"reverse_charge_drittland"
                   → Dienstleistung aus Nicht-EU-Land an AT-Unternehmer (§19 Abs 1 i.V.m. §3a)
                     Erkennbar: US/UK/CH Firma, keine USt, B2B-Dienstleistung
                     Typisch: GitHub (USA), AWS (USA), Stripe, diverse US-SaaS
                     → vat_amount = 0, reverse_charge = true, currency oft USD

"ig_lieferung"     → Innergemeinschaftliche Lieferung (§6 Abs 1 Z 6 UStG) — AUSGANGSFALL
                     Aussteller liefert Ware in EU-Mitgliedsstaat, 0% AT-USt
                     Erkennbar: AT-Firma liefert an EU-Firma mit UID, "steuerfreie IGL"

"ig_erwerb"        → Innergemeinschaftlicher Erwerb (§1 Abs 1 Z 1 UStG) — EINGANGSFALL
                     AT-Firma kauft Ware von EU-Firma, Erwerbsteuer in AT
                     Erkennbar: EU-Firma ohne AT-USt-Ausweis, UID des EU-Lieferanten sichtbar
                     → vat_amount = 0 auf Rechnung, aber Eigenberechnung durch Empfänger

"export_drittland" → Ausfuhr in Drittland, steuerfrei (§7 UStG)
                     Erkennbar: Empfänger außerhalb EU, "steuerfreie Ausfuhr", 0% USt

"steuerfrei_§6"    → Steuerfreie Umsätze ohne Vorsteuerabzug (§6 UStG)
                     Erkennbar: Versicherungsprämien, Bankgebühren, Arztleistungen,
                     Pflegeleistungen, Grundstücksverkauf — KEIN Vorsteuerabzug möglich!
                     Hinweis: warnings hinzufügen "Kein Vorsteuerabzug möglich (§6 UStG)"

"eust_import"      → Einfuhrumsatzsteuer — Import aus Drittland über Zoll
                     Erkennbar: Zollbescheid, Speditionsrechnung mit EUSt, "Einfuhrumsatzsteuer"

"pauschalierung"   → Land-/Forstwirtschaft §22 UStG oder Reiseleistungen §23 UStG
                     Sehr selten, nur wenn explizit erwähnt

"unknown"          → Kann nicht sicher zugeordnet werden → confidence < 0.6 setzen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EINGANG vs. AUSGANG — PERSPEKTIVE DES HOCHLADENDEN UNTERNEHMERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EINGANG (invoice_type_guess = "eingang"):
→ Eine ANDERE Firma hat uns diese Rechnung gestellt
→ WIR stehen im "An:"-Feld / "Empfänger" / "BILL TO"
→ Wir müssen ZAHLEN
→ Vorsteuerabzug ggf. möglich (außer bei §6, Bewirtung 50%, KFZ-Beschränkungen)
→ Typisch: Lieferantenrechnung, Kassenbon, Tankbeleg, Software-Abo, Subunternehmer
→ Beispiele: GitHub→ uns, Infocom→ PKE FM, Shell-Tankbeleg, Würth-Rechnung

AUSGANG (invoice_type_guess = "ausgang"):
→ UNSERE Firma hat diese Rechnung an einen Kunden gestellt
→ Unser Logo/Name steht im Briefkopf als Aussteller
→ Wir EMPFANGEN den Zahlungseingang
→ USt schulden wir dem Finanzamt (außer Reverse Charge, Steuerfrei)
→ Typisch: Rechnung an Kunden, Ausgangslieferung

ENTSCHEIDUNGSLOGIK:
1. ATU/UID des Ausstellers = user_company_uid → AUSGANG (unsere Rechnung)
2. Firmenname Aussteller = user_company_name → AUSGANG
3. Kassenbon / Tankbeleg / Kartenzahlungsbeleg → immer EINGANG (Einkauf)
4. Aussteller ist erkennbar eine fremde Firma → EINGANG
5. Im Zweifel → EINGANG (häufigerer Fall)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÖSTERREICHISCHE STEUERBESONDERHEITEN FÜR warnings[]:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Bewirtung: "Bewirtungsaufwand nur 50% abzugsfähig (§20 Abs 1 Z 3 EStG)"
→ PKW/Kombi: "Vorsteuer für PKW/Kombi nicht abzugsfähig — außer Ausnahmen (§12 Abs 2 Z 2 UStG)"
→ Reverse Charge §19: "Eigenberechnung erforderlich — USt in UVA KZ 057 und Vorsteuer KZ 066"
→ IG-Erwerb: "Erwerbsteuer in UVA erfassen — KZ 070 und ggf. Vorsteuer KZ 065"
→ Fehlende Pflichtangaben Vollrechnung (>400€): "Rechnungsnummer fehlt" / "ATU des Ausstellers fehlt"
→ Steuerfrei §6: "Kein Vorsteuerabzug möglich"
→ USD/Fremdwährung: "Umrechnung in EUR zum Tageskurs erforderlich (§20 UStG)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BETRAGSREGELN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Dezimalpunkt verwenden (964.73 nicht 964,73)
- Bei Reverse Charge: net_amount = gross_amount, vat_amount = 0
- Bei Kleinbetragsrechnung (≤400€ brutto): is_kleinbetrag = true, vereinfachte Pflichtangaben OK
- Bei Kassenbon ohne Steueraufschlüsselung: vat_rate nach Branche schätzen, confidence senken
- Niemals null für vendor oder gross_amount — Notfall: vendor = "Unbekannt", confidence = 0.2
- Mehrseitige PDFs: Rechnungsdaten von Seite 1, IBAN von letzter Seite`;


// Neue Funktion: Klassifiziert basierend auf User-Company-Daten
interface InvoiceClassificationResult {
  invoice_type: "eingang" | "ausgang" | "unknown";
  is_vendor_match: boolean;
  vendor_identifier_confidence: number;
  reason: string;
}

function normalizeUid(uid: string): string {
  return uid.replace(/\s/g, "").toUpperCase();
}

function classifyInvoiceType(
  ocrGuess: string,
  vendor: string,
  vendorUid: string | null,
  customerUid: string | null,
  receiptType: string,
  userCompanyName?: string,
  userCompanyUid?: string
): InvoiceClassificationResult {

  const userUid = userCompanyUid ? normalizeUid(userCompanyUid) : null;

  // ══ STUFE 1: ATU-Match — 100% sicher, keine Annahmen ══
  // Vendor-UID = unsere ATU → WIR haben die Rechnung ausgestellt → AUSGANG
  if (userUid && vendorUid && normalizeUid(vendorUid) === userUid) {
    return {
      invoice_type: "ausgang",
      is_vendor_match: true,
      vendor_identifier_confidence: 0.99,
      reason: `Aussteller-ATU (${vendorUid}) = Unternehmens-ATU → Ausgangsrechnung`,
    };
  }

  // Customer-UID = unsere ATU → WIR sind der Empfänger → EINGANG
  if (userUid && customerUid && normalizeUid(customerUid) === userUid) {
    return {
      invoice_type: "eingang",
      is_vendor_match: false,
      vendor_identifier_confidence: 0.99,
      reason: `Empfänger-ATU (${customerUid}) = Unternehmens-ATU → Eingangsrechnung`,
    };
  }

  // ══ STUFE 2: Firmenwortlaut-Match ══
  if (userCompanyName && userCompanyName.length >= 3) {
    const vendorLower = vendor.toLowerCase();
    const nameLower = userCompanyName.toLowerCase();
    // Ersten signifikanten Teil des Firmennamens nehmen (vor GmbH/KG/OG etc.)
    const nameCore = nameLower.replace(/\s*(gmbh|kg|og|ag|eg|nfg|gbr|ug|se|inc|ltd|llc)\.?\s*$/i, "").trim();
    if (nameCore.length >= 3 && vendorLower.includes(nameCore)) {
      return {
        invoice_type: "ausgang",
        is_vendor_match: true,
        vendor_identifier_confidence: 0.88,
        reason: `Firmenname "${userCompanyName}" im Briefkopf erkannt → Ausgangsrechnung`,
      };
    }
  }

  // ══ STUFE 3: Belegart-Heuristik (unabhängig von Firma) ══
  // Kassenbons, Tankbelege etc. sind IMMER Eingang (eigener Einkauf)
  if (["Kassenbon", "Tankbeleg", "Kartenzahlungsbeleg"].includes(receiptType)) {
    return {
      invoice_type: "eingang",
      is_vendor_match: false,
      vendor_identifier_confidence: 0.90,
      reason: `${receiptType} → immer Einkaufsbeleg (Eingang)`,
    };
  }

  // ══ STUFE 4: OCR-Guess — niedrige Konfidenz, Benutzer muss prüfen ══
  if (!userUid && !userCompanyName) {
    // KEIN Firmenprofil hinterlegt → kann nicht automatisch entscheiden
    return {
      invoice_type: "unknown",
      is_vendor_match: false,
      vendor_identifier_confidence: 0.0,
      reason: "ATU-Nummer nicht in Einstellungen hinterlegt — Eingang/Ausgang bitte manuell prüfen",
    };
  }

  // Mit Firmenprofil aber kein Match → OCR-Guess mit niedrigerer Konfidenz
  if (ocrGuess === "ausgang") {
    return { invoice_type: "ausgang", is_vendor_match: false, vendor_identifier_confidence: 0.60,
      reason: "OCR-Indizien: Rechnungsnummer + Kundennummer + Zahlungsziel — bitte prüfen" };
  }
  if (ocrGuess === "eingang") {
    return { invoice_type: "eingang", is_vendor_match: false, vendor_identifier_confidence: 0.60,
      reason: "OCR-Indizien: Lieferantenbeleg, Zahlungsaufforderung — bitte prüfen" };
  }

  return {
    invoice_type: "unknown",
    is_vendor_match: false,
    vendor_identifier_confidence: 0.0,
    reason: "Konnte Eingang/Ausgang nicht bestimmen — bitte manuell prüfen",
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

  // Bild/PDF als Base64 — PDFs als "document", Bilder als "image"
  let imageBlock: any;
  if (imageUrl.startsWith("data:")) {
    const [, mediaType, base64] = imageUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    if (mediaType === "application/pdf") {
      // Claude 3.5+ unterstützt PDFs nativ als document-Block
      imageBlock = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      };
    } else {
      imageBlock = {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      };
    }
  } else {
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
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2000,
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
  // Rate-Limit prüfen: 20 Requests / 60 s pro IP (Sliding Window)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`ocr:${ip}`, 20, 60_000);
  if (!rl.ok) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Rate-Limit erreicht — bitte in ${retryAfterSec}s erneut versuchen.`, code: "RATE_LIMIT" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + rl.retryAfterMs),
        },
      }
    );
  }

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

    // Semaphore: max 6 gleichzeitige Claude-Aufrufe (ThreadPoolExecutor-Äquivalent)
    const ocrResult = await ocrSemaphore.run(() => callClaudeVision(imageUrl));

    if (ocrResult._error) {
      return NextResponse.json(ocrResult, { status: 500 });
    }

    // Klassifizierung: Eingangs- vs. Ausgangsrechnung
    // Zusatz: Wenn customer_uid mit userCompanyUid übereinstimmt → definitiv Eingang
    const isCustomerMatch =
      ocrResult.customer_uid && userCompanyUid &&
      ocrResult.customer_uid.replace(/\s/g, "") === userCompanyUid.replace(/\s/g, "");

    const classification = classifyInvoiceType(
      ocrResult.invoice_type_guess || "unknown",
      ocrResult.vendor || "Unbekannt",
      ocrResult.vendor_uid || null,
      ocrResult.customer_uid || null,
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
