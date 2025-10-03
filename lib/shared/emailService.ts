import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured, skipping email send');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: 'tapreviewofficial@gmail.com',
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return true;
  } catch (error) {
    console.error('Errore invio email:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetLink: string, username: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reimposta Password - TapReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0a0a0a; color: #CC9900; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #CC9900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TapReview</h1>
        </div>
        <div class="content">
          <h2>Reimpostazione Password</h2>
          <p>Ciao <strong>${username}</strong>,</p>
          <p>Hai richiesto la reimpostazione della password per il tuo account TapReview.</p>
          <p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Reimposta Password</a>
          </p>
          <p><strong>Importante:</strong> Questo link è valido per 1 ora. Se non hai richiesto tu questa reimpostazione, ignora questa email.</p>
          <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">${resetLink}</p>
        </div>
        <div class="footer">
          <p>© 2024 TapReview. Tutti i diritti riservati.</p>
          <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
TapReview - Reimpostazione Password

Ciao ${username},

Hai richiesto la reimpostazione della password per il tuo account TapReview.

Clicca su questo link per creare una nuova password:
${resetLink}

Questo link è valido per 1 ora. Se non hai richiesto tu questa reimpostazione, ignora questa email.

© 2024 TapReview
  `;

  return { html, text };
}
