# Klarblick

**Vom Schuhkarton zum Management-Report.**

Klarblick ist kein klassischer Belegscanner. Er verwandelt Belege automatisch in einen
verständlichen Monatsreport für Unternehmer — und ein sauberes Paket für den Steuerberater.

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · Supabase · jsPDF**.

---

## 1. Setup

```bash
# Im Projektordner
npm install
cp .env.example .env.local
npm run dev
```

App läuft auf **http://localhost:3000**.

Ohne Supabase-Keys startet die App automatisch im **Demo-Modus**: realistische Demo-Daten
(80+ Belege, 4 Monate, Firma „Musterbau GmbH") werden lokal im `localStorage` gespeichert.

### Voraussetzungen
- Node.js ≥ 18
- npm ≥ 9

---

## 2. Supabase Setup (für Produktion)

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. **SQL-Editor** → Inhalt von [`supabase/schema.sql`](supabase/schema.sql) ausführen.
   - Legt Tabellen `profiles`, `receipts`, `categories`, `report_runs` an
   - Aktiviert **Row Level Security** (Mandantentrennung)
   - Erstellt privaten Storage-Bucket `receipts`
3. **Settings → API**: `URL` und `anon key` in `.env.local` kopieren.
4. **Authentication → Providers**: E-Mail aktivieren (oder Magic Link).
5. App neu starten.

---

## 3. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=          # Supabase Projekt-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key
SUPABASE_SERVICE_ROLE_KEY=         # Server-only, NIE im Browser nutzen
OPENAI_API_KEY=                    # Optional: für echte Vision-Extraktion
ANTHROPIC_API_KEY=                 # Optional: alternative Vision-API
```

> **Sicherheit:** Wenn `NEXT_PUBLIC_*` leer ist → Demo-Modus.
> Der `SERVICE_ROLE_KEY` darf **niemals** clientseitig verwendet werden.

---

## 4. Mock-Modus vs. echte Daten

| Bereich | Mock-Modus (default) | Produktion |
|---|---|---|
| Auth | `/dashboard` direkt zugänglich | Supabase E-Mail / Magic Link |
| Belege | `localStorage` mit 80+ Demo-Belegen | Tabelle `receipts` mit RLS |
| OCR | `lib/ocr.ts` → simulierte Daten + Confidence-Werte | Vision API (TODO Server-Route) |
| Dateien | Browser-Vorschau (Blob URLs) | Supabase Storage Bucket `receipts` |

### Demo zurücksetzen
- Sidebar → **Demo neu laden**
- oder Einstellungen → **Demo-Daten**

---

## 5. Echte OCR / Vision API anbinden

`lib/ocr.ts` exportiert `extractReceiptData(file)`. In Produktion eine Server-Route bauen:

```ts
// app/api/extract/route.ts (Beispiel)
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  // 1) Datei nach Supabase Storage hochladen (Server-Client mit Service-Role)
  // 2) Bild → OpenAI/Anthropic Vision mit strikter JSON-Schema-Prompt
  // 3) Confidence aus Modell-Antwort + Regelvalidierung (Datum, MwSt-Summe, …)
  // 4) Zurückgeben (siehe ExtractedReceipt-Typ)
}
```

**Regeln (gelten überall in der App):**
- Confidence < 0.7 → Status **unsicher**
- 0.7 – 0.89 → **Prüfung empfohlen**
- ≥ 0.9 → hohe Sicherheit, aber **immer prüfbar**

> ⚠️ Die App darf niemals behaupten, dass KI/OCR zu 100 % korrekt ist.
> Jeder Beleg braucht einen Prüfstatus.

---

## 6. PDF-Export

`lib/pdf.ts` → `generateReportPDF({ company, periodLabel, receipts, insights })`.

- Deckblatt, Executive Summary, Kosten- und Lieferanten-Analyse, Auffälligkeiten,
  Steuerberater-Checkliste, Belegliste, Footer-Disclaimer auf jeder Seite.
- Auch ohne Server lauffähig (clientseitig via jsPDF + autotable).

---

## 7. Deployment auf Vercel

1. Repo zu GitHub pushen.
2. Auf [vercel.com](https://vercel.com) importieren.
3. Environment Variables aus `.env.example` setzen.
4. Build-Command: `npm run build` · Output-Command: `npm start`.
5. Optional: Supabase **Site URL** auf Vercel-Domain setzen (Auth Redirect).

---

## 8. Projekt-Struktur (Wichtigste Dateien)

```
app/
  page.tsx                       Landing Page (USP, Pricing, Disclaimer)
  pricing/page.tsx               Pricing-Seite
  (auth)/login,register/         Auth-Flow (Supabase + Demo-Bypass)
  (app)/
    dashboard/page.tsx           Unternehmer-Cockpit + Insights
    upload/page.tsx              Drag&Drop · Kamera · Multi-Upload + Review
    receipts/page.tsx            Belegliste · Filter · Bulk-Aktionen
    receipts/[id]/page.tsx       Beleg-Prüfseite (Vorschau + Daten)
    report/page.tsx              Management-Report Builder + Preview
    tax-advisor/page.tsx         Steuerberater-Paket + Fortschritt
    settings/page.tsx            Firma, Demo-Daten

