import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token richiesto' });
    }

    const passwordReset = await storage.getPasswordResetByToken(token);

    if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token non valido o scaduto' });
    }

    res.json({ 
      valid: true, 
      username: passwordReset.user.username 
    });

  } catch (error) {
    console.error('Errore verifica token reset:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}
