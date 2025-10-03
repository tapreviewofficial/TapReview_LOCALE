import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { promoEmails, type InsertPromoEmail, type PromoEmail } from '@shared/schema';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Drizzle with existing database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
export const db = drizzle(client);

// Helper function to log promotional email entries
export async function logPromoEmail(entry: {
  name?: string;
  email: string;
  code: string;
  promoTitle: string;
  status?: 'queued' | 'sent' | 'failed';
  error?: string;
}): Promise<string> {
  try {
    const insertData: InsertPromoEmail = {
      name: entry.name || null,
      email: entry.email,
      code: entry.code,
      promoTitle: entry.promoTitle,
      status: entry.status || 'queued',
      error: entry.error || null,
    };

    const result = await db.insert(promoEmails).values(insertData).returning({ id: promoEmails.id });
    
    console.log(`✅ Promo email logged: ${entry.email} - ${entry.code} - Status: ${entry.status || 'queued'}`);
    
    return result[0].id;
  } catch (error) {
    console.error('❌ Error logging promo email:', error);
    throw error;
  }
}

// Helper function to update promo email status
export async function updatePromoEmailStatus(
  id: string, 
  status: 'queued' | 'sent' | 'failed', 
  error?: string
): Promise<void> {
  try {
    await db
      .update(promoEmails)
      .set({ 
        status,
        error: error || null
      })
      .where(eq(promoEmails.id, id));
    
    console.log(`📧 Updated promo email ${id} status to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating promo email status:', error);
    throw error;
  }
}

// Helper function to get promo email by ID
export async function getPromoEmailById(id: string): Promise<PromoEmail | null> {
  try {
    const result = await db
      .select()
      .from(promoEmails)
      .where(eq(promoEmails.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('❌ Error getting promo email:', error);
    return null;
  }
}

// Helper function to get recent promo emails (for debugging/monitoring)
export async function getRecentPromoEmails(limit: number = 50): Promise<PromoEmail[]> {
  try {
    const result = await db
      .select()
      .from(promoEmails)
      .orderBy(desc(promoEmails.createdAt))
      .limit(limit);
    
    return result;
  } catch (error) {
    console.error('❌ Error getting recent promo emails:', error);
    return [];
  }
}