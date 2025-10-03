import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/shared/auth';
import { getDatabase } from '../../lib/shared/db';
import { promos, publicPages, tickets } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const db = getDatabase();
  const promoId = parseInt(req.query.id as string);

  if (req.method === 'GET') {
    try {
      const promoResult = await db
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
        .where(and(eq(promos.id, promoId), eq(promos.userId, user.userId)))
        .limit(1);

      if (!promoResult.length) {
        return res.status(404).json({ error: 'Promozione non trovata' });
      }

      const promo = promoResult[0];
      const promoTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.promoId, promoId))
        .orderBy(desc(tickets.createdAt));

      res.json({
        ...promo,
        tickets: promoTickets
      });
    } catch (error) {
      console.error('Errore recupero promozione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { title, description, type, startAt, endAt, active, publicPageId } = req.body;

      const existingPromo = await db
        .select()
        .from(promos)
        .where(and(eq(promos.id, promoId), eq(promos.userId, user.userId)))
        .limit(1);

      if (!existingPromo.length) {
        return res.status(404).json({ error: 'Promozione non trovata' });
      }

      await db
        .update(promos)
        .set({
          title,
          description,
          type,
          startAt: startAt ? new Date(startAt) : new Date(),
          endAt: endAt ? new Date(endAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          active,
          publicPageId: publicPageId || null,
          updatedAt: new Date()
        })
        .where(eq(promos.id, promoId));

      const updatedPromo = await db
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

      res.json(updatedPromo[0]);
    } catch (error) {
      console.error('Errore aggiornamento promozione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const existingPromo = await db
        .select()
        .from(promos)
        .where(and(eq(promos.id, promoId), eq(promos.userId, user.userId)))
        .limit(1);

      if (!existingPromo.length) {
        return res.status(404).json({ error: 'Promozione non trovata' });
      }

      await db.delete(promos).where(eq(promos.id, promoId));
      res.json({ success: true });
    } catch (error) {
      console.error('Errore eliminazione promozione:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
