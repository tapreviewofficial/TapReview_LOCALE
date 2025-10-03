import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../../lib/shared/auth';
import { getDatabase } from '../../../lib/shared/db';
import { promos } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const db = getDatabase();
  const id = parseInt(req.query.id as string);
  const { active } = req.body as { active: boolean };
  
  const promo = await db
    .select()
    .from(promos)
    .where(and(eq(promos.id, id), eq(promos.userId, user.userId)))
    .limit(1);
    
  if (!promo.length) {
    return res.status(404).json({ error: 'Promo non trovata' });
  }
  
  if (active) {
    await db
      .update(promos)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(promos.userId, user.userId));
    
    await db
      .update(promos)
      .set({ active: true, updatedAt: new Date() })
      .where(eq(promos.id, id));
  } else {
    await db
      .update(promos)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(promos.id, id));
  }
  
  res.json({ ok: true });
}
