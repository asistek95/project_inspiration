import Link from "next/link";

export const metadata = { title: "Impressum — Klarblick" };

export default function ImpressumPage() {
  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-border py-4 px-6">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <img src="/klar.png" alt="Klarblick" className="h-8 w-8 object-contain" />
          Klarblick
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Impressum</h1>
        <p className="text-slate-500 mb-10">gemäß § 5 E-Commerce-Gesetz (ECG) und § 14 UGB</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Informationspflicht laut § 5 ECG</h2>
            <p>
              <strong>Amin Sistek</strong><br />
              Klarblick<br />
              Wienerbergstraße 11<br />
              1100 Wien<br />
              Österreich
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Kontakt</h2>
            <p>
              E-Mail: <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Unternehmensgegenstand</h2>
            <p>Software-as-a-Service (SaaS) für digitale Belegerfassung und Monatsabschluss-Vorbereitung für österreichische Kleinbetriebe.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Aufsichtsbehörde</h2>
            <p>
              Magistrat der Stadt Wien / Wirtschaftskammer Wien<br />
              Mitglied der Wirtschaftskammer Wien, Fachgruppe Unternehmensberatung und Informationstechnologie
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Der Anbieter übernimmt jedoch keine
              Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte. Die Nutzung der
              Inhalte der Website erfolgt auf eigene Gefahr des Nutzers.
            </p>
            <p className="mt-2">
              Für externe Links zu fremden Webseiten übernimmt der Anbieter keine Haftung.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Urheberrecht</h2>
            <p>
              Die auf dieser Website veröffentlichten Inhalte und Werke sind urheberrechtlich geschützt.
              Jede vom österreichischen Urheberrechtsgesetz nicht zugelassene Verwertung bedarf der vorherigen
              schriftlichen Zustimmung des Anbieters.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">Online-Streitbeilegung</h2>
            <p>
              Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                ec.europa.eu/consumers/odr
              </a>.
              Wir sind bereit, an außergerichtlichen Streitbeilegungsverfahren teilzunehmen.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500">
          <Link href="/agb" className="hover:text-slate-700">AGB</Link>
          <Link href="/datenschutz" className="hover:text-slate-700">Datenschutz</Link>
          <Link href="/" className="hover:text-slate-700">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  );
}
