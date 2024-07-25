//@ts-nocheck
//@ts-ignore
"use client"
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supplierColumns } from "./columns";
import { DataTable } from "./data-table";

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all suppliers
      const { data: supplierData, error: supplierError } = await supabase
        .from('acc_portal_suppliers')
        .select(`
          id,
          name,
          pin,
          contact_name,
          contact_mobile,
          contact_email,
          status,
          startdate
        `)
        .order('id', { ascending: true });

      if (supplierError) throw new Error(`Error fetching supplier data: ${supplierError.message}`);

      console.log('Supplier Data:', supplierData);

      // Fetch upload data
      const { data: uploadData, error: uploadError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select(`
          *,
          company:acc_portal_company(name)
        `)
        .order('upload_date', { ascending: false });

      if (uploadError) throw new Error(`Error fetching upload data: ${uploadError.message}`);

      console.log('Upload Data:', uploadData);

      // Create a map of upload data keyed by supplier_id
      const uploadMap = uploadData.reduce((map, item) => {
        if (!map[item.supplier_id]) {
          map[item.supplier_id] = [];
        }
        map[item.supplier_id].push(item);
        return map;
      }, {});

      // Transform data
      const transformedData = supplierData.map(supplier => {
        const uploads = uploadMap[supplier.id] || [];
        const latestUpload = uploads[0] || {}; // Get the latest upload or an empty object

        return {
          suppSeq: supplier.id,
          suppName: supplier.name,
          suppStatus: supplier.status ? 'Active' : 'Inactive',
          suppStartDate: supplier.startdate,
          verifiedByBCLAccManager: latestUpload.is_verified || false,
          supplierDetailsByFinance: true, // Assuming this is always true
          uploadStatus: latestUpload.document_type || 'Not Uploaded',
          uploadDate: latestUpload.upload_date || null,
          supplierWefDate: latestUpload.docs_date_range || null,
          supplierUntilDate: null, // This field is not present in the original data
          stateRange: latestUpload.is_verified ? "Verified" : "Not Verified",
          verifyByBCL: latestUpload.is_verified || false,
          suppPIN: supplier.pin,
          suppContactName: supplier.contact_name,
          suppContactMobile: supplier.contact_mobile,
          suppContactEmail: supplier.contact_email,
          closingBalance: latestUpload.closing_balance || null,
          closingBalanceVerify: latestUpload.balance_verification ? "true" : "false",
        };
      });

      console.log('Transformed Data:', transformedData);
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
  
  

  const handleFileUpload = async (event, supplierId, documentType) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const year = new Date().getFullYear();
    const month = new Date().toLocaleString('default', { month: 'long' });
  
    let path = '';
    if (documentType === 'supplier statement') {
      path = `suppliers/${supplierId}/${year}/${month}/${file.name}`;
    } else if (documentType === 'bank statement') {
      path = `banks/${supplierId}/${year}/${month}/${file.name}`;
    } else {
      path = `others/${year}/${month}/${file.name}`;
    }
  
    try {
      const { data, error } = await supabase.storage
        .from('monthly-documents')
        .upload(path, file);
  
      if (error) {
        throw new Error(`Error uploading file: ${error.message}`);
      }
  
      // Insert record into database
      const { data: insertData, error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          supplier_id: supplierId,
          document_type: documentType,
          upload_date: new Date().toISOString(),
          docs_date_range: new Date().toISOString().split('T')[0],
        });
  
      if (insertError) {
        throw new Error(`Error updating database: ${insertError.message}`);
      }
  
      fetchData();
    } catch (error) {
      console.error(error.message);
    }
  };
  

  return (
    <main className="flex flex-col justify-start w-5/6">
      <h1 className="text-2xl font-bold my-4">Monthly Documents</h1>
      <p className="text-lg mb-4">
        <span className="font-semibold text-blue-700">{currentMonth}</span> Supplier Statements
      </p>
      <div className="">
        <div className="inline-block min-w-full align-middle">
          <div className=" border-b border-gray-200 shadow sm:rounded-lg">
            <DataTable 
              columns={supplierColumns} 
              data={data} 
              setData={setData} 
              handleFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </main>
  );
}  