// @ts-nocheck
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Paperclip, Star, Clock } from "lucide-react";

const Email = ({ message, accountEmail }) => {
  const getHeader = (headers, name) => {
    return headers.find(header => header.name === name)?.value || '';
  };

  const formatDate = (internalDate) => {
    const date = new Date(parseInt(internalDate));
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const hasAttachments = message.payload.parts?.some(part => part.filename && part.filename.length > 0);

  return (
    <div className="p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
            {getHeader(message.payload.headers, 'From').charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-gray-900 truncate pr-2">
              {getHeader(message.payload.headers, 'Subject') || '(no subject)'}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAttachments && (
                <Paperclip className="w-4 h-4 text-gray-400" />
              )}
              <Badge variant="outline" className="text-xs">
                {accountEmail}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span className="font-medium truncate">
              {getHeader(message.payload.headers, 'From').split('<')[0].trim()}
            </span>
            <span className="text-gray-400">•</span>
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">{formatDate(message.internalDate)}</span>
          </div>
          
          <div className="text-sm text-gray-500 line-clamp-2">
            {message.snippet}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailList = ({ accounts, onLoadMore, hasMore, loading, selectedAccount }) => {
  const observer = useRef();
  const lastEmailRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, onLoadMore]);

  // Combine all messages from all accounts and add account information
  const allMessages = accounts.reduce((acc, account) => {
    if (account.messages) {
      const messagesWithAccount = account.messages.map(message => ({
        ...message,
        accountEmail: account.email
      }));
      return [...acc, ...messagesWithAccount];
    }
    return acc;
  }, []);

  // Filter messages based on the selected account
  const filteredMessages = selectedAccount === 'all'
    ? allMessages
    : allMessages.filter(message => message.accountEmail === selectedAccount);

  // Sort messages by internalDate if available
  const sortedMessages = filteredMessages.sort((a, b) => {
    return parseInt(b.internalDate) - parseInt(a.internalDate);
  });

  if (!sortedMessages.length && !loading) {
    return (
      <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium">No messages to display</p>
        <p className="text-sm">Add an account to start viewing emails</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {sortedMessages.map((message, index) => {
        if (index === sortedMessages.length - 1) {
          return (
            <div ref={lastEmailRef} key={`${message.accountEmail}-${message.id}`}>
              <Email message={message} accountEmail={message.accountEmail} />
            </div>
          );
        }
        return (
          <Email 
            key={`${message.accountEmail}-${message.id}`} 
            message={message} 
            accountEmail={message.accountEmail}
          />
        );
      })}
      {loading && (
        <div className="p-4">
          <EmailSkeleton />
          <EmailSkeleton />
          <EmailSkeleton />
        </div>
      )}
    </div>
  );
};

const EmailSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  </div>
);

export default function GmailManager() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [tokenClient, setTokenClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const CLIENT_ID = '342538819907-2v86oir8ip9m4nvurqs6g4j1ohsqc2sg.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyCAtdOy5Tj8Orjm4HM5LlwOl8bWEf2-81c';
  const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

  useEffect(() => {
    const loadGapiScript = document.createElement('script');
    loadGapiScript.src = 'https://apis.google.com/js/api.js';
    loadGapiScript.onload = initGapi;
    document.body.appendChild(loadGapiScript);

    const loadGsiScript = document.createElement('script');
    loadGsiScript.src = 'https://accounts.google.com/gsi/client';
    loadGsiScript.onload = initGsi;
    document.body.appendChild(loadGsiScript);

    return () => {
      document.body.removeChild(loadGapiScript);
      document.body.removeChild(loadGsiScript);
    };
  }, []);

  const initGapi = async () => {
    await new Promise((resolve) => gapi.load('client', resolve));
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    });
  };

  const initGsi = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
      redirect_uri: window.location.origin,
    });
    setTokenClient(client);
  };

  const handleTokenResponse = async (response) => {
    if (response.error) return;

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' });
      const email = userInfo.result.emailAddress;

      if (!accounts.find(acc => acc.email === email)) {
        const newAccount = {
          email,
          token: gapi.client.getToken()
        };
        setAccounts(prev => [...prev, newAccount]);
        setSelectedAccount(email);
        await fetchMessages(email);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
  };

  const addNewAccount = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const removeAccount = () => {
    const account = accounts.find(acc => acc.email === selectedAccount);
    if (account?.token) {
      google.accounts.oauth2.revoke(account.token.access_token);
    }
    setAccounts(prev => prev.filter(acc => acc.email !== selectedAccount));
    setSelectedAccount(accounts[0]?.email || 'all');
  };

  const refreshAllAccounts = async () => {
    setLoading(true);
    for (const account of accounts) {
      gapi.client.setToken(account.token);
      await fetchMessages(account.email);
    }
    setLoading(false);
  };

  const fetchMessages = async (email, nextPageToken = null) => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        pageToken: nextPageToken
      });

      const messagesData = await Promise.all(
        response.result.messages.map(async (message) => {
          const details = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });
          return details.result;
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
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore || !selectedAccount) return;
    await fetchMessages(selectedAccount === 'all' ? accounts[0].email : selectedAccount, pageToken);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Gmail Manager
        </h1>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.email} value={account.email}>
                    {account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <button
            onClick={addNewAccount}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Account
          </button>
          
          {accounts.length > 0 && (
            <>
              <button
                onClick={refreshAllAccounts}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                disabled={loading}
              >
                Refresh All
              </button>
              {selectedAccount !== 'all' && (
                <button
                  onClick={removeAccount}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>

        <EmailList 
          accounts={accounts} 
          onLoadMore={loadMore} 
          hasMore={hasMore} 
          loading={loading}
          selectedAccount={selectedAccount}
        />
      </div>
    </div>
  );
}