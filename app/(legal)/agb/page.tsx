import Link from "next/link";

export const metadata = { title: "AGB — Klarblick" };

export default function AGBPage() {
  return (
    <article className="space-y-8 text-sm leading-relaxed text-slate-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-sm text-slate-500 mt-2">Stand: Juni 2026 · Klarblick, Amin Sistek, 1100 Wien</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 1 Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen <strong>Amin Sistek, Klarblick</strong>,
          Wienerbergstraße 11, 1100 Wien, Österreich (nachfolgend „Anbieter") und dem jeweiligen Kunden (nachfolgend „Nutzer")
          über die Nutzung der Software-as-a-Service-Plattform <strong>Klarblick</strong> (nachfolgend „Software" oder „Dienst").
        </p>
        <p>
          Abweichende, entgegenstehende oder ergänzende AGB des Nutzers werden nicht Vertragsbestandteil, es sei denn,
          der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 2 Leistungsbeschreibung</h2>
        <p>Klarblick ist ein digitaler Monatsabschluss-Assistent für österreichische Kleinbetriebe. Der Dienst ermöglicht:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Erfassung von Eingangs- und Ausgangsbelegen per Datei-Upload, Kamera, WhatsApp oder E-Mail-Weiterleitung</li>
          <li>Automatische Erkennung von Lieferant, Datum, Betrag und Umsatzsteuer mittels KI (Claude Vision, Anthropic)</li>
          <li>Kategorisierung und Verwaltung von Belegen nach österreichischem Steuerrecht (UStG 1994)</li>
          <li>Vorbereitung der Umsatzsteuervoranmeldung (UVA) nach § 21 UStG</li>
          <li>Export von Belegdaten im DATEV-CSV-Format sowie als PDF-Report</li>
          <li>Bereitstellung einer Übergabepaket-Funktion für den Steuerberater</li>
        </ul>
        <p className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-700 not-prose">
          <strong>Wichtig:</strong> Klarblick ersetzt keine Steuerberatung, Buchhaltung oder steuerliche Vertretung.
          KI-generierte Erkennungen sind Vorschläge — keine rechtlich verbindlichen Aussagen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 3 Vertragsschluss & Registrierung</h2>
        <p>
          Der Vertrag kommt durch die Registrierung des Nutzers und die Bestätigung der E-Mail-Adresse zustande.
          Mit der Registrierung bestätigt der Nutzer, diese AGB gelesen und akzeptiert zu haben.
        </p>
        <p>
          Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
          Jede natürliche oder juristische Person darf nur ein Konto betreiben. Konten sind nicht übertragbar.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 4 Tarife & Entgelt</h2>
        <p>Der Anbieter bietet folgende Tarife an (alle Preise inkl. 20 % österreichischer Umsatzsteuer):</p>
        <table className="w-full border border-slate-200 rounded text-xs not-prose mt-2">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 font-semibold">Tarif</th>
              <th className="text-left p-3 font-semibold">Preis / Monat</th>
              <th className="text-left p-3 font-semibold">Belege / Monat</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100"><td className="p-3">Basic</td><td className="p-3">€ 20,00</td><td className="p-3">bis 30</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Betrieb</td><td className="p-3">€ 35,00</td><td className="p-3">bis 100</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Pro</td><td className="p-3">€ 50,00</td><td className="p-3">unbegrenzt</td></tr>
          </tbody>
        </table>
        <p>
          Das Entgelt wird monatlich im Voraus fällig. Bei Zahlungsverzug von mehr als 14 Tagen ist der Anbieter berechtigt,
          den Zugang zu sperren. Tarifänderungen werden mindestens 4 Wochen vorab per E-Mail mitgeteilt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 5 Kündigung & Vertragslaufzeit</h2>
        <p>
          Der Vertrag wird auf unbestimmte Zeit geschlossen und ist monatlich zum Monatsende kündbar.
          Die Kündigung erfolgt schriftlich per E-Mail an{" "}
          <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a> oder
          direkt über die Einstellungen in der App.
        </p>
        <p>
          Nach Kündigung behält der Nutzer bis zum Ende der bezahlten Periode Zugriff auf seine Daten.
          Danach werden alle personenbezogenen Daten und Belege binnen 30 Tagen gelöscht, sofern keine gesetzliche
          Aufbewahrungspflicht (§ 132 BAO: 7 Jahre) dem entgegensteht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 6 Nutzungsrechte</h2>
        <p>
          Der Anbieter räumt dem Nutzer ein einfaches, nicht übertragbares Recht ein, die Software für den eigenen
          Betrieb zu nutzen. Es ist dem Nutzer untersagt, die Software zu dekompilieren, Zugangsdaten Dritten zu überlassen,
          die Software für illegale Zwecke zu nutzen oder automatisierte Abfragen ohne Genehmigung durchzuführen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 7 Datenschutz & Datensicherheit</h2>
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt gemäß der{" "}
          <Link href="/datenschutz" className="text-brand-600 underline">Datenschutzerklärung</Link> des Anbieters
          und in Übereinstimmung mit der DSGVO (EU) 2016/679. Alle Daten werden auf EU-Servern gespeichert
          (Supabase, Frankfurt/AWS eu-central-1).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 8 Verfügbarkeit & Wartung</h2>
        <p>
          Der Anbieter strebt eine Verfügbarkeit des Dienstes von 99 % im Jahresdurchschnitt an. Ein Anspruch auf
          ununterbrochene Verfügbarkeit besteht nicht. Der Anbieter haftet nicht für Ausfälle durch Drittanbieter
          (Supabase, Railway, Twilio, Postmark, Anthropic).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 9 Haftung & Gewährleistung</h2>
        <p>
          Der Anbieter haftet nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen.
          Keine Haftung besteht insbesondere für fehlerhafte KI-Erkennungen, steuerliche Nachteile, Datenverlust durch
          höhere Gewalt oder unbefugten Zugriff Dritter. Die Haftung ist auf das in den letzten 12 Monaten gezahlte
          Entgelt begrenzt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 10 Pflichten des Nutzers</h2>
        <p>Der Nutzer verpflichtet sich, Zugangsdaten sicher aufzubewahren, nur rechtmäßige Belege hochzuladen,
          KI-generierte Erkennungen vor Weitergabe zu prüfen, und die Software nicht für illegale Aktivitäten zu nutzen.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 11 Änderungen der AGB</h2>
        <p>
          Änderungen werden mit einer Ankündigungsfrist von mindestens 4 Wochen per E-Mail mitgeteilt.
          Widerspricht der Nutzer nicht innerhalb von 2 Wochen, gelten die geänderten AGB als akzeptiert.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 12 Anwendbares Recht & Gerichtsstand</h2>
        <p>
          Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts (CISG).
          Gerichtsstand ist Wien, Österreich. Für Verbraucher im Sinne des KSchG gelten die gesetzlichen Gerichtsstände.
        </p>
        <p>
          Online-Streitbeilegung:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
            ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 13 Salvatorische Klausel</h2>
        <p>
          Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 14 Kontakt</h2>
        <p>
          Amin Sistek · Klarblick<br />
          Wienerbergstraße 11, 1100 Wien, Österreich<br />
          <a href="mailto:office@klarblick.at" className="text-brand-600 underline">office@klarblick.at</a>
        </p>
      </section>
    </article>
  );
}
