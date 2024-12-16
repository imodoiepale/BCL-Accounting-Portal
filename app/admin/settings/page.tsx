//@ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-hot-toast';
import { Switch } from "@/components/ui/switch";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SettingsPage = () => {
  // State declarations
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
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Document Name</TableHead>
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Validity Days</TableHead>
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Department</TableHead>
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Type</TableHead>
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Listed</TableHead>
            <TableHead className="py-3 px-4 text-xs font-semibold text-gray-600">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents
            .filter(doc => doc.category === category && (!subcategory || doc.subcategory === subcategory))
            .map((doc) => (
              <TableRow key={doc.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                <TableCell className="py-2 px-4 text-sm">{doc.name}</TableCell>
                <TableCell className="py-2 px-4 text-sm">{doc.validity_days || 'N/A'}</TableCell>
                <TableCell className="py-2 px-4 text-sm">{doc.department}</TableCell>
                <TableCell className="py-2 px-4 text-sm">{doc.document_type}</TableCell>
                <TableCell className="py-2 px-4">
                  <Switch
                    checked={doc.listed}
                    onCheckedChange={() => handleToggleListed(doc.id, doc.listed)}
                  />
                </TableCell>
                <TableCell className="py-2 px-4">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        setEditingDocument(doc);
                        setIsEditDialogOpen(true);
                      }} 
                      className="px-3 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteDocument(doc.id)} 
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
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
          <Button onClick={handleAddDocument} className="w-full bg-green-500 hover:bg-green-600 text-white">
            Add Document
          </Button>
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
          <Button onClick={handleEditDocument} className="w-full bg-green-500 hover:bg-green-600 text-white">
            Update Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  const renderCategoryContent = (category, subcategories) => (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {subcategories.length > 0 ? (
        <Tabs defaultValue={subcategories[0].value} className="w-full">
          <TabsList className="h-8 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
            {subcategories.map((subcategory) => (
              <TabsTrigger 
                key={subcategory.value} 
                value={subcategory.value} 
                className="px-3 py-1 text-xs font-medium"
              >
                {subcategory.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 overflow-y-auto">
            {subcategories.map((subcategory) => (
              <TabsContent key={subcategory.value} value={subcategory.value}>
                <Card className="m-4 shadow-sm">
                  <CardHeader className="py-4">
                    <h2 className="text-lg font-semibold">{subcategory.label}</h2>
                  </CardHeader>
                  <CardContent>
                    {renderDocumentTable(category, subcategory.value)}
                    {renderAddDocumentDialog()}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <Card className="m-4 shadow-sm">
          <CardHeader className="py-4">
            <h2 className="text-lg font-semibold">{category}</h2>
          </CardHeader>
          <CardContent>
            {renderDocumentTable(category, '')}
            {renderAddDocumentDialog()}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold p-4">Settings</h1>
        <Tabs 
          defaultValue="company-docs" 
          className="w-full"
          onValueChange={(value) => setActiveCategory(value)}
        >
          <TabsList className="w-full flex flex-wrap bg-gray-100 px-4 py-2 gap-2">
            <TabsTrigger value="company-docs" className="px-3 py-1 text-xs">Company Documents</TabsTrigger>
            <TabsTrigger value="directors-docs" className="px-3 py-1 text-xs">Directors Documents</TabsTrigger>
            <TabsTrigger value="suppliers-docs" className="px-3 py-1 text-xs">Suppliers Documents</TabsTrigger>
            <TabsTrigger value="banks-docs" className="px-3 py-1 text-xs">Banks Documents</TabsTrigger>
            <TabsTrigger value="employees-docs" className="px-3 py-1 text-xs">Employees Documents</TabsTrigger>
            <TabsTrigger value="insurance-docs" className="px-3 py-1 text-xs">Insurance Policy Documents</TabsTrigger>
            <TabsTrigger value="deposits-docs" className="px-3 py-1 text-xs">Deposits Documents</TabsTrigger>
            <TabsTrigger value="fixed-assets-docs" className="px-3 py-1 text-xs">Fixed Assets Register</TabsTrigger>
          </TabsList>
        
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="company-docs">
              {renderCategoryContent('company-docs', [
                { value: 'kra-docs', label: 'KRA Documents' },
                { value: 'sheria-docs', label: 'Sheria Documents' },
              ])}
            </TabsContent>
  
            <TabsContent value="directors-docs">
              {renderCategoryContent('directors-docs', [])}
            </TabsContent>
  
            <TabsContent value="suppliers-docs">
              {renderCategoryContent('suppliers-docs', [
                { value: 'monthly-service-vendors-docs', label: 'Monthly Service Vendors - Documents' },
                { value: 'trading-suppliers-docs', label: 'Trading Suppliers - Documents' },
              ])}
            </TabsContent>
  
            <TabsContent value="banks-docs">
              {renderCategoryContent('banks-docs', [])}
            </TabsContent>
  
            <TabsContent value="employees-docs">
              {renderCategoryContent('employees-docs', [])}
            </TabsContent>
  
            <TabsContent value="insurance-docs">
              {renderCategoryContent('insurance-docs', [])}
            </TabsContent>
  
            <TabsContent value="deposits-docs">
              {renderCategoryContent('deposits-docs', [])}
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
          </div>
        </Tabs>
      </div>
      {renderEditDocumentDialog()}
    </div>
  );
};

export default SettingsPage;