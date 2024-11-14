// @ts-check
// #ts-ignore
"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

// Types
interface Token {
  access_token: string
  refresh_token: string  // Required for offline access
  scope: string
  expires_in: number
  expiry_time: number
  last_refresh: string
  token_type: string
}

interface Account {
  email: string
  label: string
  token: Token
  messages?: GmailMessage[]
  retryCount?: number
  lastTokenCheck?: number
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: any
  sizeEstimate: number
  historyId: string
  internalDate: string
}

// Constants
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
const TOKEN_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000 // 10 minutes
const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000 // 1 second base delay for exponential backoff

// const SCOPES = [
//   'https://www.googleapis.com/auth/gmail.readonly',     // Read-only access to Gmail
//   'https://www.googleapis.com/auth/gmail.metadata',     // Read message metadata
//   'https://www.googleapis.com/auth/userinfo.email',     // Get user's email address
//   'https://www.googleapis.com/auth/userinfo.profile',   // Get basic profile info
//   'offline_access'                                      // Enable refresh tokens
// ].join(' ')

// Declare global types
declare const google: any
declare const gapi: any

export function useGmail() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [pageToken, setPageToken] = useState<string>('')
  const [hasMore, setHasMore] = useState(true)
  const [tokenClient, setTokenClient] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Google API
  const initGapi = async () => {
    try {
      await new Promise((resolve) => gapi.load('client', resolve))
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
      })
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize GAPI:', error)
      toast.error('Failed to initialize Google API')
    }
  }

  const initGsi = useCallback(() => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
        access_type: 'offline',  // Request offline access
        prompt: 'consent',       // Force consent screen to get refresh token
        redirect_uri: window.location.origin,
      })
      setTokenClient(client)
    } catch (error) {
      console.error('Failed to initialize GSI:', error)
      toast.error('Failed to initialize Google Sign-In')
    }
  }, [])

  // Token Management
  const refreshToken = useCallback(async (account: Account): Promise<Token> => {
    if (!isInitialized || !tokenClient) {
      throw new Error('Gmail client not initialized')
    }

    try {
      // First try using refresh token if available
      if (account.token.refresh_token) {
        const params = new URLSearchParams({
          client_id: CLIENT_ID || '',
          client_secret: CLIENT_SECRET || '',
          refresh_token: account.token.refresh_token,
          grant_type: 'refresh_token',
        })

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        })

        if (response.ok) {
          const data = await response.json()
          const tokenExpiryTime = new Date().getTime() + (data.expires_in * 1000)
          
          const updatedToken = {
            ...account.token,
            access_token: data.access_token,
            expires_in: data.expires_in,
            expiry_time: tokenExpiryTime,
            last_refresh: new Date().toISOString(),
          }

          // Update token in database
          await updateAccountInDatabase(account.email, updatedToken)

          // Update account in state
          setAccounts(prev => prev.map(acc => 
            acc.email === account.email 
              ? { ...acc, token: updatedToken, lastTokenCheck: Date.now() }
              : acc
          ))

          // Set the token for gapi client
          gapi.client.setToken(updatedToken)

          return updatedToken
        }
      }

      // If refresh token doesn't work or isn't available, request new tokens
      return new Promise((resolve, reject) => {
        tokenClient.requestAccessToken({
          prompt: '',
          hint: account.email,
          callback: async (response: any) => {
            if (response.error) {
              reject(response)
              return
            }

            const newToken = gapi.client.getToken()
            const tokenExpiryTime = new Date().getTime() + (newToken.expires_in * 1000)
            
            const updatedToken = {
              ...newToken,
              expiry_time: tokenExpiryTime,
              last_refresh: new Date().toISOString(),
            }

            try {
              await updateAccountInDatabase(account.email, updatedToken)
              
              setAccounts(prev => prev.map(acc => 
                acc.email === account.email 
                  ? { ...acc, token: updatedToken, lastTokenCheck: Date.now() }
                  : acc
              ))

              resolve(updatedToken)
            } catch (error) {
              reject(error)
            }
          }
        })
      })

    } catch (error) {
      console.error('Error refreshing token:', error)
      
      // Implement retry mechanism with exponential backoff
      if (!account.retryCount || account.retryCount < MAX_RETRY_COUNT) {
        const delay = RETRY_DELAY * Math.pow(2, account.retryCount || 0)
        await new Promise(resolve => setTimeout(resolve, delay))
        return refreshToken({
          ...account,
          retryCount: (account.retryCount || 0) + 1
        })
      }
      
      throw error
    }
  }, [tokenClient, isInitialized]) 
  
  const checkTokenHealth = async (account: Account) => {
    if (!isInitialized) return false

    const currentTime = new Date().getTime()
    
    // Skip check if token was checked recently (within last 5 minutes)
    if (account.lastTokenCheck && currentTime - account.lastTokenCheck < 5 * 60 * 1000) {
      return true
    }

    const tokenExpiryTime = account.token.expiry_time
    
    // Proactively refresh token if it will expire soon
    if (tokenExpiryTime - currentTime < TOKEN_REFRESH_THRESHOLD) {
      try {
        await refreshToken(account)
        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        return false
      }
    }

    try {
      gapi.client.setToken(account.token)
      await gapi.client.gmail.users.getProfile({ userId: 'me' })
      
      // Update last check time
      setAccounts(prev => prev.map(acc => 
        acc.email === account.email 
          ? { ...acc, lastTokenCheck: currentTime }
          : acc
      ))
      
      return true
    } catch (error) {
      try {
        await refreshToken(account)
        return true
      } catch (refreshError) {
        console.error('Token health check failed:', refreshError)
        return false
      }
    }
  }

  // Database Operations
  const updateAccountInDatabase = async (email: string, token: Token) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (data) {
        // Account exists, update it
        const { error: updateError } = await supabase
          .from('email_accounts')
          .update({
            token: JSON.stringify(token),
            last_token_refresh: new Date().toISOString()
          })
          .eq('email', email)

        if (updateError) throw updateError
        return true
      } else {
        // Account doesn't exist, create it
        const { error: insertError } = await supabase
          .from('email_accounts')
          .insert([{
            email: email,
            label: email.split('@')[0],
            token: JSON.stringify(token),
            last_token_refresh: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])

        if (insertError) throw insertError
        return false
      }
    } catch (error) {
      console.error('Error updating/creating account:', error)
      throw error
    }
  }

  const loadAccountsFromDatabase = useCallback(async () => {
    if (!isInitialized) return

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
          label: acc.label,
          lastTokenCheck: undefined,
          messages: []
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
  }, [isInitialized, selectedAccount])
  // Message Operations
  const fetchMessages = async (email: string, nextPageToken: string | null = null) => {
    if (!isInitialized) return

    setLoading(true)
    try {
      const account = accounts.find(acc => acc.email === email)
      if (!account) throw new Error('Account not found')

      const isValid = await checkTokenHealth(account)
      if (!isValid) throw new Error('Failed to validate token')

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
    } finally {
      setLoading(false)
    }
  }

  // Periodic token management
  useEffect(() => {
    if (!isInitialized || accounts.length === 0) return

    const refreshTokens = async () => {
      for (const account of accounts) {
        try {
          await checkTokenHealth(account)
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error)
        }
      }
    }

    // Initial refresh
    refreshTokens()

    // Set up periodic refresh
    const intervalId = setInterval(refreshTokens, TOKEN_CHECK_INTERVAL)
    return () => clearInterval(intervalId)
  }, [accounts, isInitialized])

  // Initialize Google APIs
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
  }, [initGsi])

  // Load accounts after initialization
  useEffect(() => {
    if (isInitialized) {
      loadAccountsFromDatabase()
    }
  }, [isInitialized, loadAccountsFromDatabase])

  // Handle token response
  const handleTokenResponse = async (response: any) => {
    if (response.error) return

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' })
      const email = userInfo.result.emailAddress
      const token = gapi.client.getToken()
      const tokenExpiryTime = new Date().getTime() + (token.expires_in * 1000)
      
      const updatedToken = {
        ...token,
        expiry_time: tokenExpiryTime,
        last_refresh: new Date().toISOString(),
      }

      const existingAccount = accounts.find(acc => acc.email === email)
      
      // Update or create account in database
      const wasUpdated = await updateAccountInDatabase(email, updatedToken)

      if (existingAccount) {
        // Update existing account in state
        setAccounts(prev => prev.map(acc => 
          acc.email === email 
            ? { ...acc, token: updatedToken, lastTokenCheck: Date.now() }
            : acc
        ))
      } else {
        // Add new account to state
        const newAccount = {
          email,
          label: email.split('@')[0],
          token: updatedToken,
          lastTokenCheck: Date.now()
        }
        setAccounts(prev => [...prev, newAccount])
        setSelectedAccount(email)
      }

      // Only fetch messages for new accounts
      if (!wasUpdated) {
        await fetchMessages(email)
      }

      toast.success(wasUpdated ? 'Account updated successfully' : 'Account added successfully')
    } catch (error) {
      console.error('Error handling token response:', error)
      toast.error('Failed to process account')
    }
  }

  // Public methods
  const addAccount = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      toast.error('Google Sign-In not initialized')
    }
  }

  const removeAccount = async (email: string) => {
    const account = accounts.find(acc => acc.email === email)
    if (account?.token) {
      try {
        // Revoke the token
        google.accounts.oauth2.revoke(account.token.access_token, () => {
          console.log('Token revoked successfully')
        })

        // Remove from database
        const { error } = await supabase
          .from('email_accounts')
          .delete()
          .eq('email', email)
        
        if (error) throw error
        
        // Update state
        setAccounts(prev => prev.filter(acc => acc.email !== email))
        if (selectedAccount === email) {
          setSelectedAccount(accounts[0]?.email || 'all')
        }
        
        toast.success('Account removed successfully')
      } catch (error) {
        console.error('Error removing account:', error)
        toast.error('Failed to remove account')
      }
    }
  }

  const refreshAllAccounts = async () => {
    if (!isInitialized) return

    setLoading(true)
    try {
      // First refresh tokens
      for (const account of accounts) {
        try {
          await checkTokenHealth(account)
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error)
        }
      }

      // Then fetch messages
      for (const account of accounts) {
        try {
          await fetchMessages(account.email)
        } catch (error) {
          console.error(`Failed to fetch messages for ${account.email}:`, error)
        }
      }

      toast.success('Accounts refreshed successfully')
    } catch (error) {
      console.error('Error refreshing accounts:', error)
      toast.error('Failed to refresh accounts')
    } finally {
      setLoading(false)
    }
  }

  // Pagination
  const loadMore = async () => {
    if (loading || !hasMore || !selectedAccount || !isInitialized) return
    
    try {
      if (selectedAccount === 'all') {
        // Load more for all accounts
        for (const account of accounts) {
          const accountMessages = account.messages || []
          if (accountMessages.length > 0) {
            await fetchMessages(
              account.email,
              accountMessages[accountMessages.length - 1].id
            )
          }
        }
      } else {
        // Load more for selected account
        await fetchMessages(selectedAccount, pageToken)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('Failed to load more messages')
    }
  }

  // Error handling wrapper for API calls
  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    errorMessage: string
  ): Promise<T> => {
    try {
      return await apiCall()
    } catch (error: any) {
      // Check if error is due to token expiration
      if (error.status === 401 || error.status === 403) {
        const account = accounts.find(acc => 
          acc.token.access_token === gapi.client.getToken()?.access_token
        )
        if (account) {
          try {
            await refreshToken(account)
            return await apiCall()
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            throw new Error('Authentication failed. Please sign in again.')
          }
        }
      }
      console.error(`${errorMessage}:`, error)
      throw error
    }
  }

  // Utility function to ensure account is ready for API calls
  const ensureAccountReady = async (email: string): Promise<boolean> => {
    const account = accounts.find(acc => acc.email === email)
    if (!account) return false

    try {
      const isValid = await checkTokenHealth(account)
      if (!isValid) {
        throw new Error('Token validation failed')
      }
      return true
    } catch (error) {
      console.error(`Failed to prepare account ${email}:`, error)
      return false
    }
  }

  return {
    // State
    accounts,
    selectedAccount,
    loading,
    hasMore,
    isInitialized,
    
    // Account management
    setSelectedAccount,
    addAccount,
    removeAccount,
    refreshAllAccounts,
    
    // Message operations
    loadMore,
    fetchMessages,
    
    // Token management
    checkTokenHealth,
    refreshToken,
    
    // Utility functions
    ensureAccountReady,
    handleApiCall,
    
    // Database operations
    loadAccountsFromDatabase
  }
}

export type { Account, Token, GmailMessage }