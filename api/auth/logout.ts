import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogoutCookie } from '../../lib/shared/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', createLogoutCookie());
  res.json({ message: 'Logged out' });
}
