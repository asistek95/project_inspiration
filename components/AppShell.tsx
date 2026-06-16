"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart2,
  Settings,
  Receipt as ReceiptIcon,
  Menu,
  X,
  LogOut,
  Calculator,
  PackageCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Home,
  Lock,
  Crown,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowser } from "@/lib/supabase";
import { setSessionCookie, clearSessionCookie } from "@/lib/session-cookie";
import { CompanySetupModal } from "./CompanySetupModal";
import { ReadOnlyBanner } from "./ReadOnlyBanner";

// ── Plan System ────────────────────────────────────────────────────────────────

type PlanTier = "basic" | "mid" | "pro";

const PLAN_LEVEL: Record<PlanTier, number> = { basic: 1, mid: 2, pro: 3 };
const PLAN_LABEL: Record<PlanTier, string> = { basic: "Basic", mid: "Betrieb", pro: "Pro" };
const PLAN_PRICE: Record<PlanTier, string> = { basic: "€20", mid: "€35", pro: "€50" };
const PLAN_NEXT: Record<PlanTier, PlanTier | null> = { basic: "mid", mid: "pro", pro: null };
const PLAN_NEXT_NAME: Record<PlanTier, string | null> = {
  basic: "Betrieb · €35/Monat",
  mid: "Pro · €50/Monat",
  pro: null,
};

function loadPlan(): PlanTier {
  if (typeof window === "undefined") return "mid";
  const stored = localStorage.getItem("klarblick.plan") as PlanTier | null;
  if (stored && stored in PLAN_LEVEL) return stored;
  return "mid"; // Demo-Default: Betrieb-Features zeigen
}

// ── Navigation ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: "/dashboard",   label: "Dashboard",       Icon: LayoutDashboard, tier: "basic" as PlanTier },
  { href: "/upload",      label: "Sammelstelle",    Icon: Inbox,           tier: "basic" as PlanTier },
  { href: "/receipts",    label: "Belege",           Icon: ReceiptIcon,     tier: "basic" as PlanTier },
  { href: "/inbox",       label: "Beleg-Check",      Icon: Mail,            tier: "mid"   as PlanTier },
  { href: "/report",      label: "Auswertung",       Icon: FileBarChart2,   tier: "mid"   as PlanTier },
  { href: "/uva",         label: "UVA-Vorerfassung", Icon: Calculator,      tier: "mid"   as PlanTier },
  { href: "/tax-advisor", label: "Übergabe",         Icon: PackageCheck,    tier: "mid"   as PlanTier },
  { href: "/ai-reports",  label: "Pro-Analyse",      Icon: Sparkles,        tier: "pro"   as PlanTier },
  { href: "/settings",    label: "Einstellungen",    Icon: Settings,        tier: "basic" as PlanTier },
];

// ── AppShell ───────────────────────────────────────────────────────────────────

