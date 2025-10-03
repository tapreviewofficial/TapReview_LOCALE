import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAuthCookie } from '../../lib/shared/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  const impersonatorMatch = cookies.match(/impersonator=([^;]+)/);
  
  if (!impersonatorMatch) {
    return res.status(400).json({ message: 'No impersonator cookie found' });
  }

  const impersonatorToken = impersonatorMatch[1];

  res.setHeader('Set-Cookie', [
    createAuthCookie(impersonatorToken),
    'impersonator=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  ]);
  
  res.json({ ok: true });
}
