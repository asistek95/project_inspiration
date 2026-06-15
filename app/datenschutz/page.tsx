import Link from "next/link";

export const metadata = { title: "Datenschutz — Klarblick" };

export default function DatenschutzPage() {
  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-border py-4 px-6">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <img src="/klar.png" alt="Klarblick" className="h-8 w-8 object-contain" />
          Klarblick
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Datenschutzerklärung</h1>
        <p className="text-slate-500 mb-10">Stand: Juni 2026 · gemäß DSGVO (EU) 2016/679 und DSG 2018</p>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher für die Datenverarbeitung im Sinne der DSGVO ist:<br /><br />
              <strong>Amin Sistek · Klarblick</strong><br />
              Wienerbergstraße 11, 1100 Wien, Österreich<br />
              E-Mail: <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Welche Daten wir verarbeiten</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">2.1 Registrierungsdaten</p>
                <p>Name, E-Mail-Adresse, Unternehmensname, gehashtes Passwort (via Supabase Auth). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
              </div>
              <div>
                <p className="font-semibold">2.2 Belegdaten</p>
                <p>Hochgeladene Bilder und Dokumente (Rechnungen, Kassenbons), daraus extrahierte Felder (Lieferant, Datum, Betrag, MwSt-Satz, Kategorie). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
              </div>
              <div>
                <p className="font-semibold">2.3 WhatsApp-Kommunikation</p>
                <p>Wenn Sie Belege per WhatsApp an unsere Nummer senden, verarbeiten wir die übermittelten Mediendateien sowie Ihre WhatsApp-Rufnummer (via Twilio). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
              </div>
              <div>
                <p className="font-semibold">2.4 E-Mail-Weiterleitung</p>
                <p>Wenn Sie Rechnungen an Ihre persönliche Klarblick-Inbound-Adresse weiterleiten, verarbeiten wir Absender, Betreff und Anhänge. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
              </div>
              <div>
                <p className="font-semibold">2.5 Nutzungsdaten / Logs</p>
                <p>IP-Adressen, Browser-Typ, Zugriffszeitpunkte (Server-Logs für max. 30 Tage gespeichert). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an IT-Sicherheit).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. KI-gestützte Belegverarbeitung</h2>
            <p>
              Für die automatische Erkennung von Belegdaten (OCR) werden Bilder temporär an die
              <strong> Anthropic API</strong> (USA) übermittelt. Anthropic verarbeitet diese Daten ausschließlich zur
              Erbringung der API-Leistung und verwendet sie nicht für das Training von KI-Modellen.
              Es besteht ein Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO.
              Die Übermittlung in die USA erfolgt auf Basis der EU-Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Auftragsverarbeiter & Drittanbieter</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Anbieter</th>
                    <th className="text-left p-3 font-semibold">Zweck</th>
                    <th className="text-left p-3 font-semibold">Serverstandort</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Supabase Inc. (USA)</td>
                    <td className="p-3">Datenbank, Authentifizierung, Dateispeicher</td>
                    <td className="p-3">AWS eu-central-1 (Frankfurt)</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Railway (USA)</td>
                    <td className="p-3">Hosting der Web-Applikation</td>
                    <td className="p-3">US-East (variabel)</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Anthropic PBC (USA)</td>
                    <td className="p-3">KI-gestützte Belegerkennung (Claude Vision)</td>
                    <td className="p-3">USA</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Twilio Inc. (USA)</td>
                    <td className="p-3">WhatsApp-Nachrichten-Empfang</td>
                    <td className="p-3">USA</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Postmark (Wildbit, USA)</td>
                    <td className="p-3">E-Mail-Inbound-Verarbeitung</td>
                    <td className="p-3">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Alle genannten Anbieter sind im EU-US Data Privacy Framework zertifiziert oder es bestehen SCC.
              AVV-Verträge liegen vor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Speicherdauer</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Belegdaten: für die Dauer der Vertragslaufzeit + 30 Tage nach Kündigung</li>
              <li>Steuerlich relevante Belege (§ 132 BAO): 7 Jahre ab Buchungsjahr</li>
              <li>Nutzungs-Logs: max. 30 Tage</li>
              <li>E-Mail-Kommunikation: max. 3 Jahre (Verjährungsfrist)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Ihre Rechte</h2>
            <p>Sie haben folgende Rechte gegenüber uns bezüglich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15 DSGVO): welche Daten wir über Sie speichern</li>
              <li><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten</li>
              <li><strong>Löschung</strong> (Art. 17 DSGVO): Löschung Ihrer Daten, soweit keine Aufbewahrungspflicht</li>
              <li><strong>Einschränkung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Export Ihrer Daten im maschinenlesbaren Format</li>
              <li><strong>Widerspruch</strong> (Art. 21 DSGVO): gegen Verarbeitung auf Basis berechtigter Interessen</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich an:{" "}
              <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde zu beschweren:
            </p>
            <p className="mt-2">
              <strong>Österreichische Datenschutzbehörde</strong><br />
              Barichgasse 40–42, 1030 Wien<br />
              <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">www.dsb.gv.at</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Cookies & Tracking</h2>
            <p>
              Klarblick verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung (Session-Token).
              Es werden keine Tracking-, Analyse- oder Werbe-Cookies eingesetzt. Es werden keine Daten an
              Werbenetze, Social-Media-Plattformen oder Analysedienste übertragen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Änderungen dieser Erklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die jeweils aktuelle
              Version ist unter <strong>/datenschutz</strong> abrufbar. Wesentliche Änderungen werden per
              E-Mail mitgeteilt.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500">
          <Link href="/agb" className="hover:text-slate-700">AGB</Link>
          <Link href="/impressum" className="hover:text-slate-700">Impressum</Link>
          <Link href="/" className="hover:text-slate-700">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  );
}
