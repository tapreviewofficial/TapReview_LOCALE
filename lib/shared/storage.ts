import { eq, and, desc, asc, gte, count, sql } from 'drizzle-orm';
import { getDatabase } from './db';
import { users, profiles, links, clicks, passwordResets, promotionalContacts } from '@shared/schema';
import type { User, InsertUserDb, Profile, InsertProfile, Link, InsertLink, Click, InsertClick, PasswordReset, InsertPasswordReset, PromotionalContact, InsertPromotionalContact } from "@shared/schema";

export class Storage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const db = getDatabase();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    if (!user) return undefined;
    return { ...user, role: user.role || 'USER' } as User;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = getDatabase();
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];
    if (!user) return undefined;
    return { ...user, role: user.role || 'USER' } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDatabase();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = result[0];
    if (!user) return undefined;
    return { ...user, role: user.role || 'USER' } as User;
  }

  async createUser(user: InsertUserDb): Promise<User> {
    const db = getDatabase();
    const result = await db.insert(users).values(user).returning();
    const newUser = result[0];
    return { ...newUser, role: newUser.role || 'USER' } as User;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    const db = getDatabase();
    await db.update(users).set({ 
      password_hash: hashedPassword,
      mustChangePassword: false 
    }).where(eq(users.id, id));
  }

  async updateUserMustChangePassword(userId: number, mustChange: boolean): Promise<void> {
    const db = getDatabase();
    await db.update(users).set({ mustChangePassword: mustChange }).where(eq(users.id, userId));
  }

  // Profile methods
  async getProfile(userId: number): Promise<Profile | undefined> {
    const db = getDatabase();
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return result[0] || undefined;
  }

  async getProfileByUsername(username: string): Promise<(Profile & { user: User }) | undefined> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(eq(users.username, username))
      .limit(1);
      
    if (!result[0] || !result[0].users) return undefined;
    
    return {
      ...result[0].profiles,
      user: result[0].users
    } as Profile & { user: User };
  }

  async upsertProfile(userId: number, profile: InsertProfile): Promise<Profile> {
    const db = getDatabase();
    const result = await db
      .insert(profiles)
      .values({ ...profile, userId })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: profile
      })
      .returning();
    return result[0];
  }

  // Link methods
  async getLinks(userId: number): Promise<Link[]> {
    const db = getDatabase();
    return await db.select().from(links).where(eq(links.userId, userId)).orderBy(asc(links.order));
  }

  async createLink(userId: number, link: InsertLink): Promise<Link> {
    const db = getDatabase();
    const result = await db.insert(links).values({ ...link, userId }).returning();
    return result[0];
  }

  async updateLink(id: number, link: Partial<InsertLink>): Promise<Link> {
    const db = getDatabase();
    const result = await db.update(links).set(link).where(eq(links.id, id)).returning();
    return result[0];
  }

  async deleteLink(id: number): Promise<void> {
    const db = getDatabase();
    await db.delete(links).where(eq(links.id, id));
  }

  async getLinksByUsername(username: string): Promise<Link[]> {
    const db = getDatabase();
    const result = await db
      .select({
        id: links.id,
        title: links.title,
        url: links.url,
        order: links.order,
        userId: links.userId,
        createdAt: links.createdAt,
        clicks: links.clicks
      })
      .from(links)
      .leftJoin(users, eq(links.userId, users.id))
      .where(eq(users.username, username))
      .orderBy(asc(links.order));
      
    return result;
  }

  // Click methods
  async createClick(click: InsertClick): Promise<Click> {
    const db = getDatabase();
    const result = await db.insert(clicks).values(click).returning();
    return result[0];
  }

  async incrementLinkClicks(linkId: number): Promise<void> {
    const db = getDatabase();
    await db.update(links).set({ 
      clicks: sql`${links.clicks} + 1` 
    }).where(eq(links.id, linkId));
  }

  async getClickStats(userId: number): Promise<{ totalClicks: number; clicks7d: number; clicks30d: number }> {
    const db = getDatabase();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalResult = await db
      .select({ total: sql<number>`sum(${links.clicks})` })
      .from(links)
      .where(eq(links.userId, userId));

    const clicks7dResult = await db
      .select({ count: count() })
      .from(clicks)
      .leftJoin(links, eq(clicks.linkId, links.id))
      .where(and(
        eq(links.userId, userId),
        gte(clicks.createdAt, sevenDaysAgo)
      ));

    const clicks30dResult = await db
      .select({ count: count() })
      .from(clicks)
      .leftJoin(links, eq(clicks.linkId, links.id))
      .where(and(
        eq(links.userId, userId),
        gte(clicks.createdAt, thirtyDaysAgo)
      ));

    return {
      totalClicks: totalResult[0]?.total || 0,
      clicks7d: clicks7dResult[0]?.count || 0,
      clicks30d: clicks30dResult[0]?.count || 0
    };
  }

  async getLinkStats(userId: number): Promise<Array<{ id: number; title: string; clicksAllTime: number; clicks7d: number; clicks30d: number; order: number }>> {
    const db = getDatabase();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        id: links.id,
        title: links.title,
        clicksAllTime: links.clicks,
        order: links.order,
        clicks7d: sql<number>`
          (SELECT COUNT(*) FROM ${clicks} 
           WHERE ${clicks.linkId} = ${links.id} 
           AND ${clicks.createdAt} >= ${sevenDaysAgo.toISOString()})
        `,
        clicks30d: sql<number>`
          (SELECT COUNT(*) FROM ${clicks} 
           WHERE ${clicks.linkId} = ${links.id} 
           AND ${clicks.createdAt} >= ${thirtyDaysAgo.toISOString()})
        `
      })
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(asc(links.order));

    return result.map(r => ({
      id: r.id,
      title: r.title,
      clicksAllTime: r.clicksAllTime || 0,
      clicks7d: Number(r.clicks7d),
      clicks30d: Number(r.clicks30d),
      order: r.order || 0
    }));
  }

  async getClicksTimeSeries(userId: number, options: {
    range: '1d' | '7d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
    timezone?: string;
    groupBy?: 'none' | 'link';
    linkId?: number;
  }) {
    const db = getDatabase();
    const timezone = options.timezone || 'Europe/Rome';
    
    const now = new Date();
    let since: Date;
    let bucket: string;
    
    switch (options.range) {
      case '1d':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        bucket = 'hour';
        break;
      case '7d':
      case '1w':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        bucket = 'day';
        break;
      case '1m':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        bucket = 'day';
        break;
      case '3m':
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        bucket = 'day';
        break;
      case '6m':
        since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        bucket = 'week';
        break;
      case '1y':
        since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        bucket = 'week';
        break;
      case 'all':
      default:
        since = new Date('2020-01-01');
        bucket = 'month';
        break;
    }

    const bucketSql = sql<Date>`date_trunc('${sql.raw(bucket)}', ${clicks.createdAt})`;
    
    const whereConditions = [
      eq(links.userId, userId),
      gte(clicks.createdAt, since)
    ];
    if (options.linkId) {
      whereConditions.push(eq(clicks.linkId, options.linkId));
    }
    
    const result = await db
      .select({
        ts: bucketSql,
        count: count()
      })
      .from(clicks)
      .leftJoin(links, eq(clicks.linkId, links.id))
      .where(and(...whereConditions))
      .groupBy(bucketSql)
      .orderBy(asc(bucketSql));

    const totalResult = await db
      .select({ count: count() })
      .from(clicks)
      .leftJoin(links, eq(clicks.linkId, links.id))
      .where(and(...whereConditions));

    const totalClicks = totalResult[0]?.count || 0;

    const series = result.map(r => ({
      ts: r.ts instanceof Date ? r.ts.toISOString() : (new Date(r.ts)).toISOString(),
      count: Number(r.count)
    }));

    return {
      meta: {
        range: options.range,
        bucket,
        since,
        until: now,
        timezone
      },
      totals: {
        clicks: totalClicks
      },
      series
    };
  }

  // Password reset methods
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    const db = getDatabase();
    const result = await db.insert(passwordResets).values({
      userId: reset.userId,
      token: reset.token,
      expiresAt: reset.expiresAt,
      used: reset.used ?? false
    }).returning();
    return result[0] as PasswordReset;
  }

  async getPasswordResetByToken(token: string): Promise<(PasswordReset & { user: User }) | undefined> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(passwordResets)
      .leftJoin(users, eq(passwordResets.userId, users.id))
      .where(eq(passwordResets.token, token))
      .limit(1);

    if (!result[0] || !result[0].users) return undefined;

    return {
      ...result[0].password_resets,
      user: result[0].users
    } as PasswordReset & { user: User };
  }

  async markPasswordResetAsUsed(id: number): Promise<void> {
    const db = getDatabase();
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, id));
  }

  async invalidateUserPasswordResets(userId: number): Promise<void> {
    const db = getDatabase();
    await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.userId, userId));
  }

  // Promotional contacts methods
  async createOrUpdatePromotionalContact(contact: InsertPromotionalContact): Promise<PromotionalContact> {
    const db = getDatabase();
    const existingContact = await db
      .select()
      .from(promotionalContacts)
      .where(and(
        eq(promotionalContacts.email, contact.email),
        eq(promotionalContacts.userId, contact.userId)
      ))
      .limit(1);

    if (existingContact.length > 0) {
      const updated = await db
        .update(promotionalContacts)
        .set({
          firstName: contact.firstName,
          lastName: contact.lastName,
          lastPromoRequested: contact.lastPromoRequested,
          totalPromoRequests: sql`${promotionalContacts.totalPromoRequests} + 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(promotionalContacts.id, existingContact[0].id))
        .returning();
      
      return updated[0] as PromotionalContact;
    } else {
      const result = await db.insert(promotionalContacts).values(contact).returning();
      return result[0] as PromotionalContact;
    }
  }

  async getPromotionalContacts(userId: number): Promise<PromotionalContact[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(promotionalContacts)
      .where(eq(promotionalContacts.userId, userId))
      .orderBy(desc(promotionalContacts.createdAt));
    
    return result as PromotionalContact[];
  }

  async getAllPromotionalContacts(): Promise<PromotionalContact[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(promotionalContacts)
      .orderBy(desc(promotionalContacts.createdAt));
    
    return result as PromotionalContact[];
  }
}

// Export singleton instance
export const storage = new Storage();
