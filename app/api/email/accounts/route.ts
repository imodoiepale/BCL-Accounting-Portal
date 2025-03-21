import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { encrypt } from '@/lib/encryption';

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
    const { email, provider, appPassword, accessToken, refreshToken, tokenExpiry, imapHost, imapPort } = await request.json();
    console.log('Creating account:', { email, provider });

    if (!email || !provider) {
      return NextResponse.json(
        { error: 'Email and provider are required' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('email', email)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 409 }
      );
    }

    // Encrypt app password if provided
    let encryptedPassword = null;
    if (appPassword) {
      try {
        encryptedPassword = await encrypt(appPassword);
      } catch (error) {
        console.error('Password encryption error:', error);
        return NextResponse.json(
          { error: 'Failed to encrypt password' },
          { status: 500 }
        );
      }
    }

    // Create new account
    console.log('Inserting account into database');
    const { data: account, error } = await supabase
      .from('bcl_emails_accounts')
      .insert([
        {
          email,
          provider,
          app_password: encryptedPassword,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
          imap_host: imapHost,
          imap_port: imapPort,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Account creation error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log('Account created successfully:', account.id);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    console.log('Fetching account(s):', { accountId });

    let query = supabase.from('bcl_emails_accounts').select();

    if (accountId) {
      query = query.eq('id', accountId);
    }

    const { data: accounts, error } = await query;

    if (error) {
      console.error('Account fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    if (!accounts) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    console.log('Account(s) fetched successfully:', accounts.length);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    console.log('Updating account:', { id });

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Encrypt app password if provided
    if (updates.appPassword) {
      try {
        updates.app_password = await encrypt(updates.appPassword);
        delete updates.appPassword;
      } catch (error) {
        console.error('Password encryption error:', error);
        return NextResponse.json(
          { error: 'Failed to encrypt password' },
          { status: 500 }
        );
      }
    }

    const { data: account, error } = await supabase
      .from('bcl_emails_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Account update error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update account' },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    console.log('Account updated successfully:', account.id);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    console.log('Deleting account:', { accountId });

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bcl_emails_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('Account deletion error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete account' },
        { status: 500 }
      );
    }

    console.log('Account deleted successfully:', accountId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
