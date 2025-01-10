// @ts-nocheck
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Check, Download, Search, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
interface ColumnStructure {
    sections: {
        id: string;
        title: string;
        colspan: number;
        borderColor: string;
        bgColor: string;
        headerTextColor: string;
        categories: {
            id: string;
            title: string;
            colspan: number;
            bgColor: string;
            borderColor: string;
            subcategories: {
                id: string;
                header: string;
                type: 'text' | 'number' | 'date' | 'select' | 'currency' | 'percentage';
                width?: string;
            }[];
        }[];
    }[];
}

interface EditDialogProps {
    open: boolean;
    onClose: () => void;
    data: ProductData | null;
    onSave: (data: ProductData) => void;
}

const tableStructure: ColumnStructure = {
    sections: [
        {
            id: 'manufacturing',
            title: 'Manufacturing Details',
            colspan: 12,
            borderColor: 'border-blue-600',
            bgColor: 'bg-blue-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'specifications',
                    title: 'Technical Specifications',
                    colspan: 6,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    subcategories: [
                        { id: 'index', header: '#', type: 'number', width: '50px' },
                        { id: 'productId', header: 'Product ID', type: 'text' },
                        { id: 'specifications', header: 'Specifications', type: 'text' },
                        { id: 'materials', header: 'Materials Used', type: 'text' },
                        { id: 'process', header: 'Process', type: 'text' },
                        { id: 'quality', header: 'Quality Grade', type: 'text' }
                    ]
                },
                {
                    id: 'production',
                    title: 'Production Metrics',
                    colspan: 6,
                    bgColor: 'bg-blue-25',
                    borderColor: 'border-blue-200',
                    subcategories: [
                        { id: 'batchSize', header: 'Batch Size', type: 'number' },
                        { id: 'cycleTime', header: 'Cycle Time', type: 'text' },
                        { id: 'efficiency', header: 'Efficiency', type: 'percentage' },
                        { id: 'defectRate', header: 'Defect Rate', type: 'percentage' },
                        { id: 'outputRate', header: 'Output Rate', type: 'number' },
                        { id: 'status', header: 'Status', type: 'select' }
                    ]
                }
            ]
        },
        {
            id: 'commercial',
            title: 'Commercial Information',
            colspan: 10,
            borderColor: 'border-green-600',
            bgColor: 'bg-green-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'costs',
                    title: 'Cost Analysis',
                    colspan: 5,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    subcategories: [
                        { id: 'rawMaterialCost', header: 'Raw Material Cost', type: 'currency' },
                        { id: 'laborCost', header: 'Labor Cost', type: 'currency' },
                        { id: 'overheadCost', header: 'Overhead Cost', type: 'currency' },
                        { id: 'totalCost', header: 'Total Cost', type: 'currency' },
                        { id: 'profitMargin', header: 'Profit Margin', type: 'percentage' }
                    ]
                },
                {
                    id: 'market',
                    title: 'Market Data',
                    colspan: 5,
                    bgColor: 'bg-green-25',
                    borderColor: 'border-green-200',
                    subcategories: [
                        { id: 'marketPrice', header: 'Market Price', type: 'currency' },
                        { id: 'competitorPrice', header: 'Competitor Price', type: 'currency' },
                        { id: 'marketShare', header: 'Market Share', type: 'percentage' },
                        { id: 'salesVolume', header: 'Sales Volume', type: 'number' },
                        { id: 'growth', header: 'Growth Rate', type: 'percentage' }
                    ]
                }
            ]
        },
        {
            id: 'quality',
            title: 'Quality Control',
            colspan: 8,
            borderColor: 'border-purple-600',
            bgColor: 'bg-purple-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'testing',
                    title: 'Testing Results',
                    colspan: 4,
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-200',
                    subcategories: [
                        { id: 'testDate', header: 'Test Date', type: 'date' },
                        { id: 'testResult', header: 'Result', type: 'select' },
                        { id: 'compliance', header: 'Compliance', type: 'select' },
                        { id: 'certifications', header: 'Certifications', type: 'text' }
                    ]
                },
                {
                    id: 'metrics',
                    title: 'Quality Metrics',
                    colspan: 4,
                    bgColor: 'bg-purple-25',
                    borderColor: 'border-purple-200',
                    subcategories: [
                        { id: 'qualityScore', header: 'Quality Score', type: 'number' },
                        { id: 'defects', header: 'Defects', type: 'number' },
                        { id: 'returns', header: 'Returns', type: 'number' },
                        { id: 'satisfaction', header: 'Customer Satisfaction', type: 'percentage' }
                    ]
                }
            ]
        }
    ]
};



