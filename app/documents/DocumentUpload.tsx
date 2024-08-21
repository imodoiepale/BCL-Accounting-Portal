/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { DataTable } from "./data-table";
import { supplierColumns, bankColumns } from "./columns";

const supabase = createClient(
  'https://zyszsqgdlrpnunkegipk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing'
);

interface CombinedMonthlyDocsProps {
  type: 'supplier' | 'bank';
  selectedMonth?: string | null;
  isCurrentMonth: boolean;
}

const formatDate = (dateString: string) => 
  dateString ? new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }) : 'N/A';

const formatDateTime = (dateTimeString: string) => 
  dateTimeString ? new Date(dateTimeString).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).replace(',', '') : 'N/A';

const getDateRange = (month: string | null, isCurrentMonth: boolean) => {
  const now = new Date();
  let year, monthIndex;

  if (isCurrentMonth) {
    // For the current month, we're actually looking at the previous month
    year = now.getFullYear();
    monthIndex = now.getMonth() - 1;
  } else if (month) {
    const [monthName, yearStr] = month.split(' ');
    year = parseInt(yearStr, 10);
    monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
  } else {
    throw new Error("Invalid month input");
  }

  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  return { startDate, endDate };
};


  export function CombinedMonthlyDocs({ type, selectedMonth, isCurrentMonth }: CombinedMonthlyDocsProps) {
    const { userId } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [displayMonth, setDisplayMonth] = useState('');
    const [isLoading, setIsLoading] = useState(true);
  
    const fetchData = useCallback(async () => {
      if (!userId) return;
  
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange(selectedMonth, isCurrentMonth);
        
        const [{ data: mainData }, { data: uploadData }] = await Promise.all([
          supabase
            .from(type === 'supplier' ? 'acc_portal_suppliers' : 'acc_portal_banks')
            .select('*')
            .eq('userid', userId)
            .order('id', { ascending: true }),
          supabase
            .from('acc_portal_monthly_files_upload')
            .select('*')
            .eq('userid', userId)
            .eq('document_type', type === 'supplier' ? 'supplier statement' : 'bank statement')
            .gte('docs_date_range', startDate.toISOString())
            .lte('docs_date_range_end', endDate.toISOString())
        ]);
  
        if (!mainData || !uploadData) throw new Error('Failed to fetch data');
  
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
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });

    if (isCurrentMonth) {
      setDisplayMonth(`${previousMonth} uploading in ${currentMonth}`);
    } else if (selectedMonth) {
      setDisplayMonth(selectedMonth);
    }

    fetchData();
  }, [fetchData, isCurrentMonth, selectedMonth]);

  const columns = type === 'supplier' ? supplierColumns : bankColumns;

  return (
    <main className="flex flex-col justify-start w-full">
      <p className="text-lg mb-4">
        {type === 'supplier' ? 'Supplier' : 'Bank'} Statements for <span className="font-semibold text-blue-700">{displayMonth}</span>
      </p>
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
    </main>
  );
}

export function PreviousMonths({ type }: { type: 'supplier' | 'bank' }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = useMemo(() => {
    const result = [];
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1); // Start from previous month
    for (let i = 0; i < 12; i++) {
      result.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    return result;
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-44 p-4 border-b md:border-b-0 md:border-r">
        <h2 className="text-md font-bold mb-4 text-center">Previous Months</h2>
        <div className="space-y-2">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              onClick={() => setSelectedMonth(month)}
              className="w-full"
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full  p-4">
        {selectedMonth && (
          <CombinedMonthlyDocs 
            type={type}
            selectedMonth={selectedMonth}
            isCurrentMonth={false}
          />
        )}
      </div>
    </div>
  );
}