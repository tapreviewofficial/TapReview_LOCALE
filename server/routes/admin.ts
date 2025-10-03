import { Router } from "express";
import { db, users, profiles, links, clicks } from "../lib/supabase.js";
import { eq, or, ilike, desc, count, gte } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { hashPassword } from "../lib/auth.js";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { EmailService } from "../lib/email-service.js";

const router = Router();

/** Utils */
function signToken(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

/** GET /api/admin/users?query=&page=1&pageSize=20
 *  Lista utenti con counts basilari.
 */
router.get("/users", async (req, res) => {
  try {
    const q = String(req.query.query || "").trim();
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);
    const skip = (page - 1) * pageSize;

    let whereCondition = q ? 
      or(
        ilike(users.email, `%${q}%`),
        ilike(users.username, `%${q}%`)
      ) : undefined;

    const [totalResult, usersResult] = await Promise.all([
      db.select({ count: count() })
        .from(users)
        .where(whereCondition),
      db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
        linksCount: count(links.id),
        displayName: profiles.displayName
      })
      .from(users)
      .leftJoin(links, eq(users.id, links.userId))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(whereCondition)
      .groupBy(users.id, profiles.displayName)
      .orderBy(desc(users.createdAt))
      .offset(skip)
      .limit(pageSize)
    ]);

    const total = totalResult[0].count;
    const usersData = usersResult.map(user => ({
      ...user,
      _count: { links: user.linksCount },
      profile: { displayName: user.displayName }
    }));

    console.log("Admin users query:", { q, page, pageSize, total, usersCount: usersData.length });

    res.json({ total, page, pageSize, users: usersData });
  } catch (error) {
    console.error("Admin users query error:", error);
    res.status(500).json({ message: "Errore nel caricamento utenti" });
  }
});

/** POST /api/admin/users
 *  Crea un nuovo utente da parte dell'admin
 */
router.post("/users", async (req, res) => {
  try {
    // Schema basato su shared schema con estensioni admin-specific
    const adminCreateUserSchema = insertUserSchema.omit({
      password: true  // Usiamo tempPassword invece
    }).extend({
      tempPassword: z.string().min(8, "Password temporanea minimo 8 caratteri"),
      email: z.string().email("Email non valida").toLowerCase().trim(),
      username: z.string().min(3, "Username minimo 3 caratteri").toLowerCase().trim(),
      role: z.enum(["USER", "ADMIN"]).default("USER")
    });

    // Validazione input con Zod
    const validation = adminCreateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Dati non validi", 
        errors: validation.error.errors.map(e => e.message)
      });
    }

    const { email, username, role, tempPassword } = validation.data;

    // Hash password
    const hashedPassword = await hashPassword(tempPassword);
    
    // Crea utente - lascia che il DB gestisca i constraint di unicità
    const newUser = await db.insert(users)
      .values({
        email,
        username,
        password_hash: hashedPassword,
        role,
        mustChangePassword: true // L'utente deve cambiare password al primo accesso
      })
      .returning();

    const user = newUser[0];

    console.log("Admin created user:", { id: user.id, email: user.email, role: user.role });

    // Invia email di benvenuto con credenziali (fire-and-forget)
    EmailService.sendWelcomeEmail(user.email, user.username, tempPassword)
      .then((success) => {
        if (success) {
          console.log(`Welcome email sent to ${user.email}`);
        } else {
          console.error(`Failed to send welcome email to ${user.email}`);
        }
      })
      .catch((error) => {
        console.error(`Welcome email error for ${user.email}:`, error);
      });

    // Restituisci utente creato (senza password_hash)
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt
      }
    });

  } catch (error: unknown) {
    console.error("Admin create user error:", error);
    
    // Type guard per errori PostgreSQL
    const isPgError = (e: unknown): e is { code?: string; constraint?: string; message?: string } => {
      return typeof e === 'object' && e !== null;
    };
    
    // Gestione errori specifici di unicità con constraint detection type-safe
    if (isPgError(error) && error.code === '23505') {
      const constraint = error.constraint || '';
      const message = error.message || '';
      
      if (constraint.includes('email') || message.includes('email')) {
        return res.status(409).json({ message: "Email già registrata" });
      }
      if (constraint.includes('username') || message.includes('username')) {
        return res.status(409).json({ message: "Username già in uso" });
      }
      return res.status(409).json({ message: "Email o username già in uso" });
    }
    
    res.status(500).json({ message: "Errore nella creazione dell'utente" });
  }
});

/** GET /api/admin/stats/summary
 *  Ritorna stats globali (utenti, link, click).
 *  Se esiste tabella Click, calcola 7/30 giorni. Altrimenti 0.
 */
router.get("/stats/summary", async (_req, res) => {
  const [usersCountResult, linksCountResult] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(links),
  ]);

  const usersCount = usersCountResult[0].count;
  const linksCount = linksCountResult[0].count;

  // All-time clicks
  let clicksAllTime = 0;
  try {
    // Se esiste colonna clicks su Link (contatore veloce)
    const linksResult = await db.select({ clicks: links.clicks }).from(links);
    if (linksResult.length) {
      clicksAllTime = linksResult.reduce((a: number, b: any) => a + (b.clicks || 0), 0);
    }
  } catch {
    // Se non esiste la colonna clicks, prova tabella Click
    try {
      const clicksResult = await db.select({ count: count() }).from(clicks);
      clicksAllTime = clicksResult[0].count;
    } catch {
      clicksAllTime = 0;
    }
  }

  // 7 / 30 giorni se c'è tabella Click
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
});

/** POST /api/admin/impersonate/:userId
 *  Impersona un utente: salva cookie 'token' dell'UTENTE e un cookie 'impersonator'
 *  firmato con l'ID dell'admin, per poter tornare indietro.
 */
router.post("/impersonate/:userId", async (req: any, res) => {
  const targetId = Number(req.params.userId);
  const admin = req.admin; // messo da requireAdmin
  const userResult = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  const user = userResult.length ? userResult[0] : null;
  if (!user) return res.status(404).json({ message: "Utente non trovato" });

  const userToken = signToken({ userId: user.id, imp: true, by: admin.id });
  const adminToken = signToken({ id: admin.id, purpose: "impersonator" });

  res
    .cookie("token", userToken, { httpOnly: true, sameSite: "lax", path: "/" })
    .cookie("impersonator", adminToken, { httpOnly: true, sameSite: "lax", path: "/" })
    .json({ ok: true });
});

// Note: stop-impersonate is now handled in main routes.ts to avoid requireAdmin middleware

export default router;