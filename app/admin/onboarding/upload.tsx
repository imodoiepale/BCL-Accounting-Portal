// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { formFields } from "../overallview/formfields";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface UploadProps {
  onComplete: (data: any) => void;
  companyData: {
    name: string;
    username: string;
    userId: string;
  };
}

type ComplianceStatus = {
  name: string;
  status: 'to_be_registered' | 'missing' | 'has_details';
  count?: number;
};

const stages = [
  { id: 1, name: "Company Information" },
  { id: 2, name: "Director's Information" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Banks" },
  { id: 5, name: "Employee Details" }
];

const complianceItems = [
  { name: 'KRA', requiresCount: false },
  { name: 'NSSF', requiresCount: false },
  { name: 'NHIF', requiresCount: false },
  { name: 'Ecitizen', requiresCount: false },
  { name: 'NITA', requiresCount: false },
  { name: 'Housing Levy', requiresCount: false },
  { name: 'Standard Levy', requiresCount: false },
  { name: 'Tourism Levy', requiresCount: false },
  { name: 'Tourism Fund', requiresCount: false },
  { name: 'VAT', requiresCount: false },
  { name: 'Income Tax', requiresCount: false },
  { name: 'NEA', requiresCount: false },
  { name: 'PAYE', requiresCount: false },
  { name: 'MRI', requiresCount: false },
  { name: 'TOT', requiresCount: false },
  { name: 'TIMS', requiresCount: false },
  { name: 'Sheria', requiresCount: false },
  { name: "Director's Information", requiresCount: true },
  { name: 'Suppliers', requiresCount: true },
  { name: 'Banks', requiresCount: true },
  { name: 'Employee', requiresCount: true }
];

export default function Upload({ onComplete, companyData }: UploadProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);

  const getFormFields = () => {
    const fields = (() => {
      switch (currentStage) {
        case 1: return formFields.companyDetails.fields;
        case 2: return formFields.directorDetails.fields;
        case 3: return formFields.supplierDetails.fields;
        case 4: return formFields.bankDetails.fields;
        case 5: return formFields.employeeDetails.fields;
        default: return [];
      }
    })();

    const relevantStatus = complianceStatus.find(status =>
      status.name === stages[currentStage - 1].name
    );

    if (relevantStatus?.count && relevantStatus.count > 1) {
      return {
        fields: generateFieldsBasedOnCount(fields, relevantStatus.count),
        defaultValues: generateDefaultValues(fields, relevantStatus.count)
      };
    }

    return {
      fields,
      defaultValues: fields.reduce((acc, field) => {
        acc[field.name] = '';
        return acc;
      }, {} as Record<string, string>)
    };
  };

  const generateFieldsBasedOnCount = (baseFields: any[], count: number) => {
    return Array.from({ length: count }).flatMap((_, i) =>
      baseFields.map(field => ({
        ...field,
        name: `${field.name}_${i + 1}`,
        label: `${field.label} ${i + 1}`
      }))
    );
  };

  const generateDefaultValues = (fields: any[], count: number) => {
    return Array.from({ length: count }).reduce((acc, _, i) => {
      fields.forEach(field => {
        acc[`${field.name}_${i + 1}`] = '';
      });
      return acc;
    }, {} as Record<string, string>);
  };

  const { fields, defaultValues } = getFormFields();
  const methods = useForm({
    defaultValues: {
      ...defaultValues,
      company_name: companyData.company_name || companyData.name,
      ...formData
    }
  });
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!['csv', 'xlsx'].includes(fileExtension || '')) {
      toast.error('Please upload a .csv or .xlsx file');
      return;
    }

    try {
      setFile(file);
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const content = event.target?.result;
          const parsedData = fileExtension === 'csv' 
            ? parseCSV(content as string)
            : parseXLSX(content);

          if (parsedData.length === 0) {
            toast.error(`No valid data found in ${fileExtension.toUpperCase()}`);
            return;
          }

          setData({ ...data, [currentStage]: parsedData });
          toast.success(`${fileExtension.toUpperCase()} data loaded successfully`);
        } catch (error) {
          console.error('Error processing file content:', error);
          toast.error('Error processing file content');
        }
      };

      fileReader.onerror = () => toast.error('Error reading file');
      fileExtension === 'csv' 
        ? fileReader.readAsText(file)
        : fileReader.readAsBinaryString(file);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };

  const parseCSV = (content: string) => {
    const rows = content.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1)
      .map(row => {
        const values = row.split(',');
        const rowData = headers.reduce((acc, header, index) => {
          const value = values[index]?.trim();
          if (value) acc[header.trim()] = value;
          return acc;
        }, {} as Record<string, string>);
        return { ...rowData, userid: companyData.userId };
      })
      .filter(row => Object.keys(row).length > 1);
  };

  const parseXLSX = (content: any) => {
    const workbook = XLSX.read(content, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData.map(row => ({
      ...row,
      userid: companyData.userId
    }));
  };

  const handleManualEntry = async (formData: any) => {
    try {
      if (!formData) {
        toast.error('Form data is required');
        return false;
    }

      const status = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status;
      const baseData = { status, userid: companyData.userId };
      const cleanedData = await processFormData(formData, currentStage, baseData);

      console.log('Manual Entry Input Data:', formData);
      console.log('Cleaned Data:', cleanedData);

      if (!cleanedData) {
        toast.error('Please fill in at least one field');
        return false;
      }

      setData(prev => ({
        ...prev,
        [currentStage]: Array.isArray(prev[currentStage])
          ? [...prev[currentStage], cleanedData]
          : [cleanedData]
      }));

      setFormData(cleanedData);
      setIsDialogOpen(false);
      toast.success('Data added successfully');
      return true;

    } catch (error) {
      console.error('Error adding data:', error);
      toast.error('Failed to add data. Please try again.');
      return false;
    }
  };

// Helper functions for data sanitization and validation

const sanitizeData = (data: any) => {
  console.log('Data before sanitization:', data);
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '') {
      // Handle number fields
      if (
        key.includes('_count') || 
        key.includes('_amount') || 
        key === 'shares_held' || 
        key === 'employees' || 
        key === 'dependents' ||
        key === 'annual_income'
      ) {
        sanitized[key] = null;
      }
      // Handle date fields
      else if (
        key.includes('_date') ||
        key === 'date_established' ||
        key === 'date_of_birth'
      ) {
        sanitized[key] = null;
      }
      // Handle boolean fields
      else if (
        key.includes('_status') ||
        key.includes('_verified')
      ) {
        sanitized[key] = false;
      }
      // Leave other empty strings as is
    }
    // Convert string numbers to actual numbers
    else if (typeof sanitized[key] === 'string') {
      if (key.includes('_amount') || key === 'annual_income') {
        const num = parseFloat(sanitized[key]);
        sanitized[key] = isNaN(num) ? null : num;
      }
      else if (
        key.includes('_count') || 
        key === 'shares_held' || 
        key === 'employees' || 
        key === 'dependents'
      ) {
        const num = parseInt(sanitized[key]);
        sanitized[key] = isNaN(num) ? null : num;
      }
    }
    // Handle nested objects
    else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  console.log('Data after sanitization:', sanitized);
  return sanitized;
};

