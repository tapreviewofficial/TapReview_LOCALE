import { Router } from "express";
import { db, publicPages, users, promos } from "../lib/supabase.js";
import { eq, and, or, lte, gte, desc, count as drizzleCount, isNull } from "drizzle-orm";
import { storage } from "../storage.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// Ottieni pagina pubblica per slug (pubblica)
router.get("/public-pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const now = new Date();
    
    const publicPageResult = await db.select({
      id: publicPages.id,
      userId: publicPages.userId,
      slug: publicPages.slug,
      title: publicPages.title,
      theme: publicPages.theme,
      createdAt: publicPages.createdAt,
      updatedAt: publicPages.updatedAt,
      username: users.username
    })
    .from(publicPages)
    .innerJoin(users, eq(publicPages.userId, users.id))
    .where(eq(publicPages.slug, slug))
    .limit(1);

    if (!publicPageResult.length) {
      return res.status(404).json({ error: "Pagina non trovata" });
    }

    const publicPage = publicPageResult[0];
    
    // Get active promos for this public page
    const promosResult = await db.select()
      .from(promos)
      .where(
        and(
          eq(promos.publicPageId, publicPage.id),
          eq(promos.active, true),
          or(
            isNull(promos.startAt),
            lte(promos.startAt, now)
          ),
          or(
            isNull(promos.endAt),
            gte(promos.endAt, now)
          )
        )
      )
      .orderBy(desc(promos.createdAt));

    const { username, ...pageWithoutUsername } = publicPage;
    const result = {
      ...pageWithoutUsername,
      user: { username },
      promos: promosResult
    };

    res.json(result);
  } catch (error) {
    console.error("Errore recupero pagina pubblica:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Ottieni pagine pubbliche dell'utente (autenticato)
router.get("/public-pages", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const publicPagesResult = await db.select({
      id: publicPages.id,
      userId: publicPages.userId,
      slug: publicPages.slug,
      title: publicPages.title,
      theme: publicPages.theme,
      createdAt: publicPages.createdAt,
      updatedAt: publicPages.updatedAt,
      promosCount: drizzleCount(promos.id)
    })
    .from(publicPages)
    .leftJoin(promos, eq(publicPages.id, promos.publicPageId))
    .where(eq(publicPages.userId, userId))
    .groupBy(publicPages.id)
    .orderBy(desc(publicPages.createdAt));

    const result = publicPagesResult.map(page => ({
      ...page,
      _count: { promos: page.promosCount }
    }));

    res.json(result);
  } catch (error) {
    console.error("Errore recupero pagine pubbliche:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Crea nuova pagina pubblica
router.post("/public-pages", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { slug, title, theme } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Slug è obbligatorio" });
    }

    // Verifica che lo slug sia unico
    const existing = await db.select()
      .from(publicPages)
      .where(eq(publicPages.slug, slug))
      .limit(1);
      
    if (existing.length) {
      return res.status(400).json({ error: "Questo slug è già in uso" });
    }

    const publicPage = await db.insert(publicPages)
      .values({
        userId,
        slug,
        title: title || null,
        theme: theme ? JSON.stringify(theme) : null
      })
      .returning();

    res.status(201).json(publicPage[0]);
  } catch (error) {
    console.error("Errore creazione pagina pubblica:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Aggiorna pagina pubblica
router.patch("/public-pages/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const pageId = parseInt(req.params.id);
    const { slug, title, theme } = req.body;

    const existingPageResult = await db.select()
      .from(publicPages)
      .where(and(eq(publicPages.id, pageId), eq(publicPages.userId, userId)))
      .limit(1);

    if (!existingPageResult.length) {
      return res.status(404).json({ error: "Pagina non trovata" });
    }

    const existingPage = existingPageResult[0];

    // Se lo slug è cambiato, verifica che sia unico
    if (slug && slug !== existingPage.slug) {
      const slugExists = await db.select()
        .from(publicPages)
        .where(eq(publicPages.slug, slug))
        .limit(1);
        
      if (slugExists.length) {
        return res.status(400).json({ error: "Questo slug è già in uso" });
      }
    }

    const publicPage = await db.update(publicPages)
      .set({
        slug: slug || existingPage.slug,
        title: title !== undefined ? title : existingPage.title,
        theme: theme ? JSON.stringify(theme) : existingPage.theme
      })
      .where(eq(publicPages.id, pageId))
      .returning();

    res.json(publicPage[0]);
  } catch (error) {
    console.error("Errore aggiornamento pagina pubblica:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Elimina pagina pubblica
router.delete("/public-pages/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const pageId = parseInt(req.params.id);

    const existingPageResult = await db.select()
      .from(publicPages)
      .where(and(eq(publicPages.id, pageId), eq(publicPages.userId, userId)))
      .limit(1);

    if (!existingPageResult.length) {
      return res.status(404).json({ error: "Pagina non trovata" });
    }

    await db.delete(publicPages)
      .where(eq(publicPages.id, pageId));

    res.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione pagina pubblica:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;