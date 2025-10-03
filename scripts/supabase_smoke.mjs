// scripts/supabase_smoke.mjs
import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

function assertEnv() {
  const missing = [];
  if (!url)  missing.push('SUPABASE_URL');
  if (!anon) missing.push('SUPABASE_ANON_KEY');
  if (missing.length) {
    console.error('ERROR: Mancano variabili d\'ambiente:', missing.join(', '));
    process.exit(1);
  }
  console.log('SUCCESS: Env ok:', { SUPABASE_URL: url.replace(/https?:\/\//,''), HAS_SERVICE_ROLE: !!service });
}

async function run() {
  assertEnv();

  // client lato "utente"
  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  // Prova INSERT nella tabella `links`
  const testRow = {
    url: 'https://example.com',
    title: 'SmokeTest',
    created_at: new Date().toISOString()
  };

  console.log('TESTING: Provo INSERT anon su public.links ...');
  const { data, error } = await supabase.from('links').insert([testRow]).select();

  if (error) {
    console.error('ERROR: INSERT (anon) fallita:', error);

    // Diagnostica rapida
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('permission') || msg.includes('rls') || msg.includes('policy')) {
      console.warn('\nWARNING: Probabile RLS senza policy di INSERT per ruolo anon.');
      console.warn('SOLUTION: Aggiungi in Supabase SQL Editor le policy seguenti:\n');
      console.warn('-- ATTENZIONE: Policy anon INSERT non è consigliata in produzione!');
      console.warn('-- Usa solo per test di sviluppo. In produzione usa service-role.');
      console.warn('-- Consenti INSERT agli anon sulla tabella public.links (SOLO SVILUPPO)');
      console.warn('CREATE POLICY "allow insert to anon"');
      console.warn('ON public.links');
      console.warn('FOR INSERT');
      console.warn('TO anon');
      console.warn('WITH CHECK (true);');
      console.warn('');
      console.warn('-- (facoltativo) Consenti SELECT');
      console.warn('CREATE POLICY "allow select to anon"');
      console.warn('ON public.links');
      console.warn('FOR SELECT');
      console.warn('TO anon');
      console.warn('USING (true);');
      console.warn('');
      console.warn('-- Assicurati che la RLS sia abilitata (di default lo è)');
      console.warn('ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;');
    } else if (msg.includes('relation') && msg.includes('does not exist')) {
      console.warn('\nWARNING: La tabella public.links non esiste.');
      console.warn('SOLUTION: Crea tabella e policy con queste SQL:\n');
      console.warn('CREATE TABLE IF NOT EXISTS public.links (');
      console.warn('  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.warn('  url text NOT NULL,');
      console.warn('  title text,');
      console.warn('  created_at timestamptz DEFAULT now()');
      console.warn(');');
      console.warn('');
      console.warn('ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;');
      console.warn('');
      console.warn('CREATE POLICY "allow insert to anon" ON public.links FOR INSERT TO anon WITH CHECK (true);');
      console.warn('CREATE POLICY "allow select to anon" ON public.links FOR SELECT TO anon USING (true);');
    } else {
      console.warn('\nINFO: Se vuoi forzare un test lato server, imposta SUPABASE_SERVICE_ROLE_KEY e rilancia.');
    }

    // Se hai la service key, proviamo un insert "admin" per verificare connettività
    if (service) {
      console.log('\nTESTING: Riprovo con SERVICE_ROLE_KEY (bypass RLS) per testare la connettività ...');
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const { data: d2, error: e2 } = await admin.from('links').insert([{
        ...testRow, title: 'SmokeTest (service)'
      }]).select();
      if (e2) {
        console.error('ERROR: INSERT (service) fallita:', e2);
      } else {
        console.log('SUCCESS: INSERT (service) riuscita:', d2);
        console.log('INFO: Connettività ok: il problema è RLS/policy lato anon.');
      }
    }

    process.exit(1);
  }

  console.log('SUCCESS: INSERT (anon) riuscita:', data);

  // Verifica conteggio
  const { count, error: countErr } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('WARNING: Select count fallita:', countErr);
  } else {
    console.log('INFO: Righe in links:', count);
  }

  console.log('SUCCESS: Smoke test completato.');
}

run().catch(e => {
  console.error('ERROR: Errore inatteso:', e);
  process.exit(1);
});