const processFormData = async (formData: any, stage: number, baseData: any) => {
  console.log('Processing form data for stage:', stage);
  console.log('Form data input:', formData);
  console.log('Base data:', baseData);

  const currentStatus = complianceStatus.find(s => s.name === stages[stage - 1].name)?.status || 'missing';
  const stageMapping = {
    1: processCompanyData,
    2: processDirectorData,
    3: processSupplierData,
    4: processBankData,
    5: processEmployeeData
  };

  const processor = stageMapping[stage as keyof typeof stageMapping];
  if (!processor) return null;

  const processedData = processor(formData, { ...baseData, status: currentStatus });
  console.log('Processed form data:', processedData);
  return Object.values(processedData).some(value => 
    value !== '' && value !== null && value !== undefined
  ) ? sanitizeData(processedData) : null;
};
  
const processCompanyData = (formData: any, baseData: any) => {
  console.log('Processing company data:', formData);
  const processed = {
    ...baseData,
    company_type: formData.company_type || '',
    description: formData.description || '',
    registration_number: formData.registration_number || '',
    date_established: formData.date_established || null,
    kra_pin_number: formData.kra_pin || '',
    industry: formData.industry || '',
    employees: formData.employees || null,
    annual_revenue: formData.annual_revenue || null,
    fiscal_year: formData.fiscal_year || '',
    website: formData.website || '',
    email: formData.email || '',
    phone: formData.phone || '',
    street: formData.street || '',
    city: formData.city || '',
    postal_code: formData.postal_code || '',
    country: formData.country || ''
  };
  console.log('Processed company data:', processed);
  return processed;
};

