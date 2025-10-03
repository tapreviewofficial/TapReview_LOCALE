#!/bin/bash

echo "🚀 TapReview - Configurazione deployment Vercel + Supabase"
echo "==========================================================="

# Controlla se le variabili d'ambiente sono configurate
echo "📋 Controllo variabili d'ambiente necessarie..."

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "FRONTEND_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Le seguenti variabili d'ambiente sono mancanti:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Configura queste variabili in Vercel:"
    echo "   DATABASE_URL: connessione PostgreSQL di Supabase"
    echo "   JWT_SECRET: chiave segreta per i token JWT"
    echo "   FRONTEND_URL: URL del frontend in produzione"
    echo ""
    exit 1
fi

echo "✅ Tutte le variabili d'ambiente sono configurate!"

# Copia schema PostgreSQL
echo "🔄 Configurazione schema PostgreSQL..."
cp server/prisma/schema.prod.prisma server/prisma/schema.prisma

# Genera client Prisma
echo "🔧 Generazione client Prisma..."
npx prisma generate

# Applica migrazioni
echo "📊 Applicazione migrazioni database..."
npx prisma db push

echo ""
echo "✅ Configurazione completata!"
echo "🌐 L'applicazione è pronta per il deployment su Vercel"
echo ""
echo "📋 Prossimi passi:"
echo "1. Crea un progetto Supabase e ottieni la stringa di connessione DATABASE_URL"
echo "2. Configura le variabili d'ambiente in Vercel:"
echo "   - DATABASE_URL (da Supabase)"
echo "   - JWT_SECRET (genera una chiave sicura)"
echo "   - FRONTEND_URL (URL di produzione Vercel)"
echo "3. Fai il deploy con: vercel --prod"
echo ""