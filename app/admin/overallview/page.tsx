// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const CompanyGeneralTable = ({ data }) => {
    const generalFields = formFields.companyDetails.fields.filter(
        field => !field.category || field.category === 'General Information'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-100">
                    {generalFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                        {generalFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const CompanyTaxTable = ({ data }) => {
    const taxFields = formFields.companyDetails.fields.filter(
        field => field.category === 'KRA Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-sky-100">
                    {taxFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-sky-50">
                        {taxFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const DirectorsTable = ({ data }) => {
    const directorFields = formFields.directorDetails.fields;

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-emerald-100">
                    {directorFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((director, index) => (
                    <TableRow key={index} className="hover:bg-emerald-50">
                        {directorFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {director[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const ComplianceTable = ({ data }) => {
    const complianceFields = [
        ...formFields.companyDetails.fields.filter(field =>
            field.category === 'NSSF Details' ||
            field.category === 'NHIF Details' ||
            field.category === 'Housing Levy Details' ||
            field.category === 'Standard Levy Details'
        )
    ];

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-violet-100">
                    {complianceFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-violet-50">
                        {complianceFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const OverallView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const sectionColors = {
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
                    { data: companies, error: companiesError },
                    { data: suppliers, error: suppliersError },
                    { data: directors, error: directorsError },
                    { data: employees, error: employeesError },
                    { data: banks, error: banksError },
                    { data: passwordChecker, error: passwordCheckerError },
                    { data: nssfCompanies, error: nssfError },
                    { data: nhifCompanies, error: nhifError },
                    { data: ecitizenCompanies, error: ecitizenError }
                ] = await Promise.all([
                    supabase.from('acc_portal_company').select('*'),
                    supabase.from('acc_portal_pettycash_suppliers').select('*'),
                    supabase.from('acc_portal_directors').select('*'),
                    supabase.from('acc_portal_employees').select('*'),
                    supabase.from('acc_portal_banks').select('*'),
                    supabase.from('nssf_companies').select('*'),
                    supabase.from('nhif_companies').select('*'),
                    supabase.from('ecitizen_companies').select('*'),
                    supabase.from('PasswordChecker').select('*'),
                ]);

                if (companiesError) throw companiesError;
                if (suppliersError) throw suppliersError;
                if (directorsError) throw directorsError;
                if (employeesError) throw employeesError;
                if (banksError) throw banksError;
                if (passwordCheckerError) throw passwordCheckerError;
                if (nssfError) throw nssfError;
                if (nhifError) throw nhifError;
                if (ecitizenError) throw ecitizenError;

                // Modify the grouping to include new data
                const groupedData = companies.map(company => {
                    const companySuppliers = suppliers.filter(s => s.userid === company.userid);
                    const companyDirectors = directors.filter(d => d.userid === company.userid);
                    const companyEmployees = employees.filter(e => e.userid === company.userid);
                    const companyBanks = banks.filter(b => b.userid === company.userid);
                    const companyPasswordChecker = passwordChecker?.find(p => p.userid === company.userid);
                    const companyNSSF = nssfCompanies?.find(n => n.userid === company.userid);
                    const companyNHIF = nhifCompanies?.find(n => n.userid === company.userid);
                    const companyEcitizen = ecitizenCompanies?.find(e => e.userid === company.userid);


                    const maxRelatedRecords = Math.max(
                        companySuppliers.length,
                        companyDirectors.length,
                        companyEmployees.length,
                        companyBanks.length,
                        1
                    );

                    const rows = Array.from({ length: maxRelatedRecords }, (_, index) => ({
                        ...company,
                        ...(companySuppliers[index] || {}),
                        ...(companyDirectors[index] || {}),
                        ...(companyEmployees[index] || {}),
                        ...(companyBanks[index] || {}),
                        isFirstRow: index === 0 // Add flag for first row
                    }));

                    return {
                        company,
                        rows,
                        rowSpan: maxRelatedRecords
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

    const processedSections = sectionsWithSeparators.map(section => {
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
    });

    // Add new table components for each category
    const ClientCategoryTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Client Category'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-blue-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-blue-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    // Add new table components for each category
    const SheriaDetailsTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Sheria Details'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-blue-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-blue-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    const TaxStatusTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Tax Status'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-orange-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-orange-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    const ECitizenTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'E-Citizen Details'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-indigo-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-indigo-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (

        <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="client">Client Category</TabsTrigger>
                <TabsTrigger value="sheria">Sheria Details</TabsTrigger>
                <TabsTrigger value="ecitizen">E-Citizen</TabsTrigger>
                <TabsTrigger value="tax">Tax Status</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="statutory">Statutory</TabsTrigger>
                <TabsTrigger value="other">Other Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[900px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    {/* Section Headers */}
                                    <TableRow>
    {processedSections.map((section, sectionIndex) => {
        if (section.isSeparator) {
            return renderSeparatorCell(`separator-header-1-${sectionIndex}`, true);
        }

        const totalColSpan = section.categorizedFields.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

        const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';
        const sectionNumber = sectionIndex + 1;

        return (
            <TableHead
                key={section.name}
                colSpan={totalColSpan}
                className={`text-center ${sectionColor} text-white font-bold transition-colors`}
            >
                <div className="flex flex-col gap-1">
                    <span className="text-xs opacity-75">{sectionNumber}.0</span>
                    <span>{section.label}</span>
                </div>
            </TableHead>
        );
    })}
</TableRow>

                                    {/* Category Headers */}
                                    <TableRow>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(`category-separator-${sectionIndex}`, true);
                                            }

                                            return section.categorizedFields.map((category, categoryIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(`cat-sep-${sectionIndex}-${categoryIndex}`, true);
                                                }

                                                const sectionNumber = sectionIndex + 1;
                                                const categoryNumber = categoryIndex + 1;

                                                return (
                                                    <TableHead
                                                        key={`${section.name}-${category.category}-${categoryIndex}`}
                                                        colSpan={category.fields.length}
                                                        className={`text-center ${categoryColors[category.category]?.bg || 'bg-gray-50'} 
                              ${categoryColors[category.category]?.text || 'text-gray-700'} 
                              ${categoryColors[category.category]?.border || 'border-gray-200'} 
                              font-medium text-sm transition-colors`}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs opacity-75">{sectionNumber}.{categoryNumber}</span>
                                                            <span>{category.category}</span>
                                                        </div>
                                                    </TableHead>
                                                );
                                            });
                                        })}
                                    </TableRow>

                                    {/* Statistics Row */}
                                    <TableRow className="bg-gray-50">
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(`stats-separator-${sectionIndex}`, true);
                                            }

                                            const sectionColor = sectionColors[section.name]?.cell || 'bg-gray-50';

                                            return section.categorizedFields.map((category, categoryIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(`stats-cat-sep-${sectionIndex}-${categoryIndex}`, true);
                                                }

                                                return category.fields.map(field => {
                                                    const stats = columnStats[field.name] || { total: 0, completed: 0, pending: 0 };

                                                    return (
                                                        <TableHead
                                                            key={`stats-${field.name}`}
                                                            className={`p-2 ${sectionColor} transition-colors`}
                                                        >
                                                            <div className="flex flex-col gap-1 text-xs bg-white rounded-lg p-2 shadow-sm">
                                                                <div className="flex justify-center gap-2">
                                                                    <span className="text-blue-600 border-r pr-2">
                                                                        T: {stats.total}
                                                                    </span>
                                                                    <span className="text-green-600 border-r pr-2">
                                                                        C: {stats.completed}
                                                                    </span>
                                                                    <span className="text-red-600">
                                                                        P: {stats.pending}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1">
                                                                    <div
                                                                        className="bg-green-600 h-1 rounded-full transition-all"
                                                                        style={{
                                                                            width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </TableHead>
                                                    );
                                                });
                                            });
                                        })}
                                    </TableRow>

                                    {/* Column Headers */}
                                    <TableRow>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return renderSeparatorCell(`header-separator-${sectionIndex}`, true);
                                            }

                                            const sectionColor = sectionColors[section.name]?.sub || 'bg-gray-500';

                                            return section.categorizedFields.map((category, categoryIndex) => {
                                                if (category.isSeparator) {
                                                    return renderSeparatorCell(`header-cat-sep-${sectionIndex}-${categoryIndex}`, true);
                                                }

                                                return category.fields.map((field, fieldIndex) => {
                                                    // Calculate the column number
                                                    const sectionNumber = sectionIndex + 1;
                                                    const fieldNumber = fieldIndex + 1;
                                                    const columnNumber = `${sectionNumber}.${fieldNumber}`;

                                                    return (
                                                        <TableHead
                                                            key={`${section.name}-${field.name}`}
                                                            className={`whitespace-nowrap ${sectionColor} text-white transition-colors`}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs opacity-75">{columnNumber}</span>
                                                                <span>{field.label}</span>
                                                            </div>
                                                        </TableHead>
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
            </TabsContent>

            <TabsContent value="company">
                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="tax">Tax Details</TabsTrigger>
                        <TabsTrigger value="ecitizen">E-Citizen</TabsTrigger>
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

                    <TabsContent value="tax">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <CompanyTaxTable data={data} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="directors">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[700px]">
                            <DirectorsTable data={data.flatMap(company => company.directors)} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="compliance">
                <Tabs defaultValue="statutory" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="statutory">Statutory</TabsTrigger>
                        <TabsTrigger value="nssf">NSSF</TabsTrigger>
                        <TabsTrigger value="nhif">NHIF</TabsTrigger>
                        <TabsTrigger value="housing">Housing Levy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="statutory">
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
                </Tabs>
            </TabsContent>

            <TabsContent value="ecitizen">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[700px]">
                            <ECitizenTable data={data} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>


            <TabsContent value="tax">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[700px]">
                            <TaxStatusTable data={data} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="payroll">
                <Tabs defaultValue="employees" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="employees">Employees</TabsTrigger>
                        <TabsTrigger value="payroll">Payroll</TabsTrigger>
                        <TabsTrigger value="deductions">Deductions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees">
                        <Card>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[700px]">
                                    <EmployeesTable data={data.flatMap(company => company.employees)} />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payroll">
                        <Card>
                            <CardContent className="p-0">
                                {/* <ScrollArea className="h-[700px]">
                                    <PayrollTable data={data.flatMap(company => company.employees)} />
                                </ScrollArea> */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="banking">
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

            <TabsContent value="client">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[700px]">
                            <ClientCategoryTable data={data} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="sheria">
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[700px]">
                            <SheriaDetailsTable data={data} />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    );
};

// Additional table components
const NSSFTable = ({ data }) => {
    const nssfFields = formFields.companyDetails.fields.filter(
        field => field.category === 'NSSF Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-emerald-100">
                    {nssfFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-emerald-50">
                        {nssfFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {item[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const NHIFTable = ({ data }) => {
    const nhifFields = formFields.companyDetails.fields.filter(
        field => field.category === 'NHIF Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-teal-100">
                    {nhifFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-teal-50">
                        {nhifFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {item[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const EmployeesTable = ({ data }) => {
    const employeeFields = formFields.employeeDetails.fields;

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-rose-100">
                    {employeeFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((employee, index) => (
                    <TableRow key={index} className="hover:bg-rose-50">
                        {employeeFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {employee[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const BankingTable = ({ data }) => {
    const bankFields = formFields.bankDetails.fields;

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-amber-100">
                    {bankFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((bank, index) => (
                    <TableRow key={index} className="hover:bg-amber-50">
                        {bankFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {bank[field.name] || <span className="text-red-500 font-medium">N/A</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default OverallView;