// @ts-nocheck
"use client"
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { bankColumns } from "./columns";
import { DataTable } from "./data-table";
import { useAuth } from '@clerk/clerk-react';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AllBanks = {
  CompanyId: string;
  bankSeq: string;
  bankName: string;
  bankStatus: string;
  startDate: string;
  verified: boolean;
  uploadStatus: string;
  uploadDate: string;
  periodFrom: string;
  periodTo: string;
  closingBalance: string;
  closingBalanceVerified: string;
  bankPIN: string;
  bankContactName: string;
  bankContactMobile: string;
  bankContactEmail: string;
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

interface MonthlyDocsClientProps {
  selectedMonth?: string | null;
  isCurrentMonth: boolean;
}

export default function BankStatements({ selectedMonth, isCurrentMonth }: MonthlyDocsClientProps) {
  const { userId } = useAuth();

  const [data, setData] = useState<AllBanks[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [{ data: bankData, error: bankError }, { data: uploadData, error: uploadError }] = await Promise.all([
        supabase.from('acc_portal_banks').select('*').eq('userid', userId).order('id', { ascending: true }),
        supabase.from('acc_portal_monthly_files_upload').select('*').eq('userid', userId)
      ]);

      if (bankError) throw new Error(`Error fetching bank data: ${bankError.message}`);
      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);

      const uploadMap = new Map(uploadData.map(item => [item.company_id, item]));

      const transformedData: AllBanks[] = bankData.map(bank => {
        const latestUpload = uploadMap.get(bank.id) || {};
        return {
          CompanyId: bank.id,
          bankSeq: bank.id,
          bankName: bank.name,
          bankStatus: bank.status ? 'Active' : 'Inactive',
          startDate: formatDate(bank.startdate),
          verified: latestUpload.is_verified || false,
          uploadStatus: latestUpload.upload_status ? 'Uploaded' : 'Not Uploaded',
          uploadDate: formatDateTime(latestUpload.upload_date),
          periodFrom: formatDate(latestUpload.docs_date_range),
          periodTo: formatDate(latestUpload.docs_date_range_end),
          closingBalance: latestUpload.closing_balance || '',
          closingBalanceVerified: latestUpload.balance_verification ? "true" : "false",
          bankPIN: bank.pin,
          bankContactName: bank.contact_name,
          bankContactMobile: bank.contact_mobile,
          bankContactEmail: bank.contact_email,
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
    console.log('MonthlyDocsClient - Selected Month:', selectedMonth);
    console.log('MonthlyDocsClient - Is Current Month:', isCurrentMonth);

    if (isCurrentMonth) {
      const currentDate = new Date();
      const currentMonthDisplay = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      setDisplayMonth(currentMonthDisplay);
      fetchData();
    } else if (selectedMonth) {
      setDisplayMonth(selectedMonth);
      fetchData(selectedMonth);
    }
  }, [fetchData, isCurrentMonth, selectedMonth]);
  

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

  const memoizedColumns = useMemo(() => bankColumns, []);

  return (
    <main className="flex flex-col justify-start w-full">
      <h1 className="text-2xl font-bold my-4">Monthly Documents</h1>
      <p className="text-lg mb-4">
        <span className="font-semibold text-blue-700">{currentMonth}</span> Bank Statements
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
              selectedMonth={selectedMonth }
            />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}