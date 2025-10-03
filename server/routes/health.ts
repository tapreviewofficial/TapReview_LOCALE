// Health check endpoint per verificare stato dell'app
import type { Request, Response } from 'express';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
let sql: ReturnType<typeof postgres> | null = null;

if (databaseUrl) {
  sql = postgres(databaseUrl, { max: 1 });
}

export async function healthCheck(req: Request, res: Response) {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    };

    // Test connessione database
    if (sql) {
      try {
        await sql`SELECT 1 as test`;
        health.database = 'connected';
      } catch (error) {
        health.database = 'error';
      }
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
}