import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { storage } from '../../../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, linkId } = req.query;
    const linkIdNum = parseInt(linkId as string);

    const user = await storage.getUserByUsername(username as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const links = await storage.getLinks(user.id);
    const link = links.find(l => l.id === linkIdNum);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    const userAgent = req.headers['user-agent'] || null;
    const referer = req.headers.referer || null;
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : null;
    const ipHash = ip ? crypto.createHash('sha256').update(ip + (process.env.JWT_SECRET || '')).digest('hex') : null;

    await storage.createClick({
      linkId: linkIdNum,
      userAgent,
      referer,
      ipHash,
    });

    await storage.incrementLinkClicks(linkIdNum);

    res.redirect(302, link.url);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ message: 'Redirect failed' });
  }
}
