// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BranchesTab from './branches';
import UsersTab from './users';
import AccountsTab from './accounts';
import { TransactionsTab } from './entries';


// Initialize Supabase client
const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

export function PettyCashManager() {
  const { userId } = useUser();
  const [currentTab, setCurrentTab] = useState('branches');

  return (
    <div className="flex w-full bg-muted/40">
      <main className="flex-1 p-6 w-full">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Petty Cash Manager</CardTitle>
            <CardDescription>
              Manage your companys petty cash, branches, users, accounts, and transactions.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="branches">
            <BranchesTab supabase={supabase} userId={userId} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab supabase={supabase} userId={userId} />
          </TabsContent>
          <TabsContent value="accounts">
            <AccountsTab supabase={supabase} userId={userId} />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionsTab  />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default PettyCashManager;