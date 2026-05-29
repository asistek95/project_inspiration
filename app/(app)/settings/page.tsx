"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Save, RefreshCw, Trash2, Mail, Copy, CheckCircle2, Shield, KeyRound, Hash, ShieldCheck, Database as DbIcon, Users, Crown, UserPlus, Eye, X as XIcon, Send as SendIcon, Lock, Unlock } from "lucide-react";
import { resetToDemo, saveReceipts } from "@/lib/store";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { loadNumbering, saveNumbering, formatNumber, DEFAULT_PREFIXES, type NumberingConfig } from "@/lib/numbering";
import { RECEIPT_TYPES, type ReceiptType } from "@/lib/types";

export default function SettingsPage() {
  const [form, setForm] = useState({
    company_name: DEMO_COMPANY.company_name,
    owner_name: DEMO_COMPANY.owner_name,
    tax_advisor_email: DEMO_COMPANY.tax_advisor_email,
    company_type: DEMO_COMPANY.company_type,
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
        <p className="text-muted-foreground mt-1">Firma, Steuerberater und Demo-Daten verwalten.</p>
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
            <input
              className="input disabled:bg-slate-50 disabled:cursor-not-allowed"
              value={form.company_type || ""}
              disabled={locked}
              onChange={(e) => setForm({ ...form, company_type: e.target.value })}
              placeholder="GmbH, Einzelunternehmen ..."
            />
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

      <NumberingSection />

      <TeamSection />

      <DataPrivacySection />

      <SecuritySection />

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

function EmailForwarding() {
  const [copied, setCopied] = useState(false);
  // In Produktion: user-spezifische Adresse aus DB
  const inboxAddr = "amin.sistek20+klarblick@gmail.com";

  // Mock-Inbox — simulierte Belege, die per Mail reinkamen
  const mockMails = [
    { from: "noreply@amazon.de", subject: "Ihre Bestellung 405-1234567", amount: 67.9, date: "vor 2 Stunden", status: "Verarbeitet" },
    { from: "rechnung@datev.de", subject: "Rechnung 2026-05-001", amount: 89.0, date: "gestern", status: "Verarbeitet" },
    { from: "billing@adobe.com", subject: "Creative Cloud Invoice", amount: 35.69, date: "vor 3 Tagen", status: "Verarbeitet" },
  ];

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-content-center shrink-0">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">E-Mail-Forwarding</h2>
          <p className="text-sm text-muted-foreground">
            Leite Online-Rechnungen automatisch an deine Klarblick-Adresse weiter — sie werden
            erkannt, gebucht und im Report aufgenommen. Kein manueller Upload mehr.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 border border-border p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-500">Deine Klarblick-Inbox</p>
          <p className="font-mono font-semibold text-foreground">{inboxAddr}</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            navigator.clipboard.writeText(inboxAddr);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Letzte automatische Eingänge</p>
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {mockMails.map((m, i) => (
            <li key={i} className="flex items-center justify-between p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{m.subject}</p>
                <p className="text-xs text-slate-500 truncate">{m.from} · {m.date}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold">{m.amount.toFixed(2)} €</span>
                <span className="pill bg-accent-soft text-accent border border-emerald-200 text-xs">
                  {m.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-2">
          In Produktion: Eingehende E-Mails werden via IMAP/Webhook empfangen, Anhänge per OCR
          verarbeitet und nur Belege des authentifizierten Senders akzeptiert (SPF/DKIM-Check).
        </p>
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
