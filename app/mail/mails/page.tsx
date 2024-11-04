// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Email = ({ message, accountEmail }) => {
  const getHeader = (headers, name) => {
    return headers.find(header => header.name === name)?.value || '';
  };

  const formatDate = (internalDate) => {
    const date = new Date(parseInt(internalDate));
    return date.toLocaleString();
  };

  return (
    <div className="p-4 border-b hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {getHeader(message.payload.headers, 'Subject') || '(no subject)'}
          </div>
          <div className="text-sm text-gray-600">
            {getHeader(message.payload.headers, 'From')}
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(message.internalDate)}
          </div>
        </div>
        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {accountEmail}
        </div>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {message.snippet}
      </div>
    </div>
  );
};

const EmailList = ({ accounts }) => {
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

  // Sort messages by internalDate if available
  const sortedMessages = allMessages.sort((a, b) => {
    return parseInt(b.internalDate) - parseInt(a.internalDate);
  });

  if (!sortedMessages.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        No messages to display
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {sortedMessages.map((message) => (
        <Email 
          key={`${message.accountEmail}-${message.id}`} 
          message={message} 
          accountEmail={message.accountEmail}
        />
      ))}
    </div>
  );
};

export default function GmailManager() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [tokenClient, setTokenClient] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const fetchMessages = async (email) => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 50
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

      setAccounts(prev => prev.map(acc => 
        acc.email === email 
          ? { ...acc, messages: messagesData }
          : acc
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
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
    setSelectedAccount(accounts[0]?.email || '');
  };

  const refreshAllAccounts = async () => {
    setLoading(true);
    for (const account of accounts) {
      gapi.client.setToken(account.token);
      await fetchMessages(account.email);
    }
    setLoading(false);
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
              >
                Refresh All
              </button>
              {selectedAccount && (
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

        <EmailList accounts={accounts} />

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              Loading...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}