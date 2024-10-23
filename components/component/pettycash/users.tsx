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

interface User {
  id: string;
  admin_id: string;
  name: string;
  email: string;
  role: string;
  branch_id: number;
  created_date: string;
  last_spent_amount: number;
  last_spent_date: string;
  cash_balance: number;
  credit_balance: number;
  mpesa_balance: number;
  default_currency: string;
  is_verified?: boolean;
  acc_portal_pettycash_branches?: {
    branch_name: string;
  };
  account_count?: number;
}

interface Branch {
  id: number;
  branch_name: string;
}

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => Promise<void>;
  mode: 'create' | 'edit';
  branches: Branch[];
}

const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  mode,
  branches
}) => {
  const [formData, setFormData] = useState<User | null>(user);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save user');
      console.error('Error saving user:', error);
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
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'user', label: 'User' }
      ],
      required: true
    },
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
      name: 'default_currency',
      label: 'Default Currency',
      type: 'select',
      options: [
        { value: 'KES', label: 'KES' },
        { value: 'USD', label: 'USD' },
        { value: 'GBP', label: 'GBP' },
        { value: 'EUR', label: 'EUR' }
      ],
      required: true
    },
    { name: 'cash_balance', label: 'Cash Balance', type: 'number' },
    { name: 'credit_balance', label: 'Credit Balance', type: 'number' },
    { name: 'mpesa_balance', label: 'M-Pesa Balance', type: 'number' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New User' : 'Edit User'}</DialogTitle>
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

export function UsersTab() {
  const { userId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    user: User | null;
  }>({
    isOpen: false,
    mode: 'create',
    user: null
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        PettyCashService.fetchRecords('acc_portal_pettycash_users', userId),
        PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId)
      ]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreateUser = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      user: {
        id: '',
        admin_id: userId,
        name: '',
        email: '',
        role: '',
        branch_id: null,
        created_date: new Date().toISOString(),
        default_currency: 'KES',
        cash_balance: 0,
        credit_balance: 0,
        mpesa_balance: 0
      }
    });
  };

  const handleEditUser = (user: User) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      user
    });
  };

  const handleSaveUser = async (user: User) => {
    try {
      if (dialogState.mode === 'create') {
        await PettyCashService.createRecord('acc_portal_pettycash_users', user, userId);
        toast.success('User created successfully');
      } else {
        await PettyCashService.updateRecord('acc_portal_pettycash_users', user.id, user);
        toast.success('User updated successfully');
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_users', user.id);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleVerifyUser = async (user: User) => {
    try {
      await PettyCashService.verifyRecord('acc_portal_pettycash_users', user.id);
      toast.success('User verified successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Name',
      width: '150px',
      cell: (user: User) => user.name
    },
    {
      header: 'Email',
      width: '200px',
      cell: (user: User) => user.email
    },
    {
      header: 'Role',
      width: '100px',
      cell: (user: User) => user.role
    },
    {
      header: 'Branch',
      width: '150px',
      cell: (user: User) => user.acc_portal_pettycash_branches?.branch_name || '-'
    },
    {
      header: 'Cash Balance',
      width: '120px',
      cell: (user: User) => formatCurrency(user.cash_balance, user.default_currency)
    },
    {
      header: 'Credit Balance',
      width: '120px',
      cell: (user: User) => formatCurrency(user.credit_balance, user.default_currency)
    },
    {
      header: 'M-Pesa Balance',
      width: '120px',
      cell: (user: User) => formatCurrency(user.mpesa_balance, user.default_currency)
    },
    {
      header: 'Created Date',
      width: '120px',
      cell: (user: User) => format(new Date(user.created_date), 'dd/MM/yyyy')
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (user: User) => (
        <TableActions
          row={user}
          onEdit={() => handleEditUser(user)}
          onDelete={() => handleDeleteUser(user)}
          onVerify={() => handleVerifyUser(user)}
          isVerified={user.is_verified}
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
                placeholder="Search users..."
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
              onClick={handleCreateUser}
              className="h-8 bg-blue-600 text-white"
            >
              Add New User
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
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${user.id}-${colIndex}`}
                          style={{ width: col.width }}
                          className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                        >
                          {col.cell(user, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <UserDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, mode: 'create', user: null })}
          user={dialogState.user}
          onSave={handleSaveUser}
          mode={dialogState.mode}
          branches={branches}
        />

      </main>
    </div>
  );
}

export default UsersTab;