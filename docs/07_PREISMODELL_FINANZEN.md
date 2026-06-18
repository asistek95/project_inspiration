# Klarblick — Preismodell, Systemüberblick & FlexCo-Finanzplan

**Stand:** Juni 2026

---

## 1. Systemüberblick — Was ist gebaut (Stand 17.06.2026)

### Kernmodule (produktionsreif)

| Modul | Status | Beschreibung |
|---|---|---|
| **OCR-Engine** | ✅ Live | Claude Sonnet 4.6 Vision, AT-Steuerrecht-Prompt, Confidence-Score |
| **4-Stufen-Klassifikation** | ✅ Live | Eingang/Ausgang per ATU-Matching + Fuzzy-Name + Heuristik |
| **Richtungsabhängige Kategorien** | ✅ Live | EINGANGSKATEGORIEN (Kosten) vs. AUSGANGSKATEGORIEN (Erlöse) |
| **Belegnummerierung** | ✅ Live | GoBD-konform, typ- und richtungsabhängig (KB/ER/AR/TB/...) |
| **Supabase-Sync** | ✅ Live | localStorage-first + bgSync, Offline-Queue, 7-Jahre Storage |
| **DATEV EXTF-Export** | ✅ Live | Format v700/v13, Soll/Haben-Logik, AT-Steuerkonten |
| **UVA-Vorbereitung** | ✅ Live | Kennzahlen 000, 060, 057, 066 |
| **Reverse Charge §19** | ✅ Live | Bauleistung AT, Erkennungslogik + Transparenzblock |
| **Vorsteuer §12** | ✅ Live | Auto-Detection, Ausnahmen (PKW, Repräsentation) |
| **Offene Posten** | ✅ Live | Fälligkeitsübersicht, Skonto-Alarm |
| **Cashflow** | ✅ Live | Ein-/Ausgang-Saldo, Monatsübersicht |
| **Auswertung/Report** | ✅ Live | Lieferanten (Eingang) / Kunden (Ausgang) getrennt, PDF-Export |
| **14-Tage-Trial** | ✅ Live | Automatisch, keine Kreditkarte nötig |
| **Demo-Modus** | ✅ Live | 40 realistische AT-Belege, interaktive Anleitung |
| **Zwei-Ebenen-Kategorien** | ✅ Live | Steuerkategorie (auto) + Interne Kategorie (user-defined) |
| **Interne Kategorie / Lieferant-Gedächtnis** | ✅ Live | Merkt sich Kategorie pro Lieferant |
| **Duplicate-Detection** | ✅ Live | Fingerprint-basiert |
| **ZIP-Bulk-Export** | ✅ Live | Ordnerstruktur nach Monat/Richtung + CSV-Übersicht |
| **SEPA-Export** | ✅ Live | Sammelüberweisungs-XML |

### In Entwicklung / Roadmap

| Modul | Status | Ziel |
|---|---|---|
| Google Drive Integration | 🔄 pausiert | Q3 2026 |
| Stripe-Subscription | 🔄 In Arbeit | Q3 2026 |
| WhatsApp-Eingang (Twilio) | 🔄 Konfiguration | Q3 2026 |
| E-Mail-Forwarding (Postmark) | ✅ UI ready, Backend ausstehend | Q3 2026 |
| Kanzlei-Dashboard | ⬜ Design | Q4 2026 |
| Aufgabenmanagement | ⬜ Design | Q4 2026 |
| Projekte / Baustellen | ⬜ Roadmap | 2027 |
| Mobile App (PWA/Capacitor) | ⬜ Roadmap | 2027 |

---

## 2. Preismodell

### 2a. Launch-Strategie (jetzt, bis 50 Kunden)

**Nur 2 Pläne. Kein Kanzlei-Öffentlich. Kein Add-on-Chaos.**

| Plan | Preis | Zielgruppe |
|---|---|---|
| **Starter** | 39 €/Monat | EPU, Freelancer, Kleinstbetrieb |
| **Pro** | 99 €/Monat | KMU, Handwerksbetrieb mit mehreren Mitarbeitern |
| **Kanzlei** | auf Anfrage (299 €) | Steuerberater — direkt Telefonat/Demo |

