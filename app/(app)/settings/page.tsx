"use client";

import { useState } from "react";
import { Save, RefreshCw, Trash2, Mail, Copy, CheckCircle2 } from "lucide-react";
import { resetToDemo, saveReceipts } from "@/lib/store";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { Disclaimer } from "@/components/Disclaimer";

export default function SettingsPage() {
  const [form, setForm] = useState({
    company_name: DEMO_COMPANY.company_name,
    owner_name: DEMO_COMPANY.owner_name,
    tax_advisor_email: DEMO_COMPANY.tax_advisor_email,
    company_type: DEMO_COMPANY.company_type,
  });
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("klarblick.profile", JSON.stringify(form));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Firma, Steuerberater und Demo-Daten verwalten.</p>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <h2 className="font-semibold">Firma</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Firmenname</label>
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Inhaber</label>
            <input
              className="input"
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Rechtsform</label>
            <input
              className="input"
              value={form.company_type || ""}
              onChange={(e) => setForm({ ...form, company_type: e.target.value })}
              placeholder="GmbH, Einzelunternehmen …"
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
          <button type="submit" className="btn-primary">
            <Save className="h-4 w-4" /> Speichern
          </button>
          {saved ? <span className="text-sm text-accent">Gespeichert.</span> : null}
        </div>
      </form>

      <EmailForwarding />

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

      <Disclaimer />
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
