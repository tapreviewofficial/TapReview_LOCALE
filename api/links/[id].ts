import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/shared/auth';
import { storage } from '../../lib/shared/storage';
import { insertLinkSchema } from '@shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const linkId = parseInt(id as string);

  if (req.method === 'PATCH') {
    try {
      const linkData = insertLinkSchema.partial().parse(req.body);
      const link = await storage.updateLink(linkId, linkData);
      res.json(link);
    } catch (error) {
      console.error('Update link error:', error);
      res.status(400).json({ message: 'Failed to update link' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await storage.deleteLink(linkId);
      res.json({ message: 'Link deleted' });
    } catch (error) {
      console.error('Delete link error:', error);
      res.status(400).json({ message: 'Failed to delete link' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
