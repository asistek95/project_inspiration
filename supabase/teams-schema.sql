-- Klarblick · Team & Rollen Migration
-- ─────────────────────────────────────────────────────────────
-- Erlaubt mehrere Mitglieder pro Tenant (Inhaber, Mitarbeiter, Steuerberater-Read-Only).
-- Setzt Row-Level-Security so um, dass auf receipts/profiles nur Team-Mitglieder zugreifen.

create extension if not exists "uuid-ossp";

-- TEAMS (Tenant-Container, gehört einem Owner)
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_teams_owner on public.teams(owner_id);

-- TEAM_MEMBERS (n:m zwischen teams und auth.users)
do $$ begin
  create type team_role as enum ('owner', 'member', 'advisor');
exception when duplicate_object then null; end $$;

create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role team_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_team_members_team on public.team_members(team_id);

-- TEAM_INVITES (offene Einladungen vor Annahme)
create table if not exists public.team_invites (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role team_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (team_id, email)
);
create index if not exists idx_team_invites_email on public.team_invites(lower(email));

-- ─────────────────────────────────────────────────────────────
-- AUDIT-LOG für dokumentierte Steuerberater-Übergaben (§ 132 BAO)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.handover_log (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  by_user_id uuid references auth.users(id) on delete set null,
  advisor_email text,
  period_from date,
  period_to date,
  receipt_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_handover_team on public.handover_log(team_id);

-- ─────────────────────────────────────────────────────────────
-- RLS aktivieren
-- ─────────────────────────────────────────────────────────────
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.team_invites  enable row level security;
alter table public.handover_log  enable row level security;

-- Helper: ist user mitglied im team?
create or replace function public.is_team_member(_team uuid, _user uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.team_members
    where team_id = _team and user_id = _user
  );
$$;

-- Helper: rolle des users im team
create or replace function public.team_role_of(_team uuid, _user uuid)
returns team_role language sql stable security definer as $$
  select role from public.team_members
  where team_id = _team and user_id = _user
  limit 1;
$$;

-- TEAMS Policies
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select
  using (public.is_team_member(id, auth.uid()));
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert
  with check (owner_id = auth.uid());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update
  using (owner_id = auth.uid());

-- TEAM_MEMBERS Policies
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select
  using (public.is_team_member(team_id, auth.uid()));
drop policy if exists team_members_modify on public.team_members;
create policy team_members_modify on public.team_members for all
  using (public.team_role_of(team_id, auth.uid()) = 'owner')
  with check (public.team_role_of(team_id, auth.uid()) = 'owner');

-- TEAM_INVITES Policies
drop policy if exists team_invites_select on public.team_invites;
create policy team_invites_select on public.team_invites for select
  using (public.team_role_of(team_id, auth.uid()) in ('owner', 'member'));
drop policy if exists team_invites_modify on public.team_invites;
create policy team_invites_modify on public.team_invites for all
  using (public.team_role_of(team_id, auth.uid()) = 'owner')
  with check (public.team_role_of(team_id, auth.uid()) = 'owner');

-- HANDOVER_LOG Policies (immutable für transparenten Audit-Trail)
drop policy if exists handover_select on public.handover_log;
create policy handover_select on public.handover_log for select
  using (public.is_team_member(team_id, auth.uid()));
drop policy if exists handover_insert on public.handover_log;
create policy handover_insert on public.handover_log for insert
  with check (public.is_team_member(team_id, auth.uid()) and by_user_id = auth.uid());
-- KEIN update/delete erlaubt (Audit-Log unveränderlich)

-- ─────────────────────────────────────────────────────────────
-- RECEIPTS um team_id erweitern (optional, vorerst nullable)
-- ─────────────────────────────────────────────────────────────
alter table if exists public.receipts
  add column if not exists team_id uuid references public.teams(id) on delete set null;

-- Optional: RLS-Policy für receipts so erweitern, dass auch advisor (read-only) zugreifen darf
-- (Wenn nicht gewünscht, alte Policies belassen.)
drop policy if exists receipts_select_team on public.receipts;
create policy receipts_select_team on public.receipts for select
  using (
    user_id = auth.uid()
    or (team_id is not null and public.is_team_member(team_id, auth.uid()))
  );

-- Advisor darf NICHT schreiben
drop policy if exists receipts_write_team on public.receipts;
create policy receipts_write_team on public.receipts for all
  using (
    user_id = auth.uid()
    or (team_id is not null and public.team_role_of(team_id, auth.uid()) in ('owner', 'member'))
  )
  with check (
    user_id = auth.uid()
    or (team_id is not null and public.team_role_of(team_id, auth.uid()) in ('owner', 'member'))
  );
