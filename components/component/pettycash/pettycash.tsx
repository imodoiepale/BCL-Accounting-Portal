/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Cog } from 'lucide-react';
import { BranchesTab } from './branches';
import { UsersTab } from './users';
import { AccountsTab } from './accounts';
import { TransactionsTab } from './entries';
import { PettyCashSettings } from './settings';
import SuppliersTab from './suppliers';
import PettyCashReportsTab from './reports';
import ReimbursementsTab from './ReimbursementsTab';
import LoansTab from './LoansTab';

const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

export function PettyCashManager() {
  const { userId } = useAuth();
  const [currentTab, setCurrentTab] = useState('accounts');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accountsToReplenish, setAccountsToReplenish] = useState([]);
  const [settings, setSettings] = useState({
    accounts: {
      enableMultiCurrency: true,
      defaultCurrency: 'USD',
      userLimits: [],
    },
    transactions: {
      requireApproval: true,
      attachmentRequired: true,
    },
    reports: {
      viewOptions: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
      defaultView: 'Monthly',
      autoGenerate: false,
      generateFrequency: 'monthly',
      includeTransactions: true,
      includeBalances: true,
      includeCharts: false,
      dataRetentionMonths: 12,
      generationDate: new Date(),
    },
    categories: [
      { type: 'Expense', name: 'Fuel' },
      { type: 'Expense', name: 'Office Supplies' },
      { type: 'Expense', name: 'Travel' },
      { type: 'Expense', name: 'Meals' },
    ],
  });

  useEffect(() => {
    fetchAccountsToReplenish();
  }, []);

  const fetchAccountsToReplenish = async () => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_accounts')
      .select('id, account_type, balance, currency, acc_portal_pettycash_users(name)')
      .lt('balance', 1000)
      .order('balance', { ascending: true });

    if (error) {
      console.error('Error fetching accounts to replenish:', error);
    } else {
      setAccountsToReplenish(data);
    }
  };

  const handleReplenishAll = () => {
    console.log('Replenishing all accounts');
  };

  const handleReplenishAccount = (accountId) => {
    console.log('Replenishing account', accountId);
  };

  const handleExportToExcel = () => {
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
      <DialogContent className="sm:max-w-7xl max-h-5xl p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Petty Cash Settings</DialogTitle>
          <DialogDescription>
            Adjust settings for branches, users, accounts, and transactions.
          </DialogDescription>
        </DialogHeader>
        <PettyCashSettings
          settings={settings}
          setSettings={setSettings}
          accountsToReplenish={accountsToReplenish}
          handleReplenishAll={handleReplenishAll}
          handleReplenishAccount={handleReplenishAccount}
          handleExportToExcel={handleExportToExcel}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className=" w-full bg-muted/40">
      <main className="flex-1 w-full">
        <Card className="mb-6 relative">
          <CardHeader>
            <CardTitle>Petty Cash Manager</CardTitle>
            <CardDescription>
              Manage your company's petty cash, branches, users, accounts, and transactions.
            </CardDescription>
          </CardHeader>
          {/* <SettingsDialog /> */}
          <SettingsDialog 
        processedSections={[]}
        helperColumnConfigs={{
          calculation: {},
          reference: {}
        }}
        visibility={{
          sections: {},
          categories: {},
          subcategories: {}
        }}
        helperColumns={{
          calculation: {},
          reference: {}
        }}
        onHelperColumnChange={() => {}}
        mainTabs={[]}
        mainSections={{}}
        mainSubsections={{}}
        onStructureChange={() => {}}
        onVisibilityChange={() => {}}
      />
        </Card>


        <Tabs defaultValue="transactions" onValueChange={setCurrentTab}>
          <TabsList>
            {['branches', 'users', 'accounts', 'suppliers', 'transactions', 'reimbursements', 'loans', 'reports'].map((tab) => (
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
          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionsTab settings={settings.transactions} />
          </TabsContent>
          <TabsContent value="reports">
            <PettyCashReportsTab />
          </TabsContent>
          <TabsContent value="reimbursements">
            <ReimbursementsTab />
          </TabsContent>
          <TabsContent value="loans">
            <LoansTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default PettyCashManager;