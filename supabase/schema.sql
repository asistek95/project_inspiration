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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_receipts_user on public.receipts(user_id);
create index if not exists idx_receipts_user_date on public.receipts(user_id, receipt_date desc);
create index if not exists idx_receipts_status on public.receipts(user_id, status);

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
