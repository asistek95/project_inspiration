"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

type Msg = { from: "bot" | "user"; text: string; ts: number };

const FAQ: { q: RegExp; a: string }[] = [
  {
    q: /preis|kost|abo|teuer|tarif|paket/i,
    a: "Pakete: Basic 20 €, Betrieb 35 € (beliebtestes), Pro 50 € — alle inkl. 14 Tage gratis, monatlich kündbar, keine Kreditkarte nötig.",
  },
  {
    q: /datev|export/i,
    a: "Unter Übergabe → DATEV-Button. Du bekommst eine EXTF-CSV mit SKR04 Österreich — kompatibel mit DATEV, BMD und RZL. Dein Steuerberater importiert sie direkt.",
  },
  {
    q: /steuerberater|übergabe|abschluss/i,
    a: "Übergabe-Sektion aufrufen → Checkliste abhaken → dann PDF, CSV, DATEV oder SEPA herunterladen oder direkt per Mail an den Steuerberater schicken.",
  },
  {
    q: /beleg.*hochlad|upload|wie.*hochlad|sammelstelle/i,
    a: "Drei Wege: Drag & Drop in der Sammelstelle, WhatsApp-Foto an unsere Nummer schicken, oder Rechnung per E-Mail weiterleiten. Alles landet automatisch im Eingang.",
  },
  {
    q: /whatsapp/i,
    a: "Beleg fotografieren → an unsere WhatsApp-Nummer schicken → in Sekunden vorerfasst im Dashboard. Die Nummer findest du in der Sammelstelle nach der Anmeldung.",
  },
  {
    q: /uva|umsatzsteuer.*voranmeld/i,
    a: "Unter UVA berechnet Klarblick deine Kennzahlen (Umsatzsteuer-Schuld, Vorsteuer, Zahllast). Die Einreichung bei FinanzOnline macht dann dein Steuerberater.",
  },
  {
    q: /passwort|login|anmeld/i,
    a: "Eingeloggt: Einstellungen → Sicherheit. Ausgeloggt: auf der Login-Seite 'Passwort vergessen?' klicken — der Reset-Link kommt per E-Mail.",
  },
  {
    q: /handwerk|elektriker|sanit|maler|tischler|dach/i,
    a: "Klarblick ist für Handwerksbetriebe gebaut — Hornbach, Würth, GC Gienger und KFZ-Belege werden zuverlässig erkannt und automatisch kategorisiert.",
  },
  {
    q: /sicher|gobd|dsgvo|datenschutz/i,
    a: "DSGVO-konform, Audit-Log nach §132 BAO, Server in der EU (Frankfurt). Details unter /datenschutz.",
  },
  {
    q: /kündig|monat|laufzeit/i,
    a: "Jederzeit zum Monatsende kündigen — ein Klick in den Einstellungen. Keine Knebelverträge, kein Anruf nötig.",
  },
  {
    q: /demo|test|ausprobieren/i,
    a: "14 Tage gratis testen — keine Kreditkarte, kein Risiko. Einfach unter /register registrieren.",
  },
  {
    q: /kategor|buch|kontier/i,
    a: "Die KI erkennt Lieferant und Kategorie automatisch (Material, KFZ, Büro, etc.). Du kannst jederzeit manuell korrigieren — beim nächsten Beleg vom selben Lieferanten merkt sich Klarblick deine Auswahl.",
  },
];

const SUGGESTIONS = [
  "Wie lade ich einen Beleg hoch?",
  "Was kostet das?",
  "Wie funktioniert DATEV-Export?",
  "Mit Mensch sprechen",
];

function botReply(text: string): string {
  for (const { q, a } of FAQ) if (q.test(text)) return a;
  if (/mensch|berater|telefon|anrufen|persön/i.test(text))
    return "Klar — schreib uns direkt an office@klarblick.at, wir antworten innerhalb eines Werktags. Oder hinterlasse hier deine E-Mail, dann melden wir uns bei dir.";
  return "Gute Frage! Ich leite das an unser Team weiter. Am schnellsten erreichst du uns per E-Mail: office@klarblick.at";
}

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! Ich bin der Klarblick-Assistent 👋 Wie kann ich helfen?", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    const user: Msg = { from: "user", text: t, ts: Date.now() };
    const nextMsgs = [...msgs, user];
    setMsgs(nextMsgs);
    setInput("");
    setThinking(true);

    try {
      const history = nextMsgs.map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply = (data?.text as string) || botReply(t);
      setMsgs((m) => [...m, { from: "bot", text: reply, ts: Date.now() }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: botReply(t), ts: Date.now() }]);
    } finally {
      setThinking(false);
    }
  }

  async function escalate(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const transcript = msgs.map((m) => `${m.from.toUpperCase()}: ${m.text}`).join("\n");
    // FormSubmit – sendet an amin.sistek20@gmail.com
    try {
      await fetch("https://formsubmit.co/ajax/amin.sistek20@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Klarblick Chat-Anfrage",
          email,
          transcript,
        }),
      });
    } catch {
      /* still ok in demo */
    }
    setSent(true);
    setMsgs((m) => [
      ...m,
      { from: "bot", text: `Danke! Wir melden uns bei ${email} innerhalb von 24 Stunden.`, ts: Date.now() },
    ]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 grid place-content-center transition"
        aria-label="Chat öffnen"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-brand-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-white/15 grid place-content-center">
                <Bot className="h-4 w-4" />
              </span>
              <div className="text-sm">
                <p className="font-semibold leading-tight">Klarblick-Assistent</p>
                <p className="text-xs text-white/80">Antwortet in Sekunden</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Schließen" className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.from === "bot"
                    ? "bg-white border border-border text-slate-800 rounded-bl-sm"
                    : "ml-auto bg-brand-600 text-white rounded-br-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
            {thinking ? (
              <div className="bg-white border border-border text-slate-500 rounded-2xl rounded-bl-sm max-w-[60%] px-3 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                </span>
              </div>
            ) : null}
            {msgs.length <= 2 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:bg-brand-50 hover:border-brand-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!sent ? (
            <form
              onSubmit={escalate}
              className="px-3 py-2 border-t border-border bg-white flex items-center gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail für Rückmeldung (optional)"
                className="text-xs px-2 py-1 border border-border rounded flex-1 min-w-0"
              />
              <button type="submit" className="text-xs text-brand-600 font-medium hover:underline" disabled={!email}>
                Senden
              </button>
            </form>
          ) : null}

          <div className="px-3 py-2 border-t border-border bg-white flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Schreib uns …"
              className="input !py-2 flex-1"
            />
            <button
              onClick={() => send(input)}
              className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-content-center hover:bg-brand-700 shrink-0"
              aria-label="Senden"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
