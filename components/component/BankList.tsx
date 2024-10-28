// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon, DownloadIcon, EditIcon, TrashIcon } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
interface BankProps {
  selectedUserId: string;
}
interface Bank {
  id: number;
  name: string;
  account_number: string;
  currency: string;
  branch?: string;
  relationship_manager_name?: string;
  relationship_manager_mobile?: string;
  relationship_manager_email?: string;
  startdate?: string;
  userid: string;
  verified: boolean;
  status: boolean;
}

export function BankList({ selectedUserId }: BankProps) {
  const { user } = useUser();
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
// Update the initial state for newBank to match all fields
const [newBank, setNewBank] = useState<Partial<Bank>>({
  name: '',
  account_number: '',
  currency: '',
  branch: '',
  relationship_manager_name: '',
  relationship_manager_mobile: '',
  relationship_manager_email: '',
  startdate: '',
  status: true,
  verified: false
});

  const [editingBank, setEditingBank] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const userIdentifier = selectedUserId || user.id;

  useEffect(() => {
    fetchBanks();
  }, [userIdentifier, currentPage, searchTerm]);

  const fetchBanks = async () => {
    if (!userIdentifier) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('acc_portal_banks')
        .select('*', { count: 'exact' })
       .eq('userid', userIdentifier)
        .order('id', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`);
      }

      // Add pagination
      const start = (currentPage - 1) * itemsPerPage;
      query = query.range(start, start + itemsPerPage - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      setBanks(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Failed to fetch banks');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async () => {
    try {
      if (!newBank.name || !newBank.account_number || !newBank.currency) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('acc_portal_banks')
        .insert([{
          ...newBank,
          userid: selectedUserId || user.id
        }]);

      if (error) throw error;

      toast.success('Bank added successfully');
      setIsAddSheetOpen(false);
      setNewBank({
        name: '',
        account_number: '',
        currency: '',
        branch: '',
        relationship_manager_name: '',
        relationship_manager_mobile: '',
        relationship_manager_email: '',
        startdate: new Date().toISOString().split('T')[0],
        status: true
      });
      fetchBanks();
    } catch (error) {
      console.error('Error adding bank:', error);
      toast.error('Failed to add bank: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingBank) return;

    try {
      const { error } = await supabase
        .from('acc_portal_banks')
        .update({
          name: editingBank.name,
          account_number: editingBank.account_number,
          currency: editingBank.currency,
          branch: editingBank.branch,
          relationship_manager_name: editingBank.relationship_manager_name,
          relationship_manager_mobile: editingBank.relationship_manager_mobile,
          relationship_manager_email: editingBank.relationship_manager_email,
          status: editingBank.status,
          startdate: editingBank.startdate
        })
        .eq('id', editingBank.id)
        .eq('userid', selectedUserId);

      if (error) throw error;

      toast.success('Bank updated successfully');
      setIsEditDialogOpen(false);
      setEditingBank(null);
      fetchBanks();
    } catch (error) {
      console.error('Error updating bank:', error);
      toast.error('Failed to update bank');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bank?')) return;

    try {
      const { error } = await supabase
        .from('acc_portal_banks')
        .delete()
        .eq('id', id)
        .eq('userid', selectedUserId);

      if (error) throw error;

      toast.success('Bank deleted successfully');
      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      toast.error('Failed to delete bank');
    }
  };


  // Handle CSV upload
  const handleCSVUpload = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        const banks = rows.slice(1).map(row => {
          const values = row.split(',');
          const bank = {};
          headers.forEach((header, index) => {
            bank[header] = values[index]?.trim() || '';
          });
          return bank;
        });

        let successCount = 0;
        let errorCount = 0;

        for (const bank of banks) {
          try {
            const { error } = await supabase
              .from('acc_portal_banks')
              .insert([{ ...bank, userid: user.id }]);

            if (error) errorCount++;
            else successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        toast.success(`Successfully added ${successCount} banks`);
        if (errorCount > 0) {
          toast.error(`Failed to add ${errorCount} banks`);
        }
        
        setIsUploadDialogOpen(false);
        fetchBanks();
      } catch (error) {
        console.error('Error processing CSV:', error);
        toast.error('Failed to process CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
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
    link.href = URL.createObjectURL(blob);
    link.download = 'bank_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Bank Accounts List</h1>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={fetchBanks} disabled={isLoading}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download Template
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UploadIcon className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to add multiple bank accounts
                  </DialogDescription>
                </DialogHeader>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleCSVUpload(e.target.files?.[0])}
                />
              </DialogContent>
            </Dialog>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button>Add New Bank</Button>
              </SheetTrigger>
              <SheetContent>
  <SheetHeader>
    <SheetTitle>Add Bank Account</SheetTitle>
    <SheetDescription>
      Enter the details for the new bank account
    </SheetDescription>
  </SheetHeader>
  <div className="space-y-4 mt-4">
    <div>
      <Label htmlFor="name">Bank Name</Label>
      <Input
        id="name"
        value={newBank.name}
        onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
        required
      />
    </div>
    <div>
      <Label htmlFor="account_number">Account Number</Label>
      <Input
        id="account_number"
        value={newBank.account_number}
        onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
        required
      />
    </div>
    <div>
      <Label htmlFor="currency">Currency</Label>
      <Select
        value={newBank.currency}
        onValueChange={(value) => setNewBank({ ...newBank, currency: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="KES">KES</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="EUR">EUR</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="branch">Branch</Label>
      <Input
        id="branch"
        value={newBank.branch}
        onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="relationship_manager_name">RM Name</Label>
      <Input
        id="relationship_manager_name"
        value={newBank.relationship_manager_name}
        onChange={(e) => setNewBank({ ...newBank, relationship_manager_name: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="relationship_manager_mobile">RM Mobile</Label>
      <Input
        id="relationship_manager_mobile"
        value={newBank.relationship_manager_mobile}
        onChange={(e) => setNewBank({ ...newBank, relationship_manager_mobile: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="relationship_manager_email">RM Email</Label>
      <Input
        id="relationship_manager_email"
        value={newBank.relationship_manager_email}
        onChange={(e) => setNewBank({ ...newBank, relationship_manager_email: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="startdate">Start Date</Label>
      <Input
        id="startdate"
        type="date"
        value={newBank.startdate}
        onChange={(e) => setNewBank({ ...newBank, startdate: e.target.value })}
      />
    </div>
    <Button onClick={handleSubmit}>Add Bank Account</Button>
  </div>
</SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Table */}
        <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Bank ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>RM Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">No banks found</TableCell>
              </TableRow>
            ) : (
              banks.map((bank, index) => (
                <TableRow key={bank.id}>
                  <TableCell>B-{bank.id}</TableCell>
                  <TableCell>{bank.name}</TableCell>
                  <TableCell>{bank.account_number}</TableCell>
                  <TableCell>{bank.currency}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell>{bank.relationship_manager_name}</TableCell>
                  <TableCell>{formatDate(bank.startdate)}</TableCell>
                  <TableCell>
                    <Badge variant={bank.status ? "success" : "destructive"}>
                      {bank.status ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bank.verified ? "success" : "destructive"}>
                      {bank.verified ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBank(bank);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bank.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>


        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Total: {totalItems} banks
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
              <DialogDescription>
                Make changes to the bank account details below
              </DialogDescription>
            </DialogHeader>
            {editingBank && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Bank Name</Label>
                  <Input
                    id="edit-name"
                    value={editingBank.name}
                    onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-account-number">Account Number</Label>
                  <Input
                    id="edit-account-number"
                    value={editingBank.account_number}
                    onChange={(e) => setEditingBank({ ...editingBank, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select
                    value={editingBank.currency}
                    onValueChange={(value) => setEditingBank({ ...editingBank, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-branch">Branch</Label>
                  <Input
                    id="edit-branch"
                    value={editingBank.branch}
                    onChange={(e) => setEditingBank({ ...editingBank, branch: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rm-name">Relationship Manager Name</Label>
                  <Input
                    id="edit-rm-name"
                    value={editingBank.relationship_manager_name}
                    onChange={(e) => setEditingBank({ ...editingBank, relationship_manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rm-mobile">Relationship Manager Mobile</Label>
                  <Input
                    id="edit-rm-mobile"
                    value={editingBank.relationship_manager_mobile}
                    onChange={(e) => setEditingBank({ ...editingBank, relationship_manager_mobile: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rm-email">Relationship Manager Email</Label>
                  <Input
                    id="edit-rm-email"
                    value={editingBank.relationship_manager_email}
                    onChange={(e) => setEditingBank({ ...editingBank, relationship_manager_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingBank.status.toString()}
                    onValueChange={(value) => setEditingBank({ ...editingBank, status: value === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}