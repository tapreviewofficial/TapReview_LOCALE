import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../../../lib/shared/auth';
import { getDatabase } from '../../../../lib/shared/db';
import { promos, tickets } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const db = getDatabase();
  const promoId = parseInt(req.query.id as string);
  const { customerEmail, customerName, customerSurname } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ error: 'Email richiesta' });
  }

  const promo = await db
    .select()
    .from(promos)
    .where(and(eq(promos.id, promoId), eq(promos.userId, user.userId)))
    .limit(1);

  if (!promo.length) {
    return res.status(404).json({ error: 'Promozione non trovata' });
  }

  const code = nanoid(10);
  const publicOrigin = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.FRONTEND_URL || 'http://localhost:5000';
  const qrUrl = `${publicOrigin}/q/${code}`;

  const result = await db
    .insert(tickets)
    .values({
      promoId,
      customerEmail,
      customerName: customerName || null,
      customerSurname: customerSurname || null,
      code,
      qrUrl,
      expiresAt: promo[0].endAt
    })
    .returning();

  res.json(result[0]);
}
