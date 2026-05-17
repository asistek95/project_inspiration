"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Send,
  Download,
  Loader2,
  Copy,
  Check,
  Wand2,
} from "lucide-react";
import { QUICK_ACTIONS, CATEGORY_LABELS, type PromptCategory } from "@/lib/ai-prompts";
import { loadReceipts } from "@/lib/store";
import type { Receipt } from "@/lib/types";
import { periodStats } from "@/lib/insights";
import { formatEUR } from "@/lib/utils";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { Disclaimer } from "@/components/Disclaimer";

const CATEGORIES: PromptCategory[] = ["report", "steuerberater", "premium"];

export default function AiReportsPage() {
  const [all, setAll] = useState<Receipt[]>([]);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeCat, setActiveCat] = useState<PromptCategory>("report");

  useEffect(() => {
    setAll(loadReceipts());
  }, []);

  const stats = useMemo(() => periodStats(all), [all]);
  const filteredActions = QUICK_ACTIONS.filter((p) => p.category === activeCat);

  async function runPrompt(p: string) {
    setLoading(true);
    setResult("");
    setModel("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: p,
          context: {
            company: DEMO_COMPANY.company_name,
            periodLabel: "aktueller Monat",
            receipts: all.slice(0, 60),
          },
        }),
      });
      const data = await res.json();
      setResult(data.text || data.error || "Keine Antwort.");
      setModel(data.model || "");
    } catch (e) {
      setResult("Fehler: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 mb-2">
          <Sparkles className="h-4 w-4" /> AI-Reports
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Management Reports erstellen. Steuerberaterkosten reduzieren.
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-3xl">
          Wähle einen Premium-Prompt — die KI analysiert deine Belege und liefert
          Executive Summary, Risiken, Empfehlungen und Steuerberater-Checkliste.
          Bis zu <strong>70 % weniger Vorbereitungszeit</strong>.
        </p>
      </div>

      {/* KPI-Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Belege im Zeitraum" value={String(all.length)} />
        <KpiTile label="Geprüft" value={`${stats.advisorReadyPct}%`} />
        <KpiTile label="Brutto-Summe" value={formatEUR(all.reduce((s, r) => s + (r.gross_amount || 0), 0))} />
        <KpiTile label="Offene Rechnungen" value={String(all.filter((r) => r.receipt_type === "Rechnung" && !r.paid_at).length)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-border">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              activeCat === c
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredActions.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setPrompt(a.prompt);
              runPrompt(a.prompt);
            }}
            disabled={loading}
            className="card p-4 text-left hover:border-brand-600 hover:shadow-md transition flex items-start gap-3 disabled:opacity-50"
          >
            <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-content-center shrink-0">
              <a.Icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-semibold text-sm leading-tight">{a.label}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.prompt}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div className="card p-5">
        <label className="label flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-brand-600" />
          Eigene Frage stellen
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="z. B. Welche Kostenposition ist im letzten Monat am stärksten gestiegen?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && prompt.trim()) runPrompt(prompt);
            }}
          />
          <button
            onClick={() => prompt.trim() && runPrompt(prompt)}
            disabled={loading || !prompt.trim()}
            className="btn-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Analysieren
          </button>
        </div>
      </div>

      {/* Output */}
      {(loading || result) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent text-white grid place-content-center">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-semibold">KI-Auswertung</p>
                {model && <p className="text-xs text-slate-500">Modell: {model}</p>}
              </div>
            </div>
            {result && !loading && (
              <button onClick={copyResult} className="btn-secondary btn-sm">
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-slate-500 py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>KI analysiert deine Zahlen…</span>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap">
              {result}
            </div>
          )}

          {result && !loading && (
            <div className="mt-6 pt-4 border-t border-border flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([result], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `klarblick-report-${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn-secondary btn-sm"
              >
                <Download className="h-4 w-4" /> Als Markdown speichern
              </button>
            </div>
          )}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
