import { useState, useEffect, useCallback } from 'react';
import { useGmailAuth } from './useGmailAuth';
import { EmailClient } from '@/lib/emailClient';
import { supabase } from '@/lib/supabaseClient';

interface EmailAccount {
  id?: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'other';
  authMethod: 'oauth' | 'app_password';
  messages?: any[];
  labels?: string[];
}

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  const {
    addNewAccount: addOAuthAccount,
    removeAccount: removeOAuthAccount,
  } = useGmailAuth();

  // Load all accounts (both OAuth and IMAP) on mount
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load IMAP accounts from Supabase
      const { data: imapAccounts, error } = await supabase
        .from('bcl_emails_accounts')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Transform IMAP accounts to common format
      const formattedImapAccounts = imapAccounts.map(account => ({
        id: account.id,
        email: account.email,
        provider: account.provider,
        authMethod: 'app_password' as const,
      }));

      // Get OAuth accounts
      const oauthAccounts = await loadOAuthAccounts();

      // Combine both types of accounts
      setAccounts([...formattedImapAccounts, ...oauthAccounts]);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const loadOAuthAccounts = async () => {
    // Implementation will depend on your OAuth storage method
    // This is a placeholder that should be integrated with your existing OAuth system
    return [];
  };

  const addAccount = async (accountData: {
    email: string;
    provider: 'gmail' | 'outlook' | 'other';
    authMethod: 'oauth' | 'app_password';
    appPassword?: string;
  }) => {
    try {
      if (accountData.authMethod === 'oauth') {
        await addOAuthAccount();
      } else {
        if (!accountData.appPassword) {
          throw new Error('App password is required for IMAP/SMTP authentication');
        }

        const emailClient = EmailClient.getInstance();
        const account = await emailClient.addAccount(
          accountData.email,
          accountData.appPassword,
          accountData.provider
        );

        setAccounts(prev => [...prev, {
          id: account.id,
          email: account.email,
          provider: account.provider,
          authMethod: 'app_password',
        }]);
      }

      await loadAccounts(); // Refresh the accounts list
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  };

  const removeAccount = async (email: string) => {
    try {
      const account = accounts.find(acc => acc.email === email);
      if (!account) return;

      if (account.authMethod === 'oauth') {
        await removeOAuthAccount(email);
      } else {
        await supabase
          .from('bcl_emails_accounts')
          .update({ is_active: false })
          .eq('email', email);
      }

      setAccounts(prev => prev.filter(acc => acc.email !== email));
    } catch (error) {
      console.error('Failed to remove account:', error);
      throw error;
    }
  };

  const fetchMessages = async (email: string, options: { 
    limit?: number;
    offset?: number;
    labels?: string[];
  } = {}) => {
    try {
      const account = accounts.find(acc => acc.email === email);
      if (!account) throw new Error('Account not found');

      if (account.authMethod === 'oauth') {
        // Use existing OAuth message fetching logic
        // This should be integrated with your current OAuth implementation
      } else {
        const emailClient = EmailClient.getInstance();
        const messages = await emailClient.fetchMessages(account.id!, options);

        setAccounts(prev => prev.map(acc => {
          if (acc.email === email) {
            return {
              ...acc,
              messages: [...(acc.messages || []), ...messages],
            };
          }
          return acc;
        }));

        return messages;
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  };

  const sendMessage = async (email: string, messageData: {
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }) => {
    try {
      const account = accounts.find(acc => acc.email === email);
      if (!account) throw new Error('Account not found');

      if (account.authMethod === 'oauth') {
        // Use existing OAuth send message logic
        // This should be integrated with your current OAuth implementation
      } else {
        const emailClient = EmailClient.getInstance();
        await emailClient.sendMessage(account.id!, messageData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  return {
    accounts,
    loading,
    showAddAccount,
    setShowAddAccount,
    addAccount,
    removeAccount,
    fetchMessages,
    sendMessage,
  };
}
