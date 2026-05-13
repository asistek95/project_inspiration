# Klarblick — Businessplan

**Stand:** Mai 2026
**Gründer:** Amin Sistek
**Rechtsform geplant:** Phase 1 Einzelunternehmer (Neue Selbstständige), Phase 2 FlexCo
**Sitz:** Österreich

---

## 1. Executive Summary

**Klarblick** ist ein SaaS-Tool, das Handwerksbetrieben (1–15 Mitarbeiter) einen automatisierten monatlichen Management-Report liefert: Belege werden per Foto/PDF/E-Mail erfasst, durch KI ausgelesen (GPT-4o Vision), automatisch kategorisiert und in einem visuellen Cockpit aufbereitet. Der Betrieb sieht auf einer Seite: Wohin geht das Geld, wo sind Sparpotenziale (Skonto-Verluste, Preissteigerungen, Abo-Leichen), wann droht Liquiditätsengpass.

**Positionierung:** Nicht „noch eine Buchhaltung" wie lexoffice/sevDesk, sondern der **Management-Report für Handwerker** — entscheidungsorientiert, nicht buchhalterisch.

**USP gegenüber lexoffice/sevDesk:**
- Fokus auf **Entscheidungen** statt Buchungssätze
- Skonto-Alarm + Preis-Wächter + Abo-Killer als USP-Features
- DATEV/RZL-Export → kein Konflikt mit Steuerberater, ergänzt ihn
- Made for Handwerk: Lieferanten-Erkennung (Hornbach, Würth, GC Gienger, Baufix, ...) vortrainiert

**Geplantes Wachstum:**
| | Jahr 1 | Jahr 2 | Jahr 3 |
|---|---|---|---|
| Zahlende Kunden | 25 | 80 | 200 |
| MRR Ende | 3.725 € | 12.000 € | 30.000 € |
| ARR | ~25.000 € | ~110.000 € | ~310.000 € |

**Finanzierungsbedarf Jahr 1:** ~8.000 € Eigenmittel (FlexCo-Gründung in J2 aus Cashflow)

---

## 2. Problem & Lösung

### Problem
Handwerker verlieren im Schnitt **3.500–8.000 €/Jahr** durch:
- **Verfallene Skonti** (2–3 % auf 60.000 € Material = 1.500 €)
- **Schleichende Preissteigerungen** unbemerkt (Großhandel +12 % YoY, nicht weitergegeben)
- **Vergessene Abos** (Tool-Abos, Software, Versicherungen)
- **Spätes Mahnen** (45 Tage statt 14)
- **Doppelte Belege**
- **Falsche Vorsteuer-Abzüge**

Sie sehen erst am Jahresende beim Steuerberater, dass das Geschäft schlechter lief. Da ist es zu spät.

### Lösung
**Klarblick** macht aus jedem hochgeladenen Beleg automatisch:
1. **Klassifizierung** (Material/Werkzeug/Sprit/Sub-Unternehmer/etc.)
2. **Vergleich mit Vormonaten** → Preis-Wächter
3. **Skonto-Frist erkannt** → Alarm bevor verfällt
4. **Liquiditätsprognose** der nächsten 30 Tage
5. **DATEV-CSV / RZL-Export** für den Steuerberater

Statt einer Bilanz im März des Folgejahres → Klarheit jeden Monatsanfang.

---

## 3. Markt & Zielgruppe

### Zielgruppe (Primär)
**„Heinz der Elektriker"-Persona:**
- 45 Jahre, Meister
- 3–8 Mitarbeiter, 1 Bürokraft (oft Ehefrau)
- 350.000–1.200.000 € Jahresumsatz
- Hasst Excel, vertraut seinem Steuerberater, will nicht selbst buchen
- Will am Monatsende wissen: „Hab ich verdient? Wo zu viel ausgegeben?"
- Hat WhatsApp und Smartphone, aber kein Bock auf komplizierte Software

### Marktgröße AT
- **~50.000 Handwerksbetriebe** mit 1–10 Mitarbeitern in Österreich
- Davon ~40 % bereit zu digitalisieren = **20.000 TAM**
- Bei 5 % Marktanteil in 5 Jahren = **1.000 Kunden** = 1,8 Mio € ARR

