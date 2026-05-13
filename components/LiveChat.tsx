"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

type Msg = { from: "bot" | "user"; text: string; ts: number };

const FAQ: { q: RegExp; a: string }[] = [
  {
    q: /preis|kost|abo|teuer|tarif|paket/i,
    a: "Unsere Pakete: Starter 29 €, Profi 79 € (beliebt), Betrieb 149 € — alle inkl. 14 Tage gratis. Details: /pricing",
  },
  {
    q: /datev|steuerberater|export/i,
    a: "Klarblick exportiert auf Knopfdruck eine DATEV-CSV mit SKR03-Kontierung. Dein Steuerberater spart Stunden.",
  },
  {
    q: /handwerk|elektriker|sanit|maler|tischler|dach/i,
    a: "Klarblick ist speziell für Handwerker entwickelt — Baumärkte, Großhändler und KFZ-Belege werden zuverlässig erkannt.",
  },
  {
    q: /skonto|sparen|geld/i,
    a: "Unser Skonto-Alarm zeigt dir, wo du Geld liegen lässt. Im Schnitt holen Kunden über 1.200 € pro Jahr zurück.",
  },
  {
    q: /sicher|gobd|dsgvo|datenschutz/i,
    a: "Klarblick ist DSGVO- und GoBD-konform. Server in der EU, Audit-Log, optional 2FA. Details: /datenschutz",
  },
  {
    q: /kündig|monat|laufzeit/i,
    a: "Du kannst jederzeit zum Monatsende kündigen — ein Klick in den Einstellungen. Keine Knebelverträge.",
  },
  {
    q: /demo|test|ausprobieren/i,
    a: "Klar — du kannst die App ohne Anmeldung als Demo testen: /dashboard",
  },
];

const SUGGESTIONS = ["Was kostet das?", "Wie funktioniert DATEV?", "Demo ansehen", "Mit Mensch sprechen"];

function botReply(text: string): string {
  for (const { q, a } of FAQ) if (q.test(text)) return a;
  if (/mensch|berater|telefon|anrufen|persön/i.test(text))
    return "Klar — hinterlasse mir kurz deine E-Mail und Telefonnummer, dann melde ich mich innerhalb von 24 Stunden. (Schreib einfach in den Chat.)";
  return "Gute Frage — ich leite das direkt an Amin weiter. Tipp: nutze unser Kontaktformular oder schreib mir hier E-Mail + Anliegen, dann antworten wir per Mail.";
}

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! Ich bin der Klarblick-Assistent 👋 Wie kann ich helfen?", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const user: Msg = { from: "user", text: t, ts: Date.now() };
    const bot: Msg = { from: "bot", text: botReply(t), ts: Date.now() + 1 };
    setMsgs((m) => [...m, user, bot]);
    setInput("");
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
