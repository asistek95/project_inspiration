import { NextResponse, type NextRequest } from "next/server";

/**
 * Schützt alle App-Routen: nur Nutzer mit gültiger Klarblick-Session
 * (gesetzt nach Login/Register im Browser) kommen rein. Sonst → /login.
 *
 * Hinweis: Die echte Auth-Validierung passiert über Supabase (RLS).
 * Dieses Cookie ist nur der "Türsteher", der Unangemeldete früh wegschickt.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/upload",
  "/receipts",
  "/report",
  "/ai-reports",
  "/tax-advisor",
  "/settings",
  "/savings",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("klarblick_session")?.value;
  if (session) return NextResponse.next();

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
    "/settings/:path*",
    "/savings/:path*",
  ],
};
