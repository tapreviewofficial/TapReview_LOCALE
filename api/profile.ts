import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/shared/auth';
import { storage } from '../lib/shared/storage';
import { insertProfileSchema } from '@shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const profile = await storage.getProfile(user.userId);
      res.json(profile || {});
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  } else if (req.method === 'PUT') {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.upsertProfile(user.userId, profileData);
      res.json(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({ message: 'Failed to update profile' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
