import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.status(403).json({ 
    message: "La registrazione pubblica è stata disabilitata. Per attivare un account, contatta tapreviewofficial@gmail.com",
    contactEmail: "tapreviewofficial@gmail.com",
    code: "REGISTRATION_DISABLED"
  });
}
