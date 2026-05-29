"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileText,
  FileBarChart2,
  Send,
  Settings,
  Receipt as ReceiptIcon,
  Menu,
  X,
  Sparkles,
  LogOut,
  Calculator,
  PackageCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";
import { setSessionCookie, clearSessionCookie } from "@/lib/session-cookie";

const NAV = [
  { href: "/dashboard", label: "Monatsabschluss", Icon: LayoutDashboard, basic: true },
  { href: "/upload", label: "Belege hochladen", Icon: Upload, basic: true },
  { href: "/receipts", label: "Belegliste", Icon: ReceiptIcon, basic: true },
  { href: "/report", label: "Gewinn & Kosten", Icon: FileBarChart2, basic: false },
  { href: "/uva", label: "UVA-Vorerfassung", Icon: Calculator, basic: false },
  { href: "/ai-reports", label: "KI-Berichte", Icon: Sparkles, basic: false },
  { href: "/tax-advisor", label: "Monatsabschluss-Paket", Icon: PackageCheck, basic: false },
  { href: "/settings", label: "Einstellungen", Icon: Settings, basic: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string; company?: string } | null>(null);
  const [proMode, setProMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProMode(localStorage.getItem("klarblick.proMode") === "1");
    }
  }, []);

  function toggleProMode() {
    const next = !proMode;
    setProMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("klarblick.proMode", next ? "1" : "0");
    }
  }

  const visibleNav = NAV.filter((n) => proMode || n.basic);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = (data.user.user_metadata || {}) as any;
        setUser({
          email: data.user.email || "",
          name: meta.owner_name,
          company: meta.company_name,
        });
        if (data.user.email) setSessionCookie(data.user.email);
      }
    });
  }, []);

  async function signOut() {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    clearSessionCookie();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard" className="font-bold flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-content-center font-black text-sm shadow-sm">
            K
          </span>
          <span className="leading-tight">
            <span className="text-lg font-bold block">Klarblick</span>
          </span>
        </Link>
        <button onClick={() => setOpen(!open)} className="btn-ghost !p-2" aria-label="Menü">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-30 h-screen w-72 bg-white border-r border-border flex-col",
          "transition-transform lg:translate-x-0",
          open ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
        )}
      >
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-content-center font-black text-lg shadow-md ring-1 ring-brand-300/40">
              K
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight">Klarblick</span>
              <span className="block text-[10.5px] font-medium text-slate-500 uppercase tracking-wider">
                Monatsabschluss-Assistent
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-500")} />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleProMode}
            className="w-full mt-3 px-3 py-2.5 rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-500 hover:text-brand-700 hover:border-brand-300 transition flex items-center justify-between"
          >
            <span>Profi-Modus</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              proMode ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {proMode ? "AN" : "AUS"}
            </span>
          </button>
          {!proMode ? (
            <p className="text-[10px] text-slate-400 px-3 pt-1 leading-snug">
              Zeigt UVA, KI-Berichte, Gewinn &amp; Kosten und Steuerberater-Paket.
            </p>
          ) : null}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-2">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-content-center text-sm font-bold">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.name || user.email.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="pill bg-brand-50 text-brand-700 border border-brand-100 text-[10px]">
                  BETA
                </span>
                {user.company && (
                  <span className="text-[10px] truncate">{user.company}</span>
                )}
              </div>
              <button
                onClick={signOut}
                className="text-slate-500 hover:text-foreground inline-flex items-center gap-1 text-xs mt-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Abmelden
              </button>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">Beta-Vorschau</p>
              <p>
                {supabaseEnabled
                  ? "Nicht angemeldet — bitte einloggen."
                  : "Konfiguration unvollständig."}
              </p>
              <Link href="/login" className="text-brand-600 hover:underline">
                Anmelden →
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 lg:pl-0 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">{children}</div>
        <footer className="px-4 lg:px-8 pb-8 text-center text-xs text-muted-foreground">
          Klarblick ersetzt keine Steuerberatung. Automatisch erkannte Daten müssen geprüft werden.
        </footer>
      </main>
    </div>
  );
}
