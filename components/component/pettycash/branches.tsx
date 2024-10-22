// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import { TableActions } from './TableActions';
import { PettyCashService } from './PettyCashService';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function BranchesTab() {
  const { userId } = useAuth();
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    branch_name: '',
    location: '',
    manager_name: '',
    contact_number: '',
    email: '',
  });

  const fetchBranches = async () => {
    setIsLoading(true);
    const data = await PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId, {
      orderBy: { column: 'id', ascending: true }
    });
    setBranches(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, [userId]);

  const handleCreate = async () => {
    const result = await PettyCashService.createRecord('acc_portal_pettycash_branches', newBranch, userId);
    if (result) {
      setNewBranch({
        branch_name: '',
        location: '',
        manager_name: '',
        contact_number: '',
        email: '',
      });
      setIsSheetOpen(false);
      fetchBranches();
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [id]: value }));
  };

  const formFields = [
    { id: 'branch_name', label: 'Branch Name', type: 'text', placeholder: 'Enter branch name' },
    { id: 'location', label: 'Location', type: 'text', placeholder: 'Enter branch location' },
    { id: 'manager_name', label: 'Manager Name', type: 'text', placeholder: 'Enter manager name' },
    { id: 'contact_number', label: 'Contact Number', type: 'tel', placeholder: 'Enter contact number' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
  ];

  const EditForm = (branch, onSave) => {
    const [editData, setEditData] = useState(branch);

    const handleSubmit = async () => {
      const result = await PettyCashService.updateRecord('acc_portal_pettycash_branches', branch.id, editData);
      if (result) {
        onSave();
        fetchBranches();
      }
    };

    return (
      <div className="flex flex-col pt-4 gap-4">
        {formFields.map(({ id, label, type, placeholder }) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              type={type}
              placeholder={placeholder}
              value={editData[id]}
              onChange={(e) => setEditData({ ...editData, [id]: e.target.value })}
            />
          </div>
        ))}
        <Button onClick={handleSubmit} className="bg-blue-600 text-white">
          Save Changes
        </Button>
      </div>
    );
  };

  const tableFields = [
    { label: 'Branch ID', key: 'id', format: (id) => `BR-${id}` },
    { label: 'Branch Name', key: 'branch_name' },
    { label: 'Location', key: 'location' },
    { label: 'Manager Name', key: 'manager_name' },
    { label: 'Contact Number', key: 'contact_number' },
    { label: 'Email', key: 'email' },
    { label: 'Created Date', key: 'created_date', format: (date) => formatDate(date) },
    {
      label: 'Actions',
      key: 'actions',
      format: (_, branch) => (
        <TableActions
          row={branch}
          onEdit={(data) => PettyCashService.updateRecord('acc_portal_pettycash_branches', branch.id, data)}
          onDelete={() => PettyCashService.deleteRecord('acc_portal_pettycash_branches', branch.id)}
          onVerify={() => PettyCashService.verifyRecord('acc_portal_pettycash_branches', branch.id)}
          isVerified={branch.is_verified}
          editForm={EditForm}
        />
      ),
    },
  ];

  const filteredBranches = branches.filter(branch =>
    branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.manager_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-6 w-full">
        <h1 className="text-xl font-semibold mb-4">Branches</h1>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search branches..."
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline" className="flex items-center" onClick={fetchBranches}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Branch</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add New Branch</SheetTitle>
                  <SheetDescription>
                    Enter the details of the new branch.
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
                        value={newBranch[id]}
                        onChange={handleInputChange}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleCreate}>
                    Submit
                  </Button>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={tableFields.length} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableFields.length} className="text-center">
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.map((branch) => (
                  <TableRow key={branch.id}>
                    {tableFields.map(({ key, format }) => (
                      <TableCell key={key}>
                        {format ? format(branch[key], branch) : branch[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
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

export default BranchesTab;