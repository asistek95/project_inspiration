# Klarblick — OCR-Integration (GPT-4o Vision)

**Stand:** Mai 2026
**Status:** Geplant, ersetzt aktuelles `lib/ocr.ts` Mock

---

## 1. Warum GPT-4o Vision?

| Kriterium | GPT-4o Vision | Claude 3.5 Vision | Google DocAI | Mindee |
|---|---|---|---|---|
| Genauigkeit DE-Belege | ★★★★★ | ★★★★★ | ★★★★ | ★★★★ |
| Kosten/Beleg | ~0,008 € | ~0,012 € | ~0,03 € | ~0,08 € |
| Layout-Verständnis | Exzellent (versteht Layout-Kontext) | Exzellent | Gut (Templates) | Sehr gut |
| Setup-Komplexität | Niedrig (1 API-Call) | Niedrig | Hoch (GCP-Projekt) | Niedrig |
| EU-Server | Nein (US, AVV möglich) | Nein (US/EU optional) | Ja | Ja (Paris) |
| Fallback bei Fehler | API down → Queue | analog | analog | analog |

**Entscheidung:** **GPT-4o Vision** als Primär-OCR, **Mindee** als DSGVO-strenger EU-Fallback für Kunden, die das fordern.

---

## 2. Architektur

```
Browser (Upload-Komponente)
  ↓ POST /api/ocr  (multipart/form-data, max 10 MB)
Next.js API-Route (Server-Side)
  ↓ konvertiert zu base64
  ↓ POST https://api.openai.com/v1/chat/completions
OpenAI GPT-4o Vision API
  ↓ strukturiertes JSON
Next.js API-Route
  ↓ Zod-Validation + Sanitization
  ↓ Speichert in Supabase (Tabelle receipts)
Client erhält Receipt-Objekt
```

---

## 3. API-Route — Pseudocode

`app/api/ocr/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReceiptSchema = z.object({
  vendor: z.string(),
  date: z.string(), // ISO YYYY-MM-DD
  netto: z.number(),
  mwst: z.number(),
  brutto: z.number(),
  mwstSatz: z.number(), // 7 oder 19 (DE), 10 oder 20 (AT)
  currency: z.string().default("EUR"),
  category: z.enum(["material", "werkzeug", "sprit", "sub", "abo", "sonstiges"]).optional(),
  paymentDeadline: z.string().nullable().optional(),
  skontoFrist: z.string().nullable().optional(),
  skontoProzent: z.number().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

const PROMPT = `Du bist ein Buchhaltungs-Assistent für österreichische und deutsche Handwerksbetriebe.
Extrahiere aus dem Beleg folgende Felder als reines JSON (keine Erklärungen):
- vendor: Name des Lieferanten/Geschäfts
- date: Belegdatum im Format YYYY-MM-DD
- netto: Nettobetrag in EUR (Zahl)
- mwst: MwSt-Betrag in EUR
- brutto: Bruttobetrag in EUR
- mwstSatz: MwSt-Satz in Prozent (7, 10, 19 oder 20)
- currency: Währung (default EUR)
- category: einer von [material, werkzeug, sprit, sub, abo, sonstiges]
- paymentDeadline: Zahlungsziel als YYYY-MM-DD oder null
- skontoFrist: Skonto-Frist als YYYY-MM-DD oder null
- skontoProzent: Skonto-Prozentsatz als Zahl oder null
- confidence: Deine Sicherheit zwischen 0.0 und 1.0

