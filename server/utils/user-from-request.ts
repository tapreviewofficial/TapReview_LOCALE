import type { Request } from "express";
import jwt from "jsonwebtoken";

export async function getUserIdFromRequest(req: Request): Promise<number|null> {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    return payload?.userId ?? payload?.id ?? null;
  } catch {
    return null;
  }
}