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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/upload", label: "Beleg hochladen", Icon: Upload },
  { href: "/receipts", label: "Belegliste", Icon: ReceiptIcon },
  { href: "/report", label: "Management-Report", Icon: FileBarChart2 },
  { href: "/tax-advisor", label: "Steuerberater-Paket", Icon: Send },
  { href: "/settings", label: "Einstellungen", Icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
          <span className="h-7 w-7 rounded-md bg-brand-600 text-white grid place-content-center text-sm">K</span>
          Klarblick
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
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-brand-600 text-white grid place-content-center text-sm shadow-sm">
              K
            </span>
            Klarblick
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "text-brand-600" : "text-slate-500")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Demo-Modus aktiv</p>
          <p>Alle Daten lokal. Verbinde Supabase für Produktion.</p>
          <button
            onClick={() => {
              if (confirm("Demo-Daten zurücksetzen?")) {
                import("@/lib/store").then(({ resetToDemo }) => {
                  resetToDemo();
                  router.refresh();
                  location.reload();
                });
              }
            }}
            className="text-brand-600 hover:underline"
          >
            Demo neu laden
          </button>
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
