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
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

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


export function PettyCash() {
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
        .upload(`petty-cash/${newPettyCash.receipt_url.name}`, newPettyCash.receipt_url);
  
      if (storageError) {
        console.error('Error uploading receipt:', storageError);
        return;
      }
      receiptUrl = storageData.path; // Path to the uploaded image
    }
  
    const { data, error } = await supabase
      .from('acc_portal_petty_cash_entries')
      .insert([{ ...newPettyCash, receipt_url: receiptUrl }]);
  
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
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
            <div className="flex justify-between space-x-4">
                {Object.keys(floatData).map((type) => (
                  <FloatCard
                    key={type}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                    allocated={floatData[type].allocated}
                    used={floatData[type].used}
                    balance={floatData[type].balance}
                  />
                ))}
              </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Monthly Petty Cash Entries</h1>
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
