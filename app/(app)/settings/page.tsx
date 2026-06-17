"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Save, RefreshCw, Trash2, Mail, Copy, CheckCircle2, Shield, KeyRound, Hash, ShieldCheck, Database as DbIcon, Users, Crown, UserPlus, Eye, X as XIcon, Send as SendIcon, Lock, Unlock, MessageCircle, Phone, ExternalLink, Info, Globe } from "lucide-react";
import { PhoneVerificationCard } from "@/components/PhoneVerificationCard";
import { RestartTourButton } from "@/components/OnboardingTour";
import { loadErrorLogs, clearErrorLogs } from "@/components/ErrorBoundary";
import { resetToDemo, saveReceipts } from "@/lib/store";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { loadNumbering, saveNumbering, formatNumber, DEFAULT_PREFIXES, type NumberingConfig } from "@/lib/numbering";
import { RECEIPT_TYPES, type ReceiptType } from "@/lib/types";
import { Select } from "@/components/Select";

const COMPANY_TYPES = [
  "GmbH",
  "AG",
  "GmbH & Co KG",
  "AG & Co KG",
  "KG",
  "OG",
  "GesbR",
  "Einzelunternehmen / e.U.",
  "Freiberufler",
  "SE (Societas Europaea)",
  "PartG (Partnerschaftsgesellschaft)",
  "Verein",
  "Stiftung",
  "Sonstiges",
];

