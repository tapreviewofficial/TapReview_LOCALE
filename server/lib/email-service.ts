import sgMail from '@sendgrid/mail';
import QRCode from 'qrcode';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

// Configura SendGrid con API key e residenza EU
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configura residenza dati EU per GDPR compliance
try {
  (sgMail as any).setDataResidency('eu');
  console.log("✅ SendGrid configured with EU data residency");
} catch (error) {
  console.warn("⚠️ Could not set EU data residency, check SendGrid configuration");
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
    content_id?: string;
  }>;
}

const FROM_EMAIL = 'tapreviewofficial@gmail.com'; // Sender verificato in SendGrid

export class EmailService {
  
  /**
   * Invia email generica
   */
  static async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // Struttura IDENTICA al test che funziona
      const msg: any = {
        to: params.to,
        from: FROM_EMAIL,
        subject: params.subject,
        text: params.text || 'TapReview notification',
        html: params.html || `<p>TapReview notification</p>`
      };
      
      // Aggiungi attachment solo se presente
      if (params.attachments && params.attachments.length > 0) {
        msg.attachments = params.attachments;
      }

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Invia email di reset password
   */
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const subject = 'TapReview - Ripristino Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #CC9900, #FFD700); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #000; font-size: 24px; font-weight: bold;">TR</span>
          </div>
          <h1 style="color: #CC9900; margin: 0; font-size: 28px;">TapReview</h1>
        </div>
        
        <div style="background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #CC9900;">
          <h2 style="color: #CC9900; margin-top: 0;">Ripristino Password</h2>
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 25px;">
            Hai richiesto il ripristino della password per il tuo account TapReview.
            Clicca sul pulsante qui sotto per impostare una nuova password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #CC9900; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Ripristina Password
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin-bottom: 0;">
            Questo link scadrà tra 1 ora per motivi di sicurezza.<br>
            Se non hai richiesto il ripristino, ignora questa email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666666; font-size: 14px;">
          <p>TapReview - Gestione Recensioni NFC</p>
          <p>Email automatica, non rispondere.</p>
        </div>
      </div>
    `;

    const text = `
      TapReview - Ripristino Password
      
      Hai richiesto il ripristino della password per il tuo account TapReview.
      
      Vai a questo link per impostare una nuova password:
      ${resetUrl}
      
      Questo link scadrà tra 1 ora per motivi di sicurezza.
      Se non hai richiesto il ripristino, ignora questa email.
      
