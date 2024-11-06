/* eslint-disable react/jsx-key */
// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyTaxTable, DirectorsTable, ComplianceTable, NSSFTable, NHIFTable, EmployeesTable, BankingTable, PAYETable, VATTable, NITATable, HousingLevyTable, TourismLevyTable, StandardLevyTable, ClientCategoryTable, SheriaDetailsTable, ECitizenTable, TaxStatusTable, CompanyGeneralTable } from './tableComponents';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from "sonner";

function generateReferenceNumbers(sections) {
    let sectionCounter = 1;
    
    return sections.map(section => {
      if (section.isSeparator) return section;
      
      // Skip numbering for index section
      if (section.name === 'index') return section;
      
      // Add section number (e.g., "1. Company Details")
      const sectionRef = `${sectionCounter}`;
      
      // Process categorized fields
      if (section.categorizedFields) {
        let categoryCounter = 1;
        
        const processedCategories = section.categorizedFields.map(category => {
          if (category.isSeparator) return category;
          
          // Add category number (e.g., "1.1 General")
          const categoryRef = `${sectionRef}.${categoryCounter}`;
          categoryCounter++;
          
          let fieldCounter = 1;
          const processedFields = category.fields.map(field => {
            // Add field number (e.g., "1.1.1 Company Name")
            const fieldRef = `${categoryRef}.${fieldCounter}`;
            fieldCounter++;
            
            return {
              ...field,
              reference: fieldRef
            };
          });
          
          return {
            ...category,
            reference: categoryRef,
            fields: processedFields
          };
        });
        

        if (section.name !== 'index') sectionCounter++;
        return {
          ...section,
          reference: sectionRef,
          categorizedFields: processedCategories
        };
      }
      

      if (section.name !== 'index') sectionCounter++;
      return section;
    });
  }
  
const OverallView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

