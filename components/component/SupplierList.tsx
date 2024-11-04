// @ts-nocheck
"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, UploadIcon, Edit3Icon, Trash2Icon } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/lib/supabaseClient'
import { Switch } from '../ui/switch'

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};


const sanitizeSupplierData = (data) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === null || value === undefined || value === '' ? 'Missing' : value;
  }
  return sanitized;
};

export function SupplierList({ type }) {
  const { user } = useUser();
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
    startdate: '',
    status: "true",
    category: type
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWhvOnly, setShowWhvOnly] = useState(false);

  // Update the search handler
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Update the filtered suppliers logic
  const filteredSuppliers = suppliers
    .filter(supplier => {
      // First apply WHV filter if enabled
      if (showWhvOnly && !supplier.name?.toLowerCase().includes('whv')) {
        return false;
      }

      // Then apply search filter
      const searchLower = searchTerm.toLowerCase();
      return (
        supplier.name?.toLowerCase().includes(searchLower) ||
        supplier.pin?.toLowerCase().includes(searchLower) ||
        supplier.contact_name?.toLowerCase().includes(searchLower) ||
        supplier.name_kra?.toLowerCase().includes(searchLower)
      );
    });
  const fetchSuppliers = useCallback(async () => {
    try {
      const { data: result, error } = await supabase
        .from('acc_portal_suppliers')
        .select('id, data')
        .eq('userid', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('acc_portal_suppliers')
            .insert([{
              userid: user?.id,
              data: { suppliers: [] }
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          setSuppliers([]);
          return;
        }
        throw error;
      }

      const filteredSuppliers = (result?.data?.suppliers || [])
        .filter(s => s.category === type || (!s.category && type === 'trading'))
        .map(supplier => ({
          ...supplier,
          category: supplier.category || type,
          status: supplier.status || 'true',
          verified: supplier.verified || false
        }));

      setSuppliers(filteredSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  }, [user?.id, type]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);


  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.id]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const sanitizedSupplier = sanitizeSupplierData(newSupplier);

      // Get current data
      const { data: currentData, error: fetchError } = await supabase
        .from('acc_portal_suppliers')
        .select('id, data')
        .eq('userid', user?.id)
        .single();

      if (fetchError) throw fetchError;

      // Check if PIN already exists
      const supplierExists = currentData.data.suppliers?.some(
        s => s.pin === sanitizedSupplier.pin
      );

      if (supplierExists) {
        toast.error('A supplier with this PIN already exists.');
        return;
      }

      // Add new supplier to array
      const updatedSuppliers = [
        ...(currentData.data.suppliers || []),
        { ...sanitizedSupplier, id: Date.now() } // Add a unique ID for each supplier
      ];

      // Update the row
      const { error: updateError } = await supabase
        .from('acc_portal_suppliers')
        .update({
          data: { suppliers: updatedSuppliers }
        })
        .eq('id', currentData.id);

      if (updateError) throw updateError;

      await fetchSuppliers();
      setNewSupplier({
        name: '',
        pin: '',
        contact_name: '',
        contact_mobile: '',
        contact_email: '',
        startdate: '',
        status: "true",
        category: type
      });
      closeForm();
      toast.success('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Failed to add supplier');
    }
  };


  const handleCSVUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(selectedFile);
      });

      const { data: currentData, error: fetchError } = await supabase
        .from('acc_portal_suppliers')
        .select('id, data')
        .eq('userid', user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentSuppliers = currentData?.data?.suppliers || [];
      const rows = text.split('\n').filter(row => row.trim() !== '');
      const headers = rows[0].split(',').map(header => header.trim());
      const newSuppliers = rows.slice(1)
        .map(row => {
          const values = row.split(',').map(value => value.trim());
          const supplier = {};
          headers.forEach((header, index) => {
            supplier[header] = values[index] || 'Missing';
          });
          return supplier;
        })
        .filter(supplier => supplier.name !== 'Missing' && supplier.pin !== 'Missing');

      const updatedSuppliers = [...currentSuppliers];
      let updateCount = 0;
      let addCount = 0;

      newSuppliers.forEach(newSupplier => {
        const sanitizedSupplier = sanitizeSupplierData(newSupplier);
        const existingIndex = updatedSuppliers.findIndex(s => s.pin === sanitizedSupplier.pin);

        if (existingIndex !== -1) {
          updatedSuppliers[existingIndex] = {
            ...updatedSuppliers[existingIndex],
            ...sanitizedSupplier,
            category: sanitizedSupplier.category || type
          };
          updateCount++;
        } else {
          updatedSuppliers.push({
            ...sanitizedSupplier,
            id: Date.now() + addCount,
            category: sanitizedSupplier.category || type
          });
          addCount++;
        }
      });

      const { error: updateError } = await supabase
        .from('acc_portal_suppliers')
        .upsert({
          userid: user?.id,
          data: { suppliers: updatedSuppliers }
        });

      if (updateError) throw updateError;

      await fetchSuppliers();
      toast.success(`Processed ${updateCount + addCount} suppliers (${updateCount} updated, ${addCount} added)`);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Failed to process CSV file');
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };


  const closeForm = () => {
    setIsSheetOpen(false)
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };


  const downloadCSVTemplate = () => {
    const headers = [
      'name',
      'pin',
      'contact_name',
      'contact_mobile',
      'contact_email',
      'startdate',
    ];

    const csvContent = headers.join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'supplier_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('acc_portal_suppliers')
        .select('id, data')
        .eq('userid', user?.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedSuppliers = currentData.data.suppliers.filter(
        supplier => supplier.id !== supplierToDelete.id
      );

      const { error: updateError } = await supabase
        .from('acc_portal_suppliers')
        .update({
          data: { suppliers: updatedSuppliers }
        })
        .eq('id', currentData.id);

      if (updateError) throw updateError;

      await fetchSuppliers();
      toast.success('Supplier deleted successfully!');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setSupplierToDelete(null)
  }

  const handleEditFieldChange = (e) => {
    setEditField(e.target.id)
    setCurrentSupplier({ ...currentSupplier, [e.target.id]: e.target.value })
  }

  const handleEditCancel = () => {
    setCurrentSupplier({
      ...currentSupplier,
      startdate: currentSupplier.startdate || '',
      enddate: currentSupplier.enddate || ''
    })
    setIsDialogOpen(false)
  }

  const handleEdit = (supplier) => {
    setCurrentSupplier({
      ...supplier,
      startdate: supplier.startdate || '',
      enddate: supplier.enddate || ''
    })
    setIsDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!currentSupplier) return;

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('acc_portal_suppliers')
        .select('id, data')
        .eq('userid', user?.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedSuppliers = currentData.data.suppliers.map(supplier =>
        supplier.id === currentSupplier.id ? sanitizeSupplierData(currentSupplier) : supplier
      );

      const { error: updateError } = await supabase
        .from('acc_portal_suppliers')
        .update({
          data: { suppliers: updatedSuppliers }
        })
        .eq('id', currentData.id);

      if (updateError) throw updateError;

      await fetchSuppliers();
      setIsDialogOpen(false);
      toast.success('Supplier updated successfully!');
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier');
    }
  };


  const renderCell = (column, supplier, index, handlers) => {
    const value = column.cellContent(supplier, index);
    const isMissing = !value || value === 'Missing';
    const isNameField = column.id === 'name' || column.id === 'name_kra';

    switch (column.id) {
      case 'verified':
        return (
          <Badge
            variant={supplier.verified ? "success" : "destructive"}
            className="inline-flex justify-center text-xs px-1.5 py-0"
          >
            {supplier.verified ? "✓" : "×"}
          </Badge>
        );

      case 'status':
        return (
          <Badge
            variant={supplier.status === 'true' ? "success" : "destructive"}
            className="inline-flex justify-center text-xs px-1.5 py-0"
          >
            {supplier.status === 'true' ? 'Active' : 'Inactive'}
          </Badge>
        );

      case 'actions':
        return (
          <div className="flex space-x-0.5 justify-center">
            <Button
              variant="ghost"
              onClick={() => handlers.handleEdit(supplier)}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <Edit3Icon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => handlers.handleDeleteClick(supplier)}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <Trash2Icon className="h-3 w-3" />
            </Button>
          </div>
        );

      default:
        return (
          <div className={`
          ${isMissing ? 'font-bold text-red-500' : ''} 
          ${column.id === 'pin' || column.id === 'contact_mobile' ? 'font-mono' : ''}
          ${isNameField && isMissing ? 'text-center' : ''}
          ${column.id === 'index' ? 'text-center' : 'text-left'}
          text-xs truncate
        `}>
            {isMissing ? 'Missing' : (
              column.id === 'startdate' || column.id === 'enddate'
                ? (value === 'Missing' ? 'Missing' : formatDate(value))
                : value
            )}
          </div>
        );
    }
  };

  // Update column definitions to be simpler
  const columnDefinitions = [
    {
      id: 'index',
      header: '#',
      size: '40',
      cellContent: (supplier, index) => `${index + 1}`
    },
    {
      id: 'name',
      header: 'Name (QB)',
      size: '180',
      cellContent: supplier => supplier.name
    },
    {
      id: 'pin',
      header: 'PIN',
      size: '80',
      cellContent: supplier => supplier.pin
    },
    {
      id: 'name_kra',
      header: 'Name (KRA)',
      size: '180',
      cellContent: supplier => supplier.name_kra
    },
    {
      id: 'status',
      header: 'Status',
      size: '80',
      cellContent: supplier => supplier.status
    },
    {
      id: 'contact_name',
      header: 'Contact',
      size: '120',
      cellContent: supplier => supplier.contact_name
    },
    {
      id: 'contact_mobile',
      header: 'Mobile',
      size: '100',
      cellContent: supplier => supplier.contact_mobile
    },
    {
      id: 'contact_email',
      header: 'Email',
      size: '150',
      cellContent: supplier => supplier.contact_email
    },
    {
      id: 'startdate',
      header: 'Start',
      size: '80',
      cellContent: supplier => supplier.startdate
    },
    {
      id: 'enddate',
      header: 'End',
      size: '80',
      cellContent: supplier => supplier.enddate
    },
    {
      id: 'verified',
      header: 'BCL',  // Shortened header
      size: '70',
      cellContent: supplier => supplier.verified
    },
    {
      id: 'actions',
      header: 'Actions',
      size: '70',
      cellContent: supplier => supplier
    }
  ];
  const columns = columnDefinitions.map(({ id, header, size, cellContent }) => ({
    id,
    header,
    size,
    cell: (supplier, index, helpers) => {
      // Handle missing values
      const isMissing = !cellContent(supplier) || cellContent(supplier) === 'Missing';
      const missingStyle = "font-bold text-red-500 text-center";

      if (id === 'index') {
        return <div className="font-medium text-center">{cellContent(supplier, index)}</div>;
      } else if (id === 'verified') {
        return (
          <div className="text-center">
            <Badge
              variant={supplier.verified ? "success" : "destructive"}
              className="inline-flex justify-center min-w-[60px]"
            >
              {supplier.verified ? "✔️" : "❌"}
            </Badge>
          </div>
        );
      } else if (id === 'status') {
        return (
          <div className="text-center">
            <Badge
              variant={supplier.status === 'true' ? "success" : "destructive"}
              className="inline-flex justify-center min-w-[80px]"
            >
              {supplier.status === 'true' ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
        );
      } else if (id === 'actions') {
        const { handleEdit, handleDeleteClick } = cellContent(supplier, index, helpers);
        return (
          <div className="flex space-x-1 justify-center">
            <Button
              variant="ghost"
              onClick={() => handleEdit(supplier)}
              className="h-7 w-7 p-0 hover:bg-blue-100"
            >
              <Edit3Icon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleDeleteClick(supplier)}
              className="h-7 w-7 p-0 hover:bg-red-100"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      } else {
        return (
          <div
            className={`${isMissing ? missingStyle : ''} ${id === 'pin' || id === 'contact_mobile' ? 'font-mono' : ''
              }`}
          >
            {isMissing ? 'Missing' : (
              id === 'startdate' || id === 'enddate'
                ? formatDate(cellContent(supplier))
                : cellContent(supplier)
            )}
          </div>
        );
      }
    },
  }));


  return (
    <div className="flex w-full bg-gray-100">

      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Supplier List - {type === 'trading' ? 'Trading Suppliers' : 'Monthly Service Vendors'}</h1>
          <div className="flex items-center space-x-2">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Input
                    type="search"
                    placeholder="Search suppliers..."
                    className="w-64"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="whv-filter" className="text-sm font-medium">
                      WHV 2% Only
                    </Label>
                    <Switch
                      id="whv-filter"
                      checked={showWhvOnly}
                      onCheckedChange={setShowWhvOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="flex items-center" onClick={fetchSuppliers}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" className="flex items-center" onClick={downloadCSVTemplate}>
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download CSV Template
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white">
                  <UploadIcon className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file containing supplier information.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input type="file" accept=".csv" onChange={handleFileChange} />
                  <Button onClick={handleCSVUpload} disabled={!selectedFile || isLoading}>
                    {isLoading ? 'Uploading...' : 'Submit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white" onClick={() => setIsSheetOpen(true)}>Add New Supplier</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Supplier</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a supplier to the system
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  {[
                    { id: 'name', label: 'Supplier Name', placeholder: 'XYZ Supplier', type: 'text' },
                    { id: 'pin', label: 'Supplier Pin', placeholder: 'P2288DNSK', type: 'text' },
                    { id: 'contact_name', label: 'Supplier Contact Name', placeholder: 'John Doe', type: 'text' },
                    { id: 'contact_mobile', label: 'Supplier Contact Mobile', placeholder: '+25471234567', type: 'text' },
                    { id: 'contact_email', label: 'Supplier Contact Email', placeholder: 'john@example.com', type: 'text' },
                    { id: 'startdate', label: 'Start Date', placeholder: '', type: 'date' }
                  ].map((field) => (
                    <div key={field.id} className="space-y-1">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        type={field.type}
                        value={newSupplier[field.id]}
                        onChange={handleInputChange}
                        required={field.id === 'name'}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4"><Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button></div>
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
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier, index) => (
                      <TableRow
                        key={supplier.id}
                        className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                      >
                        {columnDefinitions.map((column) => (
                          <TableCell
                            key={`${supplier.id}-${column.id}`}
                            style={{
                              width: `${column.size}px`,
                              minWidth: `${column.size}px`
                            }}
                            className={`py-1 px-2 text-xs border-r border-gray-100 last:border-r-0 
    ${column.id === 'status' || column.id === 'verified' || column.id === 'actions' || column.id === 'index'
                                ? 'text-center'
                                : column.id === 'name' || column.id === 'name_kra'
                                  ? (!supplier[column.id] || supplier[column.id] === 'Missing' ? 'text-center' : 'text-left')
                                  : 'text-left'}`}
                          >
                            {renderCell(column, supplier, index, { handleEdit, handleDeleteClick })}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columnDefinitions.length}
                        className="h-32 text-center text-gray-500 text-sm"
                      >
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  )}
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
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Make changes to the supplier information here.
            </DialogDescription>
          </DialogHeader>
          {currentSupplier && (
            <div className="flex flex-col gap-4">
              {[
                { id: "edit-name", label: "Supplier Name", key: "name" },
                { id: "edit-pin", label: "Supplier Pin", key: "pin" },
                { id: "edit-contact-name", label: "Contact Name", key: "contact_name" },
                { id: "edit-contact-mobile", label: "Contact Mobile", key: "contact_mobile" },
                { id: "edit-contact-email", label: "Contact Email", key: "contact_email" },
                { id: "edit-start-date", label: "Start Date", key: "startdate" },
                { id: "edit-end-date", label: "End Date", key: "enddate" },
              ].map(({ id, label, key, type }) => (
                <div key={id} className="space-y-1">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type={type || "text"}
                    value={currentSupplier[key] || ''}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={currentSupplier.category}
                  onValueChange={(value) => setCurrentSupplier({ ...currentSupplier, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trading">Trading Supplier</SelectItem>
                    <SelectItem value="monthly">Monthly Service Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}