const processDirectorData = (formData: any, baseData: any) => {
  const directorData = {
    ...baseData,
    company_id: formData.company_id || null,
    first_name: formData.first_name_1 || formData['First Name'] || '',
    middle_name: formData.middle_name_1 || formData['Middle Name'] || '',
    last_name: formData.last_name_1 || formData['Last Name'] || '',
    full_name: formData.full_name_1 || formData['Full Name'] || '',
    gender: formData.gender_1 || formData['Gender'] || '',
    nationality: formData.nationality_1 || formData['Nationality'] || '',
    date_of_birth: formData.date_of_birth_1 || formData['Date of Birth'] || null,
    id_number: formData.id_number_1 || formData['ID Number'] || '',
    tax_pin: formData.tax_pin_1 || formData['Tax PIN'] || '',
    mobile_number: formData.mobile_number_1 || formData['Mobile Number'] || '',
    email_address: formData.email_address_1 || formData['Email Address'] || '',
    job_position: formData.job_position_1 || formData['Job Position'] || '',
    shares_held: formData.shares_held_1 ? parseInt(formData.shares_held_1) : null
  };
  
  // Filter out empty fields
  return Object.fromEntries(
    Object.entries(directorData).filter(([_, value]) => value !== '')
  );
};

const processBankData = (formData: any, baseData: any) => {
  const bankData = {
    
    status: baseData.status, // Keep as text
    bank_name: formData.bank_name_1 || formData['Bank Name'] || '',
    account_number: formData.account_number_1 || formData['Account Number'] || '',
    currency: formData.currency_1 || formData['Currency'] || '',
    branch: formData.branch_1 || formData['Branch'] || '',
    relationship_manager_name: formData.relationship_manager_name_1 || formData['RM Name'] || '',
    relationship_manager_mobile: formData.relationship_manager_mobile_1 || formData['RM Mobile'] || '',
    relationship_manager_email: formData.relationship_manager_email_1 || formData['RM Email'] || '',
    bank_startdate: formData.bank_startdate_1 || null,
    bank_status: baseData.status === 'has_details', // Convert to boolean
    bank_verified: false,
    userid: baseData.userid,
  };
  
  // Filter out empty fields
  return Object.fromEntries(
    Object.entries(bankData).filter(([_, value]) => value !== '')
  );
};

const processSupplierData = (formData: any, baseData: any) => {
  // For file upload
  if (formData['Supplier Name']) {
    return {
      userid: baseData.userid,
      supplier_name: formData['Supplier Name'],
      supplier_type: formData['Supplier Type'],
      trading_type: formData['Trading Type'],
      pin: formData['PIN'],
      id_number: formData['ID Number'],
      mobile: formData['Mobile'],
      email: formData['Email'],
      status: baseData.status
    };
  }

  // For form submission
  const supplierData = {
    userid: baseData.userid,
    supplier_name: formData.supplier_name_1 || formData['data.supplierName_1'] || '',
    supplier_type: formData.supplier_type_1 || formData['data.supplierType_1'] || '',
    trading_type: formData.trading_type_1 || formData['data.tradingType_1'] || '',
    pin: formData.pin_1 || formData['data.pin_1'] || '',
    id_number: formData.id_number_1 || formData['data.idNumber_1'] || '',
    mobile: formData.mobile_1 || formData['data.mobile_1'] || '',
    email: formData.email_1 || formData['data.email_1'] || '',
    status: baseData.status
  };

  // Filter out empty values
  return Object.fromEntries(
    Object.entries(supplierData).filter(([_, value]) => value !== '')
  );
};

