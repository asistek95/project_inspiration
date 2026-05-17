import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";

export default function BillingPage() {
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-brand-600" /> Stripe / Billing
        </h1>
        <p className="text-sm text-slate-600">Abos, MRR, Zahlungen, manuelle Rechnungen.</p>
      </div>

      {!hasStripeKey && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Stripe nicht verbunden</p>
              <p className="text-sm text-amber-900 mt-1">
                Setze <code className="bg-white px-1.5 py-0.5 rounded text-xs">STRIPE_SECRET_KEY</code> in den
                Railway-ENV-Variablen, um Live-Daten zu sehen.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="MRR (Brutto AT)" value="—" sub="Stripe Live" />
        <Stat label="ARR projiziert" value="—" sub="MRR × 12" />
        <Stat label="Aktive Abos" value="—" sub="status=active" />
        <Stat label="Churn 30T" value="—" sub="Stornos / Total" />
      </div>

      <div className="card p-5">
        <p className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" /> Stripe Payment-Links
        </p>
        <p className="text-sm text-slate-600 mt-1">Aktuelle Links aus ENV:</p>
        <div className="mt-3 space-y-2 text-sm font-mono">
          <PaymentLink label="Starter (100 €)" envName="NEXT_PUBLIC_STRIPE_LINK_STARTER" />
          <PaymentLink label="Profi (150 €)" envName="NEXT_PUBLIC_STRIPE_LINK_PROFI" />
          <PaymentLink label="Betrieb (180 €)" envName="NEXT_PUBLIC_STRIPE_LINK_BETRIEB" />
        </div>
      </div>

      <div className="card p-5">
        <p className="font-semibold">Letzte Zahlungen</p>
        <p className="text-sm text-slate-500 mt-1">
          Wird angezeigt, sobald Stripe-API verbunden ist (Server-Action ruft <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">stripe.charges.list()</code> auf).
        </p>
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
