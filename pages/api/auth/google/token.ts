// pages/api/auth/google/token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body); // Debug log

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000',
        access_type: 'offline',
        prompt: 'consent'
      }).toString(),
    });

    const data = await tokenResponse.json();
    console.log('Google token response:', data); // Debug log

    if (data.error) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Failed to exchange token', 
      details: error.message 
    });
  }
}