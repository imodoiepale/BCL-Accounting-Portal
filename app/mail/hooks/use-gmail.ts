

"use client"
import { useState, useEffect, useCallback } from 'react'
import { Account, GmailMessage } from '../types'

declare const google: any
declare const gapi: any

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'

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

  useEffect(() => {
    const loadGapiScript = document.createElement('script')
    loadGapiScript.src = 'https://apis.google.com/js/api.js'
    loadGapiScript.onload = initGapi
    document.body.appendChild(loadGapiScript)

    const loadGsiScript = document.createElement('script')
    loadGsiScript.src = 'https://accounts.google.com/gsi/client'
    loadGsiScript.onload = initGsi
    document.body.appendChild(loadGsiScript)

    return () => {
      document.body.removeChild(loadGapiScript)
      document.body.removeChild(loadGsiScript)
    }
  }, [initGsi])

  const handleTokenResponse = async (response: any) => {
    if (response.error) return

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' })
      const email = userInfo.result.emailAddress

      if (!accounts.find(acc => acc.email === email)) {
        const newAccount = {
          email,
          token: gapi.client.getToken()
        }
        setAccounts(prev => [...prev, newAccount])
        setSelectedAccount(email)
        await fetchMessages(email)
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
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
    }
    setLoading(false)
  }

  const addAccount = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    }
  }

  const removeAccount = () => {
    const account = accounts.find(acc => acc.email === selectedAccount)
    if (account?.token) {
      google.accounts.oauth2.revoke(account.token.access_token)
    }
    setAccounts(prev => prev.filter(acc => acc.email !== selectedAccount))
    setSelectedAccount(accounts[0]?.email || 'all')
  }

  const refreshAllAccounts = async () => {
    setLoading(true)
    for (const account of accounts) {
      gapi.client.setToken(account.token)
      await fetchMessages(account.email)
    }
    setLoading(false)
  }

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
    loadMore
  }
}