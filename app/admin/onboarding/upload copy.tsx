// components/UploadComponent.tsx
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
import { usePathname } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { formFields } from "../overallview/formfields";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface UploadProps {
  onComplete: (data: any) => void;
  companyData: {
    name: string;
    username: string;
    userId: string; // from onboarding
  };
}

const stages = [
  { id: 1, name: "Company Information" },
  { id: 2, name: "Director's Information" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Banks" },
  { id: 5, name: "Employee Details" }
];

interface ComplianceStatus {
  name: string;
  status: 'to_be_registered' | 'missing' | 'has_details';
  count?: number; // For directors, suppliers, banks
}

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
  const pathname = usePathname();
  const [formData, setFormData] = useState({});
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);


  const generateFieldsBasedOnCount = (baseFields: any[], count: number) => {
    const newFields = [];
    for (let i = 0; i < count; i++) {
      baseFields.forEach(field => {
        newFields.push({
          ...field,
          name: `${field.name}_${i + 1}`,
          label: `${field.label} ${i + 1}`
        });
      });
    }
    return newFields;
  };

  const getFormFields = () => {
    const fields = (() => {
      const baseFields = (() => {
        switch (currentStage) {
          case 1: return formFields.companyDetails.fields;
          case 2: return formFields.directorDetails.fields;
          case 3: return formFields.supplierDetails.fields;
          case 4: return formFields.bankDetails.fields;
          case 5: return formFields.employeeDetails.fields;
          default: return [];
        }
      })();

      // If we have a count for the current stage, generate multiple sets of fields
      const relevantStatus = complianceStatus.find(status =>
        status.name === stages[currentStage - 1].name
      );

      if (relevantStatus?.count && relevantStatus.count > 1) {
        return generateFieldsBasedOnCount(baseFields, relevantStatus.count);
      }

      return baseFields;
    })();

    // Initialize default values
    const defaultValues = fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);

    return { fields, defaultValues };
  };

  const { fields, defaultValues } = getFormFields();
  const methods = useForm({
    defaultValues: {
      ...defaultValues,
      company_name: companyData.company_name || companyData.name, // Try both properties
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

      if (fileExtension === 'csv') {
        const reader = new FileReader();

        reader.onload = async (event) => {
          const text = event.target?.result as string;
          const rows = text.split('\n');
          const headers = rows[0].split(',');

          const parsedData = rows.slice(1)
            .map(row => {
              const values = row.split(',');
              const rowData = headers.reduce((acc, header, index) => {
                const value = values[index]?.trim();
                if (value) acc[header.trim()] = value;
                return acc;
              }, {} as Record<string, string>);

              // Add userid to each row
              return { ...rowData, userid: companyData.userId };
            })
            .filter(row => Object.keys(row).length > 1); // Filter out empty rows

          if (parsedData.length === 0) {
            toast.error('No valid data found in CSV');
            return;
          }

          setData({ ...data, [currentStage]: parsedData });
          toast.success('CSV data loaded successfully');
        };

        reader.onerror = () => {
          toast.error('Error reading file');
        };

        reader.readAsText(file);
      } else {
        // Handle XLSX file
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const parsedData = jsonData.map(row => ({
            ...row,
            userid: companyData.userId
          }));

          if (parsedData.length === 0) {
            toast.error('No valid data found in XLSX');
            return;
          }

          setData({ ...data, [currentStage]: parsedData });
          toast.success('XLSX data loaded successfully');
        };

        reader.onerror = () => {
          toast.error('Error reading file');
        };

        reader.readAsBinaryString(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };

  const handleManualEntry = async (formData: any) => {
    try {
      let cleanedData;
      console.log('Current stage:', currentStage);
      console.log('Raw form data:', formData);

      const status = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status;

      const baseData = {
        status,
        userid: companyData.userId
      };

      switch (currentStage) {
        case 1: // Company Information
          cleanedData = {
            ...baseData,
            company_type: formData.company_type || '',
            description: formData.description || '',
            registration_number: formData.registration_number || '',
            date_established: formData.date_established || '',
            kra_pin: formData.kra_pin || '',
            industry: formData.industry || '',
            employees: formData.employees || '',
            annual_revenue: formData.annual_revenue || '',
            fiscal_year: formData.fiscal_year || '',
            website: formData.website || '',
            email: formData.email || '',
            phone: formData.phone || '',
            street: formData.street || '',
            city: formData.city || '',
            postal_code: formData.postal_code || '',
            country: formData.country || '',
            kra_password: formData.kra_password || '',
            nssf_code: formData.nssf_code || '',
            nssf_user: formData.nssf_user || '',
            nssf_password: formData.nssf_password || '',
            nhif_code: formData.nhif_code || '',
            nhif_password: formData.nhif_password || '',
            nhif_mobile: formData.nhif_mobile || '',
            nhif_email: formData.nhif_email || '',
            ecitizen_identifier: formData.ecitizen_identifier || '',
            ecitizen_password: formData.ecitizen_password || '',
            userid: companyData.userId
          };
          break;

        case 2: // Director's Information
          cleanedData = {
            ...baseData,
            first_name: formData.first_name || '',
            middle_name: formData.middle_name || '',
            last_name: formData.last_name || '',
            full_name: formData.full_name || '',
            gender: formData.gender || '',
            place_of_birth: formData.place_of_birth || '',
            country_of_birth: formData.country_of_birth || '',
            nationality: formData.nationality || '',
            date_of_birth: formData.date_of_birth || '',
            id_number: formData.id_number || '',
            tax_pin: formData.tax_pin || '',
            mobile_number: formData.mobile_number || '',
            email_address: formData.email_address || '',
            job_position: formData.job_position || '',
            shares_held: formData.shares_held || '',
            userid: companyData.userId
          };
          break;

        case 3: // Suppliers
          cleanedData = {
            userid: companyData.userId,
            data: {
              supplierName: formData['data.supplierName'] || '',
              supplierType: formData['data.supplierType'] || '',
              tradingType: formData['data.tradingType'] || '',
              pin: formData['data.pin'] || '',
              idNumber: formData['data.idNumber'] || '',
              mobile: formData['data.mobile'] || '',
              email: formData['data.email'] || ''
            }
          };
          break;

        case 4: // Banks
          cleanedData = {
            bank_name: formData.bank_name || '',
            account_number: formData.account_number || '',
            currency: formData.currency || '',
            branch: formData.branch || '',
            relationship_manager_name: formData.relationship_manager_name || '',
            relationship_manager_mobile: formData.relationship_manager_mobile || '',
            relationship_manager_email: formData.relationship_manager_email || '',
            bank_startdate: formData.bank_startdate || '',
            userid: companyData.userId,
            bank_status: false,
            bank_verified: false
          };
          break;

        case 5: // Employee Details
          cleanedData = {
            employee_name: formData.employee_name || '',
            id_number: formData.id_number || '',
            employee_kra_pin: formData.employee_kra_pin || '',
            employee_email: formData.employee_email || '',
            employee_mobile: formData.employee_mobile || '',
            employee_nhif: formData.employee_nhif || '',
            employee_nssf: formData.employee_nssf || '',
            employee_startdate: formData.employee_startdate || '',
            employee_enddate: formData.employee_enddate || '',
            userid: companyData.userId,
            employee_status: false,
            employee_verified: false
          };
          break;

        default:
          cleanedData = {};
      }

      // Validate that at least some data is present
      const hasData = Object.values(cleanedData).some(value =>
        value !== '' && value !== null && value !== undefined &&
        (typeof value === 'object' ? Object.values(value).some(v => v !== '') : true)
      );

      if (!hasData) {
        toast.error('Please fill in at least one field');
        return false;
      }

      console.log('Cleaned data before setting:', cleanedData);

      setData(prev => {
        const newData = {
          ...prev,
          [currentStage]: Array.isArray(prev[currentStage])
            ? [...prev[currentStage], cleanedData]
            : [cleanedData]
        };
        console.log('Updated data state:', newData);
        return newData;
      });

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

  const submitAllData = async () => {
    const { userId, name } = companyData;

    try {
      setLoading(true);
      console.log('Starting data submission process...');
      console.log('Current data state:', data);
      console.log('Compliance status:', complianceStatus);

      let companyId;

      // 1. Company Information
      if (data[1] && Array.isArray(data[1]) && data[1].length > 0) {
        console.log('Submitting company data:', data[1][0]);

        const companyData = {
          company_name: name,
          company_type: data[1][0]?.company_type || '',
          description: data[1][0]?.description || '',
          registration_number: data[1][0]?.registration_number || '',
          date_established: data[1][0]?.date_established || '',
          kra_pin_number: data[1][0]?.kra_pin || '',
          industry: data[1][0]?.industry || '',
          employees: data[1][0]?.employees || '',
          annual_revenue: data[1][0]?.annual_revenue || '',
          fiscal_year: data[1][0]?.fiscal_year || '',
          website: data[1][0]?.website || '',
          email: data[1][0]?.email || '',
          phone: data[1][0]?.phone || '',
          street: data[1][0]?.street || '',
          city: data[1][0]?.city || '',
          postal_code: data[1][0]?.postal_code || '',
          country: data[1][0]?.country || '',
          userid: userId
        };

        const { data: insertedCompany, error: companyError } = await supabase
          .from('acc_portal_company')
          .insert(companyData)
          .select('id')
          .single();

        if (companyError) {
          console.error('Error inserting company:', companyError);
          throw new Error(`Failed to insert company: ${companyError.message}`);
        }

        companyId = insertedCompany?.id;
        console.log('Successfully inserted company with ID:', companyId);

        // 2. Statutory Submissions
        const statutoryPromises = [];

        complianceStatus.forEach(status => {
          switch (status.name) {
            case 'KRA':
              if (status.status === 'has_details' && data[1][0].kra_pin) {
                statutoryPromises.push(
                  supabase.from('PasswordChecker').insert({
                    company_name: name,
                    kra_pin: data[1][0].kra_pin,
                    kra_password: data[1][0].kra_password,
                    status: 'pending',
                    userid: userId
                  })
                );
              }
              break;

            case 'NSSF':
              if (status.status === 'has_details' && data[1][0].nssf_code) {
                statutoryPromises.push(
                  supabase.from('nssf_companies').insert({
                    name: name,
                    identifier: data[1][0].nssf_user,
                    nssf_password: data[1][0].nssf_password,
                    nssf_code: data[1][0].nssf_code,
                    userid: userId
                  })
                );
              }
              break;

            case 'NHIF':
              if (status.status === 'has_details' && data[1][0].nhif_code) {
                statutoryPromises.push(
                  supabase.from('nhif_companies').insert({
                    name: name,
                    identifier: data[1][0].nhif_code,
                    nhif_password: data[1][0].nhif_password,
                    nhif_code: data[1][0].nhif_code,
                    nhif_mobile: data[1][0].nhif_mobile,
                    nhif_email: data[1][0].nhif_email,
                    userid: userId
                  })
                );
              }
              break;

            case 'Ecitizen':
              if (status.status === 'has_details' && data[1][0].ecitizen_identifier) {
                statutoryPromises.push(
                  supabase.from('ecitizen_companies').insert({
                    name: name,
                    ecitizen_identifier: data[1][0].ecitizen_identifier,
                    ecitizen_password: data[1][0].ecitizen_password,
                    ecitizen_status: 'Pending',
                    userid: userId
                  })
                );
              }
              break;

            case 'NITA':
              if (status.status === 'has_details' && data[1][0].nita_identifier) {
                statutoryPromises.push(
                  supabase.from('nita_companies').insert({
                    name: name,
                    nita_identifier: data[1][0].nita_identifier,
                    nita_password: data[1][0].nita_password,
                    nita_status: 'Pending',
                    userid: userId
                  })
                );
              }
              break;

            case 'Housing Levy':
              if (status.status === 'has_details' && data[1][0].housing_levy_identifier) {
                statutoryPromises.push(
                  supabase.from('housing_levy').insert({
                    name: name,
                    identifier: data[1][0].housing_levy_identifier,
                    password: data[1][0].housing_levy_password,
                    status: 'Pending',
                    userid: userId
                  })
                );
              }
              break;

            case 'Standard Levy':
              if (status.status === 'has_details' && data[1][0].standard_levy_identifier) {
                statutoryPromises.push(
                  supabase.from('standard_levy').insert({
                    name: name,
                    identifier: data[1][0].standard_levy_identifier,
                    password: data[1][0].standard_levy_password,
                    status: 'Pending',
                    userid: userId
                  })
                );
              }
              break;

            case 'Tourism Levy':
            case 'Tourism Fund':
              if (status.status === 'has_details' && data[1][0].tourism_levy_identifier) {
                statutoryPromises.push(
                  supabase.from('tourism_levy').insert({
                    name: name,
                    identifier: data[1][0].tourism_levy_identifier,
                    password: data[1][0].tourism_levy_password,
                    status: 'Pending',
                    fund_username: data[1][0].tourism_fund_username,
                    fund_password: data[1][0].tourism_fund_password,
                    userid: userId
                  })
                );
              }
              break;

            case 'VAT':
              if (status.status === 'has_details' && data[1][0].vat_identifier) {
                statutoryPromises.push(
                  supabase.from('vat_companies').insert({
                    name: name,
                    identifier: data[1][0].vat_identifier,
                    password: data[1][0].vat_password,
                    status: data[1][0].vat_status,
                    valid_from: data[1][0].vat_from,
                    valid_to: data[1][0].vat_to,
                    userid: userId
                  })
                );
              }
              break;

            case 'TIMS':
              if (status.status === 'has_details' && data[1][0].tims_username) {
                statutoryPromises.push(
                  supabase.from('tims_companies').insert({
                    name: name,
                    username: data[1][0].tims_username,
                    password: data[1][0].tims_password,
                    cert_incorporation: data[1][0].tims_cert_incorporation,
                    pin: data[1][0].tims_pin,
                    comment: data[1][0].tims_comment,
                    director_pin: data[1][0].tims_director_pin,
                    current_director_pin: data[1][0].tims_current_director_pin,
                    operator: data[1][0].tims_operator,
                    mobile: data[1][0].tims_mobile,
                    email: data[1][0].tims_email,
                    reg_doc_number: data[1][0].tims_reg_doc_number,
                    userid: userId
                  })
                );
              }
              break;

            case 'NEA':
              if (status.status === 'has_details' && data[1][0].nea_username) {
                statutoryPromises.push(
                  supabase.from('nea_companies').insert({
                    name: name,
                    username: data[1][0].nea_username,
                    password: data[1][0].nea_password,
                    userid: userId
                  })
                );
              }
              break;
          }
        });

        // Submit all statutory data
        if (statutoryPromises.length > 0) {
          console.log('Submitting statutory data...');
          const statutoryResults = await Promise.allSettled(statutoryPromises);
          console.log('Statutory submission results:', statutoryResults);

          const failedStatutory = statutoryResults.filter(result => result.status === 'rejected');
          if (failedStatutory.length > 0) {
            console.error('Some statutory submissions failed:', failedStatutory);
            throw new Error('Failed to submit some statutory data');
          }
        }
      }


      // 3. Directors
      const directorStatus = complianceStatus.find(s => s.name === "Director's Information");

      if (directorStatus?.status !== 'has_details') {
        // Submit just the status
        const { error } = await supabase
          .from('acc_portal_directors_status')
          .insert({
            userid: userId,
            status: directorStatus?.status,
            name: stages[currentStage - 1].name
          });

        if (error) throw error;
      } else {
        // Submit full data as before
        console.log('Submitting director data:', data[2]);

        const directorData = data[2].map(director => ({
          first_name: director.first_name || '',
          middle_name: director.middle_name || '',
          last_name: director.last_name || '',
          full_name: director.full_name || '',
          gender: director.gender || '',
          place_of_birth: director.place_of_birth || '',
          country_of_birth: director.country_of_birth || '',
          nationality: director.nationality || '',
          date_of_birth: director.date_of_birth || '',
          id_number: director.id_number || '',
          tax_pin: director.tax_pin || '',
          mobile_number: director.mobile_number || '',
          email_address: director.email_address || '',
          job_position: director.job_position || '',
          shares_held: director.shares_held || '',
          userid: userId
        }));
        const { error: directorError } = await supabase
          .from('acc_portal_directors')
          .insert(directorData);

        if (directorError) throw directorError;
      }


      // 4. Suppliers
      const supplierStatus = complianceStatus.find(s => s.name === 'Suppliers');
      if (supplierStatus?.status === 'has_details' && data[3] && Array.isArray(data[3]) && data[3].length > 0) {
        console.log('Submitting supplier data:', data[3]);

        const { error: supplierError } = await supabase
          .from('acc_portal_suppliers')
          .insert(data[3].map(supplier => ({
            userid: userId,
            data: {
              supplierName: supplier.data?.supplierName || '',
              supplierType: supplier.data?.supplierType || '',
              tradingType: supplier.data?.tradingType || '',
              pin: supplier.data?.pin || '',
              idNumber: supplier.data?.idNumber || '',
              mobile: supplier.data?.mobile || '',
              email: supplier.data?.email || ''
            }
          })));

        if (supplierError) throw supplierError;
      }

      // 5. Banks
      const bankStatus = complianceStatus.find(s => s.name === 'Banks');
      if (bankStatus?.status === 'has_details' && data[4] && Array.isArray(data[4]) && data[4].length > 0) {
        console.log('Submitting bank data:', data[4]);

        const { error: bankError } = await supabase
          .from('acc_portal_banks')
          .insert(data[4].map(bank => ({
            bank_name: bank.bank_name || '',
            account_number: bank.account_number || '',
            currency: bank.currency || null,
            branch: bank.branch || '',
            relationship_manager_name: bank.relationship_manager_name || '',
            relationship_manager_mobile: bank.relationship_manager_mobile || '',
            relationship_manager_email: bank.relationship_manager_email || '',
            bank_startdate: bank.bank_startdate || '',
            userid: userId,
            bank_status: false,
            bank_verified: false
          })));

        if (bankError) throw bankError;
      }

      // 6. Employees
      const employeeStatus = complianceStatus.find(s => s.name === 'Employee');
      if (employeeStatus?.status === 'has_details' && data[5] && Array.isArray(data[5]) && data[5].length > 0) {
        console.log('Submitting employee data:', data[5]);

        const employeeData = data[5].map(employee => ({
          employee_name: employee.employee_name || '',
          id_number: employee.id_number || '',
          employee_kra_pin: employee.employee_kra_pin || '',
          employee_email: employee.employee_email || `no-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          employee_mobile: employee.employee_mobile || '',
          employee_nhif: employee.employee_nhif || '',
          employee_nssf: employee.employee_nssf || '',
          employee_startdate: employee.employee_startdate || '',
          employee_enddate: employee.employee_enddate || '',
          userid: userId,
          employee_status: false,
          employee_verified: false
        }));

        const uniqueEmployees = employeeData.filter((employee, index, self) =>
          index === self.findIndex((e) => e.employee_email === employee.employee_email)
        );

        const { error: employeeError } = await supabase
          .from('acc_portal_employees')
          .insert(uniqueEmployees);

        if (employeeError) throw employeeError;
      }

      toast.success('All data submitted successfully!');
      onComplete(data);
      return true;

    } catch (error) {
      console.error('Error in submission process:', error);
      toast.error(`Failed to submit data: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  // Update handleVerification
  const handleVerification = async () => {
    if (currentStage === 5) {
      // Submit all data when completing the final stage
      await submitAllData();
    } else {
      // Just move to next stage but log the current data state
      console.log('Current data state:', data);
      setCurrentStage(currentStage + 1);
    }
  };

  // Update the handleSkip function:
  const handleSkip = () => {
    console.log('Current data state before skip:', data);
    if (currentStage === 5) {
      onComplete(data);
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  // Add logging to stage navigation:
  const handleStageChange = (newStage: number) => {
    console.log('Changing stage from', currentStage, 'to', newStage);
    console.log('Current data state:', data);
    setCurrentStage(newStage);
  };

  // Add this function to your component
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




  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="mb-12">
          {/* Company Header */}
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
                className={`flex flex-col items-center w-1/5 relative group transition-all duration-300 ${stage.id === currentStage
                  ? "text-blue-600"
                  : stage.id < currentStage
                    ? "text-blue-400"
                    : "text-gray-400"
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transform transition-all duration-300 hover:scale-110 ${stage.id === currentStage
                    ? "bg-blue-600 text-white shadow-lg"
                    : stage.id < currentStage
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200"
                    }`}
                >
                  {stage.id}
                </div>
                <span className="text-sm font-medium">{stage.name}</span>
                {stage.id < stages.length && (
                  <div
                    className={`absolute top-6 left-[60%] w-full h-[3px] transition-all duration-300 ${stage.id < currentStage
                      ? "bg-blue-400"
                      : "bg-gray-200"
                      }`}
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
                                        <SelectItem value="registered">To Be Registered</SelectItem>
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
                                    <SelectItem value="registered">To Be Registered</SelectItem>
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

          {/* Replace the existing data mapping section with this */}
          {data[currentStage] && Array.isArray(data[currentStage]) && data[currentStage].length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {currentStage === 3 ? (
                        // Special handling for suppliers
                        <>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead>Supplier Type</TableHead>
                          <TableHead>Trading Type</TableHead>
                          <TableHead>PIN</TableHead>
                          <TableHead>ID Number</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Email</TableHead>
                        </>
                      ) : (
                        // Other stages - only show headers for existing data
                        Object.keys(data[currentStage][0] || {})
                          .filter(key => key !== 'userid')
                          .map((header) => (
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
                            <TableCell>{row.data?.supplierName || '-'}</TableCell>
                            <TableCell>{row.data?.supplierType || '-'}</TableCell>
                            <TableCell>{row.data?.tradingType || '-'}</TableCell>
                            <TableCell>{row.data?.pin || '-'}</TableCell>
                            <TableCell>{row.data?.idNumber || '-'}</TableCell>
                            <TableCell>{row.data?.mobile || '-'}</TableCell>
                            <TableCell>{row.data?.email || '-'}</TableCell>
                          </>
                        ) : (
                          Object.entries(row || {})
                            .filter(([key]) => key !== 'userid')
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data available for this stage
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          {currentStage > 1 && (
            <Button
              onClick={() => handleStageChange(currentStage - 1)}
              variant="outline"
              className="hover:bg-gray-50 transition-colors"
            >
              Previous Stage
            </Button>
          )}
          <Button
            onClick={handleSkip}
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