import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/phone/verify-otp
 * Body: { phone: "+436641234567", code: "123456" }
 *
 * Validiert OTP, speichert Nummer in profiles.whatsapp_phone.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 5 Versuche / 10 min pro IP — OTP-Brute-Force-Schutz
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`otp-verify:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte warte 10 Minuten." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { phone: rawPhone, code } = await req.json();
    if (!rawPhone || !code) {
      return NextResponse.json({ error: "phone und code erforderlich" }, { status: 400 });
    }

    const phone = rawPhone.replace(/\s+/g, "").replace(/^00/, "+");

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server-Konfiguration fehlt" }, { status: 500 });
    }

    // OTP suchen
    const { data: otp } = await admin
      .from("phone_verifications")
      .select("id, code, expires_at, used")
      .eq("user_id", session.user.id)
      .eq("phone", phone)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return NextResponse.json({ error: "Kein gültiger Code gefunden — bitte neuen Code anfordern." }, { status: 400 });
    }

    if (new Date(otp.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code abgelaufen — bitte neuen Code anfordern." }, { status: 400 });
    }

    if (otp.code !== code.trim()) {
      return NextResponse.json({ error: "Falscher Code." }, { status: 400 });
    }

    // OTP als verwendet markieren
    await admin.from("phone_verifications").update({ used: true }).eq("id", otp.id);

    // Nummer am Profil speichern
    const { error: updateError } = await admin
      .from("profiles")
      .update({ whatsapp_phone: phone })
      .eq("id", session.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, phone, message: "Nummer erfolgreich verifiziert!" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
