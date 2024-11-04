"use client";

import * as React from "react";
import { Plus, Search, X, Mail, Check, Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Utility function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface Account {
  id: string;
  label: string;
  email: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'authenticating';
  lastSync?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: Account[];
  onAccountsUpdate: () => void;
  onAccountSwitch: (email: string) => void;
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
  onAccountsUpdate,
  onAccountSwitch
}: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(
    accounts[0]?.email || ""
  );
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [localAccounts, setLocalAccounts] = React.useState<Account[]>(() =>
    accounts.map((account, index) => ({
      ...account,
      id: account.id || generateUniqueId(`init-account-${index}`),
      status: account.status || 'inactive'
    }))
  );

  const handleAccountSelection = (email: string) => {
    setSelectedAccount(email);
    onAccountSwitch(email);
  };

  const handleAddSingleAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_email', email);

      const response = await fetch('/api/gmail/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          state
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start authentication');
      }

      const { authUrl } = await response.json();

      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.error) {
          toast.error('Authentication failed: ' + event.data.error);
          return;
        }

        if (!event.data?.code) return;

        const savedState = sessionStorage.getItem('oauth_state');
        const savedEmail = sessionStorage.getItem('oauth_email');

        if (event.data.state !== savedState || !savedEmail) {
          toast.error('Invalid authentication state');
          return;
        }

        try {
          const tokenResponse = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: savedEmail,
              code: event.data.code
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Failed to get tokens');
          }

          const { accessToken, refreshToken, expiryDate } = await tokenResponse.json();

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;

          const { data, error } = await supabase
            .from('acc_portal_email_accounts')
            .insert([{
              user_id: userData.user.id,
              email: savedEmail,
              access_token: accessToken,
              refresh_token: refreshToken,
              expiry_date: expiryDate,
              label: savedEmail.split('@')[0],
              auth_type: 'gmail'
            }])
            .select();

          if (error) throw error;

          const newAccount: Account = {
            id: data?.[0]?.id || generateUniqueId('account'),
            label: savedEmail.split('@')[0],
            email: savedEmail,
            icon: <Mail className="h-4 w-4" />,
            status: 'active',
            lastSync: new Date().toISOString(),
            accessToken,
            refreshToken
          };

          setLocalAccounts(prev => [...prev, newAccount]);
          toast.success('Gmail account connected successfully!');
          setIsAddAccountOpen(false);
          onAccountsUpdate();
        } catch (error) {
          console.error('Error:', error);
          toast.error('Failed to connect Gmail account');
        } finally {
          window.removeEventListener('message', handleCallback);
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_email');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleCallback);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start Gmail authentication');
      setIsLoading(false);
    }
  };

  const handleAddMultipleAccounts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const formData = new FormData(e.currentTarget);
      const accountPromises = [1, 2, 3].map(async (index) => {
        const email = formData.get(`email-${index}`) as string;
        const password = formData.get(`password-${index}`) as string;

        if (!email || !password) return null;

        try {
          const state = generateUniqueId(`state-${index}`);
          sessionStorage.setItem(`oauth_state_${index}`, state);
          sessionStorage.setItem(`oauth_email_${index}`, email);

          const response = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              state
            }),
          });

          if (!response.ok) return null;

          const { authUrl } = await response.json();

          const width = 600;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          window.open(
            authUrl,
            `Gmail Authorization ${index}`,
            `width=${width},height=${height},left=${left},top=${top}`
          );

          return {
            email,
            state,
            index
          };
        } catch (error) {
          console.error(`Error authenticating account ${index}:`, error);
          return null;
        }
      });

      const authResults = (await Promise.all(accountPromises)).filter(Boolean);

      if (authResults.length === 0) {
        toast.error('No accounts were successfully authenticated');
        return;
      }

      const handleMultipleCallbacks = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (!event.data?.code || !event.data?.state) return;

        const matchingAuth = authResults.find(auth => auth?.state === event.data.state);
        if (!matchingAuth) return;

        const savedEmail = sessionStorage.getItem(`oauth_email_${matchingAuth.index}`);
        if (!savedEmail) return;

        try {
          const tokenResponse = await fetch('/api/gmail/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: savedEmail,
              code: event.data.code
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Failed to get tokens');
          }

          const { accessToken, refreshToken, expiryDate } = await tokenResponse.json();

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;

          const { data, error } = await supabase
            .from('acc_portal_email_accounts')
            .insert([{
              user_id: userData.user.id,
              email: savedEmail,
              access_token: accessToken,
              refresh_token: refreshToken,
              expiry_date: expiryDate,
              label: savedEmail.split('@')[0],
              auth_type: 'gmail'
            }])
            .select();

          if (error) throw error;

          const newAccount: Account = {
            id: data?.[0]?.id || generateUniqueId('account'),
            label: savedEmail.split('@')[0],
            email: savedEmail,
            icon: <Mail className="h-4 w-4" />,
            status: 'active',
            lastSync: new Date().toISOString(),
            accessToken,
            refreshToken
          };

          setLocalAccounts(prev => [...prev, newAccount]);
          toast.success(`Gmail account ${savedEmail} connected successfully!`);
        } catch (error) {
          console.error('Error:', error);
          toast.error('Failed to connect Gmail account');
        } finally {
          sessionStorage.removeItem(`oauth_state_${matchingAuth.index}`);
          sessionStorage.removeItem(`oauth_email_${matchingAuth.index}`);
        }
      };

      window.addEventListener('message', handleMultipleCallbacks);

      // Cleanup
      setTimeout(() => {
        window.removeEventListener('message', handleMultipleCallbacks);
        setIsLoading(false);
      }, 30000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect Gmail accounts');
      setIsLoading(false);
    }
  };

  const filteredAccounts = React.useMemo(() =>
    localAccounts.filter(account =>
      account.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [localAccounts, searchQuery]
  );

  return (
    <Select value={selectedAccount} onValueChange={handleAccountSelection}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
          "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
          "border-2 hover:bg-accent"
        )}
        aria-label="Select Gmail account"
      >
        <SelectValue placeholder="Select an account">
          {localAccounts.find((account) => account.email === selectedAccount)?.icon}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {localAccounts.find((account) => account.email === selectedAccount)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-[300px]">
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
            className="w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground"
            onClick={() => setIsAddAccountOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Gmail Account
          </Button>
          <Separator className="my-2" />

          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {filteredAccounts.map((account, index) => {
                const key = account.id || generateUniqueId(`account-${index}`);
                return (
                  <SelectItem
                    key={key}
                    value={account.email}
                    className="cursor-pointer rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                      {account.icon}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{account.label}</span>
                          <Badge
                            variant={
                              account.status === 'active'
                                ? 'default'
                                : account.status === 'authenticating'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="ml-2"
                          >
                            {account.status === 'active' ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : account.status === 'authenticating' ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            {account.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{account.email}</span>
                        {account.lastSync && (
                          <span className="text-xs text-muted-foreground">
                            Last synced: {new Date(account.lastSync).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SelectContent>

      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Connect Gmail Account</DialogTitle>
            <DialogDescription>
              Add one or multiple Gmail accounts to manage them in one place
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Account</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Accounts</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <form onSubmit={handleAddSingleAccount} className="flex gap-4 py-4">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Gmail Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your Gmail address"
                      className="focus-visible:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">App Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your Gmail app password"
                      className="focus-visible:ring-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      Use an App Password from your Google Account settings
                    </span>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Account'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="multiple">
              <form onSubmit={handleAddMultipleAccounts} className="grid grid-cols-3 gap-4 py-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={`account-form-${index}`}
                    className="space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Gmail Account {index}</h4>
                      {index > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-destructive/90 hover:text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Gmail Address</Label>
                      <Input
                        id={`email-${index}`}
                        name={`email-${index}`}
                        type="email"
                        placeholder="Enter Gmail address"
                        className="focus-visible:ring-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`password-${index}`}>App Password</Label>
                      <Input
                        id={`password-${index}`}
                        name={`password-${index}`}
                        type="password"
                        placeholder="Enter app password"
                        className="focus-visible:ring-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        Use an App Password from your Google Account settings
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  type="submit"
                  className="col-span-3 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting Accounts...
                    </>
                  ) : (
                    'Connect Accounts'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Select>
  );
}