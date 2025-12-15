import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import { generateToken, setTokenCookie } from '@/services/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Use PostgreSQL database service
    const user = await databaseService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

      // Verify password
      const isValid = await databaseService.verifyPassword(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Generate token and set cookie
    const token = generateToken(user);
    setTokenCookie(res, token);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
