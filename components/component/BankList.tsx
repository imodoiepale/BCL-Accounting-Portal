
// @ts-nocheck
"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon, DownloadIcon, EditIcon, TrashIcon } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key)

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function BankList() {
  const { user } = useUser();
  const [banks, setBanks] = useState([])
  const [newBank, setNewBank] = useState({
    name: '',
    account_number: '',
    currency: '',
    branch: '',
    relationship_manager_name: '',
    relationship_manager_mobile: '',
    relationship_manager_email: '',
  })
  const [editingBank, setEditingBank] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)


  const fetchBanks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .select('*')
      .eq('userid', user.id)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching banks:', error)
      toast.error('Failed to fetch banks: ' + error.message)
    }
    else setBanks(data)
  }, [user]);


  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (editingBank) {
      setEditingBank({ ...editingBank, [id]: value })
    } else {
      setNewBank({ ...newBank, [id]: value })
    }
  }

  const handleSelectChange = (value) => {
    if (editingBank) {
      setEditingBank({ ...editingBank, currency: value })
    } else {
      setNewBank({ ...newBank, currency: value })
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return;
    }
    
    // Check if account number already exists
    try {
      const { data: existingAccount, error: checkError } = await supabase
        .from('acc_portal_banks')
        .select('account_number')
        .eq('account_number', newBank.account_number)
        .maybeSingle()
  
      if (checkError) throw checkError;
  
      if (existingAccount) {
        toast.error('An account with this account number already exists')
        return;
      }
  
      const { data, error } = await supabase
        .from('acc_portal_banks')
        .insert([{ ...newBank, userid: user.id, status: 'true' }])
      
      if (error) throw error;
  
      fetchBanks()
      setNewBank({
        name: '',
        account_number: '',
        currency: '',
        branch: '',
        relationship_manager_name: '',
        relationship_manager_mobile: '',
        relationship_manager_email: '',
      })
      toast.success('Bank added successfully')
    } catch (error) {
      console.error('Error adding bank:', error)
      toast.error('Failed to add bank: ' + error.message)
    }
  }


  const handleEdit = (bank) => {
    setEditingBank(bank)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return;
    }
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .update(editingBank)
      .eq('id', editingBank.id)
      .eq('userid', user.id)
    if (error) {
      console.error('Error updating bank:', error)
      toast.error('Failed to update bank')
    }
    else {
      fetchBanks()
      setIsEditDialogOpen(false)
      setEditingBank(null)
      toast.success('Bank updated successfully')
    }
  }

  const handleDelete = async (id) => {
    if (!user) {
      toast.error('User not authenticated')
      return;
    }
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .delete()
      .eq('id', id)
      .eq('userid', user.id)
    if (error) {
      console.error('Error deleting bank:', error)
      toast.error('Failed to delete bank')
    }
    else {
      fetchBanks()
      toast.success('Bank deleted successfully')
    }
  }

  const handleCSVUpload = async (file) => {
    if (!user) {
      toast.error('User not authenticated')
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(header => header.trim());
        const banks = rows.slice(1).map(row => {
          const rowData = row.split(',');
          const bank = {};
          headers.forEach((header, index) => {
            if (header) {  // Only process non-empty headers
              bank[header] = rowData[index] ? rowData[index].trim() : '';
            }
          });
          return Object.values(bank).some(value => value !== '') ? bank : null;
        }).filter(bank => bank !== null);
    
        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;
    
        for (const bank of banks) {
          try {
            const { data, error } = await supabase
              .from('acc_portal_banks')
              .insert([{ ...bank, userid: user.id }])
              .select();

            if (error) {
              console.error('Error adding bank:', error);
              errorCount++;
            } else {
              successCount++;
              setBanks(prevBanks => [...prevBanks, data[0]]);
            }
          } catch (error) {
            console.error('Unexpected error during insertion:', error);
            errorCount++;
          }
        }
    
        setIsLoading(false);
        setIsDialogOpen(false);
    
        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} bank${successCount > 1 ? 's' : ''}.`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to add ${errorCount} bank${errorCount > 1 ? 's' : ''}.`);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'name',
      'account_number',
      'currency',
      'branch',
      'relationship_manager_name',
      'relationship_manager_mobile',
      'relationship_manager_email'
    ];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'bank_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Bank Accounts List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchBanks}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" className="flex items-center" onClick={downloadCSVTemplate}>
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download CSV Template
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Bank Account</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Bank Account</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a bank account to the system
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor="name">Bank Name</Label>
                      <Input id="name" placeholder="XYZ Bank" value={newBank.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input id="account_number" placeholder="011110001122" value={newBank.account_number} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={handleSelectChange} value={newBank.currency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" placeholder="Main Branch" value={newBank.branch} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_name">Relationship Manager Name</Label>
                    <Input id="relationship_manager_name" placeholder="John Doe" value={newBank.relationship_manager_name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_mobile">Relationship Manager Mobile</Label>
                    <Input id="relationship_manager_mobile" placeholder="+25471234567" value={newBank.relationship_manager_mobile} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_email">Relationship Manager Email</Label>
                    <Input id="relationship_manager_email" placeholder="john@example.com" value={newBank.relationship_manager_email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
                </div>
              </SheetContent>
            </Sheet>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 text-white flex items-center">
                  <UploadIcon className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to add multiple bank accounts at once
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col pt-4 gap-4">
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => handleCSVUpload(e.target.files[0])}
                  />
                  <Button 
                    className="bg-green-600 text-white" 
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Uploading...' : 'Choose File and Upload'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BANK ACC ID</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>RM Name</TableHead>
                <TableHead>RM Mobile</TableHead>
                <TableHead>RM Email</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved by BCL</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank, index) => (
                <TableRow key={bank.id}>
                  <TableCell>B-{index + 1}</TableCell>
                  <TableCell>{bank.name}</TableCell>
                  <TableCell>{bank.account_number}</TableCell>
                  <TableCell>{bank.currency}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell>{bank.relationship_manager_name}</TableCell>
                  <TableCell>{bank.relationship_manager_mobile}</TableCell>
                  <TableCell>{bank.relationship_manager_email}</TableCell>
                  <TableCell>{bank.startdate ? formatDate(bank.startdate) : ''}</TableCell>
                  <TableCell>{bank.enddate ? formatDate(bank.enddate) : ''}</TableCell>
                  <TableCell>
                    <span className={`font-bold capitalize ${bank.status ? 'text-green-600' : 'text-red-600'}`}>
                      {bank.status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={bank.verified ? "success" : "destructive"}>
                      {bank.verified ? "✔️" : "❌"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(bank)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(bank.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update the details of the bank account
            </DialogDescription>
          </DialogHeader>
          {editingBank && (
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Bank Name</Label>
                <Input id="name" value={editingBank.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="account_number">Account Number</Label>
                <Input id="account_number" value={editingBank.account_number} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Select onValueChange={handleSelectChange} value={editingBank.currency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" value={editingBank.branch} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="relationship_manager_name">Relationship Manager Name</Label>
                <Input id="relationship_manager_name" value={editingBank.relationship_manager_name} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="relationship_manager_mobile">Relationship Manager Mobile</Label>
                <Input id="relationship_manager_mobile" value={editingBank.relationship_manager_mobile} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="relationship_manager_email">Relationship Manager Email</Label>
                <Input id="relationship_manager_email" value={editingBank.relationship_manager_email} onChange={handleInputChange} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}