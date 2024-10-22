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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';


import { TableActions } from './TableActions';
import { PettyCashService } from './PettyCashService';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
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
    const entries = await PettyCashService.fetchRecords('acc_portal_pettycash_entries', userId);
    setPettyCashEntries(entries);
  };

  const fetchBranches = async () => {
    const branchData = await PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId);
    setBranches(branchData);
  };

  const fetchAccounts = async () => {
    const accountData = await PettyCashService.fetchRecords('acc_portal_pettycash_accounts', userId);
    setAccounts(accountData);
  };

  const fetchUsers = async () => {
    const userData = await PettyCashService.fetchRecords('acc_portal_pettycash_users', userId);
    setUsers(userData);
  };

  const handleSubmit = async () => {
    const result = await PettyCashService.processTransaction(newPettyCash, newPettyCash.receipt_url, userId);
    if (result) {
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
      setIsSheetOpen(false);
      toast.success('Petty cash entry added successfully!');
    }
  };

  const getSubcategories = (category) => {
    return subcategoriesMap[category] || [];
  };

  const handleDelete = async (entry) => {
    const result = await PettyCashService.deleteRecord('acc_portal_pettycash_entries', entry.id);
    if (result) {
      fetchPettyCashEntries();
    }
  };

  const handleVerify = async (entry) => {
    const result = await PettyCashService.verifyRecord('acc_portal_pettycash_entries', entry.id);
    if (result) {
      fetchPettyCashEntries();
    }
  };


  const handleInputChange = (e) => {
    setNewPettyCash((prev) => ({ ...prev, [e.target.id]: e.target.value }));
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

  const handleEdit = async (entry) => {
    setCurrentEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const result = await PettyCashService.updateRecord('acc_portal_pettycash_entries', currentEntry.id, {
        amount: currentEntry.amount,
        invoice_number: currentEntry.invoice_number,
        invoice_date: currentEntry.invoice_date,
        description: currentEntry.description,
        expense_type: currentEntry.expense_type,
        payment_type: currentEntry.payment_type,
        checked_by: currentEntry.checked_by,
        approved_by: currentEntry.approved_by,
        branch_name: currentEntry.branch_name,
        user_name: currentEntry.user_name,
        account_type: currentEntry.account_type,
      });

      if (result) {
        toast.success('Entry updated successfully!');
        fetchPettyCashEntries();
        setIsEditDialogOpen(false);
      } else {
        toast.error('Failed to update entry. Please try again.');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };


  const formFields = [
   
    { id: 'invoice_date', label: 'Invoice Date', type: 'date', placeholder: '' },
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
    { id: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
    { id: 'description', label: 'Description', type: 'text', placeholder: 'Description of the petty cash' },
    { id: 'checked_by', label: 'Checked By', type: 'text', placeholder: 'John Doe' },
    { id: 'approved_by', label: 'Approved By', type: 'text', placeholder: 'Jane Smith' },
    {
      id: 'receipt',
      label: 'Receipt Image',
      type: 'file',
      accept: 'image/*',
      onChange: handleFileChange,
    },
  ];

  const tableFields = [
    { label: 'No.', key: 'index', format: (_, index) => index + 1 },
    // { label: 'Entry ID', key: 'id', format: (id) => `PC-${id}` },
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

  const expenseCategories = [
  'Office Supplies',
  'Employee Welfare',
  'Travel & Transportation',
  'Client-Related Expenses',
  'Utilities & Communication',
  'Maintenance & Repairs',
  'Miscellaneous Administrative Costs',
  'Marketing & Promotional Materials',
  'Training & Development',
  'Licensing & Subscriptions',
  'Security & Compliance',
  'Health & Safety',
  'Donations & CSR',
  'Subscriptions & Software Tools',
  'Legal & Compliance',
  'Office Utilities',
  'IT & Equipment',
  'Recruitment & Human Resources',
  'Event & Meeting Expenses',
  'Miscellaneous/Unexpected Expenses'
];

const subcategoriesMap = {
  'Office Supplies': [
    'Stationery',
    'Printer Supplies',
    'Office Equipment',
    'Toner/Ink Refills',
    'Notepads & Binders',
    'Whiteboards & Markers',
    'Filing Folders',
    'Envelopes',
    'Business Cards',
    'Miscellaneous Supplies'
  ],
  'Employee Welfare': [
    'Refreshments',
    'Team Meals',
    'Employee Gifts',
    'Wellness Programs',
    'Office Snacks',
    'Team Building Activities',
    'Celebrations',
    'Coffee/Tea',
    'Small Allowances',
    'Entertainment Expenses'
  ],
  'Travel & Transportation': [
    'Taxi Fare',
    'Public Transport Fare',
    'Parking Fees',
    'Fuel Reimbursement',
    'Mileage Reimbursement',
    'Tolls',
    'Travel Meals',
    'Lodging for Short Business Trips',
    'Car Rentals',
    'Airfare for Short Trips'
  ],
  'Client-Related Expenses': [
    'Client Meetings',
    'Client Gifts',
    'Client Entertainment',
    'Travel for Client Meetings',
    'Venue Rentals for Client Events',
    'Client Welcome Packages',
    'Presentation Materials',
    'Client Demos',
    'Conference Room Bookings',
    'Marketing Gifts'
  ],
  'Utilities & Communication': [
    'Phone Bill Payments',
    'Internet Bills',
    'Office Electricity Bills',
    'Water and Sewerage Payments',
    'Gas and Heating Costs',
    'Prepaid Phone Credits',
    'Mobile Hotspot Services',
    'Courier Services',
    'Postage & Delivery',
    'Cloud Storage Fees'
  ],
  'Maintenance & Repairs': [
    'Building Repairs',
    'Office Furniture Repairs',
    'IT Equipment Repairs',
    'Electrical Fixes',
    'Plumbing Services',
    'Maintenance Contracts',
    'HVAC Maintenance',
    'Cleaning Equipment Repairs',
    'Elevator Maintenance',
    'Pest Control Services'
  ],
  'Miscellaneous Administrative Costs': [
    'Filing Fees',
    'Legal/Notary Fees',
    'Bank Charges',
    'Document Courier Services',
    'Government Registrations',
    'Copying/Printing Fees',
    'Security Deposits',
    'Postage Stamps',
    'Small Consultant Fees',
    'Administrative Fines'
  ],
  'Marketing & Promotional Materials': [
    'Printing Costs',
    'Brochures & Flyers',
    'Business Cards',
    'Branded Merchandise',
    'Event Sponsorship',
    'Digital Marketing Ads',
    'Social Media Boosts',
    'Website Hosting',
    'Promotional Giveaways',
    'Media Coverage Fees'
  ],
  'Training & Development': [
    'Registration for Workshops',
    'Online Course Subscriptions',
    'Certification Fees',
    'Training Materials',
    'Professional Memberships',
    'Conference Fees',
    'In-House Training Costs',
    'Educational Subscriptions',
    'Webinars',
    'Employee Development Programs'
  ],
  'Licensing & Subscriptions': [
    'Software Licenses',
    'Cloud Services Subscriptions',
    'Professional Memberships',
    'Industry Magazine Subscriptions',
    'Financial Data Feeds',
    'Compliance Subscriptions',
    'SaaS Tools Subscriptions',
    'Newspaper Subscriptions',
    'Research Data Access',
    'Tech Support Subscriptions'
  ],
  'Security & Compliance': [
    'Alarm Monitoring',
    'Security Guard Payments',
    'Security Camera Maintenance',
    'ID Card Printing',
    'Key & Lock Replacements',
    'Cybersecurity Tools',
    'Access Control Systems',
    'Security Audits',
    'Data Backup Services',
    'Insurance Payments'
  ],
  'Health & Safety': [
    'First Aid Kits',
    'PPE (Personal Protective Equipment)',
    'Fire Extinguishers',
    'Emergency Drills',
    'Office Sanitization',
    'Health Screenings',
    'Safety Training Costs',
    'Workplace Safety Inspections',
    'Air Quality Monitoring',
    'Evacuation Supplies'
  ],
  'Donations & CSR': [
    'Charitable Contributions',
    'Event Sponsorships',
    'Non-Profit Partnerships',
    'Volunteer Event Costs',
    'Community Development Projects',
    'CSR Initiative Expenses',
    'Scholarships & Grants',
    'Environmental Contributions',
    'School Support Programs',
    'Local Event Sponsorships'
  ],
  'Subscriptions & Software Tools': [
    'Zoom/Video Conferencing Subscriptions',
    'SaaS Tools',
    'Email Marketing Tools',
    'CRM Systems',
    'Design Software',
    'Project Management Software',
    'Financial Software Subscriptions',
    'Cloud Storage Costs',
    'Accounting Software',
    'Data Analytics Tools'
  ],
  'Legal & Compliance': [
    'Lawyer Fees',
    'Compliance Audits',
    'Contract Review Fees',
    'Court Filing Fees',
    'Regulatory Submissions',
    'Notary Services',
    'Intellectual Property Fees',
    'External Counsel Payments',
    'Business Permits',
    'Legal Retainers'
  ],
  'Office Utilities': [
    'Electricity Bills',
    'Water Bills',
    'Heating & Cooling',
    'Gas Bills',
    'Waste Disposal Services',
    'Internet Services',
    'Data Backup Services',
    'Office Cleaning Services',
    'Power Generator Maintenance',
    'Water Filters & Coolers'
  ],
  'IT & Equipment': [
    'Computer Parts & Accessories',
    'Software Subscriptions',
    'IT Support Services',
    'Cloud Storage',
    'Hardware Repairs',
    'Office Networking Equipment',
    'Server Maintenance',
    'Anti-Virus Software',
    'License Renewals',
    'IT Consulting Fees'
  ],
  'Recruitment & Human Resources': [
    'Job Posting Fees',
    'Background Checks',
    'Employee Onboarding Kits',
    'Recruitment Agency Fees',
    'Interview Travel Expenses',
    'Temporary Staffing Costs',
    'HR Software Subscriptions',
    'Employee Handbooks',
    'Job Fair Registrations',
    'Hiring Events'
  ],
  'Event & Meeting Expenses': [
    'Meeting Room Rentals',
    'Conference Registrations',
    'Refreshments for Meetings',
    'Event Hosting Costs',
    'Conference Materials',
    'Equipment Rentals (for events)',
    'AV Equipment Hire',
    'Conference Travel Costs',
    'Promotional Materials for Events',
    'Event Security'
  ],
  'Miscellaneous/Unexpected Expenses': [
    'Cash Shortages',
    'Miscellaneous Reimbursements',
    'Unexpected Small Purchases',
    'Office Party Expenses',
    'Special Project Fees',
    'Emergency Purchases',
    'Temporary Fixes',
    'Unexpected Vendor Charges',
    'Equipment Rentals',
    'Minor Emergencies'
  ]
};


const columnDefinitions = [
  {
    id: 'index',
    header: '#',
    size: '40',
    cellContent: (entry, index) => `${index + 1}`
  },
  {
    id: 'invoice_date',
    header: 'Date',
    size: '100',
    cellContent: entry => formatDate(entry.invoice_date)
  },
  {
    id: 'amount',
    header: 'Amount',
    size: '100',
    cellContent: entry => entry.amount
  },
  {
    id: 'description',
    header: 'Description',
    size: '200',
    cellContent: entry => entry.description
  },
  {
    id: 'expense_type',
    header: 'Category',
    size: '120',
    cellContent: entry => entry.expense_type
  },
  {
    id: 'is_verified',
    header: 'Status',
    size: '80',
    cellContent: entry => entry.is_verified ? 'Verified' : 'Pending'
  },
  {
    id: 'checked_by',
    header: 'Checked By',
    size: '120',
    cellContent: entry => entry.checked_by
  },
  {
    id: 'approved_by',
    header: 'Approved By',
    size: '120',
    cellContent: entry => entry.approved_by
  },
  {
    id: 'receipt_url',
    header: 'Receipt',
    size: '100',
    cellContent: (entry) => (
      entry.receipt_url ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link">View Receipt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
            <DialogHeader>
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>
            <iframe
              src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${entry.receipt_url}`}
              style={{ width: '100%', height: '70vh', border: 'none', display: 'block', margin: 'auto' }}
              title="Receipt Preview"
            />
          </DialogContent>
        </Dialog>
      ) : 'No Receipt'
    )
  },
  {
    id: 'actions',
    header: 'Actions',
    size: '100',
    cellContent: entry => entry
  }
];

  const EditForm = ({ entry, onClose, onSubmit }) => {
    const [editedEntry, setEditedEntry] = useState(entry);
    const [selectedCategory, setSelectedCategory] = useState(entry.expense_type || '');

    const handleChange = (e) => {
      setEditedEntry({ ...editedEntry, [e.target.name]: e.target.value });
    };

    const handleCategoryChange = (value) => {
      setSelectedCategory(value);
      setEditedEntry({ ...editedEntry, expense_type: value, subcategory: '' });
    };

    const handleSubcategoryChange = (value) => {
      setEditedEntry({ ...editedEntry, subcategory: value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(editedEntry);
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={editedEntry.amount}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <Label htmlFor="invoice_date">Invoice Date</Label>
          <Input
            id="invoice_date"
            name="invoice_date"
            type="date"
            value={editedEntry.invoice_date}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={editedEntry.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="expense_type">Expense Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCategory && (
          <div>
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              value={editedEntry.subcategory}
              onValueChange={handleSubcategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategoriesMap[selectedCategory].map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="payment_type">Payment Type</Label>
          <Input
            id="payment_type"
            name="payment_type"
            value={editedEntry.payment_type}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="checked_by">Checked By</Label>
          <Input
            id="checked_by"
            name="checked_by"
            value={editedEntry.checked_by}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="approved_by">Approved By</Label>
          <Input
            id="approved_by"
            name="approved_by"
            value={editedEntry.approved_by}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="branch_name">Branch</Label>
          <Input
            id="branch_name"
            name="branch_name"
            value={editedEntry.branch_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="user_name">User</Label>
          <Input
            id="user_name"
            name="user_name"
            value={editedEntry.user_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="account_type">Account Type</Label>
          <Input
            id="account_type"
            name="account_type"
            value={editedEntry.account_type}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="receipt_url">Receipt Image</Label>
          {editedEntry.receipt_url ? (
            <div className="flex items-center space-x-2">
              <p>Current receipt: {editedEntry.receipt_url}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Receipt</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
                  <DialogHeader>
                    <DialogTitle>Receipt Preview</DialogTitle>
                  </DialogHeader>
                  <Image
                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${editedEntry.receipt_url}`}
                    alt="Receipt"
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={() => setEditedEntry({ ...editedEntry, receipt_url: null })}>
                Remove Receipt
              </Button>
            </div>
          ) : (
            <Input
              id="receipt_url"
              name="receipt_url"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setEditedEntry({ ...editedEntry, receipt_url: event.target.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          )}
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    );
  };



  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-6 w-full">
        <h1 className="text-xl font-semibold mb-2">Monthly Petty Cash Entries</h1>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchPettyCashEntries}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                  {formFields.map(({ id, label, type, placeholder, options, onChange, accept }) => (
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
        <Card className="rounded-md border-0 shadow-sm">
          <div className="relative">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-blue-600 hover:bg-blue-600">
                    {columnDefinitions.map((column) => (
                      <TableHead
                        key={column.id}
                        style={{
                          width: `${column.size}px`,
                          minWidth: `${column.size}px`
                        }}
                        className="text-white h-8 text-xs font-medium border-r border-blue-500 last:border-r-0 text-center px-2"
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pettyCashEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((column) => (
                        <TableCell
                          key={`${entry.id}-${column.id}`}
                          style={{
                            width: `${column.size}px`,
                            minWidth: `${column.size}px`
                          }}
                          className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                        >
                          {column.id === 'actions' ? (
                            <TableActions
                              row={entry}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onVerify={handleVerify}
                              isVerified={entry.is_verified}
                              editForm={(entry, onClose) => (
                                <EditForm entry={entry} onClose={onClose} onSubmit={handleEditSubmit} />
                              )}
                            />
                          ) : (
                            column.cellContent(entry, index)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Petty Cash Entry</DialogTitle>
            </DialogHeader>
            {currentEntry && (
              <div className="flex flex-col gap-4">
                {formFields.map(({ id, label, type, placeholder, options }) => (
                  <div key={id} className="space-y-1">
                    <Label htmlFor={id}>{label}</Label>
                    {type === 'select' ? (
                      <Select
                        value={currentEntry[id]}
                        onValueChange={(value) => setCurrentEntry({ ...currentEntry, [id]: value })}
                      >
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
                    ) : (
                      <Input
                        id={id}
                        type={type}
                        placeholder={placeholder}
                        value={currentEntry[id] || ''}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, [id]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </main>
    </div>
  );
}