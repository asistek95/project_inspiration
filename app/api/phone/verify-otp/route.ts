import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const { data: otp } = await admin
      .from("phone_verifications")
      .select("id, code, expires_at, used")
      .eq("user_id", user.id)
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

    await admin.from("phone_verifications").update({ used: true }).eq("id", otp.id);

    const { error: updateError } = await admin
      .from("profiles")
      .update({ whatsapp_phone: phone })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, phone, message: "Nummer erfolgreich verifiziert!" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
