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
import { toast } from 'react-hot-toast';
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
  const initialFormData = {
    id: '', // Ensure id is included
    name: '',
    email: '',
    role: 'user',
    branch_id: undefined,
    default_currency: 'KES',
    cash_balance: 0,
    credit_balance: 0,
    mpesa_balance: 0,
    created_date: new Date().toISOString(),
    is_verified: false
};

  const [formData, setFormData] = useState(mode === 'create' ? initialFormData : user);

  useEffect(() => {
    setFormData(mode === 'create' ? initialFormData : user);
  }, [user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.branch_id) {
      toast.error('Please select a branch');
      return;
    }

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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'branch_id' ? value : value // Store branch_name for branch_id
    }));
  };

  const getSelectValue = (name: string): string | undefined => {
    if (name === 'branch_id') {
      return formData?.branch_id || undefined;
    }
    const value = formData?.[name];
    return value ? value.toString() : undefined;
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
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
      options: branches?.map(branch => ({
        value: branch.branch_name, // Use branch_name as the value
        label: `${branch.branch_name} - ${branch.location}` // Show both name and location
      })) || [],
      required: true,
      placeholder: 'Select Branch'
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
    {
      name: 'cash_balance',
      label: 'Cash Balance',
      type: 'number',
      required: false,
      defaultValue: '0'
    },
    {
      name: 'credit_balance',
      label: 'Credit Balance',
      type: 'number',
      required: false,
      defaultValue: '0'
    },
    {
      name: 'mpesa_balance',
      label: 'M-Pesa Balance',
      type: 'number',
      required: false,
      defaultValue: '0'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New User' : 'Edit User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(({ name, label, type, options, required, defaultValue, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}{required && ' *'}</Label>
              {type === 'select' ? (
                <Select
                  value={getSelectValue(name)}
                  onValueChange={(value) => handleSelectChange(name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
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
                  value={formData?.[name]?.toString() || defaultValue || ''}
                  onChange={handleInputChange}
                  className="h-8"
                  required={required}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white">
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
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'create',
    user: null
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, branchesResponse] = await Promise.all([
        PettyCashService.fetchUserRecords(userId),
        PettyCashService.fetchBranchRecords(userId)
      ]);

      // Extract branches from the JSONB structure
      const branchesData = branchesResponse?.data?.branches || [];

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setBranches(branchesData);
        return;
      }

      const usersWithBranches = usersData.map(user => ({
        ...user,
        branch_info: branchesData.find(b => b.branch_name === user.branch_id)
      }));

      setUsers(usersWithBranches);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      setUsers([]);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };


  const flattenUserData = (userData: any) => {
    if (!userData) return null;

    return {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      branch_id: userData.branch_id,
      default_currency: userData.default_currency,
      cash_balance: userData.cash_balance || 0,
      credit_balance: userData.credit_balance || 0,
      mpesa_balance: userData.mpesa_balance || 0,
      created_date: userData.created_date,
      is_verified: userData.is_verified || false,
      acc_portal_pettycash_branches: userData.acc_portal_pettycash_branches
    };
  };


  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreateUser = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      user: {
        id: crypto.randomUUID(),
        name: '',
        email: '',
        role: 'user',
        branch_id: '',
        default_currency: 'KES',
        cash_balance: 0,
        credit_balance: 0,
        mpesa_balance: 0,
        created_date: new Date().toISOString(),
        is_verified: false
      }
    });
  };

  const handleEditUser = (user: User) => {
    setDialogState({
        isOpen: true,
        mode: 'edit',
        user: {
            ...user,
            branch_id: user.branch_id || '' // Ensure branch_id is set properly
        }
    });
};

const handleSaveUser = async (userData: User) => {
  try {
      if (dialogState.mode === 'create') {
          // Create new user record
          const result = await PettyCashService.createUserRecord(userId, {
              ...userData,
              branch_id: userData.branch_id // This should be branch_name from selected branch
          });
          if (result) {
              toast.success('User created successfully');
              fetchData();
          }
      } else {
          // Update existing user
          await PettyCashService.updateUserRecord(userId, userData.id, {
              ...userData,
              branch_id: userData.branch_id // This should be branch_name from selected branch
          });
          toast.success('User updated successfully');
          fetchData();
      }

      setDialogState({ isOpen: false, mode: 'create', user: null });
  } catch (error) {
      console.error('Error saving user:', error);
      toast.error(dialogState.mode === 'create' ? 'Failed to create user' : 'Failed to update user');
  }
};

  const handleDeleteUser = async (user: User) => {
    try {
      await PettyCashService.deleteUserRecord(userId, user.email);
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
      cell: (user: User) => user.branch_info?.branch_name || '-'
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
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onVerify={handleVerifyUser}
          isVerified={user.is_verified}
          dialogTitle="Edit User"
          dialogDescription="Update user information"
          deleteWarning="Are you sure you want to delete this user? This action cannot be undone."
        />
      )
    }
  ];

  return (
    <div className="flex w-full bg-gray-100">

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
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <span className="text-sm text-gray-500">Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-2">
                          <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">No Users Found</span>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchQuery
                            ? 'No users match your search criteria'
                            : 'Get started by adding your first user'}
                        </p>
                        {!searchQuery && (
                          <Button
                            onClick={handleCreateUser}
                            className="mt-3 bg-blue-600 text-white"
                          >
                            Add New User
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id || user.email}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${user.id || user.email}-${colIndex}`}
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