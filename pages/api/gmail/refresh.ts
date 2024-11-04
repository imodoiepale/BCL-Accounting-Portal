// pages/api/gmail/refresh.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { oauth2Client } from '@/lib/googleAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return res.status(200).json({
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ message: 'Failed to refresh token' });
  }
}