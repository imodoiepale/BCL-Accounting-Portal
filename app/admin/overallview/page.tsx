// @ts-nocheck
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { formFields } from '../onboarding/formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const OverallView = () => {
    const [companies, setCompanies] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [directors, setDirectors] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    const displayValue = (value: any) => {
        if (value === null || value === undefined) return <span className="text-red-500">N/A</span>;
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            // Fetch data from Supabase
            const [companiesData, suppliersData, directorsData, employeesData, banksData] = await Promise.all([
                supabase.from('acc_portal_company').select('*'),
                supabase.from('acc_portal_pettycash_suppliers').select('*'),
                supabase.from('acc_portal_directors').select('*'),
                supabase.from('acc_portal_employees').select('*'),
                supabase.from('acc_portal_banks').select('*')
            ]);

            // Map related data to companies
            const enrichedCompanies = companiesData.data?.map(company => ({
                ...company,
                suppliers: suppliersData.data?.filter(s => s.userid === company.userid) || [],
                directors: directorsData.data?.filter(d => d.userid === company.userid) || [],
                employees: employeesData.data?.filter(e => e.userid === company.userid) || [],
                banks: banksData.data?.filter(b => b.userid === company.userid) || []
            }));

            setCompanies(enrichedCompanies || []);
            setLoading(false);
        };

        fetchAllData();
    }, []);

    const calculateMissingCounts = (tableData, tableColumns) => {
        const fields = formFields.companyDetails;
        const totalFields = fields.length;
        const completedFields = fields.filter(field =>
            tableData.every(row => row[field.name] !== null && row[field.name] !== '')
        ).length;
        const totalMissing = totalFields - completedFields;

        const columnMissing = {};
        fields.forEach(field => {
            columnMissing[field.name] = tableData.filter(row =>
                row[field.name] === null || row[field.name] === ''
            ).length;
        });

        return { totalFields, completedFields, totalMissing, columnMissing };
    };

    const { totalFields, completedFields, totalMissing, columnMissing } = useMemo(() => {
        return calculateMissingCounts(companies, formFields);
    }, [companies]);

    const getFieldCompletion = (company) => {
        const fields = formFields.companyDetails;
        const completedFields = fields.filter(field =>
            company[field.name] !== null &&
            company[field.name] !== ''
        );
        return {
            total: fields.length,
            completed: completedFields.length,
            pending: fields.length - completedFields.length
        };
    };

    const MultipleRecordsCell = ({ records, type }) => {
        if (!records?.length) return <span className="text-red-500">N/A</span>;

        return (
            <Popover>
                <PopoverTrigger>
                    <div className="cursor-pointer text-blue-600 hover:text-blue-800">
                        {records.length} {type}
                        <span className="text-xs ml-1">↗</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <ScrollArea className="h-72">
                        {records.map((record, index) => (
                            <div key={record.id} className="p-2 hover:bg-gray-50 border-b">
                                <div className="font-medium">{record.name || record.full_name}</div>
                                {Object.entries(record).map(([key, value]) => {
                                    if (key !== 'id' && key !== 'userid' && value) {
                                        return (
                                            <div key={key} className="text-sm text-gray-600">
                                                <span className="font-medium">{key}:</span> {displayValue(value)}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ))}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <Card className="p-6">
            <CardHeader>
                <CardTitle>Overall Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-blue-500">
                            <TableHead className="font-bold text-white p-4 border-r">#</TableHead>
                            <TableHead className="font-bold text-white p-4 border-r">Company Info</TableHead>
                            <TableHead className="font-bold text-white p-4 border-r">Missing Fields</TableHead>
                            {/* Company Section */}
                            <TableHead className="font-bold text-white p-4 border-r bg-blue-600" colSpan={formFields.companyDetails.length}>
                                Company Details
                            </TableHead>
                            {/* Directors Section */}
                            <TableHead className="font-bold text-white p-4 border-r bg-green-600" colSpan={formFields.directorDetails.length}>
                                Directors
                            </TableHead>
                            {/* Banks Section */}
                            <TableHead className="font-bold text-white p-4 border-r bg-yellow-600" colSpan={formFields.bankDetails.length}>
                                Banks
                            </TableHead>
                            {/* Employees Section */}
                            <TableHead className="font-bold text-white p-4 border-r bg-purple-600" colSpan={formFields.employeeDetails.length}>
                                Employees
                            </TableHead>
                        </TableRow>
                        {/* Field Labels Row */}
                        <TableRow className="bg-blue-50">
                            <TableHead></TableHead>
                            <TableHead></TableHead>
                            <TableHead></TableHead>
                            {formFields.companyDetails.map(field => (
                                <TableHead key={field.name} className="font-semibold text-sm p-2">
                                    {field.label}
                                </TableHead>
                            ))}
                            {formFields.directorDetails.map(field => (
                                <TableHead key={field.name} className="font-semibold text-sm p-2 bg-green-50">
                                    {field.label}
                                </TableHead>
                            ))}
                            {formFields.bankDetails.map(field => (
                                <TableHead key={field.name} className="font-semibold text-sm p-2 bg-yellow-50">
                                    {field.label}
                                </TableHead>
                            ))}
                            {formFields.employeeDetails.map(field => (
                                <TableHead key={field.name} className="font-semibold text-sm p-2 bg-purple-50">
                                    {field.label}
                                </TableHead>
                            ))}
                        </TableRow>
                        {/* Summary Row */}
                        <TableRow className="bg-gray-100">
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center">
                                <div className='flex justify-center gap-3 font-medium bg-white rounded-lg p-2 shadow-sm'>
                                    <span className='text-blue-600 border-r pr-3'>T: {totalFields}</span>
                                    <span className='text-green-600 border-r pr-3'>C: {completedFields}</span>
                                    <span className='text-red-600'>P: {totalMissing}</span>
                                </div>
                            </TableCell>
                            {/* Add summary cells for each section */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map((company, index) => (
                            <TableRow key={company.id} className="hover:bg-gray-50">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{company.company_name}</TableCell>
                                {/* Company Details */}
                                {formFields.companyDetails.map(field => (
                                    <TableCell key={field.name}>
                                        {displayValue(company[field.name])}
                                    </TableCell>
                                ))}
                                {/* Banks Section */}
                                <TableCell className="bg-yellow-50">
                                    <MultipleRecordsCell
                                        records={company.banks}
                                        type="Banks"
                                    />
                                </TableCell>
                                {/* Directors Section */}
                                <TableCell className="bg-green-50">
                                    <MultipleRecordsCell
                                        records={company.directors}
                                        type="Directors"
                                    />
                                </TableCell>
                                {/* Employees Section */}
                                <TableCell className="bg-purple-50">
                                    <MultipleRecordsCell
                                        records={company.employees}
                                        type="Employees"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default OverallView;