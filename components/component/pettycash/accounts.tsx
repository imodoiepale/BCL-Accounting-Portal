// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const AccountsTab = ({ supabase, userId }) => {
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ name: '', type: '', initial_balance: '' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    if (error) console.error('Error fetching accounts:', error);
    else setAccounts(data);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [id]: value }));
  };

  const handleTypeChange = (value) => {
    setNewAccount((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...newAccount, user_id: userId }]);
    if (error) console.error('Error adding account:', error);
    else {
      fetchAccounts();
      setNewAccount({ name: '', type: '', initial_balance: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Add New Account</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Account</SheetTitle>
              <SheetDescription>Enter the details of the new account.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" value={newAccount.name} onChange={handleInputChange} placeholder="Enter account name" />
              </div>
              <div>
                <Label htmlFor="type">Account Type</Label>
                <Select onValueChange={handleTypeChange} value={newAccount.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="initial_balance">Initial Balance</Label>
                <Input id="initial_balance" type="number" value={newAccount.initial_balance} onChange={handleInputChange} placeholder="Enter initial balance" />
              </div>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell>${account.initial_balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AccountsTab;