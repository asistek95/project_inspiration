import { NextResponse } from "next/server";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const VALID_ROLES = ["member", "advisor"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const role = (body.role || "member") as Role;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Bitte gültige E-Mail angeben." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unbekannte Rolle." }, { status: 400 });
  }

  if (!supabaseAdminEnabled) {
    // Demo-Fallback ohne Supabase: gib Erfolg zurück, damit UI funktioniert.
    return NextResponse.json({ ok: true, demo: true });
  }

  const sb = getSupabaseAdmin()!;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://heartfelt-playfulness-production-3e02.up.railway.app";

  try {
    const { data, error } = await sb.auth.admin.inviteUserByEmail(email, {
      data: { invited_role: role },
      redirectTo: `${siteUrl}/login`,
    });
    if (error) {
      // wenn User schon existiert → trotzdem OK zurückgeben
      const msg = error.message || "";
      if (/already/i.test(msg) || /exists/i.test(msg) || /registered/i.test(msg)) {
        return NextResponse.json({ ok: true, alreadyExisted: true });
      }
      return NextResponse.json({ error: msg || "Einladung fehlgeschlagen" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, userId: data?.user?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unbekannter Fehler" }, { status: 500 });
  }
}
