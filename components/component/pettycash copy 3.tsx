/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterIcon, DownloadIcon, PlusIcon } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient('https://zyszsqgdlrpnunkegipk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing');

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};


const staticFloatData = [
  { payment_type: 'mpesa', float_allocated: 10000, float_used: 2500 },
  { payment_type: 'cash', float_allocated: 5000, float_used: 1500 },
  { payment_type: 'credit_card', float_allocated: 2000, float_used: 500 },
];

const calculateFloatData = () => {
  const data = {};

  // Initialize data structure for each payment type
  staticFloatData.forEach(entry => {
    data[entry.payment_type] = {
      allocated: entry.float_allocated,
      used: entry.float_used,
      balance: entry.float_allocated - entry.float_used,
    };
  });

  return data;
};


const AccountCard = ({ title, allocated, used, balance }) => (
  <Card className="p-4 bg-white shadow-sm rounded-lg flex flex-col justify-between h-20">
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Button size="sm" variant="outline">Replenish</Button>
    </div>
    <div className="flex justify-between text-xs mt-2">
      <span>Allocated: {allocated}</span>
      <span>Used: {used}</span>
      <span>Balance: {balance}</span>
    </div>
  </Card>
);


export function PettyCash() {
  const { userId } = useUser();
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [currentTab, setCurrentTab] = useState('transactions');

  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const [newAccount, setNewAccount] = useState({ name: '', type: '', initial_balance: '' });
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    account_id: '',
    transaction_type: '',
    date: '',
  });

  const [pettyCashEntries, setPettyCashEntries] = useState([]);
  const [floatData, setFloatData] = useState(calculateFloatData());

  const [newPettyCash, setNewPettyCash] = useState({
    amount: '',
    invoice_number: '',
    invoice_date: '',
    description: '',
    receipt_url: null,
    expense_type: '',
    checked_by: '',
    approved_by: '',
    payment_type: '', // Add payment type to the state
  });

  useEffect(() => {
    fetchPettyCashEntries();
  }, []);

  const fetchPettyCashEntries = async () => {
    const { data, error } = await supabase
      .from('acc_portal_petty_cash_entries')
      .select('*')
      .eq('userid', userId)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching petty cash entries:', error);
    else setPettyCashEntries(data);
  };
  

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewPettyCash((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    setNewPettyCash((prev) => ({ ...prev, receipt_url: e.target.files[0] }));
  };

  const handleExpenseTypeChange = (value) => {
    setNewPettyCash((prev) => ({ ...prev, expense_type: value }));
  };

  const handlePaymentTypeChange = (value) => {
    setNewPettyCash((prev) => ({ ...prev, payment_type: value }));
  };

  const handleSubmit = async () => {
    let receiptUrl = '';
    if (newPettyCash.receipt_url) {
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('Accounting-Portal')
        .upload(`petty-cash/${userId}/${newPettyCash.receipt_url.name}`, newPettyCash.receipt_url);
  
      if (storageError) {
        console.error('Error uploading receipt:', storageError);
        return;
      }
      receiptUrl = storageData.path;
    }
  
    const { data, error } = await supabase
      .from('acc_portal_petty_cash_entries')
      .insert([{ ...newPettyCash, receipt_url: receiptUrl, userid: userId }]);
  
    if (error) console.error('Error adding petty cash entry:', error);
    else {
      fetchPettyCashEntries();
      setNewPettyCash({
        amount: '',
        invoice_number: '',
        invoice_date: '',
        description: '',
        receipt_url: " ",
        expense_type: '',
        checked_by: '',
        approved_by: '',
        payment_type: '', // Reset payment type
      });
    }
  };

  const updateEntry = async (entryId, updatedData) => {
    const { data, error } = await supabase
      .from('acc_portal_petty_cash_entries')
      .update(updatedData)
      .eq('id', entryId)
      .eq('userid', userId);
    // Handle the result
  };
  
  const deleteEntry = async (entryId) => {
    const { data, error } = await supabase
      .from('acc_portal_petty_cash_entries')
      .delete()
      .eq('id', entryId)
      .eq('userid', userId);
    // Handle the result
  };
  
  
  // Fields to be displayed in the form
  const formFields = [
    { id: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
    { id: 'invoice_number', label: 'Invoice Number', type: 'text', placeholder: 'INV-123456' },
    { id: 'invoice_date', label: 'Invoice Date', type: 'date', placeholder: '' },
    { id: 'description', label: 'Description', type: 'text', placeholder: 'Description of the petty cash' },
    { id: 'checked_by', label: 'Checked By', type: 'text', placeholder: 'John Doe' },
    { id: 'approved_by', label: 'Approved By', type: 'text', placeholder: 'Jane Smith' },
  ];

  // Fields to be displayed in the table
  const tableFields = [
    { label: 'Entry ID', key: 'id', format: (id) => `PC-${id}` },
    { label: 'Amount', key: 'amount' },
    { label: 'Invoice Number', key: 'invoice_number' },
    { label: 'Invoice Date', key: 'invoice_date', format: (date) => formatDate(date) },
    { label: 'Description', key: 'description' },
    { label: 'Payment Type', key: 'payment_type' },
    { label: 'Expense Type', key: 'expense_type' },
    { label: 'Checked By', key: 'checked_by' },
    { label: 'Approved By', key: 'approved_by' }, // Add payment type to table
    {
      label: 'Receipt Photo',
      key: 'receipt_url',
      format: (url) => (
        url ? (
          <a href={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${url}`} target="_blank" rel="noopener noreferrer">
            View Receipt
          </a>
        ) : 'No Receipt'
      ),
    },
  ];

  const FloatCard = ({ title, allocated, used, balance }) => {
    return (
      <Card className="p-2 bg-white shadow-sm rounded-lg flex gap-2 items-center mb-4">
        <h3 className="text-md font-semibold">{title}</h3>
        <p className="text-sm mt-1">Allocated: {allocated}</p>
        <p className="text-sm mt-1">Used: {used}</p>
        <p className="text-sm mt-1">Balance: {balance}</p>
      </Card>
    );
  };

  return (
    <div className="flex w-full bg-muted/40">
      <main className="flex-1 p-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Petty Cash Overview</CardTitle>
              <CardDescription className="max-w-lg text-balance leading-relaxed">
                Get a comprehensive view of your company's petty cash across all branches.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button>Manage Petty Cash</Button>
            </CardFooter>
          </Card>
          {Object.entries(floatData).map(([type, data]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardDescription>{`Total ${type.charAt(0).toUpperCase() + type.slice(1)}`}</CardDescription>
                <CardTitle className="text-4xl">{`$${data.allocated}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{`+${((data.used / data.allocated) * 100).toFixed(1)}% from last month`}</div>
              </CardContent>
              <CardFooter>
                <Progress value={(data.used / data.allocated) * 100} aria-label={`${((data.used / data.allocated) * 100).toFixed(1)}% increase`} />
              </CardFooter>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="entries">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                    <FilterIcon className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>Cash</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Mpesa</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Cards</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
                <DownloadIcon className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
            </div>
          </div>
          <TabsContent value="entries">
            <Card>
              <CardHeader className="px-7">
                <CardTitle>Petty Cash Entries</CardTitle>
                <CardDescription>View and manage your petty cash entries.</CardDescription>
                <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white w-1/8">Add New Entry</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Petty Cash Entry</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a petty cash entry to the system.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col pt-4 gap-4">
                  {formFields.map(({ id, label, type, placeholder }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      <Input
                        id={id}
                        type={type}
                        placeholder={placeholder}
                        value={newPettyCash[id]}
                        onChange={handleInputChange}
                      />
                    </div>
                  ))}
                   <div className="space-y-1">
                    <Label htmlFor="payment_type">Payment Type </Label>
                    <Select onValueChange={handlePaymentTypeChange} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Payment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">Mpesa</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receipt">Receipt Image</Label>
                    <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expense_type">Expense Type</Label>
                    <Select onValueChange={handleExpenseTypeChange} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Expense Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motor_vehicle_running_exp">Motor Vehicle Running Exp</SelectItem>
                        <SelectItem value="postage_telephone">Postage & Telephone</SelectItem>
                        <SelectItem value="staff_costs">Staff Costs</SelectItem>
                        <SelectItem value="repairs_maintenance">Repairs & Maintenance</SelectItem>
                        <SelectItem value="disallowable_exp">Disallowable Exp</SelectItem>
                        <SelectItem value="non">Non</SelectItem>
                        {/* Add more options as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
                </div>
              </SheetContent>
            </Sheet>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Invoice Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Description</TableHead>
                      <TableHead>Payment Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pettyCashEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{`PC-${entry.id}`}</TableCell>
                        <TableCell>
                          <Badge className="text-xs" variant="secondary">
                            ${entry.amount}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{formatDate(entry.invoice_date)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{entry.description}</TableCell>
                        <TableCell>{entry.payment_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="accounts">
            {/* Add content for Accounts tab */}
          </TabsContent>
          <TabsContent value="transactions">
            {/* Add content for Transactions tab */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}