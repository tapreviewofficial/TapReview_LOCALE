import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../../lib/shared/db';
import { users, promos } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username } = req.query;
  const db = getDatabase();
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username as string))
    .limit(1);
    
  if (!user.length) {
    return res.json({ active: false });
  }
  
  const promo = await db
    .select()
    .from(promos)
    .where(and(eq(promos.userId, user[0].id), eq(promos.active, true)))
    .limit(1);
    
  if (!promo.length) {
    return res.json({ active: false });
  }
  
  res.json({ 
    active: true, 
    title: promo[0].title, 
    description: promo[0].description, 
    endAt: promo[0].endAt 
  });
}
