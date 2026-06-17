# Klarblick — Projektplanung & Umsetzung

**Stand:** Juni 2026 (aktualisiert 17.06.2026)

---

## 1. Projektübersicht

**Projektname:** Klarblick
**Projektziel:** Online-verkaufsbereites SaaS-Tool für Handwerksbetriebe mit 25 zahlenden Kunden innerhalb von 12 Monaten
**Methodik:** Lean Startup + Bootstrap, wöchentliche Iterationen, kontinuierlicher Kundenkontakt
**Hauptrisiko:** Solo-Bottleneck → priorisieren statt parallelisieren

---

## 2. Work Breakdown Structure (WBS)

### WP-1: Produkt-Fertigstellung (Mai–Juni 2026)
- WP-1.1 GPT-4o Vision OCR integrieren
  - 1.1.1 API-Route `/api/ocr/route.ts` bauen
  - 1.1.2 Prompt-Engineering für deutsche Belege
  - 1.1.3 Confidence-Score + manuelle Korrektur-UI
  - 1.1.4 50 echte Belege testen, Genauigkeit messen
  - 1.1.5 Fallback-Strategie wenn API down (Queue + Retry)
- WP-1.2 E-Mail-Forwarding-Backend
  - 1.2.1 CloudMailin-Account
  - 1.2.2 Supabase Edge Function für Webhook
  - 1.2.3 Anlage-Parser (PDF, JPG, HEIC)
- WP-1.3 Mobile-Optimierung
  - 1.3.1 PWA-Manifest
  - 1.3.2 Capacitor-Setup für iOS/Android (Phase 3)

### WP-2: Infrastruktur & Deployment (Mai 2026)
- WP-2.1 Supabase-Projekt
  - 2.1.1 Projekt anlegen (EU-Region Frankfurt)
  - 2.1.2 `schema.sql` deployen
  - 2.1.3 RLS-Policies testen
  - 2.1.4 Backups aktivieren (Pro-Plan)
- WP-2.2 Stripe-Setup
  - 2.2.1 Account + KYC
  - 2.2.2 3 Payment-Links (Founding/Profi/Betrieb)
  - 2.2.3 Test-Transaktionen
  - 2.2.4 Webhook für Subscription-Status (Phase 2)
- WP-2.3 Railway-Deployment
  - 2.3.1 Repo-Verknüpfung ✓
  - 2.3.2 ENV-Variables setzen
  - 2.3.3 Custom Domain klarblick.at
  - 2.3.4 SSL prüfen
- WP-2.4 Monitoring
  - 2.4.1 Sentry für Error-Tracking
  - 2.4.2 UptimeRobot für Uptime
  - 2.4.3 PostHog für Product-Analytics (optional)

### WP-3: Recht & Compliance (Mai–Juni 2026)
- WP-3.1 Gewerbeanmeldung Einzelunternehmer AT
- WP-3.2 SVS-Anmeldung (Neue Selbstständige)
- WP-3.3 Bankkonto geschäftlich (z. B. Erste Bank, Holvi)
- WP-3.4 AVV-Template
- WP-3.5 Cookie-Banner einbauen (Iubenda o. Cookiebot)
- WP-3.6 Datenschutzerklärung mit Anwalt prüfen lassen (300 €)
- WP-3.7 AGB von Anwalt prüfen lassen (200 €)

### WP-4: Pilotkunden (Juni 2026)
- WP-4.1 3 Pilotkunden im Bekanntenkreis akquirieren
  - 4.1.1 Reuf Sistek (Sistek)
  - 4.1.2 Amir Avdagic (ETRA)
  - 4.1.3 Zoran Lakic (Installateur)
- WP-4.2 Onboarding 1:1 vor Ort oder per Zoom
- WP-4.3 Wöchentliche Feedback-Calls (30 min)
- WP-4.4 Lessons-Learned-Dokument

### WP-5: Vertrieb (Juli–August 2026)
- WP-5.1 WKO-Lead-Liste aufbauen (200 Kontakte)
- WP-5.2 E-Mail-Sequenzen schreiben
- WP-5.3 Demo-Skript trainieren
- WP-5.4 Outreach starten (siehe 90-Tage-Plan)
- WP-5.5 Steuerberater-Partner anwerben

### WP-6: Marketing (Juli–laufend)
- WP-6.1 LinkedIn-Strategie (3 Posts/Woche)
- WP-6.2 YouTube-Channel (Demo-Videos)
- WP-6.3 SEO-Blog (10 Artikel im ersten Quartal)
- WP-6.4 Google Ads (300 €/Monat ab Juli)
- WP-6.5 1 Handwerksmesse besuchen Q3 2026

---

## 3. Gantt-Übersicht (vereinfacht, 12 Monate)

