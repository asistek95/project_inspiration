"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Konnte E-Mail nicht senden.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <div className="h-12 w-12 rounded-full bg-accent-soft text-accent grid place-content-center mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mail verschickt</h1>
        <p className="mt-3 text-slate-600">
          Wir haben dir einen Link an <strong>{email}</strong> geschickt. Folge dem Link, um ein neues Passwort zu setzen.
        </p>
        <p className="mt-2 text-sm text-slate-500">Prüfe ggf. den Spam-Ordner. Der Link ist 60 Minuten gültig.</p>
        <Link href="/login" className="mt-6 btn-secondary inline-flex">
          <ArrowLeft className="h-4 w-4" /> Zurück zum Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 inline-flex items-center gap-1.5 mb-4">
        <ArrowLeft className="h-4 w-4" /> Login
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Passwort vergessen?</h1>
      <p className="mt-2 text-slate-600">Wir senden dir einen Reset-Link per E-Mail.</p>

      {!supabaseEnabled ? (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
          <strong>Hinweis:</strong> Konfiguration unvollständig — bitte Admin kontaktieren.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">E-Mail-Adresse</label>
          <div className="relative">
            <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              className="input pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="du@firma.de"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Sende …" : "Reset-Link senden"}
        </button>
      </form>
    </div>
  );
}
