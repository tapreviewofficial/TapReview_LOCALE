import { Router } from "express";
import { db, users } from "../lib/supabase.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/", async (req: any, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json({ user: null, impersonating: false });

  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const userId = payload?.userId || payload?.id;
    
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    const user = userResult.length ? userResult[0] : null;
    const impersonating = Boolean(payload?.imp);
    res.json({ user, impersonating });
  } catch {
    res.json({ user: null, impersonating: false });
  }
});

export default router;