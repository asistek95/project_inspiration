-- ============================================================
-- Klarblick · Rollen-basiertes RLS
-- ============================================================
-- Ausführen NACH schema.sql in Supabase SQL Editor
--
-- Rollen:
--   owner   → Inhaber: voller Zugriff auf eigene Firma
--   member  → Mitarbeiter: Belege erfassen + prüfen, kein Löschen
--   advisor → Steuerberater: nur lesen + export, keine Änderungen
-- ============================================================

-- ── Team-Mitglieder Tabelle ──────────────────────────────────
create table if not exists public.team_members (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references auth.users(id) on delete cascade, -- Inhaber
  member_id   uuid references auth.users(id) on delete cascade,          -- eingeladener User
  email       text not null,
  role        text not null check (role in ('owner', 'member', 'advisor')),
  status      text not null default 'pending' check (status in ('pending', 'active')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists idx_team_company on public.team_members(company_id);
create index if not exists idx_team_member on public.team_members(member_id);

alter table public.team_members enable row level security;

-- Inhaber kann Team verwalten
create policy "team_owner_all" on public.team_members
  for all using (auth.uid() = company_id);

-- Mitglieder können eigene Einträge lesen
create policy "team_member_select" on public.team_members
  for select using (auth.uid() = member_id);

-- ── Hilfsfunktion: Rolle des aktuellen Users für eine Firma ──
create or replace function public.get_my_role(company_owner_id uuid)
returns text
language sql security definer stable
as $$
  select case
    when auth.uid() = company_owner_id then 'owner'
    else (
      select role from public.team_members
      where company_id = company_owner_id
        and member_id = auth.uid()
        and status = 'active'
      limit 1
    )
  end;
$$;

-- ── Receipts RLS mit Rollen ───────────────────────────────────
-- Bestehende Policies löschen
drop policy if exists "receipts_owner_all" on public.receipts;

-- Inhaber: voller Zugriff
create policy "receipts_owner_full" on public.receipts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Member: lesen + schreiben, KEIN löschen
create policy "receipts_member_select" on public.receipts
  for select
  using (
    exists (
      select 1 from public.team_members
      where company_id = receipts.user_id
        and member_id = auth.uid()
        and role in ('member', 'advisor')
        and status = 'active'
    )
  );

create policy "receipts_member_insert" on public.receipts
  for insert
  with check (
    exists (
      select 1 from public.team_members
      where company_id = auth.uid()
        and member_id = auth.uid()
        and role = 'member'
        and status = 'active'
    )
  );

create policy "receipts_member_update" on public.receipts
  for update
  using (
    exists (
      select 1 from public.team_members
      where company_id = receipts.user_id
        and member_id = auth.uid()
        and role = 'member'
        and status = 'active'
    )
  );

-- Advisor: NUR lesen, keine Schreiboperationen
-- (bereits über receipts_member_select abgedeckt, delete absichtlich nicht erlaubt)

-- ── Profile: Team-Mitglieder können Firmenprofil lesen ────────
drop policy if exists "profiles_self_modify" on public.profiles;

create policy "profiles_self_modify" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_team_select" on public.profiles
  for select using (
    exists (
      select 1 from public.team_members
      where company_id = profiles.id
        and member_id = auth.uid()
        and status = 'active'
    )
  );

-- ── ATU-Nummer zur profiles Tabelle hinzufügen ────────────────
alter table public.profiles add column if not exists atu_nummer text;
alter table public.profiles add column if not exists receipt_number_next int not null default 1;
alter table public.profiles add column if not exists receipt_number_config jsonb;

-- ── Receipts: fehlende Felder nachrüsten ─────────────────────
alter table public.receipts add column if not exists direction text check (direction in ('eingang','ausgang','neutral'));
alter table public.receipts add column if not exists invoice_type text check (invoice_type in ('eingang','ausgang','unknown'));
alter table public.receipts add column if not exists vendor_uid text;
alter table public.receipts add column if not exists vendor_identifier_confidence numeric(3,2);
alter table public.receipts add column if not exists is_vendor_match boolean default false;
alter table public.receipts add column if not exists vat_treatment text;
alter table public.receipts add column if not exists reverse_charge boolean default false;
alter table public.receipts add column if not exists reverse_charge_law text;
alter table public.receipts add column if not exists period text;
alter table public.receipts add column if not exists invoice_number text;
alter table public.receipts add column if not exists receipt_number text;
alter table public.receipts add column if not exists ocr_filename text;
alter table public.receipts add column if not exists user_custom_name text;
alter table public.receipts add column if not exists rechnung_subtyp text;
alter table public.receipts add column if not exists vorsteuerabzug boolean;
alter table public.receipts add column if not exists custom_category text;
