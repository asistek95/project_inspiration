"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Shield, LogIn } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/session-cookie";
import { saveRole } from "@/lib/role";

export default function AdvisorLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Laden …</div>}>
      <AdvisorLoginForm />
    </Suspense>
  );
}

function AdvisorLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState("");

  useEffect(() => {
    setCompany(params.get("company") || "");
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { data, error: authError } = await sb.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (authError) throw authError;
        if (data.user) setSessionCookie(data.user.email || form.email);
      } else {
        // Demo-Modus
        setSessionCookie(form.email);
      }

      // Advisor-Rolle in localStorage setzen
      saveRole("advisor");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Steuerberater-Branding */}
      <div className="flex items-center gap-2 mb-6">
        <span className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-content-center">
          <Eye className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-lg leading-tight">Steuerberater-Zugang</p>
          {company && <p className="text-sm text-slate-500">{company}</p>}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-5 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Leserechte:</strong> Dieser Zugang erlaubt nur das Ansehen und
          Exportieren von Belegen. Keine Änderungen möglich.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="steuerberater@kanzlei.at"
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
            placeholder="Temporäres Passwort aus Einladungs-E-Mail"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Einloggen …" : "Als Steuerberater einloggen"}
        </button>
      </form>

      <p className="text-xs text-slate-400 mt-5 text-center">
        Nur-Lesen-Modus · Änderungen an Belegen sind nicht möglich ·{" "}
        <a href="/login" className="underline">Normaler Login</a>
      </p>
    </div>
  );
}
