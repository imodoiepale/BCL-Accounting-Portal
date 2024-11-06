// types.ts
import { ReactNode } from 'react'

// Mail related interfaces
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

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    parts?: Array<{
      filename: string
      [key: string]: any
    }>
  }
  internalDate: string
  accountEmail?: string
}

// Account related interfaces
export interface EmailAccount {
  id: string
  user_id: string | null
  email: string
  label: string
  token: string
  created_at: string
  updated_at: string
}

export interface Account {
  email: string
  label: string
  token: {
    access_token: string
    token_type: string
    expires_in: number
    scope: string
  }
  messages?: GmailMessage[]
  icon?: ReactNode
}

// Component Props interfaces
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

export interface NavProps {
  isCollapsed: boolean
  links: NavLink[]
}

export interface NavLink {
  title: string
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "ghost"
}

// Mail Store State interface
export interface MailState {
  selected: string | null
  mail: GmailMessage[]
}