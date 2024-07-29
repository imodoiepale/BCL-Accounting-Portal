//@ts-nocheck
"use client";

//@ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from "react";
import ReportTable from "./ReportTable";

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key);

const generateMonthsData = (reports) => {
  const months = Array(12).fill("");
  reports.forEach(report => {
    const start = new Date(report.docs_date_range);
    const end = new Date(report.docs_date_range_end);
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const currentMonth = new Date(now.getFullYear(), i, 1);
      if (currentMonth >= start && currentMonth <= end && currentMonth <= now) {
        months[i] = report.is_verified ? "✅" : "❌";
      }
    }
  });
  return months;
};

export default function Reports() {
  const [supplierData, setSupplierData] = useState([]);
  const [bankData, setBankData] = useState([]);

  useEffect(() => {
    fetchSuppliers();
    fetchBanks();
  }, []);

  const fetchSuppliers = async () => {
    const { data: suppliers, error: supplierError } = await supabase
      .from('acc_portal_suppliers')
      .select('id, name, startdate')
      .order('id', { ascending: true });
  
    if (supplierError) {
      console.error('Error fetching suppliers:', supplierError);
      return;
    }
  
    const { data: reports, error: reportError } = await supabase
      .from('acc_portal_monthly_files_upload')
      .select('supplier_id, docs_date_range, docs_date_range_end, is_verified')
      .eq('document_type', 'supplier statement');
  
    if (reportError) {
      console.error('Error fetching supplier reports:', reportError);
      return;
    }
  
    const processedData = suppliers.map(supplier => {
      const supplierReports = reports.filter(report => report.supplier_id === supplier.id);
      const months = Array(12).fill(null).map((_, index) => {
        const report = supplierReports.find(r => {
          const startDate = new Date(r.docs_date_range);
          const endDate = new Date(r.docs_date_range_end);
          const currentMonth = new Date(new Date().getFullYear(), index, 1);
          return currentMonth >= startDate && currentMonth <= endDate;
        });
  
        if (report) {
          return {
            status: 'uploaded',
            isVerified: report.is_verified,
            startDate: report.docs_date_range,
            endDate: report.docs_date_range_end
          };
        }
        return null;
      });
  
      return {
        id: `S-${supplier.id}`,
        name: supplier.name,
        startDate: supplier.startdate,
        months
      };
    });
  
    setSupplierData(processedData);
  };

  const fetchBanks = async () => {
    const { data: banks, error: bankError } = await supabase
      .from('acc_portal_banks')
      .select('id, name, startdate')
      .order('id', { ascending: true });
  
    if (bankError) {
      console.error('Error fetching banks:', bankError);
      return;
    }
  
    const { data: reports, error: reportError } = await supabase
      .from('acc_portal_monthly_files_upload')
      .select('bank_id, docs_date_range, docs_date_range_end, is_verified')
      .eq('document_type', 'bank statement');
  
    if (reportError) {
      console.error('Error fetching bank reports:', reportError);
      return;
    }
  
    const processedData = banks.map(bank => {
      const bankReports = reports.filter(report => report.bank_id === bank.id);
      const months = Array(12).fill(null).map((_, index) => {
        const report = bankReports.find(r => {
          const startDate = new Date(r.docs_date_range);
          const endDate = new Date(r.docs_date_range_end);
          const currentMonth = new Date(new Date().getFullYear(), index, 1);
          return currentMonth >= startDate && currentMonth <= endDate;
        });
  
        if (report) {
          return {
            status: 'uploaded',
            isVerified: report.is_verified,
            startDate: report.docs_date_range,
            endDate: report.docs_date_range_end
          };
        }
        return null;
      });
  
      return {
        id: `B-${bank.id}`,
        name: bank.name,
        startDate: bank.startdate,
        months
      };
    });
  
    setBankData(processedData);
  };

  const otherDocsData = [
    { id: "DOC-1", name: "Document 1", startDate: "2024-01-01", months: ["✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
    { id: "DOC-2", name: "Document 2", startDate: "2024-02-01", months: ["❌", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
  ];

  return (
    <div className="p-4 w-full ">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers Statement Reports</TabsTrigger>
          <TabsTrigger value="banks">Banks Statement Reports</TabsTrigger>
          <TabsTrigger value="others">Other Docs Statement Reports</TabsTrigger>
        </TabsList>

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
              {/* Add content for balance tab if needed */}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="banks">
          <ReportTable data={bankData} title="Banks Report" fetchData={fetchBanks}  />
        </TabsContent>

        <TabsContent value="others">
          <ReportTable data={otherDocsData} title="Other Documents Report" />
        </TabsContent>
      </Tabs>
    </div>
  );
}