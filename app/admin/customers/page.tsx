import { Users, Mail, ExternalLink, AlertCircle } from "lucide-react";
import { listCustomers, supabaseAdminEnabled } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const DEMO_CUSTOMERS = [
  { id: "cus_1", email: "office@maier-sanitaer.at", company: "Maier Sanitär GmbH", plan: "Profi", status: "active" as const, mrr: 125.0, created_at: "2026-03-12" },
  { id: "cus_2", email: "buero@gruber-holz.at", company: "Holzbau Gruber", plan: "Starter", status: "trial" as const, mrr: 0, created_at: "2026-05-01" },
  { id: "cus_3", email: "info@et-bauer.at", company: "Elektrotechnik Bauer", plan: "Betrieb", status: "active" as const, mrr: 150.0, created_at: "2026-02-18" },
];

export default async function CustomersPage() {
  const live = supabaseAdminEnabled;
  const customers = live ? await listCustomers() : DEMO_CUSTOMERS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" /> Kunden
            {live && customers.length > 0 && (
              <span className="pill bg-emerald-50 text-emerald-700 border-emerald-200 border text-[11px]">LIVE</span>
            )}
          </h1>
          <p className="text-sm text-slate-600">
            {live ? `${customers.length} registrierte Betriebe (Supabase live).` : "Demo-Daten — Supabase nicht konfiguriert."}
          </p>
        </div>
      </div>

      {!live && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Supabase nicht verbunden</p>
              <p className="mt-1">
                Setze <code className="bg-white px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code> und
                <code className="bg-white px-1.5 py-0.5 rounded text-xs mx-1">SUPABASE_SERVICE_ROLE_KEY</code> in Railway.
                Benötigte Tabelle: <code className="bg-white px-1.5 py-0.5 rounded text-xs">companies</code> (id, user_id, company_name, plan, status, mrr_cents, created_at)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-border">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Unternehmen</th>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">MRR (netto)</th>
              <th className="px-4 py-3">Seit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Noch keine Kunden.</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold">{c.company || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="pill bg-brand-50 text-brand-700 border-blue-100 border text-[11px]">{c.plan || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`pill border text-[11px] ${c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : c.status === "trial" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {c.status === "active" ? "Aktiv" : c.status === "trial" ? "Trial" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{Number(c.mrr).toFixed(2)} €</td>
                <td className="px-4 py-3 text-slate-600">{String(c.created_at).slice(0, 10)}</td>
                <td className="px-4 py-3 text-right">
                  <button className="btn-secondary btn-sm">
                    Details <ExternalLink className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
