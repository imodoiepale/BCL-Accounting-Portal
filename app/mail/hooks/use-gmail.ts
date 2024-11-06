"use client"

import { useState, useEffect, useCallback } from 'react';
import { Account, GmailMessage, GmailThread } from '../components/types';
import { supabase } from '@/lib/supabaseClient';
import { addMinutes, isPast } from 'date-fns';
import toast from 'react-hot-toast';

// Constants
const GMAIL_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  CLIENT_SECRET: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
  SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'profile',
    'email'
  ].join(' '),
  MAX_RESULTS: 20
} as const;

// Type definitions
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expiry_date?: number;
  scope: string;
}

interface AccountWithToken extends Account {
  token: TokenInfo;
}

// Helper functions
const getHeader = (headers: Array<{ name: string; value: string }>, name: string): string => {
  return headers.find(header => header.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export function useGmail() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [pageToken, setPageToken] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // API Initialization
  const initGapi = async (): Promise<void> => {
    try {
      await new Promise<void>((resolve) => window.gapi.load('client', resolve));
      await window.gapi.client.init({
        apiKey: GMAIL_CONFIG.API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing GAPI:', error);
      toast.error('Failed to initialize Gmail client');
    }
  };

  const initGsi = useCallback((): void => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GMAIL_CONFIG.CLIENT_ID,
        scope: GMAIL_CONFIG.SCOPES,
        callback: handleTokenResponse,
        access_type: 'offline',
        prompt: 'consent',
        redirect_uri: window.location.origin,
      });
      setTokenClient(client);
    } catch (error) {
      console.error('Error initializing GSI:', error);
      toast.error('Failed to initialize Google Sign-In');
    }
  }, []);

  // Token Management
  const refreshToken = async (account: AccountWithToken): Promise<TokenInfo> => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GMAIL_CONFIG.CLIENT_ID!,
          client_secret: GMAIL_CONFIG.CLIENT_SECRET!,
          refresh_token: account.token.refresh_token!,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Failed to refresh token');
      }

      const data = await response.json();
      const newToken = {
        ...account.token,
        access_token: data.access_token,
        expiry_date: addMinutes(new Date(), data.expires_in).getTime(),
      };

      await updateAccountToken(account.email, newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Failed to refresh token');
      throw error;
    }
  };

  const ensureValidToken = useCallback(async (account: AccountWithToken): Promise<TokenInfo> => {
    if (!account.token.expiry_date || isPast(new Date(account.token.expiry_date))) {
      return await refreshToken(account);
    }
    return account.token;
  }, []);

  // Database Operations
  const updateAccountToken = async (email: string, token: TokenInfo): Promise<void> => {
    const { error } = await supabase
      .from('email_accounts')
      .update({ 
        token: JSON.stringify(token),
        token_expiry: new Date(token.expiry_date!).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) throw error;

    setAccounts(prev => prev.map(acc => 
      acc.email === email 
        ? { ...acc, token }
        : acc
    ));
  };

  const saveAccountToDatabase = async (account: Account): Promise<void> => {
    const { error } = await supabase
      .from('email_accounts')
      .insert([{
        email: account.email,
        label: account.email.split('@')[0],
        token: JSON.stringify(account.token),
        refresh_token: account.token.refresh_token,
        token_expiry: account.token.expiry_date 
          ? new Date(account.token.expiry_date).toISOString()
          : null,
        last_sync: new Date().toISOString()
      }]);

    if (error) throw error;
    toast.success('Account added successfully');
  };

  const updateLastSync = async (email: string): Promise<void> => {
    const { error } = await supabase
      .from('email_accounts')
      .update({ 
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.error('Error updating last sync:', error);
    }
  };
  // Message Operations
  const syncMessagesToDatabase = async (messages: GmailMessage[], accountEmail: string): Promise<void> => {
    const { data: account } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('email', accountEmail)
      .single();

    if (!account) throw new Error('Account not found');

    const { error } = await supabase
      .from('email_messages')
      .upsert(
        messages.map(msg => ({
          gmail_id: msg.id,
          thread_id: msg.threadId,
          account_id: account.id,
          from_email: getHeader(msg.payload.headers, 'From').match(/<(.+)>/)?.[1] || '',
          from_name: getHeader(msg.payload.headers, 'From').split('<')[0].trim(),
          subject: getHeader(msg.payload.headers, 'Subject'),
          snippet: msg.snippet,
          body_data: msg.payload.body?.data || msg.payload.parts?.[0]?.body?.data,
          body_type: msg.payload.mimeType,
          received_at: new Date(parseInt(msg.internalDate)).toISOString(),
          labels: msg.labelIds,
          is_read: !msg.labelIds?.includes('UNREAD'),
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'gmail_id,account_id' }
      );

    if (error) throw error;
    await updateLastSync(accountEmail);
  };

  const fetchMessages = useCallback(async (email: string, nextPageToken: string | null = null): Promise<GmailMessage[]> => {
    if (!isInitialized) {
      throw new Error('Gmail client not initialized');
    }

    try {
      setLoading(true);
      const account = accounts.find(acc => acc.email === email);
      if (!account) throw new Error('Account not found');

      const token = await ensureValidToken(account as AccountWithToken);
      window.gapi.client.setToken(token);

      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: GMAIL_CONFIG.MAX_RESULTS,
        pageToken: nextPageToken,
        q: 'in:inbox'
      });

      const messagesData = await Promise.all(
        response.result.messages.map(async (message: { id: string }) => {
          const details = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          return {
            ...details.result,
            accountEmail: email
          };
        })
      );

      setPageToken(response.result.nextPageToken || '');
      setHasMore(!!response.result.nextPageToken);

      setAccounts(prev => prev.map(acc => {
        if (acc.email === email) {
          return {
            ...acc,
            messages: nextPageToken 
              ? [...(acc.messages || []), ...messagesData]
              : messagesData
          };
        }
        return acc;
      }));

      await syncMessagesToDatabase(messagesData, email);
      return messagesData;
    } catch (error: any) {
      if (error?.status === 401) {
        const account = accounts.find(acc => acc.email === email);
        if (account) {
          await refreshToken(account as AccountWithToken);
          return fetchMessages(email, nextPageToken);
        }
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accounts, isInitialized, ensureValidToken]);

  // Email Operations
  const sendReply = async (messageId: string, content: string, threadId: string): Promise<any> => {
    if (!isInitialized) {
      throw new Error('Gmail client not initialized');
    }

    try {
      setLoading(true);
      const account = accounts.find(acc => 
        acc.messages?.some(msg => msg.id === messageId)
      );
      
      if (!account) throw new Error('Account not found');

      const token = await ensureValidToken(account as AccountWithToken);
      window.gapi.client.setToken(token);

      const originalMessage = account.messages?.find(msg => msg.id === messageId);
      if (!originalMessage) throw new Error('Original message not found');

      const to = getHeader(originalMessage.payload.headers, 'From');
      const subject = getHeader(originalMessage.payload.headers, 'Subject');
      const references = getHeader(originalMessage.payload.headers, 'Message-ID');

      const email = [
        'Content-Type: text/plain; charset="UTF-8"\n',
        'MIME-Version: 1.0\n',
        'Content-Transfer-Encoding: 7bit\n',
        'References: ', references, '\n',
        'In-Reply-To: ', references, '\n',
        'to: ', to, '\n',
        'subject: Re: ', subject, '\n\n',
        content,
      ].join('');

      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await window.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail,
          threadId: threadId,
        },
      });

      await fetchMessages(account.email);
      toast.success('Reply sent successfully');
      return response;
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Account Management
  const handleTokenResponse = async (response: any): Promise<void> => {
    if (response.error) {
      toast.error('Failed to get Google authorization');
      return;
    }

    try {
      setLoading(true);
      const userInfo = await window.gapi.client.gmail.users.getProfile({ userId: 'me' });
      const email = userInfo.result.emailAddress;

      if (!accounts.find(acc => acc.email === email)) {
        const token = window.gapi.client.getToken();
        const newToken = {
          ...token,
          expiry_date: addMinutes(new Date(), token.expires_in).getTime()
        };

        const newAccount = {
          email,
          label: email.split('@')[0],
          token: newToken
        };

        await saveAccountToDatabase(newAccount);
        setAccounts(prev => [...prev, newAccount]);
        setSelectedAccount(email);
        await fetchMessages(email);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      toast.error('Failed to add account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Public Methods
  const addAccount = (): void => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      toast.error('Sign-in client not initialized');
    }
  };

  const removeAccount = async (email: string): Promise<void> => {
    const account = accounts.find(acc => acc.email === email);
    if (!account?.token) return;

    try {
      setLoading(true);
      window.google.accounts.oauth2.revoke(account.token.access_token);

      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('email', email);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.email !== email));
      setSelectedAccount(accounts[0]?.email || 'all');
      
      toast.success('Account removed successfully');
    } catch (error) {
      console.error('Error removing account:', error);
      toast.error('Failed to remove account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAllAccounts = async (): Promise<void> => {
    if (!isInitialized) {
      throw new Error('Gmail client not initialized');
    }

    try {
      setLoading(true);
      await Promise.all(accounts.map(account => fetchMessages(account.email)));
      toast.success('All accounts refreshed');
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      toast.error('Failed to refresh accounts');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (): Promise<void> => {
    if (loading || !hasMore || !selectedAccount || selectedAccount === 'all') return;
    await fetchMessages(selectedAccount, pageToken);
  };

  const fetchThread = async (threadId: string, accountEmail: string): Promise<GmailThread> => {
    if (!isInitialized) {
      throw new Error('Gmail client not initialized');
    }

    try {
      setLoading(true);
      const account = accounts.find(acc => acc.email === accountEmail);
      if (!account) throw new Error('Account not found');

      const token = await ensureValidToken(account as AccountWithToken);
      window.gapi.client.setToken(token);

      const response = await window.gapi.client.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      return response.result;
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to fetch thread');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load accounts from database
  const loadAccountsFromDatabase = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      console.warn('Gmail client not initialized yet');
      return;
    }

    try {
      setLoading(true);
      const { data: dbAccounts, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (dbAccounts?.length > 0) {
        const formattedAccounts = dbAccounts.map(acc => ({
          email: acc.email,
          label: acc.label,
          token: JSON.parse(acc.token),
          messages: []
        }));

        setAccounts(formattedAccounts);

        await Promise.all(formattedAccounts.map(async (account) => {
          try {
            const token = await ensureValidToken(account as AccountWithToken);
            window.gapi.client.setToken(token);
            await fetchMessages(account.email);
          } catch (error) {
            console.error(`Error loading messages for ${account.email}:`, error);
          }
        }));

        if (!selectedAccount && formattedAccounts.length > 0) {
          setSelectedAccount(formattedAccounts[0].email);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isInitialized, ensureValidToken, fetchMessages, selectedAccount]);

  // Initialize Google APIs
  useEffect(() => {
    const loadScripts = async (): Promise<() => void> => {
      try {
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.body.appendChild(script);
          });
        };

        // Load both scripts in parallel
        await Promise.all([
          loadScript('https://apis.google.com/js/api.js'),
          loadScript('https://accounts.google.com/gsi/client')
        ]);

        // Initialize APIs
        await initGapi();
        initGsi();

        // Return cleanup function
        return () => {
          const scripts = document.querySelectorAll('script');
          scripts.forEach(script => {
            if (script.src.includes('google') || script.src.includes('gsi')) {
              document.body.removeChild(script);
            }
          });
        };
      } catch (error) {
        console.error('Error initializing Gmail:', error);
        toast.error('Failed to initialize Gmail integration');
        throw error;
      }
    };

    loadScripts();
  }, [initGsi]);

  // Load accounts after initialization
  useEffect(() => {
    if (isInitialized) {
      loadAccountsFromDatabase();
    }
  }, [isInitialized, loadAccountsFromDatabase]);

  return {
    accounts,
    selectedAccount,
    loading,
    hasMore,
    isInitialized,
    setSelectedAccount,
    addAccount,
    removeAccount,
    refreshAllAccounts,
    loadMore,
    sendReply,
    fetchThread,
  };
}

export default useGmail;