### Marktgröße DACH
- DE: ~580.000 Handwerksbetriebe
- AT: ~50.000
- CH: ~70.000
- **Gesamt ~700.000 Betriebe** → SOM (Serviceable Obtainable Market) ~ 0,5 % = 3.500 Kunden = 6 Mio € ARR

### Wettbewerb

| Anbieter | Stärke | Schwäche | Klarblicks Vorteil |
|---|---|---|---|
| **lexoffice** | Marktführer DE, 250k Kunden | Buchhalterisch, unübersichtlich | Mgmt-Report statt Buchung |
| **sevDesk** | Schöne UI | Teuer (46€), Buchhalter-Fokus | Handwerk-spezifisch |
| **BuchhaltungsButler** | KI-OCR | B2B fokussiert, keine Handwerker-Features | Skonto/Preis-Wächter |
| **RZL (AT)** | Steuerberater-Standard AT | Komplex, kein End-Kunden-Tool | Endkunden-UI |
| **DATEV Unternehmen Online** | DE-Standard | Schwer bedienbar, Steuerberater nötig | Self-Service |
| **Excel/Papier** | Kostenlos | Fehlerquelle, kein Überblick | Echte Lösung |

**Klarblicks Position:** Nicht Buchhaltung, sondern Ergänzung. Co-Existenz mit Steuerberater.

---

## 4. Geschäftsmodell

### Einnahmen
Monatliche SaaS-Abos in 2 Tiers + Founding-Member-Sondertarif:

| Plan | Preis netto/Monat | Inkl. |
|---|---|---|
| **Founding Member** (1. Jahr fix, erste 10 Kunden) | 79 € | Profi-Features, 12 Monate fix |
| **Profi** | 149 € | Bis 3 Nutzer, 250 Belege/Monat, alle Features |
| **Betrieb** | 279 € | Bis 10 Nutzer, unbegrenzt Belege, Priority Support, AVV, telefonischer Erstberater |

### Sekundäre Einnahmen (Jahr 2+)
- **Steuerberater-Partnerprogramm**: StB empfiehlt Klarblick → 20 % Recurring-Revenue-Share
- **Setup-Service**: Onboarding 1:1 für 299 € einmalig
- **Datenmigration** aus lexoffice/sevDesk: 99 €
- **Whitelabel** für Buchhaltungskanzleien (ab Jahr 3): 49 €/Kunde

### Kosten (variable)

| Posten | Pro Kunde/Monat |
|---|---|
| OCR (GPT-4o Vision, ~80 Belege) | 0,64 € |
| Supabase (anteilig) | 0,25 € |
| Railway/Vercel | 0,20 € |
| Resend E-Mails | 0,10 € |
| Stripe (1,5 % + 0,25 €) | 2,50 € |
| **Total** | **~3,70 €** |

### Kosten (fix Jahr 1)

| Posten | €/Jahr |
|---|---|
| Domain klarblick.at + .de | 60 |
| Supabase Pro (ab 100 Kunden) | 300 |
| Stripe-Konto + KYC | 0 |
| Buchhaltung (Einzelunternehmer) | 800 |
| Wirtschaftskammer AT | 200 |
| SVS-Beiträge (reduziert J1) | 1.700 |
| Versicherung (Berufs-Haftpflicht) | 350 |
| Marketing (Google Ads + Messen) | 3.000 |
| Tools (Notion, Slack, etc.) | 600 |
| **Total fix Jahr 1** | **~7.000 €** |

### Break-Even
- Pro Profi-Kunde DB nach Variable: 149 – 3,70 = **145,30 €/Monat**
- Break-Even: 7.000 € / 145,30 ÷ 12 ≈ **4 zahlende Kunden** dauerhaft

---

## 5. Roadmap (Produkt)

