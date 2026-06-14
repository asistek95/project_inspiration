import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/whatsapp/messages/[id]/import
 *
 * Importiert eine WhatsApp-Nachricht (mit OCR-Daten) als Receipt.
 * Body: { overrides?: { supplier_name?, category?, gross_amount?, vat_rate?, invoice_type?, receipt_date? } }
 *
 * Falls OCR-Daten fehlen (failed OCR): Basis-Receipt mit Defaults erstellen.
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

    const body = await req.json().catch(() => ({}));
    const overrides: Record<string, any> = body.overrides ?? {};

    // Nachricht laden
    const { data: msg, error: fetchErr } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (fetchErr || !msg) {
      return NextResponse.json({ error: "Nachricht nicht gefunden" }, { status: 404 });
    }
    if (msg.receipt_id) {
      return NextResponse.json({ error: "Bereits importiert", receipt_id: msg.receipt_id }, { status: 409 });
    }

    const ocr = msg.ocr_data ?? {};
    const gross = parseFloat(overrides.gross_amount ?? ocr.gross_amount ?? 0) || 0;
    const vatRate = parseFloat(overrides.vat_rate ?? ocr.vat_rate ?? 20);
    const net = Math.round((gross / (1 + vatRate / 100)) * 100) / 100;
    const vat = Math.round((gross - net) * 100) / 100;

    const receipt = {
      user_id: session.user.id,
      supplier_name: overrides.supplier_name || ocr.vendor || "Unbekannt (WhatsApp)",
      receipt_date:
        overrides.receipt_date ||
        ocr.date ||
        msg.created_at?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
      category: overrides.category || ocr.category || "Sonstiges",
      receipt_type: overrides.receipt_type || ocr.receipt_type || "Kassenbon",
      gross_amount: gross,
      net_amount: net,
      vat_amount: vat,
      currency: ocr.currency || "EUR",
      invoice_type: overrides.invoice_type || ocr.invoice_type || "eingang",
      confidence_score: ocr.confidence ?? 0.7,
      status: "ungeprueft",
      warnings: ocr.warnings || [],
      notes: msg.sender_name
        ? `Via WhatsApp von ${msg.sender_name} (${msg.sender_phone})`
        : `Via WhatsApp (${msg.sender_phone})`,
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

    // Nachricht als importiert markieren
    await admin
      .from("whatsapp_messages")
      .update({ status: "imported", receipt_id: created.id })
      .eq("id", params.id);

    return NextResponse.json({ ok: true, receipt_id: created.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
