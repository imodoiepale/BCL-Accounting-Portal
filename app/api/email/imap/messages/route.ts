import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { decrypt } from '@/lib/encryption';
import * as ImapClient from 'emailjs-imap-client';
import { simpleParser } from 'mailparser';

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
    const body = await request.json();
    const { accountId, limit = 50, offset = 0, labels, isArchived, isStarred, threadId, searchQuery } = body;

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

    const { provider, app_password, imap_host, imap_port } = account;
    const decryptedPassword = app_password ? await decrypt(app_password) : '';

    // Configure IMAP client
    const config = {
      auth: {
        user: account.email,
        pass: decryptedPassword,
      },
      host: imap_host || getDefaultHost(provider),
      port: imap_port || getDefaultPort(provider),
      useSecureTransport: true,
      logLevel: 'ERROR',
      requireTLS: true,
    };

    try {
      // Connect to IMAP server
      const client = new ImapClient.default(config.host, config.port, config);
      await client.connect();

      // Select mailbox based on labels/flags
      const mailbox = isArchived ? '[Gmail]/All Mail' : 'INBOX';
      await client.selectMailbox(mailbox);

      // Build search criteria
      const criteria = [];
      if (searchQuery) {
        criteria.push(['TEXT', searchQuery]);
      }
      if (isStarred) {
        criteria.push(['FLAGGED']);
      }
      if (threadId) {
        criteria.push(['THREAD', threadId]);
      }

      // Search messages
      const messages = await client.search(criteria.length > 0 ? criteria : ['ALL'], {
        limit,
        offset,
      });

      // Fetch message details
      const messageDetails = await Promise.all(
        messages.map(async (msg: any) => {
          const data = await client.listMessages(mailbox, [msg], ['FLAGS', 'ENVELOPE', 'BODY[]']);
          const parsed = await simpleParser(data[0]['body[]']);

          return {
            id: msg,
            account_id: accountId,
            message_id: parsed.messageId,
            subject: parsed.subject || '',
            from: parsed.from?.text || '',
            to: parsed.to?.text.split(',').map((e: string) => e.trim()) || [],
            cc: parsed.cc?.text.split(',').map((e: string) => e.trim()) || [],
            bcc: parsed.bcc?.text.split(',').map((e: string) => e.trim()) || [],
            date: parsed.date?.toISOString() || new Date().toISOString(),
            body_text: parsed.text || '',
            body_html: parsed.html || '',
            labels: data[0].flags || [],
            is_read: data[0].flags.includes('\\Seen'),
            is_archived: mailbox === '[Gmail]/All Mail',
            is_starred: data[0].flags.includes('\\Flagged'),
            thread_id: parsed.references?.[0] || '',
            in_reply_to: parsed.inReplyTo || '',
            references: parsed.references || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        })
      );

      // Close connection
      await client.close();

      // Cache messages in Supabase
      if (messageDetails.length > 0) {
        const { error: upsertError } = await supabase
          .from('bcl_emails_messages')
          .upsert(messageDetails, { onConflict: 'id' });

        if (upsertError) {
          console.error('Cache error:', upsertError);
        }
      }

      return NextResponse.json(messageDetails);
    } catch (error) {
      console.error('IMAP error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages from email server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Message fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultHost(provider: string): string {
  switch (provider) {
    case 'gmail':
      return 'imap.gmail.com';
    case 'outlook':
      return 'outlook.office365.com';
    case 'yahoo':
      return 'imap.mail.yahoo.com';
    default:
      throw new Error('Unknown provider');
  }
}

function getDefaultPort(provider: string): number {
  return 993; // Standard IMAP SSL port
}
