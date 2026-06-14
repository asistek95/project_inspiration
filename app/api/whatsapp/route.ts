import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Twilio WhatsApp Webhook — unified Eingang
 *
 * Flow für ALLE eingehenden Nachrichten:
 *   1. Absender identifizieren (eigener User oder Kollege?)
 *   2. OCR ausführen falls Foto/PDF vorhanden
 *   3. In whatsapp_messages speichern (mit OCR-Daten)
 *   4. Auto-Import NUR wenn eigener User (und Foto lesbar)
 *   5. TwiML-Bestätigung zurückschicken
 *
 * Kollegen-Szenarien:
 *   A) Kollege ist registriertes Team-Mitglied → message unter company_id (Inhaber) speichern
 *   B) Kollege ist kein Klarblick-User → message mit user_id=null → Inhaber sieht es nicht (Kollege muss sich registrieren)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Twilio Signatur-Validierung ───────────────────────────────────────────────

function validateTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const sortedKeys = Object.keys(params).sort();
  let toSign = url;
  for (const key of sortedKeys) toSign += key + (params[key] ?? "");
  const expected = createHmac("sha1", authToken).update(toSign).digest("base64");
  return expected === twilioSignature;
}

// ── Twilio Media laden ────────────────────────────────────────────────────────

async function fetchMediaAsDataUrl(
  mediaUrl: string
): Promise<{ dataUrl: string; mediaType: string } | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(mediaUrl, { headers: { authorization: `Basic ${auth}` } });
    if (!res.ok) return null;
    const mediaType = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return { dataUrl: `data:${mediaType};base64,${buf.toString("base64")}`, mediaType };
  } catch {
    return null;
  }
}

// ── OCR via Claude Vision ─────────────────────────────────────────────────────

async function runOcr(
  imageDataUrl: string,
  companyName?: string,
  atuNummer?: string
): Promise<any | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const [, mediaType, base64] = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
    const mediaBlock =
      mediaType === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              mediaBlock,
              {
                type: "text",
                text: `Extrahiere als JSON (nur JSON, kein Markdown):
{"vendor":"Lieferantenname","date":"YYYY-MM-DD","gross_amount":0.00,"net_amount":0.00,"vat_amount":0.00,"vat_rate":20,"currency":"EUR","category":"Material|Treibstoff|Bürobedarf|Software/IT|Bewirtung|Sonstiges","invoice_type":"eingang|ausgang","receipt_type":"Rechnung|Kassenbon|Tankbeleg|Sonstiges","warnings":[]}
${companyName ? `Firmenkunde (Empfänger): ${companyName}` : ""}
${atuNummer ? `ATU: ${atuNummer}` : ""}`,
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// ── User + Firma aus Telefonnummer auflösen ───────────────────────────────────

interface ResolvedSender {
  userId: string;          // Unter welchem User_id die Daten gespeichert werden
  companyName: string;
  atuNummer: string | null;
  isOwn: boolean;          // true = eigene Nummer des Inhabers
}

async function resolveSender(phone: string): Promise<ResolvedSender | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Eigener Inhaber?
  const { data: ownProfile } = await sb
    .from("profiles")
    .select("id, company_name, atu_nummer")
    .eq("whatsapp_phone", phone)
    .maybeSingle();

  if (ownProfile) {
    return {
      userId: ownProfile.id,
      companyName: ownProfile.company_name,
      atuNummer: ownProfile.atu_nummer,
      isOwn: true,
    };
  }

  // Kollege / Team-Mitglied? → schaue in profiles nach und finde team_members-Eintrag
  const { data: memberProfile } = await sb
    .from("profiles")
    .select("id, company_name, atu_nummer")
    .eq("whatsapp_phone", phone)
    .maybeSingle();

  if (memberProfile) {
    // Finde Firma des Mitglieds
    const { data: membership } = await sb
      .from("team_members")
      .select("company_id")
      .eq("member_id", memberProfile.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      // Lade Firmen-Profil des Inhabers
      const { data: ownerProfile } = await sb
        .from("profiles")
        .select("id, company_name, atu_nummer")
        .eq("id", membership.company_id)
        .maybeSingle();

      if (ownerProfile) {
        return {
          userId: ownerProfile.id,      // Gespeichert unter Inhaber
          companyName: ownerProfile.company_name,
          atuNummer: ownerProfile.atu_nummer,
          isOwn: false,                 // Kam von Kollege
        };
      }
    }
  }

  return null;
}

// ── Receipt erstellen ─────────────────────────────────────────────────────────

