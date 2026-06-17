# Klarblick — OCR-Integration & Klassifikations-Engine

**Stand:** Juni 2026 (aktualisiert 17.06.2026)
**Status:** ✅ Live implementiert in `app/api/ocr/route.ts` + `lib/ocr.ts`

---

## 1. Warum Claude Vision?

| Kriterium | **Claude Sonnet 4.6** | GPT-4o Vision | Google DocAI | Mindee |
|---|---|---|---|---|
| Genauigkeit AT-Belege | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ |
| Österreich MwSt-Sätze (20/13/10%) | **Nativ verstanden** | Teilweise | Nein | Nein |
| Eingang vs. Ausgang erkennen | **Per ATU-Matching** | Nur manuell | Nein | Nein |
| Reverse Charge §19 AT erkennen | **Ja, nativ** | Teilweise | Nein | Nein |
| JSON-Structured Output | Sehr zuverlässig | Gut | Gut (Templates) | Gut |
| Kosten/Beleg | ~0,010 € | ~0,008 € | ~0,03 € | ~0,08 € |
| EU-Server-Option | US + EU (AVV möglich) | US | Ja | Ja (Paris) |
| Setup-Komplexität | Niedrig (1 API-Call) | Niedrig | Hoch | Niedrig |

**Entscheidung:** **Claude Sonnet 4.6 (Anthropic)** — ausschlaggebend war die überlegene Fähigkeit,
österreichische Steuermerkmale (ATU-Nummer, §12 Vorsteuer, Reverse Charge §19) nativ zu verstehen.

---

## 2. Architektur (Live)

```
Eingangskanäle:
  📁 Datei-Upload (Browser)         → POST /api/ocr
  📷 Kamera/Foto (Browser)          → POST /api/ocr
  💬 WhatsApp-Foto (Twilio Webhook) → POST /api/whatsapp → intern /api/ocr
  ✉️  E-Mail-Anhang (Postmark)       → POST /api/email/webhook → intern /api/ocr

/api/ocr (Next.js API Route):
  ↓ Datei als Buffer lesen
  ↓ base64 enkodieren
  ↓ POST https://api.anthropic.com/v1/messages
    model: claude-sonnet-4-6
    content: [{ type: "image", ... }, { type: "text", text: PROMPT }]
  ↓ JSON parsen + validieren
  ↓ 4-Stufen-Klassifikation (Eingang/Ausgang)
  ↓ Kategorie richtungsabhängig zuweisen
  ↓ localStorage + Supabase (bgSync)
```

---

## 3. Extrahierte Felder (vollständig)

```ts
{
  vendor:                  string,     // "N&Z KFZ Reparatur KG"
  vendor_uid:              string,     // "ATU73773749"
  date:                    string,     // "2026-05-07" (ISO)
  gross_amount:            number,     // 90.00
  net_amount:              number,     // 90.00
  vat_amount:              number,     // 0.00
  vat_rate:                number,     // 0 | 10 | 13 | 20
  currency:                string,     // "EUR"
  invoice_type:            string,     // "eingang" | "ausgang" | "unknown"
  direction:               string,     // "eingang" | "ausgang" | "neutral"
  category:                string,     // aus EINGANGSKATEGORIEN / AUSGANGSKATEGORIEN
  receipt_type:            string,     // "Rechnung" | "Kassenbon" | "Tankbeleg" | ...
  receipt_number:          string,     // fortlaufend (KB-2026-0001, ER-2026-0001, ...)
  original_invoice_number: string,     // Rechnungsnummer vom Aussteller (z.B. "2026-1258")
  recipient_name:          string,     // Empfänger der Rechnung
  recipient_uid:           string,     // ATU des Empfängers
  invoice_type_reason:     string,     // Begründung der Klassifikation (für StB)
  vat_treatment:           string,     // "reverse_charge_§19_bauleistung" | "standard_20" | ...
  reverse_charge:          boolean,    // true wenn §19 Abs. 1a UStG
  vorsteuerabzug:          boolean,    // §12 UStG — Vorsteuer abzugsfähig?
  confidence_score:        number,     // 0..1
  warnings:                string[],   // AT-Steuerrechtliche Hinweise für StB
}
```

---

