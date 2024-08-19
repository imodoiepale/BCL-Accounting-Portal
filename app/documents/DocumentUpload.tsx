/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { DataTable } from "./data-table";
import { supplierColumns, bankColumns } from "./columns";

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CombinedMonthlyDocsProps {
  type: 'supplier' | 'bank';
  selectedMonth?: string | null;
  isCurrentMonth: boolean;
}

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

export function CombinedMonthlyDocs({ type, selectedMonth, isCurrentMonth }: CombinedMonthlyDocsProps) {
  const { userId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [displayMonth, setDisplayMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (month?: string) => {
    try {
      setIsLoading(true);
      console.log(`Fetching ${type} data for month:`, month || 'Current Month');

      let query = supabase
        .from(type === 'supplier' ? 'acc_portal_suppliers' : 'acc_portal_banks')
        .select('*')
        .eq('userid', userId)
        .order('id', { ascending: true });

      let uploadQuery = supabase
        .from('acc_portal_monthly_files_upload')
        .select('*')
        .eq('userid', userId)
        .eq('document_type', type === 'supplier' ? 'supplier statement' : 'bank statement');

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
        .gte('docs_date_range', startDate.toISOString())
        .lte('docs_date_range_end', endDate.toISOString());

      const [{ data: mainData, error: mainError }, { data: uploadData, error: uploadError }] = await Promise.all([
        query,
        uploadQuery
      ]);

      if (mainError) throw new Error(`Error fetching ${type} data: ${mainError.message}`);
      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);

      const uploadMap = new Map(uploadData.map(item => [item[`${type}_id`], item]));    

      const transformedData = mainData.map(item => {
        const latestUpload = uploadMap.get(item.id) || {};
        return {
          [type === 'supplier' ? 'suppSeq' : 'bankSeq']: item.id,
          [type === 'supplier' ? 'suppName' : 'bankName']: item.name,
          [type === 'supplier' ? 'suppStatus' : 'bankStatus']: item.status ? 'Active' : 'Inactive',
          [type === 'supplier' ? 'suppStartDate' : 'bankStartDate']: formatDate(item.startdate),
          [type === 'supplier' ? 'verifiedByBCLAccManager' : 'verifiedByBCLAccManager']: latestUpload.is_verified || false,
          [type === 'supplier' ? 'uploadStatus' : 'uploadStatus']: latestUpload.upload_status ? 'Uploaded' : 'Not Uploaded',
          [type === 'supplier' ? 'uploadDate' : 'uploadDate']: formatDateTime(latestUpload.upload_date),
          [type === 'supplier' ? 'supplierWefDate' : 'periodFrom']: formatDate(latestUpload.docs_date_range),
          [type === 'supplier' ? 'supplierUntilDate' : 'periodTo']: formatDate(latestUpload.docs_date_range_end),
          [type === 'supplier' ? 'verifyByBCL' : 'verifyByBCL']: latestUpload.is_verified || false,
          [type === 'supplier' ? 'suppPIN' : 'accountNumber']: type === 'supplier' ? item.pin : item.account_number,
          [type === 'supplier' ? 'suppContactName' : 'branchName']: type === 'supplier' ? item.contact_name : item.branch_name,
          [type === 'supplier' ? 'suppContactMobile' : 'currency']: type === 'supplier' ? item.contact_mobile : item.currency,
          [type === 'supplier' ? 'suppContactEmail' : 'bankContactEmail']: type === 'supplier' ? item.contact_email : '',
          [type === 'supplier' ? 'closingBalance' : 'closingBalance']: latestUpload.closing_balance || '',
          [type === 'supplier' ? 'closingBalanceVerify' : 'closingBalanceVerify']: latestUpload.balance_verification ? "true" : "false",
          [type === 'supplier' ? 'suppFilePath' : 'bankFilePath']: latestUpload.file_path || '',
        };
      });

      setData(transformedData);
      console.log('Transformed data:', transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // TODO: Add user-facing error message
    } finally {
      setIsLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    console.log(`CombinedMonthlyDocs (${type}) - Selected Month:`, selectedMonth);
    console.log(`CombinedMonthlyDocs (${type}) - Is Current Month:`, isCurrentMonth);
  
    if (isCurrentMonth) {
      const currentDate = new Date();
      const currentMonthDisplay = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      setDisplayMonth(currentMonthDisplay);
      fetchData();
    } else if (selectedMonth) {
      setDisplayMonth(selectedMonth);
      fetchData(selectedMonth);
    }
  }, [fetchData, isCurrentMonth, selectedMonth, type]);

  const columns = type === 'supplier' ? supplierColumns : bankColumns;

  return (
    <main className="flex flex-col justify-start w-full">
      <p className="text-lg mb-4">
        {type === 'supplier' ? 'Supplier' : 'Bank'} Statements for <span className="font-semibold text-blue-700">{displayMonth}</span>
      </p>
      <div className="">
        <div className="align-middle">
          <div className="border-b border-gray-200 shadow sm:rounded-lg">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <DataTable 
                columns={columns} 
                data={data}
                selectedMonth={selectedMonth || displayMonth}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


export function PreviousMonths({ type }: { type: 'supplier' | 'bank' }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const generateMonths = useCallback(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      currentDate.setMonth(currentDate.getMonth() - 1);
      months.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  }, []);

  const months = useMemo(() => generateMonths(), [generateMonths]);

  const handleMonthSelect = useCallback((month: string) => {
    console.log(`PreviousMonths (${type}) - Month selected:`, month);
    setSelectedMonth(month);
  }, [type]);

  useEffect(() => {
    console.log(`PreviousMonths (${type}) - Effect - Selected Month:`, selectedMonth);
  }, [selectedMonth, type]);

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-44 p-4 border-b md:border-b-0 md:border-r">
        <h2 className="text-md font-bold mb-4 text-center">Previous Months</h2>
        <div className="space-y-2">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              onClick={() => handleMonthSelect(month)}
              className="w-full"
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full md:w-3/4 lg:w-4/5 p-4">
        {selectedMonth && (
          <CombinedMonthlyDocs 
            type={type}
            // data={data}
            selectedMonth={selectedMonth}
            isCurrentMonth={false}
          />
        )}
      </div>
    </div>
  );
}

