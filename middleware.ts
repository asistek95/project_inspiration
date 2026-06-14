import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: Schützt alle App-Routen.
 *
 * Validierung in zwei Stufen:
 *   1. Supabase JWT — prüft den echten Session-Token, refresht ihn wenn nötig.
 *   2. Legacy-Cookie (klarblick_session) — Fallback für Demo-Modus ohne Supabase.
 *
 * Die echte Datensicherheit kommt weiterhin aus Supabase RLS —
 * die Middleware ist der "Türsteher", der Unangemeldete früh wegschickt.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/upload",
  "/receipts",
  "/report",
  "/ai-reports",
  "/tax-advisor",
  "/uva",
  "/settings",
  "/savings",
  "/steuerfaelle",
  "/inbox",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  const res = NextResponse.next();

  // Supabase-Session prüfen (refresht den Token automatisch und setzt neue Cookies)
  try {
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) return res; // gültige Supabase-Session → weiter
  } catch {
    // Supabase nicht konfiguriert (Demo-Modus) → Legacy-Cookie-Check
  }

  // Legacy-Fallback: einfacher Cookie-Check für Demo-Modus
  const legacyCookie = req.cookies.get("klarblick_session")?.value;
  if (legacyCookie) return res;

  // Nicht eingeloggt → weiterleiten
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/receipts/:path*",
    "/report/:path*",
    "/ai-reports/:path*",
    "/tax-advisor/:path*",
    "/uva/:path*",
    "/settings/:path*",
    "/savings/:path*",
    "/steuerfaelle/:path*",
    "/inbox/:path*",
  ],
};
