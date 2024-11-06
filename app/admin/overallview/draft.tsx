// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {  CompanyTaxTable, DirectorsTable, ComplianceTable, NSSFTable, NHIFTable, EmployeesTable, BankingTable, PAYETable, VATTable, NITATable, HousingLevyTable, TourismLevyTable, StandardLevyTable, ClientCategoryTable, SheriaDetailsTable, ECitizenTable, TaxStatusTable, CompanyGeneralTable } from './tableComponents';

const OverallView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const sectionColors = {
        companyDetails: { main: 'bg-blue-600', sub: 'bg-blue-500', cell: 'bg-blue-50' },
        directorDetails: { main: 'bg-emerald-600', sub: 'bg-emerald-500', cell: 'bg-emerald-50' },
        bankDetails: { main: 'bg-amber-600', sub: 'bg-amber-500', cell: 'bg-amber-50' },
        employeeDetails: { main: 'bg-rose-600', sub: 'bg-rose-500', cell: 'bg-rose-50' }
    };

    
    const sectionsWithSeparators = [
        
        { name: 'companyDetails', fields: formFields.companyDetails.fields, label: 'Company Details' },
        { isSeparator: true },
        { name: 'directorDetails', fields: formFields.directorDetails.fields, label: 'Director Details' },
        { isSeparator: true },
        { name: 'bankDetails', fields: formFields.bankDetails.fields, label: 'Bank Details' },
        { isSeparator: true },
        { name: 'employeeDetails', fields: formFields.employeeDetails.fields, label: 'Employee Details' }
    ];

    
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

    const countMissingFields = (row) => {
        const fields = Object.keys(row).filter(key =>
            key !== 'index' &&
            key !== 'isFirstRow' &&
            key !== 'rowSpan' &&
            !key.startsWith('data.')
        );

        const totalFields = fields.length;
        const completedFields = fields.filter(field => row[field] !== null && row[field] !== '').length;
        const missingFields = totalFields - completedFields;

        return { totalFields, completedFields, missingFields };
    };

    const calculateMissingCounts = () => {
        if (!data.length || !data[0].rows.length) return {};

        const allRows = data.flatMap(group => group.rows);
        const counts = {};

        allRows.forEach(row => {
            const { totalFields, completedFields, missingFields } = countMissingFields(row);
            counts.totalFields = (counts.totalFields || 0) + totalFields;
            counts.completedFields = (counts.completedFields || 0) + completedFields;
            counts.missingFields = (counts.missingFields || 0) + missingFields;
        });

        return counts;
    };

    const { totalFields, completedFields, missingFields } = calculateMissingCounts();

    const handleExport = () => {
        const exportData = data.map(item => ({
            Company_Name: item.company.company_name,
            Registration_Number: item.company.registration_number,
            KRA_PIN: item.company.kra_pin_number,
            Industry: item.company.industry,
            Email: item.company.email,
            Phone: item.company.phone,
            Status: item.company.status,
            Directors: item.directors?.map(d => d.director_name).join(', '),
        }));
    
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Companies");
        XLSX.writeFile(wb, "Companies_Report.xlsx");
    };

    return (
        <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-10 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="overview" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Overview</TabsTrigger>
                <TabsTrigger value="company" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Company</TabsTrigger>
                <TabsTrigger value="clients" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Clients</TabsTrigger>
                <TabsTrigger value="checklist" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Monthly Checklist</TabsTrigger>
                <TabsTrigger value="sheria" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Sheria Details</TabsTrigger>
                <TabsTrigger value="ecitizen" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">E-Citizen</TabsTrigger>
                <TabsTrigger value="taxes" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Taxes</TabsTrigger>
                <TabsTrigger value="other" className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors">Other Details</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
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
                    <CardContent className="p-0">
                        <ScrollArea className="h-[900px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {sectionsWithSeparators.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <TableCell key={`separator-header-${sectionIndex}`} className="bg-gray-200 w-4 p-0 border-x border-gray-300" />
                                                );
                                            }

                                            const sectionNumber = sectionIndex + 1;

                                            return (
                                                <TableHead
                                                    key={section.name}
                                                    colSpan={section.fields.length}
                                                    className={`text-center ${sectionColors[section.name]?.main || 'bg-gray-600'} text-white font-bold transition-colors`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs opacity-75">{sectionNumber}.0</span>
                                                        <span>{section.label}</span>
                                                    </div>
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>


                                    <TableRow>
                                        {sectionsWithSeparators.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <TableCell key={`category-separator-${sectionIndex}`} className="bg-gray-200 w-4 p-0 border-x border-gray-300" />
                                                );
                                            }

                                            return section.fields.map((field, fieldIndex) => {
                                                const sectionNumber = sectionIndex + 1;
                                                const categoryNumber = fieldIndex + 1;

                                                return (
                                                    <TableHead
                                                        key={`${section.name}-${field.name}`}
                                                        className={`text-center ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white transition-colors`}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs opacity-75">{sectionNumber}.{categoryNumber}</span>
                                                            <span>{field.label}</span>
                                                        </div>
                                                    </TableHead>
                                                );
                                            });
                                        })}
                                    </TableRow>

                                    {/* Missing Fields Count Row */}
                                    <TableRow className="bg-gray-50">
                                        <TableCell>Total</TableCell>
                                        {sectionsWithSeparators.map((section) => {
                                            if (section.isSeparator) {
                                                return <TableCell key={`total-separator-${section.name}`} />;
                                            }
                                            return <TableCell key={`total-${section.name}`}>{totalFields}</TableCell>;
                                        })}
                                    </TableRow>
                                    <TableRow className="bg-gray-50">
                                        <TableCell>Completed</TableCell>
                                        {sectionsWithSeparators.map((section) => {
                                            if (section.isSeparator) {
                                                return <TableCell key={`completed-separator-${section.name}`} />;
                                            }
                                            return <TableCell key={`completed-${section.name}`}>{completedFields}</TableCell>;
                                        })}
                                    </TableRow>
                                    <TableRow className="bg-gray-50">
                                        <TableCell>Pending</TableCell>
                                        {sectionsWithSeparators.map((section) => {
                                            if (section.isSeparator) {
                                                return <TableCell key={`pending-separator-${section.name}`} />;
                                            }
                                            return <TableCell key={`pending-${section.name}`}>{missingFields}</TableCell>;
                                        })}
                                    </TableRow>

                                    {/* Column Headers */}
                                    {/* <TableRow>
                                        {sectionsWithSeparators.map((section, sectionIndex) => {
                                            if (section.isSeparator) {
                                                return (
                                                    <TableCell key={`header-separator-${sectionIndex}`} className="bg-gray-200 w-4 p-0 border-x border-gray-300" />
                                                );
                                            }

                                            return section.fields.map((field, fieldIndex) => {
                                                const sectionNumber = sectionIndex + 1;
                                                const fieldNumber = fieldIndex + 1;
                                                const columnNumber = `${sectionNumber}.${fieldNumber}`;

                                                return (
                                                    <TableHead
                                                        key={`${section.name}-${field.name}`}
                                                        className={`whitespace-nowrap ${sectionColors[section.name]?.cell || 'bg-gray-50'} text-gray-700 transition-colors`}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs opacity-75">{columnNumber}</span>
                                                            <span>{field.label}</span>
                                                        </div>
                                                    </TableHead>
                                                );
                                            });
                                        })}
                                    </TableRow> */}
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
                                                {sectionsWithSeparators.map((section, sectionIndex) => {
                                                    if (section.isSeparator) {
                                                        return rowIndex === 0 && (
                                                            <TableCell key={`body-sep-${groupIndex}-${sectionIndex}`} />
                                                        );
                                                    }

                                                    return section.fields.map(field => {
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
                                                                className={`whitespace-nowrap ${sectionColors[section.name]?.cell || 'bg-gray-50'} transition-colors`}
                                                            >
                                                                {value || <span className="text-red-500 font-semibold">N/A</span>}
                                                            </TableCell>
                                                        );
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
                <Card>





                    {/* Rest of the ecitizen content remains the same */}
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
            
            </Tabs>    );
};

export default OverallView;


