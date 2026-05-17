import { Users, Mail, ExternalLink } from "lucide-react";

// Demo-Daten — in Produktion über Supabase Admin-Client laden
// (createClient mit SUPABASE_SERVICE_ROLE_KEY, server-only)
const DEMO_CUSTOMERS = [
  { id: "cus_1", company: "Maier Sanitär GmbH", email: "office@maier-sanitaer.at", plan: "Profi", status: "active", mrr: 125.0, since: "2026-03-12" },
  { id: "cus_2", company: "Holzbau Gruber", email: "buero@gruber-holz.at", plan: "Starter", status: "trial", mrr: 0, since: "2026-05-01" },
  { id: "cus_3", company: "Elektrotechnik Bauer", email: "info@et-bauer.at", plan: "Betrieb", status: "active", mrr: 150.0, since: "2026-02-18" },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" /> Kunden
          </h1>
          <p className="text-sm text-slate-600">Alle registrierten Betriebe.</p>
        </div>
        <button className="btn-primary">Neuen Kunden anlegen</button>
      </div>

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
            {DEMO_CUSTOMERS.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold">{c.company}</td>
                <td className="px-4 py-3 text-slate-600 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {c.email}
                </td>
                <td className="px-4 py-3">
                  <span className="pill bg-brand-50 text-brand-700 border-blue-100 border text-[11px]">{c.plan}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`pill border text-[11px] ${c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {c.status === "active" ? "Aktiv" : "Trial"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{c.mrr.toFixed(2)} €</td>
                <td className="px-4 py-3 text-slate-600">{c.since}</td>
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

      <p className="text-xs text-slate-500">
        Demo-Daten. Echte Anbindung an Supabase folgt — Tabelle <code className="bg-slate-100 px-1.5 py-0.5 rounded">auth.users</code> + <code className="bg-slate-100 px-1.5 py-0.5 rounded">public.companies</code>.
      </p>
    </div>
  );
}
