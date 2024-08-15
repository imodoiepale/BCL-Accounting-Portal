// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from 'lucide-react';

// Initialize Supabase client (use your actual Supabase URL and anon key)
const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');


const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

 
export default function PettyCash() {
  // const { userId } = useUser();
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [currentTab, setCurrentTab] = useState('transactions');

  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const [newAccount, setNewAccount] = useState({ name: '', type: '', initial_balance: '' });
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    account_id: '',
    transaction_type: '',
    date: '',
  });

  useEffect(() => {
    fetchBranches();
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from('petty_cash_branches').select('*');
    if (error) console.error('Error fetching branches:', error);
    else setBranches(data);
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('petty_cash_accounts').select('*');
    if (error) console.error('Error fetching accounts:', error);
    else setAccounts(data);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('petty_cash_transactions').select('*');
    if (error) console.error('Error fetching transactions:', error);
    else setTransactions(data);
  };

  const handleInputChange = (setter) => (e) => {
    const { id, value } = e.target;
    setter(prev => ({ ...prev, [id]: value }));
  };

  const AccountCard = ({ title, allocated, used, balance }) => (
    <Card className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-between h-20">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="outline">Replenish</Button>
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span>Allocated: {allocated}</span>
        <span>Used: {used}</span>
        <span>Balance: {balance}</span>
      </div>
    </Card>
  );
  

  const handleSelectChange = (setter, field) => (value) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (table, data, resetState) => {
    const { data: result, error } = await supabase.from(table).insert([data]);
    if (error) console.error(`Error adding ${table}:`, error);
    else {
      resetState();
      if (table === 'branches') fetchBranches();
      else if (table === 'accounts') fetchAccounts();
      else if (table === 'transactions') fetchTransactions();
    }
  };

  return (
    <div className="flex flex-col w-full bg-gray-100 p-6">
      <h1 className="text-2xl font-semibold mb-4">Petty Cash Management</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <AccountCard title="Cash" allocated={10000} used={2500} balance={7500} />
        <AccountCard title="MPesa" allocated={5000} used={1500} balance={3500} />
        <AccountCard title="Credit Card" allocated={2000} used={500} balance={1500} />
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Branches</h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button><PlusCircleIcon className="w-4 h-4 mr-2" /> Add Branch</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Branch</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Branch Name</Label>
                    <Input id="name" value={newBranch.name} onChange={handleInputChange(setNewBranch)} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={newBranch.location} onChange={handleInputChange(setNewBranch)} />
                  </div>
                  <Button onClick={() => handleSubmit('branches', newBranch, () => setNewBranch({ name: '', location: '' }))}>
                    Add Branch
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Accounts</h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button><PlusCircleIcon className="w-4 h-4 mr-2" /> Add Account</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Account</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Account Name</Label>
                    <Input id="name" value={newAccount.name} onChange={handleInputChange(setNewAccount)} />
                  </div>
                  <div>
                    <Label htmlFor="type">Account Type</Label>
                    <Select onValueChange={handleSelectChange(setNewAccount, 'type')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">MPesa</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="initial_balance">Initial Balance</Label>
                    <Input id="initial_balance" type="number" value={newAccount.initial_balance} onChange={handleInputChange(setNewAccount)} />
                  </div>
                  <Button onClick={() => handleSubmit('accounts', newAccount, () => setNewAccount({ name: '', type: '', initial_balance: '' }))}>
                    Add Account
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell>{account.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button><PlusCircleIcon className="w-4 h-4 mr-2" /> Add Transaction</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Transaction</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" value={newTransaction.amount} onChange={handleInputChange(setNewTransaction)} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={newTransaction.description} onChange={handleInputChange(setNewTransaction)} />
                  </div>
                  <div>
                    <Label htmlFor="account_id">Account</Label>
                    <Select onValueChange={handleSelectChange(setNewTransaction, 'account_id')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transaction_type">Transaction Type</Label>
                    <Select onValueChange={handleSelectChange(setNewTransaction, 'transaction_type')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={newTransaction.date} onChange={handleInputChange(setNewTransaction)} />
                  </div>
                  <Button onClick={() => handleSubmit('transactions', newTransaction, () => setNewTransaction({
                    amount: '',
                    description: '',
                    account_id: '',
                    transaction_type: '',
                    date: '',
                  }))}>
                    Add Transaction
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{accounts.find(a => a.id === transaction.account_id)?.name}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}