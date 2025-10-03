import type { VercelRequest, VercelResponse} from '@vercel/node';
import { storage } from '../../lib/shared/storage';
import { comparePassword, signToken, createAuthCookie } from '../../lib/shared/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    res.setHeader('Set-Cookie', createAuthCookie(token));
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        mustChangePassword: user.mustChangePassword 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: 'Login failed' });
  }
}