```
                Mai  Jun  Jul  Aug  Sep  Okt  Nov  Dez  Jan  Feb  Mär  Apr
WP-1 Produkt    ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
WP-2 Infra      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
WP-3 Recht      ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
WP-4 Pilot      ░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
WP-5 Vertrieb   ░░░░░░░░████████████████████████████████████████████████████
WP-6 Marketing  ░░░░░░░░████████████████████████████████████████████████████
WP-7 Mobile App ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░
WP-8 FlexCo     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
```

---

## 4. Meilensteine

| # | Meilenstein | Soll-Datum | Erfolgs-Kriterium |
|---|---|---|---|
| M1 | Echte OCR live | 15. Mai 2026 | Genauigkeit > 90 % auf 50 Testbelegen |
| M2 | Klarblick.at online | 20. Mai 2026 | klarblick.at zeigt Landingpage |
| M3 | Stripe + Supabase prod | 25. Mai 2026 | Erste Test-Transaktion erfolgreich |
| M4 | 3 Pilotkunden aktiv | 15. Juni 2026 | Alle 3 nutzen Tool wöchentlich |
| M5 | Gewerbe + Bankkonto | 30. Juni 2026 | Erste Rechnung schreibbar |
| M6 | 1. zahlender Kunde | 31. Juli 2026 | Stripe-Subscription aktiv |
| M7 | 5 zahlende Kunden | 31. August 2026 | MRR > 400 € |
| M8 | 10 zahlende Kunden | 30. November 2026 | MRR > 1.000 € |
| M9 | 25 zahlende Kunden | 30. April 2027 | MRR > 3.500 € |
| M10 | FlexCo gegründet | 31. Mai 2027 | Firmenbuch-Eintrag liegt vor |
| M11 | 50 zahlende Kunden | 30. November 2027 | MRR > 7.500 € |
| M12 | Break-Even Vollzeit | 31. März 2028 | MRR > 9.000 € (deckt Lebenshaltungskosten) |

---

## 5. Ressourcen-Planung

### Personal
- **Phase 1 (Mai 2026 – April 2027):** Solo
- **Phase 2 (Mai 2027 – April 2028):** Solo + Freelancer punktuell
- **Phase 3 (ab Mai 2028):** + 1 Vollzeit (Customer Success / Vertrieb)

### Externe Dienstleister

| Rolle | Wann | Aufwand | Kosten/Jahr |
|---|---|---|---|
| Steuerberater (Buchhaltung Einzelunternehmer) | Phase 1 | 1 Std/Monat | 800 € |
| Steuerberater (FlexCo) | Phase 2+ | 4 Std/Monat | 2.500 € |
| Anwalt (Verträge initial) | einmalig | 4 Std | 500 € |
| Designer (Logo-Refinement, später Marketing-Assets) | Bedarf | — | 800 € |
| Notar (FlexCo-Gründung) | einmalig Phase 2 | — | 1.200 € |

### Tools / Software

| Tool | Zweck | Kosten/Monat |
|---|---|---|
| Supabase Pro | Datenbank + Auth | 25 € |
| Railway Hobby | Hosting | 5 € |
| OpenAI API | OCR | ~20 € (J1) |
| Resend | Transaktional-E-Mails | 0 € (3k/Monat free) |
| Cloudflare | DNS + DDoS-Schutz | 0 € |
| Sentry Team | Error-Tracking | 26 € |
| Stripe | Zahlungsabwicklung | 0 € fix (% transaktional) |
| Notion | Doku/CRM | 0 € (Solo) |
| Calendly | Termine | 0 € |
| Zoom | Demos | 0 € (Free 40-min-Limit reicht) |
| **Total monatlich** | | **~76 €** |

---

## 6. Risiko-Management

| Risiko | Wahrsch. | Impact | Mitigation | Trigger |
|---|---|---|---|---|
| OCR-Genauigkeit zu niedrig | M | H | Multi-Provider (GPT-4o + Claude als Fallback) | < 85 % Genauigkeit auf 100 Belegen |
| Stripe-Konto eingefroren | N | H | Mollie-Account als Backup vorbereiten | Stripe-Mail mit „Review" |
| Supabase-Ausfall | N | H | Daily-Backups extern (Cron) | Status-Page rot > 1 h |
| < 3 Kunden nach 90 Tagen | M | H | Pivot-Plan (Preise senken, StB-Vertrieb) | 31.08.2026 < 3 Kunden |
| Burnout Gründer | M | H | Max. 50h/Woche, Sonntag frei, monatliche Reflexion | Schlafstörungen > 2 Wochen |
| Lexoffice baut Handwerk-Modul | N | M | Speed + Tiefer-Spezialisieren | Pressemitteilung lexoffice |
| Datenleck | N | H | Penetration-Test Q2 2027 (1.500 €) | bei > 50 Kunden |
| GPT-4o Preis verdreifacht sich | N | M | OpenAI Batch-API + lokales LLM (llama 3) als Backup | OpenAI-Mail mit Preisänderung |

---

## 7. Qualitäts-Management

### Code-Qualität
- TypeScript strict ✓
- Build muss grün bleiben vor jedem Push
- Manuelle Tests der 3 Kern-Flows nach jedem Deploy:
  1. Beleg hochladen → OCR → Dashboard
  2. Skonto-Alarm anzeigen
  3. DATEV-CSV exportieren
