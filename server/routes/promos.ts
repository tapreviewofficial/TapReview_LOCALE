import { Router } from "express";
import { db, promos, tickets, users, publicPages } from "../lib/supabase";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { storage } from "../storage.js";
import { requireAuth } from "../lib/auth.js";
import { customAlphabet } from "nanoid";
import { EmailService } from "../lib/email-service.js";
import { logPromoEmail, updatePromoEmailStatus } from "../lib/db.js";

const router = Router();
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

// recupera userId dal middleware auth
function getUserId(req: any) { 
  return (req as any).user?.userId || 1; 
}

// Ottieni tutte le promozioni dell'utente
router.get("/promos", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
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
      .where(eq(promos.userId, userId))
      .orderBy(desc(promos.createdAt));

    // Get ticket counts for each promo
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
    console.error("Errore recupero promozioni:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Ottieni dettaglio promozione
router.get("/promos/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const promoId = parseInt(req.params.id);

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
      .where(and(eq(promos.id, promoId), eq(promos.userId, userId)))
      .limit(1);

    if (!promoResult.length) {
      return res.status(404).json({ error: "Promozione non trovata" });
    }

    const promo = promoResult[0];

    // Get tickets for this promo
    const promoTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.promoId, promoId))
      .orderBy(desc(tickets.createdAt));

    const result = {
      ...promo,
      tickets: promoTickets
    };

    res.json(result);
  } catch (error) {
    console.error("Errore recupero promozione:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Crea nuova promozione
router.post("/promos", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, type, startAt, endAt, publicPageId } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "Titolo e tipo sono obbligatori" });
    }

    const insertedPromo = await db
      .insert(promos)
      .values({
        userId,
        title,
        description,
        type,
        startAt: startAt ? new Date(startAt) : new Date(),
        endAt: endAt ? new Date(endAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        publicPageId: publicPageId || null
      })
      .returning();

    const promoId = insertedPromo[0].id;

    // Get the created promo with publicPage
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
    console.error("Errore creazione promozione:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Aggiorna promozione
router.patch("/promos/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const promoId = parseInt(req.params.id);
    const { title, description, type, startAt, endAt, active, publicPageId } = req.body;

    const existingPromo = await db
      .select()
      .from(promos)
      .where(and(eq(promos.id, promoId), eq(promos.userId, userId)))
      .limit(1);

    if (!existingPromo.length) {
      return res.status(404).json({ error: "Promozione non trovata" });
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

    // Get the updated promo with publicPage
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
    console.error("Errore aggiornamento promozione:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Elimina promozione
router.delete("/promos/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const promoId = parseInt(req.params.id);

    const existingPromo = await db
      .select()
      .from(promos)
      .where(and(eq(promos.id, promoId), eq(promos.userId, userId)))
      .limit(1);

    if (!existingPromo.length) {
      return res.status(404).json({ error: "Promozione non trovata" });
    }

    await db
      .delete(promos)
      .where(eq(promos.id, promoId));

    res.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione promozione:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// NUOVI ENDPOINT AGGIUNTI PER LA FUNZIONALITÀ RICHIESTA

// GET / -> lista promozioni dell'utente (per UI lista semplificata)
router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const items = await db
    .select({
      id: promos.id,
      title: promos.title,
      description: promos.description,
      active: promos.active,
      startAt: promos.startAt,
      endAt: promos.endAt
    })
    .from(promos)
    .where(eq(promos.userId, userId))
    .orderBy(desc(promos.createdAt));
  res.json({ items });
});

// PATCH /promos/:id/active -> set attiva (max 1 attiva)
router.patch("/promos/:id/active", requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const id = Number(req.params.id);
  const { active } = req.body as { active: boolean };
  
  const promo = await db
    .select()
    .from(promos)
    .where(and(eq(promos.id, id), eq(promos.userId, userId)))
    .limit(1);
    
  if (!promo.length) return res.status(404).json({ error: "Promo non trovata" });
  
  if (active) {
    // Deactivate all user's promos first
    await db
      .update(promos)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(promos.userId, userId));
    
    // Then activate the specific promo
    await db
      .update(promos)
      .set({ active: true, updatedAt: new Date() })
      .where(eq(promos.id, id));
  } else {
    await db
      .update(promos)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(promos.id, id));
  }
  
  res.json({ ok: true });
});

// GET /public/:username/active-promo -> dati minima promo attiva
router.get("/public/:username/active-promo", async (req, res) => {
  const { username } = req.params;
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
    
  if (!user.length) return res.json({ active: false });
  
  const promo = await db
    .select()
    .from(promos)
    .where(and(eq(promos.userId, user[0].id), eq(promos.active, true)))
    .limit(1);
    
  if (!promo.length) return res.json({ active: false });
  
  res.json({ 
    active: true, 
    title: promo[0].title, 
    description: promo[0].description, 
    endAt: promo[0].endAt 
  });
});

// POST /public/:username/claim -> genera ticket + (stub) invio email con link/QR
router.post("/public/:username/claim", async (req, res) => {
  try {
    const { username } = req.params;
    const { name, surname, email } = req.body as { name?: string; surname?: string; email: string };
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
      
    if (!user.length) return res.status(404).json({ error: "Profilo non trovato" });
    
    const promo = await db
      .select()
      .from(promos)
      .where(and(eq(promos.userId, user[0].id), eq(promos.active, true)))
      .limit(1);
      
    if (!promo.length) return res.status(400).json({ error: "Nessuna promozione attiva" });
    
    const code = nanoid();
    const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5000";
    const qrUrl = `${publicOrigin}/q/${code}`;
    
    await db
      .insert(tickets)
      .values({
        promoId: promo[0].id,
        customerName: name || null,
        customerSurname: surname || null,
        customerEmail: email,
        code, 
        qrUrl,
        expiresAt: promo[0].endAt
      });
      
    // Salva contatto promozionale per future campagne marketing
    try {
      await storage.createOrUpdatePromotionalContact({
        email,
        firstName: name || null,
        lastName: surname || null,
        userId: user[0].id,
        lastPromoRequested: promo[0].title || 'Promozione',
        totalPromoRequests: 1 // Il metodo gestisce l'incremento automaticamente se esiste già
      });
      console.log(`📧 Contatto promozionale salvato: ${email}`);
    } catch (contactError) {
      console.error('Error saving promotional contact:', contactError);
      // Non bloccare il flusso principale se il salvataggio del contatto fallisce
    }
      
    // Invia email con QR code tramite SendGrid e logga l'operazione
    let emailLogId: string | null = null;
    try {
      // Logga prima dell'invio
      emailLogId = await logPromoEmail({
        name: name ? `${name} ${surname || ''}`.trim() : undefined,
        email,
        code,
        promoTitle: promo[0].title,
        status: 'queued'
      });

      const emailSent = await EmailService.sendPromotionQRCode(
        email,
        name ? `${name} ${surname || ''}`.trim() : email.split('@')[0],
        qrUrl,
        {
          title: promo[0].title,
          description: promo[0].description ?? 'Partecipa alla nostra promozione speciale!',
          validUntil: promo[0].endAt ?? undefined
        }
      );
      
      if (emailSent) {
        console.log(`✅ QR Code email sent successfully to ${email}`);
        if (emailLogId) await updatePromoEmailStatus(emailLogId, 'sent');
      } else {
        console.log(`⚠️ Failed to send QR Code email to ${email}`);
        if (emailLogId) await updatePromoEmailStatus(emailLogId, 'failed', 'SendGrid returned false');
      }
    } catch (emailError) {
      console.error('Error sending QR Code email:', emailError);
      if (emailLogId) {
        await updatePromoEmailStatus(emailLogId, 'failed', emailError instanceof Error ? emailError.message : 'Unknown email error');
      }
      // Non bloccare la risposta anche se l'email fallisce
    }
    
    res.json({ ok: true, code, qrUrl });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Errore" });
  }
});

export default router;