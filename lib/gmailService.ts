import { EmailMessage } from '@/types/email';
import { Buffer } from 'buffer';

const GMAIL_API_BASE = 'https://gmail.googleapis.com';

export async function fetchGmailMessages(accessToken: string, accountId: string, limit: number = 50): Promise<EmailMessage[]> {
  try {
    console.log('Fetching Gmail messages list');
    const response = await fetch(`${GMAIL_API_BASE}/gmail/v1/users/me/messages?maxResults=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gmail API list error:', error);
      throw new Error(error.error?.message || 'Failed to fetch messages from Gmail API');
    }

    const data = await response.json();
    const messages = data.messages || [];
    console.log('Found Gmail messages:', messages.length);

    // Fetch full message details
    const messageDetails = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        try {
          console.log('Fetching message details:', msg.id);
          const msgResponse = await fetch(
            `${GMAIL_API_BASE}/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!msgResponse.ok) {
            const error = await msgResponse.json();
            console.error('Gmail API message error:', error);
            return null;
          }

          const data = await msgResponse.json();
          const headers = data.payload.headers;
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

          const message: EmailMessage = {
            id: data.id,
            account_id: accountId,
            message_id: getHeader('Message-ID'),
            subject: getHeader('Subject') || '',
            from: getHeader('From') || '',
            to: (getHeader('To') || '').split(',').map((e: string) => e.trim()),
            cc: (getHeader('Cc') || '').split(',').filter(Boolean).map((e: string) => e.trim()),
            bcc: (getHeader('Bcc') || '').split(',').filter(Boolean).map((e: string) => e.trim()),
            date: getHeader('Date') || new Date().toISOString(),
            body_text: extractBody(data.payload, 'text/plain'),
            body_html: extractBody(data.payload, 'text/html'),
            labels: data.labelIds || [],
            is_read: !data.labelIds?.includes('UNREAD'),
            is_archived: !data.labelIds?.includes('INBOX'),
            is_starred: data.labelIds?.includes('STARRED') || false,
            thread_id: data.threadId,
            in_reply_to: getHeader('In-Reply-To'),
            references: (getHeader('References') || '').split(' ').filter(Boolean),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log('Message details fetched:', { id: message.id, subject: message.subject });
          return message;
        } catch (error) {
          console.error('Failed to fetch message details:', msg.id, error);
          return null;
        }
      })
    );

    const validMessages = messageDetails.filter(Boolean) as EmailMessage[];
    console.log('Successfully fetched messages:', validMessages.length);
    return validMessages;
  } catch (error) {
    console.error('Gmail service error:', error);
    throw error;
  }
}

function extractBody(payload: any, mimeType: string): string {
  if (!payload) return '';

  if (payload.mimeType === mimeType) {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    return payload.body?.data || '';
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const body = extractBody(part, mimeType);
      if (body) return body;
    }
  }

  return '';
}
