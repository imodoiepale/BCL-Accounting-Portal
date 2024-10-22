// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import { TableActions } from './TableActions';
import { PettyCashService } from './PettyCashService';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export function AccountsTab() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    branch_id: '',
    account_number: '',
    account_type: '',
    balance: '',
    min_amount: '',
    max_amount: '',
    currency: 'USD',
    status: 'Active',
    userid: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accountsData, branchesData, usersData] = await Promise.all([
        PettyCashService.fetchRecords('acc_portal_pettycash_accounts', userId, {
          select: '*, acc_portal_pettycash_branches(branch_name), acc_portal_pettycash_users(name)'
        }),
        PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId),
        PettyCashService.fetchRecords('acc_portal_pettycash_users', userId)
      ]);
      setAccounts(accountsData);
      setBranches(branchesData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreate = async () => {
    const result = await PettyCashService.createRecord('acc_portal_pettycash_accounts', newAccount, userId);
    if (result) {
      setNewAccount({
        branch_id: '',
        account_number: '',
        account_type: '',
        balance: '',
        min_amount: '',
        max_amount: '',
        currency: 'USD',
        status: 'Active',
        userid: '',
      });
      setIsSheetOpen(false);
      fetchData();
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
    {
      id: 'branch_id',
      label: 'Branch',
      type: 'select',
      options: branches.map(branch => ({
        value: branch.id.toString(),
        label: branch.branch_name
      }))
    },
    {
      id: 'userid',
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: user.id.toString(),
        label: user.name
      }))
    },
    {
      id: 'account_type',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: 'Cash', label: 'Cash' },
        { value: 'Mpesa', label: 'Mpesa' },
        { value: 'Debit Card', label: 'Debit Card' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Bank', label: 'Bank' }
      ]
    },
    { id: 'account_number', label: 'Account Number', type: 'text' },
    { id: 'balance', label: 'Float Balance', type: 'number' },
    { id: 'min_amount', label: 'Minimum Amount', type: 'number' },
    { id: 'max_amount', label: 'Maximum Amount', type: 'number' },
    {
      id: 'currency',
      label: 'Currency',
      type: 'select',
      options: [
        { value: 'KES', label: 'KES' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'GBP', label: 'GBP' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
  ];

  const EditForm = (account, onSave) => {
    const [editData, setEditData] = useState(account);

    const handleSubmit = async () => {
      const result = await PettyCashService.updateRecord('acc_portal_pettycash_accounts', account.id, editData);
      if (result) {
        onSave();
        fetchData();
      }
    };

    return (
      <div className="flex flex-col pt-4 gap-4">
        {formFields.map(({ id, label, type, options }) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id}>{label}</Label>
            {type === 'select' ? (
              <Select
                value={editData[id]?.toString()}
                onValueChange={(value) => setEditData({ ...editData, [id]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={id}
                type={type}
                value={editData[id]}
                onChange={(e) => setEditData({ ...editData, [id]: e.target.value })}
                className="h-8"
              />
            )}
          </div>
        ))}
        <Button onClick={handleSubmit} className="bg-blue-600 text-white mt-4">
          Save Changes
        </Button>
      </div>
    );
  };

  const tableFields = [
    { label: 'ID', key: 'id', format: (id) => `AC-${id}` },
    { label: 'Branch', key: 'acc_portal_pettycash_branches.branch_name' },
    { label: 'User', key: 'acc_portal_pettycash_users.name' },
    { label: 'Type', key: 'account_type' },
    { label: 'Number', key: 'account_number' },
    {
      label: 'Balance',
      key: 'balance',
      format: (balance, row) => formatCurrency(balance, row.currency)
    },
    { label: 'Status', key: 'status' },
    {
      label: 'Actions',
      key: 'actions',
      format: (_, account) => (
        <TableActions
          row={account}
          onEdit={(data) => PettyCashService.updateRecord('acc_portal_pettycash_accounts', account.id, data)}
          onDelete={() => PettyCashService.deleteRecord('acc_portal_pettycash_accounts', account.id)}
          onVerify={() => PettyCashService.verifyRecord('acc_portal_pettycash_accounts', account.id)}
          isVerified={account.is_verified}
          editForm={EditForm}
        />
      ),
    },
  ];

  const filteredAccounts = accounts.filter(account =>
    account.account_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.acc_portal_pettycash_users?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search accounts..."
              className="w-64 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="outline"
              className="h-8 px-2 flex items-center"
              onClick={fetchData}
            >
              <RefreshCwIcon className="w-4 h-4" />
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white h-8">Add Account</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Account</SheetTitle>
                  <SheetDescription>Create a new petty cash account</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-3">
                  {formFields.map(({ id, label, type, options }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      {type === 'select' ? (
                        <Select onValueChange={(value) => handleSelectChange(id, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={id}
                          type={type}
                          value={newAccount[id]}
                          onChange={handleInputChange}
                          className="h-8"
                        />
                      )}
                    </div>
                  ))}
                  <Button onClick={handleCreate} className="bg-blue-600 text-white mt-2">
                    Create Account
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableFields.map(({ label }) => (
                    <TableHead key={label} className="py-2 px-3 text-xs whitespace-nowrap">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={tableFields.length} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableFields.length} className="text-center">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      {tableFields.map(({ key, format }) => (
                        <TableCell key={key} className="py-2 px-3 text-xs whitespace-nowrap">
                          {format ? format(account[key], account) :
                            key.includes('.') ?
                              account[key.split('.')[0]]?.[key.split('.')[1]] :
                              account[key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default AccountsTab;