import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/shared/storage';
import { getCurrentUser, comparePassword, hashPassword } from '../../lib/shared/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req.headers.cookie);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const dbUser = await storage.getUserById(user.userId);
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await comparePassword(currentPassword, dbUser.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.userId, hashedNewPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}
