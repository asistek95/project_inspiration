import { NextRequest, NextResponse } from "next/server";

/**
 * Gmail Push Notifications via Google Pub/Sub
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EMPFEHLUNG FÜR MVP: Nutze stattdessen Postmark/Mailgun Inbound (einfacher!)
 *   → /api/email/webhook  unterstützt bereits Postmark, SendGrid, Mailgun
 *   → Nur DNS MX-Record nötig, kein Google Cloud Setup
 *
 * Gmail Push ist sinnvoll wenn:
 *   - User ihre bestehende Gmail-Adresse direkt koppeln sollen (OAuth)
 *   - Keine extra Inbox-Adresse einrichten wollen
 *   - Near-realtime Push statt Weiterleitung gewünscht
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Setup (wenn Gmail Push genutzt werden soll):
 *
 * 1. Google Cloud Project erstellen: https://console.cloud.google.com
 * 2. Gmail API aktivieren
 * 3. OAuth 2.0 Client ID erstellen (Web-App, Redirect: /api/auth/google/callback)
 * 4. Pub/Sub Topic anlegen: gcloud pubsub topics create beleg-pilot-gmail
 * 5. Pub/Sub Subscription mit Push-Endpoint: https://app.klarblick.at/api/email/gmail-push
 * 6. Gmail-Service-Account Pub/Sub Publisher-Berechtigung geben:
 *    gcloud pubsub topics add-iam-policy-binding beleg-pilot-gmail \
 *      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
 *      --role=roles/pubsub.publisher
 * 7. Nach OAuth-Login: gmail.users.watch() aufrufen mit topicName
 *
 * ENV-Variablen (in .env.local):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_PUBSUB_TOPIC
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_KEY  (Base64-kodierter JSON-Key)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PubSubMessage {
  message: {
    data: string;   // Base64-kodiert
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface GmailNotification {
  emailAddress: string;
  historyId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: Pub/Sub Authentifizierung prüfen
  // Google sendet einen Bearer-Token im Authorization-Header
  // Den OIDC-Token verifizieren: https://cloud.google.com/pubsub/docs/push#authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Token gegen Google JWKS verifizieren
  // const token = authHeader.slice(7);
  // const payload = await verifyGoogleOidcToken(token, process.env.GOOGLE_PUBSUB_AUDIENCE!);

  let body: PubSubMessage;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Pub/Sub Nachricht decodieren
  let notification: GmailNotification;
  try {
    const decoded = Buffer.from(body.message.data, "base64").toString("utf-8");
    notification = JSON.parse(decoded);
  } catch {
    return NextResponse.json({ error: "Invalid message data" }, { status: 400 });
  }

  const { emailAddress, historyId } = notification;
  console.log(`[gmail-push] Neue Nachricht für ${emailAddress}, historyId: ${historyId}`);

  // TODO: User anhand emailAddress in Supabase nachschlagen
  // const { data: user } = await supabase
  //   .from("profiles")
  //   .select("id, google_access_token, google_refresh_token, gmail_history_id")
  //   .eq("gmail_address", emailAddress)
  //   .single();
  // if (!user) return NextResponse.json({ ok: true }); // Unbekannter User — ignorieren

  // TODO: Gmail API History laden (Änderungen seit letzter historyId)
  // const messages = await fetchNewGmailMessages(
  //   user.google_access_token,
  //   user.google_refresh_token,
  //   user.gmail_history_id,
  //   historyId
  // );

  // TODO: Anhänge extrahieren und via OCR verarbeiten
  // for (const msg of messages) {
  //   const attachments = await getGmailAttachments(msg.id, user.google_access_token);
  //   for (const att of attachments) {
  //     if (!isReceiptMimeType(att.mimeType)) continue;
  //     // Duplikat-Check via gmail_message_id
  //     const exists = await supabase
  //       .from("email_inbox")
  //       .select("id")
  //       .eq("gmail_message_id", msg.id)
  //       .single();
  //     if (exists.data) continue; // Bereits verarbeitet
  //     // OCR
  //     const ocrResult = await callOcr(att.data, att.mimeType);
  //     // In email_inbox speichern
  //     await supabase.from("email_inbox").insert({
  //       user_id: user.id,
  //       from_address: msg.from,
  //       subject: msg.subject,
  //       gmail_message_id: msg.id,
  //       attachment_count: attachments.length,
  //       ocr_data: ocrResult,
  //       status: "pending",
  //       received_at: msg.internalDate,
  //     });
  //   }
  //   // Letzte historyId aktualisieren
  //   await supabase.from("profiles")
  //     .update({ gmail_history_id: historyId })
  //     .eq("id", user.id);
  // }

  // Pub/Sub erwartet 200 OK zum Bestätigen
  return NextResponse.json({ ok: true });
}

/**
 * ALTERNATIVE (empfohlen für MVP): Postmark Inbound
 *
 * Statt Gmail OAuth/Pub/Sub einfach:
 * 1. User richtet Gmail-Weiterleitung an belege@klarblick.at ein
 *    (Gmail → Einstellungen → Weiterleitung und POP/IMAP → Weiterleitungsadresse hinzufügen)
 * 2. Postmark empfängt die Mails und sendet POST an /api/email/webhook
 * 3. Fertig — kein Google Cloud Setup, kein OAuth
 *
 * Vorteile: Einfacher, stabiler, keine Google-Abhängigkeit, sofort live
 * Nachteile: User muss Weiterleitung einrichten (einmalig, 2 Klicks)
 *
 * Railway-kompatibel: Ja, nur HTTP-Endpunkt nötig, kein Background-Worker
 */
