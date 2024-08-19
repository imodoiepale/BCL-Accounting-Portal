// @ts-nocheck
"use client"
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { bankColumns } from "./columns";
import { DataTable } from "../data-table";
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type BankStatement = {
  id: string;
  CompanyId: string;
  bankSeq: number;
  bankName: string;
  accountNumber: string;
  bankStatus: string;
  startDate: string;
  endDate: string;
  uploadStatus: string;
  uploadDate: string;
  statementStartDate: string;
  statementEndDate: string;
  closingBalance: string;
  openingBalance: string;
  currency: string;
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

function formatDateTime(dateTimeString: string) {
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

interface BankStatementsClientProps {
  selectedMonth: string | null;
}

export function BankStatementsClient({ selectedMonth }: BankStatementsClientProps) {
  const { userId } = useAuth();
  
  const [data, setData] = useState<BankStatement[]>([]);
  const [displayMonth, setDisplayMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (month?: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching data for month:', month || 'Current Month');
  
      let bankQuery = supabase
        .from('acc_portal_banks')
        .select('*')
        .eq('userid', userId)
        .order('id', { ascending: true });
  
      let uploadQuery = supabase
        .from('acc_portal_monthly_files_upload')
        .select('*')
        .eq('userid', userId)
        .eq('document_type', 'bank statement');
  
      let startDate, endDate;
  
      if (month) {
        const [monthName, year] = month.split(' ');
        const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth();
        
        startDate = new Date(parseInt(year), monthNumber, 1);
        endDate = new Date(parseInt(year), monthNumber + 1, 0);
      } else {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      const extendedStartDate = new Date(startDate);
      extendedStartDate.setDate(extendedStartDate.getDate() - 2);
      const extendedEndDate = new Date(endDate);
      extendedEndDate.setDate(extendedEndDate.getDate() + 2);
  
      console.log('Extended Date range:', extendedStartDate.toISOString(), 'to', extendedEndDate.toISOString());
      
      uploadQuery = uploadQuery
        .gte('upload_date', extendedStartDate.toISOString())
        .lte('upload_date', extendedEndDate.toISOString());
  
      const [{ data: bankData, error: bankError }, { data: uploadData, error: uploadError }] = await Promise.all([
        bankQuery,
        uploadQuery
      ]);
  
      if (bankError) throw new Error(`Error fetching bank data: ${bankError.message}`);
      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);
  
      const uploadMap = new Map(uploadData.map(item => [item.bank_id, item]));    

      const transformedData: BankStatement[] = bankData.map(bank => {
        const latestUpload = uploadMap.get(bank.id) || {};
        return {
          id: bank.id,
          CompanyId: bank.company_id || '',
          bankSeq: bank.bank_seq || 0,
          bankName: bank.name,
          accountNumber: bank.account_number,
          bankStatus: bank.status || '',
          startDate: formatDate(bank.start_date),
          endDate: formatDate(bank.end_date),
          uploadStatus: latestUpload.upload_status || 'Not Uploaded',
          uploadDate: formatDateTime(latestUpload.upload_date),
          statementStartDate: formatDate(latestUpload.docs_date_range),
          statementEndDate: formatDate(latestUpload.docs_date_range_end),
          closingBalance: latestUpload.closing_balance || '',
          openingBalance: latestUpload.opening_balance || '',
          currency: bank.currency || '',
          filePath: latestUpload.file_path || '',
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch bank statements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log('BankStatementsClient - Selected Month:', selectedMonth);
    const isCurrentMonth = selectedMonth === new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    console.log('BankStatementsClient - Is Current Month:', isCurrentMonth);

    if (isCurrentMonth) {
      setDisplayMonth(selectedMonth);
    } else {
      setDisplayMonth(selectedMonth || 'Select a month');
    }
    fetchData(selectedMonth);
  }, [fetchData, selectedMonth]);

  const handleFileUpload = async (file, bankId) => {
    try {
      if (!checkFile(file)) return;

      const { data, error } = await supabase.storage
        .from('bank-statements')
        .upload(`${userId}/${bankId}/${file.name}`, file);

      if (error) throw error;

      const { data: uploadData, error: uploadError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          userid: userId,
          bank_id: bankId,
          document_type: 'bank statement',
          upload_status: 'Uploaded',
          upload_date: new Date().toISOString(),
          file_path: data.path
        });

      if (uploadError) throw uploadError;

      toast.success('Bank statement uploaded successfully');
      fetchData(selectedMonth);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload bank statement. Please try again.');
    }
  };

  const checkFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF or image file.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return false;
    }

    return true;
  };

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
                onFileUpload={handleFileUpload}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}