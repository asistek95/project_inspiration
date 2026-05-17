import { Sparkles, CheckCircle2 } from "lucide-react";
import { getActiveAiSetting, supabaseAdminEnabled } from "@/lib/supabase-admin";
import { saveAiSetting } from "./actions";
import { TestProviderButton } from "./test-button";

export const dynamic = "force-dynamic";

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    envKey: "ANTHROPIC_API_KEY",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-20250514"],
    defaultModel: "claude-sonnet-4-20250514",
  },
  {
    id: "openai",
    name: "OpenAI (GPT)",
    envKey: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    defaultModel: "gpt-4o",
  },
];

export default async function AiProvidersPage() {
  const live = supabaseAdminEnabled;
  const active = live ? await getActiveAiSetting() : null;
  const envFallback = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const activeProvider = active?.provider || "anthropic";
  const activeModel = active?.model || envFallback;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-600" /> AI-Modell-Provider
          {live && (
            <span className="pill bg-emerald-50 text-emerald-700 border-emerald-200 border text-[11px]">DB-LIVE</span>
          )}
        </h1>
        <p className="text-sm text-slate-600">
          Aktives Modell für AI-Reports und WhatsApp-Bot.
          {!live && " (Demo-Modus — speichert noch nicht. Supabase + Tabelle ai_settings nötig.)"}
        </p>
      </div>

      <div className="card p-5 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700 uppercase tracking-wider font-semibold">Aktuell aktiv</p>
        <p className="text-xl font-bold mt-1 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          {activeProvider} · <code className="text-sm font-mono bg-white px-2 py-0.5 rounded">{activeModel}</code>
        </p>
        {active?.updated_at && (
          <p className="text-xs text-blue-700 mt-1">Geändert: {new Date(active.updated_at).toLocaleString("de-AT")}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ENV: {p.envKey} {process.env[p.envKey] ? <span className="text-emerald-600">✓ gesetzt</span> : <span className="text-red-600">fehlt</span>}
                </p>
              </div>
              {p.id === activeProvider && (
                <span className="pill bg-emerald-50 text-emerald-700 border-emerald-200 border text-[11px]">AKTIV</span>
              )}
            </div>

            <form action={saveAiSetting} className="mt-4">
              <input type="hidden" name="provider" value={p.id} />
              <label className="text-xs text-slate-500 uppercase tracking-wider">Modell wählen</label>
              <div className="mt-1 flex gap-2">
                <select name="model" defaultValue={p.id === activeProvider ? activeModel : p.defaultModel} className="input flex-1 text-sm font-mono">
                  {p.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary btn-sm" disabled={!live}>
                  Aktivieren
                </button>
              </div>
              {!live && (
                <p className="text-[11px] text-amber-700 mt-1.5">
                  Speichern erst möglich, wenn Supabase + Tabelle <code>ai_settings</code> vorhanden ist.
                </p>
              )}
            </form>

            <TestProviderButton providerName={p.name} />
          </div>
        ))}
      </div>

      <div className="card p-5 bg-slate-50">
        <p className="font-semibold text-sm">Benötigte Supabase-Tabelle</p>
        <pre className="mt-2 text-xs bg-white p-3 rounded border border-border overflow-x-auto">{`create table ai_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  active boolean default false,
  updated_at timestamptz default now()
);

-- Erster Eintrag
insert into ai_settings (provider, model, active)
values ('anthropic', 'claude-sonnet-4-20250514', true);`}</pre>
      </div>
    </div>
  );
}
