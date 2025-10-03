// Script per esportare tutti i dati da Prisma/SQLite
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  console.log('🔄 Esportazione dati da SQLite...');
  
  try {
    // Esporta tutti i dati
    const users = await prisma.user.findMany();
    const profiles = await prisma.profile.findMany();
    const links = await prisma.link.findMany();
    const clicks = await prisma.click.findMany();
    const publicPages = await prisma.publicPage.findMany();
    const promos = await prisma.promo.findMany();
    const tickets = await prisma.ticket.findMany();
    const scanLogs = await prisma.scanLog.findMany();
    const passwordResets = await prisma.passwordReset.findMany();

    const exportData = {
      users,
      profiles,
      links,
      clicks,
      publicPages,
      promos,
      tickets,
      scanLogs,
      passwordResets,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: users.length + profiles.length + links.length + clicks.length + 
                     publicPages.length + promos.length + tickets.length + 
                     scanLogs.length + passwordResets.length
      }
    };

    // Salva in file JSON
    fs.writeFileSync('exported_data.json', JSON.stringify(exportData, null, 2));
    
    console.log('✅ Dati esportati con successo!');
    console.log(`📊 Totale record: ${exportData.metadata.totalRecords}`);
    console.log(`👥 Utenti: ${users.length}`);
    console.log(`📋 Profili: ${profiles.length}`);
    console.log(`🔗 Link: ${links.length}`);
    console.log(`📊 Click: ${clicks.length}`);
    console.log(`📄 Pagine pubbliche: ${publicPages.length}`);
    console.log(`🎁 Promozioni: ${promos.length}`);
    console.log(`🎫 Ticket: ${tickets.length}`);
    console.log(`📝 Scan logs: ${scanLogs.length}`);
    console.log(`🔒 Password resets: ${passwordResets.length}`);
    
  } catch (error) {
    console.error('❌ Errore durante esportazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();