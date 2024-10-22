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
import { RefreshCwIcon } from 'lucide-react';
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
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export function UsersTab() {
  const { userId } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    branch_id: '',
    default_currency: 'USD',
    cash_balance: 0,
    credit_balance: 0,
    mpesa_balance: 0
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        PettyCashService.fetchRecords('acc_portal_pettycash_users', userId, {
          select: `
            *,
            acc_portal_pettycash_branches(branch_name),
            account_count:acc_portal_pettycash_accounts(count)
          `
        }),
        PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId)
      ]);

      setUsers(usersData.map(user => ({
        ...user,
        account_count: user.account_count[0]?.count || 0
      })));
      setBranches(branchesData);
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
    const result = await PettyCashService.createRecord('acc_portal_pettycash_users', newUser, userId);
    if (result) {
      setNewUser({
        name: '',
        email: '',
        role: '',
        branch_id: '',
        default_currency: 'USD',
        cash_balance: 0,
        credit_balance: 0,
        mpesa_balance: 0
      });
      setIsSheetOpen(false);
      fetchData();
    }
  };

  const formFields = [
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Enter user name' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'Enter user email' },
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'cashier', label: 'Cashier' }
      ]
    },
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
      id: 'default_currency',
      label: 'Default Currency',
      type: 'select',
      options: [
        { value: 'USD', label: 'USD' },
        { value: 'KES', label: 'KES' },
        { value: 'EUR', label: 'EUR' },
        { value: 'GBP', label: 'GBP' }
      ]
    },
    {
      id: 'cash_balance',
      label: 'Initial Cash Balance',
      type: 'number',
      placeholder: '0.00'
    },
    {
      id: 'credit_balance',
      label: 'Initial Credit Balance',
      type: 'number',
      placeholder: '0.00'
    },
    {
      id: 'mpesa_balance',
      label: 'Initial M-Pesa Balance',
      type: 'number',
      placeholder: '0.00'
    }
  ];

  const EditForm = (user, onSave) => {
    const [editData, setEditData] = useState(user);

    const handleSubmit = async () => {
      const result = await PettyCashService.updateRecord('acc_portal_pettycash_users', user.id, editData);
      if (result) {
        onSave();
        fetchData();
      }
    };

    return (
      <div className="flex flex-col pt-4 gap-3">
        {formFields.map(({ id, label, type, options, placeholder }) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id} className="text-xs">{label}</Label>
            {type === 'select' ? (
              <Select
                value={editData[id]?.toString()}
                onValueChange={(value) => setEditData({ ...editData, [id]: value })}
              >
                <SelectTrigger className="h-8">
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
                onChange={(e) => setEditData({
                  ...editData,
                  [id]: type === 'number' ? parseFloat(e.target.value) : e.target.value
                })}
                placeholder={placeholder}
                className="h-8"
              />
            )}
          </div>
        ))}
        <Button onClick={handleSubmit} className="bg-blue-600 text-white h-8 mt-2">
          Save Changes
        </Button>
      </div>
    );
  };

  const tableFields = [
    { label: 'ID', key: 'id', format: (id) => `US-${id}` },
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Role', key: 'role' },
    { label: 'Branch', key: 'acc_portal_pettycash_branches.branch_name' },
    { label: 'Accounts', key: 'account_count' },
    {
      label: 'Cash Balance',
      key: 'cash_balance',
      format: (value, row) => formatCurrency(value, row.default_currency)
    },
    {
      label: 'Credit Balance',
      key: 'credit_balance',
      format: (value, row) => formatCurrency(value, row.default_currency)
    },
    {
      label: 'M-Pesa Balance',
      key: 'mpesa_balance',
      format: (value, row) => formatCurrency(value, row.default_currency)
    },
    {
      label: 'Last Transaction',
      key: 'last_spent_amount',
      format: (value, row) => value ? (
        `${formatCurrency(value, row.default_currency)} on ${formatDate(row.last_spent_date)}`
      ) : 'No transactions'
    },
    {
      label: 'Actions',
      key: 'actions',
      format: (_, user) => (
        <TableActions
          row={user}
          onEdit={(data) => PettyCashService.updateRecord('acc_portal_pettycash_users', user.id, data)}
          onDelete={() => PettyCashService.deleteRecord('acc_portal_pettycash_users', user.id)}
          onVerify={() => PettyCashService.verifyRecord('acc_portal_pettycash_users', user.id)}
          isVerified={user.is_verified}
          editForm={EditForm}
        />
      ),
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search users..."
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
                <Button className="bg-blue-600 text-white h-8">Add User</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New User</SheetTitle>
                  <SheetDescription>Create a new user account</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-3">
                  {formFields.map(({ id, label, type, options, placeholder }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id} className="text-xs">{label}</Label>
                      {type === 'select' ? (
                        <Select
                          onValueChange={(value) => setNewUser(prev => ({ ...prev, [id]: value }))}
                          value={newUser[id]}
                        >
                          <SelectTrigger className="h-8">
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
                          value={newUser[id]}
                          onChange={(e) => setNewUser(prev => ({
                            ...prev,
                            [id]: type === 'number' ? parseFloat(e.target.value) : e.target.value
                          }))}
                          placeholder={placeholder}
                          className="h-8"
                        />
                      )}
                    </div>
                  ))}
                  <Button onClick={handleCreate} className="bg-blue-600 text-white h-8 mt-2">
                    Create User
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
                    <TableCell colSpan={tableFields.length} className="text-center py-2">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableFields.length} className="text-center py-2">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {tableFields.map(({ key, format }) => (
                        <TableCell key={key} className="py-2 px-3 text-xs whitespace-nowrap">
                          {format ? format(user[key], user) :
                            key.includes('.') ?
                              user[key.split('.')[0]]?.[key.split('.')[1]] :
                              user[key]}
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

export default UsersTab;