// Update color styles
const sectionColors = {
    index: { main: 'bg-gray-600', sub: 'bg-gray-500', cell: 'bg-gray-50' },
    companyDetails: { main: 'bg-blue-600', sub: 'bg-blue-500', cell: 'bg-blue-50' },
    directorDetails: { main: 'bg-emerald-600', sub: 'bg-emerald-500', cell: 'bg-emerald-50' },
    supplierDetails: { main: 'bg-purple-600', sub: 'bg-purple-500', cell: 'bg-purple-50' },
    bankDetails: { main: 'bg-amber-600', sub: 'bg-amber-500', cell: 'bg-amber-50' },
    employeeDetails: { main: 'bg-rose-600', sub: 'bg-rose-500', cell: 'bg-rose-50' }
  };
    const categoryColors = {
        'General Information': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
        'KRA Details': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
        'NSSF Details': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'NHIF Details': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
        'Ecitizen Details': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
        'NITA Details': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
        'Housing Levy Details': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        'Standard Levy Details': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
        'Tourism Levy Details': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
        'Tourism Fund Details': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
        'VAT Details': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        'Income Tax Status': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'PAYE Details': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
        'MRI': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'TOT': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'TIMS Details': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
        'Sheria Details': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'Other Details': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    };

    const sectionsWithSeparators = [
        { name: 'index', fields: [{ name: 'index', label: '#' }], label: '#' },
        { isSeparator: true },
        { name: 'companyDetails', fields: formFields.companyDetails.fields, label: 'Company Details' },
        { isSeparator: true },
        { name: 'directorDetails', fields: formFields.directorDetails.fields, label: 'Director Details' },
        { isSeparator: true },
        { name: 'supplierDetails', fields: formFields.supplierDetails.fields, label: 'Supplier Details' },
        { isSeparator: true },
        { name: 'bankDetails', fields: formFields.bankDetails.fields, label: 'Bank Details' },
        { isSeparator: true },
        { name: 'employeeDetails', fields: formFields.employeeDetails.fields, label: 'Employee Details' }
    ];

    const allFieldsWithSeparators = sectionsWithSeparators.flatMap(section =>
        section.isSeparator
            ? [{ isSeparator: true }]
            : section.fields
    );

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [
                    { data: companies },
                    { data: users },
                    { data: directors }
                ] = await Promise.all([
                    supabase.from('acc_portal_company_duplicate').select('*'),
                    supabase.from('acc_portal_clerk_users_duplicate').select('*'),
                    supabase.from('acc_portal_directors_duplicate').select('*'),
                ]);

                // Group and combine the data
                const groupedData = companies.map(company => {
                    const user = users.find(u => u.userid === company.userid);
                    const companyDirectors = directors.filter(d => d.userid === company.userid);

                    return {
                        company: {
                            ...company,
                            ...user?.metadata,
                        },
                        directors: companyDirectors,
                        rows: [{
                            ...company,
                            ...user?.metadata,
                            isFirstRow: true
                        }],
                        rowSpan: 1
                    };
                });

                setData(groupedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }
    const renderSeparatorCell = (key, isHeader = false, rowSpan = 1) => {
        const Component = isHeader ? TableHead : TableCell;
        return (
            <Component
                key={key}
                className="bg-gray-200 w-4 p-0 border-x border-gray-300"
                rowSpan={rowSpan}
            />
        );
    };

    const countMissingFields = (row) => {
        const fields = Object.keys(row).filter(key =>
            key !== 'index' &&
            key !== 'isFirstRow' &&
            key !== 'rowSpan' &&
            !key.startsWith('data.') // Exclude nested data fields
        );

        const totalFields = fields.length;
        const completedFields = fields.filter(field => row[field] !== null && row[field] !== '').length;
        const missingFields = totalFields - completedFields;

        return (
            <div className='flex gap-2 text-sm font-medium border rounded-lg p-2 bg-gray-50'>
                <span className='text-blue-600 border-r pr-2'>T: {totalFields}</span>
                <span className='text-green-600 border-r pr-2'>C: {completedFields}</span>
                <span className='text-red-600'>P: {missingFields}</span>
            </div>
        );
    };

    // Add function to calculate overall missing counts
    const calculateMissingCounts = () => {
        if (!data.length || !data[0].rows.length) return {};

        const fields = Object.keys(data[0].rows[0]).filter(key =>
            key !== 'index' &&
            key !== 'isFirstRow' &&
            key !== 'rowSpan' &&
            !key.startsWith('data.')
        );

        const totalFields = fields.length;
        const allRows = data.flatMap(group => group.rows);

        const completedFields = fields.filter(field =>
            allRows.every(row => row[field] !== null && row[field] !== '')
        ).length;

        const totalMissing = totalFields - completedFields;

        const columnMissing = {};
        fields.forEach(field => {
            columnMissing[field] = allRows.filter(row =>
                row[field] === null || row[field] === ''
            ).length;
        });

        return { totalFields, completedFields, totalMissing, columnMissing };
    };

    const { totalFields, completedFields, totalMissing, columnMissing } = calculateMissingCounts();

    const calculateColumnStatistics = () => {
        if (!data.length) return {};

        const allRows = data.flatMap(group => group.rows);
        const columnStats = {};

        allFieldsWithSeparators.forEach(field => {
            if (!field.isSeparator) {
                const total = allRows.length;
                const completed = allRows.filter(row =>
                    row[field.name] !== null &&
                    row[field.name] !== '' &&
                    row[field.name] !== undefined
                ).length;

                columnStats[field.name] = {
                    total,
                    completed,
                    pending: total - completed
                };
            }
        });

        return columnStats;
    };

    const columnStats = calculateColumnStatistics();

    const groupFieldsByCategory = (fields) => {
        // First group fields by their categories
        const categorizedFields = fields.reduce((acc, field) => {
            const category = field.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(field);
            return acc;
        }, {});

        // Convert to array format with separators
        const result = Object.entries(categorizedFields).flatMap(([category, fields], index, array) => {
            // Add category with its fields
            const categoryGroup = {
                category,
                fields,
                colSpan: fields.length
            };

            // Add separator if not the last category
            if (index < array.length - 1) {
                return [categoryGroup, { isSeparator: true }];
            }
            return [categoryGroup];
        });

        return result;
    };

    const processedSections = generateReferenceNumbers(sectionsWithSeparators.map(section => {
        if (section.isSeparator) return section;
    
        // Group fields by category for company details
        if (section.name === 'companyDetails') {
            return {
                ...section,
                categorizedFields: groupFieldsByCategory(section.fields)
            };
        }
    
        // For other sections, treat all fields as 'General' category
        return {
            ...section,
            categorizedFields: [{
                category: 'General',
                fields: section.fields,
                colSpan: section.fields.length
            }]
        };
    }));
    
    const handleExport = () => {
        const exportRows = [];
        
        // Add headers
        const headers = ['Section', 'Category', 'Field', 'Value', 'Value 2', 'Value 3'];
        exportRows.push(headers);
    
        // Define colors for different sections
        const sectionColors = {
            'Basic Information': 'FFE6E6',  // Light Red
            'Financial Details': 'E6FFE6',  // Light Green
            'Contact Information': 'E6E6FF', // Light Blue
            'Operations': 'FFFFE6',         // Light Yellow
            'Compliance': 'FFE6FF',         // Light Purple
            'Other': 'E6FFFF'              // Light Cyan
        };
    
        // Process data in the desired structure, skipping redundant section/category labels
        sectionsWithSeparators.forEach(section => {
            if (!section.isSeparator) {
                let isFirstField = true;
    
                section.fields.forEach(field => {
                    const row = [
                        isFirstField ? section.label : '',         // Section only for the first field
                        isFirstField ? (field.category || 'General') : '',  // Category only for the first field
                        field.label,
                        ...data.map(item => item.company[field.name] || '')
                    ];
                    exportRows.push(row);
                    isFirstField = false; // Set to false after the first field in each section
                });
            }
        });
    
        // Create worksheet from data
        const ws = XLSX.utils.aoa_to_sheet(exportRows);
    
        // Set column widths
        ws['!cols'] = [
            { wch: 20 },  // Section
            { wch: 20 },  // Category
            { wch: 25 },  // Field
            { wch: 30 },  // Value
            { wch: 30 },  // Value 2
            { wch: 30 }   // Value 3
        ];
    
        // Initialize styles for all cells and set background colors
        for (let rowIndex = 0; rowIndex < exportRows.length; rowIndex++) {
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                ws[cellAddress] = ws[cellAddress] || { v: '', t: 's' };
                ws[cellAddress].s = {};
            }
        }
    
        // Style header row with gray background and bold text
        headers.forEach((_, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
            ws[cellAddress].s = {
                font: { bold: true },
                fill: {
                    fgColor: { rgb: 'C0C0C0' },
                    patternType: 'solid'
                }
            };
        });
    
        // Apply colors to data rows based on section
        let currentRowIndex = 1; // Start after header row
        sectionsWithSeparators.forEach(section => {
            if (!section.isSeparator) {
                const fillColor = sectionColors[section.label] || 'FFFFFF';
    
                section.fields.forEach(() => {
                    // Apply fill color to each cell in the row
                    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: currentRowIndex, c: colIndex });
                        ws[cellAddress].s = {
                            fill: {
                                fgColor: { rgb: fillColor },
                                patternType: 'solid'
                            }
                        };
                    }
                    currentRowIndex++;
                });
            }
        });
    
        // Create and save the workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Companies");
        XLSX.writeFile(wb, "Companies_Report.xlsx");
    };
    const handleFileImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        try {
            let parsedData;
            if (file.name.endsWith('.csv')) {
                const text = await file.text();
                parsedData = Papa.parse(text, { header: true }).data;
            } else {
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer);
                const ws = wb.Sheets[wb.SheetNames[0]];
                parsedData = XLSX.utils.sheet_to_json(ws);
            }
    
            console.log('Raw Parsed Data:', parsedData);
    
            // Get existing data from database for comparison
            const { data: existingData, error: fetchError } = await supabase
                .from('acc_portal_company_duplicate')
                .select('*');
    
            if (fetchError) {
                console.error('Error fetching existing data:', fetchError);
                throw fetchError;
            }
    
            // Transform Excel/CSV data format to match database schema
            const transformedData = [];
            const companiesMap = new Map(); // To store companies by index
            
            // First, identify all value columns
            const valueColumns = Object.keys(parsedData[0]).filter(key => key.startsWith('Value'));
            console.log('Value columns found:', valueColumns);
    
            parsedData.forEach(row => {
                if (row.Section === 'Company Details') {
                    // For each value column, create a new company object
                    valueColumns.forEach((valueCol, index) => {
                        if (!companiesMap.has(index)) {
                            companiesMap.set(index, {
                                company_name: null,
                                company_type: null,
                                description: null,
                                registration_number: null,
                                date_established: null,
                                kra_pin_number: null,
                                industry: null,
                                employees: null,
                                annual_revenue: null,
                                fiscal_year: null,
                                website: null,
                                email: null,
                                phone: null,
                                street: null,
                                city: null,
                                postal_code: null,
                                country: null,
                                status: ''
                            });
                        }
                    });
                }
    
                // Update each company's data if it exists
                valueColumns.forEach((valueCol, index) => {
                    const company = companiesMap.get(index);
                    if (company) {
                        const value = row[valueCol];
                        if (value) { // Only update if value exists
                            switch (row.Field) {
                                case 'Company Name':
                                    company.company_name = value;
                                    break;
                                case 'Company Type':
                                    company.company_type = value;
                                    break;
                                case 'Description':
                                    company.description = value;
                                    break;
                                case 'Registration Number':
                                    company.registration_number = value;
                                    break;
                                case 'Date Established':
                                    company.date_established = value;
                                    break;
                                case 'Industry':
                                    company.industry = value;
                                    break;
                                case 'Employees':
                                    company.employees = value;
                                    break;
                                case 'Annual Revenue':
                                    company.annual_revenue = value;
                                    break;
                                case 'Fiscal Year':
                                    company.fiscal_year = value;
                                    break;
                                case 'Website':
                                    company.website = value;
                                    break;
                                case 'Email':
                                    company.email = value;
                                    break;
                                case 'Phone':
                                    company.phone = value;
                                    break;
                                case 'Street':
                                    company.street = value;
                                    break;
                                case 'City':
                                    company.city = value;
                                    break;
                                case 'Postal Code':
                                    company.postal_code = value;
                                    break;
                                case 'Country':
                                    company.country = value;
                                    break;
                                case 'Status':
                                    company.status = value;
                                    break;
                                case 'KRA PIN':
                                    company.kra_pin_number = value;
                                    break;
                            }
                        }
                    }
                });
            });
    
            // Convert map to array, filtering out empty companies
            const transformedCompanies = Array.from(companiesMap.values()).filter(company => 
                company.company_name || company.registration_number
            );
    
            console.log('Transformed Companies:', transformedCompanies);
    
            // Filter out companies with no changes
            const updates = transformedCompanies.filter(newCompany => {
                const existingCompany = existingData.find(existing => 
                    existing.registration_number === newCompany.registration_number ||
                    existing.company_name === newCompany.company_name
                );
    
                if (!existingCompany) return true;
    
                return Object.keys(newCompany).some(key => 
                    newCompany[key] !== null && 
                    newCompany[key] !== '' && 
                    newCompany[key] !== existingCompany[key]
                );
            });
    
            console.log('Updates to be applied:', updates);
    
            if (updates.length === 0) {
                toast.info('No changes detected');
                return;
            }
    
   // In the handleFileImport function, replace the batch update code with this:
