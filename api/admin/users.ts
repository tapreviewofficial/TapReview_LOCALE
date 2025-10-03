import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser, hashPassword } from '../../lib/shared/auth';
import { getDatabase } from '../../lib/shared/db';
import { users, profiles, links } from '@shared/schema';
import { or, ilike, desc, count, eq } from 'drizzle-orm';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req.headers.cookie);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const db = getDatabase();
      const q = String(req.query.query || '').trim();
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 20);
      const skip = (page - 1) * pageSize;

      const whereCondition = q ? 
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

      res.json({ total, page, pageSize, users: usersData });
    } catch (error) {
      console.error('Admin users query error:', error);
      res.status(500).json({ message: 'Errore nel caricamento utenti' });
    }
  } else if (req.method === 'POST') {
    try {
      const db = getDatabase();
      const adminCreateUserSchema = insertUserSchema.omit({
        password: true
      }).extend({
        tempPassword: z.string().min(8, 'Password temporanea minimo 8 caratteri'),
        email: z.string().email('Email non valida').toLowerCase().trim(),
        username: z.string().min(3, 'Username minimo 3 caratteri').toLowerCase().trim(),
        role: z.enum(['USER', 'ADMIN']).default('USER')
      });

      const validation = adminCreateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dati non validi', 
          errors: validation.error.errors.map(e => e.message)
        });
      }

      const { email, username, role, tempPassword } = validation.data;
      const hashedPassword = await hashPassword(tempPassword);
      
      const newUser = await db.insert(users)
        .values({
          email,
          username,
          password_hash: hashedPassword,
          role,
          mustChangePassword: true
        })
        .returning();

      const createdUser = newUser[0];

      res.status(201).json({
        user: {
          id: createdUser.id,
          email: createdUser.email,
          username: createdUser.username,
          role: createdUser.role,
          mustChangePassword: createdUser.mustChangePassword,
          createdAt: createdUser.createdAt
        }
      });

    } catch (error: unknown) {
      console.error('Admin create user error:', error);
      
      const isPgError = (e: unknown): e is { code?: string; constraint?: string; message?: string } => {
        return typeof e === 'object' && e !== null;
      };
      
      if (isPgError(error) && error.code === '23505') {
        const constraint = error.constraint || '';
        const message = error.message || '';
        
        if (constraint.includes('email') || message.includes('email')) {
          return res.status(409).json({ message: 'Email già registrata' });
        }
        if (constraint.includes('username') || message.includes('username')) {
          return res.status(409).json({ message: 'Username già in uso' });
        }
        return res.status(409).json({ message: 'Email o username già in uso' });
      }
      
      res.status(500).json({ message: 'Errore nella creazione dell\'utente' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
