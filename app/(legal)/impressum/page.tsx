export const metadata = { title: "Impressum — Klarblick" };

export default function ImpressumPage() {
  return (
    <article className="space-y-8 text-sm leading-relaxed text-slate-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Impressum</h1>
        <p className="text-sm text-slate-500 mt-2">gemäß § 5 E-Commerce-Gesetz (ECG) und § 14 UGB</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Angaben gemäß § 5 ECG</h2>
        <p>
          <strong>Amin Sistek</strong><br />
          Klarblick<br />
          Wienerbergstraße 11<br />
          1100 Wien<br />
          Österreich
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a className="text-brand-600 hover:underline" href="mailto:office@klarblick.at">office@klarblick.at</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Unternehmensgegenstand</h2>
        <p>Software-as-a-Service (SaaS) für digitale Belegerfassung und Monatsabschluss-Vorbereitung für österreichische Kleinbetriebe.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Aufsichtsbehörde</h2>
        <p>Wirtschaftskammer Wien, Fachgruppe Unternehmensberatung und Informationstechnologie</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Der Anbieter übernimmt jedoch keine
          Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte.
          Klarblick ist eine Software zur Belegerfassung und Vorbereitung von Auswertungen — sie ersetzt
          keine Steuerberatung. Für externe Links zu fremden Webseiten übernimmt der Anbieter keine Haftung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Urheberrecht</h2>
        <p>
          Die auf dieser Website veröffentlichten Inhalte sind urheberrechtlich geschützt.
          Jede nicht vom österreichischen Urheberrechtsgesetz zugelassene Verwertung bedarf der vorherigen
          schriftlichen Zustimmung des Anbieters.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Online-Streitbeilegung</h2>
        <p>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind bereit, an außergerichtlichen Streitbeilegungsverfahren teilzunehmen.
        </p>
      </section>
    </article>
  );
}
