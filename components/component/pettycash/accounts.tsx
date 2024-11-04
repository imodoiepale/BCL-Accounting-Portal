// @ts-nocheck

"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { RefreshCwIcon, Search, Plus } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { Badge } from "@/components/ui/badge";

// Constants
const ACCOUNT_TYPES = [
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Personal', label: 'Personal' }
];

const CASH_TYPES = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Mpesa', label: 'Mpesa' },
  { value: 'Card', label: 'Card' },
  { value: 'Credit', label: 'Credit' }
];
 
// Types
interface AccountData {
  id?: string;
  accountUser: string;
  pettyCashType: string;
  accountNumber: string;
  accountType: string;
  minFloatBalance: number;
  minFloatAlert: number;
  maxOpeningFloat: number;
  approvedLimitAmount: number;
  startDate: string;
  endDate: string | null;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountData | null;
  onSave: (account: AccountData) => Promise<void>;
  mode: 'create' | 'edit';
  users: { value: string; label: string; }[];
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  mode,
  users
}) => {
  const initialFormData: AccountData = {
    accountUser: '',
    pettyCashType: '',
    accountNumber: '',
    accountType: 'Corporate',
    minFloatBalance: 0,
    minFloatAlert: 0,
    maxOpeningFloat: 0,
    approvedLimitAmount: 0,
    startDate: new Date().toISOString(),
    endDate: null,
    status: 'Active'
  };

  const [formData, setFormData] = useState<AccountData>(initialFormData);

  useEffect(() => {
    setFormData(mode === 'create' ? initialFormData : account || initialFormData);
  }, [account, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAccountData = (data: AccountData) => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.accountUser) errors.push('Account User is required');
  if (!data.pettyCashType) errors.push('Petty Cash Type is required');
  if (!data.accountNumber) errors.push('Account Number is required');
  if (!data.accountType) errors.push('Account Type is required');

  // Numeric fields validation
  if (isNaN(Number(data.minFloatBalance))) errors.push('Minimum Float Balance must be a number');
  if (isNaN(Number(data.minFloatAlert))) errors.push('Minimum Float Alert must be a number');
  if (isNaN(Number(data.maxOpeningFloat))) errors.push('Maximum Opening Float must be a number');
  if (isNaN(Number(data.approvedLimitAmount))) errors.push('Approved Limit Amount must be a number');

  // Date validation
  if (!data.startDate) errors.push('Start Date is required');
  if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push('End Date must be after Start Date');
  }

  return errors;
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const validationErrors = validateAccountData(formData);
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
  
    try {
      await onSave({
        ...formData,
        id: formData.id || account?.id, // Ensure ID is passed
      });
      onClose();
    } catch (error) {
      toast.error('Failed to save account');
      console.error('Error saving account:', error);
    }
  };
    const formFields = [
      {
        name: 'accountUser',
        label: 'Account User',
        type: 'select',
        options: users,
        required: true
      },
      {
        name: 'pettyCashType',
        label: 'Petty Cash Type',
        type: 'select',
        options: CASH_TYPES,
        required: true
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        disabled: formData.pettyCashType === 'Cash'
      },
      {
        name: 'accountType',
        label: 'Account Type',
        type: 'select',
        options: ACCOUNT_TYPES,
        required: true
      },
      {
        name: 'minFloatBalance',
        label: 'Minimum Float Balance',
        type: 'number',
        required: true
      },
      {
        name: 'minFloatAlert',
        label: 'Minimum Float Alert',
        type: 'number',
        required: true
      },
      {
        name: 'maxOpeningFloat',
        label: 'Maximum Opening Float',
        type: 'number',
        required: true
      },
      {
        name: 'approvedLimitAmount',
        label: 'Approved Limit Amount',
        type: 'number',
        required: true
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true
      },
      {
        name: 'endDate',
        label: 'End Date',
        type: 'date',
        required: false
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ],
        required: true,
        disabled: formData.endDate ? true : false
      }
    ];

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add New Account' : 'Edit Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {formFields.map(({ name, label, type, options, required, disabled }) => (
                <div key={name} className="space-y-2 px-2 rounded-lg">
                  <Label htmlFor={name} className="font-medium">{label}{required && ' *'}</Label>
                  {type === 'select' ? (
                    <Select
                      value={formData[name]?.toString()}
                      onValueChange={(value) => {
                        handleSelectChange(name, value);
                        if (name === 'pettyCashType' && value === 'Cash') {
                          handleInputChange({ target: { name: 'accountNumber', value: 'Cash' } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
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
                      value={formData[name]?.toString() || ''}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (name === 'endDate' && e.target.value) {
                          handleInputChange({ target: { name: 'status', value: 'Inactive' } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                      required={required}
                      disabled={disabled || (name === 'accountNumber' && formData.pettyCashType === 'Cash')}
                      className="h-9 w-full"
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                {mode === 'create' ? 'Create Account' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );};

export function AccountsTab() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'create' as const,
    account: null as AccountData | null
  });

  const fetchAccountsData = async () => {
    setIsLoading(true);
    try {
      const accountsData = await PettyCashService.fetchAccountRecords(userId);
      
      if (!accountsData || accountsData.length === 0) {
        toast.error('No data found');
        setAccounts([]);
        return;
      }
  
      const formattedAccounts = accountsData.map(account => ({
        id: account.id, // Add this line
        accountUser: account.accountUser || '',
        pettyCashType: account.pettyCashType || '',
        accountNumber: account.accountNumber || '',
        accountType: account.accountType || 'Corporate',
        minFloatBalance: Number(account.minFloatBalance) || 0,
        minFloatAlert: Number(account.minFloatAlert) || 0,
        maxOpeningFloat: Number(account.maxOpeningFloat) || 0,
        approvedLimitAmount: Number(account.approvedLimitAmount) || 0,
        startDate: account.startDate || new Date().toISOString(),
        endDate: account.endDate || null,
        status: account.status || 'Active',
        created_at: account.created_at || new Date().toISOString(),
        is_verified: account.is_verified || false // Add this
      }));
  
      setAccounts(formattedAccounts);
    } catch (error) {
      // toast.error('Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchUsers = async () => {
    try {
      const usersData = await PettyCashService.fetchUserRecords(userId);
      const formattedUsers = usersData.map(user => ({
        value: user.name,
        label: user.name
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAccountsData();
      fetchUsers();
    }
  }, [userId]);

  const handleCreateAccount = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      account: {
        id: crypto.randomUUID(),
        accountUser: '', // Changed from []
        pettyCashType: '', // Changed from []
        accountNumber: '',
        accountType: 'Corporate',
        minFloatBalance: 0,
        minFloatAlert: 0,
        maxOpeningFloat: 0,
        approvedLimitAmount: 0,
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'Active',
        created_at: new Date().toISOString(),
        is_verified: false
      }
    });
  };

  const handleEditAccount = (account: AccountData) => {
  setDialogState({
    isOpen: true,
    mode: 'edit',
    account: {
      ...account,
      id: account.id // Ensure ID is preserved
    }
  });
};

const handleDeleteAccount = async (account: AccountData) => {
  try {
    await PettyCashService.deleteAccountRecord(account.id, userId);
    toast.success('Account deleted successfully');
    fetchAccountsData();
  } catch (error) {
    console.error('Error deleting account:', error);
    toast.error('Failed to delete account');
  }
};

const handleSaveAccount = async (accountData: AccountData) => {
  try {
    if (dialogState.mode === 'create') {
      const formattedAccount = {
        ...accountData,
        id: dialogState.account?.id || crypto.randomUUID(), // Use existing ID from dialog state
        created_at: new Date().toISOString(),
        is_verified: false
      };

      const result = await PettyCashService.createAccountRecord(
        userId,
        formattedAccount
      );

      if (result) {
        toast.success('Account created successfully');
        fetchAccountsData();
      }
    } else {
      await PettyCashService.updateAccountRecord(
        accountData.id!,
        {
          ...accountData,
          updated_at: new Date().toISOString()
        },
        userId
      );
      toast.success('Account updated successfully');
      fetchAccountsData();
    }

    setDialogState({ isOpen: false, mode: 'create', account: null });
  } catch (error) {
    console.error('Error saving account:', error);
    toast.error(dialogState.mode === 'create' ? 'Failed to create account' : 'Failed to update account');
  }
};



  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Account User',
      width: '150px',
      cell: (account: AccountData) => account.accountUser || '-'
    },
    {
      header: 'Petty Cash Type',
      width: '120px',
      cell: (account: AccountData) => (
        <Badge variant="outline" className="text-xs">
          {account.pettyCashType || '-'}
        </Badge>
      )
    },
    {
      header: 'Account Number',
      width: '120px',
      cell: (account: AccountData) => account.accountNumber || '-'
    },
    {
      header: 'Account Type',
      width: '100px',
          cell: (account: AccountData) => (
            <div className="text-center">
              {account.accountType || '-'}
            </div>
          )    },
    {
      header: 'Min Float Balance',
      width: '120px',
      cell: (account: AccountData) => account.minFloatBalance?.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      }) || '-'
    },
    {
      header: 'Min Float Alert',
      width: '120px',
      cell: (account: AccountData) => account.minFloatAlert?.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      }) || '-'
    },
    {
      header: 'Max Opening Float',
      width: '120px',
      cell: (account: AccountData) => account.maxOpeningFloat?.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      }) || '-'
    },
    {
      header: 'Approved Limit',
      width: '120px',
      cell: (account: AccountData) => account.approvedLimitAmount?.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      }) || '-'
    },
    {
      header: 'Start Date',
      width: '100px',
      cell: (account: AccountData) => account.startDate ?
        format(new Date(account.startDate), 'dd/MM/yyyy') : '-'
    },
    {
      header: 'End Date',
      width: '100px',
      cell: (account: AccountData) => account.endDate ? (
        <span className="text-red-600 font-bold">
          {format(new Date(account.endDate), 'dd/MM/yyyy')}
        </span>
      ) : (
        <span className="text-green-600 font-bold">To Date</span>
      )
    },
    {
      header: 'Status',
      width: '80px',
      cell: (account: AccountData) => (
        <Badge variant={account.status === 'Active' ? 'success' : 'destructive'}>
          {account.status || '-'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (account: AccountData) => (
        <TableActions
          row={account}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
          dialogTitle="Edit Account"
          dialogDescription="Update account information"
          deleteWarning="Are you sure you want to delete this account? This action cannot be undone."
        />
      )
    }
  ];


  const filteredAccounts = accounts.filter(account => {
    const searchString = searchQuery.toLowerCase();
    return (
      account.accountNumber?.toLowerCase().includes(searchString) ||
      account.accountType?.toLowerCase().includes(searchString) ||
      account.pettyCashType?.toLowerCase().includes(searchString) ||
      account.accountUser?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="flex w-full bg-gray-100">
      
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
              onClick={fetchAccountsData}
              className="h-8"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateAccount}
              className="h-8 bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
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
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <span className="text-sm text-gray-500">Loading accounts...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-2">
                          <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">No Accounts Found</span>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchQuery
                            ? 'No accounts match your search criteria'
                            : 'Get started by adding your first account'}
                        </p>
                        {!searchQuery && (
                          <Button
                            onClick={handleCreateAccount}
                            className="mt-3 bg-blue-600 text-white"
                          >
                            Add New Account
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account, index) => (
                    <TableRow
                      key={account.id || index}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${account.id || index}-${colIndex}`}
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
          users={users}
        />
      </main>
    </div>
  );
}

export default AccountsTab;