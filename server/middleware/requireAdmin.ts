import { Request, Response, NextFunction } from "express";
import { db, users } from "../lib/supabase.js";
import { eq } from "drizzle-orm";
import { getUserIdFromRequest } from "../utils/user-from-request";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Non autenticato" });
  
  const userResult = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
  const user = userResult.length ? userResult[0] : null;
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ message: "Solo admin" });
  }
  
  // attach admin to request for later use
  (req as any).admin = user;
  next();
}