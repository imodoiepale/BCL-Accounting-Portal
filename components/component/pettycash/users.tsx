
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function UsersTab() {
  const { userId } = useUser();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    branch_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        branches(branch_name),
        user_account_count(account_count)
      `)
      .eq('admin_id', userId)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('id, branch_name')
      .eq('user_id', userId);
    if (error) console.error('Error fetching branches:', error);
    else setBranches(data);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewUser((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setNewUser((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...newUser, admin_id: userId }]);

    if (error) console.error('Error adding user:', error);
    else {
      fetchUsers();
      setNewUser({
        name: '',
        email: '',
        role: '',
        branch_id: '',
      });
    }
  };

  const formFields = [
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Enter user name' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'Enter user email' },
    { id: 'role', label: 'Role', type: 'select', options: [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'cashier', label: 'Cashier' },
    ]},
    { id: 'branch_id', label: 'Branch', type: 'select', options: branches.map(branch => ({ value: branch.id, label: branch.branch_name })) },
  ];

  const tableFields = [
    { label: 'User ID', key: 'id', format: (id) => `US-${id}` },
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Role', key: 'role' },
    { label: 'Branch', key: 'branches.branch_name' },
    { label: 'Number of Accounts', key: 'user_account_count.account_count', format: (count) => (
      <Popover>
        <PopoverTrigger>{count}</PopoverTrigger>
        <PopoverContent>
          <p>This user has {count} account(s).</p>
          {/* You can add more details about the accounts here */}
        </PopoverContent>
      </Popover>
    )},
    { label: 'Created Date', key: 'created_date', format: formatDate },
    { label: 'Last Spent Amount', key: 'last_spent_amount', format: formatCurrency },
    { label: 'Last Spent Date', key: 'last_spent_date', format: formatDate },
    { label: 'Balance', key: 'balance', format: (_, user) => (
      <Popover>
        <PopoverTrigger>{formatCurrency(user.cash_balance + user.credit_balance + user.mpesa_balance)}</PopoverTrigger>
        <PopoverContent>
          <p>Cash: {formatCurrency(user.cash_balance)}</p>
          <p>Credit: {formatCurrency(user.credit_balance)}</p>
          <p>M-Pesa: {formatCurrency(user.mpesa_balance)}</p>
        </PopoverContent>
      </Popover>
    )},
  ];

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <h1 className="text-xl font-semibold mb-4">Users</h1>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="Search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchUsers}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New User</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New User</SheetTitle>
                  <SheetDescription>
                    Enter the details of the new user.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  {formFields.map(({ id, label, type, placeholder, options }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      {type === 'select' ? (
                        <Select onValueChange={(value) => handleSelectChange(id, value)} value={newUser[id]}>
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
                          value={newUser[id]}
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  {tableFields.map(({ key, format }) => (
                    <TableCell key={key}>
                      {format ? format(key.includes('.') ? user[key.split('.')[0]][key.split('.')[1]] : user[key], user) : 
                        key.includes('.') ? user[key.split('.')[0]][key.split('.')[1]] : user[key]}
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

export default UsersTab;