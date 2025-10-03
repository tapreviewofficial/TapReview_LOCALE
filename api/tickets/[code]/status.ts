import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../../lib/shared/db';
import { tickets } from '@shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;
  const db = getDatabase();
  
  const ticket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.code, code as string))
    .limit(1);
    
  if (!ticket.length) {
    return res.status(404).json({ error: 'Ticket non trovato' });
  }
  
  res.json(ticket[0]);
}
