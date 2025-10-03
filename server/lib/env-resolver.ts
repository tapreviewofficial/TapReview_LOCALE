// Auto-risoluzione delle variabili di ambiente per Supabase
// Configura automaticamente DATABASE_URL dall'integrazione Replit

console.log('🔧 Auto-configurazione variabili Supabase...');

// Auto-configurazione DATABASE_URL: priorità al POOLER per maggiore affidabilità
// Priorità: SUPABASE_DB_POOLER_URL > SUPABASE_DATABASE_URL > SUPABASE_DB_URL
if (!process.env.DATABASE_URL) {
  const poolerDbUrl = process.env.SUPABASE_DB_POOLER_URL; 
  const fallbackUrl = process.env.SUPABASE_DATABASE_URL;
  const directDbUrl = process.env.SUPABASE_DB_URL;
  
  const supabaseDbUrl = poolerDbUrl || fallbackUrl || directDbUrl;
  
  if (supabaseDbUrl) {
    // Aggiungi SSL solo se non presente
    const urlWithSsl = supabaseDbUrl.includes('sslmode=') 
      ? supabaseDbUrl
      : (supabaseDbUrl.includes('?') ? `${supabaseDbUrl}&sslmode=require` : `${supabaseDbUrl}?sslmode=require`);
    
    process.env.DATABASE_URL = urlWithSsl;
    const connectionType = poolerDbUrl ? 'pooler' : (fallbackUrl ? 'fallback' : 'diretta');
    console.log(`✅ DATABASE_URL auto-configurata da integrazione Supabase (${connectionType})`);
    
    // Se usiamo il pooler, rimuovi le altre variabili per evitare confusione
    if (poolerDbUrl) {
      delete process.env.SUPABASE_DB_URL;
      delete process.env.SUPABASE_DATABASE_URL;
    }
  } else {
    console.log('⚠️  DATABASE_URL non trovata - richiesta configurazione manuale');
  }
} else {
  let currentUrl = process.env.DATABASE_URL;
  
  // CLEAN-UP AUTOMATICO: rimuovi virgolette problematiche dai Replit Secrets
  if (currentUrl.startsWith('"') && currentUrl.endsWith('"')) {
    currentUrl = currentUrl.slice(1, -1);
    console.log('🔧 AUTO-FIX: Rimosse virgolette problematiche dalla DATABASE_URL');
  }
  
  // Verifica che sia effettivamente Supabase (supporta sia .com che .co)
  if (!currentUrl.includes('supabase.')) {
    console.log('⚠️  WARNING: DATABASE_URL non sembra essere Supabase');
  }
  
  // Rileva tentativi di conversione pooler->diretto (per debug)
  if (currentUrl.includes('pooler.') && currentUrl.includes(':5432')) {
    console.warn('⚠️  PROBLEMA: DATABASE_URL sembra convertita da pooler a diretto');
  }
  
  // MANTIENI POOLER URL (fix per DNS): il pooler URL è valido e funzionante!
  // Rimuovi solo parametri problematici ma mantieni il pooler hostname originale
  if (currentUrl.includes(':6543')) {
    console.log('✅ Mantenuto Supabase pooler URL originale (DNS risolto)');
    // Solo rimuovere pgbouncer se problematico, mantenere tutto il resto
    // currentUrl rimane invariato per mantenere hostname DNS valido
  }
  
  // Aggiungi SSL e search_path per schema tapreview se necessario
  if (currentUrl.includes('supabase.') && !currentUrl.includes('sslmode=')) {
    const urlWithSsl = currentUrl.includes('?') 
      ? `${currentUrl}&sslmode=require&options=-csearch_path%3Dtapreview,public` 
      : `${currentUrl}?sslmode=require&options=-csearch_path%3Dtapreview,public`;
    process.env.DATABASE_URL = urlWithSsl;
    console.log('✅ SSL e search_path tapreview aggiunti alla DATABASE_URL');
  } else if (currentUrl.includes('supabase.') && !currentUrl.includes('search_path')) {
    const urlWithPath = currentUrl.includes('?') 
      ? `${currentUrl}&options=-csearch_path%3Dtapreview,public` 
      : `${currentUrl}?options=-csearch_path%3Dtapreview,public`;
    process.env.DATABASE_URL = urlWithPath;
    console.log('✅ search_path tapreview aggiunto alla DATABASE_URL');
  } else {
    process.env.DATABASE_URL = currentUrl;
    console.log('✅ DATABASE_URL configurata correttamente');
  }
}

// Verifica che abbiamo tutte le variabili necessarie
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Variabili mancanti:', missingVars.join(', '));
} else {
  console.log('✅ Tutte le variabili di ambiente configurate');
}

export const isConfigured = missingVars.length === 0;