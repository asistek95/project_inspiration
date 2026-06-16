"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, Trash2 } from "lucide-react";

type Msg = { from: "bot" | "user"; text: string; ts: number };

interface LiveChatProps {
  /** If set, messages are persisted to localStorage under this key. */
  persistKey?: string;
  /** Current app route — sent to AI so it can give context-aware answers. */
  pageContext?: string;
}

// ── Page-specific context labels ────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":   "Dashboard (Übersicht & KPIs)",
  "/upload":      "Sammelstelle (Belege hochladen per Drag&Drop, WhatsApp, E-Mail)",
  "/inbox":       "Eingang (KI-Verarbeitungs-Queue, Belege prüfen & korrigieren)",
  "/receipts":    "Belegliste (filtern, bearbeiten, kategorisieren)",
  "/report":      "Auswertung (Kategorien-Diagramm, Monatsbericht)",
  "/uva":         "UVA-Vorerfassung (Umsatzsteuer-Kennzahlen berechnen)",
  "/tax-advisor": "Steuerberater-Übergabe (Downloads: PDF, DATEV-CSV, SEPA-XML)",
  "/settings":    "Einstellungen (Firma, ATU-Nummer, Abo, Passwort)",
};

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/upload":      ["Wie lade ich per WhatsApp hoch?", "Welche Dateiformate gehen?", "E-Mail-Eingang einrichten", "Was passiert nach dem Upload?"],
  "/inbox":       ["Warum ist ein Beleg 'unsicher'?", "Was ist Reverse Charge?", "Wie korrigiere ich erkannte Daten?", "Was erkennt die KI alles?"],
  "/receipts":    ["Wie ändere ich die Kategorie?", "Was bedeutet Status 'Offen'?", "Wie markiere ich als bezahlt?", "Wie filtere ich Belege?"],
  "/report":      ["Was zeigt das Diagramm?", "Was ist der Schätz-Gewinn?", "Wie lese ich die Auswertung?"],
  "/uva":         ["Was ist die UVA?", "Was ist die Zahllast?", "Wer reicht die UVA ein?", "Vorsteuer §12 — was heißt das?"],
  "/tax-advisor": ["Wie exportiere ich DATEV?", "Was ist im Steuerberater-Paket?", "Was ist der SEPA-Export?", "Wie schicke ich an den StB?"],
  "/settings":    ["Wo trage ich die ATU-Nummer ein?", "Wie kündige ich?", "Wie ändere ich das Passwort?"],
};

const DEFAULT_SUGGESTIONS = [
  "Wie lade ich einen Beleg hoch?",
  "Was kostet das?",
  "Wie funktioniert DATEV-Export?",
  "Mit Mensch sprechen",
];

// ── Offline fallback FAQ ────────────────────────────────────────────────────

const FAQ: { q: RegExp; a: string }[] = [
  {
    q: /preis|kost|abo|teuer|tarif|paket/i,
    a: "Pakete: Basic 20 €, Betrieb 35 € (beliebtestes), Pro 50 € — alle inkl. 14 Tage gratis, monatlich kündbar, keine Kreditkarte nötig.",
  },
  {
    q: /datev|export/i,
    a: "Unter Übergabe → DATEV-Button. Du bekommst eine EXTF-CSV mit SKR04 Österreich — kompatibel mit DATEV, BMD und RZL.",
  },
  {
    q: /steuerberater|übergabe|abschluss/i,
    a: "Übergabe-Sektion aufrufen → Checkliste abhaken → PDF, CSV, DATEV oder SEPA herunterladen oder direkt per Mail an den Steuerberater schicken.",
  },
  {
    q: /beleg.*hochlad|upload|wie.*hochlad|sammelstelle/i,
    a: "Drei Wege: Drag & Drop in der Sammelstelle, WhatsApp-Foto schicken, oder Rechnung per E-Mail weiterleiten. Alles landet automatisch im Eingang.",
  },
  {
    q: /whatsapp/i,
    a: "Beleg fotografieren → an unsere WhatsApp-Nummer schicken → in Sekunden vorerfasst. Die Nummer findest du in der Sammelstelle.",
  },
  {
    q: /uva|umsatzsteuer.*voranmeld/i,
    a: "Unter UVA berechnet Klarblick deine Kennzahlen (Umsatzsteuer-Schuld, Vorsteuer, Zahllast). Die Einreichung bei FinanzOnline macht dein Steuerberater.",
  },
  {
    q: /passwort|login|anmeld/i,
    a: "Eingeloggt: Einstellungen → Sicherheit. Ausgeloggt: auf der Login-Seite 'Passwort vergessen?' klicken — der Reset-Link kommt per E-Mail.",
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
    a: "Die KI erkennt Lieferant und Kategorie automatisch. Du kannst jederzeit manuell korrigieren — beim nächsten Beleg vom selben Lieferanten merkt sich Klarblick deine Auswahl.",
  },
];

