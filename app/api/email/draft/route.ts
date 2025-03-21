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

// GET /api/email/draft
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const draftId = searchParams.get('id');

    if (!accountId && !draftId) {
      return NextResponse.json(
        { error: 'Either account ID or draft ID is required' },
        { status: 400 }
      );
    }

    if (draftId) {
      // Get single draft
      const { data: draft, error } = await supabase
        .from('bcl_emails_drafts')
        .select()
        .eq('id', draftId)
        .single();

      if (error) throw error;
      return NextResponse.json({ draft });
    }

    // Get all drafts for account
    const { data: drafts, error } = await supabase
      .from('bcl_emails_drafts')
      .select()
      .eq('account_id', accountId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Failed to fetch drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/email/draft
export async function POST(request: Request) {
  try {
    const { accountId, draft } = await request.json();

    if (!accountId || !draft) {
      return NextResponse.json(
        { error: 'Account ID and draft data are required' },
        { status: 400 }
      );
    }

    const { data: savedDraft, error } = await supabase
      .from('bcl_emails_drafts')
      .insert({
        account_id: accountId,
        subject: draft.subject,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        body_text: draft.body_text,
        body_html: draft.body_html,
        attachments: draft.attachments,
        in_reply_to: draft.in_reply_to,
        references: draft.references,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ draft: savedDraft });
  } catch (error) {
    console.error('Failed to save draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// PATCH /api/email/draft/[id]
export async function PATCH(request: Request) {
  try {
    const draftId = request.url.split('/').pop();
    const draftData = await request.json();

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedDraft, error } = await supabase
      .from('bcl_emails_drafts')
      .update(draftData)
      .eq('id', draftId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    console.error('Failed to update draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// DELETE /api/email/draft/[id]
export async function DELETE(request: Request) {
  try {
    const draftId = request.url.split('/').pop();

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bcl_emails_drafts')
      .delete()
      .eq('id', draftId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
