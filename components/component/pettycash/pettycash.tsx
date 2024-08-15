/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Cog, Download } from 'lucide-react';
import BranchesTab from './branches';
import UsersTab from './users';
import AccountsTab from './accounts';
import { TransactionsTab } from './entries';

const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9lZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

export function PettyCashManager() {
  const { userId } = useUser();
  const [currentTab, setCurrentTab] = useState('accounts');
  const [currentSettingsTab, setCurrentSettingsTab] = useState('accounts');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accountsToReplenish, setAccountsToReplenish] = useState([]);
  const [settings, setSettings] = useState({
    branches: {
      enableGeoTagging: false,
      branchCodePrefix: 'BR',
    },
    users: {
      enableTwoFactorAuth: false,
      passwordExpiryDays: 90,
    },
    accounts: {
      enableMultiCurrency: true,
      defaultCurrency: 'KES',
      userLimits: [],
    },
    transactions: {
      requireApproval: true,
      attachmentRequired: true,
    },
  });

  useEffect(() => {
    fetchAccountsToReplenish();
  }, []);

  const handleUserLimitChange = useCallback((index, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: prevSettings.accounts.userLimits.map((limit, i) => 
          i === index ? { ...limit, [field]: value } : limit
        ),
      },
    }));
  }, []);
  
  const handleAddUserLimit = useCallback(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: [
          ...prevSettings.accounts.userLimits,
          { userName: '', accountType: '', limit: 0 },
        ],
      },
    }));
  }, []);
  
  const handleRemoveUserLimit = useCallback((index) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: prevSettings.accounts.userLimits.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const fetchAccountsToReplenish = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_name, balance, currency, users(name)')
      .lt('balance', 1000)
      .order('balance', { ascending: true });
    
    if (error) {
      console.error('Error fetching accounts to replenish:', error);
    } else {
      setAccountsToReplenish(data);
    }
  };

  // const handleSettingChange = useCallback((tab, setting, value) => {
  //   setSettings(prevSettings => ({
  //     ...prevSettings,
  //     [tab]: {
  //       ...prevSettings[tab],
  //       [setting]: value,
  //     },
  //   }));
  // }, []);

  const handleReplenishAll = () => {
    // Implement the logic to replenish all accounts
    console.log('Replenishing all accounts');
  };

  const handleReplenishAccount = (accountId) => {
    // Implement the logic to replenish a specific account
    console.log('Replenishing account', accountId);
  };

  const handleExportToExcel = () => {
    // Implement the logic to export the replenishment data to Excel
    console.log('Exporting to Excel');
  };

  const SettingsDialog = () => (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogTrigger asChild>
        <Button className="absolute top-3 right-3 bg-blue-600 text-white" onClick={() => setIsSettingsOpen(true)}>
          <Cog className="mr-1.5 h-3 w-3" />
          Settings
        </Button>
      </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] p-0" onInteractOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col h-[600px]">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Petty Cash Settings</DialogTitle>
            <DialogDescription>
              Adjust settings for branches, users, accounts, and transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex overflow-hidden">
          <Tabs defaultValue={currentSettingsTab}  className="flex w-full">
              <TabsList className="flex flex-col w-36 space-y-1.5 mt-14 border-r gap-2">
                {['accounts', 'transactions', 'replenishment','reports'].map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className="justify-center px-3 py-1.5 w-36 hover:bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Separator orientation="vertical" className="h-2/3 m-3" />

              <div className="flex-1 overflow-auto">
                <ScrollArea className="h-full p-4">
                <TabsContent value="accounts" className="space-y-4">
  <Card className="p-4">
    <h3 className="text-sm font-medium mb-2">General Account Settings</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="enableMultiCurrency" className="text-xs">Multi-Currency Support</Label>
        <Switch
          id="enableMultiCurrency"
          checked={settings.accounts.enableMultiCurrency}
          onCheckedChange={(checked) => handleSettingChange('accounts', 'enableMultiCurrency', checked)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="defaultCurrency" className="text-xs whitespace-nowrap">Default Currency</Label>
        <Input
          id="defaultCurrency"
          value={settings.accounts.defaultCurrency}
          onChange={(e) => handleSettingChange('accounts', 'defaultCurrency', e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  </Card>

  <Card className="p-4">
    <h3 className="text-sm font-medium mb-2">User Account Limits</h3>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">User</TableHead>
          <TableHead className="text-xs">Account Type</TableHead>
          <TableHead className="text-xs">Limit</TableHead>
          <TableHead className="text-xs w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {settings.accounts.userLimits?.map((limit, index) => (
          <TableRow key={index}>
            <TableCell className="py-2">
              <Input
                value={limit.userName}
                onChange={(e) => handleUserLimitChange(index, 'userName', e.target.value)}
                className="h-7 text-xs"
              />
            </TableCell>
            <TableCell className="py-2">
              <Input
                value={limit.accountType}
                onChange={(e) => handleUserLimitChange(index, 'accountType', e.target.value)}
                className="h-7 text-xs"
              />
            </TableCell>
            <TableCell className="py-2">
              <Input
                type="number"
                value={limit.limit}
                onChange={(e) => handleUserLimitChange(index, 'limit', e.target.value)}
                className="h-7 text-xs w-20"
              />
            </TableCell>
            <TableCell className="py-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveUserLimit(index)}
                className="h-7 text-xs px-2"
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Button onClick={handleAddUserLimit} className="mt-2 h-7 text-xs">Add User Limit</Button>
  </Card>
</TabsContent>
                  <TabsContent value="transactions">
                    <Card>
                      <CardContent className="space-y-3 pt-4">
                        <h3 className="text-base font-medium">Transaction Settings</h3>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireApproval">Require Approval for Transactions</Label>
                          <Switch
                            id="requireApproval"
                            checked={settings.transactions.requireApproval}
                            // onCheckedChange={(checked) => handleSettingChange('transactions', 'requireApproval', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="attachmentRequired">Require Attachment for Transactions</Label>
                          <Switch
                            id="attachmentRequired"
                            checked={settings.transactions.attachmentRequired}
                            // onCheckedChange={(checked) => handleSettingChange('transactions', 'attachmentRequired', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="replenishment">
                    <Card>
                      <CardContent className="space-y-3 pt-4">
                        <h3 className="text-base font-medium">Accounts to Replenish</h3>
                        <div className="flex justify-between mb-3">
                          <Button onClick={handleReplenishAll}>Replenish All</Button>
                          <Button onClick={handleExportToExcel} className="flex items-center">
                            <Download className="mr-1.5 h-3 w-3" />
                            Export to Excel
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account ID</TableHead>
                              <TableHead>Account Name</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Current Balance</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accountsToReplenish.map((account) => (
                              <TableRow key={account.id}>
                                <TableCell>{account.id}</TableCell>
                                <TableCell>{account.account_name}</TableCell>
                                <TableCell>{account.users.name}</TableCell>
                                <TableCell>{account.balance}</TableCell>
                                <TableCell>{account.currency}</TableCell>
                                <TableCell>
                                  <Button onClick={() => handleReplenishAccount(account.id)}>Replenish</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex w-full bg-muted/40">
      <main className="flex-1 p-6 w-full">
        <Card className="mb-6 relative">
          <CardHeader>
            <CardTitle>Petty Cash Manager</CardTitle>
            <CardDescription>
              Manage your company's petty cash, branches, users, accounts, and transactions.
            </CardDescription>
          </CardHeader>
          <SettingsDialog 
          handleUserLimitChange={handleUserLimitChange}
          handleAddUserLimit={handleAddUserLimit}
          handleRemoveUserLimit={handleRemoveUserLimit}/>
        </Card>

        <Tabs defaultValue="transactions" onValueChange={setCurrentTab}>
          <TabsList>
            {['branches', 'users', 'accounts', 'transactions', 'reports'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="hover:bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors bg-white shadow-lg"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="branches">
            <BranchesTab supabase={supabase} userId={userId} settings={settings.branches} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab supabase={supabase} userId={userId} settings={settings.users} />
          </TabsContent>
          <TabsContent value="accounts">
            <AccountsTab supabase={supabase} userId={userId} settings={settings.accounts} />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionsTab settings={settings.transactions} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default PettyCashManager;