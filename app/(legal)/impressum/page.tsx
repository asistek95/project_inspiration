export const metadata = { title: "Impressum · Klarblick" };

export default function ImpressumPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Impressum</h1>
      <p className="text-sm text-slate-500">Angaben gemäß § 5 TMG</p>

      <section>
        <h2 className="text-xl font-bold">Anbieter</h2>
        <p>
          Klarblick (in Gründung)<br />
          Inhaber: Amin Sistek<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Kontakt</h2>
        <p>
          E-Mail: <a className="text-brand-600 hover:underline" href="mailto:amin.sistek20@gmail.com">amin.sistek20@gmail.com</a>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Umsatzsteuer-ID</h2>
        <p className="text-sm text-slate-600">Wird nach Gewerbeanmeldung ergänzt.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>Amin Sistek (Anschrift wie oben)</p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Streitschlichtung</h2>
        <p className="text-sm text-slate-600">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          {" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Haftungsausschluss</h2>
        <p className="text-sm text-slate-600">
          Klarblick ist eine Software zur Beleg-Erfassung und Vorbereitung von Auswertungen. Die App ersetzt
          <strong> keine Steuerberatung</strong>. Alle automatisch erkannten Daten müssen vom Nutzer geprüft werden.
          Für Richtigkeit der durch OCR ausgelesenen Daten wird keine Gewähr übernommen.
        </p>
      </section>
    </article>
  );
}
