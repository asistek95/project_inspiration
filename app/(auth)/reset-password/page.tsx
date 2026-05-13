"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser, supabaseEnabled } from "@/lib/supabase";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (pw.length < 8) {
      setError("Mindestens 8 Zeichen.");
      return;
    }
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { error } = await sb.auth.updateUser({ password: pw });
        if (error) throw error;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Aktualisierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div>
        <div className="h-12 w-12 rounded-full bg-accent-soft text-accent grid place-content-center mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Passwort gesetzt</h1>
        <p className="mt-3 text-slate-600">Du wirst gleich weitergeleitet …</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Neues Passwort</h1>
      <p className="mt-2 text-slate-600">Wähle ein Passwort mit mindestens 8 Zeichen.</p>

      {!supabaseEnabled ? (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
          <strong>Demo-Modus:</strong> Kein Supabase verbunden.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Neues Passwort</label>
          <div className="relative">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" className="input pl-9" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
          </div>
        </div>
        <div>
          <label className="label">Wiederholen</label>
          <div className="relative">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" className="input pl-9" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={8} />
          </div>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Speichern …" : "Passwort speichern"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Zurück zum Login</Link>
      </p>
    </div>
  );
}
