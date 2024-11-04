// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';

const CLIENT_ID = '342538819907-2v86oir8ip9m4nvurqs6g4j1ohsqc2sg.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCAtdOy5Tj8Orjm4HM5LlwOl8bWEf2-81c';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

interface Account {
  email: string;
  token: any;
  messages?: any[];
}

interface EmailProps {
  message: any;
}

const Email = ({ message }: EmailProps) => {
  const getHeader = (headers: any[], name: string) => {
    return headers.find(header => header.name === name)?.value || '';
  };

  return (
    <div className="p-4 border-b hover:bg-gray-50 transition-colors">
      <div className="font-semibold text-gray-900">
        {getHeader(message.payload.headers, 'Subject') || '(no subject)'}
      </div>
      <div className="text-sm text-gray-600">
        {getHeader(message.payload.headers, 'From')}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {message.snippet}
      </div>
    </div>
  );
};

const AccountBox = ({ account, onRemove, onRefresh }: {
  account: Account;
  onRemove: () => void;
  onRefresh: () => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-gray-900">{account.email}</span>
        <div className="space-x-2">
          <button 
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={onRemove}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="divide-y">
        {account.messages?.map((message) => (
          <Email key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};

export default function GmailManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Google API scripts
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

  const fetchMessages = async (email: string) => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 10
      });

      const messagesData = await Promise.all(
        response.result.messages.map(async (message: any) => {
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

  const handleTokenResponse = async (response: any) => {
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

  const removeAccount = (email: string) => {
    const account = accounts.find(acc => acc.email === email);
    if (account?.token) {
      google.accounts.oauth2.revoke(account.token.access_token);
    }
    setAccounts(prev => prev.filter(acc => acc.email !== email));
  };

  const refreshAccount = async (account: Account) => {
    gapi.client.setToken(account.token);
    await fetchMessages(account.email);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Multi-Account Gmail Manager
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <AccountBox
              key={account.email}
              account={account}
              onRemove={() => removeAccount(account.email)}
              onRefresh={() => refreshAccount(account)}
            />
          ))}
          
          <button
            onClick={addNewAccount}
            className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-600">Add New Account</span>
          </button>
        </div>

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