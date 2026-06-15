"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Building2, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sb = getSupabaseBrowser();
      if (!sb) throw new Error("Konfigurationsfehler — bitte Administrator kontaktieren.");

      const { error: signUpError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name: form.name,
            company: form.company,
            plan: "basic",
          },
        },
      });

      if (signUpError) throw signUpError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-5 py-6">
        <span className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 grid place-content-center">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Fast geschafft!</h1>
          <p className="text-slate-600 mt-2">
            Wir haben eine Bestätigungs-E-Mail an <strong>{form.email}</strong> gesendet.
            Bitte klicke auf den Link darin, um dein Konto zu aktivieren.
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800 text-left space-y-1">
          <p className="font-semibold">Nächste Schritte:</p>
          <p>1. E-Mail öffnen &amp; Bestätigungslink klicken</p>
          <p>2. Mit E-Mail &amp; Passwort einloggen</p>
          <p>3. Ersten Beleg hochladen oder per WhatsApp schicken</p>
        </div>
        <Link href="/login" className="btn-primary inline-flex">
          Zum Login <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Konto erstellen</h1>
      <p className="mt-2 text-slate-600">Kostenlos starten — keine Kreditkarte nötig.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Dein Name <span className="text-danger">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Max Mustermann"
                autoComplete="name"
              />
            </div>
          </div>
          <div>
            <label className="label">Unternehmen <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Muster GmbH"
                autoComplete="organization"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">E-Mail <span className="text-danger">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              className="input pl-9"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="du@firma.at"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="label">Passwort <span className="text-danger">*</span></label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="input pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Konto wird erstellt …" : "Konto erstellen"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Mit der Registrierung stimmst du unseren{" "}
          <Link href="/agb" className="underline hover:text-slate-700">AGB</Link> zu.
        </p>
      </form>

      <p className="mt-6 text-sm text-slate-600 text-center">
        Schon registriert?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Anmelden</Link>
      </p>
    </div>
  );
}