async function createReceipt(
  userId: string,
  ocr: any,
  senderPhone: string,
  fromName?: string
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const gross = parseFloat(ocr.gross_amount) || 0;
  const vatRate = ocr.vat_rate || 20;
  const net = Math.round((gross / (1 + vatRate / 100)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;

  const note = fromName
    ? `Via WhatsApp von ${fromName} (${senderPhone})`
    : `Via WhatsApp (${senderPhone})`;

  const { data, error } = await sb
    .from("receipts")
    .insert({
      user_id: userId,
      supplier_name: ocr.vendor || "Unbekannt",
      receipt_date: ocr.date || new Date().toISOString().slice(0, 10),
      category: ocr.category || "Sonstiges",
      receipt_type: ocr.receipt_type || "Kassenbon",
      gross_amount: gross,
      net_amount: net,
      vat_amount: vat,
      currency: ocr.currency || "EUR",
      invoice_type: ocr.invoice_type || "eingang",
      confidence_score: 0.75,
      status: "ungeprueft",
      warnings: ocr.warnings || [],
      notes: note,
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id as string;
}

// ── WhatsApp-Message loggen ───────────────────────────────────────────────────

async function logMessage(opts: {
  userId: string | null;
  senderPhone: string;
  senderName?: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string;
  ocr?: any;
  status: "pending" | "imported" | "failed" | "no_media";
  receiptId?: string | null;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data } = await sb
    .from("whatsapp_messages")
    .insert({
      user_id: opts.userId,
      sender_phone: opts.senderPhone,
      sender_name: opts.senderName ?? null,
      direction: "inbound",
      body: opts.body ?? null,
      media_url: opts.mediaUrl ?? null,
      media_type: opts.mediaType ?? null,
      ocr_data: opts.ocr ?? null,
      status: opts.status,
      receipt_id: opts.receiptId ?? null,
    })
    .select("id")
    .maybeSingle();

  return data?.id ?? null;
}

// ── TwiML ─────────────────────────────────────────────────────────────────────

function twiml(message: string): string {
  const esc = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`;
}

// ── Claude Text-Antwort ───────────────────────────────────────────────────────

async function askClaude(text: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Schick mir ein Foto deines Belegs — ich kümmere mich darum!";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 250,
        system:
          "Du bist Klarblick, ein WhatsApp-Assistent für Belegverwaltung. Antworte sehr kurz (max 2 Sätze), auf Deutsch.",
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!res.ok) return "Kurze Störung — bitte nochmal versuchen.";
    const data = await res.json();
    return data?.content?.[0]?.text ?? "OK.";
  } catch {
    return "Verbindungsfehler.";
  }
}

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Twilio Signatur-Validierung
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (authToken) {
      const sig = req.headers.get("x-twilio-signature") ?? "";
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("host") ?? "";
      const url = `${proto}://${host}/api/whatsapp`;

      const cloned = req.clone();
      const rawBody = await cloned.text();
      const params: Record<string, string> = {};
      for (const [k, v] of new URLSearchParams(rawBody)) params[k] = v;

      if (!validateTwilioSignature(authToken, sig, url, params)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const form = await req.formData();
    const fromRaw = String(form.get("From") || "");
    const profileName = String(form.get("ProfileName") || "");
    const body = String(form.get("Body") || "");
    const numMedia = Number(form.get("NumMedia") || 0);
    const mediaUrl = numMedia > 0 ? String(form.get("MediaUrl0") || "") : "";
    const mediaContentType = numMedia > 0 ? String(form.get("MediaContentType0") || "") : "";

    // Telefonnummer normalisieren
    const senderPhone = fromRaw.replace(/^whatsapp:/i, "").trim();

    // Sender identifizieren (Inhaber oder Kollege?)
    const sender = await resolveSender(senderPhone);

    let reply: string;

    if (!sender) {
      // Unbekannte Nummer — Message loggen, User informieren
      await logMessage({
        userId: null,
        senderPhone,
        senderName: profileName || undefined,
        body,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaContentType || undefined,
        status: "failed",
      });
      reply = `Hallo ${profileName || ""}! Diese Nummer ist noch nicht mit Klarblick verknüpft.\n\nBitte registriere dich unter https://app.klarblick.at/register und verifiziere deine Nummer in Einstellungen → WhatsApp.`;
    } else if (mediaUrl) {
      // Foto/PDF empfangen → OCR
      const media = await fetchMediaAsDataUrl(mediaUrl);
      const ocr = media
        ? await runOcr(media.dataUrl, sender.companyName, sender.atuNummer ?? undefined)
        : null;

      if (ocr && ocr.vendor && ocr.gross_amount) {
        let receiptId: string | null = null;
        let importStatus: "pending" | "imported" = "pending";

        if (sender.isOwn) {
          // Eigener Beleg → direkt importieren
          receiptId = await createReceipt(sender.userId, ocr, senderPhone, profileName || undefined);
          importStatus = receiptId ? "imported" : "pending";
        }
        // Kollegen-Beleg → pending (Inhaber importiert manuell in Eingang)

        await logMessage({
          userId: sender.userId,
          senderPhone,
          senderName: profileName || undefined,
          body,
          mediaUrl,
          mediaType: mediaContentType,
          ocr,
          status: importStatus,
          receiptId,
        });

        const amount = `${Number(ocr.gross_amount).toFixed(2)} €`;
        if (sender.isOwn && receiptId) {
          reply = `✅ Beleg gespeichert!\n• ${ocr.vendor}\n• ${amount}\n• ${ocr.date || "Datum?"}\n• ${ocr.category}`;
        } else {
          reply = `📋 Beleg erkannt!\n• ${ocr.vendor} · ${amount}\nEr erscheint im Klarblick-Eingang zur Freigabe.`;
        }
      } else {
        // OCR fehlgeschlagen → als pending speichern (User kann manuell importieren)
        await logMessage({
          userId: sender.userId,
          senderPhone,
          senderName: profileName || undefined,
          body,
          mediaUrl,
          mediaType: mediaContentType,
          ocr: null,
          status: "failed",
        });
        reply = "📸 Foto empfangen, Beleg konnte nicht ausgelesen werden. Bitte deutlicheres Foto schicken oder in der App manuell erfassen.";
      }
    } else {
      // Text-Nachricht
      await logMessage({
        userId: sender.userId,
        senderPhone,
        senderName: profileName || undefined,
        body,
        status: "no_media",
      });
      reply = await askClaude(body || "(leere Nachricht)");
    }

    return new NextResponse(twiml(reply), {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  } catch (e) {
    console.error("[whatsapp] Fehler:", e);
    return new NextResponse(
      twiml("Kurze Störung. Bitte in einer Minute nochmal versuchen."),
      { status: 200, headers: { "content-type": "text/xml" } }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    webhook: "POST /api/whatsapp",
    twilio: !!process.env.TWILIO_ACCOUNT_SID,
    ai: !!process.env.ANTHROPIC_API_KEY,
    admin: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
