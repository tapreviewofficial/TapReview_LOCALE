-- ================================================
-- SCRIPT SQL COMPLETO PER RESET DATABASE SUPABASE
-- TapReview - Tutte le tabelle del progetto
-- ================================================
-- 
-- ISTRUZIONI:
-- 1. Apri il Supabase SQL Editor
-- 2. Copia e incolla questo script completo
-- 3. Esegui tutto insieme per creare le tabelle
--
-- ================================================

-- Rimuovi tutte le tabelle esistenti se presenti (ordine inverso per foreign keys)
DROP TABLE IF EXISTS scan_logs CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS promos CASCADE;
DROP TABLE IF EXISTS public_pages CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================
-- TABELLA USERS (base utenti)
-- ================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index per performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ================================================
-- TABELLA PROFILES (profili utente)
-- ================================================
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    accent_color TEXT DEFAULT '#CC9900'
);

-- Index per performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ================================================
-- TABELLA LINKS (link dei profili)
-- ================================================
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    clicks INTEGER DEFAULT 0
);

-- Index per performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_order ON links("order");

-- ================================================
-- TABELLA CLICKS (tracciamento click)
-- ================================================
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    referer TEXT,
    ip_hash TEXT
);

-- Index per performance
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);

-- ================================================
-- TABELLA PASSWORD_RESETS (reset password)
-- ================================================
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index per performance
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- ================================================
-- TABELLA PUBLIC_PAGES (pagine pubbliche)
-- ================================================
CREATE TABLE public_pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index per performance
CREATE INDEX idx_public_pages_user_id ON public_pages(user_id);
CREATE INDEX idx_public_pages_slug ON public_pages(slug);

-- ================================================
-- TABELLA PROMOS (promozioni)
-- ================================================
CREATE TABLE promos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_page_id INTEGER REFERENCES public_pages(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    value_kind VARCHAR(20),
    value DECIMAL(10, 2),
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_codes INTEGER DEFAULT 100,
    uses_per_code INTEGER DEFAULT 1,
    code_format VARCHAR(20) DEFAULT 'short',
    qr_mode VARCHAR(20) DEFAULT 'url',
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index per performance
CREATE INDEX idx_promos_user_id ON promos(user_id);
CREATE INDEX idx_promos_public_page_id ON promos(public_page_id);
CREATE INDEX idx_promos_active ON promos(active);
CREATE INDEX idx_promos_start_end_at ON promos(start_at, end_at);

-- ================================================
-- TABELLA TICKETS (biglietti/coupon)
-- ================================================
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_surname VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    qr_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index per performance
CREATE INDEX idx_tickets_promo_id ON tickets(promo_id);
CREATE INDEX idx_tickets_code ON tickets(code);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer_email ON tickets(customer_email);

-- ================================================
-- TABELLA SCAN_LOGS (log scansioni QR)
-- ================================================
CREATE TABLE scan_logs (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    result VARCHAR(20) NOT NULL,
    at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    meta TEXT
);

-- Index per performance
CREATE INDEX idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX idx_scan_logs_at ON scan_logs(at);
CREATE INDEX idx_scan_logs_result ON scan_logs(result);

-- ================================================
-- TRIGGER PER UPDATED_AT AUTOMATICO
-- ================================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per public_pages
CREATE TRIGGER update_public_pages_updated_at 
    BEFORE UPDATE ON public_pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per promos
CREATE TRIGGER update_promos_updated_at 
    BEFORE UPDATE ON promos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DATI DI ESEMPIO (OPZIONALE - commentato)
-- ================================================

/*
-- Utente admin di esempio
INSERT INTO users (email, password_hash, username, role) VALUES 
('admin@tapreview.com', '$2a$10$example_hash_here', 'admin', 'ADMIN');

-- Profilo admin
INSERT INTO profiles (user_id, display_name, bio) VALUES 
(1, 'TapReview Admin', 'Amministratore del sistema TapReview');

-- Pagina pubblica esempio
INSERT INTO public_pages (user_id, slug, title, theme) VALUES 
(1, 'demo', 'Demo TapReview', 'default');
*/

-- ================================================
-- VERIFICA FINALE
-- ================================================

-- Mostra tutte le tabelle create
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Conta record in ogni tabella
SELECT 
    'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 
    'profiles' as table_name, COUNT(*) as records FROM profiles
UNION ALL
SELECT 
    'links' as table_name, COUNT(*) as records FROM links
UNION ALL
SELECT 
    'clicks' as table_name, COUNT(*) as records FROM clicks
UNION ALL
SELECT 
    'password_resets' as table_name, COUNT(*) as records FROM password_resets
UNION ALL
SELECT 
    'public_pages' as table_name, COUNT(*) as records FROM public_pages
UNION ALL
SELECT 
    'promos' as table_name, COUNT(*) as records FROM promos
UNION ALL
SELECT 
    'tickets' as table_name, COUNT(*) as records FROM tickets
UNION ALL
SELECT 
    'scan_logs' as table_name, COUNT(*) as records FROM scan_logs;

-- ================================================
-- FINE SCRIPT - DATABASE TAPREVIEW PRONTO!
-- ================================================