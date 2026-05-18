-- Klarblick · Admin-Schema (companies, ai_settings, whatsapp_messages)
-- Diese Tabellen werden vom Admin-Panel + AI-Provider-Konfig + WhatsApp-Bot genutzt.
-- Ausführen NACH schema.sql.

-- ────────────────────────────────────────────────────────────
-- companies: ein Eintrag pro zahlendem Kunden (Verknüpfung Auth-User ↔ Stripe-Abo)
-- ────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  plan text not null default 'starter' check (plan in ('starter','profi','betrieb')),
  status text not null default 'trial' check (status in ('trial','active','past_due','canceled')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  mrr_cents int not null default 0,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_companies_user on public.companies(user_id);
create index if not exists idx_companies_stripe on public.companies(stripe_customer_id);
create index if not exists idx_companies_status on public.companies(status);

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies
for each row execute procedure public.set_updated_at();

alter table public.companies enable row level security;

-- User darf sein eigenes Company-Profil lesen, aber NICHT plan/status ändern (nur Stripe-Webhook via service_role)
create policy "companies_owner_select" on public.companies
  for select using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- ai_settings: globaler AI-Provider (nur Admin schreibt, alle lesen via service_role)
-- ────────────────────────────────────────────────────────────
create table if not exists public.ai_settings (
  id uuid primary key default uuid_generate_v4(),
  provider text not null check (provider in ('anthropic','openai','google')),
  model text not null,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Erster Eintrag: Claude Sonnet 4
insert into public.ai_settings (provider, model, active)
values ('anthropic', 'claude-sonnet-4-20250514', true)
on conflict do nothing;

-- Keine RLS-Policies: Zugriff nur via service_role (Admin-Panel + API-Routes).

-- ────────────────────────────────────────────────────────────
-- whatsapp_messages: Log aller eingehenden/ausgehenden WhatsApp-Nachrichten
-- ────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound')),
  from_number text not null,
  to_number text not null,
  body text,
  media_url text,
  processed_receipt_id uuid references public.receipts(id) on delete set null,
  status text not null default 'received' check (status in ('received','processed','failed','sent')),
  error_msg text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_user on public.whatsapp_messages(user_id, created_at desc);
create index if not exists idx_wa_status on public.whatsapp_messages(status, created_at desc);

alter table public.whatsapp_messages enable row level security;

create policy "wa_owner_select" on public.whatsapp_messages
  for select using (auth.uid() = user_id);
-- Inserts/Updates nur via service_role (Twilio-Webhook).
