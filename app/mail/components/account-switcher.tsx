"use client"

import * as React from "react"
import { Plus, Search } from "lucide-react"
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface AccountSwitcherProps {
  isCollapsed: boolean
  accounts: {
    label: string
    email: string
    icon: React.ReactNode
  }[]
  onAccountsUpdate: () => void
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
  onAccountsUpdate
}: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(
    accounts[0]?.email || ""
  )
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly'
        }
      })

      if (error) throw error

      // Handle successful Google sign in
      toast.success('Google account connected successfully!')
      setIsAddAccountOpen(false)
      onAccountsUpdate()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to connect Google account')
    }
  }

  return (
    <Select defaultValue={selectedAccount} onValueChange={setSelectedAccount}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
          "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {accounts.find((account) => account.email === selectedAccount)?.icon}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {
              accounts.find((account) => account.email === selectedAccount)
                ?.label
            }
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="flex flex-col gap-2 p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => setIsAddAccountOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Gmail Account
          </Button>

          <Separator className="my-2" />
          
          <ScrollArea className="h-[200px]">
            {accounts
              .filter(account => 
                account.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((account) => (
                <SelectItem 
                  key={account.email} 
                  value={account.email}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                    {account.icon}
                    <div className="flex flex-col">
                      <span>{account.label}</span>
                      <span className="text-xs text-muted-foreground">{account.email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))
            }
          </ScrollArea>
        </div>
      </SelectContent>

      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
            <DialogDescription>
              Connect your Google account
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Button 
              type="button"
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Select>
  )
}