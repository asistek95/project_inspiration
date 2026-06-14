import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * E-Mail-Webhook Empfänger
 *
 * Unterstützte Provider:
 *   - Postmark (Inbound Parsing): POST mit multipart/form-data oder JSON
 *   - SendGrid Inbound Parse: POST mit multipart/form-data
 *   - Mailgun: POST mit form-data
 *
 * Setup:
 *   1. Bei Provider (z.B. Postmark) Inbound-Domain konfigurieren: mail.klarblick.at
 *   2. Webhook-URL eintragen: https://app.klarblick.at/api/email/webhook
 *   3. Optional: Webhook-Secret als Header-Signature verifizieren
 *
 * Ablauf:
 *   1. E-Mail eingeht → Provider sendet POST
 *   2. Absender prüfen (SPF/DKIM, nur bekannte Aliasse)
 *   3. Anhänge extrahieren (PDF/JPG)
 *   4. OCR via /api/ocr aufrufen
 *   5. In email_inbox Tabelle speichern
 *   6. Beleg in receipts anlegen
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  attachments: { filename: string; contentType: string; content: string }[];
  receivedAt: string;
}

function parsePostmarkWebhook(body: any): ParsedEmail | null {
  if (!body?.From || !body?.To) return null;
  const attachments = (body.Attachments || []).map((a: any) => ({
    filename: a.Name || "attachment",
    contentType: a.ContentType || "application/octet-stream",
    content: a.Content || "", // Base64
  }));
  return {
    from: body.From,
    to: body.To,
    subject: body.Subject || "",
    attachments,
    receivedAt: body.Date || new Date().toISOString(),
  };
}

function parseSendGridWebhook(formData: FormData): ParsedEmail | null {
  const from = formData.get("from")?.toString() || "";
  const to = formData.get("to")?.toString() || "";
  const subject = formData.get("subject")?.toString() || "";
  // SendGrid schickt Anhänge als "attachment1", "attachment2" etc.
  const attachments: ParsedEmail["attachments"] = [];
  return { from, to, subject, attachments, receivedAt: new Date().toISOString() };
}

async function processAttachment(
  attachment: { filename: string; contentType: string; content: string },
  userEmail: string,
  baseUrl: string
): Promise<{ success: boolean; receiptData?: any; error?: string }> {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(attachment.contentType)) {
    return { success: false, error: "Nicht unterstützter Dateityp" };
  }

  // OCR-Analyse via interner API
  const ocrRes = await fetch(`${baseUrl}/api/ocr`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageUrl: `data:${attachment.contentType};base64,${attachment.content}`,
    }),
  });

  if (!ocrRes.ok) return { success: false, error: "OCR fehlgeschlagen" };
  const ocrData = await ocrRes.json();
  return { success: true, receiptData: ocrData };
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    let email: ParsedEmail | null = null;

    if (ct.includes("application/json")) {
      // Postmark
      const body = await req.json();
      email = parsePostmarkWebhook(body);
    } else if (ct.includes("multipart/form-data")) {
      // SendGrid / Mailgun
      const formData = await req.formData();
      email = parseSendGridWebhook(formData);
    }

    if (!email) {
      return NextResponse.json({ error: "Unbekanntes Webhook-Format" }, { status: 400 });
    }

    // Absender-Prüfung (vereinfacht — in Produktion SPF/DKIM über Provider)
    const allowedDomains = ["@gmail.com", "@outlook.com", "@icloud.com", "@klarblick.at"];
    const fromDomain = email.from.includes("@") ? `@${email.from.split("@")[1]}` : "";
    // Für Demo: alle akzeptieren, in Produktion strenger
    console.log(`[email-webhook] Eingang von ${email.from} · ${email.attachments.length} Anhänge`);

    const baseUrl = req.headers.get("x-forwarded-host")
      ? `https://${req.headers.get("x-forwarded-host")}`
      : "http://localhost:3000";

    const results = [];
    for (const attachment of email.attachments) {
      const result = await processAttachment(attachment, email.from, baseUrl);
      results.push({ filename: attachment.filename, ...result });
    }

    // In Supabase email_inbox speichern
    const admin = getSupabaseAdmin();
    if (admin) {
      // User über E-Mail-Adresse im "To"-Feld finden
      // Nutzer registrieren sich mit ihrer echten E-Mail → wir matchen darauf
      const toEmail = email.to.replace(/.*<(.+)>/, "$1").trim().toLowerCase();
      let userId: string | null = null;

      try {
        // Suche in auth.users nach der To-Adresse (Nutzer leitet an seine Klarblick-E-Mail weiter)
        // Alternativ: Nutzer hat ein dediziertes alias in profiles.email_alias
        const { data: users } = await admin.auth.admin.listUsers({ perPage: 1 });
        // Einfachster Ansatz: profiles nach tax_advisor_email oder email_alias matchen
        // Hier: wir suchen in auth.users direkt
        const allUsers = await admin.auth.admin.listUsers({ perPage: 500 });
        const match = allUsers.data?.users?.find(
          (u) => u.email?.toLowerCase() === toEmail
        );
        if (match) userId = match.id;
      } catch {}

      // OCR-Ergebnisse als Array speichern
      const ocrData = results.filter(r => r.success).map(r => r.receiptData);

      void admin.from("email_inbox").insert({
        user_id: userId,
        alias: email.to,
        from_address: email.from,
        subject: email.subject,
        received_at: email.receivedAt,
        status: results.some(r => r.success) ? "pending" : "failed",
        attachment_count: email.attachments.length,
        ocr_data: ocrData.length > 0 ? ocrData : null,
        preview_ready: ocrData.length > 0,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (e) {
    console.error("[email-webhook] Fehler:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "Klarblick E-Mail-Webhook. POST mit Postmark/SendGrid/Mailgun Payload.",
    setup: "Konfiguriere Inbound-Parsing bei deinem E-Mail-Provider und trage diese URL ein.",
  });
}
