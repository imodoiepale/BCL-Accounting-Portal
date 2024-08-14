// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@supabase/supabase-js";
import ReportTable from "./ReportTable";
import BalanceTable from "./BalanceTable";
import { useAuth, useUser } from '@clerk/clerk-react'

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing";
const url = "https://zyszsqgdlrpnunkegipk.supabase.co";

const supabase = createClient(url, key);

export default function Reports() {
  const { user } = useUser();
  const { userId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);

  const [supplierData, setSupplierData] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newBank, setNewBank] = useState({
    name: '',
    account_number: '',
    currency: '',
    branch: '',
    relationship_manager_name: '',
    relationship_manager_mobile: '',
    relationship_manager_email: ''
  });
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: ''
  });


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  useEffect(() => {
    if (userId) {
      fetchSuppliers();
      fetchBanks();
      setIsLoading(false);
    }
  }, [userId]);
  // console.log(userId)
  

  const fetchSuppliers = async () => {
    const { data: suppliers, error: supplierError } = await supabase
      .from('acc_portal_suppliers')
      .select('id, name, startdate, contact_email, contact_mobile')
      .order('id', { ascending: true })
      .eq('userid', userId)
    if (supplierError) {
      console.error('Error fetching suppliers:', supplierError);
      return;
    }
  
    const { data: reports, error: reportError } = await supabase
      .from('acc_portal_monthly_files_upload')
      .select('supplier_id, docs_date_range, docs_date_range_end, is_verified, closing_balance')
      .eq('document_type', 'supplier statement', 'supplier_id');

    

      console.log(reports)
  
    if (reportError) {
      console.error('Error fetching supplier reports:', reportError);
      return;
    }
  
    const processedData = suppliers.map(supplier => {
      const supplierReports = reports.filter(report => report.supplier_id === supplier.id);
      
      const months = Array(12).fill(null).map((_, index) => {
        const reportForMonth = supplierReports.find(report => {
          const reportDate = new Date(report.docs_date_range);
          return reportDate.getMonth() === index;
        });
  
        if (reportForMonth) {
          return {
            status: 'uploaded',
            isVerified: reportForMonth.is_verified,
            startDate: formatDate(reportForMonth.docs_date_range),
            endDate: formatDate(reportForMonth.docs_date_range_end),
            closingBalance: reportForMonth.closing_balance
          };
        }
        return null;
      });
  
      return {
        id: `S-${supplier.id}`,
        name: supplier.name,
        email: supplier.contact_email,
        phoneNumber: supplier.contact_mobile,
        startDate: formatDate(supplier.startdate),
        months
      };
    });
    setSupplierData(processedData);
  };

  const fetchBanks = async () => {
    const { data: banks, error: bankError } = await supabase
      .from('acc_portal_banks')
      .select('id, name, startdate')
      .eq('userid', userId)
      .order('id', { ascending: true });


    if (bankError) {
      console.error('Error fetching banks:', bankError);
      return;
    }

    const { data: reports, error: reportError } = await supabase
      .from('acc_portal_monthly_files_upload')
      .select('bank_id, docs_date_range, docs_date_range_end, is_verified, closing_balance')
      .eq('document_type', 'bank statement','bank_id');

    if (reportError) {
      console.error('Error fetching bank reports:', reportError);
      return;
    }

    const processedData = banks.map(bank => {
      const bankReports = reports.filter(report => report.bank_id === bank.id);
      
      const months = Array(12).fill(null);
    
      bankReports.forEach(report => {
        const startDate = new Date(report.docs_date_range);
        const monthIndex = startDate.getMonth();
        
        months[monthIndex] = {
          status: 'uploaded',
          isVerified: report.is_verified,
          startDate: formatDate(report.docs_date_range),
          endDate: formatDate(report.docs_date_range_end),
          closingBalance: report.closing_balance
        };
      });
    
      return {
        id: `B-${bank.id}`,
        name: bank.name,
        startDate: formatDate(bank.startdate),
        months
      };
    });

    setBankData(processedData);
  };
  const handleAddDetails = async () => {
    if (activeTab === 'suppliers') {
      const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .insert([{ ...newSupplier, startdate: new Date().toISOString(), userid: userId }]);

      
      if (error) {
        console.error('Error adding supplier:', error);
      } else {
        console.log('Supplier added successfully');
        fetchSuppliers();
        setIsAddSheetOpen(false);
        setNewSupplier({
          name: '',
          pin: '',
          contact_name: '',
          contact_mobile: '',
          contact_email: ''
        });
      }
    } else if (activeTab === 'banks') {
      const { data, error } = await supabase
        .from('acc_portal_banks')
        .insert([{ ...newBank, startdate: new Date().toISOString(), userid: userId }]);

      
      if (error) {
        console.error('Error adding bank:', error);
      } else {
        console.log('Bank added successfully');
        fetchBanks();
        setIsAddSheetOpen(false);
        setNewBank({
          name: '',
          account_number: '',
          currency: '',
          branch: '',
          relationship_manager_name: '',
          relationship_manager_mobile: '',
          relationship_manager_email: ''
        });
      }
    }
  };

  const handleInputChange = (e, setStateFunction) => {
    setStateFunction(prevState => ({ ...prevState, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (value, setStateFunction, field) => {
    setStateFunction(prevState => ({ ...prevState, [field]: value }));
  };

  const otherDocsData = [
    { id: "DOC-1", name: "Document 1", startDate: "2024-01-01", months: ["✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
    { id: "DOC-2", name: "Document 2", startDate: "2024-02-01", months: ["❌", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
  ];

  return (
    <div className="p-4 w-full">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <Tabs defaultValue="suppliers" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="suppliers">Suppliers Statement Reports</TabsTrigger>
            <TabsTrigger value="banks">Banks Statement Reports</TabsTrigger>
            <TabsTrigger value="others">Other Docs Statement Reports</TabsTrigger>
          </TabsList>
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 text-white">
                {activeTab === 'suppliers' ? 'Add New Supplier' : activeTab === 'banks' ? 'Add New Bank Account' : 'Add New Document'}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{activeTab === 'suppliers' ? 'Add Supplier' : 'Add Bank Account'}</SheetTitle>
                <SheetDescription>
                  {activeTab === 'suppliers'
                    ? 'This section includes adding all the details of a supplier to the system'
                    : 'This section includes adding all the details of a bank account to the system'}
                </SheetDescription>
              </SheetHeader>

              {activeTab === 'suppliers' ? (
                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input id="name" placeholder="XYZ Supplier" value={newSupplier.name} onChange={(e) => handleInputChange(e, setNewSupplier)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pin">Supplier Pin</Label>
                    <Input id="pin" placeholder="P2288DNSK" value={newSupplier.pin} onChange={(e) => handleInputChange(e, setNewSupplier)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_name">Supplier Contact Name</Label>
                    <Input id="contact_name" placeholder="John Doe" value={newSupplier.contact_name} onChange={(e) => handleInputChange(e, setNewSupplier)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_mobile">Supplier Contact Mobile</Label>
                    <Input id="contact_mobile" placeholder="+25471234567" value={newSupplier.contact_mobile} onChange={(e) => handleInputChange(e, setNewSupplier)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_email">Supplier Contact Email</Label>
                    <Input id="contact_email" placeholder="john@example.com" value={newSupplier.contact_email} onChange={(e) => handleInputChange(e, setNewSupplier)} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Bank Name</Label>
                    <Input id="name" placeholder="XYZ Bank" value={newBank.name} onChange={(e) => handleInputChange(e, setNewBank)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input id="account_number" placeholder="011110001122" value={newBank.account_number} onChange={(e) => handleInputChange(e, setNewBank)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, setNewBank, 'currency')} value={newBank.currency}>
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
                    <Input id="branch" placeholder="Main Branch" value={newBank.branch} onChange={(e) => handleInputChange(e, setNewBank)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_name">Relationship Manager Name</Label>
                    <Input id="relationship_manager_name" placeholder="John Doe" value={newBank.relationship_manager_name} onChange={(e) => handleInputChange(e, setNewBank)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_mobile">Relationship Manager Mobile</Label>
                    <Input id="relationship_manager_mobile" placeholder="+25471234567" value={newBank.relationship_manager_mobile} onChange={(e) => handleInputChange(e, setNewBank)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_email">Relationship Manager Email</Label>
                    <Input id="relationship_manager_email" placeholder="john@example.com" value={newBank.relationship_manager_email} onChange={(e) => handleInputChange(e, setNewBank)} />
                  </div>
                </div>
              )}
              <div className="pt-4">
                <Button className="bg-blue-600 text-white" onClick={handleAddDetails}>Submit</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <TabsContent value="suppliers">
          <Tabs defaultValue="suppliers">
            <TabsList>
              <TabsTrigger value="suppliers">Suppliers Statement Documents</TabsTrigger>
              <TabsTrigger value="balance">Suppliers Statement Closing Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers">
              <ReportTable 
                data={supplierData} 
                title="Suppliers Report" 
                fetchData={fetchSuppliers}  
              />
            </TabsContent>

            <TabsContent value="balance">
              <BalanceTable 
                data={supplierData} 
                title="Suppliers Report" 
                fetchData={fetchSuppliers} 
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="banks">
          <Tabs defaultValue="statements">
            <TabsList>
              <TabsTrigger value="statements">Banks Statement Documents</TabsTrigger>
              <TabsTrigger value="balance">Banks Statement Closing Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="statements">
              <ReportTable 
                data={bankData} 
                title="Banks Report" 
                fetchData={fetchBanks} 
              />
            </TabsContent>

            <TabsContent value="balance">
              <BalanceTable 
                data={bankData} 
                title="Banks Report" 
                fetchData={fetchBanks} 
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* <TabsContent value="others">
          <ReportTable data={otherDocsData} title="Other Documents Report" />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}