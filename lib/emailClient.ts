import { supabase } from './supabaseClient';
import { simpleParser } from 'mailparser';
import { decrypt } from './encryption';
import Client from 'emailjs-imap-client';

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
  imap_host?: string;
  imap_port?: number;
  is_active?: boolean;
}

interface EmailAddress {
  address: string;
  name?: string;
  value?: EmailAddress[];
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

interface ProviderConfig {
  imap: {
    host: string;
    port: number;
    tls: boolean;
  };
  oauth?: boolean;
}

// Email provider configurations
const PROVIDER_CONFIGS: Record<Exclude<EmailAccount['provider'], 'other'>, ProviderConfig> = {
  gmail: {
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    },
    oauth: true,
  },
  outlook: {
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
    },
  },
  yahoo: {
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
    },
  },
};

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

  async verifyCredentials(
    provider: EmailAccount['provider'],
    email: string,
    appPassword?: string,
    accessToken?: string
  ): Promise<void> {
    try {
      const response = await fetch('/api/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          email,
          appPassword,
          accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify credentials');
      }
    } catch (error) {
      console.error('Verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to verify credentials');
    }
  }

  async addAccount(
    email: string,
    provider: EmailAccount['provider'],
    appPassword?: string,
    accessToken?: string,
    refreshToken?: string,
    tokenExpiry?: string,
    imapHost?: string,
    imapPort?: number
  ): Promise<EmailAccount> {
    try {
      // Verify credentials before creating account
      await this.verifyCredentials(provider, email, appPassword, accessToken);

      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          provider,
          appPassword,
          accessToken,
          refreshToken,
          tokenExpiry,
          imapHost,
          imapPort,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add account');
      }

      return await response.json();
    } catch (error) {
      console.error('Account creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add account');
    }
  }

  async refreshGmailToken(accountId: string): Promise<string> {
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

    if (!response.ok) throw new Error('Failed to refresh token');

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

  async fetchMessages(
    accountId: string,
    options: {
      limit?: number;
      offset?: number;
      labels?: string[];
      isArchived?: boolean;
      isStarred?: boolean;
      threadId?: string;
      searchQuery?: string;
    } = {}
  ): Promise<EmailMessage[]> {
    try {
      const account = await this.getAccount(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const response = await fetch('/api/email/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken(account)}`,
        },
        body: JSON.stringify({
          accountId,
          ...options,
          provider: account.provider
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch messages');
      }

      const messages = await response.json();
      return Array.isArray(messages) ? messages : [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  private async getAccount(accountId: string): Promise<EmailAccount | null> {
    const { data: account } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    return account;
  }

  async getUnreadCount(accountId: string): Promise<number> {
    try {
      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail' && account.access_token) {
        const accessToken = await this.getGmailAccessToken(accountId);
        const response = await fetch(
          `${GMAIL_API_BASE}/gmail/v1/users/me/messages?q=is:unread in:inbox`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch unread count');
        const data = await response.json();
        return data.resultSizeEstimate || 0;
      } else {
        // Use API route for unread count in Edge Runtime
        const response = await fetch('/api/email/unread', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAccessToken(account)}`,
          },
          body: JSON.stringify({
            accountId,
            provider: account.provider
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get unread count');
        }

        const data = await response.json();
        return data.count;
      }
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  async toggleMessageFlag(messageId: string, flag: 'read' | 'archived' | 'starred', value: boolean): Promise<void> {
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

      if (account.provider === 'gmail' && account.access_token) {
        const accessToken = await this.getGmailAccessToken(account.id);
        
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

        const response = await fetch(
          `${GMAIL_API_BASE}/gmail/v1/users/me/messages/${messageId}/modify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              addLabelIds: addLabels,
              removeLabelIds: removeLabels,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to modify message');
      } else {
        // Use API route for message flags in Edge Runtime
        const response = await fetch('/api/email/flags', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAccessToken(account)}`,
          },
          body: JSON.stringify({
            accountId: account.id,
            messageId,
            flag,
            value,
            provider: account.provider
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to modify message flags');
        }

        // Update local cache in Supabase
        await supabase.from('bcl_emails_messages').update({
          [flag === 'read' ? 'is_read' : flag === 'archived' ? 'is_archived' : 'is_starred']: value,
          updated_at: new Date().toISOString()
        }).eq('id', messageId).eq('account_id', account.id);
      }
    } catch (error) {
      console.error('Failed to toggle message flag:', error);
      throw error;
    }
  }

  async sendMessage(accountId: string, options: {
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: EmailAttachment[];
    inReplyTo?: string;
    references?: string[];
  }): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('bcl_emails_accounts')
        .select()
        .eq('id', accountId)
        .single();

      if (!account) throw new Error('Account not found');

      if (account.provider === 'gmail' && account.access_token) {
        const accessToken = await this.getGmailAccessToken(accountId);
        
        // Create email in RFC 2822 format
        const message = [
          'From: ' + account.email,
          'To: ' + options.to.join(', '),
          'Subject: ' + options.subject,
          'Content-Type: text/html; charset=utf-8',
          options.inReplyTo ? 'In-Reply-To: ' + options.inReplyTo : '',
          options.references ? 'References: ' + options.references.join(' ') : '',
          '',
          options.html || options.text
        ].filter(Boolean).join('\r\n');

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
      } else {
        // TODO: Implement SMTP sending for non-Gmail providers
        throw new Error('SMTP sending not yet implemented for non-Gmail providers');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async saveDraft(accountId: string, draft: Omit<EmailDraft, 'id' | 'account_id' | 'created_at' | 'updated_at'>): Promise<EmailDraft> {
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

  async updateDraft(draftId: string, draft: Partial<EmailDraft>): Promise<EmailDraft> {
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

  async deleteDraft(draftId: string): Promise<void> {
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

  async getDrafts(accountId: string): Promise<EmailDraft[]> {
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

  private extractBody(payload: any, mimeType: string): string {
    if (!payload) return '';

    if (payload.mimeType === mimeType) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBody(part, mimeType);
        if (body) return body;
      }
    }

    return '';
  }

  private async getAccessToken(account: EmailAccount): Promise<string> {
    // Implement logic to get access token for non-Gmail providers
    // For now, just return an empty string
    return '';
  }
}
