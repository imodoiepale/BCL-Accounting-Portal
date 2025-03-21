import { supabase } from './supabaseClient';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  app_password: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'other';
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  account_id: string;
  message_id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string;
  body_text?: string;
  body_html?: string;
  attachments?: EmailAttachment[];
  labels: string[];
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  thread_id?: string;
  in_reply_to?: string;
  references?: string[];
  created_at: string;
}

export interface EmailDraft {
  id: string;
  account_id: string;
  subject?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  body_text?: string;
  body_html?: string;
  attachments?: EmailAttachment[];
  in_reply_to?: string;
  references?: string[];
  created_at: string;
  updated_at: string;
}

// Gmail API endpoints
const GMAIL_API_BASE = 'https://gmail.googleapis.com';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
];

export class EmailClient {
  private static instance: EmailClient;

  private constructor() {}

  static getInstance(): EmailClient {
    if (!EmailClient.instance) {
      EmailClient.instance = new EmailClient();
    }
    return EmailClient.instance;
  }

  async addAccount(email: string, provider: EmailAccount['provider'], appPassword?: string) {
    try {
      if (provider === 'gmail') {
        // Store initial account info
        const { data, error } = await supabase
          .from('bcl_emails_accounts')
          .insert({
            email,
            provider,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // For other providers, require app password
      if (!appPassword) {
        throw new Error('App password is required for non-Gmail accounts');
      }

      // Store account with app password (encryption handled by server)
      const { data, error } = await supabase
        .from('bcl_emails_accounts')
        .insert({
          email,
          provider,
          app_password: appPassword, // Encryption will be handled by server-side function
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add email account:', error);
      throw error;
    }
  }

  private async refreshGmailToken(accountId: string) {
    const { data: account } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    if (!account?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const { access_token, expires_in } = await response.json();
    const token_expiry = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('bcl_emails_accounts')
      .update({
        access_token,
        token_expiry,
      })
      .eq('id', accountId);

    if (updateError) throw updateError;
    return access_token;
  }

  private async getGmailAccessToken(accountId: string): Promise<string> {
    const { data: account } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.access_token || !account.token_expiry) {
      throw new Error('Account not properly authenticated');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiryDate = new Date(account.token_expiry);
    const now = new Date();
    if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
      return this.refreshGmailToken(accountId);
    }

    return account.access_token;
  }

  async fetchMessages(accountId: string, options: { 
    limit?: number; 
    offset?: number; 
    labels?: string[];
    isArchived?: boolean;
    isStarred?: boolean;
    threadId?: string;
    searchQuery?: string;
  } = {}) {
    try {
      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail') {
        const accessToken = await this.getGmailAccessToken(accountId);
        let endpoint = `${GMAIL_API_BASE}/gmail/v1/users/me/messages`;
        const queryParams = new URLSearchParams();

        if (options.limit) queryParams.set('maxResults', options.limit.toString());
        if (options.threadId) endpoint = `${GMAIL_API_BASE}/gmail/v1/users/me/threads/${options.threadId}`;
        if (options.searchQuery) queryParams.set('q', options.searchQuery);

        const response = await fetch(`${endpoint}?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch messages');

        const result = await response.json();
        const messages = options.threadId ? [result] : result.messages || [];

        // Fetch full message details
        const messageDetails = await Promise.all(
          messages.map(async (msg: { id: string }) => {
            const msgResponse = await fetch(
              `${GMAIL_API_BASE}/gmail/v1/users/me/messages/${msg.id}?format=full`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (!msgResponse.ok) return null;

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
              date: getHeader('Date') || '',
              body_text: this.extractBody(data.payload, 'text/plain'),
              body_html: this.extractBody(data.payload, 'text/html'),
              labels: data.labelIds || [],
              is_read: !data.labelIds?.includes('UNREAD'),
              is_archived: !data.labelIds?.includes('INBOX'),
              is_starred: data.labelIds?.includes('STARRED') || false,
              thread_id: data.threadId,
              in_reply_to: getHeader('In-Reply-To'),
              references: (getHeader('References') || '').split(' ').filter(Boolean),
              created_at: new Date().toISOString(),
            };

            // Store in Supabase for caching
            await supabase.from('bcl_emails_messages').upsert(message);

            return message;
          })
        );

        return messageDetails.filter(Boolean);
      }

      throw new Error('Provider not supported');
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  private extractBody(payload: any, mimeType: string): string {
    if (!payload) return '';

    if (payload.mimeType === mimeType) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBody(part, mimeType);
        if (body) return body;
      }
    }

    return '';
  }

  async sendMessage(accountId: string, options: {
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: EmailAttachment[];
    inReplyTo?: string;
    references?: string[];
  }) {
    try {
      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail') {
        const accessToken = await this.getGmailAccessToken(accountId);
        
        // Create email in RFC 2822 format
        const message = [
          'From: ' + account.email,
          'To: ' + options.to.join(', '),
          'Subject: ' + options.subject,
          'Content-Type: text/html; charset=utf-8',
          '',
          options.html || options.text
        ].join('\r\n');

        const encodedMessage = Buffer.from(message).toString('base64url');

        const response = await fetch(`${GMAIL_API_BASE}/gmail/v1/users/me/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMessage,
            threadId: options.inReplyTo,
          }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        return response.json();
      }

      throw new Error('Provider not supported');
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async saveDraft(accountId: string, draft: Omit<EmailDraft, 'id' | 'account_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('bcl_emails_drafts')
        .insert({
          account_id: accountId,
          ...draft,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  async updateDraft(draftId: string, draft: Partial<EmailDraft>) {
    try {
      const { data, error } = await supabase
        .from('bcl_emails_drafts')
        .update(draft)
        .eq('id', draftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw error;
    }
  }

  async deleteDraft(draftId: string) {
    try {
      const { error } = await supabase
        .from('bcl_emails_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }

  async getDrafts(accountId: string) {
    try {
      const { data, error } = await supabase
        .from('bcl_emails_drafts')
        .select()
        .eq('account_id', accountId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get drafts:', error);
      throw error;
    }
  }

  async toggleMessageFlag(messageId: string, flag: 'read' | 'archived' | 'starred', value: boolean) {
    try {
      const { data: message } = await supabase
        .from('bcl_emails_messages')
        .select('account_id')
        .eq('id', messageId)
        .single();

      if (!message) throw new Error('Message not found');

      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', message.account_id)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail') {
        const accessToken = await this.getGmailAccessToken(message.account_id);
        let addLabels: string[] = [];
        let removeLabels: string[] = [];

        switch (flag) {
          case 'read':
            if (value) {
              removeLabels.push('UNREAD');
            } else {
              addLabels.push('UNREAD');
            }
            break;
          case 'archived':
            if (value) {
              removeLabels.push('INBOX');
            } else {
              addLabels.push('INBOX');
            }
            break;
          case 'starred':
            if (value) {
              addLabels.push('STARRED');
            } else {
              removeLabels.push('STARRED');
            }
            break;
        }

        const response = await fetch(`${GMAIL_API_BASE}/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addLabelIds: addLabels,
            removeLabelIds: removeLabels,
          }),
        });

        if (!response.ok) throw new Error('Failed to modify message');

        const result = await response.json();

        // Update local cache
        const updateData = {
          [`is_${flag}`]: value,
        };

        const { data, error } = await supabase
          .from('bcl_emails_messages')
          .update(updateData)
          .eq('id', messageId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      throw new Error('Provider not supported');
    } catch (error) {
      console.error(`Failed to toggle ${flag} flag:`, error);
      throw error;
    }
  }

  async getUnreadCount(accountId: string) {
    try {
      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail') {
        const accessToken = await this.getGmailAccessToken(accountId);
        
        const response = await fetch(
          `${GMAIL_API_BASE}/gmail/v1/users/me/messages?q=is:unread in:inbox&maxResults=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to get unread count');

        const result = await response.json();
        return result.resultSizeEstimate || 0;
      }

      throw new Error('Provider not supported');
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }
}
