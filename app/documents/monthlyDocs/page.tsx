//@ts-nocheck
//@ts-ignore
"use client"
import { useEffect, useState } from 'react';
import { supplierColumns } from "./columns";
import { DataTable } from "./data-table";

// const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
// const supabaseAnonKey =
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';

// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// async function fetchData() {
//     const { data, error } = await supabase
//         .from('companies')
//         .select('*')
//         .order('company_id', { ascending: true });

//     if (error) {
//         console.error('Error fetching data from Supabase:', error.message);
//         return [];
//     }

//     const transformedData = data?.map((item: any) => ({
//         CompanyId: item.company_id,
//         companyName: item.name,
//         tax: item.tax_submission_checklist,
//         docSub: item.monthly_docs_submission_by_clients,
//         docSubSum: item.monthly_summaries_submission_by_clients,
//         downloads: item.monthly_downloads_by_bcl,
//         reports: item.monthly_report_sending_to_clients,
//     })) || [];

//     return transformedData;
// }

// Mock data array
const mockData = [
    {
      suppSeq: "SUP-001",
      suppName: "Supp 1",
      suppStatus: "Active",
      suppStartDate: "01/01/2024",
      verifiedByBCLAccManager: false,
      supplierDetailsByFinance: true,
      uploadStatus: "false",
      uploadDate: "01/08/2024",
      supplierWefDate: "01/01/2024",
      supplierUntilDate: "31/05/2024",
      stateRange: "Verified",
      verifyByBCL: true,
      suppPIN: "PIN001",
      suppContactName: "John Doe",
      suppContactMobile: "1234567890",
      suppContactEmail: "john@supp1.com",
      closingBalance: "209000",
      closingBalanceVerify:"true",
    },
    {
      suppSeq: "SUP-002",
      suppName: "Supp 2",
      suppStatus: "Active",
      suppStartDate: "15/01/2024",
      verifiedByBCLAccManager: true,
      supplierDetailsByFinance: true,
      uploadStatus: "Blank",
      uploadDate: "02/08/2024",
      supplierWefDate: "15/01/2024",
      supplierUntilDate: "14/07/2024",
      stateRange: "Verified",
      verifyByBCL: true,
      suppPIN: "PIN002",
      suppContactName: "Jane Smith",
      suppContactMobile: "9876543210",
      suppContactEmail: "jane@supp2.com",
      closingBalance: "20000",
      closingBalanceVerify:"true",
    },
    // Add more mock data entries here...
  ];

  export default function MonthlyDocs() {
    const [data, setData] = useState([]);
    const [currentDate, setCurrentDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState('');
  
    useEffect(() => {
      const date = new Date();
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      setCurrentDate(formattedDate);
  
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      setCurrentMonth(month);
  
      // Use mock data instead of fetching from Supabase
      setData(mockData);
    }, []);
  
    return (
      <main className="flex flex-col justify-start p-6 w-full">
        <p className='font-bold text-md py-2 mb-1 underline rounded-md'><span className='font-bold text-md py-2 mb-1 text-blue-700'>{currentMonth} </span>Supplier Statements</p>
        <p ></p>
        <DataTable columns={supplierColumns} data={data} setData={setData} />
      </main>
    );
  }
