// OverallView.tsx
// @ts-nocheck
"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { CompanyEditDialog } from './components/overview/Dialogs/CompanyEditDialog';
import { handleExport, handleImport } from './components/utility';
import { ImportDialog } from './components/overview/Dialogs/ImportDialog';

export const safeJSONParse = (jsonString: string, defaultValue = {}) => {
    try {
        if (!jsonString) return defaultValue;
        
        // Handle already parsed objects
        if (typeof jsonString === 'object') return jsonString;
        
        // Handle strings with escaped quotes
        let processedString = jsonString;
        if (typeof jsonString === 'string') {
            // Replace escaped backslashes first
            processedString = processedString.replace(/\\\\/g, '\\');
            // Replace escaped quotes
            processedString = processedString.replace(/\\"/g, '"');
            // Handle double-encoded JSON
            while (processedString.includes('\\"')) {
                try {
                    processedString = JSON.parse(processedString);
                    if (typeof processedString !== 'string') break;
                } catch {
                    break;
                }
            }
        }

        return typeof processedString === 'string' 
            ? JSON.parse(processedString) 
            : processedString;
    } catch (error) {
        console.error('JSON Parse Error:', error, 'Input:', jsonString);
        return defaultValue;
    }
};

const OverallView: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [structure, setStructure] = useState<any[]>([]);
    const [mainTabs, setMainTabs] = useState<string[]>([]);
    const [subTabs, setSubTabs] = useState<{ [key: string]: string[] }>({});
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMissingFields, setSelectedMissingFields] = useState<any>(null);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('');
    const [mainSections, setMainSections] = useState<any[]>([]);
    const [mainSubsections, setMainSubsections] = useState<any[]>([]);


    const fetchAllData = useCallback(async (activeMainTab: string, activeSubTab: string) => {
        try {
            if (!activeMainTab || !activeSubTab) {
                setData([]);
                return;
            }

            const { data: mappings, error: mappingError } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .eq('Tabs', activeSubTab)
                .eq('main_tab', activeMainTab);

            if (mappingError) throw mappingError;
            if (!mappings || mappings.length === 0) {
                setData([]);
                return;
            }

            const tableNames = safeJSONParse(mappings[0].table_names, {});
            const allTables = new Set(Object.values(tableNames).flat());

            const [baseCompaniesResult, ...otherResults] = await Promise.all([
                supabase
                    .from('acc_portal_company_duplicate')
                    .select('*')
                    .order('id'),
                ...Array.from(allTables)
                    .filter(table => table !== 'acc_portal_company_duplicate')
                    .map(tableName =>
                        supabase
                            .from(tableName.toString())
                            .select('*')
                            .order('id')
                    )
            ]);

            if (baseCompaniesResult.error) throw baseCompaniesResult.error;

            const tableData = {
                'acc_portal_company_duplicate': baseCompaniesResult.data,
            };

            Array.from(allTables)
                .filter(table => table !== 'acc_portal_company_duplicate')
                .forEach((tableName, index) => {
                    const result = otherResults[index];
                    if (!result.error) {
                        tableData[tableName.toString()] = result.data || [];
                    }
                });

            const companyDataMap = new Map();

            baseCompaniesResult.data.forEach(company => {
                const companyName = company.company_name?.toLowerCase();
                const companyId = company.company_id;
                const mergedData = { ...company };
                const additionalRows = [];

                Array.from(allTables).forEach(tableName => {
                    if (tableName === 'acc_portal_company_duplicate') return;

                    const relatedRecords = tableData[tableName]?.filter(record => {
                        if (record.company_name) {
                            return record.company_name.toLowerCase() === companyName;
                        } else if (record.company_id) {
                            return record.company_id === companyId;
                        }
                        return false;
                    });

                    if (relatedRecords?.length) {
                        mergedData[`${tableName}_data`] = relatedRecords[0];

                        if (relatedRecords.length > 1) {
                            additionalRows.push(...relatedRecords.slice(1).map(record => ({
                                ...record,
                                isAdditionalRow: true,
                                sourceTable: tableName
                            })));
                        }
                    }
                });

                if (companyDataMap.has(companyName)) {
                    // Merge logic for duplicates
                    const existingEntry = companyDataMap.get(companyName);
                    existingEntry.rows.push(...additionalRows);
                    existingEntry.rowSpan += additionalRows.length;
                } else {
                    companyDataMap.set(companyName, {
                        company: mergedData,
                        rows: [
                            { ...mergedData, isFirstRow: true },
                            ...additionalRows
                        ],
                        rowSpan: 1 + additionalRows.length
                    });
                }
            });

            setData(Array.from(companyDataMap.values()));

        } catch (error) {
            console.error('Error in fetchAllData:', error);
            toast.error('Failed to fetch data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStructure = useCallback(async () => {
        try {
            const { data: mappings, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .order('main_tab')
                .order('Tabs');
    
            if (error) throw error;
    
            // Process each mapping to ensure proper JSON parsing
            const processedMappings = mappings.map(mapping => ({
                ...mapping,
                sections_sections: safeJSONParse(mapping.sections_sections, {}),
                sections_subsections: safeJSONParse(mapping.sections_subsections, {}),
                column_mappings: safeJSONParse(mapping.column_mappings, {}),
                column_order: safeJSONParse(mapping.column_order, {}),
                table_names: safeJSONParse(mapping.table_names, {}),
                field_dropdowns: safeJSONParse(mapping.field_dropdowns, {})
            }));
    
            setStructure(processedMappings);
    
            // Process main tabs
            const mainTabsSet = new Set(processedMappings
                .map(m => m.main_tab)
                .filter(Boolean));
            const uniqueMainTabs = Array.from(mainTabsSet);
            setMainTabs(uniqueMainTabs);
    
            // Process sub tabs and their relationships
            const subTabsMap = uniqueMainTabs.reduce((acc, mainTab) => {
                // Get all unique sub tabs for this main tab
                acc[mainTab] = [...new Set(processedMappings
                    .filter(item => item.main_tab === mainTab)
                    .map(item => item.Tabs)
                    .filter(Boolean))];
                return acc;
            }, {});
    
            // Process main sections and subsections
            const allSections = new Set();
            const allSubsections = new Set();
    
            processedMappings.forEach(mapping => {
                // Handle sections
                Object.keys(mapping.sections_sections).forEach(section => {
                    allSections.add(section);
                });
    
                // Handle subsections - supporting both array and string formats
                Object.entries(mapping.sections_subsections).forEach(([_, subsectionValue]) => {
                    if (Array.isArray(subsectionValue)) {
                        subsectionValue.forEach(sub => allSubsections.add(sub));
                    } else if (typeof subsectionValue === 'string') {
                        allSubsections.add(subsectionValue);
                    } else if (typeof subsectionValue === 'object' && subsectionValue !== null) {
                        Object.keys(subsectionValue).forEach(sub => allSubsections.add(sub));
                    }
                });
            });
    
            setMainSections(Array.from(allSections));
            setMainSubsections(Array.from(allSubsections));
            setSubTabs(subTabsMap);
    
            // console.log('Processed structure:', {
            //     mainTabs: uniqueMainTabs,
            //     subTabs: subTabsMap,
            //     sections: Array.from(allSections),
            //     subsections: Array.from(allSubsections)
            // });
    
        } catch (error) {
            console.error('Error fetching structure:', error);
            toast.error('Failed to fetch structure');
        }
    }, []);

    const handleSave = async (updatedData: any) => {
        console.log('Saving updated data:', updatedData);
        try {
          // Update local data
          const updatedDataArray = data.map(item => {
            if (item.company.company_name === selectedCompany?.company?.company_name) {
              return {
                ...item,
                company: {
                  ...item.company,
                  ...Object.entries(updatedData).reduce((acc, [key, value]) => {
                    const [table, field] = key.split('.');
                    if (table === 'acc_portal_company_duplicate') {
                      acc[field] = value;
                    }
                    return acc;
                  }, {})
                }
              };
            }
            return item;
          });
      
          setData(updatedDataArray);
          
          // Refresh data from server
          await fetchAllData(activeMainTab, activeSubTab);
        } catch (error) {
          console.error('Error saving data:', error);
          toast.error('Failed to save changes');
        }
      };
    useEffect(() => {
        const initializeData = async () => {
            await fetchStructure();
            const defaultMainTab = mainTabs[0] || '';
            const defaultSubTab = subTabs[defaultMainTab]?.[0] || '';
            setActiveMainTab(defaultMainTab);
            setActiveSubTab(defaultSubTab);
            await fetchAllData(defaultMainTab, defaultSubTab);
        };

        initializeData();

        const handleRefresh = () => fetchAllData(activeMainTab, activeSubTab);
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
    }, []);

    const processTabSections = useMemo(() => (selectedMainTab: string, selectedSubTab: string) => {
        // Initialize with default columns
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
            }
        ];
    
        const relevantMappings = structure.filter(item =>
            item.Tabs === selectedSubTab && item.main_tab === selectedMainTab
        );
    
        relevantMappings.forEach(mapping => {
            // console.log('Processing mapping:', mapping);
    
            // Parse all JSON structures
            const sections = mapping.sections_sections || {};
            const subsections = mapping.sections_subsections || {};
            const columnMappings = mapping.column_mappings || {};
            const fieldDropdowns = mapping.field_dropdowns || {};
            const tableNames = mapping.table_names || {};
    
            // Process each section
            Object.entries(sections).forEach(([sectionName, sectionValue], index, arr) => {
                // Skip if not a valid section
                if (!sectionValue) return;
    
                // Get subsection value
                const sectionSubsection = subsections[sectionName];
                
                // Get tables for this section
                const sectionTables = tableNames[sectionName] || [];
                
                // Process fields for this section
                const fields = Object.entries(columnMappings)
                    .filter(([key]) => {
                        const tableName = key.split('.')[0];
                        return sectionTables.includes(tableName);
                    })
                    .map(([key, value]) => {
                        const [table, column] = key.split('.');
                        return {
                            name: key,
                            label: value,
                            table,
                            column,
                            dropdownOptions: fieldDropdowns[key] || [],
                            subCategory: typeof sectionSubsection === 'string' ? sectionSubsection : sectionName
                        };
                    });
    
                // Add section to processed sections
                processedSections.push({
                    name: sectionName,
                    label: sectionName,
                    categorizedFields: [{
                        category: typeof sectionSubsection === 'string' ? sectionSubsection : sectionName,
                        fields: fields
                    }]
                });
    
                // Add separator if not the last section
                if (index < arr.length - 1) {
                    processedSections.push({
                        isSeparator: true,
                        name: `${sectionName}-separator`
                    });
                }
            });
        });
    
        // console.log('Final processed sections:', processedSections);
        return processedSections;
    }, [structure]);

    const handleCompanyClick = useCallback((company: any) => {
        console.log('Selected company data:', company);
        const selectedCompanyData = {
            company: company,  // Changed this line - pass the entire company object
            rows: company.rows,
            activeTab: activeSubTab,
        };
        console.log('Prepared company data:', selectedCompanyData);
        setSelectedCompany(selectedCompanyData);
        setIsEditDialogOpen(true);
    }, [activeMainTab, activeSubTab, processTabSections]);

    const handleMainTabChange = useCallback((tabValue: string) => {
        setActiveMainTab(tabValue);
        const newSubTab = subTabs[tabValue]?.[0] || '';
        setActiveSubTab(newSubTab);
        fetchAllData(tabValue, newSubTab);
    }, [subTabs, fetchAllData]);

    const handleSubTabChange = useCallback((tabValue: string) => {
        setActiveSubTab(tabValue);
        fetchAllData(activeMainTab, tabValue);
    }, [activeMainTab, fetchAllData]);

    if (loading) {
        return <div>Loading...</div>;
    }
// Add to OverallView.tsx
const toggleTabVisibility = async (tab: string) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping')
        .update({
          column_order: {
            ...currentOrder,
            visibility: {
              ...currentOrder.visibility,
              tabs: {
                ...currentOrder.visibility.tabs,
                [tab]: !currentOrder.visibility.tabs[tab]
              }
            }
          }
        })
        .eq('Tabs', tab);
  
      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error toggling tab visibility:', error);
      toast.error('Failed to toggle tab visibility');
    }
  };

    return (
        <div className="h-screen flex flex-col">
            <Tabs defaultValue={mainTabs[0]} onValueChange={handleMainTabChange} className="h-full flex flex-col">
                <TabsList className="w-full grid grid-cols-5 bg-gray-100 rounded-lg p-1">
                    {mainTabs.map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeMainTab} className="h-full">
                    <div className="h-full flex flex-col">
                        <div className="flex gap-4 p-6">
                            <SettingsDialog
                                mainTabs={mainTabs}
                                mainSections={mainSections}
                                mainSubsections={mainSubsections}
                                onStructureChange={fetchStructure}
                                activeMainTab={activeMainTab}
                                subTabs={subTabs[activeMainTab] || []}
                                processedSections={processTabSections(activeMainTab, activeSubTab)}
                            />
                            <ImportDialog
                                isOpen={isImportDialogOpen}
                                onClose={() => setIsImportDialogOpen(false)}
                                onImport={(file) => handleImport(file, activeMainTab, activeSubTab)}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsImportDialogOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import
                                </Button>
                                <Button
                                    onClick={() => handleExport(activeMainTab, activeSubTab)}
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <Tabs defaultValue={subTabs[activeMainTab]?.[0]} onValueChange={handleSubTabChange} className="h-full flex flex-col">
                                <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
                                    {(subTabs[activeMainTab] || []).map(tab => (
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
                                    <TabsContent
                                        value={activeSubTab}
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
                                                                const processedSections = processTabSections(activeMainTab, activeSubTab);
                                                                setSelectedMissingFields(company);
                                                                setIsMissingFieldsOpen(true);
                                                            }}
                                                            refreshData={() => fetchAllData(activeMainTab, activeSubTab)} // Pass the refresh function
                                                            processedSections={processTabSections(activeMainTab, activeSubTab)}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            <CompanyEditDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                companyData={selectedCompany}
                processedSections={processTabSections(activeMainTab, activeSubTab)}
                onSave={handleSave}
                mainActiveTab={activeMainTab}
            />


            <MissingFieldsDialog
                isOpen={isMissingFieldsOpen}
                onClose={() => setIsMissingFieldsOpen(false)}
                companyData={selectedMissingFields}
                processedSections={processTabSections(activeMainTab, activeSubTab)}
                onSave={handleSave}
            />
        </div>
    );
};

export default OverallView;