### Phase 0 — JETZT (Mai 2026)
- ✅ MVP gebaut: Landingpage, Auth, Dashboard, Spar-Cockpit, DATEV-Export
- ✅ Mock-OCR funktional
- ✅ Stripe Payment-Links vorbereitet
- ✅ Legal: Impressum, AGB, Datenschutz
- 🔄 Live-Deployment auf Railway (in Arbeit)

### Phase 1 — Mai–Juli 2026 (Pre-Launch)
- 🎯 Echte OCR via GPT-4o Vision integrieren
- 🎯 3 Pilotkunden onboarden (gratis 3 Monate)
- 🎯 Echte DATEV/RZL-Export mit Steuerberater testen
- 🎯 Stripe-Account + KYC + Payment-Links live
- 🎯 Supabase-Projekt live + RLS-Policies testen
- 🎯 Domain klarblick.at registrieren
- 🎯 E-Mail-Forwarding (CloudMailin → Webhook)
- 🎯 Sentry + Uptime-Monitoring

### Phase 2 — August–Dezember 2026 (Soft-Launch)
- 🎯 Erste 10 zahlende Kunden (Founding Member)
- 🎯 Iterieren auf Kundenfeedback
- 🎯 Liquiditäts-Prognose (30-Tage-Forecast)
- 🎯 Mobile App (Capacitor → iOS/Android Store)
- 🎯 Multi-User pro Betrieb (Chef + Buchhalter-Rolle)

