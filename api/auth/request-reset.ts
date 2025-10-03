import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nanoid } from 'nanoid';
import { storage } from '../../lib/shared/storage';
import { sendEmail, generatePasswordResetEmail } from '../../lib/shared/emailService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email richiesta' });
    }

    const user = await storage.getUserByEmail(email.toLowerCase());

    if (!user) {
      return res.json({ success: true, message: 'Se l\'email esiste, riceverai le istruzioni per il reset' });
    }

    await storage.invalidateUserPasswordResets(user.id);

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    await storage.createPasswordReset({
      userId: user.id,
      token,
      expiresAt,
      used: false
    });

    const frontendUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.FRONTEND_URL || 'http://localhost:5000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    const emailContent = generatePasswordResetEmail(resetLink, user.username);
    
    await sendEmail({
      to: user.email,
      subject: 'TapReview - Reimpostazione Password',
      html: emailContent.html,
      text: emailContent.text
    });

    res.json({ 
      success: true, 
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset' 
    });

  } catch (error) {
    console.error('Errore richiesta reset password:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}
