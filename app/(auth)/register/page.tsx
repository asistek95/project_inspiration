"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, Building2, User, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";

export default function PilotPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Notify backend (fire-and-forget, no block if it fails)
    fetch("/api/admin/notify-signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        company: form.company,
        name: form.name,
        phone: form.phone,
        message: form.message,
        source: "pilot-request",
      }),
    }).catch(() => {});

    // Kurze Verzögerung für UX
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-5 py-6">
        <span className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 grid place-content-center">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Anfrage eingegangen!</h1>
          <p className="text-slate-600 mt-2">
            Danke, <strong>{form.name}</strong>. Wir melden uns innerhalb von 24 Stunden bei{" "}
            <strong>{form.email}</strong>.
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800 text-left space-y-1">
          <p className="font-semibold">Was passiert als nächstes?</p>
          <p>1. Kurzes Kennenlerngespräch (15 min, online)</p>
          <p>2. Persönliches Onboarding mit deinen echten Belegen</p>
          <p>3. 3 Monate gratis als Pilot-Kunde</p>
        </div>
        <Link href="/login" className="btn-primary inline-flex">
          Zum Login <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Pilot anfragen</h1>
      <p className="mt-2 text-slate-600">
        Klarblick ist aktuell im geschlossenen Beta-Betrieb. Trag dich ein — wir melden uns persönlich.
      </p>

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800 space-y-1">
        <p className="font-semibold">Pilot-Programm — erste 50 Kunden:</p>
        <p>✓ 3 Monate gratis · ✓ Persönliches Onboarding · ✓ Direkter Draht zum Gründer</p>
      </div>

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
              />
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
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Unternehmen <span className="text-danger">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
                placeholder="Muster GmbH"
              />
            </div>
          </div>
          <div>
            <label className="label">Telefon <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                className="input pl-9"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+43 664 123 456"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Kurze Nachricht <span className="text-slate-400 font-normal">(optional)</span></label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea
              className="input pl-9 pt-2.5 resize-none h-20"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="z.B. Wir sind Handwerker mit ca. 200 Belegen/Monat …"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Wird gesendet …" : "Pilot-Zugang anfragen"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Keine Kreditkarte · Kein Abo · Nur eine kurze Anfrage
        </p>
      </form>

      <p className="mt-6 text-sm text-slate-600 text-center">
        Schon registriert?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Anmelden</Link>
      </p>
    </div>
  );
}
