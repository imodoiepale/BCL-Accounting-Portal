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

        // Process data in the desired structure, with section/category labels only on first occurrence
        processedSections.forEach(section => {
            if (!section.isSeparator) {
                let currentSection = section.label;

                section.categorizedFields?.forEach(category => {
                    if (!category.isSeparator) {
                        let currentCategory = category.category;

                        category.fields.forEach((field, fieldIndex) => {
                            if (field.name !== '#' && field.name !== 'General' && field.name !== '#_1') {
                                const row = [
                                    fieldIndex === 0 ? currentSection : '',  // Show section only for first field
                                    fieldIndex === 0 ? currentCategory : '', // Show category only for first field
                                    field.label,
                                    ...data.map(item => item.company[field.name] || '')
                                ];
                                exportRows.push(row);
                            }
                        });
                    }
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
            for (let colIndex = 0; colIndex < 6; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                ws[cellAddress] = ws[cellAddress] || { v: '', t: 's' };
                ws[cellAddress].s = {};
            }
        }

        // Define colors for different sections and categories
        const sectionColors = {
            'Basic Information': 'FFE6E6',  // Light Red
            'Financial Details': 'E6FFE6',  // Light Green
            'Contact Information': 'E6E6FF', // Light Blue
            'Operations': 'FFFFE6',         // Light Yellow
            'Compliance': 'FFE6FF',         // Light Purple
            'Other': 'E6FFFF'              // Light Cyan
        };

        const categoryColors = {
            'General': 'F0F0F0',           // Light Gray
            'Financial': 'E6FFE6',         // Light Green
            'Contact': 'E6E6FF',           // Light Blue
            'Address': 'FFE6E6',           // Light Red
            'Legal': 'FFE6FF'              // Light Purple
        };

        // Apply colors to header row
        const headerRow = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: exportRows[0].length - 1 } });
        Object.keys(ws).forEach(cell => {
            if (headerRow.includes(cell)) {
                ws[cell].s = {
                    fill: { fgColor: { rgb: 'CCCCCC' }, patternType: 'solid' },
                    font: { bold: true }
                };
            }
        });

        // Apply colors to data rows based on section and category
        let lastSection = '';
        let lastCategory = '';

        for (let rowIndex = 1; rowIndex < exportRows.length; rowIndex++) {
            const section = exportRows[rowIndex][0] || lastSection;
            const category = exportRows[rowIndex][1] || lastCategory;

            lastSection = section;
            lastCategory = category;

            const sectionColor = sectionColors[section] || 'FFFFFF';
            const categoryColor = categoryColors[category] || 'FFFFFF';

            // Apply section color to section column
            const sectionCell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
            ws[sectionCell].s = {
                fill: { fgColor: { rgb: sectionColor }, patternType: 'solid' }
            };

            // Apply category color to category column
            const categoryCell = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
            ws[categoryCell].s = {
                fill: { fgColor: { rgb: categoryColor }, patternType: 'solid' }
            };

            // Apply lighter version of section color to remaining cells
            for (let colIndex = 2; colIndex < exportRows[rowIndex].length; colIndex++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                ws[cellAddress].s = {
                    fill: { fgColor: { rgb: sectionColor + '80' }, patternType: 'solid' }
                };
            }
        }

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

            if (!parsedData || !parsedData.length) {
                throw new Error('No data found in the imported file');
            }

            console.log('Raw Parsed Data:', parsedData);
            const firstRow = parsedData[0];
            if (!firstRow) {
                throw new Error('No data rows found in the imported file');
            }

            const valueColumns = Object.keys(firstRow).filter(key =>
                key !== '#' &&
                key !== 'General' &&
                key !== '#_1' &&
                !key.includes('Section') &&
                !key.includes('Category')
            );

            if (!valueColumns.length) {
                throw new Error('No valid columns found in the imported file');
            }
            const companiesMap = new Map();

            valueColumns.forEach((colName) => {
                companiesMap.set(colName, {
                    mainCompany: {
                        company_name: null,
                        company_type: null,
                        company_status: null,
                        description: null,
                        registration_number: null,
                        date_established: null,
                        industry: null,
                        employees: null,
                        annual_revenue: null,
                        fiscal_year: null,
                        website: null,
                        company_email: null,
                        phone: null,
                        street: null,
                        city: null,
                        postal_code: null,
                        country: null,
                        status: '',
                        housing_levy_identifier: null,
                        housing_levy_password: null,
                        housing_levy_status: null,
                        standard_levy_identifier: null,
                        standard_levy_password: null,
                        standard_levy_status: null,
                        tourism_levy_identifier: null,
                        tourism_levy_password: null,
                        tourism_levy_status: null,
                        tourism_fund_username: null,
                        tourism_fund_password: null,
                        vat_identifier: null,
                        vat_password: null,
                        vat_status: null,
                        vat_from: null,
                        vat_to: null,
                        nature_of_business: null,
                        audit_period: null,
                        sale_terms: null,
                        tcc_expiry_date: null,
                        tcc_reminders_notice_days: null,
                        tcc_reminder_date: null,
                        good_conduct_issue_date: null,
                        co_cert_number: null,
                        co_registration_date: null,
                        co_nssf_number: null,
                        verified_status: null,
                        bo_status: null,
                        co_cr_12_issue_date: null,
                        cr_12_as_at_date_of_issue: null,
                        cr_12_reminders_notice_days: null,
                        cr_12_reminder_date: null,
                        wh_vat_agent_customers: null,
                        wh_vat_agent_suppliers: null,
                        account_manager: null,
                        name_verified_with_pin: null,
                        client_category: null,
                        nita_identifier: null,
                        nita_password: null,
                        nita_status: null,
                    },

                    nssfDetails: {
                        company_name: null,
                        nssf_identifier: null,
                        nssf_password: null,
                        nssf_status: 'Pending',
                        nssf_code: null,
                        nssf_compliance_certificate_date: null,
                        nssf_registration_date: null,
                        status: null
                    },
                    nhifDetails: {
                        company_name: null,
                        nhif_identifier: null,
                        nhif_password: null,
                        nhif_status: 'Pending',
                        nhif_code: null,
                        director: null,
                        nhif_mobile: null,
                        nhif_email: null,
                        nhif_email_password: null,
                        nhif_registration_date: null,
                        nhif_compliance_certificate_date: null,
                    },
                    pinDetails: {
                        company_name: null,
                        kra_pin: null,
                        kra_password: null,
                        pin_certification_profile_download_dates: null,
                        pin_status: null,
                        itax_status: null,
                        income_tax_resident_individual_status: null,
                        income_tax_resident_individual_from: null,
                        income_tax_resident_individual_to: null,
                        income_tax_rent_income_current_status: null,
                        income_tax_rent_income_effective_from: null,
                        income_tax_rent_income_effective_to: null,
                        income_tax_paye_current_status: null,
                        income_tax_paye_effective_from: null,
                        income_tax_paye_effective_to: null,
                        income_tax_turnover_tax_current_status: null,
                        income_tax_turnover_tax_effective_from: null,
                        income_tax_turnover_tax_effective_to: null,
                        annual_income: null,
                        tax_year_end: null,
                        current_itax_gmail_yahoo_email_recovery: null,
                        current_tax_password: null,
                        current_itax_gmail_email: null,
                        current_itax_system_gmail_password: null,
                        current_itax_gmail_email_recovery_mobile: null,
                        pin_station: null,
                        pin_station_manager_name: null,
                        pin_station_manager_mobile: null,
                    },
                    ecitizenDetails: {
                        name: null,
                        ecitizen_password: null,
                        ecitizen_status: 'Pending',
                        director: null,
                        ecitizen_id: null,
                        ecitizen_mobile: null,
                        ecitizen_email: null,
                    },
                    etimsDetails: {
                        company_name: null,
                        etims_username: null,
                        etims_cert_incorporation: null,
                        etims_pin: null,
                        etims_comment: null,
                        etims_director_pin: null,
                        etims_current_director_pin: null,
                        etims_operator_name: null,
                        etims_operator_id_number: null,
                        etims_password: null,
                        etims_mobile: null,
                        etims_email: null,
                        etims_reg_doc_number: null
                    },
                    accPortalDirectors: {
                        company_id: null,
                        first_name: null,
                        middle_name: null,
                        last_name: null,
                        other_names: null,
                        full_name: null,
                        gender: null,
                        place_of_birth: null,
                        country_of_birth: null,
                        nationality: null,
                        marital_status: null,
                        date_of_birth: null,
                        passport_number: null,
                        passport_place_of_issue: null,
                        passport_issue_date: null,
                        passport_expiry_date: null,
                        passport_file_number: null,
                        id_number: null,
                        alien_number: null,
                        tax_pin: null,
                        eye_color: null,
                        hair_color: null,
                        height: null,
                        special_marks: null,
                        mobile_number: null,
                        email_address: null,
                        alternative_email: null,
                        building_name: null,
                        floor_number: null,
                        block_number: null,
                        road_name: null,
                        area_name: null,
                        town: null,
                        country: null,
                        full_residential_address: null,
                        residential_county: null,
                        sub_county: null,
                        postal_address: null,
                        postal_code: null,
                        postal_town: null,
                        full_postal_address: null,
                        university_name: null,
                        course_name: null,
                        course_start_date: null,
                        course_end_date: null,
                        job_position: null,
                        job_description: null,
                        shares_held: null,
                        other_directorships: null,
                        dependents: null,
                        annual_income: null,
                        languages_spoken: null,
                        occupation: null,
                        education_level: null,
                        criminal_record: null,
                        bankruptcy_history: null,
                        professional_memberships: null,
                        userid: null,
                        status: ''
                    }
                });
            });

            parsedData.forEach(row => {
                const fieldName = row["#_1"];
                if (!fieldName) return;

                valueColumns.forEach(colName => {
                    const companyData = companiesMap.get(colName);
                    const value = row[colName];

                    if (companyData && value) {
                        // Main Company Details
                        switch (fieldName) {
                            case "Company Name":
                                companyData.mainCompany.company_name = value;
                                companyData.nssfDetails.company_name = value;
                                companyData.nhifDetails.company_name = value;
                                companyData.pinDetails.company_name = value;
                                companyData.ecitizenDetails.name = value;
                                companyData.etimsDetails.company_name = value;
                                break;
                            case "Company Type":
                                companyData.mainCompany.company_type = value;
                                break;
                            case "Company Status":
                                companyData.mainCompany.company_status = value;
                                break;
                            case "Description":
                                companyData.mainCompany.description = value;
                                break;
                            case "Registration Number":
                                companyData.mainCompany.registration_number = value;
                                break;
                            case "Date Established":
                                companyData.mainCompany.date_established = value;
                                break;

                            case "Industry":
                                companyData.mainCompany.industry = value;
                                break;
                            case "Employees":
                                companyData.mainCompany.employees = value;
                                break;
                            case "Annual Revenue":
                                companyData.mainCompany.annual_revenue = value;
                                break;
                            case "Fiscal Year":
                                companyData.mainCompany.fiscal_year = value;
                                break;
                            case "Website":
                                companyData.mainCompany.website = value;
                                break;
                            case "Company Email":
                                companyData.mainCompany.company_email = value;
                                break;
                            case "Phone":
                                companyData.mainCompany.phone = value;
                                break;
                            case "Street":
                                companyData.mainCompany.street = value;
                                break;
                            case "City":
                                companyData.mainCompany.city = value;
                                break;
                            case "Postal Code":
                                companyData.mainCompany.postal_code = value;
                                break;
                            case "Country":
                                companyData.mainCompany.country = value;
                                break;
                            case "Housing Levy Identifier":
                                companyData.mainCompany.housing_levy_identifier = value;
                                break;
                            case "Housing Levy Password":
                                companyData.mainCompany.housing_levy_password = value;
                                break;
                            case "Housing Levy Status":
                                companyData.mainCompany.housing_levy_status = value;
                                break;
                            case "Standard Levy Identifier":
                                companyData.mainCompany.standard_levy_identifier = value;
                                break;
                            case "Standard Levy Password":
                                companyData.mainCompany.standard_levy_password = value;
                                break;
                            case "Standard Levy Status":
                                companyData.mainCompany.standard_levy_status = value;
                                break;
                            case "Tourism Levy Identifier":
                                companyData.mainCompany.tourism_levy_identifier = value;
                                break;
                            case "Tourism Levy Password":
                                companyData.mainCompany.tourism_levy_password = value;
                                break;
                            case "Tourism Levy Status":
                                companyData.mainCompany.tourism_levy_status = value;
                                break;
                            case "Tourism Fund Username":
                                companyData.mainCompany.tourism_fund_username = value;
                                break;
                            case "Tourism Fund Password":
                                companyData.mainCompany.tourism_fund_password = value;
                                break;
                            case "NITA Identifier":
                                companyData.mainCompany.nita_identifier = value;
                                break;
                            case "NITA Password":
                                companyData.mainCompany.nita_password = value;
                                break;
                            case "NITA Status":
                                companyData.mainCompany.nita_status = value;
                                break;
                            case "VAT Identifier":
                                companyData.mainCompany.vat_identifier = value;
                                break;
                            case "VAT Password":
                                companyData.mainCompany.vat_password = value;
                                break;
                            case "VAT Status":
                                companyData.mainCompany.vat_status = value;
                                break;
                            case "VAT From":
                                companyData.mainCompany.vat_from = value;
                                break;
                            case "VAT To":
                                companyData.mainCompany.vat_to = value;
                                break;
                            case "NEA Username":
                                companyData.mainCompany.nea_username = value;
                                break;
                            case "NEA Password":
                                companyData.mainCompany.nea_password = value;
                                break;
                            case "Nature of Business":
                                companyData.mainCompany.nature_of_business = value;
                                break;
                            case "Audit Period":
                                companyData.mainCompany.audit_period = value;
                                break;
                            case "Sale Terms":
                                companyData.mainCompany.sale_terms = value;
                                break;
                            case "Source of Income Business 1 (Primary)":
                                companyData.mainCompany.source_of_income_business_1 = value;
                                break;
                            case "Source of Income Business 2 (Secondary)":
                                companyData.mainCompany.source_of_income_business_2 = value;
                                break;
                            case "Source of Income Employment 1 (Primary)":
                                companyData.mainCompany.source_of_income_employment_1 = value;
                                break;
                            case "Source of Income Employment 2 (Secondary)":
                                companyData.mainCompany.source_of_income_employment_2 = value;
                                break;
                            case "Source of Income Rental Income (MRI)":
                                companyData.mainCompany.source_of_income_rental = value;
                                break;
                            case "Source of Income Bank FD + Other Interest Income + Dividends + Commission":
                                companyData.mainCompany.source_of_income_interest_dividends = value;
                                break;
                            case "TCC Expiry Date":
                                companyData.mainCompany.tcc_expiry_date = value;
                                break;
                            case "TCC Reminders Notice Days":
                                companyData.mainCompany.tcc_reminders_notice_days = value;
                                break;
                            case "TCC Reminder Date":
                                companyData.mainCompany.tcc_reminder_date = value;
                                break;
                            case "Good Conduct Issue Date":
                                companyData.mainCompany.good_conduct_issue_date = value;
                                break;
                            case "CO Certificate Number":
                                companyData.mainCompany.co_cert_number = value;
                                break;
                            case "CO Registration Date":
                                companyData.mainCompany.co_registration_date = value;
                                break;
                            case "CO NSSF Number":
                                companyData.mainCompany.co_nssf_number = value;
                                break;
                            case "Verified Status":
                                companyData.mainCompany.verified_status = value;
                                break;
                            case "BO Status":
                                companyData.mainCompany.bo_status = value;
                                break;
                            case "CO CR 12 Issue Date":
                                companyData.mainCompany.co_cr_12_issue_date = value;
                                break;
                            case "CR 12 as at Date Of Issue":
                                companyData.mainCompany.cr_12_as_at_date_of_issue = value;
                                break;
                            case "CR 12 Reminders Notice Days":
                                companyData.mainCompany.cr_12_reminders_notice_days = value;
                                break;
                            case "CR 12 Reminder Date":
                                companyData.mainCompany.cr_12_reminder_date = value;
                                break;
                            case "Account Manager":
                                companyData.mainCompany.account_manager = value;
                                break;
                            case "Name Verified with PIN":
                                companyData.mainCompany.name_verified_with_pin = value;
                                break;
                            case "Client Category":
                                companyData.mainCompany.client_category = value;
                                break;
                            case "W/H VAT Agent Suppliers":
                                companyData.mainCompany.wh_vat_agent_suppliers = value;
                                break;
                            case "W/H VAT Agent Customers":
                                companyData.mainCompany.wh_vat_agent_customers = value;
                                break;



                            // NSSF Details
                            case "NSSF Code":
                                companyData.nssfDetails.nssf_code = value;
                                break;
                            case "NSSF Identifier":
                                companyData.nssfDetails.nssf_identifier = value;
                                break;
                            case "NSSF Password":
                                companyData.nssfDetails.nssf_password = value;
                                break;
                            case "NSSF Status":
                                companyData.nssfDetails.nssf_status = value;
                                break;
                            case "NSSF Registration Date":
                                companyData.nssfDetails.nssf_registration_date = value;
                                break;
                            case "NSSF Compliance Certificate Date":
                                companyData.nssfDetails.nssf_compliance_certificate_date = value;
                                break;

                            // NHIF Details
                            case "NHIF Code":
                                companyData.nhifDetails.nhif_code = value;
                                break;
                            case "NHIF Identifier":
                                companyData.nhifDetails.nhif_identifier = value;
                                break;
                            case "NHIF Password":
                                companyData.nhifDetails.nhif_password = value;
                                break;
                            case "NHIF Mobile":
                                companyData.nhifDetails.nhif_mobile = value;
                                break;
                            case "NHIF Email":
                                companyData.nhifDetails.nhif_email = value;
                                break;
                            case "NHIF Registration Date":
                                companyData.nhifDetails.nhif_registration_date = value;
                                break;
                            case "NHIF Email Password":
                                companyData.nhifDetails.nhif_email_password = value;
                                break;
                            case "NHIF Status":
                                companyData.nhifDetails.nhif_status = value;
                                break;
                            case "NHIF Compliance Certificate Date":
                                companyData.nhifDetails.nhif_compliance_certificate_date = value;
                                break;

                            // Password Checker Details
                            case "KRA PIN":
                                companyData.pinDetails.kra_pin = value;
                                break;
                            case "Company Name":
                                companyData.pinDetails.company_name = value;
                                break;
                            case "KRA Password":
                                companyData.pinDetails.kra_password = value;
                                break;
                            case "PIN Status":
                                companyData.pinDetails.pin_status = value;
                                break;
                            case "PIN Certification Profile Download Dates":
                                companyData.pinDetails.pin_certification_profile_download_dates = value;
                                break;
                            case "iTax Status":
                                companyData.pinDetails.itax_status = value;
                                break;
                            case "Income Tax Resident Individual Status":
                                companyData.pinDetails.income_tax_resident_individual_status = value;
                                break;
                            case "Income Tax Resident Individual From":
                                companyData.pinDetails.income_tax_resident_individual_from = value;
                                break;
                            case "Income Tax Resident Individual To":
                                companyData.pinDetails.income_tax_resident_individual_to = value;
                                break;
                            case "Income Tax Rent Income Current Status":
                                companyData.pinDetails.income_tax_rent_income_current_status = value;
                                break;
                            case "Income Tax Rent Income Effective From":
                                companyData.pinDetails.income_tax_rent_income_effective_from = value;
                                break;
                            case "Income Tax Rent Income Effective To":
                                companyData.pinDetails.income_tax_rent_income_effective_to = value;
                                break;
                            case "Income Tax PAYE Current Status":
                                companyData.pinDetails.income_tax_paye_current_status = value;
                                break;
                            case "Income Tax PAYE Effective From":
                                companyData.pinDetails.income_tax_paye_effective_from = value;
                                break;
                            case "Income Tax PAYE Effective To":
                                companyData.pinDetails.income_tax_paye_effective_to = value;
                                break;
                            case "Income Tax Turnover Tax Current Status":
                                companyData.pinDetails.income_tax_turnover_tax_current_status = value;
                                break;
                            case "Income Tax Turnover Tax Effective From":
                                companyData.pinDetails.income_tax_turnover_tax_effective_from = value;
                                break;
                            case "Income Tax Turnover Tax Effective To":
                                companyData.pinDetails.income_tax_turnover_tax_effective_to = value;
                                break;
                            case "Annual Income":
                                companyData.pinDetails.annual_income = value;
                                break;
                            case "Tax Year End":
                                companyData.pinDetails.tax_year_end = value;
                                break;
                            case "Current iTax Gmail Yahoo Email Recovery Email":
                                companyData.pinDetails.current_itax_gmail_yahoo_email_recovery = value;
                                break;
                            case "Current Tax Password":
                                companyData.pinDetails.current_tax_password = value;
                                break;
                            case "Current iTax Gmail Email Address":
                                companyData.pinDetails.current_itax_gmail_email = value;
                                break;
                            case "Current iTax System Gmail Email Password":
                                companyData.pinDetails.current_itax_system_gmail_password = value;
                                break;
                            case "Current iTax Gmail Email Recovery Mobile":
                                companyData.pinDetails.current_itax_gmail_email_recovery_mobile = value;
                                break;
                            case "PIN Station":
                                companyData.pinDetails.pin_station = value;
                                break;
                            case "PIN Station Manager Name":
                                companyData.pinDetails.pin_station_manager_name = value;
                                break;
                            case "PIN Station Manager Mobile":
                                companyData.pinDetails.pin_station_manager_mobile = value;
                                break;


                            // ECitizen Details
                            case "ECitizen ID":
                                companyData.ecitizenDetails.ecitizen_id = value;
                                break;
                            case "ECitizen Email":
                                companyData.ecitizenDetails.ecitizen_email = value;
                                break;
                            case "ECitizen Mobile":
                                companyData.ecitizenDetails.ecitizen_mobile = value;
                                break;
                            case "ECitizen Password":
                                companyData.ecitizenDetails.ecitizen_password = value;
                                break;
                            case "ECitizen Status":
                                companyData.ecitizenDetails.ecitizen_status = value;
                                break;

                            // TIMS Details
                            case "ETIMS Username":
                                companyData.etimsDetails.etims_username = value;
                                break;
                            case "ETIMS Certificate of Incorporation":
                                companyData.etimsDetails.etims_cert_incorporation = value;
                                break;
                            case "ETIMS PIN Number":
                                companyData.etimsDetails.etims_pin = value;
                                break;
                            case "ETIMS Comment":
                                companyData.etimsDetails.etims_comment = value;
                                break;
                            case "ETIMS Director PIN in System":
                                companyData.etimsDetails.etims_director_pin = value;
                                break;
                            case "ETIMS Current Director PIN":
                                companyData.etimsDetails.etims_current_director_pin = value;
                                break;
                            case "ETIMS Operator Name ":
                                companyData.etimsDetails.etims_operator_name = value;
                                break;
                            case "ETIMS Operator ID Number":
                                companyData.etimsDetails.etims_operator_id_number = value;
                                break;
                            case "ETIMS Password":
                                companyData.etimsDetails.etims_password = value;
                                break;
                            case "ETIMS Mobile Number":
                                companyData.etimsDetails.etims_mobile = value;
                                break;
                            case "ETIMS Email Address":
                                companyData.etimsDetails.etims_email = value;
                                break;
                            case "Registration Document Number":
                                companyData.etimsDetails.etims_reg_doc_number = value;
                                break;

                            // Acc Portal Directors
                            case "First Name":
                                companyData.accPortalDirectors.first_name = value;
                                break;
                            case "Last Name":
                                companyData.accPortalDirectors.last_name = value;
                                break;
                            case "Middle Name":
                                companyData.accPortalDirectors.middle_name = value;
                                break;
                            case "Other Names":
                                companyData.accPortalDirectors.other_names = value;
                                break;
                            case "Gender":
                                companyData.accPortalDirectors.gender = value;
                                break;
                            case "Date of Birth":
                                companyData.accPortalDirectors.date_of_birth = value;
                                break;
                            case "ID Number":
                                companyData.accPortalDirectors.id_number = value;
                                break;
                            case "Tax PIN":
                                companyData.accPortalDirectors.tax_pin = value;
                                break;
                            case "Mobile Number":
                                companyData.accPortalDirectors.mobile_number = value;
                                break;
                            case "Email Address":
                                companyData.accPortalDirectors.email_address = value;
                                break;
                            case "Alternative Email":
                                companyData.accPortalDirectors.alternative_email = value;
                                break;
                            case "Building Name":
                                companyData.accPortalDirectors.building_name = value;
                                break;
                            case "Floor Number":
                                companyData.accPortalDirectors.floor_number = value;
                                break;
                            case "Block Number":
                                companyData.accPortalDirectors.block_number = value;
                                break;
                            case "Road Name":
                                companyData.accPortalDirectors.road_name = value;
                                break;
                            case "Area Name":
                                companyData.accPortalDirectors.area_name = value;
                                break;
                            case "Town":
                                companyData.accPortalDirectors.town = value;
                                break;
                            case "Country":
                                companyData.accPortalDirectors.country = value;
                                break;
                            case "Full Residential Address":
                                companyData.accPortalDirectors.full_residential_address = value;
                                break;
                            case "Residential County":
                                companyData.accPortalDirectors.residential_county = value;
                                break;
                            case "Sub County":
                                companyData.accPortalDirectors.sub_county = value;
                                break;
                            case "Postal Address":
                                companyData.accPortalDirectors.postal_address = value;
                                break;
                            case "Postal Code":
                                companyData.accPortalDirectors.postal_code = value;
                                break;
                            case "Postal Town":
                                companyData.accPortalDirectors.postal_town = value;
                                break;
                            case "Full Postal Address":
                                companyData.accPortalDirectors.full_postal_address = value;
                                break;
                            case "University Name":
                                companyData.accPortalDirectors.university_name = value;
                                break;
                            case "Course Name":
                                companyData.accPortalDirectors.course_name = value;
                                break;
                            case "Course Start Date":
                                companyData.accPortalDirectors.course_start_date = value;
                                break;
                            case "Course End Date":
                                companyData.accPortalDirectors.course_end_date = value;
                                break;
                            case "Job Position":
                                companyData.accPortalDirectors.job_position = value;
                                break;
                            case "Job Description":
                                companyData.accPortalDirectors.job_description = value;
                                break;
                            case "Shares Held":
                                companyData.accPortalDirectors.shares_held = value;
                                break;
                            case "Other Directorships":
                                companyData.accPortalDirectors.other_directorships = value;
                                break;
                            case "Dependents":
                                companyData.accPortalDirectors.dependents = value;
                                break;
                            case "Annual Income":
                                companyData.accPortalDirectors.annual_income = value;
                                break;
                            case "Languages Spoken":
                                companyData.accPortalDirectors.languages_spoken = value;
                                break;
                            case "Occupation":
                                companyData.accPortalDirectors.occupation = value;
                                break;
                            case "Education Level":
                                companyData.accPortalDirectors.education_level = value;
                                break;
                            case "Criminal Record":
                                companyData.accPortalDirectors.criminal_record = value;
                                break;
                            case "Bankruptcy History":
                                companyData.accPortalDirectors.bankruptcy_history = value;
                                break;
                            case "Professional Memberships":
                                companyData.accPortalDirectors.professional_memberships = value;
                                break;
                            case "User ID":
                                companyData.accPortalDirectors.userid = value;
                                break;
                            case "Status":
                                companyData.accPortalDirectors.status = value;
                                break;
                        }
                    }
                });
            });

            const transformedData = Array.from(companiesMap.values())
                .filter(data => data.mainCompany.company_name);

            console.log('Transformed Data:', transformedData);

            for (const data of transformedData) {
                if (!data.mainCompany?.registration_number) {
                    console.warn('Skipping record with missing registration number:', data);
                    continue;
                }

                try {
                    // Upsert main company data using registration_number as unique key
                    const { data: companyData, error: companyError } = await supabase
                        .from('acc_portal_company_duplicate')
                        .upsert([data.mainCompany], { onConflict: ['registration_number'] });


                    if (companyError) {
                        console.error('Error upserting company:', companyError);
                        continue;
                    }

                    const upsertPromises = [];

                    if (data.nssfDetails) {
                        upsertPromises.push(supabase
                            .from('nssf_companies_duplicate')
                            .upsert([data.nssfDetails], {
                                onConflict: 'nssf_code',
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.nhifDetails) {
                        upsertPromises.push(supabase
                            .from('nhif_companies_duplicate2')
                            .upsert([data.nhifDetails], {
                                onConflict: 'nhif_code',
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.pinDetails) {
                        upsertPromises.push(supabase
                            .from('PasswordChecker_duplicate')
                            .upsert([data.pinDetails], {
                                onConflict: ['kra_pin'],
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.ecitizenDetails) {
                        upsertPromises.push(supabase
                            .from('ecitizen_companies_duplicate')
                            .upsert([data.ecitizenDetails], {
                                onConflict: 'ecitizen_identifier',
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.etimsDetails) {
                        upsertPromises.push(supabase
                            .from('etims_companies_duplicate')
                            .upsert([data.etimsDetails], {
                                onConflict: 'etims_pin',
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.accPortalDirectors) {
                        upsertPromises.push(supabase
                            .from('acc_portal_directors_duplicate')
                            .upsert([data.accPortalDirectors], {
                                onConflict: 'company_name',
                                ignoreDuplicates: false
                            }));
                    }

                    if (data.incomeTaxDetails) {
                        upsertPromises.push(supabase
                            .from('income_tax')
                            .upsert([data.incomeTaxDetails], {
                                onConflict: 'company_name',
                                ignoreDuplicates: false
                            }));
                    }

                    try {
                        await Promise.all(upsertPromises);
                    } catch (tableError) {
                        console.error('Error updating related tables:', tableError);
                    }
                } catch (companyError) {
                    console.error('Error processing company:', companyError);
                }
            }
            toast.success(`Successfully updated ${transformedData.length} companies`);
            fetchAllData();

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
                                        {processedSections.slice(1).map(section => {
                                            if (section.isSeparator) return renderSeparatorCell(`cat-sep-${section.name}`);

                                            return section.categorizedFields?.map((category, catIndex) => {
                                                if (category.isSeparator) return renderSeparatorCell(`cat-${section.name}-${catIndex}`);

                                                const categoryColor = categoryColors[category.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

                                                return (
                                                    <TableHead
                                                        key={`cat-${section.name}-${category.category}`}
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
                                        {processedSections.slice(1).map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`col-ref-sep-${sectionIndex}`);

                                            let columnCounter = 1;
                                            return section.categorizedFields?.map(category => {
                                                if (category.isSeparator) return renderSeparatorCell(`col-ref-cat-${category.category}`);

                                                return category.fields.map(field => {
                                                    const columnRef = columnCounter++;
                                                    return (
                                                        <TableHead
                                                            key={`col-ref-${field.name}`}
                                                            className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                        >
                                                            {columnRef}
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
                                        <TableHead className="font-semibold text-blue-900">Total</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`total-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex)  => {
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
                                        <TableHead className="font-semibold text-green-900">Completed</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`completed-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex)  => {
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
                                        <TableHead className="font-semibold text-red-900">Pending</TableHead>
                                        {processedSections.map((section, sectionIndex) => {
                                            if (section.isSeparator) return renderSeparatorCell(`pending-sep-${sectionIndex}-${Date.now()}`);
                                            if (sectionIndex === 0) return null;

                                            return section.categorizedFields?.map((category, catIndex)  => {
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


