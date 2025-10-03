import { Router } from "express";
import { db, tickets } from "../lib/supabase.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/:code", async (req, res) => {
  const t = await db.select()
    .from(tickets)
    .where(eq(tickets.code, req.params.code))
    .limit(1);
    
  if (!t.length) return res.status(404).send("Codice non trovato");
  
  const ticket = t[0];
  if (ticket.usedAt) return res.status(410).send("Codice già usato");
  if (ticket.expiresAt && new Date() > ticket.expiresAt) return res.status(410).send("Codice scaduto");
  res.json({ ok: true, code: ticket.code, status: ticket.usedAt ? "USED" : "ACTIVE" });
});

export default router;