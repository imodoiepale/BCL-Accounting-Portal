// @ts-nocheck
"use client"
import { Badge } from "@/components/ui/badge";
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
import { Calendar } from 'lucide-react';
import React, { useState } from 'react';
import BankTable from './monthlyDocs/bank-table/page';
import OtherDocs from './monthlyDocs/other-docs/page';
import MonthlyDocs from './monthlyDocs/page';
import PreviousMonths from './monthlyDocs/previous-months/page';
import PreviousMonthsBanks from './monthlyDocs/previous-months/banks';

const getCurrentMonth = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = new Date();
  return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
};

const documents = [
  { id: 'bankStatements', name: 'Bank Statements', deadline: '2024-08-05'},
  { id: 'salesInvoices', name: 'Sales Invoices', deadline: '2024-08-10' },
  { id: 'purchaseInvoices', name: 'Purchase Invoices', deadline: '2024-08-10' },
  { id: 'expenseReceipts', name: 'Expense Receipts', deadline: '2024-08-15' },
  { id: 'payrollRecords', name: 'Payroll Records', deadline: '2024-08-20' },
  { id: 'pettyCash', name: 'Petty Cash Records', deadline: '2024-08-25' },
  { id: 'creditCard', name: 'Credit Card Statements', deadline: '2024-08-25' },
  { id: 'loanStatements', name: 'Loan Statements', deadline: '2024-08-30' },
  { id: 'investmentStatements', name: 'Investment Statements', deadline: '2024-08-30' },
  { id: 'inventoryRecords', name: 'Inventory Records', deadline: '2024-08-30' },
];

const BankStatementCard = ({ subDoc, uploadedDocs, handleFileUpload }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-sm">{subDoc.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <Input
        type="file"
        onChange={(e) => handleFileUpload(subDoc.id, e.target.files[0])}
        className="mb-2"
      />
    </CardContent>
    <CardFooter>
      <Badge variant={uploadedDocs[subDoc.id] ? "success" : "destructive"}>
        {uploadedDocs[subDoc.id] ? "Uploaded" : "Missing"}
      </Badge>
    </CardFooter>
  </Card>
);

const DocumentCard = ({ doc, uploadedDocs, handleFileUpload }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-lg">{doc.name}</CardTitle>
    </CardHeader>
    <CardContent>
      {doc.subDocs ? (
        <div className="grid grid-cols-3 gap-2">
          {doc.subDocs.map(subDoc => (
            <BankStatementCard 
              key={subDoc.id} 
              subDoc={subDoc} 
              uploadedDocs={uploadedDocs} 
              handleFileUpload={handleFileUpload} 
            />
          ))}
        </div>
      ) : (
        <Input
          type="file"
          onChange={(e) => handleFileUpload(doc.id, e.target.files[0])}
          className="mb-2"
        />
      )}
      <div className="flex items-center text-sm text-gray-500 mt-2">
        <Calendar className="mr-2 h-4 w-4" />
        Deadline: {doc.deadline}
      </div>
    </CardContent>
    <CardFooter>
      <Badge variant={uploadedDocs[doc.id] ? "success" : "destructive"}>
        {uploadedDocs[doc.id] ? "Uploaded" : "Missing"}
      </Badge>
    </CardFooter>
  </Card>
);

