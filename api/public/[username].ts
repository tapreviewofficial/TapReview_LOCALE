import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.query;

    if (typeof username !== 'string') {
      return res.status(400).json({ message: 'Invalid username' });
    }
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await storage.getProfile(user.id);
    const links = await storage.getLinksByUsername(username);
    
    res.json({
      profile: {
        displayName: profile?.displayName || user.username,
        bio: profile?.bio || '',
        avatarUrl: profile?.avatarUrl || null,
        accentColor: profile?.accentColor || '#CC9900',
      },
      user: {
        username: user.username,
      },
      links,
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}
