import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, CreditCard, Sparkles, MessageSquare, BarChart3 } from "lucide-react";

// E-Mail-Whitelist über ENV: ADMIN_EMAILS="amin@klarblick.com,co@klarblick.com"
function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

const NAV = [
  { href: "/admin", label: "Übersicht", Icon: BarChart3 },
  { href: "/admin/customers", label: "Kunden", Icon: Users },
  { href: "/admin/billing", label: "Stripe / Billing", Icon: CreditCard },
  { href: "/admin/ai-providers", label: "AI-Provider", Icon: Sparkles },
  { href: "/admin/whatsapp", label: "WhatsApp-Bot", Icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Lightweight Auth-Check via Cookie (Supabase-Session-Cookie oder Demo-Cookie)
  // Für produktive Nutzung: hier echten Supabase-Server-Client einsetzen.
  const c = cookies();
  const demoEmail = c.get("klarblick_admin_email")?.value;
  const supaEmail = c.get("sb-user-email")?.value;
  const email = supaEmail || demoEmail;

  const adminList = (process.env.ADMIN_EMAILS || "").trim();

  // Wenn keine Whitelist gesetzt ist: Dev-Bypass mit Warnung in UI.
  if (adminList && !isAdmin(email)) {
    redirect("/login?reason=admin");
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-brand-600" />
            Klarblick Admin
          </div>
          <span className="pill border bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            INTERN
          </span>
          {!adminList && (
            <span className="pill border bg-red-50 text-red-700 border-red-200 text-[10px]">
              ⚠ ADMIN_EMAILS nicht gesetzt — alle Besucher haben Zugriff!
            </span>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {email ? `Eingeloggt: ${email}` : "Dev-Modus"}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-slate-100 rounded-t-md flex items-center gap-2"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">{children}</main>
    </div>
  );
}
