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
import { CompanyEditDialog } from './components/functionalities';

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
    const [activeTab, setActiveTab] = useState('');

    const fetchAllData = async () => {
        try {
            // First fetch the table mappings
            const { data: mappings, error: mappingError } = await supabase
                .from('profile_category_table_mapping')
                .select('*');
    
            if (mappingError) throw mappingError;
    
            // Extract unique table names from all mappings
            const allTables = new Set();
            mappings.forEach(mapping => {
                const tableNames = safeJSONParse(mapping.table_names, {});
                Object.values(tableNames).flat().forEach(table => allTables.add(table));
            });
    
            // Fetch data from all tables concurrently
            const tableData = {};
            const queries = Array.from(allTables).map(async tableName => {
                const { data, error } = await supabase
                    .from(tableName.toString())
                    .select('*')
                    .order('id', { ascending: true });
                
                if (error) {
                    console.error(`Error fetching from ${tableName}:`, error);
                    return;
                }
                
                tableData[tableName.toString()] = data || [];
            });
    
            await Promise.all(queries);
    
            // Start with companies from the main table
            const baseCompanies = tableData['acc_portal_company_duplicate'] || [];
            
            // Group and merge data
            const groupedData = baseCompanies.map(company => {
                let mergedData = { ...company,   company_name: company.company_name  };
                let additionalRows = [];
    
                // For each related table
                Array.from(allTables).forEach(tableName => {
                    if (tableName === 'acc_portal_company_duplicate') return;
    
                    const relatedRecords = tableData[tableName]?.filter(
                        record => record.company_name?.toLowerCase() === company.company_name?.toLowerCase()
                    );
    
                    if (relatedRecords?.length) {
                        // Add company_name to each related record
                        const recordsWithCompanyName = relatedRecords.map(record => ({
                            ...record,
                            company_name: company.company_name
                        }));
    
                        // Merge the first record into the main data
                        mergedData = {
                            ...mergedData,
                            [`${tableName}_data`]: recordsWithCompanyName[0]
                        };
    
                        // If there are additional records, add them as new rows
                        if (recordsWithCompanyName.length > 1) {
                            additionalRows.push(...recordsWithCompanyName.slice(1).map(record => ({
                                ...record,
                                isAdditionalRow: true,
                                sourceTable: tableName
                            })));
                        }
                    }
                });
    
                // Construct the final company group
                const rows = [
                    { ...mergedData, isFirstRow: true },
                    ...additionalRows
                ];
    
                return {
                    company: mergedData,
                    rows: rows,
                    rowSpan: rows.length
                };
            });
    
            console.log('Grouped Data Sample:', groupedData[0]);
            setData(groupedData);
    
        } catch (error) {
            console.error('Error in fetchAllData:', error);
            toast.error('Failed to fetch data');
        } finally {
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
        fetchAllData();
        fetchStructure();

        const handleRefresh = () => fetchAllData();
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
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
              name: 'company-name-separator'
            },
            {
              name: '',
              label: '',
              categorizedFields: [{
                category: '',
                fields: [{
                  name: 'acc_portal_company_duplicate.company_name',
                  label: 'Company Name',
                  table: 'acc_portal_company_duplicate',
                  column: 'company_name',
                  subCategory: 'Company Info'
                }]
              }]
            },
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

        <div className="flex-1 overflow-hidden" onValueChange={setActiveTab}>
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
                                                     const processedSections = processTabSections(tabs[0]); // or current active tab
                                                     setSelectedMissingFields(company);
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
        
        <CompanyEditDialog
    isOpen={isEditDialogOpen}
    onClose={() => setIsEditDialogOpen(false)}
    companyData={selectedCompany}
    processedSections={processTabSections(tabs[0])}
    onSave={(updatedData) => {
        fetchAllData();
        setIsEditDialogOpen(false);
    }}
/>

            <Dialog open={isMissingFieldsOpen} onOpenChange={setIsMissingFieldsOpen}>
                <DialogContent>
                    <MissingFieldsDialog
                        isOpen={isMissingFieldsOpen}
                        onClose={() => setIsMissingFieldsOpen(false)}
                        companyData={selectedMissingFields}
                        processedSections={processTabSections(tabs[0])} // or current active tab
                        onSave={(updatedData) => {
                            fetchAllData(); // Refresh the data
                            setIsMissingFieldsOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
            
        </div>
    );
};

export default OverallView;