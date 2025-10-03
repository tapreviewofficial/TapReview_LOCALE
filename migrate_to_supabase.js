// Script per migrare schema e dati a Supabase
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import * as schema from './server/lib/schema.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL non configurata');
}

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

// Schema SQL da eseguire su Supabase
const schemaSql = `
-- Create ENUM types
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN');
CREATE TYPE ticket_status_enum AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role role_enum DEFAULT 'USER'
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  accent_color VARCHAR(7) DEFAULT '#CC9900'
);

-- Links table  
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicks INTEGER DEFAULT 0
);

-- Clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referer TEXT,
  ip_hash VARCHAR(255)
);

-- Public Pages table
CREATE TABLE IF NOT EXISTS public_pages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255),
  theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promos table
CREATE TABLE IF NOT EXISTS promos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_page_id INTEGER REFERENCES public_pages(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  value_kind VARCHAR(20),
  value DECIMAL(10,2),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_codes INTEGER DEFAULT 100,
  uses_per_code INTEGER DEFAULT 1,
  code_format VARCHAR(20) DEFAULT 'short',
  qr_mode VARCHAR(20) DEFAULT 'url',
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_surname VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  qr_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Scan Logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  result VARCHAR(20) NOT NULL,
  at TIMESTAMPTZ DEFAULT NOW(),
  meta TEXT
);

-- Password Resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_promos_user_id ON promos(user_id);
CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(active);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
`;

async function migrateToSupabase() {
  console.log('🚀 Inizio migrazione a Supabase...');
  
  try {
    // 1. Crea lo schema
    console.log('📋 Creazione schema...');
    await client.unsafe(schemaSql);
    console.log('✅ Schema creato!');

    // 2. Leggi i dati esportati
    console.log('📄 Lettura dati esportati...');
    const exportedData = JSON.parse(fs.readFileSync('./server/exported_data.json', 'utf8'));
    
    // 3. Inserisci i dati in ordine corretto (rispettando le foreign keys)
    console.log('👥 Inserimento utenti...');
    for (const user of exportedData.users) {
      await db.insert(schema.users).values({
        email: user.email,
        password: user.password,
        username: user.username,
        createdAt: new Date(user.createdAt),
        role: user.role
      }).onConflictDoNothing();
    }

    console.log('📋 Inserimento profili...');
    for (const profile of exportedData.profiles) {
      await db.insert(schema.profiles).values({
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl || null,
        accentColor: profile.accentColor
      }).onConflictDoNothing();
    }

    console.log('🔗 Inserimento link...');
    for (const link of exportedData.links) {
      await db.insert(schema.links).values({
        title: link.title,
        url: link.url,
        order: link.order,
        userId: link.userId,
        createdAt: new Date(link.createdAt),
        clicks: link.clicks
      }).onConflictDoNothing();
    }

    console.log('🎁 Inserimento promozioni...');
    for (const promo of exportedData.promos) {
      await db.insert(schema.promos).values({
        userId: promo.userId,
        publicPageId: promo.publicPageId,
        title: promo.title,
        description: promo.description,
        type: promo.type,
        valueKind: promo.valueKind,
        value: promo.value ? promo.value.toString() : null,
        startAt: new Date(promo.startAt),
        endAt: new Date(promo.endAt),
        maxCodes: promo.maxCodes,
        usesPerCode: promo.usesPerCode,
        codeFormat: promo.codeFormat,
        qrMode: promo.qrMode,
        active: promo.active,
        createdAt: new Date(promo.createdAt),
        updatedAt: new Date(promo.updatedAt)
      }).onConflictDoNothing();
    }

    // Inserisci altre tabelle se hanno dati
    if (exportedData.clicks.length > 0) {
      console.log('📊 Inserimento click...');
      for (const click of exportedData.clicks) {
        await db.insert(schema.clicks).values({
          linkId: click.linkId,
          createdAt: new Date(click.createdAt),
          userAgent: click.userAgent,
          referer: click.referer,
          ipHash: click.ipHash
        }).onConflictDoNothing();
      }
    }

    console.log('✅ Migrazione completata con successo!');
    console.log('🔍 Verifica dati...');
    
    const userCount = await db.select().from(schema.users);
    const profileCount = await db.select().from(schema.profiles);
    const linkCount = await db.select().from(schema.links);
    const promoCount = await db.select().from(schema.promos);
    
    console.log(`👥 Utenti migrati: ${userCount.length}`);
    console.log(`📋 Profili migrati: ${profileCount.length}`);
    console.log(`🔗 Link migrati: ${linkCount.length}`);
    console.log(`🎁 Promozioni migrate: ${promoCount.length}`);

  } catch (error) {
    console.error('❌ Errore durante migrazione:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateToSupabase();