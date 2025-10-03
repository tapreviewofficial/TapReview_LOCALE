import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/shared/auth';
import { storage } from '../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const contacts = await storage.getPromotionalContacts(user.userId);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching promotional contacts:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}
