export const metadata = { title: "Datenschutz — Klarblick" };

export default function DatenschutzPage() {
  return (
    <article className="space-y-8 text-sm leading-relaxed text-slate-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-500 mt-2">Stand: Juni 2026 · gemäß DSGVO (EU) 2016/679 und DSG 2018</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">1. Verantwortlicher</h2>
        <p>
          <strong>Amin Sistek · Klarblick</strong><br />
          Wienerbergstraße 11, 1100 Wien, Österreich<br />
          E-Mail:{" "}
          <a href="mailto:office@klarblick.at" className="text-brand-600 hover:underline">office@klarblick.at</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">2. Welche Daten wir verarbeiten</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Konto-Daten:</strong> Name, E-Mail-Adresse, Passwort-Hash, Firmenname (Art. 6 Abs. 1 lit. b DSGVO).</li>
          <li><strong>Beleg-Daten:</strong> Hochgeladene Bilder/PDFs sowie automatisch erkannte Felder (Lieferant, Datum, Betrag, MwSt-Satz). Gespeichert in deinem eigenen, geschützten Workspace.</li>
          <li><strong>WhatsApp-Kommunikation:</strong> Mediendateien und Rufnummer bei Beleg-Versand via WhatsApp (Twilio).</li>
          <li><strong>E-Mail-Weiterleitung:</strong> Absender, Betreff und Anhänge bei Weiterleitung an deine Klarblick-Inbound-Adresse.</li>
          <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Zugriffszeitpunkte (max. 30 Tage, nur zur IT-Sicherheit).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">3. KI-gestützte Belegverarbeitung</h2>
        <p>
          Für die automatische Erkennung von Belegdaten (OCR) werden Bilder temporär an die
          <strong> Anthropic API</strong> (USA) übermittelt. Anthropic verarbeitet diese Daten ausschließlich
          zur Erbringung der API-Leistung und verwendet sie nicht für KI-Training.
          Die Übermittlung in die USA erfolgt auf Basis der EU-Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">4. Auftragsverarbeiter</h2>
        <table className="w-full border border-slate-200 rounded text-xs not-prose">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 font-semibold">Anbieter</th>
              <th className="text-left p-3 font-semibold">Zweck</th>
              <th className="text-left p-3 font-semibold">Serverstandort</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100"><td className="p-3">Supabase Inc.</td><td className="p-3">Datenbank, Auth, Speicher</td><td className="p-3">AWS Frankfurt (EU)</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Railway</td><td className="p-3">App-Hosting</td><td className="p-3">USA</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Anthropic PBC</td><td className="p-3">KI-Belegerkennung (Claude Vision)</td><td className="p-3">USA</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Twilio Inc.</td><td className="p-3">WhatsApp-Inbound</td><td className="p-3">USA</td></tr>
            <tr className="border-t border-slate-100"><td className="p-3">Postmark (Wildbit)</td><td className="p-3">E-Mail-Inbound</td><td className="p-3">USA</td></tr>
          </tbody>
        </table>
        <p className="text-xs text-slate-500">Alle Anbieter sind im EU-US Data Privacy Framework zertifiziert oder es bestehen SCC. AVV-Verträge liegen vor.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">5. Speicherdauer</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Beleg-Daten: für die Dauer der Vertragslaufzeit + 30 Tage nach Kündigung</li>
          <li>Steuerlich relevante Belege: 7 Jahre (§ 132 BAO)</li>
          <li>Nutzungs-Logs: max. 30 Tage</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">6. Deine Rechte (Art. 15–22 DSGVO)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Auskunft über gespeicherte Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung („Recht auf Vergessenwerden")</li>
          <li>Einschränkung der Verarbeitung</li>
          <li>Datenübertragbarkeit (Export als CSV / JSON)</li>
          <li>Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen</li>
        </ul>
        <p>
          Anfragen an:{" "}
          <a className="text-brand-600 hover:underline" href="mailto:office@klarblick.at">office@klarblick.at</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">7. Beschwerderecht</h2>
        <p>
          <strong>Österreichische Datenschutzbehörde</strong><br />
          Barichgasse 40–42, 1030 Wien ·{" "}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">www.dsb.gv.at</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">8. Cookies & Tracking</h2>
        <p>
          Klarblick verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung (Session-Token).
          Kein Google Analytics, keine Werbe-Pixel, kein Social-Media-Tracking.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">9. Sicherheit</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>TLS 1.3 Verschlüsselung für alle Verbindungen</li>
          <li>Passwörter via bcrypt gehasht (Supabase Auth)</li>
          <li>Row-Level-Security: kein Nutzer sieht fremde Daten</li>
          <li>Tägliche verschlüsselte Backups</li>
        </ul>
      </section>
    </article>
  );
}
