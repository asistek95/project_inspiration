import { MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

export default function WhatsappAdminPage() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = !!process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  const connected = sid && token && from;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-brand-600" /> WhatsApp-Bot
        </h1>
        <p className="text-sm text-slate-600">
          Kunden senden Belege oder Fragen per WhatsApp — die KI antwortet.
        </p>
      </div>

      <div className={`card p-5 ${connected ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-start gap-3">
          {connected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              {connected ? "Twilio verbunden" : "Twilio noch nicht konfiguriert"}
            </p>
            <ul className="mt-2 text-sm space-y-1">
              <li>TWILIO_ACCOUNT_SID: {sid ? <code className="bg-white px-1.5 py-0.5 rounded text-xs">{sid.slice(0, 8)}…</code> : <span className="text-red-700">fehlt</span>}</li>
              <li>TWILIO_AUTH_TOKEN: {token ? <span className="text-emerald-700">gesetzt</span> : <span className="text-red-700">fehlt</span>}</li>
              <li>TWILIO_WHATSAPP_FROM: {from ? <code className="bg-white px-1.5 py-0.5 rounded text-xs">{from}</code> : <span className="text-red-700">fehlt</span>}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="font-semibold">Setup-Anleitung</p>
        <ol className="mt-3 space-y-2 text-sm list-decimal list-inside text-slate-700">
          <li>
            Twilio-Konto erstellen → <a href="https://www.twilio.com/console" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Console</a>
          </li>
          <li>
            Im Menü: <strong>Messaging → Try it out → Send a WhatsApp message</strong> (Sandbox aktivieren)
          </li>
          <li>
            ENV-Variablen in Railway setzen:
            <pre className="bg-slate-100 p-3 rounded mt-2 text-xs overflow-x-auto">{`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`}</pre>
          </li>
          <li>
            In Twilio: Webhook-URL für „When a message comes in" auf
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs mx-1">https://klarblick.com/api/whatsapp</code>
            setzen (Methode: POST)
          </li>
          <li>
            Test: Aus deinem Handy „join &lt;sandbox-code&gt;" an die Twilio-Nummer senden, dann irgendetwas senden — der Bot antwortet.
          </li>
          <li>
            Für Produktion: Eigene WhatsApp-Business-Nummer beantragen (Twilio-Support, dauert 1–2 Wochen).
          </li>
        </ol>
      </div>

      <div className="card p-5">
        <p className="font-semibold">Was der Bot kann</p>
        <ul className="mt-3 text-sm space-y-1.5 text-slate-700">
          <li>📸 Foto eines Belegs senden → KI extrahiert Daten, speichert ihn im Klarblick-Konto</li>
          <li>💬 „Wie viel hab ich diesen Monat ausgegeben?" → KI antwortet mit aktueller Auswertung</li>
          <li>📊 „Schick mir den Monatsreport" → PDF-Link wird zurückgesendet</li>
          <li>⏰ Tägliche Push: „3 Belege fehlen für deinen Monatsabschluss"</li>
        </ul>
      </div>

      <div className="card p-5">
        <p className="font-semibold">Letzte Nachrichten</p>
        <p className="text-sm text-slate-500 mt-1">
          Log wird aus Supabase-Tabelle <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">whatsapp_messages</code> geladen, sobald angelegt.
        </p>
      </div>
    </div>
  );
}
