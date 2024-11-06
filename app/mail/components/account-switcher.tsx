// @ts-nocheck
"use client"

import * as React from "react"
import { Plus, Search, Settings, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { AccountSwitcherProps, Account } from "../types"

const STORAGE_KEY = "selectedEmailAccount"

export function AccountSwitcher({
  isCollapsed,
  accounts,
  selectedAccount,
  onAccountSelect,
  onAddAccount,
  onRemoveAccount,
  onRefreshAccounts,
}: AccountSwitcherProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Handle adding new account
  const handleAddAccount = async () => {
    setIsLoading(true)
    try {
      await onAddAccount()
      setIsAddAccountOpen(false)
      toast.success('Account added successfully')
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error('Failed to add account')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle removing account
  const handleRemoveAccount = async (email: string) => {
    setIsLoading(true)
    try {
      await onRemoveAccount(email)
      
      if (accounts.length === 1) {
        setIsSettingsOpen(false)
        localStorage.setItem(STORAGE_KEY, "all")
        onAccountSelect("all")
      }
      toast.success('Account removed successfully')
    } catch (error) {
      console.error('Error removing account:', error)
      toast.error('Failed to remove account')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle refreshing all accounts
  const handleRefreshAccounts = async () => {
    setIsLoading(true)
    try {
      await onRefreshAccounts()
      toast.success('Accounts refreshed successfully')
    } catch (error) {
      console.error('Error refreshing accounts:', error)
      toast.error('Failed to refresh accounts')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter accounts based on search query
  const filteredAccounts = React.useMemo(() => 
    accounts.filter(account =>
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.label.toLowerCase().includes(searchQuery.toLowerCase())
    ), [accounts, searchQuery]
  )

  // Load saved account selection from localStorage
  React.useEffect(() => {
    const savedAccount = localStorage.getItem(STORAGE_KEY)
    if (savedAccount) {
      onAccountSelect(savedAccount)
    }
  }, [onAccountSelect])

  // Save selected account to localStorage
  React.useEffect(() => {
    if (selectedAccount) {
      localStorage.setItem(STORAGE_KEY, selectedAccount)
    }
  }, [selectedAccount])

  // Render account icon
  const renderAccountIcon = (account: Account) => (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      {account.label[0].toUpperCase()}
    </div>
  )

  return (
    <>
      <Select value={selectedAccount} onValueChange={onAccountSelect}>
        <SelectTrigger
          className={cn(
            "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
            isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
          )}
        >
          <SelectValue>
            {selectedAccount === "all" ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Settings className="h-4 w-4" />
                </div>
                <span className={cn("ml-2", isCollapsed && "hidden")}>
                  All Accounts
                </span>
              </>
            ) : (
              <>
                {accounts.find(acc => acc.email === selectedAccount)?.icon || 
                 renderAccountIcon(accounts.find(acc => acc.email === selectedAccount)!)}
                <span className={cn("ml-2", isCollapsed && "hidden")}>
                  {accounts.find(acc => acc.email === selectedAccount)?.label}
                </span>
              </>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="flex flex-col gap-2 p-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Add Account Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsAddAccountOpen(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Gmail Account
            </Button>

            {/* Manage Accounts Button */}
            {accounts.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setIsSettingsOpen(true)}
                disabled={isLoading}
              >
                <Settings className="h-4 w-4" />
                Manage Accounts
              </Button>
            )}

            <Separator className="my-2" />
            
            {/* Accounts List */}
            <ScrollArea className="h-[300px]">
              <SelectItem value="all" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>All Accounts</span>
                  </div>
                </div>
              </SelectItem>
              {filteredAccounts.map((account) => (
                <SelectItem
                  key={account.email}
                  value={account.email}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {account.icon || renderAccountIcon(account)}
                    <div className="flex flex-col">
                      <span>{account.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.email}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {filteredAccounts.length === 0 && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No accounts found
                </div>
              )}
            </ScrollArea>
          </div>
        </SelectContent>
      </Select>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gmail Account</DialogTitle>
            <DialogDescription>
              Connect your Google account to access your emails
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Button 
              onClick={handleAddAccount} 
              className="w-full max-w-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Accounts Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Accounts</DialogTitle>
            <DialogDescription>
              Manage your connected Gmail accounts
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {accounts.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {account.icon || renderAccountIcon(account)}
                  <div className="flex flex-col">
                    <span className="font-medium">{account.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.email)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSettingsOpen(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button 
              onClick={handleRefreshAccounts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Refresh All'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}