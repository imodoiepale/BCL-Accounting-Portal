// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@supabase/supabase-js";
import ReportTable from "./ReportTable";
import BalanceTable from "./BalanceTable";
import { useAuth, useUser } from '@clerk/clerk-react';

// Move Supabase client creation outside of component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');
};

// Initial state for new bank and supplier
const initialBankState = {
  name: '',
  account_number: '',
  currency: '',
  branch: '',
  relationship_manager_name: '',
  relationship_manager_mobile: '',
  relationship_manager_email: ''
};

const initialSupplierState = {
  name: '',
  pin: '',
  contact_name: '',
  contact_mobile: '',
  contact_email: ''
};

export default function Reports() {
  const { user } = useUser();
  const { userId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [supplierData, setSupplierData] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newBank, setNewBank] = useState(initialBankState);
  const [newSupplier, setNewSupplier] = useState(initialSupplierState);

  // Memoized fetch functions
  const fetchSuppliers = useCallback(async (fromDate, toDate) => {
    if (!userId) return;

    try {
      const { data: suppliers, error: supplierError } = await supabase
        .from('acc_portal_suppliers')
        .select('id, name, startdate, contact_email, contact_mobile')
        .eq('userid', userId)
        .order('id', { ascending: true });

      if (supplierError) throw supplierError;

      const { data: reports, error: reportError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('supplier_id, docs_date_range, docs_date_range_end, is_verified, closing_balance')
        .eq('document_type', 'supplier statement')
        .gte('docs_date_range', fromDate)
        .lte('docs_date_range', toDate);

      if (reportError) throw reportError;

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
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, [userId]);

  const fetchBanks = useCallback(async (fromDate, toDate) => {
    if (!userId) return;

    try {
      const { data: banks, error: bankError } = await supabase
        .from('acc_portal_banks')
        .select('id, name, startdate')
        .eq('userid', userId)
        .order('id', { ascending: true });

      if (bankError) throw bankError;

      const { data: reports, error: reportError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('bank_id, docs_date_range, docs_date_range_end, is_verified, closing_balance')
        .eq('document_type', 'bank statement')
        .gte('docs_date_range', fromDate)
        .lte('docs_date_range', toDate);

      if (reportError) throw reportError;

      const processedData = banks.map(bank => {
        const bankReports = reports.filter(report => report.bank_id === bank.id);
        
        const months = Array(12).fill(null).map((_, index) => {
          const reportForMonth = bankReports.find(report => {
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
          id: `B-${bank.id}`,
          name: bank.name,
          startDate: formatDate(bank.startdate),
          months
        };
      });

      setBankData(processedData);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const currentDate = new Date();
      const fromDate = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const toDate = new Date(currentDate.getFullYear(), 11, 31).toISOString().split('T')[0];
      Promise.all([fetchSuppliers(fromDate, toDate), fetchBanks(fromDate, toDate)]).then(() => setIsLoading(false));
    }
  }, [userId, fetchSuppliers, fetchBanks]);

  const handleAddDetails = async () => {
    try {
      if (activeTab === 'suppliers') {
        await supabase
          .from('acc_portal_suppliers')
          .insert([{ ...newSupplier, startdate: new Date().toISOString(), userid: userId }]);
        await fetchSuppliers();
        setNewSupplier(initialSupplierState);
      } else if (activeTab === 'banks') {
        await supabase
          .from('acc_portal_banks')
          .insert([{ ...newBank, startdate: new Date().toISOString(), userid: userId }]);
        await fetchBanks();
        setNewBank(initialBankState);
      }
      setIsAddSheetOpen(false);
    } catch (error) {
      console.error(`Error adding ${activeTab === 'suppliers' ? 'supplier' : 'bank'}:`, error);
    }
  };

  const handleInputChange = (e, setStateFunction) => {
    const { id, value } = e.target;
    setStateFunction(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSelectChange = (value, setStateFunction, field) => {
    setStateFunction(prevState => ({ ...prevState, [field]: value }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <Tabs defaultValue="suppliers" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="suppliers">Suppliers Statement Reports</TabsTrigger>
            <TabsTrigger value="banks">Banks Statement Reports</TabsTrigger>
          </TabsList>
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 text-white">
                {activeTab === 'suppliers' ? 'Add New Supplier' : 'Add New Bank Account'}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{activeTab === 'suppliers' ? 'Add Supplier' : 'Add Bank Account'}</SheetTitle>
                <SheetDescription>
                  {activeTab === 'suppliers'
                    ? 'Add all the details of a supplier to the system'
                    : 'Add all the details of a bank account to the system'}
                </SheetDescription>
              </SheetHeader>
              {activeTab === 'suppliers' ? (
                <SupplierForm newSupplier={newSupplier} setNewSupplier={setNewSupplier} handleInputChange={handleInputChange} />
              ) : (
                <BankForm newBank={newBank} setNewBank={setNewBank} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />
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
              <ReportTable data={supplierData} title="Suppliers Report" fetchData={fetchSuppliers} addButtonText="Add Supplier Statement" />
            </TabsContent>
            <TabsContent value="balance">
              <BalanceTable data={supplierData} title="Suppliers Report" fetchData={fetchSuppliers} />
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
              <ReportTable data={bankData} title="Banks Report" fetchData={fetchBanks} addButtonText="Add Bank Statement" />
            </TabsContent>
            <TabsContent value="balance">
              <BalanceTable data={bankData} title="Banks Report" fetchData={fetchBanks} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate components for Supplier and Bank forms
function SupplierForm({ newSupplier, setNewSupplier, handleInputChange }) {
  return (
    <div className="flex flex-col pt-4 gap-4">
      <FormField id="name" label="Supplier Name" placeholder="XYZ Supplier" value={newSupplier.name} onChange={(e) => handleInputChange(e, setNewSupplier)} required />
      <FormField id="pin" label="Supplier Pin" placeholder="P2288DNSK" value={newSupplier.pin} onChange={(e) => handleInputChange(e, setNewSupplier)} />
      <FormField id="contact_name" label="Supplier Contact Name" placeholder="John Doe" value={newSupplier.contact_name} onChange={(e) => handleInputChange(e, setNewSupplier)} />
      <FormField id="contact_mobile" label="Supplier Contact Mobile" placeholder="+25471234567" value={newSupplier.contact_mobile} onChange={(e) => handleInputChange(e, setNewSupplier)} />
      <FormField id="contact_email" label="Supplier Contact Email" placeholder="john@example.com" value={newSupplier.contact_email} onChange={(e) => handleInputChange(e, setNewSupplier)} />
    </div>
  );
}

function BankForm({ newBank, setNewBank, handleInputChange, handleSelectChange }) {
  return (
    <div className="flex flex-col pt-4 gap-4">
      <FormField id="name" label="Bank Name" placeholder="XYZ Bank" value={newBank.name} onChange={(e) => handleInputChange(e, setNewBank)} required />
      <FormField id="account_number" label="Account Number" placeholder="011110001122" value={newBank.account_number} onChange={(e) => handleInputChange(e, setNewBank)} />
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
      <FormField id="branch" label="Branch" placeholder="Main Branch" value={newBank.branch} onChange={(e) => handleInputChange(e, setNewBank)} />
      <FormField id="relationship_manager_name" label="Relationship Manager Name" placeholder="John Doe" value={newBank.relationship_manager_name} onChange={(e) => handleInputChange(e, setNewBank)} />
      <FormField id="relationship_manager_mobile" label="Relationship Manager Mobile" placeholder="+25471234567" value={newBank.relationship_manager_mobile} onChange={(e) => handleInputChange(e, setNewBank)} />
      <FormField id="relationship_manager_email" label="Relationship Manager Email" placeholder="john@example.com" value={newBank.relationship_manager_email} onChange={(e) => handleInputChange(e, setNewBank)} />
    </div>
  );
}

// Reusable form field component
function FormField({ id, label, placeholder, value, onChange, required = false }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} value={value} onChange={onChange} required={required} />
    </div>
  );
}