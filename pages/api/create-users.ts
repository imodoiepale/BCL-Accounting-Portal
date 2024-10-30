// pages/api/create-users.ts
import { clerkClient } from '@clerk/clerk-sdk-node';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { name, username, password } = req.body;

  try {
    // Get the user from Clerk using the username
    const users = await clerkClient.users.getUserList({
      username: [username],
    });

    const user = users.data[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user metadata
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        companyName: name,
      }
    });

    return res.status(200).json({
      success : true,
      id      : user.id,
      username: user.username
    });

  } catch (error: any) {
    console.error('API Error:', error);
    
    return res.status(422).json({
      success: false,
      message: error.message || 'Failed to process user account'
    });
  }
}