const processEmployeeData = (formData: any, baseData: any) => {
  return {
    employee_name: formData.employee_name_1 || '', // Add _1 suffix for form fields
    id_number: formData.id_number_1 || '',
    employee_kra_pin: formData.employee_kra_pin_1 || '',
    employee_email: formData.employee_email_1 || '',
    employee_mobile: formData.employee_mobile_1 || '',
    employee_nhif: formData.employee_nhif_1 || '',
    employee_nssf: formData.employee_nssf_1 || '',
    employee_startdate: formData.employee_startdate_1 || null,
    employee_enddate: formData.employee_enddate_1 || null,
    employee_status: baseData.status === 'has_details',
    employee_verified: false,
    userid: baseData.userid,
    status: baseData.status
  };
};
  
const submitAllData = async () => {
  const { userId, name } = companyData;
  try {
    setLoading(true);
    let companyId;

    console.log('Starting data submission process');
    console.log('Company Data to submit:', data[1]);

    // Submit Company Data
    const companyStatus = complianceStatus.find(s => s.name === "Company Information")?.status || 'missing';
    if (data[1]?.length > 0) {
      const sanitizedCompanyData = sanitizeData({
        ...data[1][0],
        company_name: name,
        status: companyStatus,
        userid: userId
      });

      console.log('Submitting company data:', sanitizedCompanyData);

      const { data: insertedCompany, error: companyError } = await supabase
        .from('acc_portal_company')
        .insert(sanitizedCompanyData)
        .select('id')
        .single();

      if (companyError) throw new Error(`Failed to insert company: ${companyError.message}`);
      companyId = insertedCompany?.id;
      console.log('Company data submitted successfully, ID:', companyId);

      // Submit Statutory Data if applicable
      if (companyStatus === 'has_details') {
        await submitStatutoryData(userId, name, sanitizedCompanyData);
      }
    }

    // Submit Directors
    console.log('Director Data to submit:', data[2]);
    const directorStatus = complianceStatus.find(s => s.name === "Director's Information")?.status || 'missing';
    if (data[2]?.length > 0) {
      const sanitizedDirectorData = data[2].map(director => 
        sanitizeData({
          ...director,
          company_id: companyId,
          userid: userId,
          status: directorStatus
        })
      );

      console.log('Submitting director data:', sanitizedDirectorData);
      const { error: directorError } = await supabase
        .from('acc_portal_directors')
        .insert(sanitizedDirectorData);

      if (directorError) throw directorError;
      console.log('Director data submitted successfully');
    }

    // Submit Suppliers
    console.log('Supplier Data to submit:', data[3]);
    const supplierStatus = complianceStatus.find(s => s.name === "Suppliers")?.status || 'missing';
    if (data[3]?.length > 0) {
      const sanitizedSupplierData = data[3]
        .map(supplier => {
          const processed = processSupplierData(supplier, {
            status: supplierStatus,
            userid: userId
          });
          return processed ? sanitizeData(processed) : null;
        })
        .filter(supplier => supplier !== null && supplier.data && Object.keys(supplier.data).length > 0);
    
      if (sanitizedSupplierData.length > 0) {
        console.log('Submitting supplier data:', sanitizedSupplierData);
        const { error: supplierError } = await supabase
          .from('acc_portal_supplierss')
          .insert(sanitizedSupplierData);
    
        if (supplierError) throw supplierError;
        console.log('Supplier data submitted successfully');
      }
    }
    // Submit Banks
    console.log('Bank Data to submit:', data[4]);
    const bankStatus = complianceStatus.find(s => s.name === "Banks")?.status || 'missing';
    if (data[4]?.length > 0) {
      const sanitizedBankData = data[4].map(bank => 
        sanitizeData({
          ...bank,
          status: bankStatus,
          userid: userId,
        })
      );

      console.log('Submitting bank data:', sanitizedBankData);
      const { error: bankError } = await supabase
        .from('acc_portal_banks')
        .insert(sanitizedBankData);

      if (bankError) throw bankError;
      console.log('Bank data submitted successfully');
    }

    // Submit Employees
    console.log('Employee Data to submit:', data[5]);
    const employeeStatus = complianceStatus.find(s => s.name === "Employee")?.status || 'missing';
    if (data[5]?.length > 0) {
      const sanitizedEmployeeData = data[5].map(employee => 
        sanitizeData({
          ...employee,
          status: employeeStatus,
          userid: userId,
          employee_status: employeeStatus === 'has_details'
        })
      );

      const uniqueEmployees = getUniqueEmployees(sanitizedEmployeeData);
      console.log('Submitting employee data:', uniqueEmployees);

      const { error: employeeError } = await supabase
        .from('acc_portal_employees')
        .insert(uniqueEmployees);

      if (employeeError) throw employeeError;
      console.log('Employee data submitted successfully');
    }

    console.log('All data submitted successfully');
    toast.success('All data submitted successfully!');
    onComplete(data);
    return true;

  } catch (error: any) {
    console.error('Error in submission process:', error);
    toast.error(`Failed to submit data: ${error.message}`);
    return false;
  } finally {
    setLoading(false);
  }
};

