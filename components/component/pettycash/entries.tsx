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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';

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
  { payment_type: 'debit_card', float_allocated: 2000, float_used: 500 },
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

export function TransactionsTab() {
  const { userId } = useAuth();
  const { user } = useUser();

  const [pettyCashEntries, setPettyCashEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [floatData, setFloatData] = useState(calculateFloatData());

  const [newPettyCash, setNewPettyCash] = useState({
    amount: '',
    invoice_number: '',
    invoice_date: '',
    description: '',
    receipt_url: null,
    expense_type: '',
    payment_type: '',
    checked_by: '',
    approved_by: '',
    branch_name: '',
    user_name: '',
    account_type: '',
  });

  useEffect(() => {
    fetchPettyCashEntries();
    fetchBranches();
    fetchAccounts();
    fetchUsers();
  }, []);

  const fetchPettyCashEntries = async () => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_entries')
      .select('*')
      .eq('userid', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching petty cash entries:', error);
    } else {
      console.log('Fetched petty cash entries:', data);
      setPettyCashEntries(data);
    }
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_branches')
      .select('*')
      .eq('userid', userId);

    if (error) {
      console.error('Error fetching branches:', error);
    } else {
      console.log('Fetched branches:', data);
      setBranches(data);
    }
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_accounts')
      .select('id, account_type')
      .eq('admin_id', userId);

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      console.log('Fetched accounts:', data);
      setAccounts(data);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_users')
      .select('id, name')
      .eq('admin_id', userId);

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Fetched users:', data);
      setUsers(data);
    }
  };

  // Update the handleSubmit function

  const handleSubmit = async () => {
    let receiptUrl = '';

    if (newPettyCash.receipt_url) {
      const accountType = newPettyCash.account_type || 'default';
      const userName = user?.fullName || user?.username || 'unknown_user';
      const uploadPath = `petty-cash/${userName}/${accountType}/${newPettyCash.receipt_url.name}`;

      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('Accounting-Portal')
        .upload(uploadPath, newPettyCash.receipt_url);

      if (storageError) {
        console.error('Error uploading receipt:', storageError);
        return;
      }

      receiptUrl = storageData.path;
    }

    const { data, error } = await supabase
      .from('acc_portal_pettycash_entries')
      .insert([{
        ...newPettyCash,
        receipt_url: receiptUrl,
        userid: userId
      }]);

    if (error) {
      console.error('Error adding petty cash entry:', error);
    } else {
      console.log('Added new petty cash entry:', data);
      fetchPettyCashEntries();
      setNewPettyCash({
        amount: '',
        invoice_number: '',
        invoice_date: '',
        description: '',
        receipt_url: null,
        expense_type: '',
        payment_type: '',
        checked_by: '',
        approved_by: '',
        branch_name: '',
        user_name: '',
        account_type: '',
      });
    }
  };

  // Update the table name in the updateEntry function
  const updateEntry = async (entryId, updatedData) => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_entries')
      .update(updatedData)
      .eq('id', entryId)
      .eq('userid', userId);
    // Handle the result
  };

  // Update the table name in the deleteEntry function
  const deleteEntry = async (entryId) => {
    const { data, error } = await supabase
      .from('acc_portal_pettycash_entries')
      .delete()
      .eq('id', entryId)
      .eq('userid', userId);
    // Handle the result
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

  // Fields to be displayed in the form
  const formFields = [
    { id: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
    { id: 'invoice_number', label: 'Invoice Number', type: 'text', placeholder: 'INV-123456' },
    { id: 'invoice_date', label: 'Invoice Date', type: 'date', placeholder: '' },
    { id: 'description', label: 'Description', type: 'text', placeholder: 'Description of the petty cash' },
    { id: 'checked_by', label: 'Checked By', type: 'text', placeholder: 'John Doe' },
    { id: 'approved_by', label: 'Approved By', type: 'text', placeholder: 'Jane Smith' },
    {
      id: 'account_type',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' },
        { value: 'mpesa', label: 'M-Pesa' },
      ],
      onChange: (value) => setNewPettyCash(prev => ({ ...prev, account_type: value })),
    },
    {
      id: 'receipt',
      label: 'Receipt Image',
      type: 'file',
      accept: 'image/*',
      onChange: handleFileChange,
    },
    {
      id: 'expense_type',
      label: 'Expense Category',
      type: 'select',
      options: [
        { value: 'motor_vehicle_running_exp', label: 'Motor Vehicle Running Exp' },
        { value: 'postage_telephone', label: 'Postage & Telephone' },
        { value: 'staff_costs', label: 'Staff Costs' },
        { value: 'repairs_maintenance', label: 'Repairs & Maintenance' },
        { value: 'disallowable_exp', label: 'Disallowable Exp' },
        { value: 'non', label: 'Non' },
      ],
      onChange: handleExpenseTypeChange,
    },
    {
      id: 'branch_name',
      label: 'Branch',
      type: 'select',
      options: branches.map(branch => ({ value: branch.branch_name, label: branch.branch_name })),
      onChange: (value) => setNewPettyCash(prev => ({ ...prev, branch_name: value })),
    },
    {
      id: 'user_name',
      label: 'User',
      type: 'select',
      options: users.map(user => ({ value: user.name, label: user.name })),
      onChange: (value) => setNewPettyCash(prev => ({ ...prev, user_name: value })),
    },


  ];

  // Fields to be displayed in the table
  const tableFields = [
    { label: 'Entry ID', key: 'id', format: (id) => `PC-${id}` },
    { label: 'User', key: 'user_name' },
    { label: 'Branch', key: 'branch_name' },
    { label: 'Account Type', key: 'account_type' },
    { label: 'Amount', key: 'amount' },
    { label: 'Invoice Number', key: 'invoice_number' },
    { label: 'Invoice Date', key: 'invoice_date', format: (date) => formatDate(date) },
    { label: 'Description', key: 'description' },
    { label: 'Expense Category', key: 'expense_type' },
    { label: 'Checked By', key: 'checked_by' },
    { label: 'Approved By', key: 'approved_by' },
    {
      label: 'Receipt Photo',
      key: 'receipt_url',
      format: (url) => (
        url ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link">View Receipt</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
              <DialogHeader>
                <DialogTitle>Receipt Preview</DialogTitle>
              </DialogHeader>
              <iframe
                src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${url}`}
                style={{ width: '100%', height: '70vh', border: 'none', display: 'block', margin: 'auto' }}
                title="Receipt Preview"
              />

            </DialogContent>
          </Dialog>
        ) : 'No Receipt'
      ),
    },
  ];

  const FloatCard = ({ title, allocated, used, balance }) => {
    return (
      <Card className="p-2 bg-white shadow-sm rounded-lg flex text-center items-center mb-4">
        <h3 className="text-md font-semibold text-center p-2 rounded">{title}</h3>
        <div className="w-px h-12 bg-gray-200 mx-4"></div>
        <p className="text-sm font-semibold text-blue-600">Allocated: {allocated}</p>
        <div className="w-px h-12 bg-gray-200 mx-4"></div>
        <p className="text-sm font-semibold text-red-600">Used: {used}</p>
        <div className="w-px h-12 bg-gray-200 mx-4"></div>
        <p className="text-sm font-semibold text-green-600">Balance: {balance}</p>
      </Card>
    );
  };

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <h1 className="text-xl font-semibold mb-2">Monthly Petty Cash Entries</h1>
        {/* <div className=" justify-center space-x-2 grid  grid-cols-4 text">
          {Object.keys(floatData).map((type) => (
            <FloatCard
              key={type}
              title={`Total ${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
              allocated={floatData[type].allocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              used={floatData[type].used.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              balance={floatData[type].balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          ))}
        </div> */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">

            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchPettyCashEntries}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Entry</Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add Petty Cash Entry</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a petty cash entry to the system.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  {[
                    { id: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
                    { id: 'invoice_number', label: 'Invoice Number', type: 'text', placeholder: 'INV-123456' },
                    { id: 'invoice_date', label: 'Invoice Date', type: 'date', placeholder: '' },
                    { id: 'description', label: 'Description', type: 'text', placeholder: 'Description of the petty cash' },
                    { id: 'checked_by', label: 'Checked By', type: 'text', placeholder: 'John Doe' },
                    { id: 'approved_by', label: 'Approved By', type: 'text', placeholder: 'Jane Smith' },
                    {
                      id: 'account_type',
                      label: 'Account Type',
                      type: 'select',
                      options: [
                        { value: 'cash', label: 'Cash' },
                        { value: 'credit', label: 'Credit' },
                        { value: 'mpesa', label: 'M-Pesa' },
                      ],
                      onChange: (value) => setNewPettyCash(prev => ({ ...prev, account_type: value })),
                    },
                    {
                      id: 'receipt',
                      label: 'Receipt Image',
                      type: 'file',
                      accept: 'image/*',
                      onChange: handleFileChange,
                    },
                    {
                      id: 'expense_type',
                      label: 'Expense Category',
                      type: 'select',
                      options: [
                        { value: 'motor_vehicle_running_exp', label: 'Motor Vehicle Running Exp' },
                        { value: 'postage_telephone', label: 'Postage & Telephone' },
                        { value: 'staff_costs', label: 'Staff Costs' },
                        { value: 'repairs_maintenance', label: 'Repairs & Maintenance' },
                        { value: 'disallowable_exp', label: 'Disallowable Exp' },
                        { value: 'non', label: 'Non' },
                      ],
                      onChange: handleExpenseTypeChange,
                    }, {
                      id: 'branch_name',
                      label: 'Branch',
                      type: 'select',
                      options: branches.map(branch => ({ value: branch.branch_name, label: branch.branch_name })),
                      onChange: (value) => setNewPettyCash(prev => ({ ...prev, branch_name: value })),
                    },
                    {
                      id: 'user_name',
                      label: 'User',
                      type: 'select',
                      options: users.map(user => ({ value: user.name, label: user.name })),
                      onChange: (value) => setNewPettyCash(prev => ({ ...prev, user_name: value })),
                    },

                  ].map(({ id, label, type, placeholder, options, onChange, accept }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      {type === 'select' ? (
                        <Select onValueChange={onChange} value={newPettyCash[id]}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : type === 'file' ? (
                        <Input
                          id={id}
                          type={type}
                          accept={accept}
                          onChange={onChange}
                        />
                      ) : (
                        <Input
                          id={id}
                          type={type}
                          placeholder={placeholder}
                          value={newPettyCash[id]}
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
              {pettyCashEntries.map((entry) => (
                <TableRow key={entry.id}>
                  {tableFields.map(({ key, format }) => (
                    <TableCell key={key}>
                      {format ? format(entry[key]) : entry[key]}
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
