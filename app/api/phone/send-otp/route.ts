import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/phone/send-otp
 * Body: { phone: "+436641234567" }
 *
 * Erzeugt 6-stelligen OTP, speichert in phone_verifications,
 * schickt via Twilio WhatsApp/SMS an den Nutzer.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

function normalizePhone(raw: string): string {
  // "+43 664 1234567" → "+436641234567"
  return raw.replace(/\s+/g, "").replace(/^00/, "+");
}

async function sendOtpViaTwilio(phone: string, code: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // z.B. "whatsapp:+14155238886"
  if (!sid || !token || !from) return false;

  const to = `whatsapp:${phone}`;
  const body = `Dein Klarblick Verifizierungscode: *${code}*\n\nGültig für 10 Minuten. Falls du diesen Code nicht angefordert hast, ignoriere diese Nachricht.`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    }
  );
  return res.ok;
}

export async function POST(req: NextRequest) {
  // 3 OTP-Requests / 10 min pro IP — SMS-Spam-Schutz
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`otp-send:${ip}`, 3, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele OTP-Anfragen. Bitte warte 10 Minuten." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { phone: rawPhone } = await req.json();
    if (!rawPhone) {
      return NextResponse.json({ error: "phone fehlt" }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    if (!/^\+\d{7,15}$/.test(phone)) {
      return NextResponse.json({ error: "Ungültige Telefonnummer — Format: +43XXXXXXXXX" }, { status: 400 });
    }

    // Eingeloggten User ermitteln
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    // Prüfen ob Nummer schon von anderem User verwendet
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("whatsapp_phone", phone)
        .neq("id", session.user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Diese Nummer ist bereits einem anderen Konto zugeordnet." }, { status: 409 });
      }

      // Alten OTP für diesen User invalidieren
      await admin
        .from("phone_verifications")
        .update({ used: true })
        .eq("user_id", session.user.id)
        .eq("used", false);

      // Neuen OTP speichern
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertError } = await admin.from("phone_verifications").insert({
        user_id: session.user.id,
        phone,
        code,
        expires_at: expiresAt,
      });
      if (insertError) throw insertError;

      // OTP senden
      const sent = await sendOtpViaTwilio(phone, code);
      if (!sent) {
        // Twilio nicht konfiguriert → im Dev-Modus Code zurückgeben
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json({ ok: true, dev_code: code, message: "DEV: Code in Response (kein Twilio)" });
        }
        return NextResponse.json({ error: "SMS konnte nicht gesendet werden — Twilio prüfen." }, { status: 502 });
      }
    }

    return NextResponse.json({ ok: true, message: `Code an ${phone} gesendet (gültig 10 Min.)` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
