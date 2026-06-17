import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // User-ID aus Authorization-Header (Bearer token) oder Cookie
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Verifiziere Token über anon client
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      kanzlei_slug: body.kanzlei_slug || null,
      kanzlei_name: body.kanzlei_name || null,
      kanzlei_logo_url: body.kanzlei_logo_url || null,
      kanzlei_color: body.kanzlei_color || null,
      kanzlei_headline: body.kanzlei_headline || null,
      kanzlei_welcome_text: body.kanzlei_welcome_text || null,
      kanzlei_contact_email: body.kanzlei_contact_email || null,
      kanzlei_domain: body.kanzlei_domain || null,
      kanzlei_footer: body.kanzlei_footer || null,
    },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: body.kanzlei_slug });
}
