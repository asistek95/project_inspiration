import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

const STRIPE = {
  pilot: process.env.NEXT_PUBLIC_STRIPE_LINK_PILOT || "/register?plan=pilot",
  starter: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER || "/register?plan=starter",
  betrieb: process.env.NEXT_PUBLIC_STRIPE_LINK_BETRIEB || "/register?plan=betrieb",
  plus: process.env.NEXT_PUBLIC_STRIPE_LINK_PLUS || "/register?plan=plus",
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
          <span className="pill border bg-brand-50 text-brand-700 border-blue-100 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Monatsabschluss-Assistent
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Belege rein. Monat bis zum 15. steuerberaterbereit.
          </h1>
          <p className="mt-3 text-slate-600">Keine Einrichtungsgebühr. Monatlich kündbar. Alle Preise inkl. 20 % USt.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-accent" /> Zahlung sicher via Stripe · SEPA / Karte / Sofort
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          <Plan
            name="Pilot"
            price="49"
            tagline="3 Monate Pilotphase"
            badge="Limitiert"
            features={[
              "3 Monate begleitet starten",
              "voller Funktionsumfang Betrieb",
              "persönliches Onboarding",
              "anschließend regulärer Tarif",
            ]}
            href={STRIPE.pilot}
          />
          <Plan
            name="Starter"
            price="49"
            tagline="Einzelunternehmer"
            features={[
              "bis 30 Belege/Monat",
              "Monatsstatus + Fortschritt",
              "Gewinn- und Kostenübersicht",
              "einfache UVA-Vorbereitung",
              "E-Mail-Support",
            ]}
            href={STRIPE.starter}
          />
          <Plan
            name="Betrieb"
            price="99"
            featured
            tagline="Bis 5 Mitarbeiter"
            features={[
              "bis 100 Belege/Monat",
              "WhatsApp-Upload",
              "fehlende Belege erkennen",
              "Steuerberater-Paket",
              "DATEV / RZL-Export",
              "Eingangs- und Ausgangsbelege",
            ]}
            href={STRIPE.betrieb}
          />
          <Plan
            name="Plus"
            price="199"
            tagline="Bis 20 Mitarbeiter"
            features={[
              "persönliche Monatsprüfung",
              "Priorität bis zum 15.",
              "Support direkt",
              "Steuerberater-Abstimmung",
              "Mehrere Nutzer + Rollen",
              "Projekt-Kostenstellen",
            ]}
            href={STRIPE.plus}
          />
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <Faq q="Ersetzt Klarblick meinen Steuerberater?" a="Nein. Klarblick bereitet deinen Monat vor — die finale Prüfung und Einreichung bleibt beim Steuerberater." />
          <Faq q="Was passiert, wenn ich mehr Belege habe?" a="Du kannst jederzeit in den nächsthöheren Tarif wechseln — ohne Vertragsverlängerung." />
          <Faq q="Wie lange dauert der Monatsabschluss?" a="Mit Klarblick durchschnittlich 30 Minuten statt 4 Stunden. Ziel: bis zum 15. steuerberaterbereit." />
        </div>

        <div className="mt-12 card-soft p-6 max-w-3xl mx-auto text-center">
          <p className="font-semibold">Pilot-Plätze: aktuell für 10 Betriebe.</p>
          <p className="text-sm text-slate-600 mt-1">15-Minuten-Telefonat — wir zeigen dir Klarblick live an deinen Belegen.</p>
          <Link href="/#kontakt" className="btn-secondary mt-4 inline-flex">Pilot anfragen <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Klarblick ist keine Steuerberatung. Die finale Prüfung und Abgabe erfolgt durch deinen Steuerberater. Alle Preise inkl. 20 % USt (Österreich).
        </p>
      </main>
    </div>
  );
}

function Plan({ name, price, features, tagline, href, featured = false, badge }:
  { name: string; price: string; features: string[]; tagline: string; href: string; featured?: boolean; badge?: string }) {
  const external = href.startsWith("http");
  const btnClass = `mt-6 ${featured ? "btn-primary" : "btn-secondary"} w-full justify-center`;
  return (
    <div className={`card p-6 flex flex-col relative ${featured ? "ring-2 ring-brand-600 shadow-lg" : ""}`}>
      {featured ? <span className="absolute -top-3 left-6 pill bg-brand-600 text-white border-brand-600">Beliebt</span> : null}
      {badge && !featured ? <span className="absolute -top-3 left-6 pill bg-accent text-white border-accent">{badge}</span> : null}
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
        ? <a href={href} className={btnClass}>Jetzt starten</a>
        : <Link href={href} className={btnClass}>Jetzt starten</Link>}
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="card p-5">
      <p className="font-semibold text-sm">{q}</p>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{a}</p>
    </div>
  );
}
