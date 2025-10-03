import { Request, Response, NextFunction } from "express";
import { db, users } from "../lib/supabase.js";
import { eq } from "drizzle-orm";
import { getUserIdFromRequest } from "../utils/user-from-request";

export async function requirePasswordChanged(req: Request, res: Response, next: NextFunction) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Non autenticato" });
  
  const userResult = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
  const user = userResult.length ? userResult[0] : null;
  if (!user) {
    return res.status(401).json({ message: "Utente non trovato" });
  }
  
  // If user must change password, block access to business routes
  if (user.mustChangePassword) {
    return res.status(403).json({ 
      message: "Devi cambiare la password prima di continuare",
      code: "PASSWORD_CHANGE_REQUIRED"
    });
  }
  
  // Password is valid, proceed to route
  next();
}