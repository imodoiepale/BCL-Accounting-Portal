import { clerkClient } from '@clerk/clerk-sdk-node';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getExistingCompanies = async () => {
  const { data } = await supabase
    .from('acc_portal_company_duplicate2')
    .select('*')
    .is('userid', null);
  return data;
};

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

  const { name } = req.body;
  
  // Generate username and password based on company name
  const firstName = name.split(' ')[0].toLowerCase();
  const username = `${firstName}bcl`;
  const password = `${firstName}bcl1*`;

  try {
    // Create the user in Clerk with generated credentials
    const user = await clerkClient.users.createUser({
      username: username,
      password: password,
    });

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

    console.log('Attempting to insert company into acc_portal_company_duplicate2...');
    if (req.body.existingCompany) {
      const { error: updateError } = await supabase
        .from('acc_portal_company_duplicate2')
        .update({
          userid: user.id,
          client_types: req.body.clientTypes,
          status: 'active'
        })
        .eq('id', req.body.existingCompany.id);

      if (updateError) throw updateError;
    } else {
      // Insert company into database
      const { error: companyError } = await supabase
        .from('acc_portal_company_duplicate2')
        .upsert({
          company_name: name,
          userid: user.id,
          status: 'active'
        }, {
          onConflict: 'userid'
        });
      if (companyError) {
        console.error('Error inserting company:', companyError);
        throw companyError;
      }
      console.log('Successfully inserted company into acc_portal_company_duplicate2');
    }

    return res.status(200).json({
      success: true,
      id: user.id,
      username: username,
      password: password
    });

  } catch (error: any) {
    console.error('API Error:', error);
    
    return res.status(422).json({
      success: false,
      message: error.message || 'Failed to process user account'
    });
  }
}