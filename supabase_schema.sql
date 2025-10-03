-- TapReview Schema per Supabase PostgreSQL
-- Migrazione completa da SQLite/Prisma

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN');
CREATE TYPE ticket_status_enum AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role role_enum DEFAULT 'USER'
);

-- Profiles table
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  accent_color VARCHAR(7) DEFAULT '#CC9900'
);

-- Links table  
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicks INTEGER DEFAULT 0
);

-- Clicks table
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referer TEXT,
  ip_hash VARCHAR(255)
);

-- Public Pages table
CREATE TABLE public_pages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255),
  theme TEXT, -- JSON string per colori, layout, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promos table
CREATE TABLE promos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_page_id INTEGER REFERENCES public_pages(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'coupon' | 'invito' | 'omaggio'
  value_kind VARCHAR(20), -- 'percent' | 'amount'
  value DECIMAL(10,2),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_codes INTEGER DEFAULT 100,
  uses_per_code INTEGER DEFAULT 1,
  code_format VARCHAR(20) DEFAULT 'short', -- 'short' | 'uuid'
  qr_mode VARCHAR(20) DEFAULT 'url', -- 'url' | 'jwt'
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
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
CREATE TABLE scan_logs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  result VARCHAR(20) NOT NULL, -- 'valid'|'expired'|'used'
  at TIMESTAMPTZ DEFAULT NOW(),
  meta TEXT -- userAgent, ip hash, device info
);

-- Password Resets table
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_order ON links("order");
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);
CREATE INDEX idx_public_pages_user_id ON public_pages(user_id);
CREATE INDEX idx_public_pages_slug ON public_pages(slug);
CREATE INDEX idx_promos_user_id ON promos(user_id);
CREATE INDEX idx_promos_active ON promos(active);
CREATE INDEX idx_tickets_promo_id ON tickets(promo_id);
CREATE INDEX idx_tickets_code ON tickets(code);
CREATE INDEX idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service Role bypassa tutto automaticamente)
-- Nessuna policy = accesso bloccato dal client, solo Service Role

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_promos_updated_at 
    BEFORE UPDATE ON promos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_public_pages_updated_at 
    BEFORE UPDATE ON public_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();