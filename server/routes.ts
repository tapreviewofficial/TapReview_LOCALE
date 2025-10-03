import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { hashPassword, comparePassword, signToken, requireAuth, getCurrentUser } from "./lib/auth";
import { requireAdmin } from "./middleware/requireAdmin";
import { requirePasswordChanged } from "./middleware/requirePasswordChanged";
import { insertUserSchema, insertProfileSchema, insertLinkSchema } from "@shared/schema";
import adminRouter from "./routes/admin";
import meRouter from "./routes/me";
import promosRouter from "./routes/promos";
import ticketsRouter from "./routes/tickets";
import publicPagesRouter from "./routes/publicPages";
import { nanoid } from 'nanoid';
import { sendEmail, generatePasswordResetEmail } from './services/emailService';

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors({
    origin: process.env.NODE_ENV === "development" ? true : process.env.FRONTEND_URL,
    credentials: true,
  }));
  app.use(cookieParser());

  // Auth routes
  // Registration disabled - users must contact admin for account creation
  app.post("/api/auth/register", async (req, res) => {
    res.status(403).json({ 
      message: "La registrazione pubblica è stata disabilitata. Per attivare un account, contatta tapreviewofficial@gmail.com",
      contactEmail: "tapreviewofficial@gmail.com",
      code: "REGISTRATION_DISABLED"
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ user: { id: user.id, email: user.email, username: user.username, mustChangePassword: user.mustChangePassword } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Get user from database
      const dbUser = await storage.getUserById(user.userId);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, dbUser.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.userId, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Password reset routes
  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email richiesta' });
      }

      // Trova l'utente
      const user = await storage.getUserByEmail(email.toLowerCase());

      // Anche se l'utente non esiste, restituiamo successo per sicurezza
      if (!user) {
        return res.json({ success: true, message: 'Se l\'email esiste, riceverai le istruzioni per il reset' });
      }

      // Invalida token precedenti non utilizzati
      await storage.invalidateUserPasswordResets(user.id);

      // Crea nuovo token di reset
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

      await storage.createPasswordReset({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });

      // Genera link di reset
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      // Genera email
      const emailContent = generatePasswordResetEmail(resetLink, user.username);
      
      // Invia email
      const emailSent = await sendEmail({
        to: user.email,
        subject: 'TapReview - Reimpostazione Password',
        html: emailContent.html,
        text: emailContent.text
      });

      if (!emailSent) {
        console.error('Errore nell\'invio della email di reset');
      }

      res.json({ 
        success: true, 
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset' 
      });

    } catch (error) {
      console.error('Errore richiesta reset password:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  app.get("/api/auth/verify-reset/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const passwordReset = await storage.getPasswordResetByToken(token);

      if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }

      res.json({ 
        valid: true, 
        username: passwordReset.user.username 
      });

    } catch (error) {
      console.error('Errore verifica token reset:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nuova password richiesti' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La password deve essere almeno di 6 caratteri' });
      }

      const passwordReset = await storage.getPasswordResetByToken(token);

      if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }

      // Hash nuova password
      const hashedPassword = await hashPassword(newPassword);

      // Aggiorna password utente
      await storage.updateUserPassword(passwordReset.userId, hashedPassword);

      // Marca token come utilizzato
      await storage.markPasswordResetAsUsed(passwordReset.id);

      res.json({ success: true, message: 'Password reimpostata con successo' });

    } catch (error) {
      console.error('Errore reset password:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // Protected routes
  app.get("/api/links", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const user = (req as any).user;
      const links = await storage.getLinks(user.userId);
      res.json(links);
    } catch (error) {
      console.error("Get links error:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  app.post("/api/links", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const user = (req as any).user;
      const linkData = insertLinkSchema.parse(req.body);
      const link = await storage.createLink(user.userId, linkData);
      res.json(link);
    } catch (error) {
      console.error("Create link error:", error);
      res.status(400).json({ message: "Failed to create link" });
    }
  });

  app.patch("/api/links/:id", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const linkData = insertLinkSchema.partial().parse(req.body);
      const link = await storage.updateLink(id, linkData);
      res.json(link);
    } catch (error) {
      console.error("Update link error:", error);
      res.status(400).json({ message: "Failed to update link" });
    }
  });

  app.delete("/api/links/:id", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLink(id);
      res.json({ message: "Link deleted" });
    } catch (error) {
      console.error("Delete link error:", error);
      res.status(400).json({ message: "Failed to delete link" });
    }
  });

  app.get("/api/profile", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const user = (req as any).user;
      const profile = await storage.getProfile(user.userId);
      res.json(profile || {});
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const user = (req as any).user;
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.upsertProfile(user.userId, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Public routes
  app.get("/api/public/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // First check if user exists
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get profile (might not exist yet)
      const profile = await storage.getProfile(user.id);
      const links = await storage.getLinksByUsername(username);
      
      res.json({
        profile: {
          displayName: profile?.displayName || user.username,
          bio: profile?.bio || "",
          avatarUrl: profile?.avatarUrl || null,
          accentColor: profile?.accentColor || "#CC9900",
        },
        user: {
          username: user.username,
        },
        links,
      });
    } catch (error) {
      console.error("Get public profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Auth check route
  app.get("/api/auth/me", async (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get full user data including role
    const fullUser = await storage.getUserById(user.userId);
    if (!fullUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({ 
      user: { 
        id: fullUser.id,
        email: fullUser.email, 
        username: fullUser.username,
        role: fullUser.role,
        mustChangePassword: fullUser.mustChangePassword
      }
    });
  });

  // Redirect with tracking
  app.get("/r/:username/:linkId", async (req, res) => {
    try {
      const { username, linkId } = req.params;
      const linkIdNum = parseInt(linkId);

      // Get user and link
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const links = await storage.getLinks(user.id);
      const link = links.find(l => l.id === linkIdNum);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Create click record
      const userAgent = req.headers["user-agent"] || null;
      const referer = req.headers.referer || null;
      const ipHash = req.ip ? crypto.createHash("sha256").update(req.ip + (process.env.JWT_SECRET || "")).digest("hex") : null;

      await storage.createClick({
        linkId: linkIdNum,
        userAgent,
        referer,
        ipHash,
      });

      // Increment click counter
      await storage.incrementLinkClicks(linkIdNum);

      // Redirect to actual URL
      res.redirect(302, link.url);
    } catch (error) {
      console.error("Redirect error:", error);
      res.status(500).json({ message: "Redirect failed" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/summary", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const stats = await storage.getClickStats(user.userId);
      res.json(stats);
    } catch (error) {
      console.error("Analytics summary error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/links", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const linkStats = await storage.getLinkStats(user.userId);
      res.json(linkStats);
    } catch (error) {
      console.error("Analytics links error:", error);
      res.status(500).json({ message: "Failed to fetch link analytics" });
    }
  });

  app.get("/api/analytics/clicks", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { range = '7d', timezone = 'Europe/Rome', groupBy = 'none', linkId } = req.query;
      
      // Validate range parameter
      const validRanges = ['1d', '7d', '1w', '1m', '3m', '6m', '1y', 'all'];
      if (!validRanges.includes(range as string)) {
        return res.status(400).json({ message: "Invalid range parameter" });
      }

      const data = await storage.getClicksTimeSeries(user.userId, {
        range: range as '1d' | '7d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all',
        timezone: timezone as string,
        groupBy: groupBy as 'none' | 'link',
        linkId: linkId ? parseInt(linkId as string) : undefined
      });
      
      res.json(data);
    } catch (error) {
      console.error("Analytics clicks time series error:", error);
      res.status(500).json({ message: "Failed to fetch clicks analytics" });
    }
  });

  // Stop impersonate route (must be outside admin router to avoid requireAdmin)
  app.post("/api/admin/stop-impersonate", async (req, res) => {
    console.log("Stop impersonate request, cookies:", req.cookies);
    const impersonator = req.cookies?.impersonator;
    if (!impersonator) {
      console.log("No impersonator cookie found");
      return res.status(400).json({ message: "Nessuna impersonificazione attiva" });
    }

    try {
      console.log("Verifying impersonator token:", impersonator);
      const payload: any = jwt.verify(impersonator, process.env.JWT_SECRET as string);
      console.log("Token payload:", payload);
      const adminId = payload?.id;
      if (!adminId) {
        console.log("No admin ID in token");
        throw new Error("Token impersonator invalido");
      }

      // Verifica che l'admin esista ancora e sia ancora admin
      const admin = await storage.getUserById(adminId);
      console.log("Admin found:", admin ? { id: admin.id, role: admin.role } : "not found");
      if (!admin || admin.role !== "ADMIN") {
        console.log("Admin not valid or not admin role");
        return res.status(403).json({ message: "Admin non valido" });
      }

      const token = signToken({ 
        userId: adminId, 
        email: admin.email, 
        username: admin.username 
      });
      res
        .cookie("token", token, { httpOnly: true, sameSite: "lax", path: "/" })
        .clearCookie("impersonator", { path: "/" })
        .json({ ok: true });
      console.log("Successfully stopped impersonation");
    } catch (error) {
      console.log("Stop impersonate error:", error);
      return res.status(400).json({ message: "Token impersonator non valido" });
    }
  });

  // QR Code resolver route (deve essere prima delle altre routes)
  app.get("/q/:code", async (req, res) => {
    const { code } = req.params;
    // Reindirizza alla pagina del ticket nel client
    res.redirect(`/ticket/${code}`);
  });

  // Routes
  app.use("/api/me", meRouter);

  app.use("/api/admin", requireAuth, requireAdmin, adminRouter);

  // Test email endpoint (rimuovere in produzione)
  app.post("/api/test/email", requireAuth, async (req, res) => {
    try {
      const { EmailService } = await import("./lib/email-service.js");
      const { to } = req.body;
      
      if (!to) {
        return res.status(400).json({ message: "Email destinatario richiesta" });
      }

      const success = await EmailService.sendEmail({
        to,
        subject: "Test TapReview - Email Funzionante! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #CC9900, #FFD700); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #000; font-size: 24px; font-weight: bold;">TR</span>
              </div>
              <h1 style="color: #CC9900; margin: 0; font-size: 28px;">TapReview</h1>
            </div>
            
            <div style="background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #CC9900;">
              <h2 style="color: #CC9900; margin-top: 0;">✅ Test Email Riuscito!</h2>
              <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
                Congratulazioni! Il sistema email di TapReview funziona correttamente.
              </p>
              <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
                Ora puoi ricevere:
              </p>
              <ul style="color: #cccccc; line-height: 1.6;">
                <li>Email di benvenuto per nuovi utenti</li>
                <li>Email di ripristino password</li>
                <li>QR Code per promozioni</li>
              </ul>
              <p style="color: #888888; font-size: 14px; margin-top: 25px;">
                Timestamp: ${new Date().toLocaleString('it-IT')}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666666; font-size: 14px;">
              <p>TapReview - Sistema Email Attivo</p>
            </div>
          </div>
        `,
        text: `TapReview - Test Email Riuscito!
        
Il sistema email funziona correttamente.
Timestamp: ${new Date().toLocaleString('it-IT')}

TapReview - Sistema Email Attivo`
      });

      if (success) {
        res.json({ 
          message: "Email di test inviata con successo!",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Errore nell'invio dell'email di test" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Errore nel sistema di test email" });
    }
  });

  // Endpoint per contatti promozionali (database clienti)
  app.get("/api/promotional-contacts", requireAuth, requirePasswordChanged, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const contacts = await storage.getPromotionalContacts(userId);
      
      res.json({
        success: true,
        data: contacts,
        total: contacts.length
      });
    } catch (error) {
      console.error("Errore recupero contatti promozionali:", error);
      res.status(500).json({ 
        success: false, 
        error: "Errore interno del server" 
      });
    }
  });

  // Routes con endpoint pubblici - NO requirePasswordChanged globale
  app.use("/api", promosRouter);
  app.use("/api", ticketsRouter);
  app.use("/api", publicPagesRouter);
  
  // QR route breve
  const qRouter = (await import("./routes/q.js")).default;
  app.use("/q", qRouter);

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      };

      // Test connessione database semplice
      try {
        await storage.getUserById(0); // Query sicura che non dovrebbe mai restituire dati
        health.database = 'connected';
      } catch (error) {
        health.database = 'error';
      }

      const statusCode = health.database === 'connected' ? 200 : 503;
      res.status(statusCode).json(health);
      
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error'
      });
    }
  });

  // Terminal 404 handler for all /api/* routes to prevent Vite catch-all from serving HTML
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
