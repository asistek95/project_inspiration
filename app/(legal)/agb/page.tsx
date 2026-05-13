export const metadata = { title: "AGB · Klarblick" };

export default function AGBPage() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-slate-700">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Allgemeine Geschäftsbedingungen</h1>
      <p className="text-sm text-slate-500">Stand: Mai 2026</p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 1 Geltungsbereich</h2>
        <p>
          Diese AGB gelten für die Nutzung der Klarblick-Software (im Folgenden „Dienst"), angeboten von Amin Sistek.
          Der Dienst richtet sich ausschließlich an Unternehmer i.S.d. § 14 BGB.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 2 Leistungsbeschreibung</h2>
        <p>
          Klarblick stellt eine Software-as-a-Service-Lösung zur automatisierten Beleg-Erfassung, -Auswertung und
          DATEV-Export-Vorbereitung bereit. Die Software ersetzt <strong>keine Steuerberatung</strong>. Alle automatisch
          erkannten Daten sind vom Nutzer zu prüfen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 3 Vertragsschluss &amp; Testphase</h2>
        <p>
          Der Vertrag kommt mit Abschluss der kostenpflichtigen Bestellung über Stripe zustande. Vor der ersten Belastung
          besteht eine <strong>14-tägige Testphase</strong> — wird innerhalb dieser Zeit gekündigt, fallen keine Kosten an.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 4 Preise &amp; Zahlung</h2>
        <p>
          Es gelten die zum Zeitpunkt der Bestellung auf <a href="/pricing" className="text-brand-600 hover:underline">/pricing</a>{" "}
          angegebenen Preise zzgl. gesetzlicher Mehrwertsteuer. Zahlung erfolgt monatlich per SEPA-Lastschrift,
          Kreditkarte oder Sofortüberweisung über Stripe.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 5 Laufzeit &amp; Kündigung</h2>
        <p>
          Der Vertrag läuft monatlich und ist <strong>jederzeit zum Monatsende kündbar</strong> über die Einstellungen
          im Konto oder formlos per E-Mail an amin.sistek20@gmail.com. Bereits gezahlte Beträge werden nicht anteilig erstattet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 6 Pflichten des Nutzers</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Korrekte Angabe von Rechnungs- und Kontaktdaten</li>
          <li>Geheimhaltung der Zugangsdaten, Aktivierung von 2FA empfohlen</li>
          <li>Keine widerrechtlich erlangten Belege Dritter hochladen</li>
          <li>Eigene Sicherungskopien wichtiger Daten (Export-Funktion verfügbar)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 7 Verfügbarkeit</h2>
        <p>
          Wir streben eine Verfügbarkeit von 99,5 % im Jahresmittel an. Wartungsfenster werden mindestens 24 Stunden
          vorher angekündigt. Keine Haftung bei höherer Gewalt oder Ausfällen von Subunternehmern (Supabase, Vercel, Stripe).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 8 Haftung</h2>
        <p>
          Wir haften unbeschränkt nur bei Vorsatz und grober Fahrlässigkeit. Im Übrigen ist die Haftung auf den
          typischerweise vorhersehbaren Schaden begrenzt, höchstens jedoch auf die Höhe der innerhalb der letzten 12
          Monate gezahlten Entgelte. Keine Haftung für entgangenen Gewinn oder Folgeschäden bei fehlerhafter OCR-Erkennung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 9 Datenschutz &amp; Datensicherheit</h2>
        <p>
          Es gilt die separate <a href="/datenschutz" className="text-brand-600 hover:underline">Datenschutzerklärung</a>.
          Bei Vertragsende stehen exportierte Daten 30 Tage zum Download bereit, danach erfolgt sichere Löschung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">§ 10 Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht. Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.
          Sollten einzelne Bestimmungen unwirksam sein, bleibt der übrige Vertrag wirksam.
        </p>
      </section>
    </article>
  );
}
