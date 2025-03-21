export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'other';

export interface EmailAccount {
  id: string;
  email: string;
  provider: EmailProvider;
  app_password?: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  account_id: string;
  message_id: string;
  subject?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string;
  body_text?: string;
  body_html?: string;
  attachments?: EmailAttachment[];
  labels?: string[];
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  thread_id?: string;
  in_reply_to?: string;
  references?: string[];
  created_at: string;
  updated_at: string;
}

export interface EmailDraft {
  id: string;
  account_id: string;
  subject?: string;
  to: string[];
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

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  size?: number;
  cid?: string;
}

// Extend the existing Database type
import type { Database as BaseDatabase } from './supabase';

declare global {
  type Database = BaseDatabase & {
    public: {
      Tables: {
        bcl_emails_accounts: {
          Row: EmailAccount;
          Insert: Omit<EmailAccount, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<EmailAccount, 'id'>>;
        };
        bcl_emails_messages: {
          Row: EmailMessage;
          Insert: Omit<EmailMessage, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<EmailMessage, 'id'>>;
        };
        bcl_emails_drafts: {
          Row: EmailDraft;
          Insert: Omit<EmailDraft, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<EmailDraft, 'id'>>;
        };
      } & BaseDatabase['public']['Tables'];
    };
  };
}
