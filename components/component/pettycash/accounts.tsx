// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function AccountsTab() {
  const { userId } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [newAccount, setNewAccount] = useState({
    branch_id: '',
    account_number: '',
    // account_name: '',
    account_type: '',
    balance: '',
    min_amount: '',
    max_amount: '',
    currency: '',
    status: 'Active',
    userid: '',
  });

  useEffect(() => {
    fetchAccounts();
    fetchBranches();
    fetchUsers();
  }, []);

  // Update the table name in the fetchAccounts function
const fetchAccounts = async () => {
  const { data, error } = await supabase
    .from('acc_portal_pettycash_accounts')
    .select('*, acc_portal_pettycash_branches(branch_name), acc_portal_pettycash_users(name)')
    .eq('admin_id', userId)
    .order('id', { ascending: true });
  if (error) console.error('Error fetching accounts:', error);
  else setAccounts(data);
};

// Update the table name in the fetchBranches function
const fetchBranches = async () => {
  const { data, error } = await supabase
    .from('acc_portal_pettycash_branches')
    .select('id, branch_name')
    .eq('userid', userId);
  if (error) console.error('Error fetching branches:', error);
  else setBranches(data);
};

// Update the table name in the fetchUsers function
const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('acc_portal_pettycash_users')
    .select('id, name')
    .eq('admin_id', userId);
  if (error) console.error('Error fetching users:', error);
  else setUsers(data);
};

// Update the table name in the handleSubmit function
const handleSubmit = async () => {
  const { data, error } = await supabase
    .from('acc_portal_pettycash_accounts')
    .insert([{ ...newAccount, admin_id: userId }]);

  if (error) console.error('Error adding account:', error);
  else {
    fetchAccounts();
    setNewAccount({
      branch_id: '',
      account_number: '',
      // account_name: '',
      account_type: '',
      balance: '',
      min_amount: '',
      max_amount: '',
      currency: '',
      status: 'Active',
      userid: '',
    });
  }
};

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setNewAccount((prev) => ({ ...prev, [id]: value }));
  };

  
  const formFields = [
    { id: 'branch_id', label: 'Branch', type: 'select', options: branches.map(branch => ({ value: branch.id, label: branch.branch_name })) },
    { id: 'userid', label: 'User', type: 'select', options: users.map(user => ({ value: user.id, label: user.name })) },
    // { id: 'account_name', label: 'Account Name', type: 'text', placeholder: 'Enter account name' },
    { id: 'account_type', label: 'Account Type', type: 'select', options: [ { value: 'Cash', label: 'Cash' }, { value: 'Mpesa', label: 'Mpesa' }, { value: 'Debit Card', label: 'Debit Card' }, { value: 'Credit Card', label: 'Credit Card' }, { value: 'Bank', label: 'Bank' }] },
    { id: 'account_number', label: 'Account Number', type: 'text', placeholder: 'Enter account number' },
    { id: 'balance', label: 'Float Balance', type: 'number', placeholder: 'Enter initial float balance' },
    { id: 'min_amount', label: 'Minimum Amount', type: 'number', placeholder: 'Enter minimum amount' },
    { id: 'max_amount', label: 'Maximum Amount', type: 'number', placeholder: 'Enter maximum amount' },
    { id: 'currency', label: 'Currency', type: 'select', options: [{ value: 'KES', label: 'KES' },{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }] },
    { id: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
  ];

  const tableFields = [
    { label: 'Account ID', key: 'id', format: (id) => `AC-${id}` },
    { label: 'Branch Name', key: 'acc_portal_pettycash_branches.branch_name' },
    { label: 'User', key: 'acc_portal_pettycash_users.name' },
    { label: 'Account Type', key: 'account_type' },
    { label: 'Account Number', key: 'account_number' },
    { label: 'Currency', key: 'currency' },
    { label: 'Float Balance', key: 'balance', format: (balance) => `${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Min Amount', key: 'min_amount', format: (amount) => `${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Max Amount', key: 'max_amount', format: (amount) => `${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },   
    { label: 'Created Date', key: 'created_date', format: (date) => formatDate(date) },
    { label: 'Status', key: 'status' },
  ];

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <h1 className="text-xl font-semibold mb-4">Accounts</h1>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="Search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchAccounts}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Account</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Account</SheetTitle>
                  <SheetDescription>
                    Enter the details of the new account.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  {formFields.map(({ id, label, type, placeholder, options }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      {type === 'select' ? (
                        <Select onValueChange={(value) => handleSelectChange(id, value)} value={newAccount[id]}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={id}
                          type={type}
                          placeholder={placeholder}
                          value={newAccount[id]}
                          onChange={handleInputChange}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {tableFields.map(({ label }) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  {tableFields.map(({ key, format }) => (
                    <TableCell key={key}>
                      {format ? format(account[key]) : key.includes('.') ? account[key.split('.')[0]][key.split('.')[1]] : account[key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" className="flex items-center">
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <span>1</span>
          <Button variant="outline" className="flex items-center">
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

export default AccountsTab;