import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { decrypt } from '@/lib/encryption';

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
    const { accountId, limit = 50, offset = 0, labels, isArchived, isStarred, threadId, searchQuery } = await request.json();

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

    // Build query
    let query = supabase
      .from('bcl_emails_messages')
      .select()
      .eq('account_id', accountId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (labels?.length) {
      query = query.contains('labels', labels);
    }

    if (typeof isArchived === 'boolean') {
      query = query.eq('is_archived', isArchived);
    }

    if (typeof isStarred === 'boolean') {
      query = query.eq('is_starred', isStarred);
    }

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    if (searchQuery) {
      query = query.textSearch('subject', searchQuery, {
        config: 'english',
      });
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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
