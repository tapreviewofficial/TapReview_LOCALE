// Script di bootstrap automatico per configurare Supabase RLS policies
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL non configurata');
}

// Configurazione specifica per Supabase
const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 2,
  idle_timeout: 10,
  connect_timeout: 15,
  ...(isPooler && { 
    prepare: false,
    onnotice: () => {}
  })
});

async function bootstrapSupabase() {
  console.log('🚀 Bootstrap automatico Supabase...');
  
  // TEMPORANEO: Skip bootstrap per testare app senza RLS
  console.log('⏭️  Bootstrap saltato temporaneamente per test');
  return;
  
  try {
    // Verifica se il bootstrap è già stato eseguito
    let isBootstrapped = false;
    try {
      const result = await sql`
        SELECT value FROM system_settings WHERE key = 'bootstrap_version'
      `;
      isBootstrapped = result.length > 0;
    } catch (error) {
      // Tabella non esiste, procediamo con il bootstrap
    }

    if (isBootstrapped) {
      console.log('✅ Supabase già configurato, skip bootstrap');
      return;
    }

    console.log('⚙️  Configurazione RLS policies...');

    // Crea tabella system_settings se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Abilita RLS su tutte le tabelle principali
    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE links ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE clicks ENABLE ROW LEVEL SECURITY`;

    // Policy per users - solo accesso proprio profilo
    await sql`
      CREATE POLICY IF NOT EXISTS "users_own_data" ON users
      FOR ALL USING (id = auth.uid())
    `;

    // Policy per profiles - lettura pubblica, modifica solo owner
    await sql`
      CREATE POLICY IF NOT EXISTS "profiles_public_read" ON profiles
      FOR SELECT USING (true)
    `;
    await sql`
      CREATE POLICY IF NOT EXISTS "profiles_own_write" ON profiles
      FOR ALL USING (user_id = auth.uid())
    `;

    // Policy per links - lettura pubblica, gestione solo owner
    await sql`
      CREATE POLICY IF NOT EXISTS "links_public_read" ON links
      FOR SELECT USING (true)
    `;
    await sql`
      CREATE POLICY IF NOT EXISTS "links_own_manage" ON links
      FOR ALL USING (user_id = auth.uid())
    `;

    // Policy per clicks - inserimento pubblico, lettura solo owner
    await sql`
      CREATE POLICY IF NOT EXISTS "clicks_public_insert" ON clicks
      FOR INSERT WITH CHECK (true)
    `;
    await sql`
      CREATE POLICY IF NOT EXISTS "clicks_own_read" ON clicks
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM links 
          WHERE links.id = clicks.link_id 
          AND links.user_id = auth.uid()
        )
      )
    `;

    // Segna il bootstrap come completato
    await sql`
      INSERT INTO system_settings (key, value)
      VALUES ('bootstrap_version', '1.0')
      ON CONFLICT (key) DO UPDATE SET value = '1.0'
    `;

    console.log('✅ RLS policies configurate automaticamente');
    
    // Test di connessione base
    const testResult = await sql`SELECT 1 as test`;
    if (testResult[0]?.test === 1) {
      console.log('✅ Test connessione database OK');
    }
    
  } catch (error) {
    console.error('❌ Errore bootstrap Supabase:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

export { bootstrapSupabase };

// Se eseguito direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapSupabase().catch(console.error);
}