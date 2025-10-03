import { Router } from "express";
import { db, promos, tickets, scanLogs } from "../lib/supabase.js";
import { eq, and } from "drizzle-orm";
import { storage } from "../storage.js";
import { requireAuth } from "../lib/auth.js";
import { customAlphabet } from "nanoid";
import QRCode from "qrcode";

const router = Router();

// Crea codici più leggibili con alphabet senza caratteri confusi
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

// Genera nuovo ticket per una promozione
router.post("/promos/:promoId/tickets/generate", async (req, res) => {
  try {
    const promoId = parseInt(req.params.promoId);
    const { customerName, customerEmail } = req.body;

    // Verifica che la promozione esista e sia attiva
    const promo = await db.select()
      .from(promos)
      .where(and(eq(promos.id, promoId), eq(promos.active, true)))
      .limit(1);

    if (!promo.length) {
      return res.status(404).json({ error: "Promozione non trovata o non attiva" });
    }

    const promoData = promo[0];

    // Verifica se la promozione è ancora valida
    const now = new Date();
    if (promoData.startAt && now < promoData.startAt) {
      return res.status(400).json({ error: "La promozione non è ancora iniziata" });
    }
    if (promoData.endAt && now > promoData.endAt) {
      return res.status(400).json({ error: "La promozione è scaduta" });
    }

    // Genera codice unico
    let code = nanoid();
    let isUnique = false;
    let attempts = 0;
    
    // Assicurati che il codice sia unico (max 5 tentativi)
    while (!isUnique && attempts < 5) {
      const existing = await db.select()
        .from(tickets)
        .where(eq(tickets.code, code))
        .limit(1);
      if (!existing.length) {
        isUnique = true;
      } else {
        code = nanoid();
        attempts++;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: "Impossibile generare codice unico" });
    }

    // Costruisci URL QR
    const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5000";
    const qrUrl = `${publicOrigin}/q/${code}`;

    // Crea ticket
    const ticket = await db.insert(tickets)
      .values({
        promoId,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        code,
        qrUrl: qrUrl,
        expiresAt: promoData.endAt
      })
      .returning();

    const ticketData = ticket[0];

    // Genera QR code come data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    res.status(201).json({
      ticketId: ticketData.id,
      code,
      qrUrl,
      qrDataUrl,
      expiresAt: ticketData.expiresAt
    });

  } catch (error) {
    console.error("Errore generazione ticket:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Ottieni stato ticket
router.get("/tickets/:code/status", async (req, res) => {
  try {
    const { code } = req.params;
    
    const ticket = await db.select({
      id: tickets.id,
      status: tickets.status,
      usedAt: tickets.usedAt,
      expiresAt: tickets.expiresAt,
      promo: {
        title: promos.title,
        description: promos.description,
        type: promos.type
      }
    })
    .from(tickets)
    .innerJoin(promos, eq(tickets.promoId, promos.id))
    .where(eq(tickets.code, code))
    .limit(1);

    if (!ticket.length) {
      return res.status(404).json({ status: "not_found" });
    }

    const ticketData = ticket[0];
    const now = new Date();
    
    // Controlla se scaduto
    if (ticketData.expiresAt && now > ticketData.expiresAt) {
      return res.json({ 
        status: "expired", 
        usedAt: ticketData.usedAt,
        promo: ticketData.promo 
      });
    }
    
    // Controlla se già usato
    if (ticketData.status === "USED") {
      return res.json({ 
        status: "used", 
        usedAt: ticketData.usedAt,
        promo: ticketData.promo 
      });
    }

    // Ticket valido
    return res.json({ 
      status: "valid", 
      expiresAt: ticketData.expiresAt,
      promo: ticketData.promo 
    });

  } catch (error) {
    console.error("Errore controllo stato ticket:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Marca ticket come usato
router.post("/tickets/:code/use", async (req, res) => {
  try {
    const { code } = req.params;
    // L'utente che scansiona (se loggato)
    const scannedByUserId = (req as any).user?.id || null;
    
    const ticket = await db.select({
      id: tickets.id,
      status: tickets.status,
      usedAt: tickets.usedAt,
      expiresAt: tickets.expiresAt,
      promo: {
        title: promos.title,
        description: promos.description
      }
    })
    .from(tickets)
    .innerJoin(promos, eq(tickets.promoId, promos.id))
    .where(eq(tickets.code, code))
    .limit(1);

    if (!ticket.length) {
      await db.insert(scanLogs)
        .values({ 
          ticketId: 0, // ticket non trovato
          userId: scannedByUserId,
          result: "not_found",
          meta: req.get("User-Agent") || null
        })
        .catch(() => {}); // Ignora errori di log
      
      return res.status(404).json({ status: "not_found" });
    }

    const ticketData = ticket[0];

    const now = new Date();

    // Controlla se scaduto
    if (ticketData.expiresAt && now > ticketData.expiresAt) {
      await db.insert(scanLogs)
        .values({ 
          ticketId: ticketData.id, 
          userId: scannedByUserId,
          result: "expired",
          meta: req.get("User-Agent") || null
        });
      return res.json({ status: "expired" });
    }

    // Controlla se già usato (idempotente)
    if (ticketData.status === "USED") {
      await db.insert(scanLogs)
        .values({ 
          ticketId: ticketData.id, 
          userId: scannedByUserId,
          result: "used",
          meta: req.get("User-Agent") || null
        });
      return res.json({ status: "used", usedAt: ticketData.usedAt });
    }

    // Marca come usato
    const updatedTicket = await db.update(tickets)
      .set({ 
        status: "USED", 
        usedAt: now 
      })
      .where(eq(tickets.id, ticketData.id))
      .returning();

    // Log dello scan valido
    await db.insert(scanLogs)
      .values({ 
        ticketId: updatedTicket[0].id, 
        userId: scannedByUserId,
        result: "valid",
        meta: req.get("User-Agent") || null
      });

    res.json({ 
      status: "used", 
      usedAt: updatedTicket[0].usedAt,
      promo: ticketData.promo
    });

  } catch (error) {
    console.error("Errore utilizzo ticket:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;