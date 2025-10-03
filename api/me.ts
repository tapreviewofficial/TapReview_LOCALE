import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/shared/auth';
import { storage } from '../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const fullUser = await storage.getUserById(user.userId);
  if (!fullUser) {
    return res.status(401).json({ message: 'User not found' });
  }
  
  res.json({ 
    user: { 
      id: fullUser.id,
      email: fullUser.email, 
      username: fullUser.username,
      role: fullUser.role,
      mustChangePassword: fullUser.mustChangePassword
    }
  });
}
