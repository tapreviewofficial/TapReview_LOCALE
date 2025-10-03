import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/shared/storage';
import { hashPassword } from '../../lib/shared/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nuova password richiesti' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La password deve essere almeno di 6 caratteri' });
    }

    const passwordReset = await storage.getPasswordResetByToken(token);

    if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token non valido o scaduto' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(passwordReset.userId, hashedPassword);
    await storage.markPasswordResetAsUsed(passwordReset.id);

    res.json({ success: true, message: 'Password reimpostata con successo' });

  } catch (error) {
    console.error('Errore reset password:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}
