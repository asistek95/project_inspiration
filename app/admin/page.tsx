import Link from "next/link";
import { Users, CreditCard, Sparkles, MessageSquare, ArrowRight } from "lucide-react";

export default function AdminDashboardPage() {
  // Echte Zahlen kommen aus Supabase + Stripe API — hier vorerst statisch.
  const stats = [
    { label: "Aktive Kunden", value: "—", hint: "Aus Supabase" },
    { label: "MRR (Monthly Recurring)", value: "—", hint: "Aus Stripe" },
    { label: "Trials laufend", value: "—", hint: "Aus Stripe" },
    { label: "WhatsApp-Nachrichten heute", value: "—", hint: "Aus Twilio" },
  ];

  const tiles = [
    {
      href: "/admin/customers",
      Icon: Users,
      title: "Kunden verwalten",
      desc: "Liste aller registrierten Betriebe, Status, Plan, letzte Aktivität.",
    },
    {
      href: "/admin/billing",
      Icon: CreditCard,
      title: "Stripe / Billing",
      desc: "Abos, Zahlungen, MRR-Übersicht, manuelle Rechnungen.",
    },
    {
      href: "/admin/ai-providers",
      Icon: Sparkles,
      title: "AI-Modell-Provider",
      desc: "Claude, GPT, Modell-Wechsel, Kosten-Logs, API-Keys testen.",
    },
    {
      href: "/admin/whatsapp",
      Icon: MessageSquare,
      title: "WhatsApp-Bot",
      desc: "Twilio-Status, Nachrichten-Log, Templates.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin-Übersicht</h1>
        <p className="text-sm text-slate-600">Kontroll-Panel für Klarblick. Nur für Geschäftsführung.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card p-5 hover:border-brand-600 hover:shadow-md transition group">
            <div className="flex items-start gap-4">
              <span className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-content-center">
                <t.Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-2">
                  {t.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
                </p>
                <p className="text-sm text-slate-600 mt-1">{t.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-5 bg-amber-50 border-amber-200">
        <p className="font-semibold text-amber-900">Setup-Hinweise</p>
        <ul className="mt-2 text-sm text-amber-900 space-y-1 list-disc list-inside">
          <li>
            <code className="text-xs bg-white px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> in Railway setzen (komma-getrennt)
          </li>
          <li>
            Stripe-Übersicht braucht <code className="text-xs bg-white px-1.5 py-0.5 rounded">STRIPE_SECRET_KEY</code> (Server-only)
          </li>
          <li>
            WhatsApp braucht <code className="text-xs bg-white px-1.5 py-0.5 rounded">TWILIO_ACCOUNT_SID</code>, <code className="text-xs bg-white px-1.5 py-0.5 rounded">TWILIO_AUTH_TOKEN</code>, <code className="text-xs bg-white px-1.5 py-0.5 rounded">TWILIO_WHATSAPP_FROM</code>
          </li>
          <li>
            AI braucht <code className="text-xs bg-white px-1.5 py-0.5 rounded">ANTHROPIC_API_KEY</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
