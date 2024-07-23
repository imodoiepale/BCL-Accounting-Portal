// @ts-nocheck
"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from 'lucide-react';
import MonthlyDocs from './monthlyDocs/page';


const getCurrentMonth = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = new Date();
  return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
};

const documents = [
  // { id: 'bankStatements', name: 'Bank Statements', deadline: '2024-08-05', subDocs: [
  //   { id: 'bankKES', name: 'KES Account' },
  //   { id: 'bankUSD', name: 'USD Account' },
  //   { id: 'bankEUR', name: 'EUR Account' },
  // ]},
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
  const [activeTab, setActiveTab] = useState('current');

  const handleFileUpload = (docId, file) => {
    setUploadedDocs(prev => ({ ...prev, [docId]: file }));
  };

  const uploadedCount = Object.keys(uploadedDocs).length;
  const progress = (uploadedCount / (documents.length + 2)) * 100; // +2 for the additional bank statement sub-documents

  return (
    <div className="p-4 space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Monthly Document Upload</h1>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current" onClick={() => setActiveTab('current')}>Current Month</TabsTrigger>
          <TabsTrigger value="previous" onClick={() => setActiveTab('previous')}>Previous Months</TabsTrigger>
        </TabsList>
        <TabsContent value="current">

        <Tabs defaultValue="supplier" className="w-full">
          <TabsList>
            <TabsTrigger value="supplier">Supplier Statements</TabsTrigger>
            <TabsTrigger value="bank">Bank Statements</TabsTrigger>
            <TabsTrigger value="other">Other Docs</TabsTrigger>
          </TabsList>
          <TabsContent value="supplier">
          <MonthlyDocs/>
          <div className="grid grid-cols-5 gap-4">
            {documents.map((doc, index) => (
              <React.Fragment key={doc.id}>
                {/* {index === 0 ? (
                  <div className="col-span-3">
                    <DocumentCard doc={doc} uploadedDocs={uploadedDocs} handleFileUpload={handleFileUpload} />
                  </div>
                ) : ( */}
                  {/* <DocumentCard doc={doc} uploadedDocs={uploadedDocs} handleFileUpload={handleFileUpload} /> */}
                {/* )} */}
              </React.Fragment>
            ))}
          </div>
          </TabsContent>
          <TabsContent value="bank">Bank Table</TabsContent>
          <TabsContent value="other">Other Docs</TabsContent>
        </Tabs>


          
        </TabsContent>
        <TabsContent value="previous">
          <p>Previous months documents would be displayed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentUpload;