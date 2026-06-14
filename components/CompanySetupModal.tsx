"use client";

import { useState } from "react";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Select } from "./Select";

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

function validateAtu(v: string) {
  return /^ATU\d{8}$/i.test(v.replace(/\s/g, ""));
}

export function CompanySetupModal({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({ company_name: "", atu_nummer: "", company_type: "" });
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAtu(form.atu_nummer)) return;
    const clean = {
      ...form,
      atu_nummer: form.atu_nummer.replace(/\s/g, "").toUpperCase(),
    };
    // Bestehende Daten mergen damit Felder wie tax_advisor_email erhalten bleiben
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem("klarblick.profile") || "{}"); } catch { return {}; }
    })();
    localStorage.setItem("klarblick.profile", JSON.stringify({ ...existing, ...clean }));
    setSaved(true);
    setTimeout(onComplete, 800);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">

        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 grid place-content-center">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Firmenprofil einrichten</h2>
            <p className="text-sm text-slate-500">Einmalig — wird für OCR-Erkennung verwendet</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Ohne ATU-Nummer kann Klarblick nicht automatisch erkennen ob eine Rechnung von dir ausgestellt wurde (Ausgang) oder an dich gestellt wurde (Eingang).</p>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Firmenname <span className="text-danger">*</span></label>
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              required
              placeholder="z.B. Infocom GmbH"
            />
          </div>

          <div>
            <label className="label">
              ATU-Nummer <span className="text-danger">*</span>
            </label>
            <input
              className={`input font-mono ${form.atu_nummer && !validateAtu(form.atu_nummer) ? "border-red-400" : ""}`}
              value={form.atu_nummer}
              onChange={(e) => setForm({ ...form, atu_nummer: e.target.value.toUpperCase() })}
              required
              placeholder="ATU12345678"
              maxLength={11}
            />
            {form.atu_nummer && validateAtu(form.atu_nummer) && (
              <p className="text-xs text-emerald-600 mt-1">✓ Gültiges Format</p>
            )}
            {form.atu_nummer && !validateAtu(form.atu_nummer) && (
              <p className="text-xs text-red-600 mt-1">Format: ATU + 8 Ziffern</p>
            )}
          </div>

          <div>
            <label className="label">Rechtsform <span className="text-danger">*</span></label>
            <Select
              value={form.company_type}
              onChange={(v) => setForm({ ...form, company_type: v })}
              options={COMPANY_TYPES}
              placeholder="Bitte wählen …"
            />
          </div>

          {saved ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="h-5 w-5" /> Gespeichert — weiter …
            </div>
          ) : (
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!validateAtu(form.atu_nummer) || !form.company_name || !form.company_type}
            >
              Firmenprofil speichern & starten
            </button>
          )}
        </form>

        <p className="text-xs text-slate-400 text-center">
          Kann jederzeit unter Einstellungen geändert werden.
        </p>
      </div>
    </div>
  );
}