**Warum diese Vereinfachung:**
- Weniger Entscheidungsparalyse beim Kunden
- Einfacherer Vertriebs-Pitch
- Kanzlei auf Anfrage = Qualifizierungs-Filter (nur ernsthafte StBs)
- 14-Tage-Trial senkt Einstiegshürde auf 0

---

### 2b. Vollständiges Zielmodell (ab ~100 Kunden / 2027)

#### Einzelbetrieb

| Plan | Preis | Belege/Mon | Hauptfeatures |
|---|---|---|---|
| **Basic** | 29 €/Monat | 100 | OCR, Ein-/Ausgang, Steuerlogik, Monatsabschluss, PDF-Export |
| **Betrieb** | 59 €/Monat | 500 | + Bankabgleich, Offene Posten, Score, StB-Export, Cloud Backup |
| **Pro** | 99 €/Monat | 2.000 | + Cashflow, Anlagegüter, Reverse Charge Engine, Teams |
| **Handwerk Pro** | 129 €/Monat | 2.000 | + Projekte, Regiestunden, Baustellen, Materialauswertung |
| **Bau Pro** | 179 €/Monat | 5.000 | + Subunternehmer, Teilrechnungen, Abschläge, Nachträge |

#### Kanzlei-Modell

| Plan | Preis | Mandanten | Features |
|---|---|---|---|
| **Kanzlei Starter** | 199 €/Monat | 25 | White Label, Mandantenportal |
| **Kanzlei Growth** | 499 €/Monat | 100 | + Dashboard, Gesundheitsindex, Aufgaben |
| **Kanzlei Enterprise** | 999 €/Monat | 250 | + API, Individuelle Regeln, Mehrere Standorte |

#### Add-ons

| Add-on | Preis |
|---|---|
| Cloud Backup | +7 €/Monat |
| Cashflow Pro | +10 €/Monat |
| White Label (Einzelbetrieb) | +49 €/Monat |
| Extra User | +3 €/Monat |
| Extra Mandant (Kanzlei) | +5 €/Monat |
| KI Monatsbericht | +9 €/Monat |

---

### 2c. Positionierung im Markt

| Anbieter | Preis AT/DE | AT-Steuerrecht | Handwerk-Fokus | Kanzlei-Workflow |
|---|---|---|---|---|
| **Klarblick** | 39–179 € | ✅ Nativ (UStG, §12, §19) | ✅ Kernfokus | ✅ Roadmap |
| Lexoffice | 17–28 € | ❌ DE-fokussiert | ❌ Generisch | ❌ |
| BMD | 80–200 € | ✅ | ⚠️ | ✅ Enterprise |
| DATEV | 50–300 € | ❌ DE-fokussiert | ❌ | ✅ |
| Papierkram AT | 15–25 € | ⚠️ | ❌ | ❌ |

**Klarblick-USP:** Das einzige Tool das §12 Vorsteuer, §19 Reverse Charge und die Eingang/Ausgang-Klassifikation vollautomatisch für AT-Betriebe löst.

---

## 3. FlexCo Finanzplanung

### 3a. FlexCo Grundlagen (Österreich, 2026)

| Parameter | Wert |
|---|---|
| Mindest-Stammeinlage | 10.000 € (davon 5.000 € bar) |
| Körperschaftsteuer (KöSt) | 23 % auf Gewinn |
| KESt auf Ausschüttung | 27,5 % |
| Effektive Gesamtsteuerlast (Gewinn→privat) | ~44 % |
| Gründungskosten (Notar + Firmenbuch) | ~3.000–4.000 € einmalig |
| Mindestkörperschaftsteuer | 500 €/Jahr |
| Steuerberater FlexCo (laufend) | ~300–500 €/Monat |

---

### 3b. Szenario 1 — 100 Kunden (7.700 € MRR)

**Umsatz-Mix:** 70 × 39 € + 20 × 99 € + 10 × 299 € = **7.700 €/Monat**