interface ProductData {
    companyName: string;
    manufacturingData: {
        specifications: {
            index: number;
            productId: string;
            specifications: string;
            materials: string;
            process: string;
            quality: string;
        };
        production: {
            batchSize: number;
            cycleTime: string;
            efficiency: number;
            defectRate: number;
            outputRate: number;
            status: string;
        };
    };
    commercialData: {
        costs: {
            rawMaterialCost: number;
            laborCost: number;
            overheadCost: number;
            totalCost: number;
            profitMargin: number;
        };
        market: {
            marketPrice: number;
            competitorPrice: number;
            marketShare: number;
            salesVolume: number;
            growth: number;
        };
    };
    qualityData: {
        testing: {
            testDate: string;
            testResult: string;
            compliance: string;
            certifications: string;
        };
        metrics: {
            qualityScore: number;
            defects: number;
            returns: number;
            satisfaction: number;
        };
    };
}

const sampleData: ProductData[] = [
    {
        companyName: "Company A",
        manufacturingData: {
            specifications: {
                index: 1,
                productId: "PRD-2024-001",
                specifications: "High-Grade Steel, 1.5mm thickness",
                materials: "Stainless Steel 304",
                process: "CNC Machining",
                quality: "Grade A"
            },
            production: {
                batchSize: 1000,
                cycleTime: "45 minutes",
                efficiency: 92.5,
                defectRate: 0.5,
                outputRate: 80,
                status: "Active"
            }
        },
        commercialData: {
            costs: {
                rawMaterialCost: 1500.00,
                laborCost: 800.00,
                overheadCost: 400.00,
                totalCost: 2700.00,
                profitMargin: 35.00
            },
            market: {
                marketPrice: 3645.00,
                competitorPrice: 3800.00,
                marketShare: 28.5,
                salesVolume: 5000,
                growth: 12.5
            }
        },
        qualityData: {
            testing: {
                testDate: "2024-03-15",
                testResult: "Passed",
                compliance: "ISO 9001",
                certifications: "CE, RoHS"
            },
            metrics: {
                qualityScore: 95,
                defects: 23,
                returns: 5,
                satisfaction: 94.5
            }
        }
    },
    {
        companyName: "Company B",
        manufacturingData: {
            specifications: {
                index: 2,
                productId: "PRD-2024-002",
                specifications: "Aluminum Alloy, 2mm thickness",
                materials: "AL6061-T6",
                process: "Die Casting",
                quality: "Grade A+"
            },
            production: {
                batchSize: 2000,
                cycleTime: "30 minutes",
                efficiency: 95.0,
                defectRate: 0.3,
                outputRate: 120,
                status: "Active"
            }
        },
        commercialData: {
            costs: {
                rawMaterialCost: 1200.00,
                laborCost: 600.00,
                overheadCost: 300.00,
                totalCost: 2100.00,
                profitMargin: 40.00
            },
            market: {
                marketPrice: 2940.00,
                competitorPrice: 3100.00,
                marketShare: 32.0,
                salesVolume: 7500,
                growth: 15.0
            }
        },
        qualityData: {
            testing: {
                testDate: "2024-03-16",
                testResult: "Passed",
                compliance: "ISO 9001",
                certifications: "CE, RoHS, UL"
            },
            metrics: {
                qualityScore: 98,
                defects: 15,
                returns: 3,
                satisfaction: 96.5
            }
        }
    }
];

