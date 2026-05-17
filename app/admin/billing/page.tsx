import { CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { getStripeMetrics, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const live = stripeEnabled();
  const metrics = live ? await getStripeMetrics() : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-brand-600" /> Stripe / Billing
          {live && metrics && (
            <span className="pill bg-emerald-50 text-emerald-700 border-emerald-200 border text-[11px]">LIVE</span>
          )}
        </h1>
        <p className="text-sm text-slate-600">Abos, MRR, Zahlungen — direkt aus Stripe.</p>
      </div>

      {!live && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Stripe nicht verbunden</p>
              <p className="mt-1">
                Setze <code className="bg-white px-1.5 py-0.5 rounded text-xs">STRIPE_SECRET_KEY</code> in den
                Railway-ENV-Variablen, um Live-Daten zu sehen.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="MRR (netto)" value={metrics ? `${metrics.mrr_eur.toFixed(2)} €` : "—"} sub="aus aktiven Abos" />
        <Stat label="ARR projiziert" value={metrics ? `${(metrics.mrr_eur * 12).toFixed(0)} €` : "—"} sub="MRR × 12" />
        <Stat label="Aktive Abos" value={metrics ? String(metrics.active_subscriptions) : "—"} sub="status=active" />
        <Stat label="Trials" value={metrics ? String(metrics.trials) : "—"} sub="status=trialing" />
      </div>

      <div className="card p-5">
        <p className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" /> Stripe Payment-Links
        </p>
        <p className="text-sm text-slate-600 mt-1">Aktuelle Links aus ENV (für die /pricing-Seite):</p>
        <div className="mt-3 space-y-2 text-sm font-mono">
          <PaymentLink label="Starter (100 € brutto)" envName="NEXT_PUBLIC_STRIPE_LINK_STARTER" />
          <PaymentLink label="Profi (150 € brutto)" envName="NEXT_PUBLIC_STRIPE_LINK_PROFI" />
          <PaymentLink label="Betrieb (180 € brutto)" envName="NEXT_PUBLIC_STRIPE_LINK_BETRIEB" />
        </div>
      </div>

      <div className="card p-5">
        <p className="font-semibold mb-3">Letzte Zahlungen</p>
        {metrics?.recent_charges?.length ? (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase tracking-wider">
              <tr className="text-left">
                <th className="py-2">Datum</th>
                <th className="py-2">Kunde</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent_charges.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-2 text-slate-600">{c.created.slice(0, 10)}</td>
                  <td className="py-2">{c.customer}</td>
                  <td className="py-2">
                    <span className={`pill border text-[10px] ${c.status === "succeeded" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {c.status === "succeeded" ? <><CheckCircle2 className="h-3 w-3 inline" /> bezahlt</> : c.status}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{c.amount_eur.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Keine Zahlungen zum Anzeigen.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function PaymentLink({ label, envName }: { label: string; envName: string }) {
  const val = process.env[envName];
  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
      <span className="text-slate-700">{label}</span>
      {val ? (
        <a href={val} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate max-w-md">
          {val}
        </a>
      ) : (
        <span className="text-amber-700 text-xs">nicht gesetzt</span>
      )}
    </div>
  );
}
