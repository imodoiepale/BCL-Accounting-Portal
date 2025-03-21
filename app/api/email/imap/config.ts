import type { EmailAccount } from '@/lib/emailClient';

export interface ImapConfig {
  host: string;
  port: number;
  tls: boolean;
}

export const getDefaultImapConfig = (provider: EmailAccount['provider']): ImapConfig => {
  switch (provider) {
    case 'gmail':
      return {
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
      };
    case 'outlook':
      return {
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
      };
    case 'yahoo':
      return {
        host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true,
      };
    default:
      throw new Error('Unknown provider');
  }
};
