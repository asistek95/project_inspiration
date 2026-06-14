# Klarblick — SWOT-Analyse

**Stand:** Juni 2026 (aktualisiert)

---

## Matrix-Übersicht

|                  | **Hilfreich**                  | **Schädlich**                  |
|------------------|--------------------------------|--------------------------------|
| **Intern**       | STÄRKEN (S)                    | SCHWÄCHEN (W)                  |
| **Extern**       | CHANCEN (O)                    | RISIKEN (T)                    |

---

## 🟢 STÄRKEN (Strengths) — Intern

### S1. Tech-Stack auf dem aktuellsten Stand
- Next.js 14, TypeScript strict, Supabase RLS, Netlify Deployment
- 30+ Routen, sauberer Code, Build grün
- Schnelle Iteration möglich (Solo-Developer kennt jede Zeile)

### S2. Einzigartige Eingangskanäle als USP
- **WhatsApp-first:** Foto schicken → Beleg sofort ausgelesen (Twilio Webhook + Claude Vision)
- **E-Mail-Weiterleitung:** Rechnungsmail an persönliche Klarblick-Adresse → Postmark Inbound
- **Österreich-native KI:** Claude Vision mit AT MwSt-Sätzen, §12 Vorsteuer, ATU-Matching
- DATEV-CSV Export bereits implementiert

### S3. Solo-Gründer = niedrige Fixkosten
- Keine Gehälter, kein Office, kein Investor-Druck
- Break-Even ab ~4 Kunden
- Volle Flexibilität bei Produkt-Pivots

