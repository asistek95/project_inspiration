"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/session-cookie";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ company: "", name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { data, error } = await sb.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { company_name: form.company, owner_name: form.name } },
        });
        if (error) throw error;
        // Profil-Eintrag (optional, falls Tabelle existiert)
        if (data.user) {
          await sb.from("profiles").upsert({
            id: data.user.id,
            company_name: form.company,
            owner_name: form.name,
          });
          // Admin-Notification — best effort, blockiert den Flow nicht.
          fetch("/api/admin/notify-signup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: form.email,
              company: form.company,
              name: form.name,
              user_id: data.user.id,
            }),
          }).catch(() => {});
        }
      }
      setSessionCookie(form.email);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Kostenlos starten</h1>
      <p className="mt-2 text-slate-600">Probiere Klarblick 14 Tage unverbindlich.</p>

      {!supabaseEnabled ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Konfiguration unvollständig — bitte Admin kontaktieren.
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
          <strong>Beta-Programm:</strong> Erste 50 Beta-Kunden erhalten 6 Monate gratis Klarblick + persönliches Onboarding.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Firmenname</label>
            <input
              className="input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
              placeholder="z. B. Sistek Bau e.U."
            />
          </div>
          <div>
            <label className="label">Dein Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Vor- und Nachname"
            />
          </div>
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="du@firma.de"
          />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            placeholder="Mindestens 8 Zeichen"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Konto wird erstellt …" : "Konto erstellen"}
        </button>
        <p className="text-xs text-muted-foreground">
          Mit der Registrierung akzeptierst du AGB und Datenschutz (im MVP Platzhalter).
        </p>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Schon registriert?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
