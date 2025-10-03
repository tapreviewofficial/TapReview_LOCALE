import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Funzione per creare connessione database serverless-friendly
let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedClient: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  // Riusa connessione in cache per serverless (warm starts)
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not configured');
  }

  // Configurazione ottimizzata per serverless (connection pooling)
  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const clientConfig = {
    ssl: 'require' as const,
    max: 1, // Serverless: 1 connessione per funzione
    idle_timeout: 20,
    connect_timeout: 10,
    ...(isPooler && { 
      prepare: false, // Disabilita prepared statements per PgBouncer
      onnotice: () => {},
    })
  };

  cachedClient = postgres(databaseUrl, clientConfig);
  cachedDb = drizzle(cachedClient, { schema });

  return cachedDb;
}

// Export schema
export * from '@shared/schema';
