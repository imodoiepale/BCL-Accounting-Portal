// types.ts

import { ReactNode } from 'react'

export interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}

export interface TokenInfo {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  expiry_date?: number
  scope: string
}

export interface EmailAccount {
  id: string
  user_id: string | null
  email: string
  label: string
  token: string
  refresh_token?: string
  token_expiry?: string
  created_at: string
  updated_at: string
}

export interface Account {
  email: string
  label: string
  token: TokenInfo
  messages?: GmailMessage[]
  icon?: ReactNode
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    mimeType: any
    headers: Array<{
      name: string
      value: string
    }>
    parts?: Array<{
      filename: string
      mimeType: string
      body: {
        size(size: any): ReactNode
        data?: string
        attachmentId?: string
      }
      [key: string]: any
    }>
    body?: {
      data?: string
      [key: string]: any
    }
  }
  internalDate: string
  accountEmail?: string
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export interface MailProps {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize?: number
}

export interface AccountSwitcherProps {
  isCollapsed: boolean
  accounts: {
    email: string
    label: string
    icon?: ReactNode
    messages?: GmailMessage[]
  }[]
  selectedAccount: string
  onAccountSelect: (email: string) => void
  onAddAccount: () => Promise<void>
  onRemoveAccount: (email: string) => Promise<void>
  onRefreshAccounts: () => Promise<void>
}

export interface MailListProps {
  accounts: Account[]
  messages: GmailMessage[]
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  selectedAccount: string
  searchQuery?: string
  activeTab?: string
}

export interface MailDisplayProps {
  mail: GmailMessage | null
  onSendReply?: (messageId: string, content: string, threadId: string) => Promise<void>
  onLoadThread?: (threadId: string, accountEmail: string) => Promise<GmailThread>
  loading?: boolean
}

export interface NavLink {
  title: string
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "ghost"
}

export interface NavProps {
  isCollapsed: boolean
  links: NavLink[]
}

export interface MailState {
  selected: string | null
  mail: GmailMessage[]
}