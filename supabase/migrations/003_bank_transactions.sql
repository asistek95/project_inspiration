-- Migration 003: Kontoauszug-Abgleich (Bank Reconciliation)
-- Tabelle für importierte Banktransaktionen + Zuordnung zu Belegen.
-- Aktuell läuft das Feature localStorage-only (klarblick.bank_transactions.v1) —
-- diese Tabelle ist für die künftige Cloud-Sync vorbereitet, noch nicht angebunden.

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_ref text NOT NULL,
  booking_date date NOT NULL,
  valuta_date date,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  counterparty text NOT NULL,
  purpose text,
  iban text,
  matched_receipt_id uuid REFERENCES public.receipts(id) ON DELETE SET NULL,
  match_confidence numeric(3,2),
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_tx_user        ON public.bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_matched      ON public.bank_transactions(matched_receipt_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_booking_date ON public.bank_transactions(user_id, booking_date);

-- Dubletten-Schutz beim Import: gleiches Datum+Betrag+Gegenpartei nicht doppelt importieren
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_tx_dedupe
  ON public.bank_transactions(user_id, booking_date, amount, lower(counterparty));

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_transactions_owner_all" ON public.bank_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
