import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

const STRIPE = {
  starter: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER || "/register?plan=starter",
  profi: process.env.NEXT_PUBLIC_STRIPE_LINK_PROFI || "/register?plan=profi",
  betrieb: process.env.NEXT_PUBLIC_STRIPE_LINK_BETRIEB || "/register?plan=betrieb",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <img src="/klar.png" alt="Klarblick" className="h-9 w-9 object-contain" />
            Klarblick
          </Link>
          <Link href="/dashboard" className="btn-secondary">Demo</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Preise für Handwerksbetriebe</h1>
          <p className="mt-3 text-slate-600">14 Tage gratis. Keine Einrichtungsgebühr. Monatlich kündbar.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-accent" /> Zahlung sicher via Stripe · SEPA / Kreditkarte / Sofort
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Plan name="Starter" price="49" tagline="Einzelmeister · 1 Nutzer"
            features={["bis 100 Belege/Monat", "KI-Belegerkennung (Claude Sonnet)", "Monatsreport (PDF)", "DATEV / RZL-Export", "E-Mail-Support"]}
            href={STRIPE.starter} />
          <Plan name="Profi" price="119" featured tagline="Bis 5 Mitarbeiter"
            features={["bis 500 Belege/Monat", "Skonto-Alarm + Preis-Wächter", "SEPA-Sammelüberweisung", "Abo-Falle Übersicht", "Steuerberater-Paket", "GoBD-Audit-Log", "AI-Reports (13 Premium-Prompts)"]}
            href={STRIPE.profi} />
          <Plan name="Betrieb" price="199" tagline="Bis 20 Mitarbeiter"
            features={["unbegrenzte Belege", "Mehrere Nutzer + Rollen", "Projekt-Kostenstellen", "API-Zugang", "Prioritäts-Support", "Persönlicher Ansprechpartner", "White-Label optional"]}
            href={STRIPE.betrieb} />
        </div>

        <div className="mt-12 card-soft p-6 max-w-3xl mx-auto text-center">
          <p className="font-semibold">Fragen vor dem Start?</p>
          <p className="text-sm text-slate-600 mt-1">15-Minuten-Telefonat — wir zeigen dir, wie Klarblick in deinem Betrieb läuft.</p>
          <Link href="/#kontakt" className="btn-secondary mt-4 inline-flex">Beratung anfordern <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Klarblick ist keine Steuerberatung. Alle Preise inkl. 20 % USt (Österreich).
        </p>
      </main>
    </div>
  );
}

function Plan({ name, price, features, tagline, href, featured = false }:
  { name: string; price: string; features: string[]; tagline: string; href: string; featured?: boolean }) {
  const external = href.startsWith("http");
  const btnClass = `mt-6 ${featured ? "btn-primary" : "btn-secondary"} w-full justify-center`;
  return (
    <div className={`card p-6 flex flex-col relative ${featured ? "ring-2 ring-brand-600 shadow-lg" : ""}`}>
      {featured ? <span className="absolute -top-3 left-6 pill bg-brand-600 text-white border-brand-600">Beliebt</span> : null}
      <p className="font-bold text-xl">{name}</p>
      <p className="text-xs text-slate-500 mt-0.5">{tagline}</p>
      <p className="mt-4">
        <span className="text-4xl font-extrabold">{price} €</span>
        <span className="text-slate-500 text-sm"> brutto / Monat</span>
      </p>
      <ul className="mt-5 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {external
        ? <a href={href} className={btnClass}>14 Tage gratis starten</a>
        : <Link href={href} className={btnClass}>14 Tage gratis starten</Link>}
    </div>
  );
}
