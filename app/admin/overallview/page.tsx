// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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


    return (
        <ScrollArea className="h-[900px] rounded-md border">
            <Table>
                <TableHeader>
                    {/* Section Headers */}
                    <TableRow>
                        {processedSections.map((section, index) => {
                            if (section.isSeparator) {
                                return renderSeparatorCell(`separator-header-1-${index}`, true);
                            }

                            const totalColSpan = section.categorizedFields.reduce((total, cat) =>
                                total + (cat.isSeparator ? 1 : cat.fields.length), 0);

                            const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

                            return (
                                <TableHead
                                    key={section.name}
                                    colSpan={totalColSpan}
                                    className={`text-center ${sectionColor} text-white font-bold transition-colors`}
                                >
                                    {section.label}
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

                            const sectionColor = sectionColors[section.name]?.sub || 'bg-gray-500';

                            return section.categorizedFields.map((category, categoryIndex) => {
                                if (category.isSeparator) {
                                    return renderSeparatorCell(`cat-sep-${sectionIndex}-${categoryIndex}`, true);
                                }

                                return (
                                    <TableHead
                                    key={`${section.name}-${category.category}-${categoryIndex}`}
                                    colSpan={category.fields.length}
                                    className={`text-center ${categoryColors[category.category]?.bg || 'bg-gray-50'} 
                                                ${categoryColors[category.category]?.text || 'text-gray-700'} 
                                                ${categoryColors[category.category]?.border || 'border-gray-200'} 
                                                font-medium text-sm transition-colors`}
                                >
                                    {category.category}
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

                                return category.fields.map(field => (
                                    <TableHead
                                        key={`${section.name}-${field.name}`}
                                        className={`whitespace-nowrap ${sectionColor} text-white transition-colors`}
                                    >
                                        {field.label}
                                    </TableHead>
                                ));
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
    );
};

export default OverallView;