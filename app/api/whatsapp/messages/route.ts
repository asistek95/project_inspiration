import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * GET /api/whatsapp/messages
 * Liefert alle WhatsApp-Nachrichten mit Anhängen für den eingeloggten User.
 * ?status=pending   → nur noch nicht importierte (Default)
 * ?status=all       → alle
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
    const statusFilter = url.searchParams.get("status") ?? "pending";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);

    let query = supabase
      .from("whatsapp_messages")
      .select("id, sender_phone, sender_name, body, media_url, media_type, ocr_data, status, receipt_id, created_at")
      .eq("user_id", session.user.id)
      .not("media_url", "is", null)              // nur Nachrichten mit Anhang
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
