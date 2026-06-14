-- ============================================================
-- Klarblick · WhatsApp + E-Mail Inbox Schema
-- ============================================================
-- Ausführen in Supabase SQL Editor (nach schema.sql + rls-roles.sql)
-- ============================================================

-- ── WhatsApp-Telefonnummer am Profil ─────────────────────────
alter table public.profiles
  add column if not exists whatsapp_phone text unique; -- z.B. "+436641234567"

-- Schneller Lookup: Webhook findet User über Telefonnummer
create index if not exists idx_profiles_whatsapp on public.profiles(whatsapp_phone)
  where whatsapp_phone is not null;

-- ── OTP-Verifikation für Telefonnummer ───────────────────────
create table if not exists public.phone_verifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  phone       text not null,
  code        text not null,           -- 6-stellig
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_phone_verif_user on public.phone_verifications(user_id);
create index if not exists idx_phone_verif_phone on public.phone_verifications(phone, used);

alter table public.phone_verifications enable row level security;

-- Nur der eigene User darf seinen OTP-Status lesen
create policy "phone_verif_self" on public.phone_verifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── E-Mail-Inbox: zusätzliche Felder ─────────────────────────
alter table public.email_inbox
  add column if not exists ocr_data      jsonb,          -- OCR-Ergebnis pro Anhang
  add column if not exists attachment_count int not null default 0,
  add column if not exists body_text     text,           -- Plaintext-Body
  add column if not exists preview_ready boolean not null default false;

-- ── WhatsApp-Nachrichten-Log ──────────────────────────────────
create table if not exists public.whatsapp_messages (
  id          uuid primary key default uuid_generate_v4(),
  -- user_id = Inhaber-Account (auch wenn Nachricht von Kollegen kam)
  user_id     uuid references auth.users(id) on delete set null,
  -- sender_phone = tatsächliche Absender-Nummer ("+436641234567")
  sender_phone text not null,
  sender_name  text,                   -- Name aus WhatsApp falls verfügbar
  direction   text not null check (direction in ('inbound','outbound')),
  body        text,
  media_url   text,                    -- Twilio Media URL (temporär, läuft ab)
  media_type  text,                    -- "image/jpeg", "application/pdf", etc.
  ocr_data    jsonb,                   -- OCR-Ergebnis aus Claude Vision
  status      text not null default 'pending'
              check (status in ('pending','imported','failed','no_media')),
  receipt_id  uuid references public.receipts(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_wa_user on public.whatsapp_messages(user_id, created_at desc);
create index if not exists idx_wa_phone on public.whatsapp_messages(sender_phone, created_at desc);
create index if not exists idx_wa_status on public.whatsapp_messages(user_id, status) where status = 'pending';

alter table public.whatsapp_messages enable row level security;

create policy "wa_messages_self" on public.whatsapp_messages
  for select using (auth.uid() = user_id);

-- Service-Role darf alles schreiben (Webhook)
-- → wird über SUPABASE_SERVICE_ROLE_KEY im Backend gemacht, kein RLS-Policy nötig
