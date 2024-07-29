// @ts-nocheck
"use client"
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supplierColumns } from "./columns";
import { DataTable } from "./data-table";

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AllCompanies = {
  CompanyId: string;
  suppSeq: string;
  suppName: string;
  suppStatus: string;
  suppStartDate: string;
  verifiedByBCLAccManager: boolean;
  uploadStatus: string;
  uploadDate: string;
  supplierWefDate: string;
  supplierUntilDate: string;
  verifyByBCL: boolean;
  suppPIN: string;
  suppContactName: string;
  suppContactMobile: string;
  suppContactEmail: string;
  closingBalance: string;
  closingBalanceVerify: string;
  filePath: string;
};

// Utility function to format date as dd/mm/yyyy
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Utility function to format date and time as dd/mm/yyyy 9:00 am/pm
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', '');
}

export default function MonthlyDocs() {
  const [data, setData] = useState<AllCompanies[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [{ data: supplierData, error: supplierError }, { data: uploadData, error: uploadError }] = await Promise.all([
        supabase.from('acc_portal_suppliers').select('*').order('id', { ascending: true }),
        supabase.from('acc_portal_monthly_files_upload').select('*')
      ]);

      if (supplierError) throw new Error(`Error fetching supplier data: ${supplierError.message}`);
      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);

      const uploadMap = new Map(uploadData.map(item => [item.supplier_id, item]));

      const transformedData: AllCompanies[] = supplierData.map(supplier => {
        const latestUpload = uploadMap.get(supplier.id) || {};
        return {
          CompanyId: supplier.id,
          suppSeq: supplier.id,
          suppName: supplier.name,
          suppStatus: supplier.status ? 'Active' : 'Inactive',
          suppStartDate: formatDate(supplier.startdate),
          verifiedByBCLAccManager: latestUpload.is_verified || false,
          uploadStatus: latestUpload.upload_status ? 'Uploaded' : 'Not Uploaded',
          uploadDate: formatDateTime(latestUpload.upload_date),
          supplierWefDate: formatDate(latestUpload.docs_date_range),
          supplierUntilDate: formatDate(latestUpload.docs_date_range_end),
          verifyByBCL: latestUpload.is_verified || false,
          suppPIN: supplier.pin,
          suppContactName: supplier.contact_name,
          suppContactMobile: supplier.contact_mobile,
          suppContactEmail: supplier.contact_email,
          closingBalance: latestUpload.closing_balance || '',
          closingBalanceVerify: latestUpload.balance_verification ? "true" : "false",
          filePath: latestUpload.file_path || '',
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }));
    setCurrentMonth(date.toLocaleDateString('en-US', { month: 'long' }));
    fetchData();
  }, [fetchData]);

  const memoizedColumns = useMemo(() => supplierColumns, []);

  return (
    <main className="flex flex-col justify-start w-full">
      {/* <h1 className="text-2xl font-bold my-4">Monthly Documents</h1> */}
      <p className="text-lg mb-4">
        <span className="font-semibold text-blue-700">{currentMonth}</span> Supplier Statements
      </p>
      <div className="">
        <div className="inline-block min-w-full align-middle">
          <div className="border-b border-gray-200 shadow sm:rounded-lg">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <DataTable 
                columns={memoizedColumns} 
                data={data}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}