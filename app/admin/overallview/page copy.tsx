/* eslint-disable react/jsx-key */
// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyTaxTable, DirectorsTable, ComplianceTable, NSSFTable, NHIFTable, EmployeesTable, BankingTable, PAYETable, VATTable, NITATable, HousingLevyTable, TourismLevyTable, StandardLevyTable, ClientCategoryTable, SheriaDetailsTable, ECitizenTable, TaxStatusTable, CompanyGeneralTable } from './components/tableComponents';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from "sonner";
import { useTableFunctionalities, CompanyEditDialog } from './components/functionalities'
import { Search, Filter, X } from 'lucide-react';
import { groupFieldsByCategory, groupDataByCategory, calculateFieldStats, handleExport, handleFileImport, calculateTotalFields, calculatePendingFields, calculateCompletedFields } from './components/utility';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SettingsDialog } from './components/overview/Dialogs/settingsDialog';
import { MissingFieldsDialog, getMissingFields } from './components/missingFieldsDialog';
import { Input } from "@/components/ui/input";

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
    const { filteredData, globalFilter, handleGlobalSearch, columnVisibility, toggleColumnVisibility, sectionVisibility, toggleSectionVisibility, categoryVisibility, toggleCategoryVisibility, getVisibleColumns, resetAll } = useTableFunctionalities(data);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMissingFields, setSelectedMissingFields] = useState(null);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);

    // Add search input
    const searchInput = (
        <input
            type="text"
            value={globalFilter}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            placeholder="Search all columns..."
            className="px-3 py-2 border rounded"
        />
    );

    const visibilityControls = (
        <div className="flex gap-4 mb-4">
            <Button onClick={resetAll}>Reset All</Button>
            {/* Add more visibility toggle buttons as needed */}
        </div>
    );
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
        'General Information': { bg: 'bg-blue-100', text: 'text-slate-700', border: 'border-slate-200' },
        'Bcl take over Details': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'KRA Details': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        'PIN Details': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
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
        'Other Details': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
        'KRA ACC Manager': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        'KRA Team Lead': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
        'KRA Sector Manager': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
        'Client Category': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
        'IMM': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
        'Audit': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
        'Acc': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' }
    };

    const getTableInfo = (fieldName) => {
        // Default table info
        const defaultInfo = {
            table: 'acc_portal_company_duplicate',
            idColumn: 'id',
            useCompanyName: false,
            useId: true
        };

        // Mapping of field prefixes to their respective tables
        const tableMapping = {
            'nssf_': {
                table: 'nssf_companies_duplicate',
                idColumn: 'company_name',
                useCompanyName: true
            },
            'nhif_': {
                table: 'nhif_companies_duplicate2',
                idColumn: 'company_name',
                useCompanyName: true
            },
            'ecitizen_': {
                table: 'ecitizen_companies_duplicate',
                idColumn: 'name',
                useCompanyName: true
            },
            'etims_': {
                table: 'etims_companies_duplicate',
                idColumn: 'company_name',
                useCompanyName: true
            }
        };

        // Check if field belongs to a specific table
        for (const [prefix, info] of Object.entries(tableMapping)) {
            if (fieldName.startsWith(prefix)) {
                return info;
            }
        }

        // Return default if no specific mapping found
        return defaultInfo;
    };

    const getTableMapping = (fieldName) => {
        const mappings = {
            // Company table fields
            company_: {
                table: 'acc_portal_company_duplicate',
                idField: 'company_name',
                matchField: 'company_name'
            },
            // NSSF fields
            nssf_: {
                table: 'nssf_companies_duplicate',
                idField: 'company_name',
                matchField: 'company_name'
            },
            // NHIF fields
            nhif_: {
                table: 'nhif_companies_duplicate2',
                idField: 'company_name',
                matchField: 'company_name'
            },
            // eCitizen fields
            ecitizen_: {
                table: 'ecitizen_companies_duplicate',
                idField: 'name',
                matchField: 'name'
            },
            // etims fields
            etims_: {
                table: 'etims_companies_duplicate',
                idField: 'company_name',
                matchField: 'company_name'
            }
        };

        // Find matching prefix
        const prefix = Object.keys(mappings).find(p => fieldName.startsWith(p));
        return prefix ? mappings[prefix] : mappings.company_;
    };

    // Create a new EditableCell component
    const EditableCell = ({
        value: initialValue,
        onSave,
        fieldName,
        rowId,
        companyName,
        className,
        field,
    }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(initialValue);
        const inputRef = useRef(null);
    
        useEffect(() => {
            setEditValue(initialValue);
        }, [initialValue]);
    
        const handleSave = async () => {
            if (editValue !== initialValue) {
                try {
                    // Check if the company exists in the first table (acc_portal_company_duplicate)
                    const { data: companyData, error: companyError } = await supabase
                        .from('acc_portal_company_duplicate')
                        .select('company_name')
                        .eq('company_name', companyName)
                        .single(); // Fetch one record
    
                    if (companyError || !companyData) {
                        console.log(`Company not found in acc_portal_company_duplicate: ${companyName}`);
                        toast.error(`Company "${companyName}" not found.`);
                        return;
                    }
    
                    console.log(`Company found in acc_portal_company_duplicate: ${companyName}`);
    
                    // List of tables to check
                    const tables = ['acc_portal_company_duplicate', 'etims_companies_duplicate', 'PasswordChecker_duplicate', 'nssf_companies_duplicate', 'ecitizen_companies_duplicate', 'nhif_companies_duplicate2']; 
    
                    let fieldFound = false;
    
                    // Iterate over tables to find the field and update it
                    for (const table of tables) {
                        // Query the table for the company name and check for the field
                        const { data, error } = await supabase
                            .from(table)
                            .select('*')
                            .eq(table === 'ecitizen_companies_duplicate' ? 'name' : 'company_name', companyName)
                            .single(); // Fetch one record
    
                        if (error || !data) {
                            console.log(`Field ${fieldName} not found in table: ${table}`);
                            continue; // Skip to next table if the company isn't found
                        }
    
                        // Check if the field exists in the fetched data
                        if (data.hasOwnProperty(fieldName)) {
                            console.log(`Field ${fieldName} found in table: ${table}`);
                            // Update the field
                            const { data: updateData, error: updateError } = await supabase
                                .from(table)
                                .update({ [fieldName]: editValue })
                                .eq(table === 'ecitizen_companies_duplicate' ? 'name' : 'company_name', companyName);
    
                            if (updateError) {
                                throw updateError;
                            }
    
                            console.log(`Updated field ${fieldName} in table: ${table}`);
                            setEditValue(editValue); // Trigger local state update after successful update
                            fieldFound = true;
                            onSave(editValue); // Call onSave to trigger data refresh
                            setIsEditing(false);
                            break; // Stop searching once the field is updated
                        } else {
                            console.log(`Field ${fieldName} not found in table: ${table}`);
                        }
                    }
    
                    // If the field is not found in any of the tables
                    if (!fieldFound) {
                        console.log(`Field ${fieldName} not found in any table.`);
                        toast.error(`Field "${fieldName}" not found in any table.`);
                    }
                } catch (error) {
                    console.error('Error during update operation:', error);
                    toast.error('Update failed due to an unexpected error');
                    setEditValue(initialValue); // Reset to initial value on error
                }
            }
        };
    
        const handleDoubleClick = () => {
            setIsEditing(true);
        };
    
        const handleBlur = () => {
            handleSave();
        };
    
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
            if (e.key === 'Escape') {
                setEditValue(initialValue);
                setIsEditing(false);
            }
        };
    
        const handleChange = (e) => {
            let newValue = e.target.value;
    
            // Add null check when accessing field.type
            if (field?.type === 'number') {
                newValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : newValue;
            } else if (field?.type === 'boolean') {
                newValue = newValue.toLowerCase() === 'true' || newValue.toLowerCase() === 'yes';
            } else if (field?.type === 'date') {
                newValue = newValue;
            } else if (field?.type === 'select') {
                newValue = e.target.value; // Handle select value change
            }
    
            setEditValue(newValue);
        };
    
        useEffect(() => {
            if (isEditing && inputRef.current) {
                inputRef.current.focus();
                if (inputRef.current.select) { // Check if select() is a function
                    inputRef.current.select();
                }
            }
        }, [isEditing]);
    
        if (isEditing) {
            if (field.type === 'select') {
                return (
                    <select
                        ref={inputRef}
                        value={editValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={`m-0 p-1 h-8 ${className}`}
                    >
                        {field.options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            } else {
                return (
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={`m-0 p-1 h-8 ${className}`}
                        type={field.type === 'date' ? 'date' : 'text'}
                    />
                );
            }
        }
    
        let displayValue = editValue;
        if (field.type === 'boolean') {
            displayValue = editValue ? 'Yes' : 'No';
        } else if (field.type === 'date' && editValue) {
            try {
                displayValue = new Date(editValue).toLocaleDateString();
            } catch (e) {
                displayValue = editValue;
            }
        }
    
        return (
            <div
                onDoubleClick={handleDoubleClick}
                className={`cursor-pointer ${className}`}
            >
                {displayValue || <span className="text-red-500 font-semibold">Missing</span>}
            </div>
        );
    };
    
    const sectionsWithSeparators = [
        { name: 'index', fields: [{ name: 'index', label: '#' }], label: '#' },
        { isSeparator: true },
        { name: 'companyDetails', fields: formFields.companyDetails.fields, label: 'Company Details' },
        { isSeparator: true },
        // { name: 'kraDetails', fields: formFields.kraDetails.fields, label: 'KRA Details' },
        // { isSeparator: true },
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
        fetchAllData();

        // Add event listener for data refresh
        const handleRefresh = () => fetchAllData();
        window.addEventListener('refreshData', handleRefresh);

        return () => {
            window.removeEventListener('refreshData', handleRefresh);
        };
    }, []);

    const fetchAllData = async () => {
        try {
            // Fetch data from all company-related tables concurrently
            const [
                { data: companies, error: companiesError },
                { data: users, error: usersError },
                { data: directors, error: directorsError },
                { data: nssfData, error: nssfError },
                { data: nhifData, error: nhifError },
                { data: passwordCheckers, error: passwordCheckersError },
                { data: ecitizenData, error: ecitizenError },
                { data: etimsData, error: etimsError },
                { data: accPortalDirectors, error: accPortalDirectorsError }
            ] = await Promise.all([
                supabase.from('acc_portal_company_duplicate').select('*').order('id', { ascending: true }),
                supabase.from('acc_portal_clerk_users_duplicate').select('*'),
                supabase.from('acc_portal_directors_duplicate').select('*'),
                supabase.from('nssf_companies_duplicate').select('*'),
                supabase.from('nhif_companies_duplicate2').select('*'),
                supabase.from('PasswordChecker_duplicate').select('*'),
                supabase.from('ecitizen_companies_duplicate').select('*'),
                supabase.from('etims_companies_duplicate').select('*'),
                supabase.from('acc_portal_directors_duplicate').select('*')
            ]);

            // Handle any errors that occurred during the fetch
            if (companiesError || usersError || directorsError || nssfError || nhifError || passwordCheckersError || ecitizenError || etimsError || accPortalDirectorsError) {
                console.error('Error fetching data from one or more tables:', {
                    companiesError,
                    usersError,
                    directorsError,
                    nssfError,
                    nhifError,
                    passwordCheckersError,
                    ecitizenError,
                    etimsError,
                    accPortalDirectorsError
                });
                toast.error('Failed to fetch data from one or more tables');
                return;
            }

            // Group and combine the data
            const groupedData = companies.map(company => {
                const user = users.find(u => u.userid === company.userid);
                const companyDirectors = directors.filter(d => d.company_name === company.company_name);
                const nssfInfo = nssfData.find(n => n.company_name === company.company_name);
                const nhifInfo = nhifData.find(n => n.company_name === company.company_name);
                const passwordCheckerInfo = passwordCheckers.find(p => p.company_name === company.company_name);
                const ecitizenInfo = ecitizenData.find(e => e.name === company.company_name);
                const etimsInfo = etimsData.find(e => e.company_name === company.company_name);
                const accPortalDirectorInfo = accPortalDirectors.filter(d => d.company_id === company.id); // Assuming company_id links to directors

                return {
                    company: {
                        ...company,
                        ...user?.metadata,
                        ...nssfInfo,
                        ...nhifInfo,
                        ...passwordCheckerInfo,
                        ...etimsInfo,
                        ...ecitizenInfo,
                    },
                    directors: accPortalDirectorInfo,
                    rows: [{
                        ...company,
                        ...user?.metadata,
                        ...nssfInfo,
                        ...nhifInfo,
                        ...passwordCheckerInfo,
                        ...ecitizenInfo,
                        ...etimsInfo,
                        isFirstRow: true
                    }],
                    rowSpan: 1
                };
            });

            setData(groupedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const renderSeparatorCell = (key, type = 'section', rowSpan = 1) => {
        const separatorWidths = {
            mini: 'w-1',      // 4px
            category: 'w-2',  // 8px
            section: 'w-4'    // 16px
        };

        const separatorColors = {
            mini: 'bg-gray-100',
            category: 'bg-gray-200',
            section: 'bg-gray-300'
        };

        return (
            <TableCell
                key={key}
                className={`${separatorWidths[type]} ${separatorColors[type]} p-0 border-x border-gray-300`}
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

    // Calculate section and column references
    const generateReferences = () => {
        let sectionRef = 1;
        let columnRef = 1;
        const references = {
            sections: {},
            columns: {}
        };

        processedSections.forEach(section => {
            if (!section.isSeparator) {
                references.sections[section.name] = sectionRef++;

                section.categorizedFields?.forEach(category => {
                    if (!category.isSeparator) {
                        category.fields.forEach(field => {
                            references.columns[field.name] = columnRef++;
                        });
                    }
                });
            }
        });

        return references;
    };

    const references = generateReferences();

    // Add this handler function
    const handleCompanyClick = (company) => {
        setSelectedCompany(company);
        setIsEditDialogOpen(true);
    };

    // Add this handler for after successful edit
    const handleEditSave = (updatedData) => {
        // Update the local data
        const newData = data.map(item => {
            if (item.company.id === updatedData.id) {
                return {
                    ...item,
                    company: updatedData
                };
            }
            return item;
        });
        setData(newData);
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
                {/* Controls and buttons container */}
                <div className="space-y-4">
                    {/* Search and filters row */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {/* Global search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={globalFilter}
                                    onChange={(e) => handleGlobalSearch(e.target.value)}
                                    placeholder="Search all columns..."
                                    className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>


                        </div>

                        {/* Import/Export buttons */}
                        <div className="flex gap-2">

                            <SettingsDialog />
                            <Button
                                onClick={() => setIsImportDialogOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Import
                            </Button>
                            <Button
                                onClick={handleExport}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[900px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    {/* Section Reference Row */}
                                    <TableRow className="bg-yellow-50">
                                        <TableHead className="font-medium">Sec REF</TableHead>
                                        {processedSections.slice(1).map((section, index) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <>
                                                        {renderSeparatorCell(`sec-ref-sep-${index}`, 'section')}
                                                        <TableHead
                                                            className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                        >
                                                            0
                                                        </TableHead>
                                                        {renderSeparatorCell(`sec-ref-sep-${index}`, 'section')}
                                                    </>
                                                );
                                            }

                                            const colSpan = section.categorizedFields?.reduce((total, cat) =>
                                                total + (cat.isSeparator ? 1 : cat.fields.length), 0);

                                            return (
                                                <>
                                                    <TableHead
                                                        key={`sec-ref-${section.name}`}
                                                        colSpan={colSpan}
                                                        className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                    >
                                                        {index + 1}
                                                    </TableHead>
                                                    {index < processedSections.length - 2 && renderSeparatorCell(`sec-ref-end-${index}`, 'section')}
                                                </>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Section Headers */}
                                    <TableRow>
                                        <TableHead className="font-medium bg-blue-600 text-white">Section</TableHead>
                                        {processedSections.slice(1).map((section, index) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <>
                                                        {renderSeparatorCell(`section-sep-${index}`, 'section')}
                                                        <TableHead className="text-center text-white bg-red-600">Missing Fields</TableHead>
                                                        {renderSeparatorCell(`section-sep-${index}`, 'section')}
                                                    </>
                                                );
                                            }

                                            const colSpan = section.categorizedFields?.reduce((total, cat) =>
                                                total + (cat.isSeparator ? 1 : cat.fields.length), 0);

                                            const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

                                            return (
                                                <>
                                                    <TableHead
                                                        key={`section-${section.name}`}
                                                        colSpan={colSpan}
                                                        className={`text-center text-white ${sectionColor}`}
                                                    >
                                                        {section.label}
                                                    </TableHead>
                                                    {index < processedSections.length - 2 && renderSeparatorCell(`section-end-${index}`, 'section')}
                                                </>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Category Headers */}
                                    <TableRow>
                                        <TableHead className="font-medium">Category</TableHead>
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <>
                                                        {renderSeparatorCell(`cat-sep-${sectionIndex}`, 'section')}
                                                        <TableHead className="text-center bg-red-50 text-red-700">Per Row</TableHead>
                                                        {renderSeparatorCell(`cat-sep-${sectionIndex}`, 'section')}
                                                    </>

                                                );
                                            }

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(`cat-${sectionIndex}-${catIndex}`, 'category');
                                                }

                                                // Group fields by subCategory to calculate spans and separators
                                                const subCategories = category.fields.reduce((acc, field) => {
                                                    const subCat = field.subCategory || 'default';
                                                    if (!acc[subCat]) acc[subCat] = [];
                                                    acc[subCat].push(field);
                                                    return acc;
                                                }, {});

                                                const categoryColor = categoryColors[category.category] ||
                                                    { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

                                                const totalFields = Object.values(subCategories).reduce((sum, fields) => sum + fields.length, 0);
                                                const midPoint = Math.floor(totalFields / 2);
                                                let currentCount = 0;

                                                return Object.entries(subCategories).map(([subCat, fields], subIndex, subArray) => {
                                                    const cell = (
                                                        <>
                                                            <TableHead
                                                                key={`cat-${sectionIndex}-${catIndex}-${subIndex}`}
                                                                colSpan={fields.length}
                                                                className={`text-center align-middle ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                                                            >
                                                                {currentCount <= midPoint && midPoint < (currentCount + fields.length) ? category.category : ''}
                                                            </TableHead>
                                                            {/* Add empty separator cell if not the last subcategory */}
                                                            {subIndex < subArray.length - 1 && (
                                                                <TableCell
                                                                    key={`cat-sep-${sectionIndex}-${catIndex}-${subIndex}`}
                                                                    className={`p-0 ${categoryColor.bg} ${categoryColor.border}`}
                                                                />
                                                            )}
                                                        </>
                                                    );
                                                    currentCount += fields.length;
                                                    return cell;
                                                });
                                            });
                                        })}
                                    </TableRow>

                                    {/* Column Reference Row */}
                                    <TableRow className="bg-yellow-50">
                                        <TableHead className="font-medium">CLM REF</TableHead>
                                        {(() => {
                                            let columnCounter = 1;
                                            return processedSections.slice(1).map((section, sectionIndex) => {
                                                if (section.isSeparator) {
                                                    return (
                                                        <>
                                                            {renderSeparatorCell(`col-ref-sep-${sectionIndex}`, 'section')}
                                                            <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200">-</TableHead>
                                                            {renderSeparatorCell(`col-ref-sep-${sectionIndex}`, 'section')}
                                                        </>
                                                    )
                                                }

                                                return section.categorizedFields?.map((category, catIndex) => {
                                                    if (category.isSeparator) {
                                                        return renderSeparatorCell(`col-ref-cat-${catIndex}`, 'category');
                                                    }

                                                    return category.fields.map((field, fieldIndex, fieldsArray) => (
                                                        <>
                                                            <TableHead
                                                                key={`col-ref-${columnCounter}`}
                                                                className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                            >
                                                                {columnCounter++}
                                                            </TableHead>
                                                            {fieldIndex < fieldsArray.length - 1 &&
                                                                field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                                renderSeparatorCell(`col-ref-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                                                        </>
                                                    ));
                                                });
                                            });
                                        })()}
                                    </TableRow>

                                    {/* Column Headers */}
                                    <TableRow>
                                        <TableHead className="font-medium">Field</TableHead>
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <>
                                                        {renderSeparatorCell(`col-sep-${sectionIndex}`, 'section')}
                                                        <TableHead className="whitespace-nowrap bg-red-500 text-white">Missing Count</TableHead>
                                                        {renderSeparatorCell(`col-sep-${sectionIndex}`, 'section')}
                                                    </>
                                                )
                                            }

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(`col-cat-${sectionIndex}-${catIndex}`, 'category');
                                                }

                                                return category.fields.map((field, fieldIndex, fieldsArray) => (
                                                    <>
                                                        <TableHead
                                                            key={`col-${field.name}`}
                                                            className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white`}
                                                        >
                                                            {field.label}
                                                        </TableHead>
                                                        {fieldIndex < fieldsArray.length - 1 &&
                                                            field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                            renderSeparatorCell(`col-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                                                    </>
                                                ));
                                            });
                                        })}
                                    </TableRow>

                                    {/* Statistics Rows */}
                                    <TableRow className="bg-blue-50">
                                        <TableHead className="font-semibold text-blue-900 text-start">Total</TableHead>
                                        {renderSeparatorCell(`total-first-separator`, 'section')}
                                        <TableCell className="text-center font-medium text-blue-700">
                                            {Object.values(data).reduce((sum, company) => sum + getMissingFields(company.rows[0]).length, 0)}
                                        </TableCell>

                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(
                                                    `total-sec-sep-${sectionIndex}`,
                                                    'section'
                                                );
                                            }

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(
                                                        `total-cat-sep-${sectionIndex}-${catIndex}`,
                                                        'category'
                                                    );
                                                }

                                                return category.fields.map((field, fieldIndex, fieldsArray) => (
                                                    <>
                                                        <TableCell
                                                            key={`total-${field.name}`}
                                                            className="text-center font-medium text-blue-700"
                                                        >
                                                            {calculateFieldStats(field.name, data).total}
                                                        </TableCell>
                                                        {fieldIndex < fieldsArray.length - 1 &&
                                                            field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                            renderSeparatorCell(
                                                                `total-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                                                                'mini'
                                                            )}
                                                    </>
                                                ));
                                            });
                                        })}
                                    </TableRow>

                                    <TableRow className="bg-green-50">
                                        <TableHead className="font-semibold text-green-900 text-start">Completed</TableHead>
                                        {renderSeparatorCell(`completed-first-separator`, 'section')}
                                        <TableCell className="text-center font-medium text-green-700">-</TableCell>
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(
                                                    `completed-sec-sep-${sectionIndex}`,
                                                    'section'
                                                );
                                            }

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(
                                                        `completed-cat-sep-${sectionIndex}-${catIndex}`,
                                                        'category'
                                                    );
                                                }

                                                return category.fields.map((field, fieldIndex, fieldsArray) => (
                                                    <>
                                                        <TableCell
                                                            key={`completed-${field.name}`}
                                                            className="text-center font-medium text-green-700"
                                                        >
                                                            {calculateFieldStats(field.name, data).completed}
                                                        </TableCell>
                                                        {fieldIndex < fieldsArray.length - 1 &&
                                                            field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                            renderSeparatorCell(
                                                                `completed-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                                                                'mini'
                                                            )}
                                                    </>
                                                ));
                                            });
                                        })}
                                    </TableRow>

                                    <TableRow className="bg-red-50">
                                        <TableHead className="font-semibold text-red-900 text-start">Pending</TableHead>
                                        {renderSeparatorCell(`pending-first-separator`, 'section')}
                                        <TableCell className="text-center font-medium text-red-700">-</TableCell>
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(
                                                    `pending-sec-sep-${sectionIndex}`,
                                                    'section'
                                                );
                                            }

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(
                                                        `pending-cat-sep-${sectionIndex}-${catIndex}`,
                                                        'category'
                                                    );
                                                }

                                                return category.fields.map((field, fieldIndex, fieldsArray) => (
                                                    <>
                                                        <TableCell
                                                            key={`pending-${field.name}`}
                                                            className="text-center font-medium text-red-700"
                                                        >
                                                            {calculateFieldStats(field.name, data).pending}
                                                        </TableCell>
                                                        {fieldIndex < fieldsArray.length - 1 &&
                                                            field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                            renderSeparatorCell(
                                                                `pending-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                                                                'mini'
                                                            )}
                                                    </>
                                                ));
                                            });
                                        })}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredData.map((companyGroup, groupIndex) => (
                                        companyGroup.rows.map((row, rowIndex) => (
                                            <TableRow
                                                key={`${groupIndex}-${rowIndex}`}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Index cell */}
                                                {rowIndex === 0 && (
                                                    <TableCell
                                                        className="whitespace-nowrap font-medium"
                                                        rowSpan={companyGroup.rowSpan}
                                                    >
                                                        {groupIndex + 1}
                                                    </TableCell>
                                                )}

                                                {rowIndex === 0 && (
                                                    <>
                                                        {renderSeparatorCell(`first-separator-${groupIndex}`, 'section', companyGroup.rowSpan)}
                                                        <TableCell
                                                            className="whitespace-nowrap cursor-pointer hover:bg-gray-100"
                                                            rowSpan={companyGroup.rowSpan}
                                                            onClick={() => {
                                                                setSelectedMissingFields({
                                                                    ...companyGroup.company,
                                                                    missingFields: getMissingFields(row)
                                                                });
                                                                setIsMissingFieldsOpen(true);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-red-600">
                                                                    {getMissingFields(row).length}
                                                                </span>
                                                                <span>Missing Fields</span>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}

                                                {/* Data cells with separators */}
                                                {processedSections.slice(1).map((section, sectionIndex) => {
                                                    if (section.isSeparator) {
                                                        return rowIndex === 0 && renderSeparatorCell(
                                                            `body-sec-sep-${groupIndex}-${sectionIndex}`,
                                                            'section',
                                                            companyGroup.rowSpan
                                                        );
                                                    }

                                                    return section.categorizedFields?.map((category, categoryIndex) => {
                                                        if (category.isSeparator) {
                                                            return rowIndex === 0 && renderSeparatorCell(
                                                                `body-cat-sep-${groupIndex}-${sectionIndex}-${categoryIndex}`,
                                                                'category',
                                                                companyGroup.rowSpan
                                                            );
                                                        }

                                                        return category.fields.map((field, fieldIndex, fieldsArray) => {
                                                            // Skip company-specific fields for non-first rows
                                                            if (field.name.startsWith('company_') && rowIndex > 0) {
                                                                return null;
                                                            }

                                                            // Get the field value
                                                            let value = row[field.name];

                                                            // Format value based on field type
                                                            if (field.type === 'boolean') {
                                                                value = value ? 'Yes' : 'No';
                                                            } else if (field.type === 'date' && value) {
                                                                try {
                                                                    value = new Date(value).toLocaleDateString();
                                                                } catch (e) {
                                                                    value = value;
                                                                }
                                                            }

                                                            const sectionColor = sectionColors[section.name]?.cell || 'bg-gray-50';

                                                            // Add separators between subcategories
                                                            const isSubCategoryChange = fieldIndex < fieldsArray.length - 1 &&
                                                                field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory;

                                                            return (
                                                                <>
                                                                    <TableCell
                                                                        key={`${groupIndex}-${rowIndex}-${field.name}`}
                                                                        className={`whitespace-nowrap ${sectionColor} transition-colors
        ${field.name === 'company_name' ? 'cursor-pointer hover:text-primary' : ''}`}
                                                                        onClick={field.name === 'company_name' ? () => handleCompanyClick(row) : undefined}
                                                                        rowSpan={field.name.startsWith('company_') ? companyGroup.rowSpan : 1}
                                                                    >
                                                                        <EditableCell
                                                                            value={value}
                                                                            onSave={async (newValue) => {
                                                                                try {
                                                                                    const { table, idField } = getTableMapping(field.name); // Ensure correct table mapping
                                                                                    const { error } = await supabase
                                                                                        .from(table)
                                                                                        .update({ [field.name]: newValue })
                                                                                        .eq(idField, row.id);

                                                                                    if (error) throw error;

                                                                                    // Update local state
                                                                                    const newData = data.map(group => {
                                                                                        if (group.company.id === row.id) {
                                                                                            return {
                                                                                                ...group,
                                                                                                company: { ...group.company, [field.name]: newValue },
                                                                                                rows: group.rows.map(r =>
                                                                                                    r.id === row.id ? { ...r, [field.name]: newValue } : r
                                                                                                )
                                                                                            };
                                                                                        }
                                                                                        return group;
                                                                                    });
                                                                                    setData(newData);

                                                                                    console.log('Updated successfully');
                                                                                } catch (error) {
                                                                                    console.error('Error updating:', error);
                                                                                    console.error('Failed to update');
                                                                                }
                                                                            }}
                                                                            fieldName={field.name}
                                                                            rowId={row.id}
                                                                            companyName={row.company_name}
                                                                            className={field.name === 'company_name' ? 'hover:text-primary' : ''}
                                                                            field={field}
                                                                            options={field.options}
                                                                        />
                                                                    </TableCell>


                                                                    {/* <TableCell
                                                                        key={`${groupIndex}-${rowIndex}-${field.name}`}
                                                                        className={`whitespace-nowrap transition-colors
                                                                            ${field.name === 'company_name' ? 'cursor-pointer hover:text-primary' : ''}
                                                                            ${categoryColors[field.category]?.bg || 'bg-gray-50'} 
                                                                            ${categoryColors[field.category]?.text || 'text-gray-700'}
                                                                            ${field.subCategory ? `border-l-2 ${categoryColors[field.category]?.border || 'border-gray-200'}` : ''}`}
                                                                        onClick={field.name === 'company_name' ? () => handleCompanyClick(row) : undefined}
                                                                        rowSpan={field.name.startsWith('company_') ? companyGroup.rowSpan : 1}
                                                                    >
                                                                        {value || <span className="text-red-500 font-semibold">Missing</span>}
                                                                    </TableCell> */}
                                                                    {isSubCategoryChange && rowIndex === 0 && renderSeparatorCell(
                                                                        `body-subcat-sep-${groupIndex}-${sectionIndex}-${categoryIndex}-${fieldIndex}`,
                                                                        'mini',
                                                                        companyGroup.rowSpan
                                                                    )}
                                                                </>
                                                            );
                                                        });
                                                    });
                                                })}
                                            </TableRow>
                                        ))
                                    ))}
                                    {/* No results message */}
                                    {filteredData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={100} className="text-center py-8 text-gray-500">
                                                No results found for your search criteria
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
                {isImportDialogOpen && <ImportDialog />}
                {selectedCompany && (
                    <CompanyEditDialog
                        isOpen={isEditDialogOpen}
                        onClose={() => setIsEditDialogOpen(false)}
                        companyData={selectedCompany}
                        onSave={handleEditSave}
                        references={references.columns}
                    />
                )}
                {selectedMissingFields && (
                    <MissingFieldsDialog
                        isOpen={isMissingFieldsOpen}
                        onClose={() => setIsMissingFieldsOpen(false)}
                        companyData={selectedMissingFields}
                        onSave={handleEditSave}
                    />
                )}
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


