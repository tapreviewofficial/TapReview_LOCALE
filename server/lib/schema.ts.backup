// Schema Drizzle per Supabase PostgreSQL
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  decimal,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role_enum', ['USER', 'ADMIN']);
export const ticketStatusEnum = pgEnum('ticket_status_enum', ['ACTIVE', 'USED', 'EXPIRED']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  role: roleEnum('role').default('USER')
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  accentColor: varchar('accent_color', { length: 7 }).default('#CC9900')
});

// Links table  
export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  order: integer('order').default(0),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  clicks: integer('clicks').default(0)
});

// Clicks table
export const clicks = pgTable('clicks', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').references(() => links.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  userAgent: text('user_agent'),
  referer: text('referer'),
  ipHash: varchar('ip_hash', { length: 255 })
});

// Public Pages table
export const publicPages = pgTable('public_pages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 255 }),
  theme: text('theme'), // JSON string per colori, layout, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Promos table
export const promos = pgTable('promos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  publicPageId: integer('public_page_id').references(() => publicPages.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'coupon' | 'invito' | 'omaggio'
  valueKind: varchar('value_kind', { length: 20 }), // 'percent' | 'amount'
  value: decimal('value', { precision: 10, scale: 2 }),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  maxCodes: integer('max_codes').default(100),
  usesPerCode: integer('uses_per_code').default(1),
  codeFormat: varchar('code_format', { length: 20 }).default('short'), // 'short' | 'uuid'
  qrMode: varchar('qr_mode', { length: 20 }).default('url'), // 'url' | 'jwt'
  active: boolean('active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tickets table
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  promoId: integer('promo_id').references(() => promos.id, { onDelete: 'cascade' }).notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  customerSurname: varchar('customer_surname', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  qrUrl: text('qr_url').notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at')
});

// Scan Logs table
export const scanLogs = pgTable('scan_logs', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id),
  result: varchar('result', { length: 20 }).notNull(), // 'valid'|'expired'|'used'
  at: timestamp('at').defaultNow(),
  meta: text('meta') // userAgent, ip hash, device info
});

// Password Resets table
export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId]
  }),
  links: many(links),
  publicPages: many(publicPages),
  promos: many(promos),
  passwordResets: many(passwordResets)
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id]
  })
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id]
  }),
  clicks: many(clicks)
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, {
    fields: [clicks.linkId],
    references: [links.id]
  })
}));

export const publicPagesRelations = relations(publicPages, ({ one, many }) => ({
  user: one(users, {
    fields: [publicPages.userId],
    references: [users.id]
  }),
  promos: many(promos)
}));

export const promosRelations = relations(promos, ({ one, many }) => ({
  user: one(users, {
    fields: [promos.userId],
    references: [users.id]
  }),
  publicPage: one(publicPages, {
    fields: [promos.publicPageId],
    references: [publicPages.id]
  }),
  tickets: many(tickets)
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  promo: one(promos, {
    fields: [tickets.promoId],
    references: [promos.id]
  }),
  scanLogs: many(scanLogs)
}));

export const scanLogsRelations = relations(scanLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [scanLogs.ticketId],
    references: [tickets.id]
  }),
  user: one(users, {
    fields: [scanLogs.userId],
    references: [users.id]
  })
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id]
  })
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Promo = typeof promos.$inferSelect;
export type NewPromo = typeof promos.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;