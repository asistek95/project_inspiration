"use client";

/**
 * PhoneVerificationCard — WhatsApp-Nummer verknüpfen.
 * Zeigt OTP-Flow: Nummer eingeben → Code per WhatsApp erhalten → bestätigen.
 * Nach Verifikation kann der Nutzer Belege direkt per WhatsApp hochladen.
 */

import { useState } from "react";
import { MessageSquare, CheckCircle2, Phone, Loader2 } from "lucide-react";

interface Props {
  currentPhone?: string | null;
}

export function PhoneVerificationCard({ currentPhone }: Props) {
  const [step, setStep] = useState<"idle" | "entering" | "otp" | "done">(
    currentPhone ? "done" : "idle"
  );
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState(currentPhone ?? "");

  async function sendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden");
      // DEV: Code direkt anzeigen
      if (data.dev_code) setCode(data.dev_code);
      setStep("otp");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verifizierung fehlgeschlagen");
      setVerifiedPhone(phone);
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-content-center">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">WhatsApp-Eingang</h2>
            <p className="text-xs text-muted-foreground">Belege per WhatsApp hochladen</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-emerald-800">{verifiedPhone}</span>
            <span className="text-emerald-700"> ist verifiziert</span>
          </div>
          <button
            className="ml-auto text-xs text-slate-500 underline"
            onClick={() => setStep("entering")}
          >
            Ändern
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Schick ein Foto deines Belegs an die Klarblick-WhatsApp-Nummer — er landet direkt in deiner Belegliste.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 grid place-content-center">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">WhatsApp-Eingang verbinden</h2>
          <p className="text-xs text-muted-foreground">Belege per WhatsApp-Foto hochladen</p>
        </div>
      </div>

      <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
        Verifiziere deine Nummer — danach kannst du Kassenzettel, Rechnungen und Tankbelege direkt als Foto per WhatsApp schicken. Sie landen automatisch in deiner Belegliste.
      </div>

      {step === "idle" && (
        <button className="btn-primary w-full" onClick={() => setStep("entering")}>
          <Phone className="h-4 w-4" />
          WhatsApp-Nummer verknüpfen
        </button>
      )}

      {step === "entering" && (
        <div className="space-y-3">
          <div>
            <label className="label">Deine WhatsApp-Nummer</label>
            <input
              className="input"
              type="tel"
              placeholder="+43 664 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Format: +43 (Österreich) oder +49 (Deutschland)</p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => { setStep("idle"); setError(null); }}>
              Abbrechen
            </button>
            <button className="btn-primary flex-1" onClick={sendOtp} disabled={loading || !phone}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Code senden
            </button>
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-3">
          <div>
            <label className="label">Bestätigungscode (6 Ziffern)</label>
            <input
              className="input tracking-widest text-center text-xl font-mono"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Wir haben einen Code per WhatsApp an <strong>{phone}</strong> geschickt.
            </p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => { setStep("entering"); setCode(""); setError(null); }}>
              Zurück
            </button>
            <button className="btn-primary flex-1" onClick={verifyOtp} disabled={loading || code.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Bestätigen
            </button>
          </div>
          <button className="text-xs text-brand-600 underline w-full text-center" onClick={sendOtp}>
            Code nochmal senden
          </button>
        </div>
      )}
    </div>
  );
}
