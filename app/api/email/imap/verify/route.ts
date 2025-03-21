import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { decrypt } from '@/lib/encryption';
import { getDefaultImapConfig } from '../config';
import * as ImapClient from 'emailjs-imap-client';

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

// Disable Edge Runtime for IMAP operations
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account details
    const { data: account } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // For Gmail OAuth, we verify in the client
    if (account.provider === 'gmail' && !account.app_password) {
      return NextResponse.json({ success: true });
    }

    // For other providers or Gmail with app password, verify IMAP connection
    const { provider, app_password, imap_host, imap_port } = account;
    const decryptedPassword = app_password ? await decrypt(app_password) : '';

    // Get IMAP config
    const defaultConfig = getDefaultImapConfig(provider);
    const config = {
      auth: {
        user: account.email,
        pass: decryptedPassword,
      },
      host: imap_host || defaultConfig.host,
      port: imap_port || defaultConfig.port,
      useSecureTransport: true,
      logLevel: 'ERROR',
      requireTLS: true,
    };

    try {
      const client = new ImapClient.default(config.host, config.port, config);
      await client.connect();
      await client.close();
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('IMAP connection error:', error);
      return NextResponse.json(
        { error: 'Failed to connect to email server' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
