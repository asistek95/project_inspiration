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
  Building2,
  Calculator,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  XCircle,
  Lock,
  Scale,
  Database,
  Brain,
  Bot,
  HardHat,
  Link2,
  LogIn,
} from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { DemoVideo } from "@/components/DemoVideo";
import { DemoDashboard } from "@/components/DemoDashboard";
import { Testimonials } from "@/components/Partners";
import { LiveChat } from "@/components/LiveChat";
import { Onboarding } from "@/components/Onboarding";
import { MagicMoment } from "@/components/MagicMoment";
export default function LandingPage() {
  return (
    <div className="bg-white">
      <Onboarding />
      <LiveChat />
      {/* Top Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <img src="/klar.png" alt="Klarblick" className="h-9 w-9 object-contain" />
            Klarblick
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#problem" className="hover:text-foreground">Problem</a>
            <a href="#loesung" className="hover:text-foreground">Lösung</a>
            <a href="#features" className="hover:text-foreground">Funktionen</a>
            <a href="#partner" className="hover:text-foreground">Partner</a>
            <a href="#preise" className="hover:text-foreground">Preise</a>
            <a href="#kontakt" className="hover:text-foreground">Kontakt</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary hidden sm:inline-flex">Login</Link>
            <Link href="/register" className="btn-primary">Jetzt starten</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="grid-bg">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="pill border bg-brand-50 text-brand-700 border-blue-100 mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Monatsabschluss-Assistent für österreichische Kleinbetriebe
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground">
              Belege rein.{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent bg-clip-text text-transparent">
                Monat bis zum 15. steuerberaterbereit.
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              Klarblick <strong className="text-foreground">sammelt, prüft und sortiert</strong> deine Belege,
              bereitet die UVA-Unterlagen vor und zeigt dir verständlich <strong>Gewinn, Kosten und offene Punkte</strong>.
              Kein Buchhaltungswissen nötig.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary btn-lg">
                Jetzt starten <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> DSGVO · EU-Hosting</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Beleg-Upload per WhatsApp</span>
              <span className="flex items-center gap-1.5"><FileBarChart2 className="h-3.5 w-3.5 text-accent" /> UVA-Vorbereitung inklusive</span>
            </div>
          </div>

          {/* Hero Visual */}
          <DemoVideo />
        </div>
      </section>

      {/* TRUST-WALL */}
      <section className="py-10 bg-slate-50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { Icon: Scale, t: "Österr. Recht", d: "UGB · EStG · UStG" },
              { Icon: ShieldCheck, t: "GoBD-konform", d: "Audit-Log" },
              { Icon: Lock, t: "EU-Hosting", d: "Daten in Frankfurt" },
              { Icon: Database, t: "DSGVO", d: "AV-Vertrag verfügbar" },
              { Icon: AlertTriangle, t: "Kein StB-Ersatz", d: "Vorbereitend" },
              { Icon: CheckCircle2, t: "Beta", d: "Tägliche Backups" },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="flex items-center gap-2.5 bg-white border border-border rounded-lg p-3">
                <Icon className="h-5 w-5 text-brand-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">{t}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MagicMoment deaktiviert — Flow-Sektion ersetzt es */}

      {/* PROBLEM */}
      <section id="problem" className="py-20 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Das Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Belegchaos. Rückfragen.<br />
              <span className="text-slate-500">Und der 15. kommt näher.</span>
            </h2>
          </div>
          <ul className="space-y-3 text-slate-700">
            {[
              "Belege liegen in Schuhkartons, WhatsApp, E-Mail und Ordnern",
              "Steuerberater fragt jeden Monat dieselben Belege nach",
              "Keine Übersicht, was wirklich übrig bleibt",
              "UVA-Vorbereitung kostet stundenlang Nerven",
              "Niemand weiß, ob der Monat fertig ist oder nicht",
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

      {/* APP-VORSCHAU */}
      <section id="loesung" className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Die Lösung</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Das Dashboard — auf einen Blick</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">Alle Belege, KPIs und der Monatsstatus in einer Ansicht. Kein Buchhaltungswissen nötig.</p>
          </div>

          {/* Interaktiver Demo-Mock */}
          <DemoDashboard />

          <div className="mt-8 text-center">
            <Link href="/register" className="btn-primary btn-lg">
              Jetzt kostenlos starten <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">Keine Kreditkarte · Kein Abo · Sofort loslegen</p>
          </div>
        </div>
      </section>

      {/* DER KLARBLICK-FLUSS */}
      <section id="fluss" className="py-20 lg:py-28 bg-slate-50 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Der Klarblick-Fluss</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Vom ersten Beleg bis zum fertigen Steuerberater-Paket.
            </h2>
            <p className="mt-3 text-slate-600">
              Sechs Schritte. Einmal einrichten. Danach läuft der Monat von selbst.
            </p>
          </div>

          <div className="relative">
            {/* Verbindungslinie */}
            <div className="hidden lg:block absolute top-8 left-[8.33%] right-[8.33%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  icon: <Receipt className="h-6 w-6" />,
                  title: "Sammelstelle",
                  subtitle: "Alle Kanäle",
                  desc: "WhatsApp-Foto, E-Mail-Weiterleitung, PDF-Upload oder Kamera — alle Belege landen an einem Ort. Nichts geht verloren.",
                  tag: "Eingang",
                  color: "blue",
                },
                {
                  step: "02",
                  icon: <Brain className="h-6 w-6" />,
                  title: "OCR-Erkennung",
                  subtitle: "Claude AI liest",
                  desc: "Lieferant, Datum, Betrag, MwSt-Satz und ob es eine Eingangs- oder Ausgangsrechnung ist — erkannt in Sekunden. Reverse Charge §19 inklusive.",
                  tag: "KI",
                  color: "brand",
                },
                {
                  step: "03",
                  icon: <CheckCircle2 className="h-6 w-6" />,
                  title: "Belegverarbeitung",
                  subtitle: "Prüfen & ergänzen",
                  desc: "Kategorie bestätigen, Notiz hinzufügen, Vorsteuerabzug automatisch erkannt (PKW nein, Kastenwagen ja). GoBD-konforme Nummerierung.",
                  tag: "Pflicht",
                  color: "slate",
                },
                {
                  step: "04",
                  icon: <FileBarChart2 className="h-6 w-6" />,
                  title: "Auswertung",
                  subtitle: "Dashboard",
                  desc: "Eingangs- und Ausgangsrechnungen getrennt, Quartal- und Monatsansicht, Vorsteuer vs. USt-Schuld auf einen Blick.",
                  tag: "KPIs",
                  color: "indigo",
                },
                {
                  step: "05",
                  icon: <Calculator className="h-6 w-6" />,
                  title: "UVA-Vorerfassung",
                  subtitle: "Formular U30",
                  desc: "KZ 010–096 automatisch berechnet nach österreichischem UStG 1994. Reverse Charge, innergem. Erwerb, Einfuhrumsatzsteuer — alles dabei.",
                  tag: "§21 UStG",
                  color: "emerald",
                },
                {
                  step: "06",
                  icon: <Send className="h-6 w-6" />,
                  title: "Übergabe",
                  subtitle: "Bis zum 15.",
                  desc: "PDF-Report, DATEV-CSV, SEPA-Sammelüberweisung und UVA-Entwurf — alles per Klick an den Steuerberater. Übergabe mit Zeitstempel im Audit-Log (§132 BAO).",
                  tag: "Fertig",
                  color: "orange",
                },
              ].map((s) => {
                const colorMap: Record<string, string> = {
                  blue: "bg-blue-50 text-blue-700 border-blue-100",
                  brand: "bg-brand-50 text-brand-700 border-brand-100",
                  slate: "bg-slate-100 text-slate-700 border-slate-200",
                  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
                  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  orange: "bg-orange-50 text-orange-700 border-orange-100",
                };
                return (
                  <div key={s.step} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                        {s.icon}
                      </div>
                      <span className="text-2xl font-black text-slate-100 tabular-nums">{s.step}</span>
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${colorMap[s.color].split(" ")[1]}`}>{s.subtitle}</p>
                    <h3 className="font-bold text-base text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                    <span className={`inline-block mt-3 text-[10px] font-semibold px-2 py-0.5 rounded border ${colorMap[s.color]}`}>{s.tag}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="btn-primary btn-lg">
              Jetzt starten — kostenlos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PROFI-FEATURES */}
      <section id="features" className="py-20 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Funktionen</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Alles, was der Monat braucht.
            </h2>
            <p className="mt-3 text-slate-600">Vom Beleg-Eingang bis zum fertigen Steuerberater-Paket.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: Send, title: "WhatsApp-Upload", desc: "Beleg per WhatsApp senden — Bot bestätigt Eingang. Antwortet auf Was fehlt noch? und Ist mein Monat bereit?.", tag: "Einfach" },
              { Icon: Receipt, title: "Eingangs- & Ausgangsbelege", desc: "Klarblick trennt Lieferanten- und Kundenrechnungen automatisch. Sauber für UVA und DATEV.", tag: "Sortiert" },
              { Icon: AlertTriangle, title: "Fehlende Belege", desc: "Doppelte erkennen, unsichere markieren, Zahlungen ohne Beleg anzeigen. To-do-Liste mit offenen Punkten.", tag: "Prüfung" },
              { Icon: FileBarChart2, title: "UVA-Vorbereitung", desc: "Umsatzsteuer aus Ausgangs-, Vorsteuer aus Eingangsbelegen. Monatsexport für Steuerberater.", tag: "UVA" },
              { Icon: TrendingUp, title: "Gewinn & Kosten", desc: "Umsatz, Kosten, geschätzter Gewinn, größte Kostenblöcke und auffällige Ausgaben — in Chef-Sprache.", tag: "Übersicht" },
              { Icon: ShieldCheck, title: "Steuerberater-Paket", desc: "Ein Klick: alle Belege + UVA + Gewinn-Report + DATEV-CSV + PDF-Zusammenfassung. Fertig bis zum 15.", tag: "Bereit" },
            ].map(({ Icon, title, desc, tag }) => (
              <div key={title} className="card p-6 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <span className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-content-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="pill bg-accent-soft text-accent border border-emerald-200 text-[10px]">{tag}</span>
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WARUM NICHT KLASSISCHE BUCHHALTUNG */}
      <section className="py-20 lg:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Häufige Frage</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              "Warum nicht einfach sevdesk oder BMD?"
            </h2>
            <p className="mt-3 text-slate-600">
              Kurze Antwort: Buchhaltungssoftware ist für Buchhalter gebaut. Klarblick ist für den Chef gebaut —
              der nur wissen will, ob der Monat bis 15. fertig ist und was übrig bleibt.
            </p>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold">Was du brauchst</th>
                  <th className="text-center p-4 font-semibold w-36">Buchhaltungs-SW</th>
                  <th className="text-center p-4 font-semibold w-32 bg-brand-50 text-brand-700">Klarblick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Beleg per WhatsApp hochladen", "no", "yes"],
                  ["Monatsstatus auf einen Blick", "part", "yes"],
                  ["Klare Antwort: Ist mein Monat bereit?", "no", "yes"],
                  ["Fehlende Belege automatisch finden", "part", "yes"],
                  ["UVA-Vorbereitung verständlich", "part", "yes"],
                  ["Gewinn & Kosten in Chef-Sprache", "no", "yes"],
                  ["Steuerberater-Paket per Knopfdruck", "part", "yes"],
                  ["Kein Buchhaltungswissen nötig", "no", "yes"],
                ].map(([label, gpt, kb], i) => (
                  <tr key={i}>
                    <td className="p-4">{label}</td>
                    <td className="p-4 text-center">
                      {gpt === "yes" && <CheckCircle2 className="h-5 w-5 text-accent inline" />}
                      {gpt === "no" && <XCircle className="h-5 w-5 text-slate-300 inline" />}
                      {gpt === "part" && <span className="text-amber-600 text-xs font-medium">teilweise</span>}
                    </td>
                    <td className="p-4 text-center bg-brand-50/40">
                      {kb === "yes" ? <CheckCircle2 className="h-5 w-5 text-accent inline" /> : <XCircle className="h-5 w-5 text-slate-300 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            Klarblick ersetzt keine Buchhaltungssoftware — Klarblick bereitet den Monat so vor, dass der Steuerberater sofort buchen kann.
          </p>
        </div>
      </section>

      <Testimonials />

      {/* PARTNER & INTEGRATIONEN */}
      <section id="partner" className="py-20 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Partner & Integrationen</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Klarblick allein reicht nicht? Diese Partner schließen die Lücke.
            </h2>
            <p className="mt-3 text-slate-600">
              Wir bauen Klarblick bewusst schlank. Für angrenzende Themen empfehlen wir spezialisierte
              österreichische Partner — getestet, fair und sauber integrierbar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {/* McTime — Zeiterfassung */}
            <a
              href="https://mctime.com/de/"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 hover:shadow-md transition flex flex-col group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="/partners/mctime.png" alt="McTime" className="h-11 w-11 rounded-xl object-contain" />
                  <div>
                    <p className="text-xs text-slate-500">Empfohlener Partner</p>
                    <p className="font-bold text-lg leading-tight">McTime</p>
                  </div>
                </div>
                <span className="pill bg-accent-soft text-accent border border-emerald-200 text-[10px]">Zeiterfassung</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">
                <strong>Digitale Zeiterfassung für Handwerker und Baustellen.</strong> Mitarbeiter stempeln per App,
                Projekt- und Baustellen­zuordnung inklusive. Saubere Stunden für Lohnverrechnung und Projektkalkulation —
                läuft Hand in Hand mit deinem Klarblick-Monatsabschluss.
              </p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-brand-600 font-semibold group-hover:underline inline-flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" /> mctime.com
                </span>
                <span className="text-xs text-slate-500">Made in Austria</span>
              </div>
            </a>

            {/* White-Label für Kanzleien */}
            <a
              href="#kontakt"
              className="card p-6 hover:shadow-md transition flex flex-col group bg-gradient-to-br from-foreground to-slate-800 text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-xl bg-white/10 text-white grid place-content-center">
                    <Calculator className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-white/60">Für Steuerkanzleien</p>
                    <p className="font-bold text-lg leading-tight">White-Label-Programm</p>
                  </div>
                </div>
                <span className="pill bg-white/10 text-white border-white/20 text-[10px]">Kanzlei</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed flex-1">
                <strong className="text-white">Klarblick unter deinem Logo für deine Klienten.</strong>{" "}
                Saubere DATEV-/RZL-Daten pünktlich zum 15., weniger Rückfragen pro Mandat,
                bessere Marge. Onboarding-Schulung und Kanzlei-Branding inklusive.
              </p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-white font-semibold group-hover:underline inline-flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" /> Kanzlei-Anfrage stellen
                </span>
                <span className="text-xs text-white/60">individuelles Angebot</span>
              </div>
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { Icon: HardHat, label: "Baustellen-Software", status: "in Prüfung" },
              { Icon: Database, label: "DATEV / RZL", status: "Export ✓" },
              { Icon: Send, label: "WhatsApp Business", status: "verfügbar" },
              { Icon: CreditCard, label: "Stripe Billing", status: "verfügbar" },
            ].map(({ Icon, label, status }) => (
              <div key={label} className="card p-3 flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{label}</p>
                  <p className="text-[11px] text-slate-500">{status}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 max-w-2xl mx-auto">
            Du bist Anbieter und willst Klarblick-Partner werden?{" "}
            <a href="#kontakt" className="text-brand-600 font-medium hover:underline">Schreib uns</a> —
            wir prüfen Integrationen mit Fokus auf österreichische Kleinbetriebe.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="preise" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Preise</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Faire Preise. Monatlich kündbar.</h2>
            <p className="mt-3 text-slate-600">Pilot-Phase für 3 Monate. Danach regulärer Tarif. Alle Preise inkl. 20 % USt.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <PricingCard
              name="Basic"
              price="20"
              tagline="Einzelunternehmer"
              features={[
                "bis 30 Belege/Monat",
                "Dashboard & Monatsstatus",
                "Belegliste & Upload",
                "Einstellungen",
              ]}
            />
            <PricingCard
              name="Betrieb"
              price="35"
              featured
              tagline="Bis 5 Mitarbeiter"
              features={[
                "bis 100 Belege/Monat",
                "WhatsApp & E-Mail Eingang",
                "Auswertung & UVA",
                "Steuerberater-Übergabe",
                "DATEV / RZL-Export",
              ]}
            />
            <PricingCard
              name="Pro"
              price="50"
              tagline="Unbegrenzt"
              features={[
                "unbegrenzte Belege",
                "KI-Pro-Analyse",
                "Steuerfälle",
                "Rollen & Team",
                "Priority-Support",
              ]}
            />
          </div>
          <div className="mt-8 text-center space-y-3">
            <Link href="/register" className="btn-secondary">Jetzt kostenlos starten <ArrowRight className="h-4 w-4" /></Link>
            <p className="text-xs text-slate-400">14 Tage gratis · monatlich kündbar · keine Kreditkarte nötig</p>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Klarblick ersetzt keine Steuerberatung — die App bereitet den Monat vor, dein Steuerberater prüft und übermittelt.</p>
          </div>
        </div>
      </section>

      {/* KONTAKT */}
      <section id="kontakt" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Kontakt</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Lass uns reden.</h2>
            <p className="mt-3 text-slate-600">Wir melden uns innerhalb von 24 Stunden — werktags meist deutlich schneller.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <form
              action="https://formsubmit.co/amin.sistek20@gmail.com"
              method="POST"
              className="card p-6 lg:p-8 space-y-4"
            >
              <input type="hidden" name="_subject" value="Neue Klarblick-Anfrage" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input name="name" required className="input mt-1.5" placeholder="Max Mustermann" />
                </div>
                <div>
                  <label className="text-sm font-medium">Betrieb</label>
                  <input name="company" className="input mt-1.5" placeholder="Mustermann GmbH" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">E-Mail</label>
                  <input name="email" type="email" required className="input mt-1.5" placeholder="max@firma.at" />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefon (optional)</label>
                  <input name="phone" className="input mt-1.5" placeholder="+43 ..." />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Worum geht's?</label>
                <textarea name="message" required rows={4} className="input mt-1.5 resize-none" placeholder="Wir sind ein Sanitärbetrieb mit 6 Mitarbeitern und suchen ..." />
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" name="_dsgvo" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600 shrink-0" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Ich stimme zu, dass meine Daten zur Bearbeitung dieser Anfrage gespeichert werden. Details in der{" "}
                  <Link href="/datenschutz" className="underline hover:text-slate-700">Datenschutzerklärung</Link>.
                </span>
              </label>
              <button type="submit" className="btn-primary w-full">
                Anfrage senden <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Kontaktinfo + Map */}
            <div className="space-y-5">
              {/* Adress-Hero: Icon Tower Wien */}
              <div className="relative card-soft p-6 lg:p-7 overflow-hidden bg-gradient-to-br from-foreground via-slate-900 to-slate-800 text-white">
                <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
                <div className="relative">
                  <span className="pill bg-white/10 text-white border border-white/20 text-[11px]">
                    <Building2 className="h-3 w-3" /> Hauptsitz
                  </span>
                  <h3 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
                    THE ICON VIENNA<span className="text-brand-300">.</span>
                  </h3>
                  <p className="mt-1 text-slate-300 text-sm">
                    Gertrude-Fröhlich-Sandner-Str. 2 · 1100 Wien · <span className="text-white font-medium">16. Stock</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Regus Icon Tower · Österreich</p>

                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <a
                      href="mailto:office@klarblick.at"
                      className="rounded-lg bg-white/10 hover:bg-white/15 transition p-3 flex items-start gap-2.5 ring-1 ring-white/10"
                    >
                      <Mail className="h-4 w-4 text-brand-300 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">E-Mail</p>
                        <p className="text-xs font-medium truncate">office@klarblick.at</p>
                      </div>
                    </a>
                    <div className="rounded-lg bg-white/10 p-3 flex items-start gap-2.5 ring-1 ring-white/10">
                      <Phone className="h-4 w-4 text-brand-300 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Antwortzeit</p>
                        <p className="text-xs font-medium">&lt; 24 Stunden (werktags)</p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://www.google.com/maps/place/THE+ICON+VIENNA/@48.1861391,16.3742893,17z/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-300 font-medium hover:text-white transition"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Route planen
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="card overflow-hidden">
                <iframe
                  title="Klarblick Standort — THE ICON VIENNA, 1100 Wien"
                  src="https://maps.google.com/maps?q=THE+ICON+VIENNA+Gertrude-Fr%C3%B6hlich-Sandner-Stra%C3%9Fe+2+1100+Wien&t=&z=17&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-64 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between gap-6 text-sm text-slate-500">
          <div>
            <div className="font-bold text-foreground flex items-center gap-2">
              <img src="/klar.png" alt="Klarblick" className="h-7 w-7 object-contain" />
              Klarblick
            </div>
            <p className="mt-2 max-w-sm">Der Monatsabschluss-Assistent für österreichische Kleinbetriebe — Belege rein, Monat bis zum 15. steuerberaterbereit.</p>
          </div>
          <div className="flex gap-8">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Produkt</p>
              <Link href="/dashboard" className="block hover:text-foreground">Dashboard</Link>
              <Link href="/upload" className="block hover:text-foreground">Upload</Link>
              <Link href="/#preise" className="block hover:text-foreground">Preise</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Rechtliches</p>
              <Link href="/impressum" className="block hover:text-foreground">Impressum</Link>
              <Link href="/datenschutz" className="block hover:text-foreground">Datenschutz</Link>
              <Link href="/agb" className="block hover:text-foreground">AGB</Link>
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
          <p className="text-xs text-slate-500 font-medium pl-1">Eingangsbelege</p>
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
          <p className="text-[11px] text-slate-500 font-medium">Mai 2026 · Thomas Bau & Montage</p>
          <p className="font-bold text-sm mt-1">Monatsabschluss</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Ausgaben</p>
              <p className="text-sm font-bold">12.480 €</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Vorsteuer</p>
              <p className="text-sm font-bold">1.996 €</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <MiniBar label="Material" pct={86} />
            <MiniBar label="Werkzeug" pct={62} />
            <MiniBar label="Fahrtkosten" pct={48} color="#f59e0b" />
            <MiniBar label="Software" pct={20} />
          </div>
          <div className="mt-3 rounded-md bg-warn-soft border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warn mt-0.5" />
            <p className="text-[11px] text-warn font-medium leading-tight">
              3 Belege fehlen · 2 unsicher
            </p>
          </div>
          <div className="mt-2 rounded-md bg-accent-soft border border-emerald-100 p-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <p className="text-[11px] text-accent font-medium">Steuerberater-Paket: bereit zum 15.</p>
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
  tagline,
  featured = false,
}: {
  name: string;
  price: string;
  features: string[];
  tagline?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`card p-6 flex flex-col relative ${
        featured ? "ring-2 ring-brand-600 shadow-lg" : ""
      }`}
    >
      {featured ? (
        <span className="absolute -top-3 left-6 pill bg-brand-600 text-white border-brand-600">
          Beliebt
        </span>
      ) : null}
      <p className="font-bold text-xl">{name}</p>
      {tagline ? <p className="text-xs text-slate-500 mt-0.5">{tagline}</p> : null}
      <p className="mt-4">
        <span className="text-4xl font-extrabold">{price} €</span>
        <span className="text-slate-500 text-sm"> brutto / Monat</span>
      </p>
      <ul
        className="mt-5 space-y-2 flex-1">
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
        Jetzt starten
      </Link>
    </div>
  );
}
