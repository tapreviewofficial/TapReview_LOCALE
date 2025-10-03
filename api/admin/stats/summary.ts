import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../../lib/shared/auth';
import { getDatabase } from '../../../lib/shared/db';
import { users, links, clicks } from '@shared/schema';
import { count, gte } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getCurrentUser(req.headers.cookie);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const db = getDatabase();
    const [usersCountResult, linksCountResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(links),
    ]);

    const usersCount = usersCountResult[0].count;
    const linksCount = linksCountResult[0].count;

    let clicksAllTime = 0;
    try {
      const linksResult = await db.select({ clicks: links.clicks }).from(links);
      if (linksResult.length) {
        clicksAllTime = linksResult.reduce((a: number, b: any) => a + (b.clicks || 0), 0);
      }
    } catch {
      try {
        const clicksResult = await db.select({ count: count() }).from(clicks);
        clicksAllTime = clicksResult[0].count;
      } catch {
        clicksAllTime = 0;
      }
    }

    let clicks7d = 0, clicks30d = 0;
    try {
      const now = new Date();
      const d7 = new Date(now); d7.setDate(now.getDate() - 7);
      const d30 = new Date(now); d30.setDate(now.getDate() - 30);
      
      const [clicks7dResult, clicks30dResult] = await Promise.all([
        db.select({ count: count() }).from(clicks).where(gte(clicks.createdAt, d7)),
        db.select({ count: count() }).from(clicks).where(gte(clicks.createdAt, d30))
      ]);
      
      clicks7d = clicks7dResult[0].count;
      clicks30d = clicks30dResult[0].count;
    } catch {
      clicks7d = 0; clicks30d = 0;
    }

    res.json({ usersCount, linksCount, clicksAllTime, clicks7d, clicks30d });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
