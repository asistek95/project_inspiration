import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-brand-600 text-white grid place-content-center text-sm">K</span>
            Klarblick
          </Link>
          <Link href="/dashboard" className="btn-secondary">Demo</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Preise</h1>
          <p className="mt-3 text-slate-600">Faire Preise. Klar verständlich. 14 Tage testen.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Plan name="Basic" price="29" features={["100 Belege", "KI-Auslesung", "Monatsübersicht", "PDF-Export"]} />
          <Plan
            name="Report"
            price="79"
            featured
            features={[
              "500 Belege",
              "Automatischer Management-Report",
              "Kostenvergleiche",
              "Auffälligkeiten",
              "Steuerberater-Paket",
              "Erinnerungen",
            ]}
          />
          <Plan
            name="Premium"
            price="149"
            features={["1.500 Belege", "Mehrere Nutzer", "Steuerberater-Zugang", "Individuelle Kategorien", "Prioritäts-Support"]}
          />
          <Plan
            name="Kanzlei"
            price="ab 499"
            features={["Mehrere Mandanten", "Mandanten-Dashboard", "Reports je Mandant", "White-Label optional"]}
          />
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Klarblick ist keine Steuerberatung. Die App hilft bei Ordnung, Auswertung und Vorbereitung.
        </p>
      </main>
    </div>
  );
}

function Plan({ name, price, features, featured = false }: { name: string; price: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`card-soft p-6 flex flex-col relative ${featured ? "ring-2 ring-brand-600" : ""}`}>
      {featured ? (
        <span className="absolute -top-3 left-6 pill bg-brand-600 text-white border-brand-600">Beliebt</span>
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
      <Link href="/register" className={`mt-6 ${featured ? "btn-primary" : "btn-secondary"} w-full justify-center`}>
        Auswählen
      </Link>
    </div>
  );
}
