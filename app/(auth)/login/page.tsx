"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/session-cookie";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setSessionCookie(email);
      router.push(next);
    } catch (err: any) {
      setError(err.message || "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Willkommen zurück</h1>
      <p className="mt-2 text-slate-600">Melde dich an, um deinen Monatsabschluss zu öffnen.</p>

      {!supabaseEnabled && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Konfiguration unvollständig — bitte Admin kontaktieren.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="du@firma.de"
          />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Anmelden …" : "Anmelden"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-slate-600 hover:text-brand-600">
          Passwort vergessen?
        </Link>
        <span className="text-xs text-slate-500">2FA via E-Mail unterstützt</span>
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Noch kein Konto?{" "}
        <Link href="/register" className="text-brand-600 font-medium hover:underline">
          Jetzt registrieren →
        </Link>
      </p>
    </div>
  );
}