### Phase 3 — Januar–Juni 2027 (Skalierung)
- 🎯 50 Kunden
- 🎯 lexoffice/sevDesk-Importer
- 🎯 Erste Steuerberater-Partnerschaften
- 🎯 SEPA-Lastschrift via Stripe
- 🎯 KI-Beleg-Suche („Zeig alle Hornbach-Rechnungen März")

### Phase 4 — Juli–Dezember 2027 (Wachstum)
- 🎯 FlexCo-Gründung
- 🎯 100 Kunden
- 🎯 Erste Vollzeit-Anstellung (Vertrieb oder Tech)
- 🎯 Whitelabel für Steuerberater-Kanzleien

---

## 6. Finanzplanung 3 Jahre

### Annahmen
- Jahr 1: 25 Kunden zum Jahresende, davon 10 Founding (79€) + 15 Profi (149€)
- Jahr 2: 80 Kunden zum Jahresende, davon 8 Founding (verbliebene) + 60 Profi + 12 Betrieb
- Jahr 3: 200 Kunden, davon 0 Founding + 150 Profi + 50 Betrieb
- Churn: 5 %/Monat (typisch B2B-SaaS-KMU)
- ARPU steigend durch Mix-Verschiebung

### GuV (in EUR)

| Position | Jahr 1 | Jahr 2 | Jahr 3 |
|---|---|---|---|
| **Umsatz** | 22.000 | 95.000 | 290.000 |
| Variable Kosten | -800 | -3.500 | -11.000 |
| **Deckungsbeitrag** | 21.200 | 91.500 | 279.000 |
| Fixkosten (Tools, WKO, etc.) | -7.000 | -9.000 | -15.000 |
| Marketing | -3.000 | -12.000 | -35.000 |
| Steuerberater | -800 | -2.500 | -4.500 |
| Personal (ab J3 1 VZ) | 0 | 0 | -55.000 |
| **EBT (Gewinn vor Steuer)** | **10.400** | **68.000** | **170.000** |
| ESt/KöSt (J1: EU ~28%, J2 KöSt 23%, J3 KöSt 23%) | -2.900 | -15.600 | -39.100 |
| **Netto-Gewinn** | **7.500** | **52.400** | **130.900** |
| Davon GF-Privat (Ausschüttung KESt 27,5%) | 7.500 | 38.000 | 95.000 |

### Liquiditätsbedarf
- Startkapital: 5.000 € (Marketing + Tools + Domains)
- Stammkapital FlexCo Jahr 2: 10.000 € (5.000 bar)
- **Aus Cashflow Jahr 1 finanzierbar** wenn die ersten 5 Kunden vor Juli 2026 da sind

### Best/Worst Case

| Szenario | J1 Kunden | J1 MRR Ende | J3 Kunden | Bewertung |
|---|---|---|---|---|
| **Best** | 50 | 7.000 € | 400 | Burnout-Risiko, finanziert Vollzeit ab J2 |
| **Realistic** | 25 | 3.725 € | 200 | Plan |
| **Worst** | 8 | 1.200 € | 50 | Side-Project, kein Vollzeit |

---

## 7. Marketing & Vertrieb (Jahr 1)

### Kanäle (priorisiert)

| Kanal | Kosten | Erwartung J1 | Aufwand |
|---|---|---|---|
| **Bekanntenkreis-Pilotkunden** | 0 | 3 Kunden | Niedrig |
| **Innungs-Mailing AT** (WKO Sparten) | 200 | 5 Kunden | Mittel |
| **Handwerksmessen** (3× in AT) | 1.500 | 8 Kunden | Hoch |
| **Steuerberater-Kaltakquise** | 100 | 4 Kunden (via StB-Empfehlung) | Hoch |
| **Google Ads** (Long-Tail: „Belege scannen Handwerker") | 800 | 3 Kunden | Mittel |
| **YouTube-Tutorials** + SEO Blog | 200 | 2 Kunden | Hoch |
| **Total** | **2.800 €** | **25 Kunden** | |

### CAC-Rechnung
- 2.800 € / 25 Kunden = **112 € CAC**
- LTV bei 149€ MRR × 24 Monate × 80 % Margin = **2.860 €**
- **LTV/CAC = 25,5** → exzellent (Benchmark > 3)

---

## 8. Risiken & Mitigation

| Risiko | Wahrsch. | Impact | Mitigation |
|---|---|---|---|
| OCR-Genauigkeit < 90 % → Kunden frustriert | Mittel | Hoch | GPT-4o Vision + manuelle Korrektur-UI + Confidence-Score |
| Verkauf läuft nicht an (< 5 Kunden in 90 Tagen) | Mittel | Hoch | Pivot auf Steuerberater als Vertriebskanal |
| Wettbewerber (lexoffice) baut gleiche Features | Mittel | Mittel | Speed + Handwerk-Nische + StB-Netzwerk |
| DSGVO-Klage / Datenleck | Niedrig | Hoch | Supabase EU + Versicherung + AVV |
| Persönlicher Burnout Solo | Mittel | Hoch | Klare Wochenstruktur, Pilotkunden nicht 24/7 supporten |
| Stripe friert Konto ein | Niedrig | Hoch | Zweiter Provider (Mollie) als Backup |

---

## 9. Team & Skills

**Jetzt (Solo):**
- Amin Sistek — Tech (Next.js, TypeScript, KI-Integration), Produkt, Vertrieb, Support

**Skill-Gaps & Plan:**
- **Vertrieb DACH-Handwerk:** Erfahrung sammeln durch Pilotkunden + Innungs-Besuche
- **Steuer/Buchhaltung tief:** Steuerberater als Beirat gewinnen (gegen Equity oder Trade)
- **UI/UX-Polish:** Freelancer bei Bedarf (200–500 € einmalig)

**Jahr 3 — geplante Einstellung:**
- Erste Vollzeit-Stelle: Customer Success / Vertrieb (45.000–55.000 €)
- Dann später Tech-Co-Founder oder Senior Dev

---

## 10. Exit-Optionen (langfristig)

| Option | Zeithorizont | Wert | Wahrscheinlichkeit |
|---|---|---|---|
| **Cashflow-Business** (kein Exit) | dauerhaft | 200–500k €/Jahr Gewinn | Hoch |
| **Strategischer Verkauf** an lexoffice/Haufe | 4–6 Jahre | 4–8× ARR (1,2–2,5 Mio €) | Mittel |
| **PE / Roll-Up** im DACH-SaaS-Markt | 5–7 Jahre | 6–10× ARR | Niedrig |
| **VC-Skalierung** | unrealistisch für Solo-Bootstrap | — | — |

**Empfehlung:** Bootstrap auf Profitabilität, dann entscheiden. Keine VC-Diskussionen vor 50.000 € MRR.
