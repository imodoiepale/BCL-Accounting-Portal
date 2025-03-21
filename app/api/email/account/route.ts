import { encrypt } from '@/lib/encryption';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Initialize Supabase with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { email, provider, appPassword } = await request.json();

    if (!email || !provider) {
      return NextResponse.json(
        { error: 'Email and provider are required' },
        { status: 400 }
      );
    }

    // For Gmail, we'll use OAuth
    if (provider === 'gmail') {
      const { data, error } = await supabase
        .from('bcl_emails_accounts')
        .insert({
          email,
          provider,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ account: data });
    }

    // For other providers, require app password
    if (!appPassword) {
      return NextResponse.json(
        { error: 'App password is required for non-Gmail accounts' },
        { status: 400 }
      );
    }

    // Encrypt app password before storing
    const encryptedPassword = encrypt(appPassword);

    const { data, error } = await supabase
      .from('bcl_emails_accounts')
      .insert({
        email,
        provider,
        app_password: encryptedPassword,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ account: data });
  } catch (error) {
    console.error('Failed to add email account:', error);
    return NextResponse.json(
      { error: 'Failed to add email account' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (accountId) {
      // Get single account
      const { data, error } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (error) throw error;
      return NextResponse.json({ account: data });
    }

    // Get all accounts
    const { data, error } = await supabase
      .from('bcl_emails_accounts')
      .select();

    if (error) throw error;
    return NextResponse.json({ accounts: data });
  } catch (error) {
    console.error('Failed to fetch email accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}