const submitDirectorsData = async (userId: string, directorData: any[], status: string) => {
  if (!directorData?.length) return;

  console.log('Processing directors data for submission:', directorData);
  const sanitizedData = directorData.map(director => ({
    ...director,
    userid: userId,
    status: status,
    shares_held: parseInt(director.shares_held) || null,
    dependents: parseInt(director.dependents) || null,
    annual_income: parseFloat(director.annual_income) || null
  }));

  console.log('Submitting sanitized director data:', sanitizedData);
  const { error: directorError } = await supabase
    .from('acc_portal_directors')
    .insert(sanitizedData);

  if (directorError) throw directorError;
  console.log('Directors data submitted successfully');
};

  const hasValidStatus = (name: string, status: string) => 
    complianceStatus.find(s => s.name === name)?.status === status;

  const getUniqueEmployees = (employees: any[]) => 
    employees.filter((employee, index, self) =>
      index === self.findIndex((e) => e.employee_email === employee.employee_email)
    );
    
  const submitStatutoryData = async (userId: string, name: string, data: any) => {
    console.log('Processing statutory data:', data);
    const statutoryPromises = [];

    complianceStatus.forEach(status => {
      if (status.status === 'has_details') {
        switch(status.name) {
          case 'KRA':
            if (data.kra_pin) {
              statutoryPromises.push(submitKRAData(userId, name, data));
            }
            break;
          case 'NSSF':
            if (data.nssf_code) {
              statutoryPromises.push(submitNSSFData(userId, name, data));
            }
            break;
          // Add other statutory submissions here
        }
      }
    });

    if (statutoryPromises.length > 0) {
      const results = await Promise.allSettled(statutoryPromises);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some statutory submissions failed:', failed);
        throw new Error('Failed to submit some statutory data');
      }
    }
  };

  const submitKRAData = (userId: string, name: string, data: any) =>
    supabase.from('PasswordChecker').insert({
      company_name: name,
      kra_pin: data.kra_pin,
      kra_password: data.kra_password,
      status: 'pending',
      userid: userId
    });

  const submitNSSFData = (userId: string, name: string, data: any) =>
    supabase.from('nssf_companies').insert({
      name: name,
      identifier: data.nssf_user,
      nssf_password: data.nssf_password,
      nssf_code: data.nssf_code,
      userid: userId
    });

    const handleVerification = async () => {
    if (currentStage === 5) {
      await submitAllData();
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleTemplateDownload = () => {
    const status = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status;
    
    if (status !== 'has_details') {
      toast.error('Template is only available for items with details');
      return;
    }

    const currentFields = getFormFields().fields;
    const templateData = [currentFields.map(field => field.label)];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    
    const fileName = `${stages[currentStage - 1].name.replace(/\s+/g, '_')}_Template.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const renderDataTable = () => {
    if (!data[currentStage] || !Array.isArray(data[currentStage]) || data[currentStage].length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for this stage
        </div>
      );
    }
  
    // Function to extract supplier data fields
    const getSupplierData = (row: any) => {
      if (row.data) {
        return {
          status: row.status,
          supplierName: row.data.supplierName || row.data.supplierName_1 || '-',
          supplierType: row.data.supplierType || row.data.supplierType_1 || '-',
          tradingType: row.data.tradingType || row.data.tradingType_1 || '-',
          pin: row.data.pin || row.data.pin_1 || '-',
          idNumber: row.data.idNumber || row.data.idNumber_1 || '-',
          mobile: row.data.mobile || row.data.mobile_1 || '-',
          email: row.data.email || row.data.email_1 || '-'
        };
      }
      return {
        status: row.status || '-',
        supplierName: row['Supplier Name'] || '-',
        supplierType: row['Supplier Type'] || '-',
        tradingType: row['Trading Type'] || '-',
        pin: row['PIN'] || '-',
        idNumber: row['ID Number'] || '-',
        mobile: row['Mobile'] || '-',
        email: row['Email'] || '-'
      };
    };
  
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {currentStage === 3 ? (
                  <>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Supplier Type</TableHead>
                    <TableHead>Trading Type</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                  </>
                ) : (
                  Object.keys(data[currentStage][0])
                    .filter(key => !['userid', 'created_at', 'updated_at'].includes(key))
                    .map(header => (
                      <TableHead key={header} className="font-semibold text-gray-700">
                        {header}
                      </TableHead>
                    ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data[currentStage].map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                  {currentStage === 3 ? (
                    <>
                      {Object.values(getSupplierData(row)).map((value, i) => (
                        <TableCell key={i}>{value}</TableCell>
                      ))}
                    </>
                  ) : (
                    Object.entries(row)
                      .filter(([key]) => !['userid', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value], i) => (
                        <TableCell key={i} className="py-3">
                          {value ? (typeof value === 'object' ? JSON.stringify(value) : value) : '-'}
                        </TableCell>
                      ))
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-gray-600">Company:</span>
                <span>{companyData.company_name || companyData.name}</span>
              </h1>
              <div className="text-sm text-gray-500">
                ID: {companyData.userId}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex flex-col items-center w-1/5 relative group transition-all duration-300 
                  ${stage.id === currentStage
                    ? "text-blue-600"
                    : stage.id < currentStage
                    ? "text-blue-400"
                    : "text-gray-400"}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 
                    transform transition-all duration-300 hover:scale-110 
                    ${stage.id === currentStage
                      ? "bg-blue-600 text-white shadow-lg"
                      : stage.id < currentStage
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200"}`}
                >
                  {stage.id}
                </div>
                <span className="text-sm font-medium">{stage.name}</span>
                {stage.id < stages.length && (
                  <div
                    className={`absolute top-6 left-[60%] w-full h-[3px] transition-all duration-300 
                      ${stage.id < currentStage ? "bg-blue-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Stage {currentStage}: {stages[currentStage - 1].name}
            </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Information
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[1200px] w-[100vw] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add {stages[currentStage - 1].name}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="checklist">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="checklist">Set Status</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="upload">File Upload</TabsTrigger>
                  </TabsList>

                  <TabsContent value="checklist">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <div className="p-6 space-y-6">
                        {/* Conditionally render checklist based on current stage */}
                        {currentStage === 1 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Statutory Compliance Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {complianceItems
                                .filter(item => !item.requiresCount)
                                .map((item) => (
                                  <div key={item.name} className="space-y-2 border p-4 rounded-lg">
                                    <Label className="text-base">{item.name}</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        setComplianceStatus(prev => ([
                                          ...prev.filter(p => p.name !== item.name),
                                          { name: item.name, status: value as ComplianceStatus['status'] }
                                        ]))
                                      }
                                      value={complianceStatus.find(s => s.name === item.name)?.status}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="to_be_registered">To Be Registered</SelectItem>
                                        <SelectItem value="missing">Missing</SelectItem>
                                        <SelectItem value="has_details">Has Details</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* For stages with count requirements */}
                        {currentStage >= 2 && currentStage <= 5 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg">
                              {stages[currentStage - 1].name} Details
                            </h3>
                            <div className="border p-4 rounded-lg space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  onValueChange={(value) =>
                                    setComplianceStatus(prev => ([
                                      ...prev.filter(p => p.name !== stages[currentStage - 1].name),
                                      {
                                        name: stages[currentStage - 1].name,
                                        status: value as ComplianceStatus['status']
                                      }
                                    ]))
                                  }
                                  value={complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="to_be_registered">To Be Registered</SelectItem>
                                    <SelectItem value="missing">Missing</SelectItem>
                                    <SelectItem value="has_details">Has Details</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Only show count if status is 'has_details' */}
                              {complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'has_details' && (
                                <div className="space-y-2">
                                  <Label>Number of {stages[currentStage - 1].name}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.count || 1}
                                    onChange={(e) => {
                                      const count = parseInt(e.target.value) || 1;
                                      setComplianceStatus(prev => ([
                                        ...prev.filter(p => p.name !== stages[currentStage - 1].name),
                                        {
                                          name: stages[currentStage - 1].name,
                                          status: prev.find(p => p.name === stages[currentStage - 1].name)?.status || 'has_details',
                                          count
                                        }
                                      ]));
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <Button
                          className="w-full mt-4"
                          onClick={() => {
                            // Get all tab triggers
                            const tabTriggers = document.querySelectorAll('[role="tab"]');
                            // Find the manual entry tab
                            const manualTab = Array.from(tabTriggers).find(
                              trigger => trigger.getAttribute('value') === 'manual'
                            );
                            if (manualTab instanceof HTMLElement) {
                              manualTab.click();
                            }
                          }}
                        >
                          Continue to Data Entry
                        </Button>
                      </div>
                    </ScrollArea>
                  </TabsContent>


                  <TabsContent value="manual">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-6 p-6">
                          {currentStage === 1 ? (
                            // Company Information Stage
                            <>
                              {/* Always show General Information */}
                              <div className="space-y-6">
                                <div className="col-span-2">
                                  <FormField
                                    control={methods.control}
                                    name="company_name"
                                    render={({ field }) => (
                                      <FormItem className="col-span-2">
                                        <FormLabel className="text-sm font-semibold text-gray-700">
                                          Company Name
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            value={companyData.name}
                                            disabled
                                            className="w-full bg-gray-50"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* General Information Section */}
                                <div className="col-span-2 space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                    General Information
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    {fields
                                      .filter(field => !field.category)
                                      .map((field) => (
                                        <FormField
                                          key={field.name}
                                          control={methods.control}
                                          name={field.name}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                {field.type === 'select' ? (
                                                  <Select
                                                    onValueChange={formField.onChange}
                                                    value={formField.value || ''}
                                                  >
                                                    <SelectTrigger className="w-full bg-white">
                                                      <SelectValue placeholder={`Select ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {field.options?.map(option => (
                                                        <SelectItem key={option} value={option}>
                                                          {option}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                ) : (
                                                  <Input
                                                    {...formField}
                                                    type={field.type}
                                                    placeholder={field.label}
                                                    className="w-full bg-white"
                                                  />
                                                )}
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                  </div>
                                </div>

                                {/* Render other categories based on compliance status */}
                                {Object.entries(
                                  fields.reduce((groups, field) => {
                                    if (field.category) {
                                      const category = field.category;
                                      const item = complianceItems.find(item =>
                                        item.name === category.replace(' Details', '')
                                      );

                                      if (!item || complianceStatus.find(s =>
                                        s.name === item.name && s.status === 'has_details'
                                      )) {
                                        if (!groups[category]) {
                                          groups[category] = [];
                                        }
                                        groups[category].push(field);
                                      }
                                    }
                                    return groups;
                                  }, {} as Record<string, any[]>)
                                ).map(([category, categoryFields]) => (
                                  <div key={category} className="col-span-2 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                      {category}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {categoryFields.map((field) => (
                                        <FormField
                                          key={field.name}
                                          control={methods.control}
                                          name={field.name}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className="col-span-1">
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  {...formField}
                                                  type={field.type}
                                                  placeholder={field.label}
                                                  className="w-full bg-white"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                                   {!complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status ? (
              <div className="p-6 text-center">
                <h3 className="text-lg font-medium">Please select a status first</h3>
              </div>
            ) : complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'missing' ? (
              <div className="p-6 text-center space-y-4">
                <h3 className="text-lg font-medium">This will be marked as missing</h3>
                <Button
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      [currentStage]: [{
                        status: 'missing',
                        userid: companyData.userId,
                        name: stages[currentStage - 1].name
                      }]
                    }));
                    setIsDialogOpen(false);
                    toast.success(`${stages[currentStage - 1].name} marked as missing`);
                  }}
                  className="w-full"
                >
                  Confirm Status
                </Button>
              </div>
            ) : complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'to_be_registered' ? (
              <div className="p-6 text-center space-y-4">
                <h3 className="text-lg font-medium">This will be marked for registration</h3>
                <Button
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      [currentStage]: [{
                        status: 'to_be_registered',
                        userid: companyData.userId,
                        name: stages[currentStage - 1].name
                      }]
                    }));
                    setIsDialogOpen(false);
                    toast.success(`${stages[currentStage - 1].name} marked for registration`);
                  }}
                  className="w-full"
                >
                  Confirm Status
                </Button>
              </div>
            ) : (
                                // Other stages - show multiple sections based on count
                                Array.from({
                                  length: complianceStatus.find(s =>
                                    s.name === stages[currentStage - 1].name
                                  )?.count || 1
                                }).map((_, index) => (
                                  <div key={index} className="space-y-6 border-b pb-6 last:border-0">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {stages[currentStage - 1].name} {index + 1}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {fields.map((field) => (
                                        <FormField
                                          key={`${field.name}_${index + 1}`}
                                          control={methods.control}
                                          name={`${field.name}_${index + 1}`}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                {field.type === 'select' ? (
                                                  <Select
                                                    onValueChange={formField.onChange}
                                                    value={formField.value || ''}
                                                  >
                                                    <SelectTrigger className="w-full bg-white">
                                                      <SelectValue placeholder={`Select ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {field.options?.map(option => (
                                                        <SelectItem key={option} value={option}>
                                                          {option}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                ) : (
                                                  <Input
                                                    {...formField}
                                                    type={field.type}
                                                    placeholder={field.label}
                                                    className="w-full bg-white"
                                                  />
                                                )}
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </>
                          )}

                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                            Add Entry
                          </Button>
                        </form>
                      </FormProvider>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="upload">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          onClick={handleTemplateDownload}
                          className="hover:bg-blue-50"
                        >
                          Download Template
                        </Button>
                      </div>
                      <Input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileUpload}
                        className="w-full"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Upload a CSV or Excel file with your data
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {renderDataTable()}
        </div>

        <div className="flex justify-end space-x-4">
          {currentStage > 1 && (
            <Button
              onClick={() => setCurrentStage(currentStage - 1)}
              variant="outline"
              className="hover:bg-gray-50 transition-colors"
            >
              Previous Stage
            </Button>
          )}
          <Button
            onClick={() => currentStage === 5 ? onComplete(data) : setCurrentStage(currentStage + 1)}
            variant="outline"
            className="hover:bg-gray-50 transition-colors"
          >
            Skip this stage
          </Button>
          <Button
            onClick={handleVerification}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 transition-colors min-w-[150px]"
          >
            {loading ? (
              <div className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Verifying...
              </div>
            ) : currentStage === 5 ? (
              "Complete All Stages"
            ) : (
              "Next Stage"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}