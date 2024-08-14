// @ts-nocheck
"use client"
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { bankColumns } from "./columns";
import { DataTable } from "../data-table";
import { useAuth } from '@clerk/clerk-react';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type BankStatement = {
  id: string;
  bankName: string;
  accountNumber: string;
  uploadStatus: string;
  uploadDate: string;
  statementStartDate: string;
  statementEndDate: string;
  closingBalance: string;
  filePath: string;
};

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

interface BankStatementsClientProps {
  selectedMonth: string | null;
}

export function BankStatementsClient({ selectedMonth }: BankStatementsClientProps) {
  const { userId } = useAuth();


  const [data, setData] = useState<AllBanks[]>([]);
  const [displayMonth, setDisplayMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (month: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching bank data for month:', month);

      const [monthName, year] = month.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      
      const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), monthNumber, 0).toISOString().split('T')[0];
      
      console.log('Date range:', startDate, 'to', endDate);
      
      const { data: bankData, error: bankError } = await supabase
        .from('acc_portal_banks')
        .select('*')
        .eq('userid', userId);

      if (bankError) throw new Error(`Error fetching bank data: ${bankError.message}`);

      const { data: uploadData, error: uploadError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('*')
        .eq('userid', userId)
        .eq('document_type', 'bank statement')
        .gte('upload_date', startDate)
        .lte('upload_date', endDate);

      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);

      const uploadMap = new Map(uploadData.map(item => [item.bank_id, item]));


      const transformedData: AllBanks[] = bankData.map(bank => {
        const latestUpload = uploadMap.get(bank.id) || {};
        return {
          id: bank.id,
          CompanyId: bank.company_id || '',
          bankSeq: bank.bank_seq || 0,
          bankName: bank.name,
          accountNumber: bank.account_number,
          bankStatus: bank.status || '',
          startDate: bank.start_date || '',
          endDate: bank.end_date || '',
          uploadStatus: latestUpload.upload_status ? 'Uploaded' : 'Not Uploaded',
          uploadDate: formatDate(latestUpload.upload_date),
          statementStartDate: formatDate(latestUpload.docs_date_range),
          statementEndDate: formatDate(latestUpload.docs_date_range_end),
          closingBalance: latestUpload.closing_balance || '',
          filePath: latestUpload.file_path || '',
          openingBalance: latestUpload.opening_balance || '',
          currency: bank.currency || '',
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // TODO: Add user-facing error message
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log('BankStatementsClient - Selected Month:', selectedMonth);

    if (selectedMonth) {
      setDisplayMonth(selectedMonth);
      fetchData(selectedMonth);
    } else {
      const currentDate = new Date();
      const currentMonthDisplay = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      setDisplayMonth(currentMonthDisplay);
      fetchData(currentMonthDisplay);
    }
  }, [fetchData, selectedMonth]);

  const memoizedColumns = useMemo(() => bankColumns, []);

  return (
    <main className="flex flex-col justify-start w-full">
      <p className="text-lg mb-4">
        Bank Statements for <span className="font-semibold text-blue-700">{displayMonth}</span>
      </p>
      <div className="">
        <div className="align-middle">
          <div className="border-b border-gray-200 shadow sm:rounded-lg">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <DataTable 
                columns={memoizedColumns} 
                data={data}
                selectedMonth={displayMonth}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}