### S4. Klare Positionierung
- Nicht „Buchhaltung", sondern **Management-Report**
- Co-Existiert mit Steuerberater statt zu konkurrieren
- Klare Sprache (kein „Buchungssatz-Jargon")

### S5. Persönliche Netzwerk-Basis im Handwerk
- Bestehende Testimonials (Amir Avdagic, Reuf Sistek, Zoran Lakic)
- Pilotkunden aus Familien-/Bekanntenkreis greifbar
- Glaubwürdigkeit im Handwerker-Milieu durch eigenen Background

---

## 🔴 SCHWÄCHEN (Weaknesses) — Intern

### W1. OCR ist aktuell Mock
- `lib/ocr.ts` würfelt aus Liste, liest keine echten Belege
- **Größter Blocker** — kein einziger Kunde wird ohne echte OCR bleiben
- Mitigation: GPT-4o Vision integrieren (1–2 Tage Arbeit)

### W2. Solo = Bottleneck überall
- Vertrieb, Support, Entwicklung, Buchhaltung — alles auf Amin
- Krankheit / Urlaub = Ausfall des ganzen Business
- Begrenzte Skalierbarkeit ohne Anstellung

### W3. Keine Brand / Reputation
- Niemand kennt „Klarblick" im Mai 2026
- Vertrauensaufbau braucht 6–12 Monate
- Kein bestehender E-Mail-Newsletter, keine Followerschaft

### W4. Kein Vertriebskanal etabliert
- Keine Innungs-Kontakte
- Keine Steuerberater-Partnerschaften
- Keine SEO-Rankings
- Marketing-Erfahrung im B2B-Solo-Kontext fehlt

### W5. Finanzielle Reserven begrenzt
- Bootstrapping ohne 6-Monats-Runway riskant
- Kein Puffer für längere Vertriebs-Anlaufphase
- Keine Möglichkeit, Top-Marketer/Designer einzustellen

### W6. Fehlende Compliance-Features (noch)
- AVV (Auftragsverarbeitungsvertrag) noch nicht automatisiert
- Kein Cookie-Banner (DSGVO)
- E-Mail-Forwarding-Endpoint nur UI, keine echte Implementierung
- Keine Penetration-Tests, kein SOC-2

---

## 🔵 CHANCEN (Opportunities) — Extern

### O1. Markt ist groß und schlecht bedient
- 50.000 Handwerksbetriebe in AT, 580.000 in DE
- Bestehende Tools (lexoffice, sevDesk) sind buchhalterisch, nicht entscheidungsorientiert
- Handwerker sind digital frustriert mit Excel/Papier

### O2. KI-Hype senkt Akzeptanz-Hürden
- „KI scannt Belege" ist 2026 für jeden verständlich
- GPT-4o Vision macht Genauigkeit > 95 % zu Cent-Preisen
- Erwartungshaltung an Automation steigt → Klarblick passt perfekt

### O3. DATEV/RZL-Schnittstellen sind ein Türöffner zu Steuerberatern
- 65.000 Steuerberater in DACH
- Wenn 1 % von denen empfehlen → 650 Vertriebspartner
- Recurring-Revenue-Share-Modell sehr attraktiv für StB

### O4. Förderungen Österreich
- **aws PreSeed Innovative Solutions** (bis 200.000 € Förderung für KI-Startups)
- **WKO Gründerservice**: kostenlose Beratung
- **FFG Markt.Start** (für KMU-Software)
- **FlexCo-Förderpaket** speziell für junge Unternehmen

### O5. Konsolidierung im Markt
- BuchhaltungsButler von BFS Finance gekauft
- sevDesk von Apax gekauft → langsamer
- Lücke für agile Nischen-Player wie Klarblick

### O6. Mobile-First-Trend
- 89 % der Handwerker haben Smartphone aber arbeiten am PC mit Software
- Mobile-Foto-Workflow ist ein echter Vorteil
- App Store Listing möglich (Capacitor → iOS/Android in 2 Wochen)

### O7. Regulierung (E-Rechnungs-Pflicht)
- AT: E-Rechnung Pflicht für B2G seit 2014, B2B-Diskussion läuft
- DE: E-Rechnungs-Pflicht ab 2027 für alle B2B
- **Klarblick kann E-Rechnungs-Empfang/-Versand bauen** → Verkaufsargument

---

## ⚠️ RISIKEN (Threats) — Extern

### T1. Etablierter Wettbewerb mit Marketing-Budgets
- lexoffice gibt Millionen für Google Ads/TV-Spots aus
- sevDesk hat 90.000 Kunden DACH
- DATEV ist quasi-Standard bei jedem Steuerberater
- Klarblick muss Nische verteidigen, nicht Headon-konkurrenzieren

### T2. KI-Anbieter ändern Preise/AGB
- OpenAI könnte API-Preise verdreifachen
- Anthropic, Google entwickeln eigene Vision-APIs → Wettbewerb hilft
- Mitigation: Multi-Provider-Abstraktion in `lib/ocr.ts`

### T3. DSGVO-Verschärfung / Datenschutzbehörden
- DSB-Strafen können existenzbedrohend sein (4 % vom Umsatz)
- US-Anbieter (OpenAI) sind DSGVO-grenzwertig
- Mitigation: EU-only Stack wo möglich (Mistral als Backup)

### T4. Wirtschaftskrise im Handwerk
- Bauwirtschaft AT 2024/25 stark gesunken (-12 % Auftragseingang)
- Handwerker sparen zuerst bei „Software"
- Mitigation: ROI-Story klar kommunizieren („Klarblick spart dir Geld, kostet dich keins")

### T5. Banken/Steuerberater bauen eigene Tools
- Sparkasse hat „S-Firmenkundenportal" mit Buchhaltung
- BMD/RZL können Endkunden-Apps bauen
- Mitigation: Schnell sein, Marken-Loyalität in der Nische aufbauen

### T6. Microsoft/Google Copilot-for-Business kommt
- AI-Agents könnten in Zukunft Belege direkt in Office 365 scannen
- Mitigation: Spezialisierung auf Handwerk-Workflow = Verteidigung

### T7. Fachkräftemangel im Handwerk
- Handwerksbetriebe schließen → kleinere Zielgruppe in 5–10 Jahren
- Mitigation: Auch Subunternehmer (1-Mann-Betriebe) ansprechen, Bauarbeiter-Kollektive

### T8. Persönliche Lebenssituation Solo-Gründer
- Krankheit, Familie, Burnout = Business-Stopp
- Mitigation: Dokumentation, irgendwann Anstellung, Notfall-Buddy

---

## TOWS-Strategien (Cross-Matrix)

### SO-Strategien (Stärken nutzen, Chancen ergreifen)
- **S2 + O3**: Handwerk-Features + Steuerberater-Schnittstelle → Partner-Programm mit RZL/BMD-Anwendern in AT aufbauen
- **S4 + O1**: Klare Management-Report-Positionierung + Markt sucht Entscheidungstool → SEO-Content „warum Buchhaltung nicht reicht"

### ST-Strategien (Stärken nutzen, Risiken abwehren)
- **S3 + T4**: Niedrige Fixkosten + Wirtschaftskrise → Krisenfeste Preisstruktur, Founding-Member 12 Monate fix
- **S1 + T6**: Moderner Stack + AI-Konkurrenz → schnelle KI-Integration vor Microsoft

### WO-Strategien (Schwächen beheben, Chancen nutzen)
- **W1 + O2**: Mock-OCR + KI-Hype → sofort GPT-4o Vision integrieren, als KI-Lösung vermarkten
- **W3 + O3**: Kein Brand + Steuerberater-Markt → Steuerberater als Trust-Multiplikator nutzen

### WT-Strategien (Schwächen reduzieren, Risiken vermeiden)
- **W2 + T8**: Solo-Bottleneck + Lebensrisiko → Pilotkunden gut dokumentieren, Übergabe-Möglichkeit schaffen
- **W5 + T4**: Geringe Reserven + Krise → konservativ planen, nicht aus Cashflow vorfinanzieren

---

## Bewertung: Go / No-Go?

**GO-Kriterien (alle erfüllt? ja/nein):**
- ✅ Markt > 10.000 Zielkunden (50.000 in AT allein)
- ✅ Zahlungsbereitschaft validierbar (lexoffice-Markt = 250.000 Kunden bei 19–39 €)
- ⚠️ MVP nutzbar (90 % — OCR fehlt noch)
- ✅ Klare Differenzierung (Management-Report-Fokus + Handwerk-Nische)
- ⚠️ Startkapital vorhanden (5.000 € minimum nötig)
- ❌ 3 Pilotkunden zugesagt (noch nicht)

**Empfehlung:** **Conditional Go.**
Vor offiziellem Launch (zahlende Kunden) noch 3 Schritte:
1. Echte OCR
2. 3 Pilotkunden mündlich zugesagt
3. Stripe + Supabase live
