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
import { SettingsDialog } from './components/settingsDialog';


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
        fetchAllData();
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
    const renderSeparatorCell = (sectionIndex: number, categoryIndex: number, type: string) => {
        const uniqueKey = `separator-${type}-${sectionIndex}-${categoryIndex}-${Date.now()}`;
        return (
            <TableCell
                key={uniqueKey}
                className="bg-gray-200 w-4 p-0 border-x border-gray-300"
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
                                            if (section.isSeparator) return renderSeparatorCell(`sec-ref-sep-${index}`);

                                            const colSpan = section.categorizedFields?.reduce((total, cat) =>
                                                total + (cat.isSeparator ? 1 : cat.fields.length), 0);

                                            return (
                                                <TableHead
                                                    key={`sec-ref-${section.name}`}
                                                    colSpan={colSpan}
                                                    className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                >
                                                    {index + 1}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Section Headers */}
                                    <TableRow>
                                        <TableHead className="font-medium bg-blue-600 text-white">Section</TableHead>
                                        {processedSections.slice(1).map((section, index) => {
                                            if (section.isSeparator) return renderSeparatorCell(`section-sep-${index}`);

                                            const colSpan = section.categorizedFields?.reduce((total, cat) =>
                                                total + (cat.isSeparator ? 1 : cat.fields.length), 0);

                                            const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

                                            return (
                                                <TableHead
                                                    key={`section-${section.name}`}
                                                    colSpan={colSpan}
                                                    className={`text-center text-white ${sectionColor}`}
                                                >
                                                    {section.label}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Category Headers */}
                                    <TableRow>
                                        <TableHead className="font-medium ">Category</TableHead>
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`cat-sep-${sectionIndex}`);

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) return renderSeparatorCell(`cat-${sectionIndex}-${catIndex}`);

                                                const categoryColor = categoryColors[category.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

                                                return (
                                                    <TableHead
                                                        key={`cat-${sectionIndex}-${catIndex}`}
                                                        colSpan={category.fields.length}
                                                        className={`text-center ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                                                    >
                                                        {category.category}
                                                    </TableHead>
                                                );
                                            });
                                        })}
                                    </TableRow>
                                    {/* Column Reference Row */}
                                    <TableRow className="bg-yellow-50">
                                        <TableHead className="font-medium">CLM REF</TableHead>
                                        {(() => {
                                            let columnCounter = 1;
                                            return processedSections.slice(1).map(section => {
                                                if (section.isSeparator) {
                                                    return renderSeparatorCell(`col-ref-sep-${columnCounter}`);
                                                }
                                                return section.categorizedFields?.map(category => {
                                                    if (category.isSeparator) {
                                                        return renderSeparatorCell(`col-ref-cat-${columnCounter}`);
                                                    }
                                                    return category.fields.map(field => (
                                                        <TableHead
                                                            key={`col-ref-${columnCounter}`}
                                                            className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                        >
                                                            {columnCounter++}
                                                        </TableHead>
                                                    ));
                                                });
                                            });
                                        })()}
                                    </TableRow>


                                    {/* Column Headers */}
                                    <TableRow>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(sectionIndex, 0, 'section');
                                            }

                                            return section.categorizedFields?.map((category, categoryIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(sectionIndex, categoryIndex, 'category');
                                                }

                                                return category.fields.map(field => (
                                                    <TableHead
                                                        key={`col-${field.name}`}
                                                        className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white`} >
                                                        {field.label}
                                                    </TableHead>
                                                ));
                                            });
                                        })}
                                    </TableRow>
                                    {/* Statistics Rows */}
                                    <TableRow className="bg-blue-50">

                                        <TableHead className="font-semibold text-blue-900 text-start">Total</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`total-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) return renderSeparatorCell(`total-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`);

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

                                        <TableHead className="font-semibold text-green-900 text-start">Completed</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`completed-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) return renderSeparatorCell(`completed-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`);

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

                                        <TableHead className="font-semibold text-red-900 text-start">Pending</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`pending-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) return renderSeparatorCell(`pending-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`);

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
                                    </TableRow>                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((companyGroup, groupIndex) => (
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

                                                            // Return the appropriate cell based on field name
                                                            return field.name === 'company_name' ? (
                                                                <TableCell
                                                                    key={`${groupIndex}-${rowIndex}-${field.name}`}
                                                                    className={`whitespace-nowrap ${sectionColor} transition-colors cursor-pointer hover:text-primary`}
                                                                    onClick={() => handleCompanyClick(row)}
                                                                    rowSpan={field.name.startsWith('company_') ? companyGroup.rowSpan : 1}
                                                                >
                                                                    {value || <span className="text-red-500 font-semibold">Missing</span>}
                                                                </TableCell>
                                                            ) : (
                                                                <TableCell
                                                                    key={`${groupIndex}-${rowIndex}-${field.name}`}
                                                                    className={`whitespace-nowrap ${sectionColor} transition-colors`}
                                                                    rowSpan={field.name.startsWith('company_') ? companyGroup.rowSpan : 1}
                                                                >
                                                                    {value || <span className="text-red-500 font-semibold">Missing</span>}
                                                                </TableCell>
                                                            );
                                                        });
                                                    });
                                                })}
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                                {/* Add a "No results found" message when filtered data is empty */}
                                {filteredData.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No results found for your search criteria
                                    </div>
                                )}
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


