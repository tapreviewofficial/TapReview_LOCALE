import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/shared/auth';
import { storage } from '../../lib/shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { range = '7d', timezone = 'Europe/Rome', groupBy = 'none', linkId } = req.query;
    
    const validRanges = ['1d', '7d', '1w', '1m', '3m', '6m', '1y', 'all'];
    if (!validRanges.includes(range as string)) {
      return res.status(400).json({ message: 'Invalid range parameter' });
    }

    const data = await storage.getClicksTimeSeries(user.userId, {
      range: range as '1d' | '7d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all',
      timezone: timezone as string,
      groupBy: groupBy as 'none' | 'link',
      linkId: linkId ? parseInt(linkId as string) : undefined
    });
    
    res.json(data);
  } catch (error) {
    console.error('Analytics clicks time series error:', error);
    res.status(500).json({ message: 'Failed to fetch clicks analytics' });
  }
}
