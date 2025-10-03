import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Helper per estrarre token da cookies nelle API routes Vercel
export function getTokenFromCookies(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.token || null;
}

// Helper per verificare autenticazione da cookies
export async function getCurrentUser(cookieHeader?: string): Promise<JWTPayload | null> {
  try {
    const token = getTokenFromCookies(cookieHeader);
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Helper per creare cookie header
export function createAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 30 * 24 * 60 * 60; // 30 giorni
  
  return `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProduction ? '; Secure' : ''}`;
}

export function createLogoutCookie(): string {
  return 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
}
