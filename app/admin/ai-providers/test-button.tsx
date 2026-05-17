"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";

export function TestProviderButton({ providerName }: { providerName: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState("");

  async function run() {
    setTesting(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "Antworte mit genau einem Wort: OK." }),
      });
      const data = await res.json();
      setResult(`✓ ${data.model || "?"} → "${(data.text || data.error || "?").slice(0, 80)}"`);
    } catch (e) {
      setResult("Fehler: " + (e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mt-4">
      <button onClick={run} disabled={testing} className="btn-secondary btn-sm w-full justify-center">
        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Test-Anfrage senden
      </button>
      {result && <p className="text-[11px] text-slate-600 mt-2 font-mono break-all">{result}</p>}
    </div>
  );
}
