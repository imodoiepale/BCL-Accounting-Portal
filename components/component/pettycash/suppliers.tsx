// @ts-nocheck

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCwIcon, Search, Plus, Upload } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import { PettyCashService } from './PettyCashService';
import TableActions from './TableActions';
import SupplierForm from './SupplierForm';
import CsvImportDialog from './CsvImportDialog';
import { SupplierData, Supplier } from './supplier';
import { SupplierDialog } from './SupplierDialog';


interface SupplierData {
  supplierName: string;
  supplierType: 'Corporate' | 'Individual';
  pin: string;
  idNumber: string;
  mobile: string;
  email: string;
  tradingType: 'Purchase Only' | 'Expense Only' | 'Both Purchase + Expense';
}

interface Supplier {
  id: string;
  userid: string;
  data: SupplierData;
  created_at: string;
}


export const CSV_TEMPLATE_HEADERS = [
  'Supplier Name',
  'Supplier Type (Corporate/Individual)',
  'PIN (For Corporate)',
  'ID Number (For Individual)',
  'Mobile',
  'Email',
  'Trading Type (Purchase Only/Expense Only/Both Purchase + Expense)'
];



export function SuppliersTab() {
  // State Management
  const { userId } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Corporate' | 'Individual'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);

  // Fetch Suppliers
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId);
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handlers
  const handleAddSupplier = async (formData: SupplierData) => {
    try {
      await PettyCashService.createRecord('acc_portal_pettycash_suppliers', {
        userid: userId,
        data: formData
      });
      toast.success('Supplier added successfully');
      fetchSuppliers();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Failed to add supplier');
    }
  };

  const handleEditSupplier = async (formData: SupplierData) => {
    if (!editingSupplier) return;
    try {
      await PettyCashService.updateRecord('acc_portal_pettycash_suppliers', editingSupplier.id, {
        userid: userId,
        data: formData
      });
      toast.success('Supplier updated successfully');
      fetchSuppliers();
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier');
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_suppliers', supplier.id);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    }
  };

   const handleSubmit = async (formData: SupplierData) => {
    try {
      if (editingSupplier) {
        await PettyCashService.updateRecord('acc_portal_pettycash_suppliers', editingSupplier.id, {
          userid: userId,
          data: formData
        });
        toast.success('Supplier updated successfully');
      } else {
        await PettyCashService.createRecord('acc_portal_pettycash_suppliers', {
          userid: userId,
          data: formData
        });
        toast.success('Supplier added successfully');
      }
      fetchSuppliers();
      setIsDialogOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error processing supplier:', error);
      toast.error(editingSupplier ? 'Failed to update supplier' : 'Failed to add supplier');
    }
  };



  // Filtering
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.data.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.data.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.data.pin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === 'all' ||
      supplier.data.supplierType === selectedType;

    return matchesSearch && matchesType;
  });

  // Column Definitions
  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => index + 1
    },
    {
      header: 'Name',
      width: '200px',
      cell: (supplier: Supplier) => supplier.data.supplierName
    },
    {
      header: 'Type',
      width: '100px',
      cell: (supplier: Supplier) => supplier.data.supplierType
    },
    {
      header: 'PIN/ID Number',
      width: '120px',
      cell: (supplier: Supplier) => {
        if (supplier.data.supplierType === 'Corporate') {
          return supplier.data.pin || '-';
        }
        return supplier.data.idNumber || '-';
      }
    },
    {
      header: 'Mobile',
      width: '120px',
      cell: (supplier: Supplier) => supplier.data.mobile
    },
    {
      header: 'Email',
      width: '200px',
      cell: (supplier: Supplier) => supplier.data.email
    },
    {
      header: 'Trading Type',
      width: '150px',
      cell: (supplier: Supplier) => supplier.data.tradingType
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (supplier: Supplier) => (
        <TableActions
          row={supplier}
          onEdit={() => setEditingSupplier(supplier)}
          onDelete={() => handleDeleteSupplier(supplier)}
        />
      )
    }
  ];

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-4 w-full">
        <Tabs defaultValue="all" onValueChange={(value) => setSelectedType(value as typeof selectedType)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Suppliers</TabsTrigger>
              <TabsTrigger value="Corporate">Corporate</TabsTrigger>
              <TabsTrigger value="Individual">Individual</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-64"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchSuppliers}
                className="h-8"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsCsvDialogOpen(true)}
                className="h-8"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import CSV
              </Button>

              <Button
                onClick={() => setIsDialogOpen(true)}
                className="h-8 bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Supplier
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden mt-4">
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
                        Loading suppliers...
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columnDefinitions.length}
                        className="h-32 text-center"
                      >
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier, index) => (
                      <TableRow
                        key={supplier.id}
                        className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                      >
                        {columnDefinitions.map((col, colIndex) => (
                          <TableCell
                            key={`${supplier.id}-${colIndex}`}
                            style={{ width: col.width }}
                            className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                          >
                            {col.cell(supplier, index)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs>

        {/* Add/Edit Supplier Dialog */}
        <SupplierDialog
          isOpen={isDialogOpen || editingSupplier !== null}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingSupplier(null);
          }}
          onSubmit={handleSubmit}
          editingSupplier={editingSupplier?.data}
          mode={editingSupplier ? 'edit' : 'create'}
        />

        {/* CSV Import Dialog */}
        <CsvImportDialog
          isOpen={isCsvDialogOpen}
          onClose={() => setIsCsvDialogOpen(false)}
          onSuccess={() => {
            fetchSuppliers();
            setIsCsvDialogOpen(false);
          }}
        />
      </main>
    </div>
  );
}

export default SuppliersTab;