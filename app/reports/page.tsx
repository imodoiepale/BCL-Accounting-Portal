//@ts-nocheck
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from "react";
import ReportTable from "./ReportTable";

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key);

const generateMonthsData = (startDate) => {
  const months = [];
  const start = new Date(startDate);
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    if (start <= now) {
      months.push(Math.random() < 0.5 ? "✅" : "❌");
    } else {
      months.push("");
    }
    start.setMonth(start.getMonth() + 1);
  }
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
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .select('id, name, startdate')
      .order('id', { ascending: true });
    if (error) console.error('Error fetching suppliers:', error);
    else setSupplierData(data.map(supplier => ({
      id: `SUPP-${supplier.id}`,
      name: supplier.name,
      startDate: supplier.startdate,
      months: generateMonthsData(supplier.startdate),
    })));
  };

  const fetchBanks = async () => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .select('id, name, startdate')
      .order('id', { ascending: true });
    if (error) console.error('Error fetching banks:', error);
    else setBankData(data.map(bank => ({
      id: `BANK-ACC-${bank.id}`,
      name: bank.name,
      startDate: bank.startdate,
      months: generateMonthsData(bank.startdate),
    })));
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
          <Tabs defaultValue="docs">
            <TabsList>
              <TabsTrigger value="docs">Suppliers Statement Documents</TabsTrigger>
              <TabsTrigger value="balance">Suppliers Statement Closing Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="docs">
              <ReportTable data={supplierData} title="Suppliers Report" />
            </TabsContent>

            <TabsContent value="balance">
              {/* Add content for balance tab if needed */}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="banks">
          <ReportTable data={bankData} title="Banks Report" />
        </TabsContent>

        <TabsContent value="others">
          <ReportTable data={otherDocsData} title="Other Documents Report" />
        </TabsContent>
      </Tabs>
    </div>
  );
}