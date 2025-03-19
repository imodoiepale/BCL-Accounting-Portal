import { useState, useEffect } from 'react';

interface Account {
  email: string;
  token: any;
  messages?: any[];
}

const CLIENT_ID = '342538819907-2v86oir8ip9m4nvurqs6g4j1ohsqc2sg.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCAtdOy5Tj8Orjm4HM5LlwOl8bWEf2-81c';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify';

export const useGmailAuth = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tokenClient, setTokenClient] = useState<any>(null);

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

  return {
    accounts,
    setAccounts,
    addNewAccount,
    removeAccount,
  };
};
