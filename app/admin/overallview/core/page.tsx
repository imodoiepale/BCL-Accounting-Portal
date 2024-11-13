// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

import { TableConfiguration } from '@/types/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Download, Upload, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AdvancedTable } from './components/Table';

// Define the table configuration
const tableConfig: TableConfiguration = {
    structure: {
        sections: [
            {
                id: 'companyInfo',
                name: 'Company Information',
                order: 0,
                categories: ['basic', 'contact', 'registration']
            },
            {
                id: 'compliance',
                name: 'Compliance',
                order: 1,
                categories: ['tax', 'statutory']
            },
            {
                id: 'financial',
                name: 'Financial',
                order: 2,
                categories: ['banking', 'revenue']
            }
        ],
        categories: [
            {
                id: 'basic',
                name: 'Basic Details',
                order: 0,
                sectionId: 'companyInfo',
                subCategories: ['basicInfo']
            },
            {
                id: 'contact',
                name: 'Contact Information',
                order: 1,
                sectionId: 'companyInfo',
                subCategories: ['contactDetails']
            },
            {
                id: 'registration',
                name: 'Registration Details',
                order: 2,
                sectionId: 'companyInfo',
                subCategories: ['regInfo']
            },
            {
                id: 'tax',
                name: 'Tax Information',
                order: 0,
                sectionId: 'compliance',
                subCategories: ['taxDetails']
            },
            {
                id: 'statutory',
                name: 'Statutory Compliance',
                order: 1,
                sectionId: 'compliance',
                subCategories: ['statutoryDetails']
            },
            {
                id: 'banking',
                name: 'Banking Details',
                order: 0,
                sectionId: 'financial',
                subCategories: ['bankAccounts']
            },
            {
                id: 'revenue',
                name: 'Revenue Information',
                order: 1,
                sectionId: 'financial',
                subCategories: ['revenueDetails']
            }
        ],
        subCategories: [
            {
                id: 'basicInfo',
                name: 'Company Basic Information',
                order: 0,
                categoryId: 'basic',
                columns: ['companyName', 'companyType', 'status']
            },
            {
                id: 'contactDetails',
                name: 'Contact Details',
                order: 0,
                categoryId: 'contact',
                columns: ['email', 'phone', 'address']
            },
            {
                id: 'regInfo',
                name: 'Registration Information',
                order: 0,
                categoryId: 'registration',
                columns: ['regNumber', 'regDate', 'expiryDate']
            },
            {
                id: 'taxDetails',
                name: 'Tax Details',
                order: 0,
                categoryId: 'tax',
                columns: ['taxId', 'vatNumber', 'taxStatus']
            },
            {
                id: 'statutoryDetails',
                name: 'Statutory Details',
                order: 0,
                categoryId: 'statutory',
                columns: ['nssfNumber', 'nhifNumber', 'complianceStatus']
            },
            {
                id: 'bankAccounts',
                name: 'Bank Accounts',
                order: 0,
                categoryId: 'banking',
                columns: ['bankName', 'accountNumber', 'accountType']
            },
            {
                id: 'revenueDetails',
                name: 'Revenue Details',
                order: 0,
                categoryId: 'revenue',
                columns: ['annualRevenue', 'fiscalYear', 'revenueGrowth']
            }
        ],
        columns: [
            // Company Basic Information
            {
                id: 'companyName',
                name: 'Company Name',
                type: 'text',
                field: 'companyName',
                config: {
                    required: true,
                    validation: (value) => value.length >= 2
                }
            },
            {
                id: 'companyType',
                name: 'Company Type',
                type: 'select',
                field: 'companyType',
                config: {
                    options: [
                        { value: 'ltd', label: 'Limited Company' },
                        { value: 'llp', label: 'LLP' },
                        { value: 'partnership', label: 'Partnership' }
                    ]
                }
            },
            {
                id: 'status',
                name: 'Status',
                type: 'select',
                field: 'status',
                config: {
                    options: [
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'suspended', label: 'Suspended' }
                    ]
                }
            },
            // Contact Details
            {
                id: 'email',
                name: 'Email',
                type: 'text',
                field: 'email',
                config: {
                    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                }
            },
            {
                id: 'phone',
                name: 'Phone',
                type: 'text',
                field: 'phone'
            },
            {
                id: 'address',
                name: 'Address',
                type: 'text',
                field: 'address'
            },
            // Registration Information
            {
                id: 'regNumber',
                name: 'Registration Number',
                type: 'text',
                field: 'regNumber'
            },
            {
                id: 'regDate',
                name: 'Registration Date',
                type: 'date',
                field: 'regDate'
            },
            {
                id: 'expiryDate',
                name: 'Expiry Date',
                type: 'date',
                field: 'expiryDate'
            }
            // ... Add more columns for other categories
        ]
    },
    calculations: [
        {
            id: 'totalCompanies',
            name: 'Total Companies',
            type: 'count',
            field: 'companyName'
        },
        {
            id: 'activeCompanies',
            name: 'Active Companies',
            type: 'count',
            field: 'status',
            condition: (value) => value === 'active'
        }
    ]
};

export default function CompaniesPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Simulated data fetch - replace with your actual API call
            const response = await fetch('/api/companies');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDataUpdate = async (updatedData: any) => {
        try {
            // Handle data updates
            await fetch('/api/companies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Companies');
        XLSX.writeFile(wb, 'companies_export.xlsx');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const importedData = XLSX.utils.sheet_to_json(firstSheet);
                // Handle imported data
                handleDataUpdate(importedData);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Company Management</h1>

                {/* Controls */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleExport} className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={() => document.getElementById('file-import')?.click()}
                            className="flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import
                            <input
                                id="file-import"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleImport}
                            />
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <Card>
                            {loading ? (
                                <div className="p-8 text-center">Loading...</div>
                            ) : (
                                <AdvancedTable
                                    data={data}
                                    config={tableConfig}
                                    onUpdate={handleDataUpdate}
                                />
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="compliance">
                        <Card>
                            {/* Compliance-specific table configuration */}
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial">
                        <Card>
                            {/* Financial-specific table configuration */}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}