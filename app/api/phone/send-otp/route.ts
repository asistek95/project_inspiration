import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/^00/, "+");
}

async function sendOtpViaTwilio(phone: string, code: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return false;

  const to = `whatsapp:${phone}`;
  const body = `Dein Klarblick Verifizierungscode: *${code}*\n\nGültig für 10 Minuten.`;

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
    if (!rawPhone) return NextResponse.json({ error: "phone fehlt" }, { status: 400 });

    const phone = normalizePhone(rawPhone);
    if (!/^\+\d{7,15}$/.test(phone)) {
      return NextResponse.json({ error: "Ungültige Telefonnummer — Format: +43XXXXXXXXX" }, { status: 400 });
    }

    // Bearer-Token aus Authorization-Header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Server-Konfiguration fehlt" }, { status: 500 });

    // Prüfen ob Nummer schon von anderem User verwendet
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("whatsapp_phone", phone)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Diese Nummer ist bereits einem anderen Konto zugeordnet." }, { status: 409 });
    }

    // Alten OTP invalidieren
    await admin.from("phone_verifications").update({ used: true }).eq("user_id", user.id).eq("used", false);

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("phone_verifications").insert({
      user_id: user.id,
      phone,
      code,
      expires_at: expiresAt,
    });
    if (insertError) throw insertError;

    const sent = await sendOtpViaTwilio(phone, code);
    if (!sent) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ ok: true, dev_code: code, message: "DEV: Code in Response" });
      }
      return NextResponse.json({ error: "WhatsApp-Nachricht konnte nicht gesendet werden." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: `Code an ${phone} gesendet (gültig 10 Min.)` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
