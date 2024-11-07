// @ts-nocheck
"use client"
import { useState, useEffect, useCallback } from 'react'
import { Account, GmailMessage } from '../types'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'

declare const google: any
declare const gapi: any

export function useGmail() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [pageToken, setPageToken] = useState<string>('')
  const [hasMore, setHasMore] = useState(true)
  const [tokenClient, setTokenClient] = useState<any>(null)

  const initGapi = async () => {
    await new Promise((resolve) => gapi.load('client', resolve))
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    })
  }

  const initGsi = useCallback(() => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
      redirect_uri: window.location.origin,
    })
    setTokenClient(client)
  }, [])

  const saveAccountToDatabase = async (account: Account) => {
    try {
      const tokenExpiryTime = new Date().getTime() + (account.token.expires_in * 1000);
      const { error } = await supabase
        .from('email_accounts')
        .insert([{
          email: account.email,
          label: account.email.split('@')[0],
          token: JSON.stringify({
            ...account.token,
            expiry_time: tokenExpiryTime
          }),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])

      if (error) throw error
      
      toast.success('Account saved successfully')
    } catch (error) {
      console.error('Error saving account:', error)
      toast.error('Failed to save account')
      throw error
    }
  }

  const refreshToken = useCallback(async (account: Account) => {
    try {
      // Set the existing token
      gapi.client.setToken(account.token);
      
      // Request a new token using the refresh token
      const response = await new Promise((resolve, reject) => {
        tokenClient.requestAccessToken({
          prompt: '',
          hint: account.email,
          callback: (response: any) => {
            if (response.error) reject(response);
            else resolve(response);
          }
        });
      });

      // Update token in database
      const newToken = gapi.client.getToken();
      const tokenExpiryTime = new Date().getTime() + (newToken.expires_in * 1000);
      
      const { error } = await supabase
        .from('email_accounts')
        .update({
          token: JSON.stringify({
            ...newToken,
            expiry_time: tokenExpiryTime
          })
        })
        .eq('email', account.email);

      if (error) throw error;

      // Update account in state
      setAccounts(prev => prev.map(acc => 
        acc.email === account.email 
          ? { ...acc, token: { ...newToken, expiry_time: tokenExpiryTime } }
          : acc
      ));

      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error(`Failed to refresh token for ${account.email}`);
      throw error;
    }
  }, [tokenClient, setAccounts]);
  const checkAndRefreshTokenIfNeeded = useCallback(async (account: Account) => {
    const tokenData = account.token;
    const expiryTime = tokenData.expiry_time;
    const currentTime = new Date().getTime();
    
    // Refresh if token expires in less than 5 minutes
    if (expiryTime - currentTime < 5 * 60 * 1000) {
      return await refreshToken(account);
    }
    
    return tokenData;
  }, [refreshToken]);

  const handleTokenResponse = async (response: any) => {
    if (response.error) return

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' })
      const email = userInfo.result.emailAddress

      if (!accounts.find(acc => acc.email === email)) {
        const token = gapi.client.getToken()
        const tokenExpiryTime = new Date().getTime() + (token.expires_in * 1000)
        
        const newAccount = {
          email,
          label: email.split('@')[0],
          token: {
            ...token,
            expiry_time: tokenExpiryTime
          }
        }

        await saveAccountToDatabase(newAccount)

        setAccounts(prev => [...prev, newAccount])
        setSelectedAccount(email)
        await fetchMessages(email)
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      toast.error('Failed to add account')
    }
  }

  const loadAccountsFromDatabase = useCallback(async () => {
    setLoading(true)
    try {
      const { data: dbAccounts, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (dbAccounts) {
        const formattedAccounts = dbAccounts.map(acc => ({
          email: acc.email,
          token: JSON.parse(acc.token),
          label: acc.label
        }))

        setAccounts(formattedAccounts)

        if (!selectedAccount && formattedAccounts.length > 0) {
          setSelectedAccount(formattedAccounts[0].email)
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [setLoading, setAccounts, selectedAccount, setSelectedAccount])

  const fetchMessages = async (email: string, nextPageToken: string | null = null) => {
    setLoading(true)
    try {
      const account = accounts.find(acc => acc.email === email)
      if (!account) throw new Error('Account not found')

      // Check and refresh token if needed
      const validToken = await checkAndRefreshTokenIfNeeded(account)
      gapi.client.setToken(validToken)

      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        pageToken: nextPageToken
      })

      const messagesData = await Promise.all(
        response.result.messages.map(async (message: { id: string }) => {
          const details = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          })
          return details.result
        })
      )
      setPageToken(response.result.nextPageToken || '')
      setHasMore(!!response.result.nextPageToken)

      setAccounts(prev => prev.map(acc => {
        if (acc.email === email) {
          return {
            ...acc,
            messages: nextPageToken 
              ? [...(acc.messages || []), ...messagesData]
              : messagesData
          }
        }
        return acc
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages')
    }
    setLoading(false)
  }

  const addAccount = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    }
  }

  const removeAccount = async (email: string) => {
    const account = accounts.find(acc => acc.email === email)
    if (account?.token) {
      try {
        google.accounts.oauth2.revoke(account.token.access_token)

        const { error } = await supabase
          .from('email_accounts')
          .delete()
          .eq('email', email)
        
        if (error) throw error
        
        setAccounts(prev => prev.filter(acc => acc.email !== email))
        setSelectedAccount(accounts[0]?.email || 'all')
        
        toast.success('Account removed successfully')
      } catch (error) {
        console.error('Error removing account:', error)
        toast.error('Failed to remove account')
      }
    }
  }

  const refreshAllAccounts = async () => {
    setLoading(true)
    try {
      await loadAccountsFromDatabase()
      for (const account of accounts) {
        const validToken = await checkAndRefreshTokenIfNeeded(account)
        gapi.client.setToken(validToken)
        await fetchMessages(account.email)
      }
      toast.success('Accounts refreshed successfully')
    } catch (error) {
      console.error('Error refreshing accounts:', error)
      toast.error('Failed to refresh accounts')
    }
    setLoading(false)
  }

  useEffect(() => {
    const loadScripts = async () => {
      const loadGapiScript = document.createElement('script')
      loadGapiScript.src = 'https://apis.google.com/js/api.js'
      loadGapiScript.onload = initGapi

      const loadGsiScript = document.createElement('script')
      loadGsiScript.src = 'https://accounts.google.com/gsi/client'
      loadGsiScript.onload = initGsi

      document.body.appendChild(loadGapiScript)
      document.body.appendChild(loadGsiScript)

      return () => {
        document.body.removeChild(loadGapiScript)
        document.body.removeChild(loadGsiScript)
      }
    }

    loadScripts()
    loadAccountsFromDatabase()
  }, [initGsi, loadAccountsFromDatabase])

  // Add periodic token check
  useEffect(() => {
    const checkTokens = async () => {
      for (const account of accounts) {
        try {
          await checkAndRefreshTokenIfNeeded(account);
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error);
        }
      }
    };

    // Check tokens every 4 minutes
    const intervalId = setInterval(checkTokens, 4 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [accounts, checkAndRefreshTokenIfNeeded]);

  const loadMore = async () => {
    if (loading || !hasMore || !selectedAccount) return
    await fetchMessages(
      selectedAccount === 'all' ? accounts[0].email : selectedAccount,
      pageToken
    )
  }

  return {
    accounts,
    selectedAccount,
    loading,
    hasMore,
    setSelectedAccount,
    addAccount,
    removeAccount,
    refreshAllAccounts,
    loadMore,
    loadAccountsFromDatabase
  }
}