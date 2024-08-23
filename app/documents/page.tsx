// @ts-nocheck
"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CombinedMonthlyDocs, PreviousMonths } from './DocumentUpload';

const DocumentUpload = () => {
  const [activeTab, setActiveTab] = useState('supplier');
  const [activeSubTab, setActiveSubTab] = useState('current');
  const [newItem, setNewItem] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
  });

  const handleInputChange = (e) => {
    setNewItem({ ...newItem, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setNewItem({ ...newItem, currency: value });
  };

  const handleSubmit = () => {
    console.log('Submitting:', newItem);
    // Add your submission logic here
  };

  const handleAddDetails = () => {
    console.log(`Add ${activeTab}`);
  };

  return (
    <div className="p-4 space-y-4 w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Monthly Document Upload</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="bg-blue-600 text-white"
              onClick={handleAddDetails}
            >
              Add {activeTab === 'supplier' ? 'Supplier' : 'Bank'}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add {activeTab === 'supplier' ? 'Supplier' : 'Bank'}</SheetTitle>
              <SheetDescription>
                This section includes adding all the details of a {activeTab === 'supplier' ? 'supplier' : 'bank'} to the system
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col pt-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder={`${activeTab === 'supplier' ? 'Supplier' : 'Bank'} Name`} value={newItem.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pin">PIN</Label>
                <Input id="pin" placeholder="P2288DNSK" value={newItem.pin} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input id="contact_name" placeholder="John Doe" value={newItem.contact_name} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_mobile">Contact Mobile</Label>
                <Input id="contact_mobile" placeholder="+25471234567" value={newItem.contact_mobile} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" placeholder="john@example.com" value={newItem.contact_email} onChange={handleInputChange} />
              </div>
              {activeTab === 'bank' && (
                <div className="space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Select onValueChange={handleSelectChange} value={newItem.currency}>
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
              )}
            </div>
            <div className="pt-4">
              <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="supplier" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="supplier">Supplier Statements</TabsTrigger>
          <TabsTrigger value="bank">Bank Statements</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">

          <Tabs defaultValue="trading" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList>
              <TabsTrigger value="trading">Trading Suppliers </TabsTrigger>
              <TabsTrigger value="monthly">Monthly Service Vendors</TabsTrigger>
            </TabsList>
            <TabsContent value="trading">
              <Tabs defaultValue="current" className="w-full" onValueChange={(value) => setActiveSubTab(value)}>
                <TabsList>
                  <TabsTrigger value="current">Current Month</TabsTrigger>
                  <TabsTrigger value="previous">Previous Months</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                  <CombinedMonthlyDocs type="supplier" isCurrentMonth={true} />
                </TabsContent>
                <TabsContent value="previous">
                  <PreviousMonths type="supplier" />
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="monthly">
              <Tabs defaultValue="current" className="w-full" onValueChange={(value) => setActiveSubTab(value)}>
                <TabsList>
                  <TabsTrigger value="current">Current Month</TabsTrigger>
                  <TabsTrigger value="previous">Previous Months</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                  <CombinedMonthlyDocs 
                  type="supplier" 
                  Stype='trading' 
                  isCurrentMonth={true} 
                  />
                </TabsContent>
                <TabsContent value="previous">
                  <PreviousMonths 
                  type="supplier" 
                  Stype='monthly' 
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>



        </TabsContent>
        <TabsContent value="bank">
          <Tabs defaultValue="current" className="w-full" onValueChange={(value) => setActiveSubTab(value)}>
            <TabsList>
              <TabsTrigger value="current">Current Month</TabsTrigger>
              <TabsTrigger value="previous">Previous Months</TabsTrigger>
            </TabsList>
            <TabsContent value="current">
              <CombinedMonthlyDocs type="bank" isCurrentMonth={true} />
            </TabsContent>
            <TabsContent value="previous">
              <PreviousMonths type="bank" />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentUpload;