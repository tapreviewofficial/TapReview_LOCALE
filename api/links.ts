import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/shared/auth';
import { storage } from '../lib/shared/storage';
import { insertLinkSchema } from '@shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const links = await storage.getLinks(user.userId);
      res.json(links);
    } catch (error) {
      console.error('Get links error:', error);
      res.status(500).json({ message: 'Failed to fetch links' });
    }
  } else if (req.method === 'POST') {
    try {
      const linkData = insertLinkSchema.parse(req.body);
      const link = await storage.createLink(user.userId, linkData);
      res.json(link);
    } catch (error) {
      console.error('Create link error:', error);
      res.status(400).json({ message: 'Failed to create link' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
