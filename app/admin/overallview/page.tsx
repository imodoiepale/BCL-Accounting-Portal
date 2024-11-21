// OverallView.tsx
// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Settings, Upload, Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from "sonner";
import { Table } from './components/overview/TableComponents';
import { SettingsDialog } from './components/overview/Dialogs/settingsDialog';
import { MissingFieldsDialog } from './components/missingFieldsDialog';
import { getMissingFields } from './components/missingFieldsDialog';

// Utility function to safely parse JSON
const safeJSONParse = (jsonString: string, defaultValue = {}) => {
    try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const OverallView: React.FC = () => {
    const [data, setData] = useState([]);
    const [structure, setStructure] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMissingFields, setSelectedMissingFields] = useState(null);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);

    // Function to fetch company data
    const fetchData = async () => {
        try {
            const { data: companies, error } = await supabase
                .from('acc_portal_company_duplicate')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            const processedData = companies.map(company => ({
                company,
                rows: [{ ...company, isFirstRow: true }],
                rowSpan: 1
            }));

            setData(processedData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
            setLoading(false);
        }
    };

    // Function to fetch table structure
    const fetchStructure = async () => {
        try {
            const { data: mappings, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .order('Tabs', { ascending: true });

            if (error) throw error;

            setStructure(mappings);
            const uniqueTabs = [...new Set(mappings.map(m => m.Tabs))].filter(Boolean);
            setTabs(uniqueTabs);
        } catch (error) {
            console.error('Error fetching structure:', error);
            toast.error('Failed to fetch structure');
        }
    };

    useEffect(() => {
        fetchData();
        fetchStructure();
    }, []);

    // Process sections for the selected tab
    const processTabSections = (selectedTab: string) => {
        const relevantMappings = structure.filter(item => item.Tabs === selectedTab);
        
        const processedSections = [
            {
                name: 'index',
                label: 'Index',
                categorizedFields: []
            },
            {
                isSeparator: true,
                name: 'missing-fields-separator'
            }
        ];

        relevantMappings.forEach(mapping => {
            const sections = safeJSONParse(mapping.sections_sections);
            const subsections = safeJSONParse(mapping.sections_subsections);
            const columnMappings = safeJSONParse(mapping.column_mappings);
            const fieldDropdowns = safeJSONParse(mapping.field_dropdowns);
            const tableNames = safeJSONParse(mapping.table_names);

            // Process each section
            Object.keys(sections).forEach(sectionName => {
                const sectionSubsections = subsections[sectionName];
                const subsectionArray = Array.isArray(sectionSubsections) ? 
                    sectionSubsections : [sectionSubsections];

                // Create categorizedFields based on subsections
                const categorizedFields = subsectionArray.map(subsection => {
                    // Get relevant table names for this section
                    const sectionTables = tableNames[sectionName] || [];

                    // Filter and map column mappings
                    const fields = Object.entries(columnMappings)
                        .filter(([key]) => {
                            const [tableName] = key.split('.');
                            return sectionTables.includes(tableName);
                        })
                        .map(([key, value]) => ({
                            name: key,
                            label: value,
                            table: key.split('.')[0],
                            column: key.split('.')[1],
                            dropdownOptions: fieldDropdowns[key] || [],
                            subCategory: subsection // Add subcategory for grouping
                        }));

                    return {
                        category: subsection,
                        fields: fields
                    };
                });

                // Add section with its categorized fields
                processedSections.push({
                    name: sectionName,
                    label: sectionName,
                    categorizedFields
                });

                // Add separator after each section except the last
                if (sectionName !== Object.keys(sections).pop()) {
                    processedSections.push({
                        isSeparator: true,
                        name: `${sectionName}-separator`
                    });
                }
            });
        });

        return processedSections;
    };


    const handleCompanyClick = (company) => {
        setSelectedCompany(company);
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-screen flex flex-col">
        <div className="flex gap-4 p-6">
            <SettingsDialog
                mainTabs={tabs}
                onStructureChange={fetchStructure}
            />
            <Button
                onClick={() => setIsImportDialogOpen(true)}
                className="flex items-center gap-2"
            >
                <Upload className="h-4 w-4" />
                Import
            </Button>
            <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
            </Button>
        </div>

        <div className="flex-1 overflow-hidden">
            <Tabs defaultValue={tabs[0]} className="h-full flex flex-col">
                <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
                    {tabs.map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 overflow-hidden">
                    {tabs.map(tab => (
                        <TabsContent 
                            key={tab} 
                            value={tab} 
                            className="h-full data-[state=active]:flex-1"
                        >
                            <Card className="h-full flex flex-col">
                                <CardContent className="flex-1 p-0 overflow-hidden">
                                    <div className="h-full overflow-auto">
                                        <div className="min-w-max">
                                            <Table
                                                data={data}
                                                handleCompanyClick={handleCompanyClick}
                                                onMissingFieldsClick={(company) => {
                                                    setSelectedMissingFields(getMissingFields(company.rows[0]));
                                                    setIsMissingFieldsOpen(true);
                                                }}
                                                processedSections={processTabSections(tab)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div> 
        
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <div className="grid gap-4">
                        <h2 className="text-lg font-semibold">Edit Company Details</h2>
                        {selectedCompany && (
                            <div className="grid gap-4">
                                {Object.entries(selectedCompany).map(([key, value]) => (
                                    <div key={key} className="grid gap-2">
                                        <label className="text-sm font-medium">{key}</label>
                                        <input
                                            type="text"
                                            value={value as string}
                                            onChange={(e) => {
                                                setSelectedCompany({
                                                    ...selectedCompany,
                                                    [key]: e.target.value
                                                });
                                            }}
                                            className="p-2 border rounded-md"
                                        />
                                    </div>
                                ))}
                                <Button onClick={() => setIsEditDialogOpen(false)}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isMissingFieldsOpen} onOpenChange={setIsMissingFieldsOpen}>
                <DialogContent>
                    <MissingFieldsDialog
                        data={selectedMissingFields}
                        onClose={() => setIsMissingFieldsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OverallView;