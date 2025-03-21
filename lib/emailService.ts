import { EmailAccount, EmailMessage, EmailDraft, EmailAttachment } from './emailClient';

export interface AddAccountOptions {
  email: string;
  provider: EmailAccount['provider'];
  appPassword?: string;
}

export interface FetchMessagesOptions {
  limit?: number;
  offset?: number;
  labels?: string[];
  isArchived?: boolean;
  isStarred?: boolean;
  threadId?: string;
  searchQuery?: string;
}

export interface SendMessageOptions {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  references?: string[];
}

export class EmailService {
  private static instance: EmailService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/email';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  async addAccount({ email, provider, appPassword }: AddAccountOptions): Promise<EmailAccount> {
    const data = await this.fetchWithError<{ account: EmailAccount }>(
      `${this.baseUrl}/account`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, provider, appPassword }),
      }
    );
    return data.account;
  }

  async getAccounts(): Promise<EmailAccount[]> {
    const data = await this.fetchWithError<{ accounts: EmailAccount[] }>(
      `${this.baseUrl}/account`
    );
    return data.accounts;
  }

  async getAccount(accountId: string): Promise<EmailAccount> {
    const data = await this.fetchWithError<{ account: EmailAccount }>(
      `${this.baseUrl}/account/${accountId}`
    );
    return data.account;
  }

  async fetchMessages(accountId: string, options: FetchMessagesOptions = {}): Promise<EmailMessage[]> {
    const data = await this.fetchWithError<{ messages: EmailMessage[] }>(
      `${this.baseUrl}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, ...options }),
      }
    );
    return data.messages;
  }

  async sendMessage(accountId: string, options: SendMessageOptions): Promise<void> {
    await this.fetchWithError(
      `${this.baseUrl}/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, ...options }),
      }
    );
  }

  async saveDraft(accountId: string, draft: Omit<EmailDraft, 'id' | 'account_id' | 'created_at' | 'updated_at'>): Promise<EmailDraft> {
    const data = await this.fetchWithError<{ draft: EmailDraft }>(
      `${this.baseUrl}/draft`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, draft }),
      }
    );
    return data.draft;
  }

  async updateDraft(draftId: string, draftData: Partial<EmailDraft>): Promise<EmailDraft> {
    const data = await this.fetchWithError<{ draft: EmailDraft }>(
      `${this.baseUrl}/draft/${draftId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData),
      }
    );
    return data.draft;
  }

  async deleteDraft(draftId: string): Promise<void> {
    await this.fetchWithError(
      `${this.baseUrl}/draft/${draftId}`,
      { method: 'DELETE' }
    );
  }

  async getDrafts(accountId: string): Promise<EmailDraft[]> {
    const data = await this.fetchWithError<{ drafts: EmailDraft[] }>(
      `${this.baseUrl}/draft?accountId=${accountId}`
    );
    return data.drafts;
  }

  async toggleMessageFlag(messageId: string, flag: 'read' | 'archived' | 'starred', value: boolean): Promise<EmailMessage> {
    const data = await this.fetchWithError<{ message: EmailMessage }>(
      `${this.baseUrl}/messages/${messageId}/flag`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag, value }),
      }
    );
    return data.message;
  }

  async getUnreadCount(accountId: string): Promise<number> {
    const data = await this.fetchWithError<{ count: number }>(
      `${this.baseUrl}/messages/unread-count?accountId=${accountId}`
    );
    return data.count;
  }

  // Helper function for Gmail OAuth
  async handleGmailCallback(code: string): Promise<EmailAccount> {
    const data = await this.fetchWithError<{ account: EmailAccount }>(
      `${this.baseUrl}/auth/gmail/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }
    );
    return data.account;
  }
}
