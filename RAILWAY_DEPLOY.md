# Klarblick — Deploy auf Railway

## 1. Vorbereitung (einmalig)

1. Account erstellen: https://railway.app → "Login with GitHub"
2. GitHub-Repo `asistek95/project_inspiration` autorisieren (Railway fragt beim ersten Deploy)

## 2. Neues Projekt anlegen

1. https://railway.app/new → **"Deploy from GitHub repo"**
2. Repo wählen: `asistek95/project_inspiration`
3. Branch: `main`
4. Railway erkennt Next.js automatisch (Nixpacks) und nutzt unsere `railway.json`:
   - Build: `npm ci && npm run build`
   - Start: `npm run start` (bindet auf `$PORT`)

## 3. Environment Variables setzen

Im Railway-Projekt → **Variables** → folgende Keys einfügen:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_STRIPE_LINK_STARTER=https://buy.stripe.com/xxx
NEXT_PUBLIC_STRIPE_LINK_PROFI=https://buy.stripe.com/yyy
NEXT_PUBLIC_STRIPE_LINK_BETRIEB=https://buy.stripe.com/zzz
```

> Ohne Supabase-Keys läuft die App im **Demo-Modus** (LocalStorage).
> Ohne Stripe-Links zeigen die Pricing-Buttons auf `/register?plan=...`.

## 4. Domain

- **Railway-Subdomain** (gratis): Settings → Networking → "Generate Domain" → z. B. `klarblick.up.railway.app`
- **Eigene Domain** (klarblick.de): Settings → Networking → "Custom Domain" → CNAME bei deinem Registrar (z. B. IONOS) auf den von Railway angezeigten Host setzen.

## 5. Auto-Deploy

Jeder `git push` auf `main` → Railway baut + deployed automatisch (~ 2 Min).

## 6. Logs & Debugging

- Railway-Projekt → **Deployments** → Klick auf Run → **View Logs**
- Bei Build-Fehler: meist fehlt eine ENV-Var oder Node-Version. Railway nutzt Node 20 (passt zu Next 14).

## 7. Kosten

- **Hobby-Plan**: 5 $/Monat inkl. 500h Compute (reicht für 1 dauerlaufenden Service)
- Trial-Credit (5 $) für Test ausreichend.

## Alternative: Railway CLI (lokal pushen)

```powershell
npm i -g @railway/cli
railway login
railway link        # bestehendes Projekt verknüpfen
railway up          # manueller Deploy ohne Git
railway logs        # Live-Logs
railway open        # Dashboard im Browser
```
