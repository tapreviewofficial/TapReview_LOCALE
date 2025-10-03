import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../lib/shared/db';
import { publicPages, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  const db = getDatabase();

  const page = await db
    .select({
      id: publicPages.id,
      userId: publicPages.userId,
      slug: publicPages.slug,
      title: publicPages.title,
      theme: publicPages.theme,
      createdAt: publicPages.createdAt,
      updatedAt: publicPages.updatedAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email
      }
    })
    .from(publicPages)
    .leftJoin(users, eq(publicPages.userId, users.id))
    .where(eq(publicPages.slug, slug as string))
    .limit(1);

  if (!page.length) {
    return res.status(404).json({ error: 'Pagina non trovata' });
  }

  res.json(page[0]);
}
