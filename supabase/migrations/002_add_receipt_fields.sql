-- Migration 002: Fehlende Receipt-Felder (Eingang/Ausgang, Empfänger, Steuerfall)
-- Sicher per IF NOT EXISTS — kann mehrfach ausgeführt werden.

ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS direction           text DEFAULT 'eingang';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS rechnung_subtyp     text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS recipient_name      text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS recipient_uid       text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS invoice_type_reason text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS original_invoice_number text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS receipt_number      text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS custom_category     text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS vorsteuerabzug      boolean;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS vat_treatment       text;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS reverse_charge      boolean DEFAULT false;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS audit_log           jsonb NOT NULL DEFAULT '[]';

-- Indizes für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_receipts_direction    ON public.receipts(user_id, direction);
CREATE INDEX IF NOT EXISTS idx_receipts_orig_nr      ON public.receipts(user_id, original_invoice_number);
CREATE INDEX IF NOT EXISTS idx_receipts_reverse      ON public.receipts(user_id, reverse_charge) WHERE reverse_charge = true;