const batchSize = 100;
for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    // For each company in the batch
    for (const company of batch) {
        // Try to find existing company first
        const { data: existing, error: findError } = await supabase
            .from('acc_portal_company_duplicate')
            .select('id')
            .eq('company_name', company.company_name)
            .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error finding company:', findError);
            continue;
        }

        if (existing) {
            // Update existing company
            const { error: updateError } = await supabase
                .from('acc_portal_company_duplicate')
                .update(company)
                .eq('id', existing.id);

            if (updateError) {
                console.error('Error updating company:', updateError);
            }
        } else {
            // Insert new company
            const { error: insertError } = await supabase
                .from('acc_portal_company_duplicate')
                .insert([company]);

            if (insertError) {
                console.error('Error inserting company:', insertError);
            }
        }
    }
}
    
            console.log('All updates completed');
            toast.success(`Successfully updated ${updates.length} records`);
    
            // Refresh the data
            window.location.reload();
    
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import data');
        }
    };
    const ImportDialog = () => {
        return (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Data</DialogTitle>
                        <DialogDescription>
                            Upload your Excel or CSV file to import data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-primary">
                                <div className="text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-2">Click to upload or drag and drop</div>
                                    <div className="mt-1 text-sm text-gray-500">XLSX, CSV files supported</div>
                                </div>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.csv"
                                onChange={handleFileImport}
                            />
                        </label>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    const calculateTotalFields = (section) => {
        return section.categorizedFields?.reduce((total, category) => {
          if (category.isSeparator) return total;
          return total + category.fields.length;
        }, 0) || 0;
      };
      
      const calculateCompletedFields = (section, data) => {
        let completed = 0;
        section.categorizedFields?.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              if (data.some(item => item[field.name])) {
                completed++;
              }
            });
          }
        });
        return completed;
      };
      
      const calculatePendingFields = (section, data) => {
        const total = calculateTotalFields(section);
        const completed = calculateCompletedFields(section, data);
        return total - completed;
      };

      const calculateFieldStats = (fieldName, data) => {
        const total = data.length;
        const completed = data.filter(item => 
            item.company[fieldName] !== null && 
            item.company[fieldName] !== undefined && 
            item.company[fieldName] !== ''
        ).length;
        
        return {
            total,
            completed,
            pending: total - completed
        };
    };
    return (

        <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-10 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="overview" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Overview</TabsTrigger>
                <TabsTrigger value="company" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Company</TabsTrigger>
                {/* <TabsTrigger value="directors" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Directors</TabsTrigger> */}
                <TabsTrigger value="clients" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Clients</TabsTrigger>
                <TabsTrigger value="checklist" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Monthly Checklist</TabsTrigger>
                <TabsTrigger value="sheria" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Sheria Details</TabsTrigger>
                {/* <TabsTrigger value="directors" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Directors</TabsTrigger> */}
                <TabsTrigger value="ecitizen" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">E-Citizen</TabsTrigger>
                <TabsTrigger value="taxes" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Taxes</TabsTrigger>
                <TabsTrigger value="other" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Other Details</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <div className="flex justify-end gap-4 mb-4">
                    <Button
                        onClick={() => setIsImportDialogOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Upload className="h-4 w-4" />
                        Import Data
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[900px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    {/* <TableRow className="border-b">
  {processedSections.map((section, sectionIndex) => {
    if (section.isSeparator) return null;
    
    return (
      <TableHead
        key={`ref-${section.name}`}
        colSpan={section.fields.length}
        className="text-xs text-gray-500 font-medium py-1 px-2"
      >
        {`Section ${sectionIndex + 1}`}
      </TableHead>
    );
  })}
</TableRow> */}
                                
    {/* Section Headers */}
    <TableRow>
            {processedSections.map(section => {
                if (section.isSeparator) return renderSeparatorCell();
                const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';
                
                return (
                    <TableHead 
                    key={section.name}
                    colSpan={section.categorizedFields?.reduce((total, cat) => 
                        total + (cat.isSeparator ? 1 : cat.fields.length), 0)}
                    className={`text-center text-white ${sectionColor}`}
                >
                    {`${section.reference ?? ''} ${section.label}`}
                </TableHead>
                );
            })}
        </TableRow>

        {/* Category Headers */}
        <TableRow>
            {processedSections.map(section => {
                if (section.isSeparator) return renderSeparatorCell();
                
                return section.categorizedFields?.map(category => {
                    if (category.isSeparator) return renderSeparatorCell();
                    const categoryColor = categoryColors[category.category]?.bg || 'bg-gray-50';
                    
                    return (
                        <TableHead
                        key={`${section.name}-${category.category}`}
                        colSpan={category.fields.length}
                        className={`text-center ${categoryColor}`}
                    >
                        {`${category.reference ?? ''} ${category.category}`}
                    </TableHead>
                    );
                });
            })}
        </TableRow>

        {/* Field Headers */}
        <TableRow>
            {processedSections.map(section => {
                if (section.isSeparator) return renderSeparatorCell();
                
                return section.categorizedFields?.map(category => {
                    if (category.isSeparator) return renderSeparatorCell();
                    
                    return category.fields.map(field => (
                        <TableHead 
                        key={`${section.name}-${field.name}`}
                        className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white`}
                    >
                        {`${field.reference ?? ''} ${field.label}`}
                    </TableHead>
                    ));
                });
            })}
        </TableRow>

        <TableRow className="bg-blue-50">
    <TableHead className="font-semibold text-blue-900">Total Companies</TableHead>
    {processedSections.map((section, sectionIndex) => {
        if (section.isSeparator) return renderSeparatorCell(`total-sep-${sectionIndex}`);
        if (sectionIndex === 0) return null;
        
        return section.categorizedFields?.map(category => {
            if (category.isSeparator) return renderSeparatorCell(`total-cat-sep-${sectionIndex}`);
            
            return category.fields.map(field => {
                const stats = calculateFieldStats(field.name, data);
                return (
                    <TableCell 
                        key={`total-${field.name}`}
                        className="text-center font-medium text-blue-700"
                    >
                        {stats.total}
                    </TableCell>
                );
            });
        });
    })}
</TableRow>

<TableRow className="bg-green-50">
    <TableHead className="font-semibold text-green-900">Completed</TableHead>
    {processedSections.map((section, sectionIndex) => {
        if (section.isSeparator) return renderSeparatorCell(`completed-sep-${sectionIndex}`);
        if (sectionIndex === 0) return null;
        
        return section.categorizedFields?.map(category => {
            if (category.isSeparator) return renderSeparatorCell(`completed-cat-sep-${sectionIndex}`);
            
            return category.fields.map(field => {
                const stats = calculateFieldStats(field.name, data);
                return (
                    <TableCell 
                        key={`completed-${field.name}`}
                        className="text-center font-medium text-green-700"
                    >
                        {stats.completed}
                    </TableCell>
                );
            });
        });
    })}
</TableRow>

<TableRow className="bg-red-50">
    <TableHead className="font-semibold text-red-900">Pending</TableHead>
    {processedSections.map((section, sectionIndex) => {
        if (section.isSeparator) return renderSeparatorCell(`pending-sep-${sectionIndex}`);
        if (sectionIndex === 0) return null;
        
        return section.categorizedFields?.map(category => {
            if (category.isSeparator) return renderSeparatorCell(`pending-cat-sep-${sectionIndex}`);
            
            return category.fields.map(field => {
                const stats = calculateFieldStats(field.name, data);
                return (
                    <TableCell 
                        key={`pending-${field.name}`}
                        className="text-center font-medium text-red-700"
                    >
                        {stats.pending}
                    </TableCell>
                );
            });
        });
    })}
</TableRow>

    </TableHeader>
                                <TableBody>
                                    {data.map((companyGroup, groupIndex) => (
                                        companyGroup.rows.map((row, rowIndex) => (
                                            <TableRow
                                                key={`${groupIndex}-${rowIndex}`}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {rowIndex === 0 && (
                                                    <TableCell
                                                        className="whitespace-nowrap font-medium"
                                                        rowSpan={companyGroup.rowSpan}
                                                    >
                                                        {groupIndex + 1}
                                                    </TableCell>
                                                )}
                                                {/* Skip the first section (index) and start from the first separator */}
                                                {processedSections.slice(1).map((section, sectionIndex) => {
                                                    if (section.isSeparator) {
                                                        return rowIndex === 0 && renderSeparatorCell(
                                                            `body-sep-${groupIndex}-${sectionIndex}`,
                                                            false,
                                                            companyGroup.rowSpan
                                                        );
                                                    }

                                                    const sectionColor = sectionColors[section.name]?.cell || 'bg-gray-50';

                                                    return section.categorizedFields.map((category, categoryIndex) => {
                                                        if (category.isSeparator) {
                                                            return rowIndex === 0 && renderSeparatorCell(
                                                                `body-cat-sep-${groupIndex}-${sectionIndex}-${categoryIndex}`,
                                                                false,
                                                                companyGroup.rowSpan
                                                            );
                                                        }

                                                        return category.fields.map(field => {
                                                            if (field.name.startsWith('company_') && rowIndex > 0) {
                                                                return null;
                                                            }

                                                            let value = row[field.name];

                                                            if (field.type === 'boolean') {
                                                                value = value ? 'Yes' : 'No';
                                                            } else if (field.type === 'date' && value) {
                                                                try {
                                                                    value = new Date(value).toLocaleDateString();
                                                                } catch (e) {
                                                                    value = value;
                                                                }
                                                            }

                                                            return (
                                                                <TableCell
                                                                    key={`${groupIndex}-${rowIndex}-${field.name}`}
                                                                    className={`whitespace-nowrap ${sectionColor} transition-colors`}
                                                                    rowSpan={field.name.startsWith('company_') ? companyGroup.rowSpan : 1}
                                                                >
                                                                    {value || <span className="text-red-500 font-semibold">N/A</span>}
                                                                </TableCell>
                                                            );
                                                        });
                                                    });
                                                })}
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
                {isImportDialogOpen && <ImportDialog />}
            </TabsContent>

            <TabsContent value="company">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="tax">Tax Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <CompanyGeneralTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="ecitizen">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Card>                    {/* Rest of the ecitizen content remains the same */}
                    {/* ... */}
                </Card>
            </TabsContent>

            <TabsContent value="banking">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="accounts" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="accounts">Accounts</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="accounts">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <BankingTable data={data.flatMap(company => company.banks)} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="clients">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="acc">







                    {/* Rest of the clients content remains the same */}
                    {/* ... */}
                </Tabs>
            </TabsContent>

            <TabsContent value="directors">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="details">

















                    {/* Rest of the directors content remains the same */}
                    {/* ... */}
                </Tabs>
            </TabsContent>

            <TabsContent value="taxes">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="all">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="kra">KRA Status</TabsTrigger>
                        <TabsTrigger value="income">Income Tax</TabsTrigger>
                        <TabsTrigger value="vat">VAT</TabsTrigger>
                        <TabsTrigger value="paye">PAYE</TabsTrigger>
                        <TabsTrigger value="rent">Rent Income</TabsTrigger>
                        <TabsTrigger value="turnover">Turnover Tax</TabsTrigger>
                    </TabsList>
                </Tabs>

                <TabsContent value="kra">
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[700px]">
                                <TaxStatusTable data={data} />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all">
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[700px]">
                                <ComplianceTable data={data} />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="nssf">
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[700px]">
                                <NSSFTable data={data.map(company => ({
                                    ...company,
                                    ...company.nssf
                                }))} />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="nhif">
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[700px]">
                                <NHIFTable data={data.map(company => ({
                                    ...company,
                                    ...company.nhif
                                }))} />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="housing">
                    <Card>
                        <CardContent className="p-0">
                            {/* <ScrollArea className="h-[700px]">
                                    <HousingLevyTable data={data} />
                                </ScrollArea> */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </TabsContent>

            <TabsContent value="client">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Card>





                    {/* Rest of the client content remains the same */}
                    {/* ... */}
                </Card>
            </TabsContent>

            <TabsContent value="sheria">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Card>





                    {/* Rest of the sheria content remains the same */}
                    {/* ... */}
                </Card>
            </TabsContent>

            <TabsContent value="checklist">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
                <Tabs defaultValue="nssf" className="space-y-4">
                    <TabsList>
                        {/* <TabsTrigger value="all">All</TabsTrigger> */}
                        <TabsTrigger value="nssf">NSSF</TabsTrigger>
                        <TabsTrigger value="nhif">NHIF</TabsTrigger>
                        <TabsTrigger value="paye">PAYE</TabsTrigger>
                        <TabsTrigger value="nita">NITA</TabsTrigger>
                        <TabsTrigger value="tourism">Tourism Levy</TabsTrigger>
                        <TabsTrigger value="housing">Housing Levy</TabsTrigger>
                        <TabsTrigger value="vat">VAT</TabsTrigger>
                        <TabsTrigger value="standard-levy">Standard Levy</TabsTrigger>
                    </TabsList>

                    {/* <TabsContent value="all">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <ComplianceTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent> */}

                    <TabsContent value="nssf">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <NSSFTable data={data.map(company => ({
                                        ...company,
                                        ...company.nssf
                                    }))} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="nhif">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <NHIFTable data={data.map(company => ({
                                        ...company,
                                        ...company.nhif
                                    }))} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="paye">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <PAYETable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="nita">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <NITATable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tourism">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <TourismLevyTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="housing">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <HousingLevyTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="vat">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <VATTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="standard-levy">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <StandardLevyTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

        </Tabs>);
};

export default OverallView;


