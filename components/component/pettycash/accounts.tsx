// @ts-nocheck
"use client";


"use client";
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { RefreshCwIcon, Search, Plus, CalendarIcon, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Constants
const ACCOUNT_TYPES = [
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Personal', label: 'Personal' }
] as const;

const CASH_TYPES = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Mpesa', label: 'Mpesa' },
  { value: 'Card', label: 'Card' },
  { value: 'Credit', label: 'Credit' }
] as const;

// Types
interface AccountData {
  accountUser: string[];
  pettyCashType: ('Cash' | 'Mpesa' | 'Card')[];
  accountNumber: string;
  accountType: 'Corporate' | 'Personal';
  minFloatBalance: number;
  minFloatAlert: number;
  maxOpeningFloat: number;
  approvedLimitAmount: number;
  startDate: string;
  endDate: string | null;
  status: 'Active' | 'Inactive';
}

interface Account {
  id: string;
  userid: string;
  data: AccountData;
  created_at: string;
}

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

// MultiSelect Component
const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Select items"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select-container')) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative multi-select-container">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map(value => {
              const option = options.find(opt => opt.value === value);
              return (
                <Badge key={value} variant="secondary" className="flex items-center gap-1">
                  {option?.label || value}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selected.filter(item => item !== value));
                    }}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute mt-2 w-full z-50">
          <ScrollArea className="h-[200px] p-2">
            {options.map(option => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center p-2 cursor-pointer hover:bg-accent rounded",
                  selected.includes(option.value) ? "bg-accent" : ""
                )}
                onClick={() => toggleOption(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="mr-2"
                />
                {option.label}
              </div>
            ))}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountData | null;
  onSave: (account: AccountData) => Promise<void>;
  mode: 'create' | 'edit';
  users: Option[];
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
    accountUser: [],
    pettyCashType: [],
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

  const [formData, setFormData] = useState(mode === 'create' ? initialFormData : account);

  useEffect(() => {
    setFormData(mode === 'create' ? initialFormData : account);
  }, [account, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (!formData) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save account');
      console.error('Error saving account:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Account' : 'Edit Account'}</DialogTitle>
        </DialogHeader>
        <AccountForm 
          onSubmit={handleSubmit}
          initialData={formData}
          users={users}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
};

const AccountForm: React.FC<{
  onSubmit: (data: AccountData) => void;
  initialData?: AccountData | null;
  users: { id: string; name: string; }[];
  mode?: 'create' | 'edit';
}> = ({ onSubmit, initialData, users, mode = 'create' }) => {
  const [formData, setFormData] = useState<AccountData>(initialData || {
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
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formFields = [
    {
      name: 'accountUser',
      label: 'Petty Cash Account User',
      type: 'select',
      options: users.map(user => ({
        value: user.name,
        label: user.name
      })),
      required: true
    },
    {
      name: 'pettyCashType',
      label: 'Petty Cash Type',
      type: 'select',
      options: [
        { value: 'Cash', label: 'Cash' },
        { value: 'Mpesa', label: 'Mpesa' },
        { value: 'Card', label: 'Card' },
        { value: 'Credit', label: 'Credit' }
      ],
      required: true
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      required: true
    },
    {
      name: 'accountType',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: 'Corporate', label: 'Corporate' },
        { value: 'Personal', label: 'Personal' }
      ],
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
      required: true
    }
  ];


  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-w-4xl">
        {formFields.map(({ name, label, type, options, required }) => (
          <div key={name} className="space-y-1.5">
            <Label htmlFor={name}>{label}{required && ' *'}</Label>
            {type === 'select' ? (
              <Select
                value={formData[name]}
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
                value={formData[name]}
                onChange={handleInputChange}
                className="h-8"
                required={required}
              />
            )}
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-blue-600 text-white">
          {mode === 'create' ? 'Create Account' : 'Update Account'}
        </Button>
      </DialogFooter>
    </form>
  );
};


// Main AccountsTab Component
export function AccountsTab() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    account: AccountData | null;
  }>({
    isOpen: false,
    mode: 'create',
    account: null
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Table Definitions
  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Account User',
      width: '150px',
      cell: (account: Account) => {
        const user = users.find(u => u.id === account.data.accountUser);
        return user?.name || '-';
      }
    },
    {
      header: 'Petty Cash Type',
      width: '120px',
      cell: (account: Account) => (
        <div className="flex flex-wrap gap-1">
          {account.data.pettyCashType.map(type => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      )
    },
    {
      header: 'Account Number',
      width: '120px',
      cell: (account: Account) => account.data.accountNumber
    },
    {
      header: 'Account Type',
      width: '100px',
      cell: (account: Account) => account.data.accountType
    },
    {
      header: 'Min Float Balance',
      width: '120px',
      cell: (account: Account) => account.data.minFloatBalance.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      })
    },
    {
      header: 'Min Float Alert',
      width: '120px',
      cell: (account: Account) => account.data.minFloatAlert.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      })
    },
    {
      header: 'Max Opening Float',
      width: '120px',
      cell: (account: Account) => account.data.maxOpeningFloat.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      })
    },
    {
      header: 'Approved Limit',
      width: '120px',
      cell: (account: Account) => account.data.approvedLimitAmount.toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES'
      })
    },
    {
      header: 'Start Date',
      width: '100px',
      cell: (account: Account) => format(new Date(account.data.startDate), 'dd/MM/yyyy')
    },
    {
      header: 'End Date',
      width: '100px',
      cell: (account: Account) => account.data.endDate
        ? format(new Date(account.data.endDate), 'dd/MM/yyyy')
        : '-'
    },
    {
      header: 'Status',
      width: '80px',
      cell: (account: Account) => (
        <Badge variant={account.data.status === 'Active' ? 'success' : 'destructive'}>
          {account.data.status}
        </Badge>
      )
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
          isVerified={account.status === 'Active'}
        />
      )
    }
  ];

  // Fetch Data
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await PettyCashService.fetchAccountRecords(userId);
      setAccounts(response?.data?.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, [userId]);


  const handleCreateAccount = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      account: {
        accountUser: [],
        pettyCashType: [],
        accountNumber: '',
        accountType: 'Corporate',
        minFloatBalance: 0,
        minFloatAlert: 0,
        maxOpeningFloat: 0,
        approvedLimitAmount: 0,
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'Active'
      }
    });
  };

  const handleEditAccount = (account: AccountData) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      account: {
        accountUser: account.accountUser,
        pettyCashType: account.pettyCashType,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        minFloatBalance: account.minFloatBalance,
        minFloatAlert: account.minFloatAlert,
        maxOpeningFloat: account.maxOpeningFloat,
        approvedLimitAmount: account.approvedLimitAmount,
        startDate: account.startDate,
        endDate: account.endDate,
        status: account.status
      }
    });
  };

  const handleSaveAccount = async (account: AccountData) => {
    try {
      if (dialogState.mode === 'create') {
        const result = await PettyCashService.createAccountRecord(
          'acc_portal_pettycash_accounts',
          account,
          userId
        );
        if (result) {
          toast.success('Account created successfully');
          fetchAccounts();
        }
      } else {
        await PettyCashService.updateAccountRecord(
          account.accountNumber,
          account,
          userId
        );
        toast.success('Account updated successfully');
        fetchAccounts();
      }
      setDialogState({ isOpen: false, mode: 'create', account: null });
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(dialogState.mode === 'create' ? 'Failed to create account' : 'Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountToDelete: AccountData) => {
    try {
      await PettyCashService.deleteAccountRecord(accountToDelete.accountNumber, userId);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleVerifyAccount = async (account: AccountData) => {
    try {
      await PettyCashService.verifyAccountRecord(account.accountNumber, userId);
      toast.success('Account verified successfully');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to verify account');
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await PettyCashService.fetchUserRecords(userId);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  // Filter accounts based on search
  const filteredAccounts = accounts.filter(account => {
    const searchString = searchQuery.toLowerCase();
    return (
      account.data.accountNumber.toLowerCase().includes(searchString) ||
      account.data.accountType.toLowerCase().includes(searchString) ||
      account.data.pettyCashType.some(type => type.toLowerCase().includes(searchString)) ||
      account.data.accountUser.some(userId => {
        const user = users.find(u => u.value === userId);
        return user?.label.toLowerCase().includes(searchString);
      })
    );
  });

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-4 w-full">
        <div className="flex justify-between items-center mb-4">
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccounts}
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
                      <RefreshCwIcon className="h-4 w-4 animate-spin mx-auto" />
                      <span className="mt-2 text-sm text-gray-500">Loading accounts...</span>
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
          users={users}
        />
      </main>
    </div>
  );
}

export default AccountsTab;