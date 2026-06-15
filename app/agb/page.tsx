import Link from "next/link";

export const metadata = { title: "AGB — Klarblick" };

export default function AgbPage() {
  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-border py-4 px-6">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <img src="/klar.png" alt="Klarblick" className="h-8 w-8 object-contain" />
          Klarblick
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-slate-500 mb-10">Stand: Juni 2026 · Klarblick, Amin Sistek, 1100 Wien</p>

        <div className="prose prose-slate max-w-none space-y-10 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 1 Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen <strong>Amin Sistek, Klarblick</strong>
              , Wienerbergstraße 11, 1100 Wien, Österreich (nachfolgend „Anbieter") und dem jeweiligen Kunden (nachfolgend „Nutzer")
              über die Nutzung der Software-as-a-Service-Plattform <strong>Klarblick</strong> (nachfolgend „Software" oder „Dienst").
            </p>
            <p className="mt-2">
              Abweichende, entgegenstehende oder ergänzende AGB des Nutzers werden nicht Vertragsbestandteil, es sei denn,
              der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 2 Leistungsbeschreibung</h2>
            <p>
              Klarblick ist ein digitaler Monatsabschluss-Assistent für österreichische Kleinbetriebe. Der Dienst ermöglicht:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Erfassung von Eingangs- und Ausgangsbelegen per Datei-Upload, Kamera, WhatsApp oder E-Mail-Weiterleitung</li>
              <li>Automatische Erkennung von Lieferant, Datum, Betrag und Umsatzsteuer mittels KI (Claude Vision, Anthropic)</li>
              <li>Kategorisierung und Verwaltung von Belegen nach österreichischem Steuerrecht (UStG 1994)</li>
              <li>Vorbereitung der Umsatzsteuervoranmeldung (UVA) nach § 21 UStG</li>
              <li>Export von Belegdaten im DATEV-CSV-Format sowie als PDF-Report</li>
              <li>Bereitstellung einer Übergabepaket-Funktion für den Steuerberater</li>
            </ul>
            <p className="mt-3 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              <strong>Wichtig:</strong> Klarblick ersetzt keine Steuerberatung, Buchhaltung oder steuerliche Vertretung.
              Die finale Prüfung, Buchung und Einreichung von Steuererklärungen obliegt ausschließlich dem Steuerberater des Nutzers.
              KI-generierte Erkennungen sind Vorschläge — keine rechtlich verbindlichen Aussagen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 3 Vertragsschluss & Registrierung</h2>
            <p>
              Der Vertrag kommt durch die Registrierung des Nutzers auf <strong>app.klarblick.at</strong> und die Bestätigung
              der E-Mail-Adresse zustande. Mit der Registrierung bestätigt der Nutzer, diese AGB gelesen und akzeptiert zu haben.
            </p>
            <p className="mt-2">
              Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
              Jede natürliche oder juristische Person darf nur ein Konto betreiben. Konten sind nicht übertragbar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 4 Tarife & Entgelt</h2>
            <p>Der Anbieter bietet folgende Tarife an (alle Preise inkl. 20 % österreichischer Umsatzsteuer):</p>
            <table className="w-full mt-3 border border-slate-200 rounded text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Tarif</th>
                  <th className="text-left p-3 font-semibold">Preis / Monat</th>
                  <th className="text-left p-3 font-semibold">Belege / Monat</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <td className="p-3">Basic</td><td className="p-3">€ 20,00</td><td className="p-3">bis 30</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="p-3">Betrieb</td><td className="p-3">€ 35,00</td><td className="p-3">bis 100</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="p-3">Pro</td><td className="p-3">€ 50,00</td><td className="p-3">unbegrenzt</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              Das Entgelt wird monatlich im Voraus fällig. Rechnungen werden per E-Mail übermittelt.
              Bei Zahlungsverzug von mehr als 14 Tagen ist der Anbieter berechtigt, den Zugang zu sperren.
            </p>
            <p className="mt-2">
              Tarifänderungen werden dem Nutzer mindestens 4 Wochen vor Wirksamwerden per E-Mail mitgeteilt.
              Widerspricht der Nutzer nicht innerhalb von 2 Wochen nach Mitteilung, gilt die Änderung als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 5 Kündigung & Vertragslaufzeit</h2>
            <p>
              Der Vertrag wird auf unbestimmte Zeit geschlossen und ist monatlich zum Monatsende kündbar.
              Die Kündigung erfolgt schriftlich per E-Mail an <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a> oder
              direkt über die Einstellungen in der App.
            </p>
            <p className="mt-2">
              Nach Kündigung behält der Nutzer bis zum Ende der bezahlten Periode Zugriff auf seine Daten.
              Danach werden alle personenbezogenen Daten und Belege binnen 30 Tagen gelöscht, sofern keine gesetzliche
              Aufbewahrungspflicht (§ 132 BAO: 7 Jahre) dem entgegensteht.
            </p>
            <p className="mt-2">
              Der Anbieter kann den Vertrag aus wichtigem Grund fristlos kündigen, insbesondere bei Verstößen gegen diese AGB
              oder missbräuchlicher Nutzung.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 6 Nutzungsrechte</h2>
            <p>
              Der Anbieter räumt dem Nutzer ein einfaches, nicht übertragbares und nicht unterlizenzierbares Recht ein,
              die Software für den eigenen Betrieb zu nutzen. Das Recht ist auf die Laufzeit des Vertrags beschränkt.
            </p>
            <p className="mt-2">Es ist dem Nutzer untersagt:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Die Software zu dekompilieren, zu disassemblieren oder anderweitig zu reverse-engineeren</li>
              <li>Zugangsdaten Dritten zu überlassen (außer im Rahmen gebuchter Teamlizenzen)</li>
              <li>Die Software für illegale Zwecke oder zur Verarbeitung rechtswidriger Inhalte zu nutzen</li>
              <li>Automatisierte Abfragen (Scraping, Bots) ohne schriftliche Genehmigung des Anbieters durchzuführen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 7 Datenschutz & Datensicherheit</h2>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß der <Link href="/datenschutz" className="text-brand-600 underline">Datenschutzerklärung</Link> des Anbieters
              und in Übereinstimmung mit der DSGVO (EU) 2016/679.
            </p>
            <p className="mt-2">
              Alle Daten werden auf EU-Servern gespeichert (Supabase, Frankfurt/AWS eu-central-1). Für die KI-gestützte
              Belegerkennung werden Bilddaten temporär an die Anthropic API (USA) übermittelt; ein Auftragsverarbeitungsvertrag
              (AVV) besteht. Belegbilder werden von Anthropic nicht für Trainingszwecke verwendet.
            </p>
            <p className="mt-2">
              Der Nutzer ist für die Rechtmäßigkeit der in Klarblick eingegebenen Daten verantwortlich.
              Der Anbieter verarbeitet diese Daten ausschließlich als Auftragsverarbeiter im Sinne des Art. 28 DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 8 Verfügbarkeit & Wartung</h2>
            <p>
              Der Anbieter strebt eine Verfügbarkeit des Dienstes von 99 % im Jahresdurchschnitt an (gemessen ohne geplante Wartungsfenster).
              Geplante Wartungsarbeiten werden dem Nutzer mindestens 24 Stunden im Voraus mitgeteilt.
            </p>
            <p className="mt-2">
              Ein Anspruch auf ununterbrochene Verfügbarkeit besteht nicht. Der Anbieter haftet nicht für Ausfälle,
              die durch Drittanbieter (Supabase, Railway, Twilio, Postmark, Anthropic) verursacht werden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 9 Haftung & Gewährleistung</h2>
            <p>
              Der Anbieter haftet nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen.
              Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten),
              und auch dann nur bis zur Höhe des vorhersehbaren, typischen Schadens.
            </p>
            <p className="mt-2">
              <strong>Keine Haftung</strong> besteht insbesondere für:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Fehlerhafte KI-Erkennungen (falsche Beträge, Lieferantenzuordnung, MwSt-Sätze)</li>
              <li>Steuerliche oder rechtliche Nachteile, die aus der Nutzung entstehen</li>
              <li>Datenverlust durch höhere Gewalt oder Drittanbieter-Ausfälle</li>
              <li>Schäden durch unbefugten Zugriff Dritter, die nicht auf eine Pflichtverletzung des Anbieters zurückzuführen sind</li>
            </ul>
            <p className="mt-2">
              Die Haftung ist in jedem Fall auf das in den letzten 12 Monaten vom Nutzer gezahlte Entgelt begrenzt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 10 Pflichten des Nutzers</h2>
            <p>Der Nutzer verpflichtet sich:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Zugangsdaten sicher aufzubewahren und bei Verdacht auf Kompromittierung unverzüglich zu ändern</li>
              <li>Nur rechtmäßig erstellte oder erhaltene Belege hochzuladen</li>
              <li>KI-generierte Erkennungen vor Weitergabe an Steuerberater oder Finanzbehörden zu prüfen</li>
              <li>Den Anbieter unverzüglich über Sicherheitsvorfälle oder Datenpannen zu informieren</li>
              <li>Die Software nicht für Zwecke der Geldwäsche, Steuerhinterziehung oder sonstige illegale Aktivitäten zu nutzen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 11 Änderungen der AGB</h2>
            <p>
              Der Anbieter behält sich vor, diese AGB mit einer Ankündigungsfrist von mindestens 4 Wochen zu ändern.
              Die Ankündigung erfolgt per E-Mail an die hinterlegte Adresse. Widerspricht der Nutzer nicht innerhalb von
              2 Wochen nach Mitteilung, gelten die geänderten AGB als akzeptiert. Auf dieses Widerspruchsrecht und die
              Folgen des Schweigens wird in der Ankündigung ausdrücklich hingewiesen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 12 Anwendbares Recht & Gerichtsstand</h2>
            <p>
              Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts (CISG).
            </p>
            <p className="mt-2">
              Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist,
              soweit gesetzlich zulässig, Wien, Österreich. Für Verbraucher im Sinne des KSchG gelten die
              gesetzlichen Gerichtsstände.
            </p>
            <p className="mt-2">
              Informationen zur Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 13 Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden,
              bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt. Die unwirksame Bestimmung
              wird durch eine wirksame ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung
              am nächsten kommt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">§ 14 Kontakt</h2>
            <p>
              Amin Sistek · Klarblick<br />
              Wienerbergstraße 11, 1100 Wien, Österreich<br />
              E-Mail: <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500">
          <Link href="/impressum" className="hover:text-slate-700">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-slate-700">Datenschutz</Link>
          <Link href="/" className="hover:text-slate-700">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  );
}
