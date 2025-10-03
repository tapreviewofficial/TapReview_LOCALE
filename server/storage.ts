import { SupabaseStorage } from "./lib/supabase-storage";
import type { User, InsertUser, InsertUserDb, Profile, InsertProfile, Link, InsertLink, Click, InsertClick, PasswordReset, InsertPasswordReset, PromotionalContact, InsertPromotionalContact } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUserDb): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  updateUserMustChangePassword(userId: number, mustChange: boolean): Promise<void>;

  // Profile methods
  getProfile(userId: number): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<(Profile & { user: User }) | undefined>;
  upsertProfile(userId: number, profile: InsertProfile): Promise<Profile>;

  // Link methods
  getLinks(userId: number): Promise<Link[]>;
  createLink(userId: number, link: InsertLink): Promise<Link>;
  updateLink(id: number, link: Partial<InsertLink>): Promise<Link>;
  deleteLink(id: number): Promise<void>;
  getLinksByUsername(username: string): Promise<Link[]>;
  
  // Click methods
  createClick(click: InsertClick): Promise<Click>;
  incrementLinkClicks(linkId: number): Promise<void>;
  getClickStats(userId: number): Promise<{ totalClicks: number; clicks7d: number; clicks30d: number }>;
  getLinkStats(userId: number): Promise<Array<{ id: number; title: string; clicksAllTime: number; clicks7d: number; clicks30d: number; order: number }>>;
  getClicksTimeSeries(userId: number, options: {
    range: '1d' | '7d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
    timezone?: string;
    groupBy?: 'none' | 'link';
    linkId?: number;
  }): Promise<{
    meta: { range: string; bucket: string; since: Date; until: Date; timezone: string };
    totals: { clicks: number; unique?: number };
    series: Array<{ ts: string; count: number }>;
  }>;

  // Password reset methods
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordResetByToken(token: string): Promise<(PasswordReset & { user: User }) | undefined>;
  markPasswordResetAsUsed(id: number): Promise<void>;
  invalidateUserPasswordResets(userId: number): Promise<void>;

  // Promotional contacts methods
  createOrUpdatePromotionalContact(contact: InsertPromotionalContact): Promise<PromotionalContact>;
  getPromotionalContacts(userId: number): Promise<PromotionalContact[]>;
  getAllPromotionalContacts(): Promise<PromotionalContact[]>;
}

// Ora usiamo Supabase invece di Prisma
export const storage: IStorage = new SupabaseStorage();