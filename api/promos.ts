import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/shared/auth';
import { getDatabase } from '../lib/shared/db';
import { promos, publicPages, tickets } from '@shared/schema';
import { eq, desc, count, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const db = getDatabase();

  if (req.method === 'GET') {
    try {
      const promosResult = await db
        .select({
          id: promos.id,
          userId: promos.userId,
          publicPageId: promos.publicPageId,
          title: promos.title,
          description: promos.description,
          type: promos.type,
          valueKind: promos.valueKind,
          value: promos.value,
          startAt: promos.startAt,
          endAt: promos.endAt,
          maxCodes: promos.maxCodes,
          usesPerCode: promos.usesPerCode,
          codeFormat: promos.codeFormat,
          qrMode: promos.qrMode,
          active: promos.active,
          createdAt: promos.createdAt,
          updatedAt: promos.updatedAt,
          publicPage: {
            id: publicPages.id,
            userId: publicPages.userId,
            slug: publicPages.slug,
            title: publicPages.title,
            theme: publicPages.theme,
            createdAt: publicPages.createdAt,
            updatedAt: publicPages.updatedAt
          }
        })
        .from(promos)
        .leftJoin(publicPages, eq(promos.publicPageId, publicPages.id))
        .where(eq(promos.userId, user.userId))
        .orderBy(desc(promos.createdAt));

      const promosWithCounts = await Promise.all(
        promosResult.map(async (promo) => {
          const ticketCount = await db
            .select({ count: count() })
            .from(tickets)
            .where(eq(tickets.promoId, promo.id));
          
          return {
            ...promo,
            _count: { tickets: ticketCount[0]?.count || 0 }
          };
        })
      );

      res.json(promosWithCounts);
    } catch (error) {
      console.error('Errore recupero promozioni:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, type, startAt, endAt, publicPageId } = req.body;

      if (!title || !type) {
        return res.status(400).json({ error: 'Titolo e tipo sono obbligatori' });
      }

      const insertedPromo = await db
        .insert(promos)
        .values({
          userId: user.userId,
          title,
          description,
          type,
          startAt: startAt ? new Date(startAt) : new Date(),
          endAt: endAt ? new Date(endAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          publicPageId: publicPageId || null
        })
        .returning();

      const promoId = insertedPromo[0].id;

      const promoWithPublicPage = await db
        .select({
          id: promos.id,
          userId: promos.userId,
          publicPageId: promos.publicPageId,
          title: promos.title,
          description: promos.description,
          type: promos.type,
          valueKind: promos.valueKind,
          value: promos.value,
          startAt: promos.startAt,
          endAt: promos.endAt,
          maxCodes: promos.maxCodes,
          usesPerCode: promos.usesPerCode,
          codeFormat: promos.codeFormat,
          qrMode: promos.qrMode,
          active: promos.active,
          createdAt: promos.createdAt,
          updatedAt: promos.updatedAt,
          publicPage: {
            id: publicPages.id,
            userId: publicPages.userId,
            slug: publicPages.slug,
            title: publicPages.title,
            theme: publicPages.theme,
            createdAt: publicPages.createdAt,
            updatedAt: publicPages.updatedAt
          }
        })
        .from(promos)
        .leftJoin(publicPages, eq(promos.publicPageId, publicPages.id))
        .where(eq(promos.id, promoId))
        .limit(1);

      res.status(201).json(promoWithPublicPage[0]);
    } catch (error) {
      console.error('Errore creazione promozione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