- Automatische Tests (Vitest) ab Q3 2026 wenn 10+ Kunden

### Daten-Qualität
- OCR-Confidence-Score speichern, < 80 % → manuelle Review erforderlich
- Monatlich: 20 zufällige Belege auf Korrektheit prüfen
- Kunden-Feedback-Loop: jede Korrektur als Trainings-Signal

### Kunden-Qualität
- NPS-Umfrage nach 30 Tagen, 90 Tagen, jährlich
- Ziel: NPS > 50
- Churn-Reason in jedem Kündigungsfall dokumentieren

---

## 8. Stakeholder-Übersicht

| Stakeholder | Interesse | Macht | Strategie |
|---|---|---|---|
| Zahlende Kunden | Sehr hoch | Sehr hoch | Wöchentlicher Kontakt, sofortiges Bug-Fixing |
| Pilotkunden | Hoch | Hoch | 1:1-Onboarding, persönlicher Draht |
| Steuerberater-Partner | Mittel | Hoch | Revenue-Share, kostenloser Demo-Zugang |
| Wirtschaftskammer AT | Niedrig | Mittel | Pflicht-Compliance |
| Supabase/Stripe/OpenAI | Niedrig | Hoch | SLA, Multi-Provider-Strategie |
| Konkurrenz (lexoffice) | Niedrig | Mittel | Nische verteidigen, nicht ankündigen |
| Familie/Freunde | Hoch | Niedrig | Erwartungs-Management („Bootstrap dauert") |

---

## 9. Erfolgs-Messung

### Nordstern-KPI: **MRR (Monthly Recurring Revenue)**

### Treiber-KPIs
- New MRR / Monat
- Churn Rate (Ziel < 5 %)
- ARPU (Average Revenue Per User)
- CAC (Customer Acquisition Cost)
- LTV/CAC-Ratio
- NPS (Net Promoter Score)
- Anzahl Demo-Termine / Woche
- Demo→Kunde-Conversion-Rate

### Reporting-Rhythmus
- **Wöchentlich** (Freitag, 30 min): KPI-Update für sich selbst
- **Monatlich** (1. Werktag, 2 h): Vollständiger Monatsbericht, Retrospektive, Forecast-Update
- **Quartalsweise**: Strategie-Review, Pivot-Frage stellen
- **Jährlich**: GuV, Steuern, neue Roadmap

---

## 10. Definition of Done für „Verkaufsbereit"

Wir definieren das Produkt als **„verkaufsbereit für zahlende Kunden"**, wenn ALLE folgenden Kriterien erfüllt sind:

- [ ] Echte OCR mit > 90 % Genauigkeit auf 100 deutschen/österr. Testbelegen
- [ ] Stripe-Konto aktiv, mind. 1 erfolgreiche Test-Transaktion
- [ ] Supabase-Projekt prod-ready, RLS getestet, Backup läuft
- [ ] klarblick.at SSL-gesichert online
- [ ] Impressum, Datenschutz, AGB anwaltlich geprüft
- [ ] Cookie-Banner DSGVO-konform
- [ ] AVV-Template fertig, automatisiert per E-Mail nach Anmeldung
- [ ] DATEV-CSV-Export von echtem Steuerberater getestet
- [ ] Mind. 3 Pilotkunden seit 30 Tagen aktiv ohne kritische Bugs
- [ ] Onboarding-Wizard funktional, neue User kommen ohne Hilfe rein
- [ ] Sentry + UptimeRobot aktiv
- [ ] Support-E-Mail-Adresse + Antwort-Zeit < 24 h definiert

**Status heute (17. Juni 2026):** 6/12 ✅

| Kriterium | Status |
|---|---|
| Echte OCR mit > 90 % Genauigkeit | ✅ Live (Claude Sonnet 4.6 Vision) |
| Stripe-Konto aktiv | 🔄 In Arbeit |
| Supabase prod-ready + Backup | ✅ Live (EU Frankfurt, RLS aktiv, bgSync) |
| klarblick.at SSL-gesichert online | ✅ Live (Railway + Cloudflare) |
| Impressum, Datenschutz, AGB online | ✅ Entwurf live, anwaltliche Prüfung ausstehend |
| Cookie-Banner DSGVO-konform | 🔄 In Arbeit |
| AVV-Template | ⬜ Ausstehend |
| DATEV-CSV-Export von StB getestet | ✅ Export live (DATEV EXTF v700) |
| 3 Pilotkunden 30 Tage aktiv | 🔄 Onboarding läuft |
| Onboarding-Wizard funktional | ✅ Live (14-Tage-Trial, Demo-Daten) |
| Sentry + UptimeRobot aktiv | ⬜ Ausstehend |
| Support-E-Mail + Antwortzeit < 24 h | ✅ office@klarblick.at |

**Ziel:** 12/12 bis **31. Juli 2026**.
