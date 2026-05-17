// Server-only Supabase Admin-Client (verwendet SERVICE_ROLE_KEY)
// NIEMALS im Browser importieren. Nur in Server Components, Route Handlers oder Server Actions.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminEnabled = Boolean(url && serviceRole);

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminEnabled) return null;
  if (!_admin) {
    _admin = createClient(url!, serviceRole!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export interface AdminCustomer {
  id: string;
  email: string;
  company: string | null;
  plan: string | null;
  status: "active" | "trial" | "inactive";
  mrr: number;
  created_at: string;
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  // Vereinfachtes Schema: companies-Tabelle joinen mit auth.users
  // companies: id, user_id, company_name, plan, status, mrr_cents, created_at
  const { data, error } = await sb
    .from("companies")
    .select("id, user_id, company_name, plan, status, mrr_cents, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  // Emails über Admin-API holen
  const result: AdminCustomer[] = [];
  for (const row of data) {
    let email = "(unbekannt)";
    try {
      const { data: u } = await sb.auth.admin.getUserById(row.user_id);
      email = u?.user?.email ?? email;
    } catch {
      /* ignore */
    }
    result.push({
      id: row.id,
      email,
      company: row.company_name,
      plan: row.plan,
      status: (row.status as AdminCustomer["status"]) ?? "inactive",
      mrr: (row.mrr_cents ?? 0) / 100,
      created_at: row.created_at,
    });
  }
  return result;
}

export interface AiSetting {
  provider: string;
  model: string;
  updated_at: string;
}

export async function getActiveAiSetting(): Promise<AiSetting | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("ai_settings")
    .select("provider, model, updated_at")
    .eq("active", true)
    .maybeSingle();
  return (data as AiSetting | null) ?? null;
}

export async function setActiveAiSetting(provider: string, model: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  // Erst alle deaktivieren
  await sb.from("ai_settings").update({ active: false }).eq("active", true);
  // Neuen Eintrag aktivieren / einfügen
  const { error } = await sb
    .from("ai_settings")
    .upsert({ provider, model, active: true, updated_at: new Date().toISOString() });
  return !error;
}