components/
  AppShell.tsx                   Sidebar + Header (Mobile-first)
  MetricCard.tsx · InsightCard.tsx · Badges.tsx · Charts.tsx · Disclaimer.tsx

lib/
  types.ts                       Vollständiges Datenmodell + Status-Labels
  demo-data.ts                   80+ realistische Demo-Belege (deterministisch)
  store.ts                       LocalStorage-Persistenz (Mock-Modus)
  ocr.ts                         extractReceiptData() mit Confidence-Tiers
  insights.ts                    Auto-Insights · Kennzahlen · Aggregationen
  pdf.ts                         PDF-Report + CSV-Export
  supabase.ts                    Client-Factory (nur wenn Keys gesetzt)

supabase/schema.sql              Tabellen, RLS-Policies, Storage-Bucket
```

---

## 9. Was ist Mock vs. echt?

**Mock (im MVP funktional, ersetzbar):**
- `lib/store.ts` → Belege im `localStorage`
- `lib/ocr.ts` → simulierte OCR-Ausgabe
- Datei-Vorschau → Browser Blob URLs (kein Upload zu Storage)
- Steuerberater-Link → `alert()`-Platzhalter

**Echt angebunden, sobald Supabase aktiv:**
- Auth (E-Mail/Passwort)
- Profil-Speicherung in `profiles`
- (Nach Anpassung) Belege in `receipts`-Tabelle mit RLS
- (Nach Anpassung) Datei-Upload in privaten Bucket `receipts/<user_id>/…`

---

## 10. Produktions-TODOs

- [ ] **DSGVO**: Auftragsverarbeitung, Verzeichnis von Verarbeitungstätigkeiten, Cookie-Banner
- [ ] **AGB · Datenschutz · Impressum** (Platzhalter im Footer)
- [ ] **GoBD-Konformität**: Unveränderbarkeit, Audit-Log, Aufbewahrungsfristen
- [ ] **Löschkonzept** & Datenexport (Recht auf Auskunft/Löschung)
- [ ] **Verschlüsselung** at-rest (Supabase liefert) + sensible Felder ggf. zusätzlich
- [ ] **Backups** & Disaster Recovery getestet
- [ ] **DATEV-Schnittstelle** (CSV-Mapping prüfen, später echte API)
- [ ] **ELSTER / UStVA** — bewusst NICHT im MVP
- [ ] **Echte OCR** (OpenAI Vision oder Anthropic) Server-Route + Rate-Limit
- [ ] **Rollen/Rechte** für Steuerberater-Zugang (read-only, zeitlich begrenzt)
- [ ] **Audit-Log** (wer hat was wann geändert?)
- [ ] **Mobile PWA** (Manifest, Offline-Cache, Add-to-Home-Screen)
- [ ] **Native Apps** iOS/Android (später, mit Kamera-Integration)
- [ ] **Stripe** für Subscription-Billing
- [ ] **E-Mail-Versand** (Resend / Postmark) für Steuerberater-Links
- [ ] **Rate-Limiting** auf API-Routen (z. B. Upstash)
- [ ] **Sentry / Logging** für Fehler-Monitoring

---

## 11. Wichtige rechtliche Hinweise (überall in der App eingebaut)

> **Klarblick ersetzt keine Steuerberatung.**
> Die App hilft bei Ordnung, Auswertung und Vorbereitung.
> **Alle automatisch erkannten Daten müssen geprüft werden.**

Status-System:
- **Ungeprüft** · **Unsicher** · **Geprüft** · **An Steuerberater übergeben**

---

## 12. Lizenz

MIT (anpassen vor Produktion).