export default function SettingsPage() {
  const [form, setForm] = useState({
    company_name: DEMO_COMPANY.company_name,
    owner_name: DEMO_COMPANY.owner_name,
    tax_advisor_email: DEMO_COMPANY.tax_advisor_email,
    company_type: DEMO_COMPANY.company_type,
    atu_nummer: "",
  });
  const [saved, setSaved] = useState(false);
  const [locked, setLocked] = useState(true);

  // Profil laden falls schon gespeichert
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("klarblick.profile");
    if (raw) {
      try {
        setForm((f) => ({ ...f, ...JSON.parse(raw) }));
      } catch {}
    }
  }, []);

  function unlock() {
    const ok = confirm(
      "Stammdaten ändern?\n\nFirmenname, Inhaber und Rechtsform sind buchhaltungsrelevant. Änderungen werden mit Zeitstempel im Audit-Log dokumentiert (GoBD / § 132 BAO).\n\nFortfahren?"
    );
    if (ok) setLocked(false);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("klarblick.profile", JSON.stringify(form));
      // Mini-Audit-Log
      const log = JSON.parse(localStorage.getItem("klarblick.audit") || "[]");
      log.push({
        ts: new Date().toISOString(),
        action: "stammdaten_geaendert",
        snapshot: { ...form },
      });
      localStorage.setItem("klarblick.audit", JSON.stringify(log.slice(-200)));
    }
    setSaved(true);
    setLocked(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Firmenprofil, WhatsApp-Eingang, E-Mail-Forwarding und Team verwalten.</p>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Firma</h2>
            {locked ? (
              <span className="pill bg-slate-100 text-slate-600 text-xs gap-1">
                <Lock className="h-3 w-3" />
                Stammdaten geschützt
              </span>
            ) : (
              <span className="pill bg-warn-soft text-warn text-xs gap-1">
                <Unlock className="h-3 w-3" />
                Bearbeitungsmodus aktiv
              </span>
            )}
          </div>
          {locked ? (
            <button
              type="button"
              onClick={unlock}
              className="btn-secondary btn-sm"
            >
              <Unlock className="h-3.5 w-3.5" /> Bearbeiten
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Firmenname, Inhaber und Rechtsform sind buchhaltungsrelevant — Änderungen werden im
          Audit-Log dokumentiert. E-Mail Steuerberater ist frei änderbar.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Firmenname</label>
            <input
              className="input disabled:bg-slate-50 disabled:cursor-not-allowed"
              value={form.company_name}
              disabled={locked}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Inhaber</label>
            <input
              className="input disabled:bg-slate-50 disabled:cursor-not-allowed"
              value={form.owner_name}
              disabled={locked}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Rechtsform</label>
            <Select
              value={form.company_type || ""}
              onChange={(v) => setForm({ ...form, company_type: v })}
              options={COMPANY_TYPES}
              placeholder="Bitte wählen …"
              disabled={locked}
            />
          </div>
          <div>
            <label className="label">ATU-Nummer</label>
            <input
              className="input font-mono disabled:bg-slate-50 disabled:cursor-not-allowed"
              value={form.atu_nummer || ""}
              disabled={locked}
              onChange={(e) => setForm({ ...form, atu_nummer: e.target.value.toUpperCase() })}
              placeholder="ATU12345678"
            />
            <p className="text-xs text-slate-500 mt-1">Wird für OCR-Erkennung Eingangs-/Ausgangsrechnung verwendet.</p>
          </div>
          <div>
            <label className="label">E-Mail Steuerberater</label>
            <input
              type="email"
              className="input"
              value={form.tax_advisor_email || ""}
              onChange={(e) => setForm({ ...form, tax_advisor_email: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={locked}>
            <Save className="h-4 w-4" /> Speichern
          </button>
          {saved ? <span className="text-sm text-accent">Gespeichert + im Audit-Log dokumentiert.</span> : null}
        </div>
      </form>

      <EmailForwarding />

      {/* Steuerfälle — Kurzlink */}
      <a href="/steuerfaelle" className="card p-5 flex items-center gap-4 hover:shadow-md transition group">
        <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-content-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold group-hover:text-brand-700 transition">Abgedeckte Steuerfälle</p>
          <p className="text-sm text-muted-foreground">Welche österreichischen Steuergesetze Klarblick automatisch erkennt — §12, §19, §132 BAO u.v.m.</p>
        </div>
        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-brand-600 shrink-0 transition" />
      </a>

      <WhatsAppSection />

      <NumberingSection />

      <TeamSection />

      <CloudIntegrationsSection />

      <DataPrivacySection />

      <SecuritySection />

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Hilfe & Diagnose</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Onboarding-Tour</p>
            <p className="text-xs text-muted-foreground">Einführung beim nächsten Seitenaufruf erneut anzeigen.</p>
          </div>
          <RestartTourButton />
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <div>
            <p className="text-sm">Fehler-Log</p>
            <p className="text-xs text-muted-foreground">Lokal gespeicherte Fehlermeldungen für Support.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" onClick={() => {
              const logs = loadErrorLogs();
              const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `klarblick_errors_${new Date().toISOString().slice(0,10)}.json`; a.click();
              URL.revokeObjectURL(url);
            }}>Exportieren</button>
            <button className="btn-ghost text-xs text-danger" onClick={() => { clearErrorLogs(); alert("Fehler-Log geleert."); }}>
              Leeren
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="font-semibold">Demo-Daten</h2>
        <p className="text-sm text-muted-foreground">
          Setze die App auf realistische Demo-Belege zurück oder lösche alle Belege.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              if (confirm("Mit Demo-Belegen neu starten?")) {
                resetToDemo();
                location.reload();
              }
            }}
          >
            <RefreshCw className="h-4 w-4" /> Demo neu laden
          </button>
          <button
            className="btn-ghost text-danger"
            onClick={() => {
              if (confirm("Wirklich alle Belege löschen?")) {
                saveReceipts([]);
                location.reload();
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Alle Belege löschen
          </button>
        </div>
      </div>
</div>
  );
}

// ── WhatsApp-Eingang Setup ─────────────────────────────────────────────────────

function WhatsAppSection() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+43 XXX XXX XXXX";
  const [copied, setCopied] = useState(false);

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 grid place-content-center shrink-0">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">WhatsApp-Eingang</h2>
          <p className="text-sm text-muted-foreground">
            Belege per WhatsApp einschicken — Foto schießen, an unsere Nummer senden, fertig.
          </p>
        </div>
      </div>

      {/* Klarblick WhatsApp-Nummer */}
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-emerald-700 mb-0.5">Klarblick WhatsApp-Nummer</p>
          <p className="font-mono font-bold text-lg text-emerald-900">{waNumber}</p>
          <p className="text-xs text-emerald-700/70 mt-1">
            Sende Fotos von Belegen, Kassenbons oder Rechnungs-PDFs an diese Nummer.
          </p>
        </div>
        <button
          className="btn-secondary shrink-0 border-emerald-300"
          onClick={() => { navigator.clipboard.writeText(waNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>

      {/* Setup-Schritte */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Einrichtung (3 Schritte)</p>
        <ol className="space-y-2">
          {[
            { step: "1", text: "Deine Handynummer unter Team → WhatsApp-Verknüpfung verifizieren", done: false },
            { step: "2", text: "Speichere die Klarblick-Nummer in deinen WhatsApp-Kontakten", done: false },
            { step: "3", text: `Schicke ein Beleg-Foto an ${waNumber} — erscheint automatisch unter Eingang`, done: false },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold grid place-content-center shrink-0 mt-0.5">
                {step}
              </span>
              <span className="text-slate-700">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex gap-2 text-xs text-slate-600">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
        <div className="space-y-0.5">
          <p>Kollegen können dieselbe Nummer nutzen — Belege erscheinen dann zur Freigabe im Eingang.</p>
          <p>
            Technisch via <strong>Twilio WhatsApp Business API</strong> — Eingehende Bilder/PDFs werden automatisch via OCR erkannt.
            Einstellbar in <code className="bg-white px-1 rounded">.env.local</code> (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).
          </p>
        </div>
      </div>

      <a href="/inbox" className="btn-secondary inline-flex">
        <ExternalLink className="h-4 w-4" /> WhatsApp-Eingang öffnen
      </a>
    </div>
  );
}

// ── E-Mail-Forwarding ──────────────────────────────────────────────────────────

function EmailForwarding() {
  const [copied, setCopied] = useState(false);
  const [inbox, setInbox] = useState<{ from: string; subject: string; amount: number | null; date: string; status: string }[]>([]);
  const [inboxAddr, setInboxAddr] = useState("amin.sistek20+klarblick@gmail.com");
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    // Inbox-Adresse aus Profil ableiten
    try {
      const profile = JSON.parse(localStorage.getItem("klarblick.profile") || "{}");
      const base = profile.tax_advisor_email || "amin.sistek20@gmail.com";
      const [user, domain] = base.split("@");
      if (user && domain) setInboxAddr(`${user}+klarblick@${domain}`);
    } catch {}

    // Aus localStorage gespeicherte E-Mail-Eingänge laden (echte werden vom Webhook dort gespeichert)
    try {
      const stored = JSON.parse(localStorage.getItem("klarblick.email_inbox") || "[]");
      if (stored.length > 0) {
        setInbox(stored);
        setIsDemo(false);
        return;
      }
    } catch {}

    // Demo-Fallback mit klarer Markierung
    setIsDemo(true);
    setInbox([
      { from: "noreply@amazon.de", subject: "Ihre Bestellung 405-1234567", amount: 67.9, date: "vor 2 Stunden", status: "Verarbeitet" },
      { from: "rechnung@datev.de", subject: "Rechnung 2026-05-001", amount: 89.0, date: "gestern", status: "Verarbeitet" },
      { from: "billing@adobe.com", subject: "Creative Cloud Invoice", amount: 35.69, date: "vor 3 Tagen", status: "Verarbeitet" },
    ]);
  }, []);

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-content-center shrink-0">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">E-Mail-Forwarding</h2>
          <p className="text-sm text-muted-foreground">
            Online-Rechnungen an deine Klarblick-Adresse weiterleiten — automatisch erkannt, gebucht, kein Upload nötig.
          </p>
        </div>
      </div>

      {/* Inbox-Adresse */}
      <div className="rounded-lg bg-slate-50 border border-border p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Deine Klarblick-Inbox-Adresse</p>
          <p className="font-mono font-semibold text-foreground">{inboxAddr}</p>
          <p className="text-xs text-slate-400 mt-1">
            Leite Rechnungen an diese Adresse weiter — z.B. in Gmail unter Einstellungen → Weiterleitung
          </p>
        </div>
        <button className="btn-secondary shrink-0"
          onClick={() => { navigator.clipboard.writeText(inboxAddr); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>

      {/* Letzte Eingänge */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-medium">Letzte automatische Eingänge</p>
          {isDemo && (
            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold">
              Demo-Daten
            </span>
          )}
        </div>
        {inbox.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-400 text-sm">
            Noch keine E-Mails eingegangen. Leite deine ersten Rechnungen weiter!
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {inbox.map((m, i) => (
              <li key={i} className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.subject}</p>
                  <p className="text-xs text-slate-500 truncate">{m.from} · {m.date}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.amount != null && <span className="font-semibold">{m.amount.toFixed(2)} €</span>}
                  <span className={`pill text-xs ${
                    m.status === "Verarbeitet" || m.status === "processed"
                      ? "bg-accent-soft text-accent border border-emerald-200"
                      : m.status === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {m.status === "processed" ? "Verarbeitet" : m.status === "pending" ? "Ausstehend" : m.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {isDemo && (
          <p className="text-xs text-slate-400 mt-2">
            In Produktion: E-Mails via IMAP/Webhook empfangen, Anhänge per OCR verarbeitet,
            nur Absender mit SPF/DKIM-Check akzeptiert. Ergebnisse werden in Supabase <code>email_inbox</code> gespeichert.
          </p>
        )}
      </div>
    </div>
  );
}

function SecuritySection() {
  const [twoFA, setTwoFA] = useState(false);
  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold">Sicherheit &amp; Login</h2>
      </div>

      <div className="flex items-center justify-between border border-border rounded-lg p-4">
        <div>
          <p className="font-medium flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-400" /> Passwort ändern
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Per E-Mail-Reset-Link — sicher und unkompliziert.</p>
        </div>
        <a href="/forgot-password" className="btn-secondary">Link senden</a>
      </div>

      <div className="flex items-center justify-between border border-border rounded-lg p-4">
        <div>
          <p className="font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" /> Zwei-Faktor-Authentifizierung (2FA)
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Code per E-Mail bei jedem Login — extra Sicherheit für sensible Beleg-Daten.
          </p>
        </div>
        <button
          onClick={() => setTwoFA((v) => !v)}
          className={`pill ${twoFA ? "bg-accent-soft text-accent border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
        >
          {twoFA ? "Aktiv" : "Aktivieren"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        In Produktion via Supabase Auth MFA — TOTP (Authenticator App) und E-Mail-Code unterstützt.
      </p>
    </div>
  );
}


function NumberingSection() {
  const [cfg, setCfg] = useState<NumberingConfig>(() => loadNumbering());
  const [saved, setSaved] = useState(false);

  function setPrefix(type: ReceiptType, value: string) {
    setCfg((c) => ({
      ...c,
      prefixes: { ...DEFAULT_PREFIXES, ...(c.prefixes || {}), [type]: value },
    }));
  }

  function persist() {
    saveNumbering(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold">Fortlaufende Belegnummerierung</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Klarblick erkennt den Beleg-Typ beim Scan automatisch (Rechnung, Quittung, Tankbeleg …)
        und vergibt das passende Präfix. Pflicht für GoBD/§ 132 BAO konforme Aufbewahrung.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
        />
        Automatische Nummerierung aktivieren
      </label>

      <div>
        <p className="text-sm font-semibold mb-2">Präfixe pro Beleg-Typ</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {RECEIPT_TYPES.map((t) => (
            <div key={t}>
              <label className="label">{t}</label>
              <input
                className="input font-mono text-sm"
                value={(cfg.prefixes?.[t] ?? DEFAULT_PREFIXES[t]) || ""}
                onChange={(e) => setPrefix(t, e.target.value)}
                placeholder={DEFAULT_PREFIXES[t]}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Nächste Nummer</label>
          <input
            type="number"
            min={1}
            className="input"
            value={cfg.next}
            onChange={(e) => setCfg({ ...cfg, next: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
        <div>
          <label className="label">Stellen (Padding)</label>
          <input
            type="number"
            min={1}
            max={10}
            className="input"
            value={cfg.padding}
            onChange={(e) => setCfg({ ...cfg, padding: Math.max(1, Math.min(10, parseInt(e.target.value) || 4)) })}
          />
        </div>
        <div>
          <label className="label">Suffix (optional)</label>
          <input
            className="input"
            value={cfg.suffix}
            onChange={(e) => setCfg({ ...cfg, suffix: e.target.value })}
            placeholder=""
          />
        </div>
      </div>

      <div className="rounded-lg bg-brand-50 border border-blue-200 p-4">
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-2">
          Vorschau — nächste Nummer je Typ
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-sm">
          {RECEIPT_TYPES.map((t) => (
            <div key={t} className="flex items-center justify-between gap-2 bg-white border border-blue-200 rounded-md px-2.5 py-1.5">
              <span className="text-xs text-slate-500">{t}</span>
              <span className="text-brand-700 font-semibold">
                {formatNumber(cfg, cfg.next, t)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn-primary" onClick={persist}>
          <Save className="h-4 w-4" /> Speichern
        </button>
        {saved ? <span className="text-sm text-accent">Gespeichert.</span> : null}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// CLOUD-INTEGRATIONEN
// ──────────────────────────────────────────────────────────
function CloudIntegrationsSection() {
  const integrations = [
    {
      name: "Google Drive",
      icon: (
        <svg viewBox="0 0 87.3 78" className="h-6 w-6" fill="none">
          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
          <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 47.5C.4 48.9 0 50.45 0 52h27.5l16.15-27z" fill="#00AC47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.1l5.85 11.6 7.6 12.2z" fill="#EA4335"/>
          <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25z" fill="#00832D"/>
          <path d="M60.1 52H27.5L13.75 75.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L60.1 52z" fill="#2684FC"/>
          <path d="M73.4 26.5L60.65 4.5C59.85 3.1 58.7 2 57.35 1.2L43.6 25l16.5 27h27.45c0-1.55-.4-3.1-1.2-4.5l-12.95-21z" fill="#FFBA00"/>
        </svg>
      ),
      description: "Belege automatisch in Google Drive synchronisieren",
    },
    {
      name: "Microsoft OneDrive",
      icon: (
        <svg viewBox="0 0 40 26" className="h-6 w-6" fill="none">
          <path d="M24.1 6.5A10.2 10.2 0 0014.5 0C10 0 6.1 2.8 4.5 6.8A8 8 0 000 14c0 4.4 3.6 8 8 8h16a8 8 0 008-8 8 8 0 00-7.9-7.5z" fill="#0078D4"/>
          <path d="M28.5 9.5a6 6 0 016 6 6 6 0 01-6 6H8a6 6 0 010-12c.3 0 .5 0 .8.1A8 8 0 0116 4c3 0 5.6 1.7 7 4.1.5-.4 1-.6 1.6-.7l3.9 2.1z" fill="#0364B8"/>
        </svg>
      ),
      description: "Belege mit OneDrive for Business verknüpfen",
    },
    {
      name: "Dropbox Business",
      icon: (
        <svg viewBox="0 0 43.1 40" className="h-6 w-6" fill="none">
          <path d="M12.8 0L0 8.2l12.8 8.1 12.8-8.1L12.8 0zM38.2 0L25.5 8.2l12.7 8.1 12.7-8.1L38.2 0zM0 24.6l12.8 8.1 12.8-8.1-12.8-8.1L0 24.6zM25.5 24.6l12.7 8.1 12.7-8.1-12.7-8.1-12.7 8.1zM12.8 34.6L25.5 40l12.7-5.4-12.7-8-12.7 8z" fill="#0061FF"/>
        </svg>
      ),
      description: "Belegablage in Dropbox Business-Ordner",
    },
  ];

  return (
    <div id="cloud-integrationen" className="card p-6 space-y-4 scroll-mt-20">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold">Cloud-Integrationen</h2>
        <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          Bald verfügbar
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Belege automatisch in deinem Cloud-Speicher ablegen und synchronisieren. Wir arbeiten an direkten Integrationen für die gängigsten Plattformen.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {integrations.map((int) => (
          <div
            key={int.name}
            className="relative flex flex-col gap-3 rounded-xl border border-border bg-slate-50/60 p-4 opacity-60 cursor-not-allowed select-none"
          >
            <div className="flex items-center gap-2.5">
              {int.icon}
              <span className="font-medium text-sm">{int.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{int.description}</p>
            <div className="mt-auto">
              <span className="text-[11px] font-semibold text-amber-600">Bald verfügbar</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Bis dahin: <strong>ZIP-Archiv</strong> in der Belegliste → manuell in Drive/OneDrive hochladen.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// DATENSCHUTZ & AUFBEWAHRUNG
// ──────────────────────────────────────────────────────────
function DataPrivacySection() {
  function exportAll() {
    if (typeof window === "undefined") return;
    const profile = localStorage.getItem("klarblick.profile") || "{}";
    const receipts = localStorage.getItem("klarblick.receipts") || "[]";
    const numbering = localStorage.getItem("klarblick.numbering") || "{}";
    const uva = localStorage.getItem("klarblick_uva_manual_v1") || "{}";
    const dump = { exported_at: new Date().toISOString(), profile: JSON.parse(profile), receipts: JSON.parse(receipts), numbering: JSON.parse(numbering), uva: JSON.parse(uva) };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klarblick_dsgvo_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div id="datenschutz" className="card p-6 space-y-4 scroll-mt-20">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold">Datenschutz &amp; Aufbewahrung</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Wir behandeln deine Belege wie ein Steuerberater — gesetzliche Aufbewahrung, dokumentierte Übergaben, EU-Server.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <InfoTile icon={<DbIcon className="h-4 w-4 text-brand-600" />} title="Server-Standort" value="EU (Supabase Frankfurt)" />
        <InfoTile icon={<ShieldCheck className="h-4 w-4 text-brand-600" />} title="Aufbewahrung" value="7 Jahre (§ 132 BAO)" />
        <InfoTile icon={<KeyRound className="h-4 w-4 text-brand-600" />} title="Verschlüsselung" value="At Rest + TLS in Transit" />
        <InfoTile icon={<Mail className="h-4 w-4 text-brand-600" />} title="Auftragsverarbeiter" value="Supabase, Anthropic, Stripe" />
      </div>

      <div className="rounded-lg bg-slate-50 border border-border p-4 space-y-2 text-sm">
        <p className="font-medium">Dokumentierte Übergaben</p>
        <p className="text-muted-foreground text-xs">
          Jede Freigabe an den Steuerberater wird mit Zeitstempel, Anzahl Belege und Empfänger-E-Mail im Audit-Log gespeichert. Belege werden nach Übergabe gesperrt (locked) und nicht mehr verändert.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={exportAll}>
          <DbIcon className="h-4 w-4" /> Daten-Export (DSGVO Art. 20)
        </button>
        <a href="/datenschutz" className="btn-ghost" target="_blank" rel="noreferrer">
          Datenschutzerklärung →
        </a>
        <button
          type="button"
          className="btn-ghost text-danger"
          onClick={() => alert("Konto-Löschung: Bitte schreib uns an datenschutz@klarblick.eu — Löschung erfolgt innerhalb 30 Tage nach Ablauf gesetzlicher Aufbewahrungspflichten.")}
        >
          Konto löschen
        </button>
      </div>
    </div>
  );
}

function InfoTile({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 flex items-start gap-3">
      <span className="h-8 w-8 rounded-md bg-brand-50 grid place-content-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// TEAM & ROLLEN
// ──────────────────────────────────────────────────────────
type TeamRole = "owner" | "member" | "advisor";
type TeamMember = { email: string; role: TeamRole; status: "active" | "pending"; invited_at: string };

const TEAM_KEY = "klarblick_team_v1";
const ROLE_LABEL: Record<TeamRole, string> = { owner: "Inhaber", member: "Mitarbeiter", advisor: "Steuerberater (nur lesen)" };

function loadTeam(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) || "[]"); } catch { return []; }
}
function saveTeam(t: TeamMember[]) { if (typeof window !== "undefined") localStorage.setItem(TEAM_KEY, JSON.stringify(t)); }

function TeamSection() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  React.useEffect(() => { setTeam(loadTeam()); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Einladung fehlgeschlagen");
      const next: TeamMember[] = [...team, { email, role, status: "pending", invited_at: new Date().toISOString() }];
      setTeam(next); saveTeam(next);
      setMsg(`Einladung an ${email} versendet.`);
      setEmail("");
    } catch (err: any) {
      setMsg(err.message || "Fehler beim Einladen");
    } finally {
      setSending(false);
    }
  }

  function remove(targetEmail: string) {
    if (!confirm(`Mitglied ${targetEmail} entfernen?`)) return;
    const next = team.filter((m) => m.email !== targetEmail);
    setTeam(next); saveTeam(next);
  }

  return (
    <div id="team" className="card p-6 space-y-5 scroll-mt-20">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold">Team &amp; Rollen</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Lade Mitarbeiter oder deinen Steuerberater ein. Berechtigungen werden über Supabase Row-Level-Security durchgesetzt.
      </p>

      {/* Rollen-Erklärung */}
      <div className="grid sm:grid-cols-3 gap-3">
        <RoleCard icon={<Crown className="h-4 w-4 text-amber-600" />} title="Inhaber" desc="Voller Zugriff inkl. Abrechnung, Team und Löschung." />
        <RoleCard icon={<UserPlus className="h-4 w-4 text-brand-600" />} title="Mitarbeiter" desc="Belege erfassen & prüfen — keine Settings, keine Löschung." />
        <RoleCard icon={<Eye className="h-4 w-4 text-slate-600" />} title="Steuerberater" desc="Nur lesen + Export — keine Änderungen an Daten." />
      </div>

      {/* Einladen */}
      <form onSubmit={invite} className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-medium">Neues Mitglied einladen</p>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
          <input
            type="email"
            className="input"
            placeholder="kollege@firma.at"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
            <option value="member">Mitarbeiter</option>
            <option value="advisor">Steuerberater (nur lesen)</option>
          </select>
          <button type="submit" className="btn-primary" disabled={sending}>
            <SendIcon className="h-4 w-4" /> {sending ? "Senden..." : "Einladen"}
          </button>
        </div>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
        <p className="text-xs text-muted-foreground">
          Eingeladene Personen erhalten eine E-Mail mit Magic-Link. Sie können erst nach Bestätigung zugreifen.
        </p>
      </form>

      {/* E-Mail Eingang */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 grid place-content-center">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">E-Mail Eingang</h2>
            <p className="text-xs text-muted-foreground">Rechnungen per E-Mail weiterleiten</p>
          </div>
        </div>
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
          Leite Rechnungs-E-Mails an diese Adresse weiter — Anhänge werden automatisch ausgelesen und erscheinen im Beleg-Check.
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <code className="text-xs font-mono text-slate-700 flex-1 break-all">
            {process.env.NEXT_PUBLIC_INBOUND_EMAIL ?? "bb56165d7679eb5edc7320bd5d1e5439@inbound.postmarkapp.com"}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                process.env.NEXT_PUBLIC_INBOUND_EMAIL ?? "bb56165d7679eb5edc7320bd5d1e5439@inbound.postmarkapp.com"
              );
            }}
            className="btn-ghost !p-1.5 shrink-0"
            title="Kopieren"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tipp: Richte in deinem E-Mail-Programm eine automatische Weiterleitung für Absender wie <strong>rechnungen@lieferant.at</strong> ein.
        </p>
      </div>

      {/* WhatsApp-Verknüpfung */}
      <PhoneVerificationCard />

      {/* White Label / Kanzlei-Bereich */}
      <WhiteLabelSection />

      {/* Mitglieder-Liste */}
      {team.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Mitglieder ({team.length})</p>
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {team.map((m) => (
              <li key={m.email} className="flex items-center justify-between p-3 text-sm gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.email}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`pill text-xs ${m.status === "active" ? "bg-accent-soft text-accent border-emerald-200" : "bg-amber-50 text-warn border-amber-200"}`}>
                    {m.status === "active" ? "Aktiv" : "Eingeladen"}
                  </span>
                  <button onClick={() => remove(m.email)} className="btn-ghost !p-1.5" aria-label="Entfernen">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RoleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">{icon}{title}</div>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

// ── White Label / Kanzlei-Portal ─────────────────────────────────────────────

function WhiteLabelSection() {
  const [config, setConfig] = useState({
    kanzlei_slug: "",
    kanzlei_name: "",
    kanzlei_logo_url: "",
    kanzlei_color: "#1a56db",
    kanzlei_headline: "",
    kanzlei_welcome_text: "",
    kanzlei_contact_email: "",
    kanzlei_domain: "",
    kanzlei_footer: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("klarblick.whitelabel");
    if (raw) {
      try { setConfig((c) => ({ ...c, ...JSON.parse(raw) })); } catch {}
    }
  }, []);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem("klarblick.whitelabel", JSON.stringify(config));
      // Speichere auch in Supabase user_metadata via API
      const { getSupabaseBrowser } = await import("@/lib/supabase");
      const sb = getSupabaseBrowser();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null;
      const res = await fetch("/api/whitelabel/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      });
      if (res.ok) setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = config.kanzlei_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?tenant=${config.kanzlei_slug}`
    : "";

  return (
    <div className="card p-6 space-y-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-600" />
          <div>
            <h2 className="font-semibold">White Label / Kanzlei-Portal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Eigenes Login für Mandanten — mit deinem Logo und deinen Farben
            </p>
          </div>
        </div>
        <span className="pill bg-purple-50 text-purple-700 border-purple-100 text-xs">Pro</span>
      </button>

      {expanded && (
        <form onSubmit={saveConfig} className="space-y-4 border-t border-border pt-4">
          <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-800">
            <strong>Wie funktioniert White Label?</strong> Du richtest hier deinen Kanzlei-Slug ein.
            Deine Mandanten erhalten dann den Link <strong>/login?tenant={"{slug}"}</strong> — dort sehen
            sie dein Logo und deine Farben, nicht Klarblick.
            Für eine eigene Domain (z.B. <em>portal.kanzlei-mueller.at</em>) richtest du einen CNAME-Eintrag
            auf <code className="bg-purple-100 px-1 rounded text-xs">projectinspiration-production-cfa8.up.railway.app</code> ein.
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Kanzlei-Slug <span className="text-danger">*</span></label>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <span className="px-3 text-xs text-slate-400 bg-slate-50 h-full flex items-center border-r border-border py-2.5 shrink-0">
                  /login?tenant=
                </span>
                <input
                  className="input !border-0 !rounded-none flex-1 text-sm"
                  placeholder="kanzlei-mueller"
                  value={config.kanzlei_slug}
                  onChange={(e) => setConfig({ ...config, kanzlei_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nur Kleinbuchstaben, Zahlen und Bindestriche</p>
            </div>

            <div>
              <label className="label">Kanzlei-Name</label>
              <input
                className="input"
                placeholder="Müller & Partner Steuerberatung"
                value={config.kanzlei_name}
                onChange={(e) => setConfig({ ...config, kanzlei_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Logo-URL</label>
              <input
                className="input"
                placeholder="https://kanzlei.at/logo.png"
                value={config.kanzlei_logo_url}
                onChange={(e) => setConfig({ ...config, kanzlei_logo_url: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1">JPG oder PNG, empfohlen: weiße/transparente Version</p>
            </div>

            <div>
              <label className="label">Primärfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.kanzlei_color}
                  onChange={(e) => setConfig({ ...config, kanzlei_color: e.target.value })}
                  className="h-10 w-10 rounded cursor-pointer border border-border shrink-0"
                />
                <input
                  className="input"
                  value={config.kanzlei_color}
                  onChange={(e) => setConfig({ ...config, kanzlei_color: e.target.value })}
                  placeholder="#1a56db"
                />
              </div>
            </div>

            <div>
              <label className="label">Headline im Login</label>
              <input
                className="input"
                placeholder="Willkommen in Ihrem Steuerberater-Portal"
                value={config.kanzlei_headline}
                onChange={(e) => setConfig({ ...config, kanzlei_headline: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Kontakt-E-Mail</label>
              <input
                type="email"
                className="input"
                placeholder="office@kanzlei-mueller.at"
                value={config.kanzlei_contact_email}
                onChange={(e) => setConfig({ ...config, kanzlei_contact_email: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Willkommenstext</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Bitte melden Sie sich mit Ihren Zugangsdaten an. Bei Fragen stehen wir gerne zur Verfügung."
                value={config.kanzlei_welcome_text}
                onChange={(e) => setConfig({ ...config, kanzlei_welcome_text: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Custom Domain (optional)</label>
              <input
                className="input"
                placeholder="portal.kanzlei-mueller.at"
                value={config.kanzlei_domain}
                onChange={(e) => setConfig({ ...config, kanzlei_domain: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1">CNAME → projectinspiration-production-cfa8.up.railway.app</p>
            </div>

            <div>
              <label className="label">Fußzeile</label>
              <input
                className="input"
                placeholder="© Müller & Partner Steuerberatung GmbH"
                value={config.kanzlei_footer}
                onChange={(e) => setConfig({ ...config, kanzlei_footer: e.target.value })}
              />
            </div>
          </div>

          {/* Vorschau-Link */}
          {previewUrl && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-3 text-sm">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-700">Vorschau-URL für Mandanten:</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline text-xs break-all"
                >
                  {previewUrl}
                </a>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(previewUrl)}
                className="btn-ghost !p-1.5 shrink-0"
                title="Kopieren"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !config.kanzlei_slug} className="btn-primary">
              {saving ? "Speichere …" : saved ? <><CheckCircle2 className="h-4 w-4" /> Gespeichert</> : <><Save className="h-4 w-4" /> White Label speichern</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
