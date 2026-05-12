import Link from "next/link";
import {
  ArrowRight,
  Camera,
  FileBarChart2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Send,
  Users,
  Building2,
  Utensils,
  Hammer,
  Wrench,
  Briefcase,
  Heart,
  Calculator,
} from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { DemoVideo } from "@/components/DemoVideo";
import { PartnersStrip, Testimonials } from "@/components/Partners";

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-brand-600 text-white grid place-content-center text-sm shadow-sm">
              K
            </span>
            Klarblick
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#problem" className="hover:text-foreground">Problem</a>
            <a href="#loesung" className="hover:text-foreground">Lösung</a>
            <a href="#report" className="hover:text-foreground">Report</a>
            <a href="#preise" className="hover:text-foreground">Preise</a>
            <Link href="/login" className="hover:text-foreground">Login</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-secondary hidden sm:inline-flex">Demo ansehen</Link>
            <Link href="/register" className="btn-primary">Kostenlos starten</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="grid-bg">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="pill border bg-brand-50 text-brand-700 border-blue-100 mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Belege rein. Management-Report raus.
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Aus Chaos wird{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent bg-clip-text text-transparent">
                Unternehmerklarheit.
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              Klarblick verwandelt deine Belege in Management-Reports und klare Einblicke —
              für dich und deinen Steuerberater.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary btn-lg">
                Kostenlosen Demo-Report ansehen <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/upload" className="btn-secondary btn-lg">
                <Camera className="h-4 w-4" /> Beleg hochladen
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> DSGVO-konform geplant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Mock-Modus ohne Anmeldung</span>
              <span className="flex items-center gap-1.5"><FileBarChart2 className="h-3.5 w-3.5 text-accent" /> PDF-Export inklusive</span>
            </div>
          </div>

          {/* Hero Visual */}
          <DemoVideo />
        </div>
      </section>

      <PartnersStrip />

      {/* PROBLEM */}
      <section id="problem" className="py-20 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Das Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Belege sammeln ist nicht das Problem.<br />
              <span className="text-slate-500">Nichts daraus zu lernen schon.</span>
            </h2>
          </div>
          <ul className="space-y-3 text-slate-700">
            {[
              "Belege liegen in Schuhkartons, WhatsApp, E-Mail und Ordnern",
              "Steuerberater bekommen alles zu spät",
              "Unternehmer sehen Kostenprobleme erst Monate später",
              "Buchhaltungssoftware ist vielen zu kompliziert",
              "Reports sind oft nur für Steuerberater verständlich",
            ].map((t, i) => (
              <li key={i} className="card p-4 flex items-start gap-3">
                <span className="h-7 w-7 rounded-md bg-danger-soft text-danger grid place-content-center shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LÖSUNG */}
      <section id="loesung" className="py-20 lg:py-24 bg-slate-50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Die Lösung</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Klarblick macht aus Belegen einen Unternehmer-Report.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: 1, t: "Beleg hochladen", d: "Foto vom Handy, PDF, oder Drag & Drop am Laptop.", Icon: Camera },
              { n: 2, t: "KI liest die Daten", d: "Betrag, Datum, Lieferant, MwSt., Kategorie — automatisch.", Icon: Sparkles },
              { n: 3, t: "Du prüfst mit 1 Klick", d: "„Stimmt alles“ — fertig. Unsichere Belege werden markiert.", Icon: CheckCircle2 },
              { n: 4, t: "Report & Paket fertig", d: "Monatsreport für dich. Sauberes Paket für den Steuerberater.", Icon: FileBarChart2 },
            ].map(({ n, t, d, Icon }) => (
              <div key={n} className="card-soft p-6">
                <div className="flex items-center justify-between">
                  <span className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-content-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold text-slate-200">0{n}</span>
                </div>
                <h3 className="font-semibold mt-4">{t}</h3>
                <p className="text-sm text-slate-600 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* REPORT PREVIEW */}
      <section id="report" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">
              Management-Report Preview
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Endlich verstehen, wohin dein Geld geht.
            </h2>
            <p className="mt-3 text-slate-600">
              So sieht dein automatisch erstellter Monatsreport aus.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PreviewKpi label="Gesamtausgaben" value="12.480 €" />
            <PreviewKpi label="MwSt.-Summe" value="1.996 €" />
            <PreviewKpi label="Belege geprüft" value="142" accent="accent" />
            <PreviewKpi label="Unsichere Belege" value="7" accent="warn" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <PreviewInsight
              tone="brand"
              title="Größter Kostenblock"
              text="Wareneinkauf"
              sub="38 % deiner Ausgaben"
            />
            <PreviewInsight
              tone="warn"
              title="Auffälligkeit"
              text="Fahrtkosten +38 %"
              sub="im Vergleich zum Vormonat"
            />
            <PreviewInsight
              tone="accent"
              title="Top-Lieferant"
              text="Metro"
              sub="2.140 € · 17 %"
            />
          </div>

          <div className="mt-4 card-soft p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 rounded-lg bg-brand-600 text-white grid place-content-center">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Steuerberater-Paket bereit</p>
                <p className="text-sm text-slate-600">142 geprüfte Belege · PDF + CSV</p>
              </div>
            </div>
            <Link href="/dashboard" className="btn-primary">
              Dashboard ansehen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FÜR WEN */}
      <section className="py-20 lg:py-24 bg-slate-50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Für wen?</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Für alle, die endlich Ordnung wollen.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { t: "Handwerker", Icon: Hammer },
              { t: "Gastro", Icon: Utensils },
              { t: "Kleine Händler", Icon: Building2 },
              { t: "Dienstleister", Icon: Briefcase },
              { t: "Einzelunternehmer", Icon: Wrench },
              { t: "Familienbetriebe", Icon: Users },
              { t: "Vereine", Icon: Heart },
              { t: "Steuerberater", Icon: Calculator },
            ].map(({ t, Icon }) => (
              <div key={t} className="card p-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-md bg-brand-50 text-brand-700 grid place-content-center">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="preise" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Preise</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Faire Preise. Klar verständlich.</h2>
            <p className="mt-3 text-slate-600">14 Tage testen. Jederzeit kündbar.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <PricingCard
              name="Basic"
              price="29"
              features={["100 Belege / Monat", "KI-Auslesung", "Monatsübersicht", "PDF-Export"]}
            />
            <PricingCard
              name="Report"
              price="79"
              featured
              features={[
                "500 Belege / Monat",
                "Automatischer Management-Report",
                "Kostenvergleiche",
                "Auffälligkeiten",
                "Steuerberater-Paket",
                "Erinnerungen",
              ]}
            />
            <PricingCard
              name="Premium"
              price="149"
              features={[
                "1.500 Belege / Monat",
                "Mehrere Nutzer",
                "Steuerberater-Zugang",
                "Individuelle Kategorien",
                "Prioritäts-Support",
              ]}
            />
            <PricingCard
              name="Kanzlei"
              price="ab 499"
              features={[
                "Mehrere Mandanten",
                "Mandanten-Dashboard",
                "Reports je Mandant",
                "White-Label optional",
              ]}
            />
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-12 bg-slate-50 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-foreground">Wichtig:</strong> Klarblick ist keine Steuerberatung.
            Die App hilft bei Ordnung, Auswertung und Vorbereitung. Alle automatisch erkannten Daten
            müssen geprüft werden.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Endlich dein Geschäft klar sehen.</h2>
          <p className="mt-3 text-slate-600">
            Lade deinen ersten Beleg hoch — der Monatsreport entsteht automatisch.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary btn-lg">
              Demo-Dashboard öffnen <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/upload" className="btn-secondary btn-lg">
              Beleg hochladen
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm text-slate-500">
          <div>
            <div className="font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-brand-600 text-white grid place-content-center text-xs">K</span>
              Klarblick
            </div>
            <p className="mt-2 max-w-sm">Der automatische Management-Report für kleine Unternehmen.</p>
          </div>
          <div className="flex gap-8">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Produkt</p>
              <Link href="/dashboard" className="block hover:text-foreground">Dashboard</Link>
              <Link href="/upload" className="block hover:text-foreground">Upload</Link>
              <Link href="/pricing" className="block hover:text-foreground">Preise</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Rechtliches</p>
              <span className="block">Impressum (TODO)</span>
              <span className="block">Datenschutz (TODO)</span>
              <span className="block">AGB (TODO)</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-brand-200/40 to-accent/20 rounded-3xl blur-2xl" />
      <div className="relative grid grid-cols-5 gap-3">
        {/* Belege Stack */}
        <div className="col-span-2 space-y-2">
          <p className="text-xs text-slate-500 font-medium pl-1">Belege rein</p>
          {["Hornbach · 142,90 €", "Shell · 78,40 €", "Metro · 891,20 €", "Telekom · 49,90 €", "Canva · 12,00 €"].map(
            (t, i) => (
              <div
                key={i}
                style={{ transform: `rotate(${i % 2 ? -1.2 : 1.5}deg)` }}
                className="card p-3 flex items-center gap-2 text-xs"
              >
                <span className="h-7 w-7 rounded-md bg-slate-100 grid place-content-center">
                  <Receipt className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <span className="font-medium truncate">{t}</span>
              </div>
            )
          )}
        </div>

        {/* Arrow */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-brand-600 text-white grid place-content-center shadow-lg">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        {/* Report Preview */}
        <div className="col-span-2 card-soft p-4 bg-white">
          <p className="text-[11px] text-slate-500 font-medium">Mai 2026 · Musterbau GmbH</p>
          <p className="font-bold text-sm mt-1">Management-Report</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Gesamtausgaben</p>
              <p className="text-sm font-bold">12.480 €</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">MwSt.</p>
              <p className="text-sm font-bold">1.996 €</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <MiniBar label="Wareneinkauf" pct={86} />
            <MiniBar label="Material" pct={62} />
            <MiniBar label="Fahrtkosten" pct={48} color="#f59e0b" />
            <MiniBar label="Software" pct={20} />
          </div>
          <div className="mt-3 rounded-md bg-warn-soft border border-amber-100 p-2 flex items-start gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-warn mt-0.5" />
            <p className="text-[11px] text-warn font-medium leading-tight">
              Fahrtkosten +38 % zum Vormonat
            </p>
          </div>
          <div className="mt-2 rounded-md bg-accent-soft border border-emerald-100 p-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <p className="text-[11px] text-accent font-medium">Steuerberater-Paket: bereit</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, pct, color = "#2563eb" }: { label: string; pct: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PreviewKpi({ label, value, accent = "brand" }: { label: string; value: string; accent?: string }) {
  const cls =
    accent === "accent" ? "text-accent" : accent === "warn" ? "text-warn" : "text-foreground";
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cls}`}>{value}</p>
    </div>
  );
}

function PreviewInsight({ tone, title, text, sub }: { tone: "brand" | "warn" | "accent"; title: string; text: string; sub: string }) {
  const map = {
    brand: "border-l-brand-500 bg-brand-50",
    warn: "border-l-warn bg-warn-soft",
    accent: "border-l-accent bg-accent-soft",
  };
  return (
    <div className={`card p-5 border-l-4 ${map[tone]}`}>
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{title}</p>
      <p className="text-xl font-bold mt-1">{text}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  featured = false,
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`card-soft p-6 flex flex-col relative ${
        featured ? "ring-2 ring-brand-600 shadow-lg" : ""
      }`}
    >
      {featured ? (
        <span className="absolute -top-3 left-6 pill bg-brand-600 text-white border-brand-600">
          Beliebt
        </span>
      ) : null}
      <p className="font-semibold text-lg">{name}</p>
      <p className="mt-3">
        <span className="text-4xl font-extrabold">{price.startsWith("ab") ? price : `${price} €`}</span>
        <span className="text-slate-500 text-sm"> / Monat</span>
      </p>
      <ul className="mt-5 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`mt-6 ${featured ? "btn-primary" : "btn-secondary"} w-full justify-center`}
      >
        Auswählen
      </Link>
    </div>
  );
}
