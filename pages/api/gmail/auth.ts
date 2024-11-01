// pages/api/gmail/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { oauth2Client, GMAIL_SCOPES } from '@/lib/googleAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, code, state } = req.body;

    // If we have a code, exchange it for tokens
    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        return res.status(200).json({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          email: email
        });
      } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(400).json({ message: 'Failed to exchange authorization code' });
      }
    }

    // Generate authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      state: state || undefined,
      prompt: 'consent',
      include_granted_scopes: true,
      login_hint: email
    });

    return res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}