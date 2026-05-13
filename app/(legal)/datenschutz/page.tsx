export const metadata = { title: "Datenschutzerklärung · Klarblick" };

export default function DatenschutzPage() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-slate-700">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Datenschutzerklärung</h1>
      <p className="text-sm text-slate-500">Stand: Mai 2026</p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">1. Verantwortlicher</h2>
        <p>
          Amin Sistek · E-Mail:{" "}
          <a href="mailto:amin.sistek20@gmail.com" className="text-brand-600 hover:underline">amin.sistek20@gmail.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">2. Welche Daten wir verarbeiten</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Konto-Daten</strong>: E-Mail-Adresse, Passwort-Hash, Firmenname (Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung).</li>
          <li><strong>Beleg-Daten</strong>: Hochgeladene Belege (PDF / Foto) sowie automatisch ausgelesene Felder (Lieferant, Datum, Beträge, MwSt). Speicherung in deinem eigenen, geschützten Workspace.</li>
          <li><strong>Zahlungsdaten</strong>: Werden ausschließlich von Stripe verarbeitet. Wir speichern nur eine Kunden-ID und Rechnungshistorie.</li>
          <li><strong>Technische Daten</strong>: IP-Adresse, Browser, Login-Zeit (zur Sicherheit, max. 30 Tage).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">3. Auftragsverarbeiter</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> (Hosting Datenbank &amp; Authentifizierung) — EU-Server, AVV abgeschlossen.</li>
          <li><strong>Stripe Payments Europe Ltd.</strong> (Zahlungsabwicklung) — siehe stripe.com/de/privacy.</li>
          <li><strong>Vercel Inc.</strong> (App-Hosting) — Frankfurt EU-Region.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">4. Speicherdauer</h2>
        <p>
          Beleg-Daten werden nach den gesetzlichen Aufbewahrungsfristen (§ 147 AO: 10 Jahre für Rechnungen) gespeichert,
          sofern du sie nicht früher löschst. GoBD-relevante, freigegebene Belege sind unveränderlich archiviert.
          Nach Kontolöschung werden Daten 30 Tage als Backup gehalten, dann endgültig gelöscht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">5. E-Mail-Forwarding (optional)</h2>
        <p>
          Wenn du E-Mails an deine persönliche Klarblick-Inbox (z.B. <em>du+klarblick@firma.de</em>) weiterleitest,
          verarbeiten wir den Anhang (PDF / Bild) per OCR. <strong>E-Mail-Inhalte werden nicht dauerhaft gespeichert</strong>,
          nur die extrahierten Beleg-Daten. Quelle: dein eigener Mail-Server — wir scannen keine fremden Postfächer.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">6. Deine Rechte (Art. 15–22 DSGVO)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Auskunft über gespeicherte Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung („Recht auf Vergessenwerden")</li>
          <li>Einschränkung der Verarbeitung</li>
          <li>Datenübertragbarkeit (Export als JSON / CSV)</li>
          <li>Widerspruch gegen Verarbeitung</li>
          <li>Beschwerde bei der Aufsichtsbehörde</li>
        </ul>
        <p>Anfragen formlos an <a className="text-brand-600 hover:underline" href="mailto:amin.sistek20@gmail.com">amin.sistek20@gmail.com</a>.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">7. Cookies &amp; Tracking</h2>
        <p>
          Wir nutzen ausschließlich technisch notwendige Cookies (Session-Cookie zum Login). Kein Tracking, kein Google
          Analytics, keine Werbe-Pixel. Die Standort-Karte wird über OpenStreetMap eingebunden — keine personenbezogene Auswertung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">8. Sicherheit</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>TLS 1.3 Verschlüsselung für alle Verbindungen</li>
          <li>Passwörter via bcrypt gehasht</li>
          <li>Optionale Zwei-Faktor-Authentifizierung (2FA)</li>
          <li>Row-Level-Security: niemand sieht fremde Daten</li>
          <li>Tägliche verschlüsselte Backups</li>
        </ul>
      </section>
    </article>
  );
}