// Theme configuration for different header levels
const headerThemes = {
    section: {
        base: "px-6 py-3 text-center font-bold border-b-4",
        text: "text-white"
    },
    category: {
        base: "px-6 py-2 text-center font-semibold border-b-2",
        text: "text-gray-800"
    },
    subcategory: {
        base: "px-4 py-2 text-center font-medium border-b",
        text: "text-gray-700"
    }
};

// Status color mapping
const statusColors = {
    "Active": "bg-green-100 text-green-800",
    "Inactive": "bg-red-100 text-red-800",
    "Pending": "bg-yellow-100 text-yellow-800",
    "Passed": "bg-green-100 text-green-800",
    "Failed": "bg-red-100 text-red-800"
};

const EditDialog = ({ open, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (data) {
            // Initialize formData with the structure of data
            setFormData({
                manufacturingData: { ...data.manufacturingData },
                commercialData: { ...data.commercialData },
                qualityData: { ...data.qualityData },
            });
        }
    }, [data]);

    const handleChange = (section, category, field, value) => {
        setFormData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [category]: {
                    ...prevData[section][category],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const renderInputField = (sectionId, categoryId, subcategory) => {
        const value = formData[sectionId]?.[categoryId]?.[subcategory.id] || '';
        switch (subcategory.type) {
            case 'text':
                return (
                    <div key={subcategory.id}>
                        <label className="block text-sm font-medium text-gray-700">{subcategory.header}</label>
                        <Input
                            value={value}
                            onChange={(e) => handleChange(sectionId, categoryId, subcategory.id, e.target.value)}
                            placeholder={`Enter ${subcategory.header}`}
                        />
                    </div>
                );
            case 'number':
                return (
                    <div key={subcategory.id}>
                        <label className="block text-sm font-medium text-gray-700">{subcategory.header}</label>
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleChange(sectionId, categoryId, subcategory.id, e.target.value)}
                            placeholder={`Enter ${subcategory.header}`}
                        />
                    </div>
                );
            case 'date':
                return (
                    <div key={subcategory.id}>
                        <label className="block text-sm font-medium text-gray-700">{subcategory.header}</label>
                        <Input
                            type="date"
                            value={value}
                            onChange={(e) => handleChange(sectionId, categoryId, subcategory.id, e.target.value)}
                        />
                    </div>
                );
            case 'select':
                return (
                    <div key={subcategory.id}>
                        <label className="block text-sm font-medium text-gray-700">{subcategory.header}</label>
                        <Select
                            value={value}
                            onValueChange={(value) => handleChange(sectionId, categoryId, subcategory.id, value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={subcategory.header} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Passed">Passed</SelectItem>
                                <SelectItem value="Failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'currency':
            case 'percentage':
                return (
                    <div key={subcategory.id}>
                        <label className="block text-sm font-medium text-gray-700">{subcategory.header}</label>
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleChange(sectionId, categoryId, subcategory.id, e.target.value)}
                            placeholder={`Enter ${subcategory.header}`}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                <DialogTitle>Edit Entry</DialogTitle>
                <DialogDescription>
                    Modify the fields below and save your changes.
                </DialogDescription>
                <div className="space-y-6">
                    {tableStructure.sections.map(section => (
                        <div key={section.id} className="space-y-4">
                            <h3 className="text-lg font-bold">{section.title}</h3>
                            {section.categories.map(category => (
                                <div key={category.id} className="space-y-2">
                                    <h4 className="text-md font-semibold">{category.title}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {category.subcategories.map(subcategory =>
                                            renderInputField(section.id, category.id, subcategory)
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const AdvancedTable: React.FC = () => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Sample data structure
    const generateSampleData = (): ProductData[] => {
        const statuses = ['Active', 'Pending', 'On Hold'];
        const qualities = ['Grade A', 'Grade A+', 'Grade B', 'Grade C'];
        const processes = ['CNC Machining', 'Die Casting', 'Injection Molding', 'Forging'];
        const testResults = ['Passed', 'Failed', 'Pending'];
        const materials = ['Stainless Steel 304', 'AL6061-T6', 'Carbon Steel', 'Titanium', 'Brass'];

        const generateRandomEntry = (index: number) => {
            const shouldHaveMissingData = Math.random() > 0.7;

            return {
                companyName: `Company ${String.fromCharCode(65 + index)}`,
                manufacturingData: {
                    specifications: {
                        index: index + 1,
                        productId: shouldHaveMissingData ? "To be registered" : `PRD-2024-${(index + 1).toString().padStart(3, '0')}`,
                        specifications: shouldHaveMissingData ? "Missing" : `${materials[Math.floor(Math.random() * materials.length)]}, ${(Math.random() * 3).toFixed(1)}mm thickness`,
                        materials: shouldHaveMissingData ? "To be registered" : materials[Math.floor(Math.random() * materials.length)],
                        process: processes[Math.floor(Math.random() * processes.length)],
                        quality: qualities[Math.floor(Math.random() * qualities.length)]
                    },
                    production: {
                        batchSize: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 5000) + 500,
                        cycleTime: shouldHaveMissingData ? "Missing" : `${Math.floor(Math.random() * 60) + 15} minutes`,
                        efficiency: shouldHaveMissingData ? 0 : Number((Math.random() * 20 + 80).toFixed(1)),
                        defectRate: shouldHaveMissingData ? 0 : Number((Math.random() * 2).toFixed(1)),
                        outputRate: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 150) + 50,
                        status: statuses[Math.floor(Math.random() * statuses.length)]
                    }
                },
                commercialData: {
                    costs: {
                        rawMaterialCost: shouldHaveMissingData ? 0 : Number((Math.random() * 2000 + 800).toFixed(2)),
                        laborCost: shouldHaveMissingData ? 0 : Number((Math.random() * 1000 + 400).toFixed(2)),
                        overheadCost: shouldHaveMissingData ? 0 : Number((Math.random() * 600 + 200).toFixed(2)),
                        totalCost: shouldHaveMissingData ? 0 : Number((Math.random() * 3000 + 1500).toFixed(2)),
                        profitMargin: shouldHaveMissingData ? 0 : Number((Math.random() * 30 + 20).toFixed(2))
                    },
                    market: {
                        marketPrice: shouldHaveMissingData ? 0 : Number((Math.random() * 4000 + 2000).toFixed(2)),
                        competitorPrice: shouldHaveMissingData ? 0 : Number((Math.random() * 4000 + 2000).toFixed(2)),
                        marketShare: shouldHaveMissingData ? 0 : Number((Math.random() * 40 + 10).toFixed(1)),
                        salesVolume: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 10000) + 1000,
                        growth: shouldHaveMissingData ? 0 : Number((Math.random() * 20 + 5).toFixed(1))
                    }
                },
                qualityData: {
                    testing: {
                        testDate: shouldHaveMissingData ? "Missing" : new Date(2024, 2, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
                        testResult: testResults[Math.floor(Math.random() * testResults.length)],
                        compliance: shouldHaveMissingData ? "To be registered" : "ISO 9001",
                        certifications: shouldHaveMissingData ? "Missing" : "CE, RoHS" + (Math.random() > 0.5 ? ", UL" : "")
                    },
                    metrics: {
                        qualityScore: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 20 + 80),
                        defects: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 50),
                        returns: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 20),
                        satisfaction: shouldHaveMissingData ? 0 : Number((Math.random() * 10 + 90).toFixed(1))
                    }
                }
            };
        };

        return Array.from({ length: 20 }, (_, index) => generateRandomEntry(index));
    };

    const sampleData: ProductData[] = generateSampleData(); const formatValue = (value: any, type: string) => {
        switch (type) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            case 'percentage':
                return `${value}%`;
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'select':
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                        {value}
                    </span>
                );
            default:
                return value;
        }
    };


    // State for toggling helper headers and their specific rows
    const [showCalculationHeaders, setShowCalculationHeaders] = useState({
        sum: false,
        average: false,
        count: false,
        custom: false,
        conditional: false,
    });

    const [showReferenceHeaders, setShowReferenceHeaders] = useState({
        autoNumbering: false,
        sequential: false,
        hierarchical: false,
        customFormat: false,
    });

    const [showInformationHeaders, setShowInformationHeaders] = useState({
        dataSource: false,
        lastUpdated: false,
        userAttribution: false,
        statusIndicators: false,
        auditInfo: false,
    });

    // State for visibility of sections, categories, and subcategories
    const [visibilitySettings, setVisibilitySettings] = useState({
        sections: {},
        categories: {},
        subcategories: {},
    });

    const stickyHeaderStyles = "sticky top-0 z-50 bg-white";
    const stickyColumnStyles = "sticky left-0 bg-white z-40"; // For the first column
    const stickyColumnStyles2 = "sticky left-12 bg-white z-40"; // For the second column


    const handleRowClick = (data) => {
        setSelectedData(data);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleSave = (updatedData) => {
        // Update your data source with the updatedData
        console.log('Updated Data:', updatedData);
    };

    const toggleHelperHeader = (type, subType) => {
        switch (type) {
            case 'calculation':
                setShowCalculationHeaders(prev => ({
                    ...prev,
                    [subType]: !prev[subType]
                }));
                break;
            case 'reference':
                setShowReferenceHeaders(prev => ({
                    ...prev,
                    [subType]: !prev[subType]
                }));
                break;
            case 'information':
                setShowInformationHeaders(prev => ({
                    ...prev,
                    [subType]: !prev[subType]
                }));
                break;
            default:
                break;
        }
    };

    const handleExport = () => {
        const csvContent = [
            // Add headers
            Object.keys(sampleData[0] || {}).join(","),
            // Add rows
            ...sampleData.map(row => Object.values(row).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "table_data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredData = sampleData.filter(row => {
        // Convert row data to a string and check if it includes the search query
        const rowString = JSON.stringify(row).toLowerCase();
        return rowString.includes(globalFilter.toLowerCase());
    });
    return (
        <div className="mx-auto p-4">
            {/* Header Controls */}
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Search all columns..."
                            className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleExport}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>

                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Settings</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="visibility">
                                <TabsList>
                                    <TabsTrigger value="visibility">Visibility</TabsTrigger>
                                    <TabsTrigger value="helperHeaders">Helper Headers</TabsTrigger>
                                </TabsList>
                                <TabsContent value="visibility">
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Section Visibility */}
                                        <div>
                                            <h3 className="font-semibold">Sections</h3>
                                            {Object.keys(visibilitySettings.sections).map(section => (
                                                <div key={section} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibilitySettings.sections[section]}
                                                        onChange={() => toggleVisibility('sections', section)}
                                                    />
                                                    <label className="ml-2">{section}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Category Visibility */}
                                        <div>
                                            <h3 className="font-semibold">Categories</h3>
                                            {Object.keys(visibilitySettings.categories).map(category => (
                                                <div key={category} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibilitySettings.categories[category]}
                                                        onChange={() => toggleVisibility('categories', category)}
                                                    />
                                                    <label className="ml-2">{category}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Subcategory Visibility */}
                                        <div>
                                            <h3 className="font-semibold">Subcategories</h3>
                                            {Object.keys(visibilitySettings.subcategories).map(subcategory => (
                                                <div key={subcategory} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibilitySettings.subcategories[subcategory]}
                                                        onChange={() => toggleVisibility('subcategories', subcategory)}
                                                    />
                                                    <label className="ml-2">{subcategory}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="helperHeaders">
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Calculation Headers */}
                                        <div>
                                            <h3 className="font-semibold">Calculation Headers</h3>
                                            {Object.keys(showCalculationHeaders).map(header => (
                                                <div key={header} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={showCalculationHeaders[header]}
                                                        onChange={() => toggleHelperHeader('calculation', header)}
                                                    />
                                                    <label className="ml-2">{header}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Reference Headers */}
                                        <div>
                                            <h3 className="font-semibold">Reference Headers</h3>
                                            {Object.keys(showReferenceHeaders).map(header => (
                                                <div key={header} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={showReferenceHeaders[header]}
                                                        onChange={() => toggleHelperHeader('reference', header)}
                                                    />
                                                    <label className="ml-2">{header}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Information Headers */}
                                        <div>
                                            <h3 className="font-semibold">Information Headers</h3>
                                            {Object.keys(showInformationHeaders).map(header => (
                                                <div key={header} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={showInformationHeaders[header]}
                                                        onChange={() => toggleHelperHeader('information', header)}
                                                    />
                                                    <label className="ml-2">{header}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border shadow-sm sticky top-0 z-50">
                <ScrollArea className="h-[600px] overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {/* Company Name Header */}
                            <TableRow>
                                <TableHead className={`sticky top-0 z-50 bg-white border-2 border-black`}>Company Name</TableHead>
                                {tableStructure.sections.map(section => (
                                    <TableHead
                                        key={section.id}
                                        colSpan={section.colspan}
                                        className={`${headerThemes.section.base} ${section.bgColor} ${section.borderColor} ${headerThemes.section.text} border-b sticky top-0 z-40`}
                                    >
                                        {section.title}
                                    </TableHead>
                                ))}

                            </TableRow>

                            {/* Category Headers */}
                            <TableRow>
                                <TableHead className={`${headerThemes.category.base} bg-gray-200 border-b sticky top-0 z-30`}></TableHead> {/* Empty cell for Company Name */}
                                {tableStructure.sections.map(section =>
                                    section.categories.map(category => (
                                        <TableHead
                                            key={`${section.id}-${category.id}`}
                                            colSpan={category.colspan}
                                            className={`${headerThemes.category.base} ${category.bgColor} ${category.borderColor} border-b sticky top-0 z-30`}
                                        >
                                            {category.title}
                                        </TableHead>
                                    ))
                                )}
                            </TableRow>

                            {/* Subcategory Headers */}
                            <TableRow>
                                <TableHead className={`${headerThemes.subcategory.base} bg-gray-200 border-b sticky top-0 z-20`}></TableHead> {/* Empty cell for Company Name */}
                                {tableStructure.sections.map(section =>
                                    section.categories.map(category =>
                                        category.subcategories.map(subcategory => (
                                            <TableHead
                                                key={`${section.id}-${category.id}-${subcategory.id}`}
                                                className={`${headerThemes.subcategory.base} ${category.bgColor} ${category.borderColor} border-b`}
                                                style={{ width: subcategory.width }}
                                            >
                                                {subcategory.header}
                                            </TableHead>
                                        ))
                                    )
                                )}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredData.map((row, rowIndex) => (
                                <TableRow
                                    key={`row-${rowIndex}`}
                                    onClick={() => handleRowClick(row)}
                                    className={`hover:bg-gray-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                    <TableCell className={`text-center sticky left-0 bg-white z-40`}>{row.companyName}</TableCell> {/* Company Name Cell */}
                                    {/* Manufacturing Data */}
                                    {tableStructure.sections[0].categories[0].subcategories.map((subcategory) => (
                                        <TableCell key={`manufacturing-spec-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.manufacturingData.specifications[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}
                                    {tableStructure.sections[0].categories[1].subcategories.map((subcategory) => (
                                        <TableCell key={`manufacturing-prod-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.manufacturingData.production[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}

                                    {/* Commercial Data */}
                                    {tableStructure.sections[1].categories[0].subcategories.map((subcategory) => (
                                        <TableCell key={`commercial-costs-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.commercialData.costs[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}
                                    {tableStructure.sections[1].categories[1].subcategories.map((subcategory) => (
                                        <TableCell key={`commercial-market-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.commercialData.market[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}

                                    {/* Quality Data */}
                                    {tableStructure.sections[2].categories[0].subcategories.map((subcategory) => (
                                        <TableCell key={`quality-testing-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.qualityData.testing[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}
                                    {tableStructure.sections[2].categories[1].subcategories.map((subcategory) => (
                                        <TableCell key={`quality-metrics-${subcategory.id}`} className={`text-center`}>
                                            {formatValue(row.qualityData.metrics[subcategory.id], subcategory.type || 'text')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            <EditDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                data={selectedData}
                onSave={handleSave}
            />
        </div>
    );
};

export default AdvancedTable;