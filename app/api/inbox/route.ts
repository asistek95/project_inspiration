import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * GET /api/inbox
 * Gibt die unverarbeiteten E-Mails aus email_inbox zurück (neueste zuerst).
 * Nur Belege mit Anhängen (preview_ready = true oder attachment_count > 0).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
    const status = url.searchParams.get("status") ?? "pending";

    const { data, error } = await supabase
      .from("email_inbox")
      .select("id, from_address, subject, received_at, status, attachment_count, ocr_data, body_text, processed_receipt_id")
      .eq("user_id", session.user.id)
      .eq("status", status)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