## 4. 4-Stufen-Klassifikation Eingang/Ausgang (`lib/ocr.ts`)

```
Stufe 1a: ATU des Ausstellers = Unternehmens-ATU (klarblick.profile.atu_nummer)
          → AUSGANG (wir haben diese Rechnung ausgestellt)
          Confidence: 0.97

Stufe 1b: ATU des Empfängers = Unternehmens-ATU
          → EINGANG (wir haben diese Rechnung bekommen)
          Confidence: 0.97

Stufe 2a: Firmenname des Ausstellers ≈ Unternehmensname (fuzzy)
          → AUSGANG
          Confidence: 0.90

Stufe 2b: Firmenname des Empfängers ≈ Unternehmensname (fuzzy)
          → EINGANG
          Confidence: 0.90

Stufe 3: Belegart-Heuristik
          Kassenbon, Tankbeleg, Bewirtungsbeleg → EINGANG (neutral)
          Confidence: 0.85

Stufe 4: OCR-Rateversuch
          Confidence: 0.60 → warnings gesetzt
```

**Ergebnis wird gespeichert in:**
- `direction` (eingang/ausgang/neutral)
- `invoice_type_reason` (Begründungstext für Steuerberater, sichtbar in UI)
- `vendor_identifier_confidence` (0..1)

---

## 5. Richtungsabhängige Kategorien (`lib/types.ts`)

Seit Juni 2026 gibt es zwei getrennte Kategorienlisten:

### EINGANGSKATEGORIEN (Kosten)
Wareneinkauf, Lebensmittel/Supermarkt, Werkzeug & Material, Fahrtkosten, Treibstoff,
Bewirtung, Werbung & Marketing, Bürobedarf, Telefon & Internet, Software, Miete,
Versicherungen, Personal/Lohn, Reise & Diäten, Bau & Instandhaltung, Anlagegut, Sonstiges

### AUSGANGSKATEGORIEN (Erlöse)
Erlöse Bauleistung, Erlöse Personalüberlassung, Erlöse Dienstleistung,
Erlöse Wartung & Service, Erlöse Warenverkauf, Erlöse Sonstiges

**Hilfsfunktion:** `getCategoriesForDirection(direction?)` gibt die passende Liste zurück.
Upload-Page und Detail-Page zeigen nur die zur Richtung passenden Kategorien.

**Regelung:** Eine Ausgangsrechnung darf keine Kostenkategorie bekommen und umgekehrt.

---

## 6. Supplier-Gedächtnis (`lib/ocr.ts` + `lib/intern-cats.ts`)

Bekannte AT-Lieferanten sind hart kodiert mit:
- Name + keywords
- Standardkategorie (direction-aware)
- Zahlungsart
- Minmax-Betrag

Beispiele:
```
EUROSPAR/Billa/Hofer → "Lebensmittel / Supermarkt" (Eingang)
Würth/Hilti/Festool → "Werkzeug & Material" (Eingang)
Shell/OMV → "Fahrtkosten" / "Treibstoff" (Eingang)
```

Zusätzlich: **Interne Kategorien** (Ebene 2) pro Mandant in localStorage:
`klarblick.supplier_cats.v1` → merkt sich "Würth" → "Subunternehmer"

---

## 7. Belegnummerierung (`lib/numbering.ts`)

Fortlaufend, GoBD-konform, typ- und richtungsabhängig:

| Belegart | Richtung | Präfix | Beispiel |
|---|---|---|---|
| Kassenbon | eingang | KB-YYYY- | KB-2026-0001 |
| Rechnung | eingang | ER-YYYY- | ER-2026-0001 |
| Rechnung | ausgang | AR-YYYY- | AR-2026-0001 |
| Quittung | - | QT-YYYY- | QT-2026-0001 |
| Tankbeleg | - | TB-YYYY- | TB-2026-0001 |

Gespeichert in `localStorage.klarblick.numbering`. Konfigurierbar unter Einstellungen → Belegnummerierung.

---

## 8. Steuerfall-Transparenz (UI)

Die `OcrClassificationBlock`-Komponente in der Upload-Maske zeigt:
- Richtung (Eingang/Ausgang) + Confidence %
- Aussteller + ATU
- Empfänger + ATU
- Mandant + ATU (aus klarblick.profile)
- `invoice_type_reason` (Erkennungsregel als Klartext)

