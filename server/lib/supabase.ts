// Usiamo Drizzle direttamente con Supabase PostgreSQL 
// Come suggerito dall'integrazione Replit
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL non configurata');
}

console.log('🔗 Connessione a Supabase PostgreSQL via Drizzle...');

// Configurazione conservativa per Supabase
const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
const clientConfig = {
  ssl: 'require' as const,
  max: isPooler ? 3 : 8, // Incremento moderato: 2→3 per pooler
  idle_timeout: isPooler ? 15 : 30, // Timeout moderato  
  connect_timeout: 10, // Timeout più breve per fallire veloce
  ...(isPooler && { 
    prepare: false, // Disabilita prepared statements per PgBouncer
    onnotice: () => {}, // Ignora notices da PgBouncer
  })
};

const client = postgres(databaseUrl, clientConfig);
export const db = drizzle(client, { schema });

// Log connessione (senza password)
try {
  const url = new URL(databaseUrl);
  console.log(`🔗 Connesso a: ${url.hostname}:${url.port} database=${url.pathname.slice(1)} user=${url.username} ${isPooler ? '(pooler)' : '(diretto)'}`);
} catch (e) {
  console.log('🔗 Connesso a Supabase PostgreSQL');
}

// Export dello schema per uso diretto
export * from '@shared/schema';

// Test connessione semplice con timeout
Promise.race([
  client`SELECT 1 as test`,
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection test timeout')), 5000)
  )
]).then(() => {
  console.log('✅ Database Supabase connesso!');
}).catch((error: any) => {
  console.error('❌ Errore connessione database:', error.message);
});