function botReply(text: string): string {
  for (const { q, a } of FAQ) if (q.test(text)) return a;
  if (/mensch|berater|telefon|anrufen|persön/i.test(text))
    return "Klar — schreib uns direkt an office@klarblick.at, wir antworten innerhalb eines Werktags. Oder hinterlasse hier deine E-Mail, dann melden wir uns bei dir.";
  return "Gute Frage! Ich leite das an unser Team weiter. Am schnellsten erreichst du uns per E-Mail: office@klarblick.at";
}

// ── Component ───────────────────────────────────────────────────────────────

const INIT_MSG: Msg = {
  from: "bot",
  text: "Hi! Ich bin der Klarblick-Assistent. Wie kann ich dir helfen?",
  ts: 0,
};

export function LiveChat({ persistKey, pageContext }: LiveChatProps) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([INIT_MSG]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted messages
  useEffect(() => {
    if (!persistKey) { setLoaded(true); return; }
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) setMsgs(parsed);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, [persistKey]);

  // Persist messages
  useEffect(() => {
    if (!persistKey || !loaded) return;
    const hasContent = msgs.length > 1 || (msgs.length === 1 && msgs[0].ts !== 0);
    if (hasContent) localStorage.setItem(persistKey, JSON.stringify(msgs.slice(-60)));
  }, [msgs, persistKey, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const suggestions =
    pageContext && PAGE_SUGGESTIONS[pageContext]
      ? PAGE_SUGGESTIONS[pageContext]
      : DEFAULT_SUGGESTIONS;

  const pageLabel = pageContext ? PAGE_LABELS[pageContext] : undefined;
  const isFirstConversation = msgs.length <= 1;

  async function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    const user: Msg = { from: "user", text: t, ts: Date.now() };
    const nextMsgs = [...msgs, user];
    setMsgs(nextMsgs);
    setInput("");
    setThinking(true);

    try {
      const history = nextMsgs
        .filter((m) => m.ts !== 0)
        .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pageContext: pageLabel }),
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

  function clearChat() {
    setMsgs([INIT_MSG]);
    if (persistKey) localStorage.removeItem(persistKey);
  }

  async function escalate(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const transcript = msgs.map((m) => `${m.from.toUpperCase()}: ${m.text}`).join("\n");
    try {
      await fetch("https://formsubmit.co/ajax/amin.sistek20@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "Klarblick Chat-Anfrage", email, transcript }),
      });
    } catch { /* ok in demo */ }
    setSent(true);
    setMsgs((m) => [
      ...m,
      { from: "bot", text: `Danke! Wir melden uns bei ${email} innerhalb von 24 Stunden.`, ts: Date.now() },
    ]);
  }

  const hasHistory = msgs.length > 1;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 grid place-content-center transition"
        aria-label="Chat öffnen"
        style={{ display: open ? "none" : undefined }}
      >
        <MessageCircle className="h-6 w-6" />
        {hasHistory && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(580px,calc(100vh-2rem))] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-brand-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-white/15 grid place-content-center shrink-0">
                <Bot className="h-4 w-4" />
              </span>
              <div className="text-sm min-w-0">
                <p className="font-semibold leading-tight">Klarblick-Assistent</p>
                <p className="text-xs text-white/70 truncate">
                  {pageLabel ? pageLabel.split("(")[0].trim() : "Antwortet in Sekunden"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasHistory && (
                <button
                  onClick={clearChat}
                  title="Gespräch löschen"
                  className="p-1.5 hover:bg-white/10 rounded transition"
                  aria-label="Gespräch löschen"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white/60 hover:text-white" />
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Schließen" className="p-1.5 hover:bg-white/10 rounded transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 min-h-0">
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

            {thinking && (
              <div className="bg-white border border-border text-slate-500 rounded-2xl rounded-bl-sm max-w-[60%] px-3 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                </span>
              </div>
            )}

            {/* Suggestion chips — show at start or when only 1 exchange happened */}
            {isFirstConversation && !thinking && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:bg-brand-50 hover:border-brand-200 transition text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* E-Mail escalation (shown when user asks for human contact) */}
          {!sent && (
            <form
              onSubmit={escalate}
              className="px-3 py-2 border-t border-border bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail für Rückmeldung (optional)"
                className="text-xs px-2 py-1.5 border border-border rounded flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-brand-300"
              />
              <button type="submit" className="text-xs text-brand-600 font-medium hover:underline shrink-0" disabled={!email}>
                Senden
              </button>
            </form>
          )}

          {/* Input */}
          <div className="px-3 py-2 border-t border-border bg-white flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Schreib uns …"
              className="input !py-2 flex-1"
              disabled={thinking}
            />
            <button
              onClick={() => send(input)}
              disabled={thinking || !input.trim()}
              className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-content-center hover:bg-brand-700 shrink-0 disabled:opacity-40 transition"
              aria-label="Senden"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
