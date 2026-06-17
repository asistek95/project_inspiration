"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// In production: this would come from Supabase (all tenants of the Kanzlei)
// For now: demo data showing the concept
const DEMO_CLIENTS = [
  {
    id: "1",
    name: "Mustermann Bau GmbH",
    atu: "ATU70447037",
    plan: "Betrieb",
    status: "gruen" as const,
    belege: 47,
    geprueft: 47,
    offene: 0,
    umsatz: 84200,
    lastActivity: "Heute",
    warnings: 0,
    industry: "Bau",
  },
  {
    id: "2",
    name: "Gastro Wien e.U.",
    atu: "ATU66952069",
    plan: "Pro",
    status: "gelb" as const,
    belege: 23,
    geprueft: 18,
    offene: 3,
    umsatz: 32100,
    lastActivity: "Gestern",
    warnings: 2,
    industry: "Gastronomie",
  },
  {
    id: "3",
    name: "IT Service Huber",
    atu: "ATU55123456",
    plan: "Basic",
    status: "rot" as const,
    belege: 12,
    geprueft: 4,
    offene: 5,
    umsatz: 18500,
    lastActivity: "vor 5 Tagen",
    warnings: 4,
    industry: "IT",
  },
  {
    id: "4",
    name: "Maler Gruber KG",
    atu: "ATU71234567",
    plan: "Betrieb",
    status: "gruen" as const,
    belege: 31,
    geprueft: 31,
    offene: 0,
    umsatz: 56700,
    lastActivity: "Heute",
    warnings: 0,
    industry: "Handwerk",
  },
  {
    id: "5",
    name: "Elektro Hoffmann GmbH",
    atu: "ATU68901234",
    plan: "Betrieb",
    status: "gelb" as const,
    belege: 38,
    geprueft: 30,
    offene: 2,
    umsatz: 67300,
    lastActivity: "vor 2 Tagen",
    warnings: 1,
    industry: "Handwerk",
  },
];

type AmpelFilter = "alle" | "gruen" | "gelb" | "rot";

