import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { fetchGmailMessages } from '@/lib/gmailService';

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
    const body = await request.json();
    console.log('Request body:', body);

    const { accountId, limit = 50, offset = 0, labels, isArchived, isStarred, threadId, searchQuery } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching account:', accountId);
    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('Account fetch error:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account' },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log('Account found:', { provider: account.provider, hasAccessToken: !!account.access_token });

    // For Gmail accounts with OAuth, fetch messages from Gmail API
    if (account.provider === 'gmail' && account.access_token) {
      try {
        console.log('Fetching Gmail messages');
        const messages = await fetchGmailMessages(account.access_token, accountId, limit);
        console.log('Gmail messages fetched:', messages.length);

        // Cache messages in Supabase
        if (messages.length > 0) {
          console.log('Caching messages in Supabase');
          const { error: upsertError } = await supabase.from('bcl_emails_messages').upsert(
            messages,
            { onConflict: 'id' }
          );

          if (upsertError) {
            console.error('Cache error:', upsertError);
          }
        }

        return NextResponse.json(messages);
      } catch (error) {
        console.error('Gmail API error:', error);
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            // Token expired, let client handle refresh
            return NextResponse.json(
              { error: 'Token expired' },
              { status: 401 }
            );
          }
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // For IMAP accounts, redirect to IMAP messages endpoint
    const imapResponse = await fetch('/api/email/imap/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(await imapResponse.json());
  } catch (error) {
    console.error('Message fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { messageId } = request.url.split('/').pop()!.split('?')[0];
    const { flag, value } = await request.json();

    if (!messageId || !flag || typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Message ID, flag, and value are required' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('bcl_emails_messages')
      .update({ [`is_${flag}`]: value })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Failed to update message flag:', error);
    return NextResponse.json(
      { error: 'Failed to update message flag' },
      { status: 500 }
    );
  }
}
