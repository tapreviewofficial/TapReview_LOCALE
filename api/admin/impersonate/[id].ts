import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser, signToken, createAuthCookie } from '../../../lib/shared/auth';
import { getDatabase } from '../../../lib/shared/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const admin = await getCurrentUser(req.headers.cookie);
  if (!admin || admin.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const targetId = parseInt(req.query.id as string);
  const db = getDatabase();
  
  const userResult = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  const user = userResult.length ? userResult[0] : null;
  
  if (!user) {
    return res.status(404).json({ message: 'Utente non trovato' });
  }

  const userToken = signToken({ userId: user.id, email: user.email, username: user.username, role: user.role });
  const adminToken = signToken({ userId: admin.userId, email: admin.email, username: admin.username, role: 'ADMIN' });

  res.setHeader('Set-Cookie', [
    createAuthCookie(userToken),
    `impersonator=${adminToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
  ]);
  
  res.json({ ok: true });
}
