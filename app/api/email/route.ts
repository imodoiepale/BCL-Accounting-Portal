import { NextResponse } from 'next/server';
import { EmailClient } from '@/lib/emailClient';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { action, ...params } = await request.json();
    const emailClient = EmailClient.getInstance();

    switch (action) {
      case 'addAccount':
        const { email, appPassword, provider, customConfig } = params;
        const account = await emailClient.addAccount(email, appPassword, provider, customConfig);
        return NextResponse.json({ success: true, data: account });

      case 'fetchMessages':
        const { accountId, options } = params;
        const messages = await emailClient.fetchMessages(accountId, options);
        return NextResponse.json({ success: true, data: messages });

      case 'sendMessage':
        const { accountId: senderId, messageOptions } = params;
        const result = await emailClient.sendMessage(senderId, messageOptions);
        return NextResponse.json({ success: true, data: result });

      case 'saveDraft':
        const { accountId: draftAccountId, draft } = params;
        const savedDraft = await emailClient.saveDraft(draftAccountId, draft);
        return NextResponse.json({ success: true, data: savedDraft });

      case 'updateDraft':
        const { draftId, draftData } = params;
        const updatedDraft = await emailClient.updateDraft(draftId, draftData);
        return NextResponse.json({ success: true, data: updatedDraft });

      case 'deleteDraft':
        const { draftId: deleteDraftId } = params;
        await emailClient.deleteDraft(deleteDraftId);
        return NextResponse.json({ success: true });

      case 'getDrafts':
        const { accountId: draftsAccountId } = params;
        const drafts = await emailClient.getDrafts(draftsAccountId);
        return NextResponse.json({ success: true, data: drafts });

      case 'toggleMessageFlag':
        const { messageId, flag, value } = params;
        const updatedMessage = await emailClient.toggleMessageFlag(messageId, flag, value);
        return NextResponse.json({ success: true, data: updatedMessage });

      case 'getUnreadCount':
        const { accountId: unreadAccountId } = params;
        const unreadCount = await emailClient.getUnreadCount(unreadAccountId);
        return NextResponse.json({ success: true, data: unreadCount });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
