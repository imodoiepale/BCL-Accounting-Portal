export interface GmailMessage {
    id: string
    threadId: string
    labelIds: string[]
    snippet: string
    payload: {
      partId: string
      mimeType: string
      filename: string
      headers: Array<{
        name: string
        value: string
      }>
      body: {
        attachmentId: string
        size: number
        data: string
      }
      parts?: Array<{
        partId: string
        mimeType: string
        filename: string
        headers: Array<{
          name: string
          value: string
        }>
        body: {
          attachmentId: string
          size: number
          data: string
        }
      }>
    }
    internalDate: string
  }
  
  export interface Account {
    email: string
    token: {
      access_token: string
      expires_in: number
      scope: string
      token_type: string
    }
    messages?: GmailMessage[]
  }
  
  export interface FormattedAccount {
    label: string
    email: string
    icon: React.ReactNode
  }
  
  export interface MailDisplayProps {
    mail: GmailMessage | null
  }
  
  export interface NavLink {
    title: string
    label?: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "ghost" | "outline"
  }
  
  export interface NavProps {
    isCollapsed: boolean
    links: NavLink[]
  }
  
  export interface AccountSwitcherProps {
    isCollapsed: boolean
    accounts: FormattedAccount[]
    selectedAccount: string
    onAccountSelect: (email: string) => void
    onAddAccount: () => void
    onRemoveAccount: () => void
    onRefreshAccounts: () => void
  }
  
  export interface MailListProps {
    accounts: Account[]
    onLoadMore: () => void
    hasMore: boolean
    loading: boolean
    selectedAccount: string
  }
  
  export interface MailProps {
    defaultLayout?: number[]
    defaultCollapsed?: boolean
    navCollapsedSize: number
  }