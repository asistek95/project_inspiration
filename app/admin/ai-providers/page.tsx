"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  envKey: string;
  models: string[];
  status: "unknown" | "ok" | "error";
  defaultModel: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    envKey: "ANTHROPIC_API_KEY",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-20250514"],
    defaultModel: "claude-sonnet-4-20250514",
    status: "unknown",
  },
  {
    id: "openai",
    name: "OpenAI (GPT)",
    envKey: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini"],
    defaultModel: "gpt-4o",
    status: "unknown",
  },
];

export default function AiProvidersPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [testing, setTesting] = useState(false);

  async function testProvider(p: Provider) {
    setTesting(true);
    setTestResult("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "Antworte mit 'OK'." }),
      });
      const data = await res.json();
      setTestResult(`${p.name}: ${data.text?.slice(0, 100) || data.error || "?"} (Modell: ${data.model})`);
    } catch (e) {
      setTestResult("Fehler: " + (e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-600" /> AI-Modell-Provider
        </h1>
        <p className="text-sm text-slate-600">
          Modelle für Management-Reports und WhatsApp-Bot konfigurieren.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">ENV: {p.envKey}</p>
              </div>
              <span className="pill border bg-slate-50 border-slate-200 text-[11px]">
                {p.models.length} Modelle
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Default-Modell</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">{p.defaultModel}</code>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Verfügbare Modelle</p>
              <div className="flex flex-wrap gap-1">
                {p.models.map((m) => (
                  <span key={m} className="pill border bg-slate-50 border-slate-200 text-[10px] font-mono">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => testProvider(p)}
              disabled={testing}
              className="btn-secondary btn-sm mt-4 w-full justify-center"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Test-Anfrage senden
            </button>
          </div>
        ))}
      </div>

      {testResult && (
        <div className="card p-4 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Letztes Ergebnis</p>
          <p className="text-sm font-mono whitespace-pre-wrap">{testResult}</p>
        </div>
      )}

      <div className="card p-4 bg-blue-50 border-blue-200 text-sm text-blue-900">
        <p className="font-semibold">Aktiv: Anthropic Claude Sonnet</p>
        <p className="mt-1">
          Der Wechsel des Default-Modells erfolgt aktuell über die ENV-Variable
          <code className="bg-white px-1.5 py-0.5 rounded mx-1 text-xs">ANTHROPIC_MODEL</code>.
          Eine UI-basierte Umschaltung (mit DB-Persistenz) folgt im nächsten Sprint.
        </p>
      </div>
    </div>
  );
}