const DocumentUpload = () => {
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('supplier');
  const [newBank, setNewBank] = useState({
    name: '',
    account_number: '',
    currency: '',
    branch: '',
    relationship_manager_name: '',
    relationship_manager_mobile: '',
    relationship_manager_email: '',
  });
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
  });

  const handleFileUpload = (docId, file) => {
    setUploadedDocs(prev => ({ ...prev, [docId]: file }));
  };

  const uploadedCount = Object.keys(uploadedDocs).length;
  const progress = (uploadedCount / (documents.length + 2)) * 100; // +2 for the additional bank statement sub-documents

  const handleBankInputChange = (e) => {
    setNewBank({ ...newBank, [e.target.id]: e.target.value });
  };

  const handleBankSelectChange = (value) => {
    setNewBank({ ...newBank, currency: value });
  };

  const handleSupplierInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.id]: e.target.value });
  };

  const handleBankSubmit = () => {
    console.log('Submitting bank:', newBank);
    // Add your submission logic here
  };

  const handleSupplierSubmit = () => {
    console.log('Submitting supplier:', newSupplier);
    // Add your submission logic here
  };

  const handleAddDetails = () => {
    if (activeSubTab === 'supplier') {
      console.log('Add Supplier');
    } else if (activeSubTab === 'bank') {
      console.log('Add Bank');
    } else if (activeSubTab === 'other') {
      console.log('Add Other');
    }
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
              {activeSubTab === 'supplier' ? 'Add Supplier' : activeSubTab === 'bank' ? 'Add Bank' : 'Add Other'}
            </Button>
          </SheetTrigger>
          <SheetContent>
            {activeSubTab === 'supplier' ? (
              <>
                <SheetHeader>
                  <SheetTitle>Add Supplier</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a supplier to the system
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input id="name" placeholder="XYZ Supplier" value={newSupplier.name} onChange={handleSupplierInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pin">Supplier Pin</Label>
                    <Input id="pin" placeholder="P2288DNSK" value={newSupplier.pin} onChange={handleSupplierInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_name">Supplier Contact Name</Label>
                    <Input id="contact_name" placeholder="John Doe" value={newSupplier.contact_name} onChange={handleSupplierInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_mobile">Supplier Contact Mobile</Label>
                    <Input id="contact_mobile" placeholder="+25471234567" value={newSupplier.contact_mobile} onChange={handleSupplierInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_email">Supplier Contact Email</Label>
                    <Input id="contact_email" placeholder="john@example.com" value={newSupplier.contact_email} onChange={handleSupplierInputChange} />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleSupplierSubmit}>Submit</Button>
                </div>
              </>
            ) : activeSubTab === 'bank' ? (
              <>
                <SheetHeader>
                  <SheetTitle>Add Bank Account</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a bank account to the system
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Bank Name</Label>
                    <Input id="name" placeholder="XYZ Bank" value={newBank.name} onChange={handleBankInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input id="account_number" placeholder="011110001122" value={newBank.account_number} onChange={handleBankInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={handleBankSelectChange} value={newBank.currency}>
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
                    <Input id="branch" placeholder="Main Branch" value={newBank.branch} onChange={handleBankInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_name">Relationship Manager Name</Label>
                    <Input id="relationship_manager_name" placeholder="John Doe" value={newBank.relationship_manager_name} onChange={handleBankInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_mobile">Relationship Manager Mobile</Label>
                    <Input id="relationship_manager_mobile" placeholder="+25471234567" value={newBank.relationship_manager_mobile} onChange={handleBankInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_email">Relationship Manager Email</Label>
                    <Input id="relationship_manager_email" placeholder="john@example.com" value={newBank.relationship_manager_email} onChange={handleBankInputChange} />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="bg-blue-600 text-white" onClick={handleBankSubmit}>Submit</Button>
                </div>
              </>
            ) : (
              <SheetHeader>
                <SheetTitle>Add Other</SheetTitle>
                <SheetDescription>
                  This section is for adding other types of documents or information.
                </SheetDescription>
              </SheetHeader>
              // Add form fields for 'other' category if needed
            )}
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="supplier" className="w-full">
        <TabsList>
          <TabsTrigger value="supplier" onClick={() => setActiveSubTab('supplier')}>Supplier Statements</TabsTrigger>
          <TabsTrigger value="bank" onClick={() => setActiveSubTab('bank')}>Bank Statements</TabsTrigger>
          <TabsTrigger value="other" onClick={() => setActiveSubTab('other')}>Other Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">
          <Tabs defaultValue="current" className="w-full">
            <TabsList>
              <TabsTrigger value="current">Current Month</TabsTrigger>
              <TabsTrigger value="previous">Previous Months</TabsTrigger>
            </TabsList>
            <TabsContent value="current">
              <MonthlyDocs/>
            </TabsContent>
            <TabsContent value="previous">
              <PreviousMonths />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="bank">
          <Tabs defaultValue="current" className="w-full">
            <TabsList>
              <TabsTrigger value="current">Current Month</TabsTrigger>
              <TabsTrigger value="previous">Previous Months</TabsTrigger>
            </TabsList>
            <TabsContent value="current">
              <BankTable />
            </TabsContent>
            <TabsContent value="previous">
              <PreviousMonthsBanks />
            </TabsContent>
          </Tabs>
        </TabsContent>
        {/* <TabsContent value="other">
          <Tabs defaultValue="current" className="w-full">
            <TabsList>
              <TabsTrigger value="current">Current Month</TabsTrigger>
              <TabsTrigger value="previous">Previous Months</TabsTrigger>
            </TabsList>
            <TabsContent value="current">
              <OtherDocs />
            </TabsContent>
            <TabsContent value="previous">
              <PreviousMonths />
            </TabsContent>
          </Tabs>
        </TabsContent>*/}
      </Tabs> 
    </div>
  );
};

export default DocumentUpload;
