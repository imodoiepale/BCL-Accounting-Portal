//@ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  const handleAddDocument = async () => {
    const newDoc = {
      ...newDocument,
      category: activeCategory,
      subcategory: activeSubcategory || '',
      validity_days: parseInt(newDocument.validity_days),
    };

    const { data, error } = await supabase
      .from('acc_portal_kyc')
      .insert([newDoc]);

    if (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    } else {
      fetchDocuments();
      setNewDocument({ name: '', validity_days: '', department: '' });
      setIsAddDialogOpen(false);
      toast.success('Document added successfully');
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
          <TableHead className="font-bold">Listed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents
          .filter(doc => doc.category === category && (!subcategory || doc.subcategory === subcategory))
          .map((doc) => (
            <TableRow key={doc.id} className="hover:bg-gray-100">
              <TableCell>{doc.name}</TableCell>
              <TableCell>{doc.validity_days}</TableCell>
              <TableCell>{doc.department}</TableCell>
              <TableCell>
                <Switch
                  checked={doc.listed}
                  onCheckedChange={() => handleToggleListed(doc.id, doc.listed)}
                />
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
          <Input
            name="validity_days"
            type="number"
            placeholder="Validity Days"
            value={newDocument.validity_days}
            onChange={handleInputChange}
            className="w-full"
          />
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

      <Toaster />
    </div>
  );
};

export default SettingsPage;