const TRIAL_DAYS = 14;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string; company?: string } | null>(null);
  const [plan, setPlan] = useState<PlanTier>("mid");
  const [showSetup, setShowSetup] = useState(false);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlan(loadPlan());
      setCollapsed(localStorage.getItem("klarblick.sidebarCollapsed") === "1");
      try {
        const profile = JSON.parse(localStorage.getItem("klarblick.profile") || "{}");
        if (!profile.atu_nummer) setShowSetup(true);
      } catch { setShowSetup(true); }
    }
  }, []);

  useEffect(() => { setPendingHref(null); }, [pathname]);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = (data.user.user_metadata || {}) as any;
        setUser({ email: data.user.email || "", name: meta.owner_name, company: meta.company_name });
        if (data.user.email) setSessionCookie(data.user.email);
        localStorage.setItem("klarblick.realUser", "1");

        // Plan aus Supabase user_metadata
        if (meta.plan && meta.plan in PLAN_LEVEL) {
          const p = meta.plan as PlanTier;
          setPlan(p);
          localStorage.setItem("klarblick.plan", p);
        }

        // Trial-Berechnung — bezahlte Nutzer (plan !== "basic" in meta = paid) überspringen
        const isPaid = meta.paid === true;
        if (!isPaid) {
          const createdAt = new Date(data.user.created_at);
          const trialEnd = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
          const now = new Date();
          const msLeft = trialEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            setTrialExpired(true);
          } else {
            setTrialDaysLeft(daysLeft);
          }
        }
      }
    });
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("klarblick.sidebarCollapsed", next ? "1" : "0");
  }

  function showLocked(item: typeof NAV[0]) {
    const msg = `„${item.label}" ist ab ${PLAN_LABEL[item.tier]} (${PLAN_PRICE[item.tier]}/Monat) verfügbar`;
    setLockedMsg(msg);
    setTimeout(() => setLockedMsg(null), 3500);
  }

  async function signOut() {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    clearSessionCookie();
    localStorage.removeItem("klarblick.realUser");
    router.push("/login");
  }

  const planLevel = PLAN_LEVEL[plan];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {showSetup && <CompanySetupModal onComplete={() => setShowSetup(false)} />}

      {/* Trial abgelaufen — blocking gate */}
      {trialExpired && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-600 grid place-content-center mx-auto">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Testphase beendet</h2>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Deine 14 Tage sind abgelaufen. Wähle einen Tarif um weiterzumachen — alle Daten sind noch da.
              </p>
            </div>
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Ab €20 / Monat</p>
              {["Unbegrenzte Belege", "WhatsApp & E-Mail Eingang", "UVA-Vorbereitung", "Steuerberater-Übergabe"].map(f => (
                <p key={f} className="text-sm text-slate-700 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />{f}
                </p>
              ))}
            </div>
            <Link href="/#preise" className="btn-primary w-full justify-center">
              Tarif wählen & weiter <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-600">
              Abmelden
            </button>
          </div>
        </div>
      )}

      {/* Trial-Banner (Tage verbleibend) */}
      {trialDaysLeft !== null && trialDaysLeft <= 7 && !trialExpired && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-3">
          <span>Testphase endet in <strong>{trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tagen"}</strong></span>
          <Link href="/#preise" className="underline font-bold">Jetzt upgraden →</Link>
        </div>
      )}

      {/* Navigation progress bar */}
      {isPending && (
        <div
          className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-brand-500"
          style={{ animation: "nav-bar 1.5s ease-out forwards" }}
        />
      )}

      {/* Locked Feature Toast */}
      {lockedMsg && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 cursor-pointer max-w-sm text-center"
          onClick={() => setLockedMsg(null)}
        >
          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{lockedMsg}</span>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/klar.png" alt="K" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg">Klarblick</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost !p-2">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-30 h-screen bg-white border-r border-border flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-60",
          "hidden lg:flex",
          mobileOpen ? "!flex !w-64" : ""
        )}
      >
        {/* Logo */}
        <div className={cn(
          "h-14 flex items-center border-b border-border shrink-0",
          collapsed ? "justify-center px-0" : "px-4 gap-3"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/klar.png" alt="K" width={36} height={36} className="rounded-xl shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-base font-bold tracking-tight leading-tight">Klarblick</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest leading-tight">Monatsabschluss-Assistent</span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const { href, label, Icon, tier } = item;
            const isLocked = PLAN_LEVEL[tier] > planLevel;
            const active = !isLocked && (pathname === href || pathname?.startsWith(href + "/"));
            const pending = pendingHref === href && isPending;
            const highlighted = active || pending;

            if (isLocked) {
              return (
                <button
                  key={href}
                  type="button"
                  title={collapsed ? `${label} — ${PLAN_LABEL[tier]} nötig` : undefined}
                  onClick={() => showLocked(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-200" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{label}</span>
                      <Lock className="h-3 w-3 text-slate-200 shrink-0" />
                    </>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                prefetch={true}
                onClick={() => {
                  setMobileOpen(false);
                  if (!active) {
                    setPendingHref(href);
                    startTransition(() => {});
                  }
                }}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                  highlighted
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", highlighted ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
                {!collapsed && <span className="truncate flex-1">{label}</span>}
                {pending && !collapsed && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Plan + Collapse */}
        <div className="p-3 border-t border-border space-y-2 shrink-0">
          {/* Plan-Badge */}
          {!collapsed && (
            <Link
              href="/#preise"
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition hover:opacity-80",
                plan === "basic" && "bg-slate-50 text-slate-600 border-slate-200",
                plan === "mid"   && "bg-brand-50 text-brand-700 border-brand-100",
                plan === "pro"   && "bg-purple-50 text-purple-700 border-purple-100",
              )}
            >
              <span className="flex items-center gap-1.5">
                {plan === "pro" && <Crown className="h-3 w-3" />}
                {plan !== "pro" && <TrendingUp className="h-3 w-3" />}
                {PLAN_LABEL[plan]} · {PLAN_PRICE[plan]}/Monat
              </span>
              {PLAN_NEXT[plan] && (
                <span className="text-[10px] opacity-60 shrink-0">↑ Upgrade</span>
              )}
            </Link>
          )}

          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-1">
              <span className="h-8 w-8 rounded-full bg-slate-900 text-white grid place-content-center text-xs font-bold shrink-0">
                {(user.name || user.email).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name || user.email.split("@")[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.company || user.email}</p>
              </div>
              <button onClick={signOut} title="Abmelden" className="ml-auto btn-ghost !p-1.5 shrink-0">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {!collapsed && !user && (
            <Link href="/login" className="text-xs text-brand-600 hover:underline px-1">Anmelden →</Link>
          )}

          {/* Startseite */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Zur Startseite"
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Startseite</span>}
          </Link>

          {/* Collapse-Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={collapsed ? "Aufklappen" : "Einklappen"}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <><ChevronLeft className="h-4 w-4" /><span>Einklappen</span></>
            }
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <ReadOnlyBanner />
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 lg:py-7">{children}</div>
        <footer className="px-4 lg:px-6 pb-6 text-center text-xs text-slate-400">
          Klarblick ersetzt keine Steuerberatung. Erkannte Daten bitte prüfen.
        </footer>
      </main>
    </div>
  );
}
