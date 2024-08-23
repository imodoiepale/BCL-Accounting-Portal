//@ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import supabase from '@/lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import { Switch } from "@/components/ui/switch";


const SettingsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: '',
    subcategory: '',
    validity_days: '',
    department: '',
    document_type: 'one-off',
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [activeCategory, setActiveCategory] = useState('company-docs');
  const [activeSubcategory, setActiveSubcategory] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [activeCategory, activeSubcategory]);


  const fetchDocuments = async () => {
    let query = supabase
      .from('acc_portal_kyc')
      .select('*')
      .eq('category', activeCategory);

    if (activeSubcategory) {
      query = query.eq('subcategory', activeSubcategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } else {
      setDocuments(data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDocument = async () => {
    const newDoc = {
      ...newDocument,
      category: activeCategory,
      subcategory: activeSubcategory || '',
      validity_days: newDocument.document_type === 'renewal' ? parseInt(newDocument.validity_days) : null,
    };

    const { data, error } = await supabase
      .from('acc_portal_kyc')
      .insert([newDoc]);

    if (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    } else {
      fetchDocuments();
      setNewDocument({ name: '', validity_days: '', department: '', document_type: 'one-off' });
      setIsAddDialogOpen(false);
      toast.success('Document added successfully');
    }
  };

  const handleEditDocument = async () => {
    const { data, error } = await supabase
      .from('acc_portal_kyc')
      .update({
        name: editingDocument.name,
        validity_days: editingDocument.document_type === 'renewal' ? parseInt(editingDocument.validity_days) : null,
        department: editingDocument.department,
        document_type: editingDocument.document_type,
      })
      .eq('id', editingDocument.id);

    if (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } else {
      fetchDocuments();
      setIsEditDialogOpen(false);
      toast.success('Document updated successfully');
    }
  };

  const handleDeleteDocument = async (id) => {
    const { error } = await supabase
      .from('acc_portal_kyc')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } else {
      fetchDocuments();
      toast.success('Document deleted successfully');
    }
  };


  const handleToggleListed = async (id, currentValue) => {
    const { error } = await supabase
      .from('acc_portal_kyc')
      .update({ listed: !currentValue })
      .eq('id', id);
    if (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } else {
      fetchDocuments();
      toast.success('Document listing updated');
    }
  };

  const renderDocumentTable = (category, subcategory) => (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Document Name</TableHead>
          <TableHead className="font-bold">Validity Days</TableHead>
          <TableHead className="font-bold">Department</TableHead>
          <TableHead className="font-bold">Type</TableHead>
          <TableHead className="font-bold">Listed</TableHead>
          <TableHead className="font-bold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents
          .filter(doc => doc.category === category && (!subcategory || doc.subcategory === subcategory))
          .map((doc) => (
            <TableRow key={doc.id} className="hover:bg-gray-100">
              <TableCell>{doc.name}</TableCell>
              <TableCell>{doc.validity_days || 'N/A'}</TableCell>
              <TableCell>{doc.department}</TableCell>
              <TableCell>{doc.document_type}</TableCell>
              <TableCell>
                <Switch
                  checked={doc.listed}
                  onCheckedChange={() => handleToggleListed(doc.id, doc.listed)}
                />
              </TableCell>
              <TableCell>
                <Button onClick={() => {
                  setEditingDocument(doc);
                  setIsEditDialogOpen(true);
                }} className="mr-2 bg-yellow-500 hover:bg-yellow-600 text-white">Edit</Button>
                <Button onClick={() => handleDeleteDocument(doc.id)} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
  const renderAddDocumentDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">Add New Document</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="name"
            placeholder="Document Name"
            value={newDocument.name}
            onChange={handleInputChange}
            className="w-full"
          />
          <Select
            name="document_type"
            value={newDocument.document_type}
            onValueChange={(value) => setNewDocument(prev => ({ ...prev, document_type: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-off">One-off</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
            </SelectContent>
          </Select>
          {newDocument.document_type === 'renewal' && (
            <Input
              name="validity_days"
              type="number"
              placeholder="Validity Days"
              value={newDocument.validity_days}
              onChange={handleInputChange}
              className="w-full"
            />
          )}
          <Input
            name="department"
            placeholder="Department"
            value={newDocument.department}
            onChange={handleInputChange}
            className="w-full"
          />
          <Button onClick={handleAddDocument} className="w-full bg-green-500 hover:bg-green-600 text-white">Add Document</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderEditDocumentDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="name"
            placeholder="Document Name"
            value={editingDocument?.name || ''}
            onChange={handleEditInputChange}
            className="w-full"
          />
          <Select
            name="document_type"
            value={editingDocument?.document_type || 'one-off'}
            onValueChange={(value) => setEditingDocument(prev => ({ ...prev, document_type: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-off">One-off</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
            </SelectContent>
          </Select>
          {editingDocument?.document_type === 'renewal' && (
            <Input
              name="validity_days"
              type="number"
              placeholder="Validity Days"
              value={editingDocument?.validity_days || ''}
              onChange={handleEditInputChange}
              className="w-full"
            />
          )}
          <Input
            name="department"
            placeholder="Department"
            value={editingDocument?.department || ''}
            onChange={handleEditInputChange}
            className="w-full"
          />
          <Button onClick={handleEditDocument} className="w-full bg-green-500 hover:bg-green-600 text-white">Update Document</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderCategoryContent = (category, subcategories) => (
    <Tabs 
      defaultValue={subcategories.length > 0 ? subcategories[0].value : ''} 
      className="w-full"
      onValueChange={(value) => setActiveSubcategory(value)}
    >
      {subcategories.length > 0 && (
        <TabsList className="mb-4">
          {subcategories.map((subcategory) => (
            <TabsTrigger key={subcategory.value} value={subcategory.value} className="px-4 py-2">
              {subcategory.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      {subcategories.length > 0
        ? subcategories.map((subcategory) => (
            <TabsContent key={subcategory.value} value={subcategory.value}>
              <Card className="shadow-lg">
                <CardHeader>
                  <h2 className="text-2xl font-semibold">{subcategory.label}</h2>
                </CardHeader>
                <CardContent>
                  {renderDocumentTable(category, subcategory.value)}
                  {renderAddDocumentDialog()}
                </CardContent>
              </Card>
            </TabsContent>
          ))
        : (
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">{category}</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable(category, '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        )}
    </Tabs>
  );

  return (
    <div className="w-full p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs 
        defaultValue="company-docs" 
        className="w-full"
        onValueChange={(value) => setActiveCategory(value)}
      >
        <TabsList className="mb-8 flex flex-wrap">
          <TabsTrigger value="company-docs" className="px-4 py-2">Company Documents</TabsTrigger>
          <TabsTrigger value="directors-docs" className="px-4 py-2">Directors Documents</TabsTrigger>
          <TabsTrigger value="suppliers-docs" className="px-4 py-2">Suppliers Documents</TabsTrigger>
          <TabsTrigger value="banks-docs" className="px-4 py-2">Banks Documents</TabsTrigger>
          <TabsTrigger value="employees-docs" className="px-4 py-2">Employees Documents</TabsTrigger>
          <TabsTrigger value="insurance-docs" className="px-4 py-2">Insurance Policy Documents</TabsTrigger>
          <TabsTrigger value="deposits-docs" className="px-4 py-2">Deposits Documents</TabsTrigger>
          <TabsTrigger value="fixed-assets-docs" className="px-4 py-2">Fixed Assets Register</TabsTrigger>
        </TabsList>

        <TabsContent value="company-docs">
          {renderCategoryContent('company-docs', [
            { value: 'kra-docs', label: 'KRA Documents' },
            { value: 'sheria-docs', label: 'Sheria Documents' },
          ])}
        </TabsContent>

        <TabsContent value="directors-docs">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">Directors Documents</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable('directors-docs', '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers-docs">
          {renderCategoryContent('suppliers-docs', [
            { value: 'monthly-service-vendors-docs', label: 'Monthly Service Vendors - Documents' },
            { value: 'trading-suppliers-docs', label: 'Trading Suppliers - Documents' },
          ])}
        </TabsContent>

        <TabsContent value="banks-docs">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">Banks Documents</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable('banks-docs', '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees-docs">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">Employees Documents</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable('employees-docs', '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance-docs">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">Insurance Policy Documents</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable('insurance-docs', '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits-docs">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-semibold">Deposits Documents</h2>
            </CardHeader>
            <CardContent>
              {renderDocumentTable('deposits-docs', '')}
              {renderAddDocumentDialog()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixed-assets-docs">
          {renderCategoryContent('fixed-assets-docs', [
            { value: 'comp-equip-docs', label: 'Computer & Equipment' },
            { value: 'furniture-fitting-docs', label: 'Furniture Fitting & Equipment 12.5%' },
            { value: 'land-building-docs', label: 'Land & Building' },
            { value: 'plant-equip-docs', label: 'Plant & Equipment - 12.5%' },
            { value: 'motor-vehicles-docs', label: 'Motor Vehicles - 25%' },
          ])}
        </TabsContent>
      </Tabs>
      {renderEditDocumentDialog()}
      <Toaster />
    </div>
  );
};

export default SettingsPage;
