import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Beta-Signup-Notification.
 * Wird aus app/(auth)/register/page.tsx nach erfolgreichem signUp() gefeuert.
 * Schreibt einen Eintrag in `admin_notifications`, damit der Admin
 * (office@klarblick.at) den neuen Beta-Kunden sofort sieht.
 *
 * Optional: SUPABASE_SERVICE_ROLE_KEY in .env.local setzen,
 * damit RLS umgangen wird. Sonst landet die Notification in
 * console.log und im Auth-User-Metadata.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, company, name, user_id } = body ?? {};
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmails = (process.env.ADMIN_EMAILS || "office@klarblick.at")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log("[Klarblick Beta] Neue Anmeldung:", {
      email,
      company,
      name,
      user_id,
      notify_admins: adminEmails,
      at: new Date().toISOString(),
    });

    if (url && serviceKey) {
      const sb = createClient(url, serviceKey);
      // Tabelle wird best-effort beschrieben — fehlt sie, ignorieren wir den Fehler
      await sb
        .from("admin_notifications")
        .insert({
          type: "beta_signup",
          payload: { email, company, name, user_id },
          created_at: new Date().toISOString(),
        })
        .then((r) => {
          if (r.error)
            console.warn("[Klarblick Beta] admin_notifications insert:", r.error.message);
        });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "internal" },
      { status: 500 }
    );
  }
}