#### Betriebskosten (monatlich)

| Posten | Betrag |
|---|---|
| Anthropic API (OCR, ~10.000 Calls) | 100 € |
| Supabase Pro | 25 € |
| Railway Pro | 20 € |
| Stripe-Gebühren (2,9 % + 0,25 €/Tx) | 250 € |
| Domain/E-Mail/Tools | 50 € |
| Steuerberater/Buchhaltung | 300 € |
| Marketing (LinkedIn, minimal) | 200 € |
| **Gesamt OpEx** | **945 €** |

**EBITDA: 7.700 − 945 = 6.755 €/Monat**

#### GF-Gehalt (Brutto 4.000 €)

| Posten | Betrag |
|---|---|
| Bruttolohn | 4.000 € |
| Lohnnebenkosten DG (~26 %) | 1.040 € |
| **Gesamtkosten für FlexCo** | **5.040 €/Monat** |

**Gewinn vor KöSt: 6.755 − 5.040 = 1.715 €/Monat = 20.580 €/Jahr**

| Berechnung | Betrag |
|---|---|
| Jahresgewinn vor KöSt | 20.580 € |
| KöSt 23 % | −4.733 € |
| **Jahresgewinn nach KöSt** | **15.847 €** |
| KESt 27,5 % bei Vollausschüttung | −4.358 € |
| **Netto-Ausschüttung** | **11.489 €/Jahr = 957 €/Monat** |

**GF-Nettolohn (Brutto 4.000 €):**

| Abzug | Betrag |
|---|---|
| SV-Arbeitnehmer (~18,6 %) | −744 € |
| Lohnsteuer (effektiv ~17 %) | −680 € |
| **GF-Netto** | **~2.576 €/Monat** |

**→ Gründer-Gesamteinkommen Szenario 1: 2.576 € Netto + 957 € Ausschüttung = 3.533 €/Monat**

> Fazit: Knapp, aber lebbar. Phase 1 ist Aufbauphase — Ziel ist Wachstum, nicht maximale Entnahme.

---

### 3c. Szenario 2 — 250 Kunden (19.250 € MRR)

**Umsatz-Mix:** 175 × 39 € + 50 × 99 € + 25 × 299 € = **19.250 €/Monat**

#### Betriebskosten

| Posten | Betrag |
|---|---|
| Anthropic API (~25.000 Calls) | 250 € |
| Supabase + Railway | 70 € |
| Stripe-Gebühren | 610 € |
| Tools/Domain/Sonstiges | 100 € |
| Steuerberater | 400 € |
| Marketing (Ads, Content) | 800 € |
| **Gesamt OpEx** | **2.230 €** |

**EBITDA: 19.250 − 2.230 = 17.020 €/Monat**

#### GF-Gehalt (Brutto 6.000 €)

| Posten | Betrag |
|---|---|
| Bruttolohn | 6.000 € |
| Lohnnebenkosten DG (~26 %) | 1.560 € |
| **Gesamtkosten FlexCo** | **7.560 €/Monat** |

**Gewinn vor KöSt: 17.020 − 7.560 = 9.460 €/Monat = 113.520 €/Jahr**

| Berechnung | Betrag |
|---|---|
| Jahresgewinn vor KöSt | 113.520 € |
| KöSt 23 % | −26.110 € |
| **Jahresgewinn nach KöSt** | **87.410 €** |
| KESt 27,5 % | −24.038 € |
| **Netto-Ausschüttung** | **63.372 €/Jahr = 5.281 €/Monat** |

**GF-Nettolohn (Brutto 6.000 €): ~3.450 €/Monat**

**→ Gründer-Gesamteinkommen Szenario 2: 3.450 € Netto + 5.281 € Ausschüttung = 8.731 €/Monat**

> Sehr solide. Break-Even für Vollzeit-Gehalt + komfortables Auskommen.

---

### 3d. Szenario 3 — 500 Kunden (38.500 € MRR)

**Umsatz-Mix:** 350 × 39 € + 100 × 99 € + 50 × 299 € = **38.500 €/Monat**

