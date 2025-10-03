# TapReview - Guida Deployment Vercel

## 📦 Conversione Completata

La tua app TapReview è stata **completamente convertita** da architettura monolitica Express a **funzioni serverless Vercel**.

## ✅ Cosa è Stato Fatto

### 1. **Layer Serverless Condiviso** (`/lib/shared`)
- `db.ts` - Database client con connection pooling per serverless
- `auth.ts` - Utilities JWT e cookie per autenticazione
- `storage.ts` - Storage layer completo con tutte le operazioni CRUD
- `emailService.ts` - Servizio email SendGrid

### 2. **API Routes Vercel** (30 endpoints completi)
Tutte le route Express sono state convertite in Vercel API routes:

**Auth (7):**
- `/api/auth/login` - Login utente
- `/api/auth/logout` - Logout utente  
- `/api/auth/register` - Registrazione (disabilitata)
- `/api/auth/change-password` - Cambio password
- `/api/auth/request-reset` - Richiesta reset password
- `/api/auth/reset-password` - Reset password
- `/api/auth/verify-reset/[token]` - Verifica token reset

**Profile & Links (4):**
- `/api/me` - Info utente corrente
- `/api/profile` - CRUD profilo utente
- `/api/links` - Lista/crea links
- `/api/links/[id]` - Aggiorna/elimina link

**Analytics (3):**
- `/api/analytics/summary` - Statistiche clicks totali
- `/api/analytics/links` - Stats per link
- `/api/analytics/clicks` - Time series clicks (grafico analytics)

**Admin (4):**
- `/api/admin/users` - Gestione utenti (lista, crea)
- `/api/admin/stats/summary` - Stats globali admin
- `/api/admin/impersonate/[id]` - Impersona utente
- `/api/admin/stop-impersonate` - Stop impersonazione

**Promos & Tickets (7):**
- `/api/promos` - Lista/crea promozioni
- `/api/promos/[id]` - Dettaglio/modifica/elimina promo
- `/api/promos/[id]/active` - Attiva/disattiva promo
- `/api/promos/[id]/tickets/generate` - Genera ticket
- `/api/tickets/[code]/status` - Status ticket
- `/api/tickets/[code]/use` - Usa ticket
- `/api/promotional-contacts` - Lista contatti promo

**Public (4):**
- `/api/public/[username]` - Profilo pubblico utente
- `/api/public/[username]/active-promo` - Promo attiva utente
- `/api/public/[username]/claim` - Richiedi promo pubblica
- `/api/r/[username]/[linkId]` - Redirect tracciato

**Other (1):**
- `/api/public-pages/[slug]` - Pagine pubbliche personalizzate

### 3. **Configurazione**
- `vercel.json` - Configurazione deployment completa
- `.env.example` - Template variabili d'ambiente aggiornato

## 🚀 Deploy su Vercel

### Passo 1: Connetti GitHub a Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Clicca **"New Project"**
3. Connetti il tuo account GitHub
4. Seleziona il repository **TapReview**

### Passo 2: Configurazione Variabili d'Ambiente
Aggiungi queste variabili in **Environment Variables** su Vercel:

```
DATABASE_URL=<tuo-supabase-connection-pooler>
JWT_SECRET=<chiave-segreta-jwt>
SENDGRID_API_KEY=<api-key-sendgrid>
NODE_ENV=production
```

**IMPORTANTE:**
- `DATABASE_URL` deve usare il **connection pooler** Supabase (porta 6543)
- Esempio: `postgresql://user:pass@host.supabase.co:6543/postgres?pgbouncer=true&sslmode=require`

### Passo 3: Deploy
Clicca **"Deploy"**. Vercel:
1. Installa dipendenze (`npm ci`)
2. Builda frontend (`vite build`)
3. Compila automaticamente le API routes TypeScript
4. Deploya tutto su CDN globale

### Passo 4: Verifica Funzionamento
Dopo il deploy, testa:
- ✅ Frontend caricato correttamente
- ✅ Login funzionante (`/api/auth/login`)
- ✅ Profilo pubblico visibile (`/api/public/[username]`)
- ✅ Analytics grafici funzionanti

## 📁 Struttura Progetto

```
tapreview/
├── api/                    # Vercel Serverless Functions
│   ├── auth/              # Autenticazione
│   ├── admin/             # Admin panel
│   ├── analytics/         # Analytics & stats
│   └── ...
├── lib/shared/            # Codice condiviso serverless
│   ├── db.ts             # Database client
│   ├── auth.ts           # Auth utilities
│   ├── storage.ts        # Storage layer
│   └── emailService.ts   # Email SendGrid
├── client/                # Frontend React
├── shared/schema.ts       # Schema database Drizzle
├── vercel.json           # Config Vercel
└── .env.example          # Template env vars
```

## ⚡ Vantaggi Serverless

### Prima (Monolitico):
- ❌ Server Express sempre attivo (costi fissi)
- ❌ Scaling manuale
- ❌ Single point of failure

### Dopo (Serverless):
- ✅ Funzioni on-demand (paga solo uso effettivo)
- ✅ Auto-scaling infinito
- ✅ Zero downtime deployments
- ✅ CDN globale per frontend
- ✅ Connection pooling database ottimizzato

## 🔧 Troubleshooting

### Errore: "Cannot connect to database"
- Verifica che `DATABASE_URL` usi il pooler (porta 6543)
- Controlla che Supabase permetta connessioni da Vercel

### Errore: "Function timeout"
- Le funzioni hanno max 10 secondi di timeout
- Ottimizza query database lente

### Errore: "Module not found @shared/schema"
- È normale in sviluppo - il path alias si risolve al build
- Vercel lo risolve automaticamente durante il deploy

## 📊 Monitoring

Dopo il deploy, usa Vercel Dashboard per:
- **Analytics** - Traffico e performance
- **Logs** - Debug errori serverless functions  
- **Metrics** - Response time, errors, invocations

## 🎯 Note Importanti

1. **Database Pooling**: Usa sempre il pooler Supabase (porta 6543) per evitare esaurimento connessioni
2. **Secrets**: Non committare mai variabili d'ambiente - usa Vercel Environment Variables
3. **CORS**: Vercel gestisce automaticamente CORS tra frontend e API routes
4. **Cookies**: Funzionano correttamente su HTTPS (auto-configurato da Vercel)

---

✨ **La tua app è pronta per il deployment su Vercel!** ✨
