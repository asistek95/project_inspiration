"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/session-cookie";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmUI status="loading" />}>
      <ConfirmInner />
    </Suspense>
  );
}

function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as "email" | "signup" | null;

    if (!tokenHash || !type) {
      setErrorMsg("Ungültiger Bestätigungslink.");
      setStatus("error");
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setErrorMsg("Konfigurationsfehler.");
      setStatus("error");
      return;
    }

    sb.auth.verifyOtp({ token_hash: tokenHash, type: type === "signup" ? "email" : type })
      .then(({ data, error }) => {
        if (error) throw error;
        if (data.user?.email) setSessionCookie(data.user.email);
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1200);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Bestätigung fehlgeschlagen.");
        setStatus("error");
      });
  }, [params, router]);

  return <ConfirmUI status={status} errorMsg={errorMsg} />;
}

function ConfirmUI({ status, errorMsg }: { status: string; errorMsg?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-sm w-full text-center space-y-5">
        {status === "loading" && (
          <>
            <div className="h-14 w-14 mx-auto rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
            <p className="font-semibold text-slate-700">E-Mail wird bestätigt …</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✅</div>
            <p className="font-bold text-xl">Bestätigt!</p>
            <p className="text-slate-500 text-sm">Du wirst zum Dashboard weitergeleitet …</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="h-14 w-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl">❌</div>
            <p className="font-bold text-xl">Link ungültig</p>
            <p className="text-slate-500 text-sm">{errorMsg}</p>
            <a href="/register" className="btn-primary inline-flex w-full justify-center">
              Nochmal registrieren
            </a>
            <a href="/login" className="text-sm text-brand-600 hover:underline block">
              Zum Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
