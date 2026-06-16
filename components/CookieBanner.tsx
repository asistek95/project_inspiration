"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "klarblick.cookiesOk";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-4">
        <Cookie className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Wir verwenden Cookies</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Nur technisch notwendige Cookies für die Anmeldung — kein Tracking, keine Werbung.{" "}
            <Link href="/datenschutz" className="underline hover:text-white">
              Datenschutzerklärung
            </Link>
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 px-4 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition"
        >
          Verstanden
        </button>
        <button onClick={accept} className="shrink-0 text-slate-500 hover:text-white transition" aria-label="Schließen">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
