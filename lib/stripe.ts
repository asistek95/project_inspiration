// Stripe-API über fetch (kein SDK, hält Bundle klein).
// Server-only — niemals im Browser verwenden.

const STRIPE_BASE = "https://api.stripe.com/v1";

function key(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

export const stripeEnabled = () => !!key();

async function stripeFetch(path: string): Promise<any> {
  const k = key();
  if (!k) throw new Error("STRIPE_SECRET_KEY fehlt");
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    headers: {
      authorization: `Bearer ${k}`,
      "stripe-version": "2024-06-20",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

export interface StripeMetrics {
  mrr_eur: number;
  active_subscriptions: number;
  trials: number;
  recent_charges: Array<{
    id: string;
    amount_eur: number;
    customer: string;
    status: string;
    created: string;
  }>;
}

export async function getStripeMetrics(): Promise<StripeMetrics | null> {
  if (!stripeEnabled()) return null;
  try {
    const [subs, charges] = await Promise.all([
      stripeFetch("/subscriptions?status=all&limit=100"),
      stripeFetch("/charges?limit=10"),
    ]);

    const subsData: any[] = subs.data || [];
    let mrrCents = 0;
    let active = 0;
    let trials = 0;
    for (const s of subsData) {
      if (s.status === "active") {
        active++;
        for (const item of s.items?.data || []) {
          const unitCents = item.price?.unit_amount || 0;
          const qty = item.quantity || 1;
          const interval = item.price?.recurring?.interval;
          // Monatlich = direkt, jährlich = /12
          mrrCents += interval === "year" ? (unitCents * qty) / 12 : unitCents * qty;
        }
      } else if (s.status === "trialing") {
        trials++;
      }
    }

    return {
      mrr_eur: Math.round(mrrCents) / 100,
      active_subscriptions: active,
      trials,
      recent_charges: (charges.data || []).map((c: any) => ({
        id: c.id,
        amount_eur: (c.amount || 0) / 100,
        customer: c.billing_details?.email || c.customer || "—",
        status: c.status,
        created: new Date((c.created || 0) * 1000).toISOString(),
      })),
    };
  } catch {
    return null;
  }
}