Die Komponente ist einklappbar — kompakte Ansicht für schnellen Workflow,
Details auf Knopfdruck für Steuerberater.

Warnungen (Steuerhinweise) sind standardmäßig eingeklappt.

---

## 9. Österreich-spezifischer Prompt (Kern-USP)

Claude wird explizit mit AT-Steuerrecht instruiert:

```
Du bist Buchhaltungs-Assistent für ÖSTERREICHISCHE Handwerksbetriebe.
Geltendes Recht: UStG 1994, §12 Vorsteuerabzug, §19 Reverse Charge.

MwSt-Sätze AT:
- 20 %: Normalsteuersatz (Werkzeug, Material, Sprit, meiste Dienstleistungen)
- 13 %: Kulturleistungen, bestimmte Lebensmittel, Saatgut
- 10 %: Grundnahrungsmittel, Bücher, Miete, Personenbeförderung
- 0 %:  Bauleistungen §19, innergemeinschaftliche Lieferungen, Exporte

Eingang vs. Ausgang:
- ATU des Unternehmens: {atu_nummer}
- Steht diese ATU im Empfänger-Feld → EINGANG (Vorsteuer §12 prüfen)
- Steht diese ATU im Aussteller-Feld  → AUSGANG (USt-Schuld)

Vorsteuer-Ausschluss §12 Abs. 2:
- PKW/Kombi → KEIN Vorsteuerabzug (nur Kastenwagen/LKW erlaubt)
- Repräsentation → kein Abzug
- Privatanteil > 50 % → nur anteilig

Antworte AUSSCHLIESSLICH als JSON, keine Erklärungen.
```

---

## 10. ENV-Variables

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...   # Pflicht
NEXT_PUBLIC_SUPABASE_URL=...         # Pflicht
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Pflicht
# kein OPENAI_API_KEY nötig
```

---

## 11. Kosten-Schätzung (Claude Sonnet 4.6)

| Anzahl Kunden | Belege/Monat | Kosten Anthropic |
|---|---|---|
| 10 (Pilot) | 300 | ~3 € |
| 25 (J1) | 1.500 | ~15 € |
| 80 (J2) | 5.000 | ~50 € |
| 200 (J3) | 15.000 | ~150 € |

**Pro Kunde: ~0,60 €/Monat** bei Plan-Preisen €20–50 = < 3 % Kostenanteil. Sehr gesund.

---

## 12. DSGVO

- Anthropic ist US-Anbieter → AVV abschließbar (Anthropic EU Terms)
- API-Calls werden nicht für Training verwendet (Zero-Retention)
- Belegbilder werden nicht dauerhaft auf Anthropic-Servern gespeichert
- In Datenschutzerklärung benennen: „KI-Analyse via Anthropic API, kein Training"
- Alle extrahierten Textdaten liegen ausschließlich in der EU-Supabase-Instanz (Frankfurt)
- Supabase Storage (Belegdateien): EU-Region, 7 Jahre Aufbewahrung (§132 BAO)

---

## 13. Edge-Cases

| Edge-Case | Lösung |
|---|---|
| Schief fotografierter Beleg | Claude Vision erkennt rotation nativ |
| Sehr unscharf | warnings gesetzt → manuelles Edit-Formular |
| PDF mehrseitig | Erste Seite verarbeitet (Deckblatt-Erkennung) |
| HEIC (iPhone) | Browser konvertiert client-side zu JPEG |
| Ausländischer Beleg (DE, IT, EN) | Funktioniert, Claude erkennt MwSt-Satz des Landes |
| Handgeschriebener Lieferschein | confidence niedrig, warnings → manuell |
| WhatsApp-Foto (komprimiert) | Twilio liefert direkte Media-URL, Base64-Fetch |
| E-Mail-Anhang (PDF) | Postmark liefert Base64 im JSON-Payload direkt |
| Gleicher Beleg doppelt | Fingerprint-Duplikaterkennung, Duplikat-UI |
| Ausgangsrechnung als Eingang klassifiziert | OcrClassificationBlock → "Ändern"-Button |
