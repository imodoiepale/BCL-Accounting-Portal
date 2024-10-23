// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCwIcon, Search } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { formatCurrency } from './currency';

interface Account {
  id: string;
  admin_id: string;
  branch_id: number;
  userid: number;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
  created_date: string;
  account_number: string;
  min_amount: number;
  max_amount: number;
  is_verified?: boolean;
  acc_portal_pettycash_branches?: {
    branch_name: string;
  };
  acc_portal_pettycash_users?: {
    name: string;
  };
}

interface Branch {
  id: number;
  branch_name: string;
}

interface User {
  id: number;
  name: string;
}

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSave: (account: Account) => Promise<void>;
  mode: 'create' | 'edit';
  branches: Branch[];
  users: User[];
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  mode,
  branches,
  users
}) => {
  const [formData, setFormData] = useState<Account | null>(account);

  useEffect(() => {
    setFormData(account);
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save account');
      console.error('Error saving account:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      };
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const formFields = [
    {
      name: 'branch_id',
      label: 'Branch',
      type: 'select',
      options: branches.map(branch => ({
        value: branch.id.toString(),
        label: branch.branch_name
      })),
      required: true
    },
    {
      name: 'userid',
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: user.id.toString(),
        label: user.name
      })),
      required: true
    },
    {
      name: 'account_type',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: 'Cash', label: 'Cash' },
        { value: 'M-Pesa', label: 'M-Pesa' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Debit Card', label: 'Debit Card' }
      ],
      required: true
    },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true },
    { name: 'balance', label: 'Balance', type: 'number', required: true },
    { name: 'min_amount', label: 'Minimum Amount', type: 'number', required: true },
    { name: 'max_amount', label: 'Maximum Amount', type: 'number', required: true },
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      options: [
        { value: 'KES', label: 'KES' },
        { value: 'USD', label: 'USD' },
        { value: 'GBP', label: 'GBP' },
        { value: 'EUR', label: 'EUR' }
      ],
      required: true
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Suspended', label: 'Suspended' }
      ],
      required: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Account' : 'Edit Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(({ name, label, type, options, required }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              {type === 'select' ? (
                <Select
                  value={formData?.[name]?.toString()}
                  onValueChange={(value) => handleSelectChange(name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={name}
                  name={name}
                  type={type}
                  value={formData?.[name] || ''}
                  onChange={handleInputChange}
                  className="h-8"
                  required={required}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8 bg-blue-600 text-white"
            >
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export function AccountsTab() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    account: Account | null;
  }>({
    isOpen: false,
    mode: 'create',
    account: null
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accountsData, branchesData, usersData] = await Promise.all([
        PettyCashService.fetchRecords('acc_portal_pettycash_accounts', userId),
        PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId),
        PettyCashService.fetchRecords('acc_portal_pettycash_users', userId)
      ]);
      setAccounts(accountsData);
      setBranches(branchesData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreateAccount = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      account: {
        id: '',
        admin_id: userId,
        branch_id: null,
        userid: null,
        account_type: '',
        balance: 0,
        currency: 'KES',
        status: 'Active',
        created_date: new Date().toISOString(),
        account_number: '',
        min_amount: 0,
        max_amount: 0
      }
    });
  };

  const handleEditAccount = (account: Account) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      account
    });
  };

  const handleSaveAccount = async (account: Account) => {
    try {
      if (dialogState.mode === 'create') {
        await PettyCashService.createRecord('acc_portal_pettycash_accounts', account, userId);
        toast.success('Account created successfully');
      } else {
        await PettyCashService.updateRecord('acc_portal_pettycash_accounts', account.id, account);
        toast.success('Account updated successfully');
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_accounts', account.id);
      toast.success('Account deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleVerifyAccount = async (account: Account) => {
    try {
      await PettyCashService.verifyRecord('acc_portal_pettycash_accounts', account.id);
      toast.success('Account verified successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify account');
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.account_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.acc_portal_pettycash_users?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Account No.',
      width: '120px',
      cell: (account: Account) => account.account_number
    },
    {
      header: 'Type',
      width: '100px',
      cell: (account: Account) => account.account_type
    },
    {
      header: 'Branch',
      width: '150px',
      cell: (account: Account) => account.acc_portal_pettycash_branches?.branch_name || '-'
    },
    {
      header: 'User',
      width: '150px',
      cell: (account: Account) => account.acc_portal_pettycash_users?.name || '-'
    },
    {
      header: 'Balance',
      width: '120px',
      cell: (account: Account) => formatCurrency(account.balance, account.currency)
    },
    {
      header: 'Min Amount',
      width: '120px',
      cell: (account: Account) => formatCurrency(account.min_amount, account.currency)
    },
    {
      header: 'Max Amount',
      width: '120px',
      cell: (account: Account) => formatCurrency(account.max_amount, account.currency)
    },
    {
      header: 'Status',
      width: '100px',
      cell: (account: Account) => (
        <span className={`px-2 py-1 rounded-full text-xs ${account.status === 'Active' ? 'bg-green-100 text-green-800' :
            account.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
          }`}>
          {account.status}
        </span>
      )
    },
    {
      header: 'Created Date',
      width: '120px',
      cell: (account: Account) => format(new Date(account.created_date), 'dd/MM/yyyy')
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (account: Account) => (
        <TableActions
          row={account}
          onEdit={() => handleEditAccount(account)}
          onDelete={() => handleDeleteAccount(account)}
          onVerify={() => handleVerifyAccount(account)}
          isVerified={account.is_verified}
        />
      )
    }
  ];

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="h-8"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateAccount}
              className="h-8 bg-blue-600 text-white"
            >
              Add New Account
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  {columnDefinitions.map((col, index) => (
                    <TableHead
                      key={index}
                      style={{ width: col.width }}
                      className="text-white h-8 text-xs font-medium border-r border-blue-500 last:border-r-0"
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      Loading accounts...
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account, index) => (
                    <TableRow
                      key={account.id}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${account.id}-${colIndex}`}
                          style={{ width: col.width }}
                          className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                        >
                          {col.cell(account, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <AccountDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, mode: 'create', account: null })}
          account={dialogState.account}
          onSave={handleSaveAccount}
          mode={dialogState.mode}
          branches={branches}
          users={users}
        />

      </main>
    </div>
  );
}

export default AccountsTab;