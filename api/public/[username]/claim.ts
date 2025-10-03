import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../../lib/shared/db';
import { storage } from '../../../lib/shared/storage';
import { users, promos, tickets } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.query;
    const { name, surname, email } = req.body as { name?: string; surname?: string; email: string };
    
    const db = getDatabase();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username as string))
      .limit(1);
      
    if (!user.length) {
      return res.status(404).json({ error: 'Profilo non trovato' });
    }
    
    const promo = await db
      .select()
      .from(promos)
      .where(and(eq(promos.userId, user[0].id), eq(promos.active, true)))
      .limit(1);
      
    if (!promo.length) {
      return res.status(400).json({ error: 'Nessuna promozione attiva' });
    }
    
    const code = nanoid(10);
    const publicOrigin = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.FRONTEND_URL || 'http://localhost:5000';
    const qrUrl = `${publicOrigin}/q/${code}`;
    
    await db
      .insert(tickets)
      .values({
        promoId: promo[0].id,
        customerName: name || null,
        customerSurname: surname || null,
        customerEmail: email,
        code, 
        qrUrl,
        expiresAt: promo[0].endAt
      });
      
    try {
      await storage.createOrUpdatePromotionalContact({
        email,
        firstName: name || null,
        lastName: surname || null,
        userId: user[0].id,
        lastPromoRequested: promo[0].title || 'Promozione',
        totalPromoRequests: 1
      });
    } catch (contactError) {
      console.error('Error saving promotional contact:', contactError);
    }
    
    res.json({ ok: true, code, qrUrl });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Errore' });
  }
}
