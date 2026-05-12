"use client";

import { useState } from "react";
import { Save, RefreshCw, Trash2 } from "lucide-react";
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
