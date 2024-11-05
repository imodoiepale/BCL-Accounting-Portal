"use client"

import * as React from "react"
import { Plus, Search, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
import { AccountSwitcherProps } from "../types"

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

  const filteredAccounts = accounts.filter(account =>
    account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.label.toLowerCase().includes(searchQuery.toLowerCase())
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
            {accounts.find((account) => account.email === selectedAccount)?.icon}
            <span className={cn("ml-2", isCollapsed && "hidden")}>
              {accounts.find((account) => account.email === selectedAccount)?.label}
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

            {accounts.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Manage Accounts
              </Button>
            )}

            <Separator className="my-2" />
            
            <ScrollArea className="h-[300px]">
              <SelectItem value="all" className="cursor-pointer">
                <div className="flex items-center gap-3">
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
                    {account.icon}
                    <div className="flex flex-col">
                      <span>{account.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.email}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </div>
        </SelectContent>
      </Select>

      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gmail Account</DialogTitle>
            <DialogDescription>
              Connect your Google account to access your emails
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Button onClick={onAddAccount} className="w-full max-w-sm">
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
              Continue with Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  {account.icon}
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
                  onClick={() => {
                    onRemoveAccount()
                    if (accounts.length === 1) {
                      setIsSettingsOpen(false)
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              onRefreshAccounts()
              setIsSettingsOpen(false)
            }}>
              Refresh All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}