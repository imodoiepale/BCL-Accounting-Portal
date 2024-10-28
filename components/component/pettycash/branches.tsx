// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCwIcon, Search } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';

import { supabase } from '@/lib/supabaseClient';

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};

interface Branch {
  branch_name: string;
  location: string;
  manager_name: string;
  contact_number: string;
  email: string;
  created_at: string;
  is_verified?: boolean;
}
interface BranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  onSave: (branch: Branch) => Promise<void>;
  mode: 'create' | 'edit';
}

const BranchDialog: React.FC<BranchDialogProps> = ({
  isOpen,
  onClose,
  branch,
  onSave,
  mode
}) => {
  const [formData, setFormData] = useState<Branch | null>(branch);

  useEffect(() => {
    setFormData(branch);
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save branch');
      console.error('Error saving branch:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value // Direct property access, not nested under data
      };
    });
  };

  const formFields = [
    { name: 'branch_name', label: 'Branch Name', type: 'text', required: true },
    { name: 'location', label: 'Location', type: 'text', required: true },
    { name: 'manager_name', label: 'Manager Name', type: 'text', required: true },
    { name: 'contact_number', label: 'Contact Number', type: 'tel', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Branch' : 'Edit Branch'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(({ name, label, type, required }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData?.[name] || ''} // Direct property access
                onChange={handleInputChange}
                className="h-8"
                required={required}
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white">
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BranchForm: React.FC<{
  entry: Branch;
  onClose: () => void;
  onSubmit: (data: Branch) => Promise<void>;
}> = ({ entry, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Branch>(entry);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value // Direct access, not nested under data
    }));
  };

  const formFields = [
    { name: 'branch_name', label: 'Branch Name', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'manager_name', label: 'Manager Name', type: 'text' },
    { name: 'contact_number', label: 'Contact Number', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' }
  ];

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}
      className="space-y-4 pt-4">
      {formFields.map(({ name, label, type }) => (
        <div key={name} className="space-y-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type={type}
            value={formData[name] || ''} // Direct access, not nested under data
            onChange={handleInputChange}
            className="h-8"
          />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export function BranchesTab() {
  const { userId } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    branch: Branch | null;
  }>({
    isOpen: false,
    mode: 'create',
    branch: null
  });;

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await PettyCashService.fetchBranchRecords(userId);

      // Extract branches array from the JSONB data structure
      const branchesData = response?.data?.branches || [];
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches');
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [userId]);

  const handleCreateBranch = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      branch: {
        branch_name: '',
        location: '',
        manager_name: '',
        contact_number: '',
        email: '',
        created_at: new Date().toISOString()
      }
    });
  };

  const createRecord = async (table: string, data: any, userId: string) => {
    try {
      const { data: existingRecord } = await supabase
        .from(table)
        .select('*')
        .eq('userid', userId)
        .single();

      let recordData;

      if (existingRecord) {
        // If record exists, append to existing branches
        const currentBranches = existingRecord.data.branches || [];
        recordData = {
          ...existingRecord,
          data: {
            branches: [...currentBranches, {
              branch_name: data.data.branch_name,
              location: data.data.location,
              manager_name: data.data.manager_name,
              contact_number: data.data.contact_number,
              email: data.data.email,
              created_at: new Date().toISOString()
            }]
          }
        };
      } else {
        // Create new record with first branch
        recordData = {
          userid: userId,
          data: {
            branches: [{
              branch_name: data.data.branch_name,
              location: data.data.location,
              manager_name: data.data.manager_name,
              contact_number: data.data.contact_number,
              email: data.data.email,
              created_at: new Date().toISOString()
            }]
          },
          created_at: new Date().toISOString()
        };
      }

      const { data: result, error } = await supabase
        .from(table)
        .upsert([recordData])
        .select();

      if (error) throw error;

      toast.success('Branch added successfully!');
      return result;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      toast.error(`Failed to create branch. Please try again.`);
      return null;
    }
  };


  const handleEditBranch = (branch: Branch) => {
    // Make sure we're passing a flat branch object
    setDialogState({
      isOpen: true,
      mode: 'edit',
      branch: {
        branch_name: branch.branch_name,
        location: branch.location,
        manager_name: branch.manager_name,
        contact_number: branch.contact_number,
        email: branch.email,
        created_at: branch.created_at,
        is_verified: branch.is_verified
      }
    });
  };
  const toastConfig = {
    duration: 2000,
    dismissible: true,
    position: 'top-right'
  };

  const flattenBranchData = (rawBranch: any): Branch => {
    if (!rawBranch) return null;

    // If the data is nested under 'data', extract it
    const branchData = rawBranch.data || rawBranch;

    return {
      branch_name: branchData.branch_name,
      location: branchData.location,
      manager_name: branchData.manager_name,
      contact_number: branchData.contact_number,
      email: branchData.email,
      created_at: branchData.created_at,
      is_verified: branchData.is_verified
    };
  };


  const handleSaveBranch = async (branch: Branch) => {
    try {
      if (dialogState.mode === 'create') {
        const result = await PettyCashService.createBranchRecord(
          'acc_portal_pettycash_branches',
          branch, // Pass the branch directly
          userId
        );
        if (result) {
          toast.success('Branch created successfully');
          fetchBranches();
        }
      } else {
        await PettyCashService.updateBranchRecord(
          branch.branch_name,
          branch, // Pass the branch directly
          userId
        );
        toast.success('Branch updated successfully');
        fetchBranches();
      }
      setDialogState({ isOpen: false, mode: 'create', branch: null });
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error(dialogState.mode === 'create' ? 'Failed to create branch' : 'Failed to update branch');
    }
  };

  const handleDeleteBranch = async (branchToDelete: Branch) => {
    try {
      await PettyCashService.deleteBranchRecord(branchToDelete.branch_name, userId);
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (error) {
      toast.error('Failed to delete branch');
    }
  };

  // Verify Branch
  const handleVerifyBranch = async (branch: Branch) => {
    try {
      await PettyCashService.verifyBranchRecord(branch.branch_name, userId);
      toast.success('Branch verified successfully');
      fetchBranches();
    } catch (error) {
      toast.error('Failed to verify branch');
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.manager_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Branch Name',
      width: '200px',
      cell: (branch: Branch) => branch.branch_name
    },
    {
      header: 'Location',
      width: '200px',
      cell: (branch: Branch) => branch.location
    },
    {
      header: 'Manager',
      width: '150px',
      cell: (branch: Branch) => branch.manager_name
    },
    {
      header: 'Contact',
      width: '150px',
      cell: (branch: Branch) => branch.contact_number
    },
    {
      header: 'Email',
      width: '200px',
      cell: (branch: Branch) => branch.email
    },
    {
      header: 'Created Date',
      width: '120px',
      cell: (branch: Branch) => format(new Date(branch.created_at), 'dd/MM/yyyy')
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (branch: Branch) => (
        <TableActions
          row={branch} // Pass the branch directly, not nested
          onEdit={() => handleEditBranch(branch)}
          onDelete={() => handleDeleteBranch(branch)}
          onVerify={() => handleVerifyBranch(branch)}
          isVerified={branch.is_verified}
          editForm={BranchForm}
          editFormProps={{
            onClose: () => setDialogState({ isOpen: false, mode: 'create', branch: null })
          }}
        />
      )
    }
  ];



  return (
    <div className="flex w-full bg-gray-100">

      <main className="flex-1 p-4 w-full">
        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBranches}
              className="h-8"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateBranch}
              className="h-8 bg-blue-600 text-white"
            >
              Add New Branch
            </Button>
          </div>
        </div>

        {/* Branches Table */}
        <Card className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  {columnDefinitions.map((col, index) => (
                    <TableHead
                      key={index}
                      style={{ width: col.width }}
                      className="text-white h-8 text-xs font-medium border-r border-blue-500 last:border-r-0"
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      <RefreshCwIcon className="h-4 w-4 animate-spin mx-auto" />
                      <span className="mt-2">Loading branches...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      No branches found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch, index) => (
                    <TableRow
                      key={branch.branch_name}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${branch.branch_name}-${colIndex}`}
                          style={{ width: col.width }}
                          className="py-2 px-2 text-xs border-r border-gray-100 last:border-r-0"
                        >
                          {col.cell(branch, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Branch Dialog */}
        <BranchDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, mode: 'create', branch: null })}
          branch={dialogState.branch}
          onSave={handleSaveBranch}
          mode={dialogState.mode}
        />
      </main>
    </div>
  );
}

export default BranchesTab;