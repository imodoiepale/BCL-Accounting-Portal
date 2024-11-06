// @ts-nocheck
"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Settings, 
  Loader2, 
  RefreshCw, 
  Mail,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { toast } from "react-hot-toast"
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
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [refreshingAccount, setRefreshingAccount] = React.useState<string | null>(null)
  const initialRenderRef = React.useRef(true)

  // Load selected account from localStorage on mount
  React.useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      const savedAccount = localStorage.getItem(STORAGE_KEY)
      if (savedAccount && accounts.some(acc => acc.email === savedAccount)) {
        onAccountSelect(savedAccount)
      } else if (accounts.length > 0 && !selectedAccount) {
        onAccountSelect("all")
      }
    }
  }, [accounts, onAccountSelect, selectedAccount])

  // Save selected account to localStorage
  React.useEffect(() => {
    if (selectedAccount && !initialRenderRef.current) {
      localStorage.setItem(STORAGE_KEY, selectedAccount)
    }
  }, [selectedAccount])

  // Auto refresh on mount with debounce
  React.useEffect(() => {
    if (!initialRenderRef.current && accounts.length > 0 && !isRefreshing) {
      const timeoutId = setTimeout(() => {
        handleRefreshMessages()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [accounts.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddAccount = async () => {
    try {
      setIsLoading(true)
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

  const handleRemoveAccount = async (email: string) => {
    try {
      setIsLoading(true)
      await onRemoveAccount(email)
      
      // If removing currently selected account or last account
      if (selectedAccount === email || accounts.length <= 1) {
        onAccountSelect("all")
        setIsSettingsOpen(false)
      }
      toast.success('Account removed successfully')
    } catch (error) {
      console.error('Error removing account:', error)
      toast.error('Failed to remove account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshMessages = React.useCallback(async (email?: string) => {
    if (isRefreshing || refreshingAccount) return

    try {
      if (email) {
        setRefreshingAccount(email)
      } else {
        setIsRefreshing(true)
      }
      
      await onRefreshAccounts(email)
      toast.success(email ? 'Account messages refreshed' : 'All messages refreshed')
    } catch (error) {
      console.error('Error refreshing messages:', error)
      toast.error('Failed to refresh messages')
    } finally {
      setRefreshingAccount(null)
      setIsRefreshing(false)
    }
  }, [isRefreshing, refreshingAccount, onRefreshAccounts])

  const filteredAccounts = React.useMemo(() => 
    accounts.filter(account =>
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.label.toLowerCase().includes(searchQuery.toLowerCase())
    ), [accounts, searchQuery]
  )

  const renderAccountIcon = React.useCallback((account: Account) => (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      {account.icon || account.label[0].toUpperCase()}
    </div>
  ), [])

  const selectedAccountData = React.useMemo(() => 
    accounts.find(acc => acc.email === selectedAccount),
    [accounts, selectedAccount]
  )

  const totalMessages = React.useMemo(() => 
    accounts.reduce((total, acc) => total + (acc.messages?.length || 0), 0),
    [accounts]
  )

  return (
    <TooltipProvider delayDuration={0}>
      <Select 
        value={selectedAccount || "all"} 
        onValueChange={onAccountSelect}
      >
        <SelectTrigger
          className={cn(
            "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
            isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
          )}
          aria-label="Select account"
        >
          <SelectValue placeholder="Select Account">
            {selectedAccount === "all" ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <span className={cn("ml-2", isCollapsed && "hidden")}>
                  All Accounts
                  {totalMessages > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {totalMessages}
                    </Badge>
                  )}
                </span>
              </>
            ) : selectedAccountData ? (
              <>
                {renderAccountIcon(selectedAccountData)}
                <span className={cn("ml-2", isCollapsed && "hidden")}>
                  {selectedAccountData.label}
                  {selectedAccountData.messages?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedAccountData.messages.length}
                    </Badge>
                  )}
                </span>
              </>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="flex flex-col gap-2 p-2">
            {/* Refresh Messages Button */}
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() => handleRefreshMessages()}
              disabled={isRefreshing || isLoading}
              aria-label="Refresh all messages"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Messages
              {isRefreshing && <span className="ml-auto">Refreshing...</span>}
            </Button>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                aria-label="Search accounts"
              />
            </div>
            
            {/* Add Account Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsAddAccountOpen(true)}
              disabled={isLoading || isRefreshing}
              aria-label="Add Gmail account"
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
                disabled={isLoading || isRefreshing}
                aria-label="Manage accounts"
              >
                <Settings className="h-4 w-4" />
                Manage Accounts
                <Badge variant="secondary" className="ml-auto">
                  {accounts.length}
                </Badge>
              </Button>
            )}

            <Separator className="my-2" />
            
            {/* Accounts List */}
            <ScrollArea className="h-[300px]">
              <SelectItem value="all" className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>All Accounts</span>
                    <span className="text-xs text-muted-foreground">
                      {totalMessages} messages total
                    </span>
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
                    {renderAccountIcon(account)}
                    <div className="flex flex-col">
                      <span>{account.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {account.email}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {account.messages?.length || 0} messages
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {filteredAccounts.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery 
                    ? `No accounts found matching "${searchQuery}"`
                    : "No accounts added yet"}
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
              aria-label="Continue with Google"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
                  {renderAccountIcon(account)}
                  <div className="flex flex-col">
                    <span className="font-medium">{account.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.email}
                    </span>
                    <Badge variant="secondary" className="mt-1 w-fit">
                      {account.messages?.length || 0} messages
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRefreshMessages(account.email)}
                        disabled={isLoading || refreshingAccount === account.email}
                        aria-label={`Refresh ${account.label}'s messages`}
                      >
                        {refreshingAccount === account.email ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Refresh messages
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveAccount(account.email)}
                        disabled={isLoading || isRefreshing}
                        aria-label={`Remove ${account.label}'s account`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Remove account
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => handleRefreshMessages()}
                    disabled={isLoading || isRefreshing}
                    aria-label="Refresh all messages"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh All Messages
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Refresh messages for all accounts
                </TooltipContent>
              </Tooltip>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsSettingsOpen(false)}
              disabled={isLoading || isRefreshing}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}