export default function KanzleiPage() {
  const [filter, setFilter] = useState<AmpelFilter>("alle");

  const gruen = DEMO_CLIENTS.filter((c) => c.status === "gruen").length;
  const gelb = DEMO_CLIENTS.filter((c) => c.status === "gelb").length;
  const rot = DEMO_CLIENTS.filter((c) => c.status === "rot").length;

  const filtered =
    filter === "alle" ? DEMO_CLIENTS : DEMO_CLIENTS.filter((c) => c.status === filter);

  // Gesundheitsindex: Anteil grüner Mandanten
  const gesundheitsindex = Math.round((gruen / DEMO_CLIENTS.length) * 100);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Steuerberater-Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Kanzlei-Übersicht</h1>
        <p className="text-sm text-slate-500">
          {DEMO_CLIENTS.length} Mandanten · Juni 2026
        </p>
      </div>

      {/* Demo-Hinweis */}
      <div className="rounded-lg bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-700 flex items-start gap-2">
        <Star className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Demo-Modus</strong> — In der Produktionsversion werden hier alle Mandanten deiner Kanzlei
          angezeigt. Jeder Mandant registriert sich selbst bei Klarblick und du erhältst Lesezugriff.
        </div>
      </div>

      {/* Gesundheitsindex + KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 col-span-2 sm:col-span-1">
          <TrendingUp className="h-5 w-5 text-brand-500 mb-2" />
          <div className="text-3xl font-black text-brand-700">{gesundheitsindex}%</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Kanzlei-Score</div>
          <div className="text-xs text-slate-500">Anteil übergabefähiger Mandanten</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all rounded-full"
              style={{ width: `${gesundheitsindex}%` }}
            />
          </div>
        </div>

        <KpiBox
          count={gruen}
          label="Übergabefähig"
          sub="Grün — alles erledigt"
          color="emerald"
          onClick={() => setFilter(filter === "gruen" ? "alle" : "gruen")}
          active={filter === "gruen"}
        />
        <KpiBox
          count={gelb}
          label="Fast fertig"
          sub="Gelb — kleine Lücken"
          color="amber"
          onClick={() => setFilter(filter === "gelb" ? "alle" : "gelb")}
          active={filter === "gelb"}
        />
        <KpiBox
          count={rot}
          label="Handlungsbedarf"
          sub="Rot — Rückfragen nötig"
          color="red"
          onClick={() => setFilter(filter === "rot" ? "alle" : "rot")}
          active={filter === "rot"}
        />
      </div>

      {/* Mandanten-Liste */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">
            Mandanten{" "}
            {filter !== "alle" && (
              <span className="text-slate-400 font-normal">
                — gefiltert nach {filter}
              </span>
            )}
          </h2>
          <button
            onClick={() => setFilter("alle")}
            className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline"
          >
            {filter !== "alle" ? "Filter zurücksetzen" : `${filtered.length} Mandanten`}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((client) => (
            <ClientRow key={client.id} client={client} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiBox({
  count,
  label,
  sub,
  color,
  onClick,
  active,
}: {
  count: number;
  label: string;
  sub: string;
  color: "emerald" | "amber" | "red";
  onClick: () => void;
  active: boolean;
}) {
  const map = {
    emerald: {
      bg: active ? "bg-emerald-100" : "bg-emerald-50",
      border: active ? "border-emerald-400" : "border-emerald-200",
      text: "text-emerald-700",
    },
    amber: {
      bg: active ? "bg-amber-100" : "bg-amber-50",
      border: active ? "border-amber-400" : "border-amber-200",
      text: "text-amber-700",
    },
    red: {
      bg: active ? "bg-red-100" : "bg-red-50",
      border: active ? "border-red-400" : "border-red-200",
      text: "text-red-700",
    },
  };
  const c = map[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition hover:shadow-sm",
        c.bg,
        c.border
      )}
    >
      <div className={cn("text-3xl font-black", c.text)}>{count}</div>
      <div className="text-sm font-semibold text-slate-700 mt-1">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </button>
  );
}

function ClientRow({ client }: { client: (typeof DEMO_CLIENTS)[0] }) {
  const statusCfg = {
    gruen: {
      Icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      label: "Übergabefähig",
    },
    gelb: {
      Icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-50",
      label: "Fast fertig",
    },
    rot: {
      Icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
      label: "Handlungsbedarf",
    },
  };

  const s = statusCfg[client.status];
  const geprueftPct =
    client.belege > 0 ? Math.round((client.geprueft / client.belege) * 100) : 0;

  return (
    <div className="px-4 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition">
      {/* Status Dot */}
      <span className={cn("h-8 w-8 rounded-lg grid place-content-center shrink-0", s.bg)}>
        <s.Icon className={cn("h-4 w-4", s.color)} />
      </span>

      {/* Name + ATU */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{client.name}</p>
        <p className="text-xs text-slate-400">
          {client.atu} · {client.industry} · {client.plan}
        </p>
      </div>

      {/* Progress */}
      <div className="hidden sm:block w-28">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>{client.geprueft}/{client.belege} Belege</span>
          <span>{geprueftPct}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              geprueftPct === 100 ? "bg-emerald-400" : geprueftPct >= 60 ? "bg-amber-400" : "bg-red-400"
            )}
            style={{ width: `${geprueftPct}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {client.warnings > 0 && (
        <span className="hidden md:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          {client.warnings} Hinweise
        </span>
      )}

      {/* Last Activity */}
      <span className="hidden lg:flex items-center gap-1 text-xs text-slate-400">
        <Clock className="h-3 w-3" />
        {client.lastActivity}
      </span>

      {/* Status Badge */}
      <span
        className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:block",
          client.status === "gruen"
            ? "bg-emerald-100 text-emerald-700"
            : client.status === "gelb"
            ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700"
        )}
      >
        {s.label}
      </span>

      <Link href="/aufgaben" className="text-xs text-brand-600 hover:underline shrink-0">
        Aufgaben →
      </Link>
    </div>
  );
}
