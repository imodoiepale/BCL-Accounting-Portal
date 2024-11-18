/* eslint-disable react/jsx-key */
// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { EditableCell } from './components/overview/EditableCell';
import { ImportDialog } from './components/overview/Dialogs/ImportDialog';
import { renderSeparatorCell, Table, TableComponents } from './components/overview/TableComponents';

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
    const { filteredData, globalFilter, handleGlobalSearchSearch, columnVisibility, toggleColumnVisibility, sectionVisibility, toggleSectionVisibility, categoryVisibility, toggleCategoryVisibility, getVisibleColumns, resetAll } = useTableFunctionalities(data);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMissingFields, setSelectedMissingFields] = useState(null);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);
    const { sectionColors } = TableComponents;

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
                                onClick={() => handleExport(data, processedSections)}
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
                            <Table
                                data={filteredData}
                                processedSections={processedSections}
                                handleCompanyClick={handleCompanyClick}
                                onMissingFieldsClick={(company) => {
                                    setSelectedMissingFields({
                                        ...company,
                                        missingFields: getMissingFields(company)
                                    });
                                    setIsMissingFieldsOpen(true);
                                }}
                            />

                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
                {isImportDialogOpen && (
                    <ImportDialog
                        isOpen={isImportDialogOpen}
                        onClose={() => setIsImportDialogOpen(false)}
                        processedSections={processedSections}
                        onImport={(data) => {
                            // Handle imported data
                            setIsImportDialogOpen(false);
                        }}
                    />
                )}
                {selectedCompany && (
                    <CompanyEditDialog
                        isOpen={isEditDialogOpen}
                        onClose={() => setIsEditDialogOpen(false)}
                        companyData={selectedCompany}
                        onSave={handleEditSave}
                        references={references.columns}
                        processedSections={processedSections}
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