#### Betriebskosten

| Posten | Betrag |
|---|---|
| Anthropic API | 500 € |
| Supabase Team + Railway | 150 € |
| Stripe-Gebühren | 1.200 € |
| Tools/Sonstiges | 200 € |
| Steuerberater + Buchhaltung | 500 € |
| Marketing | 2.000 € |
| **Gesamt OpEx** | **4.550 €** |

**EBITDA: 38.500 − 4.550 = 33.950 €/Monat**

#### Personal (GF + 1 Mitarbeiter)

| Posten | Betrag |
|---|---|
| GF Brutto 8.000 € + DG (~26 %) | 10.080 € |
| Mitarbeiter 3.500 € Brutto + DG | 4.410 € |
| **Gesamt Personal** | **14.490 €/Monat** |

**Gewinn vor KöSt: 33.950 − 14.490 = 19.460 €/Monat = 233.520 €/Jahr**

| Berechnung | Betrag |
|---|---|
| Jahresgewinn vor KöSt | 233.520 € |
| KöSt 23 % | −53.710 € |
| **Jahresgewinn nach KöSt** | **179.810 €** |
| KESt 27,5 % | −49.448 € |
| **Netto-Ausschüttung** | **130.362 €/Jahr = 10.864 €/Monat** |

**GF-Nettolohn (Brutto 8.000 €): ~4.200 €/Monat**

**→ Gründer-Gesamteinkommen Szenario 3: 4.200 € Netto + 10.864 € Ausschüttung = 15.064 €/Monat**

> MRR Break-Even auf "sehr komfortabel" liegt bei ca. 250 Kunden.

---

### 3e. Zusammenfassung

| Szenario | Kunden | MRR | Gründer/Monat netto | Anmerkung |
|---|---|---|---|---|
| **S1** | 100 | 7.700 € | 3.533 € | Lebbar, Aufbauphase |
| **S2** | 250 | 19.250 € | 8.731 € | Sehr komfortabel, Vollzeit |
| **S3** | 500 | 38.500 € | 15.064 € | Außerordentlich — möglich in J3 |

---

### 3f. Kanzlei-Multiplikator

Ein einziger Steuerberater mit **50 Mandanten** auf Kanzlei Growth (499 €):

```
1 StB-Kunde × 499 €/Monat = 499 €/Monat
(entspricht 13 Starter-Kunden)
```

**Strategie:** 20 StB-Partner auf Kanzlei Starter (199 €) = 3.980 €/MRR zusätzlich zu Einzelkunden.
20 StB mit je durchschnittlich 30 aktiven Mandanten = 600 indirekte User → Produkt-Feedback-Loop.

---

### 3g. Einmalige FlexCo-Gründungskosten

| Posten | Kosten |
|---|---|
| Notargebühren (Gesellschaftsvertrag) | ~1.500 € |
| Firmenbuch-Eintragung | ~400 € |
| Mindest-Stammeinlage (davon 5.000 € bar) | 10.000 € |
| Steuerberater Gründungsberatung | ~500 € |
| Bankonto Geschäftlich (Setup) | 0–100 € |
| **Gesamtaufwand bei Gründung** | **~12.500 €** |

> Empfehlung: FlexCo-Gründung sinnvoll ab ~5.000 €/Monat Umsatz. Davor als Einzelunternehmer starten (kein Kapital gebunden, weniger Buchhaltungsaufwand).

---

## 4. Empfehlung Vorgehen

```
Jetzt (Jun–Aug 2026):
  Einzelunternehmer
  2 Pläne: 39€ / 99€
  14-Tage-Trial
  Ziel: 10 zahlende Kunden

Herbst 2026 (10-25 Kunden):
  Kanzlei-Plan einführen (299€ auf Anfrage)
  Stripe live schalten
  Ziel: 50 Kunden

2027 (50+ Kunden):
  FlexCo gründen
  Vollständiges 5-Tier-Modell
  Add-ons einführen
  Ziel: 100 Kunden, 7.700€ MRR
```
