// @ts-check
"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

// Types
interface Token {
  access_token: string
  refresh_token?: string
  scope: string
  expires_in: number
  expiry_time: number
  last_refresh?: string
  token_type: string
}

interface Account {
  email: string
  label: string
  token: Token
  messages?: GmailMessage[]
  retryCount?: number
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
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
const TOKEN_CHECK_INTERVAL = 4 * 60 * 1000 // 4 minutes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes
const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000 // 1 second

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
        redirect_uri: window.location.origin,
      })
      setTokenClient(client)
    } catch (error) {
      console.error('Failed to initialize GSI:', error)
      toast.error('Failed to initialize Google Sign-In')
    }
  }, [])

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
            token: JSON.stringify(token)
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
  }, [isInitialized, selectedAccount])

  // Token Management
  const checkTokenHealth = async (account: Account) => {
    if (!isInitialized) return false

    try {
      gapi.client.setToken(account.token)
      await gapi.client.gmail.users.getProfile({ userId: 'me' })
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

  const refreshToken = useCallback(async (account: Account): Promise<Token> => {
    if (!isInitialized || !tokenClient) {
      throw new Error('Gmail client not initialized')
    }

    try {
      gapi.client.setToken(account.token)
      
      await new Promise((resolve, reject) => {
        tokenClient.requestAccessToken({
          prompt: '',
          hint: account.email,
          callback: (response: any) => {
            if (response.error) reject(response)
            else resolve(response)
          }
        })
      })

      const newToken = gapi.client.getToken()
      const tokenExpiryTime = new Date().getTime() + (newToken.expires_in * 1000)
      
      const updatedToken = {
        ...newToken,
        expiry_time: tokenExpiryTime,
        last_refresh: new Date().toISOString()
      }

      // Update token in database
      await updateAccountInDatabase(account.email, updatedToken)

      // Update account in state
      setAccounts(prev => prev.map(acc => 
        acc.email === account.email 
          ? { ...acc, token: updatedToken }
          : acc
      ))

      return updatedToken
    } catch (error) {
      console.error('Error refreshing token:', error)
      
      // Implement retry mechanism
      if (!account.retryCount || account.retryCount < MAX_RETRY_COUNT) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return refreshToken({
          ...account,
          retryCount: (account.retryCount || 0) + 1
        })
      }
      
      toast.error(`Failed to refresh token for ${account.email}`)
      throw error
    }
  }, [tokenClient, isInitialized])

  const checkAndRefreshTokenIfNeeded = useCallback(async (account: Account) => {
    const tokenData = account.token
    const expiryTime = tokenData.expiry_time
    const currentTime = new Date().getTime()
    
    if (expiryTime - currentTime < TOKEN_REFRESH_THRESHOLD) {
      return await refreshToken(account)
    }
    
    return tokenData
  }, [refreshToken])

  const ensureValidToken = async (account: Account) => {
    try {
      const validToken = await checkAndRefreshTokenIfNeeded(account)
      gapi.client.setToken(validToken)
      return true
    } catch (error) {
      console.error('Failed to ensure valid token:', error)
      return false
    }
  }
  // Message Operations
  const fetchMessages = async (email: string, nextPageToken: string | null = null) => {
    if (!isInitialized) return

    setLoading(true)
    try {
      const account = accounts.find(acc => acc.email === email)
      if (!account) throw new Error('Account not found')

      const isValid = await ensureValidToken(account)
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

  // Account Management
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
        last_refresh: new Date().toISOString()
      }

      const existingAccount = accounts.find(acc => acc.email === email)
      
      // Update or create account in database
      const wasUpdated = await updateAccountInDatabase(email, updatedToken)

      if (existingAccount) {
        // Update existing account in state
        setAccounts(prev => prev.map(acc => 
          acc.email === email 
            ? { ...acc, token: updatedToken }
            : acc
        ))
      } else {
        // Add new account to state
        const newAccount = {
          email,
          label: email.split('@')[0],
          token: updatedToken
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
    if (!isInitialized) return

    setLoading(true)
    try {
      await loadAccountsFromDatabase()
      for (const account of accounts) {
        await checkTokenHealth(account)
        await fetchMessages(account.email)
      }
      toast.success('Accounts refreshed successfully')
    } catch (error) {
      console.error('Error refreshing accounts:', error)
      toast.error('Failed to refresh accounts')
    } finally {
      setLoading(false)
    }
  }

  // Effects
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

  // Periodic token check
  useEffect(() => {
    if (!isInitialized || accounts.length === 0) return

    const checkTokens = async () => {
      for (const account of accounts) {
        try {
          await checkTokenHealth(account)
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error)
        }
      }
    }

    const intervalId = setInterval(checkTokens, TOKEN_CHECK_INTERVAL)
    return () => clearInterval(intervalId)
  }, [accounts, isInitialized])

  // Pagination
  const loadMore = async () => {
    if (loading || !hasMore || !selectedAccount || !isInitialized) return
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
    isInitialized,
    setSelectedAccount,
    addAccount,
    removeAccount,
    refreshAllAccounts,
    loadMore,
    loadAccountsFromDatabase
  }
}