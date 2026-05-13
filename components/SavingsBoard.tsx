"use client";

import { TrendingUp, AlertCircle, RefreshCw, Euro } from "lucide-react";
import type { Receipt } from "@/lib/types";
import { priceWatch, skontoLoss, recurringSubscriptions, savingsPotential } from "@/lib/savings";
import { formatEUR } from "@/lib/utils";

export function SavingsBoard({ receipts }: { receipts: Receipt[] }) {
  const pw = priceWatch(receipts);
  const sk = skontoLoss(receipts);
  const subs = recurringSubscriptions(receipts);
  const pot = savingsPotential(receipts);

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-accent-soft to-brand-50 border-accent/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Spar-Potenzial</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{formatEUR(pot.total)}</p>
            <p className="text-sm text-slate-600 mt-1">
              {formatEUR(pot.skonto_lost)} verlorenes Skonto · {formatEUR(pot.subs_potential)} mögliche Abo-Einsparung/Jahr
            </p>
          </div>
          <span className="h-14 w-14 rounded-xl bg-accent text-white grid place-content-center shadow-lg">
            <Euro className="h-6 w-6" />
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Preis-Wächter */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-9 w-9 rounded-lg bg-danger-soft text-danger grid place-content-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </span>
            <h3 className="font-semibold">Preis-Wächter</h3>
          </div>
          {pw.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Preissteigerungen erkannt.</p>
          ) : (
            <ul className="space-y-3">
              {pw.slice(0, 5).map((p) => (
                <li key={p.supplier} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{p.supplier}</span>
                    <span className="pill bg-danger-soft text-danger">+{p.delta_pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.category} · Ø {formatEUR(p.prev_avg)} → {formatEUR(p.current_avg)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Skonto-Alarm */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-9 w-9 rounded-lg bg-warn-soft text-warn grid place-content-center">
              <AlertCircle className="h-4.5 w-4.5" />
            </span>
            <h3 className="font-semibold">Skonto-Alarm</h3>
          </div>
          <p className="text-2xl font-bold text-warn">{formatEUR(sk.total)}</p>
          <p className="text-xs text-slate-500 mb-3">verlorenes Skonto durch späte Zahlung</p>
          {sk.items.length === 0 ? (
            <p className="text-sm text-slate-500">Alles pünktlich bezahlt — gut gemacht!</p>
          ) : (
            <ul className="space-y-2">
              {sk.items.slice(0, 4).map((s) => (
                <li key={s.receipt_id} className="text-sm flex items-center justify-between">
                  <span className="truncate">
                    {s.supplier}
                    <span className="text-xs text-slate-500 ml-1">· {s.skonto_pct}%/{s.days}T</span>
                  </span>
                  <span className="font-semibold text-warn">−{formatEUR(s.lost_eur)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Abo-Falle */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-content-center">
              <RefreshCw className="h-4.5 w-4.5" />
            </span>
            <h3 className="font-semibold">Abo-Falle</h3>
          </div>
          <p className="text-2xl font-bold">{formatEUR(pot.subs_yearly)}</p>
          <p className="text-xs text-slate-500 mb-3">pro Jahr durch wiederkehrende Kosten</p>
          {subs.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Abonnements erkannt.</p>
          ) : (
            <ul className="space-y-2">
              {subs.slice(0, 5).map((s) => (
                <li key={s.supplier} className="text-sm flex items-center justify-between">
                  <span className="truncate">{s.supplier}</span>
                  <span className="text-xs text-slate-500">
                    {formatEUR(s.monthly_eur)} / Mon.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
