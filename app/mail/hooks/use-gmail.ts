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
      const { error } = await supabase
        .from('email_accounts')
        .insert([{
          email: account.email,
          label: account.email.split('@')[0],
          token: JSON.stringify(account.token),
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

  const handleTokenResponse = async (response: any) => {
    if (response.error) return

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' })
      const email = userInfo.result.emailAddress

      if (!accounts.find(acc => acc.email === email)) {
        const newAccount = {
          email,
          label: email.split('@')[0],
          token: gapi.client.getToken()
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

  const loadAccountsFromDatabase = async () => {
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
  }

  const fetchMessages = async (email: string, nextPageToken: string | null = null) => {
    setLoading(true)
    try {
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
        gapi.client.setToken(account.token)
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
  }, [initGsi])

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