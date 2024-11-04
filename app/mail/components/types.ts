
export interface EmailAccount {
    id: string
    user_id: string
    email: string
    label: string
    auth_type: 'password' | 'google'
    created_at: string
  }
  
  export interface AccountSwitcherProps {
    isCollapsed: boolean
    accounts: {
      label: string
      email: string
      icon: React.ReactNode
    }[]
    onAccountsUpdate: () => void
  }