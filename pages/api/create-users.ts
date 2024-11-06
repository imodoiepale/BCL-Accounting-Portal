import { clerkClient } from '@clerk/clerk-sdk-node';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const { name, username } = req.body;

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

    // Update user metadata in Clerk
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        companyName: name,
      }
    });

    console.log('Attempting to insert user into acc_portal_clerk_users_duplicate...');
    // Insert user into database
    const { error: userError } = await supabase
    .from('acc_portal_clerk_users_duplicate')
    .upsert({
      username: username,
      userid: user.id,
      metadata: { companyName: name },
      company_name: name,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'userid'
    });

    if (userError) {
      console.error('Error inserting user:', userError);
      throw userError;
    }
    console.log('Successfully inserted user into acc_portal_clerk_users_duplicate');

    console.log('Attempting to insert company into acc_portal_company_duplicate...');
    // Insert company into database
    const { error: companyError } = await supabase
  .from('acc_portal_company_duplicate')
  .upsert({
    company_name: name,
    userid: user.id,  // Add this line to link the tables
    status: 'active'
  }, {
    onConflict: 'userid'
  });
    if (companyError) {
      console.error('Error inserting company:', companyError);
      throw companyError;
    }
    console.log('Successfully inserted company into acc_portal_company_duplicate');

    return res.status(200).json({
      success: true,
      id: user.id,
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