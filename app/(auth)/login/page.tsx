"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Willkommen zurück</h1>
      <p className="mt-2 text-slate-600">Melde dich an, um deinen Monatsreport zu sehen.</p>

      {!supabaseEnabled ? (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
          <strong>Demo-Modus:</strong> Kein Supabase verbunden. Du kannst die App ohne Login testen.
          <Link href="/dashboard" className="ml-1 underline font-medium">
            Zum Demo-Dashboard →
          </Link>
        </div>
      ) : null}

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
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
