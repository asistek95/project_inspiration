-- Migration: Eingangs/Ausgangsrechnung-Erkennung + Beleg-Bennung
-- 2026-05-29

-- 1. Neue Felder zur receipts-Tabelle für Ein-/Ausgangsrechnung-Differenzierung
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'unknown' CHECK (invoice_type IN ('eingang', 'ausgang', 'unknown'));
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS vendor_uid text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS vendor_identifier_confidence numeric(3,2) DEFAULT 0;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS ocr_filename text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS user_custom_name text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS is_vendor_match boolean DEFAULT false;

-- 2. Index für invoice_type (für Auswertung Ein/Ausgang)
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_type ON public.receipts(user_id, invoice_type);

-- 3. Neue Tabelle für Unternehmen-Whitelist (zum Erkennen: ist das MEINE Rechnung als Ausgangsrechnung?)
CREATE TABLE IF NOT EXISTS public.company_identifiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_uid text,
  company_iban text,
  company_bank_name text,
  additional_identifiers text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_identifiers_user ON public.company_identifiers(user_id);
CREATE INDEX IF NOT EXISTS idx_company_identifiers_uid ON public.company_identifiers(user_id, company_uid);

-- 4. RLS für company_identifiers
ALTER TABLE public.company_identifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_identifiers_owner_all" ON public.company_identifiers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Neue Felder zu receipt_audit für OCR-Bennung Tracking
-- (audit_log bleibt unverändert, neue Einträge tracken field='user_custom_name' etc.)

-- 6. Partner-Erkennung für externe Steuerberater (später für Rollen)
CREATE TABLE IF NOT EXISTS public.user_teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES public.user_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  email text NOT NULL,
  invited_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- RLS für Teams
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_owner_all" ON public.user_teams
  FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "team_members_read" ON public.team_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_user_id FROM public.user_teams WHERE id = team_id
    ) OR auth.uid() = user_id
  );

CREATE POLICY "team_members_owner_manage" ON public.team_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_user_id FROM public.user_teams WHERE id = team_id
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT owner_user_id FROM public.user_teams WHERE id = team_id
    )
  );
