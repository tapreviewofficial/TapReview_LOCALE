import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../../lib/shared/auth';
import { getDatabase } from '../../../lib/shared/db';
import { tickets } from '@shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
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

  if (ticket[0].status === 'USED') {
    return res.status(400).json({ error: 'Ticket già utilizzato' });
  }

  await db
    .update(tickets)
    .set({ status: 'USED', usedAt: new Date() })
    .where(eq(tickets.code, code as string));
  
  res.json({ ok: true, message: 'Ticket utilizzato con successo' });
}