Wenn ein Feld nicht erkennbar ist, gib null zurück. Antworte AUSSCHLIESSLICH mit JSON.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
    if (file.size > 10_000_000) return NextResponse.json({ error: "too large" }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mime = file.type || "image/jpeg";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "ocr_failed" }, { status: 502 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const validated = ReceiptSchema.parse(parsed);

    return NextResponse.json(validated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "internal" }, { status: 500 });
  }
}
```

---

## 4. Frontend-Anpassung

`lib/ocr.ts` wird zu:

```ts
export async function extractReceiptData(file: File): Promise<Receipt> {
  const fd = new FormData();
  fd.append("file", file);

  const r = await fetch("/api/ocr", { method: "POST", body: fd });
  if (!r.ok) {
    // Fallback: leeres Manual-Edit-Formular zurückgeben
    return blankReceipt(file.name);
  }
  const data = await r.json();
  return mapToReceipt(data, file.name);
}
```

---

## 5. ENV-Variables

```bash
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OCR_PROVIDER=openai   # später "mindee" optional
MINDEE_API_KEY=...                # nur falls Fallback aktiv
```

---

## 6. Kosten-Schätzung

| Anzahl Kunden | Belege/Monat (∅ 80/Kunde) | Gesamt-Belege | Kosten OpenAI |
|---|---|---|---|
| 25 (J1) | 2.000 | 2.000 | 16 € |
| 80 (J2) | 6.400 | 6.400 | 51 € |
| 200 (J3) | 16.000 | 16.000 | 128 € |
| 600 (J5) | 48.000 | 48.000 | 384 € |

**Pro Kunde: 0,64 €/Monat OCR-Kosten** — bei 149 €/Monat Preis = **0,43 % Kostenanteil**. Sehr gesund.

---

## 7. DSGVO-Behandlung

**Problem:** OpenAI ist US-Anbieter. Belege enthalten oft personenbezogene Daten (Lieferanten-Namen, Inhaber-Namen).

**Lösung:**
1. **Standard-Vertragsklauseln** (SCC) mit OpenAI abgeschlossen — siehe https://openai.com/policies/eu-terms
2. **AVV** mit OpenAI vorhanden
3. **In Datenschutzerklärung explizit benennen**: „Wir nutzen OpenAI Ireland Ltd. (Dublin) zur Beleg-Analyse. Belegdaten werden zur Verarbeitung übermittelt, nicht zum Training verwendet (Zero-Retention-Modus)."
4. **Zero-Retention-Modus aktivieren** bei OpenAI (Enterprise-Feature, oder pro API-Call mit Header `OpenAI-Beta: assistants=v2` und entsprechendem Setting)
5. **Mindee als Opt-In-Fallback** für Kunden mit strengen Anforderungen (z. B. öffentliche Auftraggeber-Belege)

---

## 8. Test-Plan

### Test-Set: 100 echte Belege
- 30 Hornbach/Bauhaus-Kassenzettel (gedruckt)
- 20 Würth/Industriewerkzeuge PDF-Rechnungen
- 20 GC Gienger/Großhandel Sanitär PDF
- 10 Shell/OMV Tankquittungen
- 10 Mobilfunk/Strom-Rechnungen
- 10 Handgeschriebene Lieferscheine (Edge-Case)

### Erfolgs-Metrik
- **Vendor**: ≥ 95 % korrekt
- **Datum**: ≥ 98 %
- **Brutto-Betrag**: ≥ 95 %
- **MwSt-Trennung**: ≥ 90 %
- **Skonto-Erkennung**: ≥ 80 % (oft handschriftlich oder versteckt)

### Validierung
- Jeder Beleg wird manuell mit Klarblick-OCR-Output verglichen
- Abweichungen in Excel dokumentiert
- Prompt iterieren bei < 90 %

---

## 9. Edge-Cases & Lösungen

| Edge-Case | Lösung |
|---|---|
| Schief fotografierter Beleg | GPT-4o erkennt rotation, kein Pre-Processing nötig |
| Sehr unscharf | Confidence < 0.5 → manuelle Eingabe-UI |
| Mehrere Belege auf einem Foto | Prompt erkennt, fragt User welcher gemeint ist |
| PDF mit mehreren Seiten | Vor Upload alle Seiten zu JPGs konvertieren (pdf.js client-side) |
| Handgeschriebener Lieferschein | Confidence niedrig → manuelles Editier-Formular |
| HEIC (iPhone) | Client-side Konvertierung zu JPG (heic2any) |
| Ausländischer Beleg (z. B. IT, EN) | Funktioniert, MwSt-Satz erkennt OpenAI auch |

---

## 10. Implementierungs-Schritte (konkret)

- [ ] **Tag 1**: Branch `feat/real-ocr` erstellen
- [ ] **Tag 1**: OpenAI-API-Key besorgen, ENV setzen
- [ ] **Tag 1**: `app/api/ocr/route.ts` schreiben (siehe oben)
- [ ] **Tag 2**: `lib/ocr.ts` umschreiben auf API-Call
- [ ] **Tag 2**: Manuelles Editier-Formular bauen (für niedrige Confidence)
- [ ] **Tag 3**: 20 echte Belege testen, Bugs fixen
- [ ] **Tag 4**: Prompt iterieren bis > 90 % Genauigkeit
- [ ] **Tag 5**: Confidence-Score-UI im Upload-Flow
- [ ] **Tag 6**: HEIC + PDF-Support
- [ ] **Tag 7**: 100-Beleg-Test, dokumentieren, mergen

**Geschätzter Aufwand: 5–7 Personentage** (also 1–2 Wochen Solo neben Vertrieb).
