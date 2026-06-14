-- Klarblick · Supabase Schema
-- Aktiviert Row Level Security für sichere Multi-Tenant-Daten.

create extension if not exists "uuid-ossp";

-- Profile (1:1 mit auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  owner_name text,
  tax_advisor_email text,
  company_type text,
  atu_nummer text,                    -- ATU-Nummer für OCR-Matching
  receipt_number_next int not null default 1,
  receipt_number_config jsonb,
  created_at timestamptz not null default now()
);

-- Kategorien
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#2563eb',
  created_at timestamptz not null default now()
);
create index if not exists idx_categories_user on public.categories(user_id);

-- Belege
create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text,
  file_name text,
  supplier_name text not null,
  receipt_date date not null,
  category text not null,
  receipt_type text,
  payment_method text,
  net_amount numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  gross_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  confidence_score numeric(3,2) not null default 0,
  status text not null default 'ungeprueft' check (status in ('ungeprueft','unsicher','geprueft','freigegeben')),
  warnings text[] not null default '{}',
  notes text,
  project text,
  -- Klarblick Pro: Skonto + GoBD
  payment_terms jsonb,        -- { skonto_pct, days, net_days }
  is_recurring boolean not null default false,
  paid_at date,
  iban text,
  fingerprint text,           -- für Dubletten-Erkennung
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_receipts_user on public.receipts(user_id);
create index if not exists idx_receipts_user_date on public.receipts(user_id, receipt_date desc);
create index if not exists idx_receipts_status on public.receipts(user_id, status);
create index if not exists idx_receipts_fingerprint on public.receipts(user_id, fingerprint);
create index if not exists idx_receipts_recurring on public.receipts(user_id, is_recurring) where is_recurring = true;

-- Audit-Log (GoBD-Konformität: alle Änderungen unveränderlich)
create table if not exists public.receipt_audit (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ts timestamptz not null default now(),
  action text not null check (action in ('created','updated','deleted','status_change')),
  field text,
  before_value text,
  after_value text
);
create index if not exists idx_audit_receipt on public.receipt_audit(receipt_id, ts desc);
create index if not exists idx_audit_user on public.receipt_audit(user_id, ts desc);

-- E-Mail-Forwarding Inbox
create table if not exists public.email_inbox (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,             -- z.B. "amin.sistek20+klarblick@gmail.com"
  from_address text not null,
  subject text,
  received_at timestamptz not null default now(),
  attachment_url text,
  processed_receipt_id uuid references public.receipts(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','processed','failed','rejected'))
);
create index if not exists idx_inbox_user on public.email_inbox(user_id, received_at desc);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receipts_updated on public.receipts;
create trigger trg_receipts_updated before update on public.receipts
for each row execute procedure public.set_updated_at();

-- Report-Runs
create table if not exists public.report_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_gross numeric(14,2) not null default 0,
  total_vat numeric(14,2) not null default 0,
  receipt_count int not null default 0,
  checked_count int not null default 0,
  uncertain_count int not null default 0,
  report_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_user on public.report_runs(user_id);

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.receipts enable row level security;
alter table public.categories enable row level security;
alter table public.report_runs enable row level security;
alter table public.receipt_audit enable row level security;
alter table public.email_inbox enable row level security;

-- Profile: jeder darf nur sein eigenes lesen/schreiben
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_modify" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Receipts
create policy "receipts_owner_all" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Categories
create policy "categories_owner_all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Report runs
create policy "reports_owner_all" on public.report_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit-Log: nur lesbar (GoBD-Unveränderlichkeit), Inserts via Trigger / Server
create policy "audit_owner_select" on public.receipt_audit
  for select using (auth.uid() = user_id);
create policy "audit_owner_insert" on public.receipt_audit
  for insert with check (auth.uid() = user_id);
-- absichtlich kein update/delete für audit_log → GoBD-konform

-- E-Mail-Inbox
create policy "inbox_owner_all" on public.email_inbox
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Storage Bucket für Belegdateien (privat)
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts_storage_owner_read"
on storage.objects for select
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_storage_owner_insert"
on storage.objects for insert
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_storage_owner_delete"
on storage.objects for delete
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
