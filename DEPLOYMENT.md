# 🚀 Deployment TapReview - Vercel + Supabase

## Prerequisiti

1. Account [Vercel](https://vercel.com)
2. Account [Supabase](https://supabase.com)
3. Vercel CLI installato: `npm i -g vercel`

## 1. Configurazione Supabase

1. Crea un nuovo progetto su Supabase
2. Vai su **Settings** → **Database**
3. Copia la **Connection String** (formato PostgreSQL)
4. Sostituisci `[YOUR-PASSWORD]` con la password del database

## 2. Configurazione Vercel

1. Installa Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Nel progetto: `vercel`
4. Configura le variabili d'ambiente:

```bash
vercel env add DATABASE_URL
# Incolla la connection string di Supabase

vercel env add JWT_SECRET
# Genera una chiave sicura (32+ caratteri)

vercel env add FRONTEND_URL
# URL che Vercel ti assegnerà
```

## 3. Deployment

1. Esegui lo script di configurazione:
```bash
./apply_tapreview_vercel_supabase_patch.sh
```

2. Deploy:
```bash
vercel --prod
```

## 4. Configurazione Database

Dopo il primo deploy, il database verrà automaticamente configurato con le tabelle necessarie tramite Prisma.

## Variabili d'Ambiente Richieste

- `DATABASE_URL`: Connection string PostgreSQL di Supabase
- `JWT_SECRET`: Chiave segreta per JWT (32+ caratteri)
- `FRONTEND_URL`: URL di produzione Vercel
- `NODE_ENV`: `production`

## Troubleshooting

### Database non si connette
- Verifica che la `DATABASE_URL` sia corretta
- Controlla che il database Supabase sia attivo
- Verifica le credenziali

### Build fallisce
- Controlla che tutte le dipendenze siano installate
- Verifica la sintassi TypeScript con `npm run check`

### JWT errors
- Genera una nuova `JWT_SECRET` sicura
- Verifica che sia configurata in Vercel

## Monitoraggio

- **Vercel Dashboard**: Analytics e logs
- **Supabase Dashboard**: Database metrics e queries
- **Application**: Admin panel per gestione utenti