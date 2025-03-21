import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
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

export async function PATCH(request: Request) {
  try {
    const { accountId, messageId, flag, value } = await request.json();

    if (!accountId || !messageId || !flag) {
      return NextResponse.json(
        { error: 'Account ID, message ID, and flag are required' },
        { status: 400 }
      );
    }

    // Update message flags in database
    let updateData = {};
    switch (flag) {
      case 'read':
        updateData = { is_read: value };
        break;
      case 'archived':
        updateData = { is_archived: value };
        break;
      case 'starred':
        updateData = { is_starred: value };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid flag type' },
          { status: 400 }
        );
    }

    const { error } = await supabase
      .from('bcl_emails_messages')
      .update(updateData)
      .eq('id', messageId)
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update message flags:', error);
    return NextResponse.json(
      { error: 'Failed to update message flags' },
      { status: 500 }
    );
  }
}
