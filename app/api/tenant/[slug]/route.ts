import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { TenantConfig } from "@/lib/tenant";
import { checkRateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = checkRateLimit(`tenant:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const slug = params.slug?.toLowerCase().trim();
  if (!slug || slug === "klarblick") {
    return NextResponse.json(null);
  }

  // Suche Kanzlei-User der diesen Slug registriert hat
  // Gespeichert in user_metadata.kanzlei_slug
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json(null, { status: 500 });

  const kanzleiUser = data.users.find(
    (u) => u.user_metadata?.kanzlei_slug === slug
  );

  if (!kanzleiUser) {
    return NextResponse.json(null, { status: 404 });
  }

  const meta = kanzleiUser.user_metadata || {};
  const config: TenantConfig = {
    slug,
    name: meta.kanzlei_name || meta.company_name || slug,
    logoUrl: meta.kanzlei_logo_url || undefined,
    primaryColor: meta.kanzlei_color || undefined,
    welcomeHeadline: meta.kanzlei_headline || `Willkommen bei ${meta.kanzlei_name || slug}`,
    welcomeText: meta.kanzlei_welcome_text || "Bitte melden Sie sich mit Ihren Zugangsdaten an.",
    contactEmail: meta.kanzlei_contact_email || kanzleiUser.email || undefined,
    domain: meta.kanzlei_domain || undefined,
    footerText: meta.kanzlei_footer || undefined,
  };

  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
  });
}
