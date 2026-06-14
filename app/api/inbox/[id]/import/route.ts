import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/inbox/[id]/import
 *
 * Importiert einen email_inbox-Eintrag als Receipt in die Belegliste.
 * Der Nutzer kann vor dem Import OCR-Felder überschreiben:
 *   Body: { overrides?: { supplier_name?, category?, gross_amount?, invoice_type? } }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const overrides = await req.json().then((b) => b.overrides ?? {}).catch(() => ({}));

    // Inbox-Eintrag laden
    const { data: inbox, error: fetchErr } = await supabase
      .from("email_inbox")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (fetchErr || !inbox) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }
    if (inbox.processed_receipt_id) {
      return NextResponse.json({ error: "Bereits importiert", receipt_id: inbox.processed_receipt_id }, { status: 409 });
    }

    // OCR-Daten aus erstem Anhang extrahieren (falls vorhanden)
    const ocr = Array.isArray(inbox.ocr_data) ? inbox.ocr_data[0] : inbox.ocr_data;

    const gross = parseFloat(overrides.gross_amount ?? ocr?.gross_amount ?? 0) || 0;
    const vatRate = overrides.vat_rate ?? ocr?.vat_rate ?? 20;
    const net = Math.round((gross / (1 + vatRate / 100)) * 100) / 100;
    const vat = Math.round((gross - net) * 100) / 100;

    const receipt = {
      user_id: session.user.id,
      supplier_name: overrides.supplier_name || ocr?.vendor || inbox.from_address,
      receipt_date: overrides.receipt_date || ocr?.date || inbox.received_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      category: overrides.category || ocr?.category || "Sonstiges",
      receipt_type: overrides.receipt_type || ocr?.receipt_type || "Rechnung",
      gross_amount: gross,
      net_amount: net,
      vat_amount: vat,
      currency: ocr?.currency || "EUR",
      invoice_type: overrides.invoice_type || ocr?.invoice_type || "eingang",
      confidence_score: ocr?.confidence ?? 0.7,
      status: "ungeprueft",
      warnings: ocr?.warnings || [],
      notes: `Via E-Mail importiert (${inbox.from_address})`,
    };

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server-Konfiguration fehlt" }, { status: 500 });
    }

    const { data: created, error: insertErr } = await admin
      .from("receipts")
      .insert(receipt)
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Inbox-Eintrag als verarbeitet markieren
    await admin
      .from("email_inbox")
      .update({ status: "processed", processed_receipt_id: created.id })
      .eq("id", params.id);

    return NextResponse.json({ ok: true, receipt_id: created.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