      TapReview - Gestione Recensioni NFC
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Invia QR code per promozione
   */
  static async sendPromotionQRCode(email: string, username: string, qrCodeUrl: string, promotionDetails: {
    title: string;
    description: string;
    validUntil?: Date;
  }): Promise<boolean> {
    
    const subject = `${promotionDetails.title} - Il tuo QR Code TapReview`;
    const validUntilText = promotionDetails.validUntil 
      ? `Valido fino al ${promotionDetails.validUntil.toLocaleDateString('it-IT')}`
      : 'Sempre valido';

    // Genera QR code come JPEG per email
    let qrBase64: string;
    try {
      const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        type: 'image/jpeg',
        width: 300,
        margin: 2,
        rendererOpts: { quality: 0.95 }
      });
      qrBase64 = qrDataUrl.split(',')[1]; // Rimuove "data:image/jpeg;base64,"
    } catch (error) {
      console.error('Error generating QR code:', error);
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>TapReview - ${promotionDetails.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
          
          <div style="background-color: #0a0a0a; color: #ffffff; padding: 30px; text-align: center;">
            <h1 style="color: #CC9900; margin: 0 0 10px 0; font-size: 24px;">TapReview</h1>
            <p style="margin: 0; color: #cccccc;">Il tuo QR Code per la promozione è pronto!</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333333; margin-top: 0;">Ciao ${username},</h2>
            
            <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
              La tua richiesta per partecipare alla promozione "<strong>${promotionDetails.title}</strong>" è stata confermata con successo.
            </p>
            
            <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
              ${promotionDetails.description}
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-radius: 8px;">
              <p style="color: #333333; margin-bottom: 15px; font-weight: bold;">Il tuo QR Code:</p>
              
              <div style="margin: 20px 0;">
                <img src="cid:qrcode" alt="QR Code TapReview" style="width: 200px; height: 200px; border: 2px solid #CC9900; border-radius: 8px; display: block; margin: 0 auto;" />
              </div>
              
              <p style="color: #666666; margin: 15px 0; font-size: 14px;">
                Mostra questo codice al momento dell'ordine<br>
                Link diretto: <a href="${qrCodeUrl}" style="color: #CC9900; word-break: break-all;">${qrCodeUrl}</a>
              </p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #CC9900; margin: 20px 0;">
              <p style="color: #333333; margin: 0; font-size: 14px;">
                <strong>Come usare il QR Code:</strong><br>
                Mostra questo codice al momento del pagamento o dell'ordine per usufruire della promozione.
              </p>
            </div>
            
            <p style="color: #333333; line-height: 1.6;">
              <strong>Validità:</strong> ${validUntilText}<br>
              <strong>Dettagli promozione:</strong> ${promotionDetails.description}
            </p>
            
            <p style="color: #333333; line-height: 1.6; margin-top: 30px;">
              Grazie per aver scelto TapReview. Se hai domande o problemi con il tuo QR Code, 
              non esitare a contattarci rispondendo a questa email.
            </p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
              Questa email è stata inviata da TapReview<br>
              Via Roma 123, 00100 Roma RM, Italia
            </p>
            <p style="color: #666666; font-size: 12px; margin: 0;">
              Email transazionale per richiesta promozione
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const text = `
      TapReview - ${promotionDetails.title}
      
      Ciao ${username}!
      
      ${promotionDetails.description}
      
      Il tuo QR Code per la promozione è disponibile al link:
      ${qrCodeUrl}
      
      Validità: ${validUntilText}
      
      Mostra il QR Code al momento del pagamento o dell'ordine per usufruire della promozione.
      
      Grazie per essere parte della nostra community!
      TapReview - Gestione Recensioni NFC
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      attachments: [{
        content: qrBase64,
        filename: 'tapreview-qr.jpg',
        type: 'image/jpeg',
        disposition: 'inline',
        content_id: 'qrcode'
      }]
    });
  }

  /**
   * Invia email di benvenuto per nuovo utente creato da admin
   */
  static async sendWelcomeEmail(email: string, username: string, tempPassword: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/login`;
    
    const subject = 'Benvenuto in TapReview - Account Attivato';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #CC9900, #FFD700); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #000; font-size: 24px; font-weight: bold;">TR</span>
          </div>
          <h1 style="color: #CC9900; margin: 0; font-size: 28px;">TapReview</h1>
        </div>
        
        <div style="background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #CC9900;">
          <h2 style="color: #CC9900; margin-top: 0;">🎉 Benvenuto in TapReview!</h2>
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            Ciao <strong style="color: #CC9900;">${username}</strong>!
          </p>
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 25px;">
            Il tuo account TapReview è stato attivato con successo. Ecco le tue credenziali di accesso:
          </p>
          
          <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #CC9900;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0 0 0; color: #CC9900;"><strong>Password temporanea:</strong> <code style="background: #000; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <div style="background: #CC9900; color: #000000; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <strong>⚠️ Dovrai cambiare la password al primo accesso per motivi di sicurezza</strong>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #CC9900; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Accedi al tuo Account
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin-bottom: 0;">
            Conserva questa email fino al primo accesso.<br>
            Per supporto, contatta: tapreviewofficial@gmail.com
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666666; font-size: 14px;">
          <p>TapReview - Gestione Recensioni NFC</p>
          <p>Email automatica, non rispondere.</p>
        </div>
      </div>
    `;

    const text = `
      TapReview - Benvenuto!
      
      Ciao ${username}!
      
      Il tuo account TapReview è stato attivato con successo.
      
      Credenziali di accesso:
      Email: ${email}
      Password temporanea: ${tempPassword}
      
      IMPORTANTE: Dovrai cambiare la password al primo accesso per motivi di sicurezza.
      
      Accedi al tuo account: ${loginUrl}
      
      Conserva questa email fino al primo accesso.
      Per supporto, contatta: tapreviewofficial@gmail.com
      
      TapReview - Gestione Recensioni NFC
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
}