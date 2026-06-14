# Klarblick — OCR-Integration (Claude Vision)

**Stand:** Juni 2026  
**Status:** ✅ Live implementiert in `app/api/ocr/route.ts`

---

## 1. Warum Claude Vision?

| Kriterium | **Claude Sonnet 4.6** | GPT-4o Vision | Google DocAI | Mindee |
|---|---|---|---|---|
| Genauigkeit AT-Belege | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ |
| Österreich MwSt-Sätze (20/13/10%) | **Nativ verstanden** | Teilweise | Nein | Nein |
| Eingang vs. Ausgang erkennen | **Per ATU-Matching** | Nur manuell | Nein | Nein |
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
    content: [{ type: "image", source: { type: "base64", ... } }, { type: "text", text: PROMPT }]
  ↓ JSON parsen + validieren
  ↓ Eingang/Ausgang bestimmen (ATU-Matching)
  ↓ INSERT INTO receipts (Supabase, RLS: user_id)
  ↓ Response an Client / Webhook-Caller
```

---

## 3. Extrahierte Felder

```ts
// Rückgabe von /api/ocr
{
  vendor:          string,     // "Shell Tankstelle Wien"
  date:            string,     // "2026-06-12" (ISO)
  gross_amount:    number,     // 87.40
  net_amount:      number,     // 72.83
  vat_amount:      number,     // 14.57
  vat_rate:        number,     // 20 (AT: 20 | 13 | 10 | 0)
  currency:        string,     // "EUR"
  invoice_type:    string,     // "eingang" | "ausgang" | "unknown"
  category:        string,     // "Treibstoff/KFZ"
  receipt_type:    string,     // "Tankbeleg"
  warnings:        string[],   // Unsicherheiten von Claude
}
```

---

## 4. Österreich-spezifischer Prompt (Kern-USP)

Claude wird explizit mit AT-Steuerrecht instruiert:

```
Du bist Buchhaltungs-Assistent für ÖSTERREICHISCHE Handwerksbetriebe.
Geltendes Recht: UStG 1994, §12 Vorsteuerabzug, §19 Reverse Charge.

MwSt-Sätze AT:
- 20 %: Normalsteuersatz (Werkzeug, Material, Sprit, meiste Dienstleistungen)
- 13 %: Kulturleistungen, bestimmte Lebensmittel, Saatgut
- 10 %: Grundnahrungsmittel, Bücher, Miete, Personenbeförderung
- 0 %:  Innergemeinschaftliche Lieferungen, Exporte

Eingang vs. Ausgang:
- ATU des Unternehmens: {atu_nummer}
- Steht diese ATU im Empfänger-Feld → EINGANG (Vorsteuer §12 prüfen)
- Steht eine FREMDE ATU im Empfänger → AUSGANG (USt-Schuld)

Vorsteuer-Ausschluss §12 Abs. 2:
- PKW/Kombi → KEIN Vorsteuerabzug (nur Kastenwagen/LKW erlaubt)
- Repräsentation → kein Abzug
- Privatanteil > 50 % → nur anteilig

Antworte AUSSCHLIESSLICH als JSON, keine Erklärungen.
```

---

## 5. Eingang / Ausgang Erkennung

```
ATU des Unternehmens (aus localStorage "klarblick.profile.atu_nummer")
          ↓
  Ist ATU im Empfänger-Feld des Belegs?
        JA ↓                    NEIN ↓
   invoice_type                invoice_type
   = "eingang"                 = "ausgang"
   Vorsteuer §12 prüfen        USt-Schuld berechnen
   → UVA Zeile 060             → UVA Zeile 000
```

---

## 6. Confidence & Warnings

| Status | Bedingung | App-Darstellung |
|---|---|---|
| ✅ geprueft | Alle Pflichtfelder vorhanden, warnings leer | Grüner Punkt |
| ⚠️ unsicher | Claude hat warnings gesetzt | Gelber Punkt, manuelle Prüfung |
| ❌ fehlgeschlagen | Kein JSON extrahierbar | Roter Punkt, manuell erfassen |

---

## 7. ENV-Variables

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...   # Pflicht
# kein OPENAI_API_KEY nötig
```

---

## 8. Kosten-Schätzung (Claude Sonnet 4.6)

| Anzahl Kunden | Belege/Monat | Kosten Anthropic |
|---|---|---|
| 10 (Pilot) | 300 | ~3 € |
| 25 (J1) | 1.500 | ~15 € |
| 80 (J2) | 5.000 | ~50 € |
| 200 (J3) | 15.000 | ~150 € |

**Pro Kunde: ~0,60 €/Monat** bei Plan-Preisen €20–50 = < 3 % Kostenanteil. Sehr gesund.

---

## 9. DSGVO

- Anthropic ist US-Anbieter → AVV abschließbar (Anthropic EU Terms)
- API-Calls werden nicht für Training verwendet (Zero-Retention)
- Belegbilder werden nicht dauerhaft auf Anthropic-Servern gespeichert
- In Datenschutzerklärung benennen: „KI-Analyse via Anthropic (API, kein Training)"
- Alle extrahierten Textdaten liegen ausschließlich in der EU-Supabase-Instanz (Frankfurt)

---

## 10. Edge-Cases

| Edge-Case | Lösung |
|---|---|
| Schief fotografierter Beleg | Claude Vision erkennt rotation nativ |
| Sehr unscharf | warnings gesetzt → manuelles Edit-Formular |
| PDF mehrseitig | Erste Seite wird verarbeitet (Deckblatt-Erkennung) |
| HEIC (iPhone) | Browser konvertiert client-side zu JPEG |
| Ausländischer Beleg (DE, IT, EN) | Funktioniert, Claude erkennt MwSt-Satz des Landes |
| Handgeschriebener Lieferschein | confidence niedrig, warnings → manuell |
| WhatsApp-Foto (komprimiert) | Twilio liefert direkte Media-URL, Base64-Fetch |
| E-Mail-Anhang (PDF) | Postmark liefert Base64 im JSON-Payload direkt |
