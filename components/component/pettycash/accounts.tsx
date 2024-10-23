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
  { value: 'Card', label: 'Card' }
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

// Account Form Component
const AccountForm: React.FC<{
  onSubmit: (data: AccountData) => void;
  initialData?: AccountData | null;
  users: { id: string; name: string; }[];
  mode?: 'create' | 'edit';
}> = ({ onSubmit, initialData, users, mode = 'create' }) => {
  const [formData, setFormData] = useState<AccountData>(initialData || {
    accountUser: '',
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
  });

  useEffect(() => {
    // Update status when endDate changes
    const newStatus = formData.endDate && new Date(formData.endDate) <= new Date()
      ? 'Inactive'
      : 'Active';
    if (newStatus !== formData.status) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  }, [formData.endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.accountUser.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (formData.pettyCashType.length === 0) {
      toast.error('Please select at least one petty cash type');
      return;
    }

    if (formData.minFloatBalance > formData.maxOpeningFloat) {
      toast.error('Minimum float balance cannot be greater than maximum opening float');
      return;
    }

    if (formData.minFloatAlert > formData.minFloatBalance) {
      toast.error('Minimum float alert cannot be greater than minimum float balance');
      return;
    }

    onSubmit(formData);
  };

  const handleDateSelect = (field: 'startDate' | 'endDate', date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.toISOString() : null,
    }));
  };

  const cashTypes = ['Cash', 'Mpesa', 'Card'];
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Petty Cash Account User *</Label>
          <div className="grid grid-cols-1 gap-2">
            {users.map(user => (
              <label key={user.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="accountUser"
                  value={user.id}
                  checked={formData.accountUser === user.id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    accountUser: e.target.value
                  }))}
                  className="form-radio h-4 w-4"
                />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Petty Cash Type *</Label>
          <div className="grid grid-cols-2 gap-2">
            {cashTypes.map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.pettyCashType.includes(type as any)}
                  onChange={(e) => {
                    const updatedTypes = e.target.checked
                      ? [...formData.pettyCashType, type]
                      : formData.pettyCashType.filter(t => t !== type);
                    setFormData(prev => ({
                      ...prev,
                      pettyCashType: updatedTypes as ('Cash' | 'Mpesa' | 'Card')[]
                    }));
                  }}
                  className="form-checkbox h-4 w-4"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>


      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <Input
          id="accountNumber"
          value={formData.accountNumber}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            accountNumber: e.target.value
          }))}
          required
          placeholder="Enter account number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type *</Label>
        <Select
          value={formData.accountType}
          onValueChange={(value: 'Corporate' | 'Personal') =>
            setFormData(prev => ({ ...prev, accountType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minFloatBalance">Minimum Float Balance *</Label>
          <Input
            id="minFloatBalance"
            type="number"
            min="0"
            step="0.01"
            value={formData.minFloatBalance}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              minFloatBalance: parseFloat(e.target.value)
            }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minFloatAlert">Minimum Float Alert *</Label>
          <Input
            id="minFloatAlert"
            type="number"
            min="0"
            step="0.01"
            value={formData.minFloatAlert}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              minFloatAlert: parseFloat(e.target.value)
            }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxOpeningFloat">Maximum Opening Float *</Label>
          <Input
            id="maxOpeningFloat"
            type="number"
            min="0"
            step="0.01"
            value={formData.maxOpeningFloat}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              maxOpeningFloat: parseFloat(e.target.value)
            }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="approvedLimitAmount">Approved Limit Amount *</Label>
          <Input
            id="approvedLimitAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.approvedLimitAmount}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              approvedLimitAmount: parseFloat(e.target.value)
            }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(new Date(formData.startDate), 'PP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate ? new Date(formData.startDate) : undefined}
                onSelect={(date) => handleDateSelect('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(new Date(formData.endDate), 'PP') : 'No end date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate ? new Date(formData.endDate) : undefined}
                onSelect={(date) => handleDateSelect('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className={cn(
          "p-2 rounded-md text-center font-medium",
          formData.status === 'Active'
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        )}>
          {formData.status}
        </div>
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
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
          onEdit={() => setEditingAccount(account)}
          onDelete={() => handleDeleteAccount(account)}
        />
      )
    }
  ];

  // Fetch Data
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await PettyCashService.fetchRecords('acc_portal_pettycash_accounts', userId);
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await PettyCashService.fetchRecords('acc_portal_pettycash_users', userId);
      setUsers(data.map(user => ({
        label: user.name,
        value: user.id.toString()
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, [userId]);

  // Account Management Functions
  const handleAddAccount = async (data: AccountData) => {
    try {
      await PettyCashService.createRecord('acc_portal_pettycash_accounts', {
        userid: userId,
        data: data
      });
      toast.success('Account created successfully');
      fetchAccounts();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    }
  };

  const handleEditAccount = async (data: AccountData) => {
    if (!editingAccount) return;
    try {
      await PettyCashService.updateRecord(
        'acc_portal_pettycash_accounts',
        editingAccount.id,
        {
          userid: userId,
          data: data
        }
      );
      toast.success('Account updated successfully');
      fetchAccounts();
      setEditingAccount(null);
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_accounts', account.id);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
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
              onClick={() => setIsDialogOpen(true)}
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
                      className="h-32 text-center text-gray-500"
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

        {/* Account Form Dialog */}
        <Dialog
          open={isDialogOpen || editingAccount !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setEditingAccount(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm
              onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
              initialData={editingAccount?.data}
              users={users}
              mode={editingAccount ? 'edit' : 'create'}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default AccountsTab;