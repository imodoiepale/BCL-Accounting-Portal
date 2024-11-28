// OverallView.tsx
// @ts-nocheck
"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
    const initializeRef = useRef(false);

    // Table data mapping implementation
const processDataForTable = (baseCompaniesResult, tableData) => {
    const companyDataMap = new Map();
  
    // Always process all companies, regardless of related data
    baseCompaniesResult.forEach(company => {
      const companyName = company.company_name?.toLowerCase();
      const companyId = company.company_id;
      const mergedData = { ...company };
      const additionalRows = [];
  
      // Process each related table if any data exists
      if (tableData) {
        Object.entries(tableData).forEach(([tableName, records]) => {
          if (tableName === 'acc_portal_company_duplicate') return;
  
          const relatedRecords = records?.filter(record => {
            const recordCompanyName = record.company_name?.toLowerCase();
            return recordCompanyName === companyName || record.company_id === companyId;
          });
  
          if (relatedRecords?.length) {
            // Add the first record to the main company data
            mergedData[`${tableName}_data`] = relatedRecords[0];
  
            // Add additional records as separate rows
            if (relatedRecords.length > 1) {
              additionalRows.push(...relatedRecords.slice(1).map(record => ({
                ...record,
                isAdditionalRow: true,
                sourceTable: tableName
              })));
            }
          }
        });
      }
  
      // Always create an entry for the company
      companyDataMap.set(companyName, {
        company: mergedData,
        rows: [
          { ...mergedData, isFirstRow: true },
          ...additionalRows
        ],
        rowSpan: 1 + additionalRows.length
      });
    });
  
    return Array.from(companyDataMap.values());
  };

  
    const fetchAllData = useCallback(async (activeMainTab: string, activeSubTab: string) => {
        // console.log('Starting fetchAllData with:', { activeMainTab, activeSubTab });
        
        try {
            if (!activeMainTab || !activeSubTab) {
                console.log('No active tabs, returning empty data');
                setData([]);
                return;
            }
    
            // First, get the mapping configuration
            const { data: mappings, error: mappingError } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .eq('main_tab', activeMainTab);
    
            console.log('Initial mappings fetch:', mappings);
    
            if (mappingError || !mappings?.length) {
                console.error('Error fetching mappings:', mappingError);
                setData([]);
                return;
            }
    
            // Find the correct mapping for the active sub tab
            const activeMapping = mappings.find(mapping => {
                const parsedTabs = safeJSONParse(mapping.Tabs);
                return parsedTabs?.name === activeSubTab;
            });
    
            if (!activeMapping) {
                console.error('No mapping found for sub tab:', activeSubTab);
                setData([]);
                return;
            }
    
            // Parse the table names from the active mapping
            const tableNames = safeJSONParse(activeMapping.table_names);
            const allTables = [...new Set(Object.values(tableNames).flat())];
    
            console.log('Tables to fetch:', allTables);
    
            // First fetch all companies
            const { data: companies, error: companiesError } = await supabase
                .from('acc_portal_company_duplicate')
                .select('*')
                .order('id');
    
            if (companiesError) {
                console.error('Error fetching companies:', companiesError);
                throw companiesError;
            }
    
            // Then fetch data from other tables using company names
            const tableData = {
                'acc_portal_company_duplicate': companies
            };
    
            // Fetch data from each related table
            await Promise.all(
                allTables
                    .filter(table => table !== 'acc_portal_company_duplicate')
                    .map(async (tableName) => {
                        // Get unique company names for the query
                        const companyNames = companies.map(c => c.company_name?.toLowerCase()).filter(Boolean);
                        
                        if (companyNames.length === 0) return;
    
                        const { data, error } = await supabase
                            .from(tableName)
                            .select('*')
                            .filter('company_name', 'in', `(${companyNames.join(',')})`)
                            .order('id');
    
                        if (error) {
                            console.error(`Error fetching data for ${tableName}:`, error);
                            return;
                        }
    
                        tableData[tableName] = data || [];
                    })
            );
    
            // Process the data
            const processedData = processDataForTable(companies, tableData);
            // console.log('Processed data:', processedData);
    
            setData(processedData);
        } catch (error) {
            console.error('Error in fetchAllData:', error);
            toast.error('Failed to fetch data');
            setData([]);
        }
    }, []);

    const fetchStructure = useCallback(async () => {
        console.log('Starting fetchStructure');
        try {
            const { data: mappings, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .order('id');
    
            if (error) {
                console.error('Error fetching mappings:', error);
                throw error;
            }
    
            // Process mappings
            const processedMappings = mappings.map(mapping => ({
                ...mapping,
                Tabs: safeJSONParse(mapping.Tabs),
                sections_sections: safeJSONParse(mapping.sections_sections),
                sections_subsections: safeJSONParse(mapping.sections_subsections),
                column_mappings: safeJSONParse(mapping.column_mappings),
                column_order: safeJSONParse(mapping.column_order),
                table_names: safeJSONParse(mapping.table_names),
                field_dropdowns: safeJSONParse(mapping.field_dropdowns)
            }));
    
            // Extract unique main tabs
            const uniqueMainTabs = [...new Set(mappings.map(m => m.main_tab))].filter(Boolean);
    
            // Process sub tabs for each main tab
            const subTabsMap = uniqueMainTabs.reduce((acc, mainTab) => {
                const tabsForMainTab = processedMappings
                    .filter(m => m.main_tab === mainTab)
                    .map(m => m.Tabs)
                    .filter(Boolean);
                acc[mainTab] = tabsForMainTab;
                return acc;
            }, {});
    
            // Update all states at once
            setStructure(processedMappings);
            setMainTabs(uniqueMainTabs);
            setSubTabs(subTabsMap);
    
            // Return the processed data and default tabs
            return {
                processedMappings,
                defaultMainTab: uniqueMainTabs[0],
                defaultSubTab: subTabsMap[uniqueMainTabs[0]]?.[0]?.name
            };
        } catch (error) {
            console.error('Error in fetchStructure:', error);
            toast.error('Failed to fetch structure');
            return {};
        }
    }, []);
    const fetchAssociatedData = async (mapping) => {
        console.log('Starting fetchAssociatedData with mapping:', mapping);
        
        try {
          // Ensure table_names is properly parsed
          let tableNames = [];
          if (typeof mapping.table_names === 'string') {
            // Parse the JSON string
            const parsedTableNames = JSON.parse(mapping.table_names);
            // Extract all table names from the object's arrays
            tableNames = Object.values(parsedTableNames).flat();
          } else if (typeof mapping.table_names === 'object') {
            // If already parsed, just extract the table names
            tableNames = Object.values(mapping.table_names).flat();
          }
          
          console.log('Parsed table names:', tableNames);
          
          if (!Array.isArray(tableNames) || tableNames.length === 0) {
            console.warn('No valid table names found');
            return {};
          }
      
          // Fetch data from each table
          const tableData = await Promise.all(
            tableNames.map(async (tableName) => {
              if (!tableName || typeof tableName !== 'string') {
                console.warn('Invalid table name:', tableName);
                return { tableName: '', data: [] };
              }
              
              console.log('Fetching data for table:', tableName);
              
              const { data, error } = await supabase
                .from(tableName)
                .select('*');
                
              if (error) {
                console.error(`Error fetching data for table ${tableName}:`, error);
                return { tableName, data: [] };
              }
              
              console.log(`Data fetched for table ${tableName}:`, data);
              return {
                tableName,
                data: data || []
              };
            })
          );
          
          // Convert array of results into an object
          const result = Object.fromEntries(
            tableData.map(({ tableName, data }) => [tableName, data])
          );
          
          console.log('Combined table data:', result);
          return result;
        } catch (error) {
          console.error('Error in fetchAssociatedData:', error);
          return {};
        }
      };
      
      // Helper function to get structured data
      const getStructuredData = async (mainTab) => {
        console.log('Starting getStructuredData for mainTab:', mainTab);
        
        try {
          const { data: mappings, error } = await supabase
            .from('profile_category_table_mapping')
            .select('*')
            .eq('main_tab', mainTab);
      
          if (error) throw error;
          if (!mappings?.length) return [];
      
          const processedData = await Promise.all(mappings.map(async (mapping) => {
            const sections_sections = JSON.parse(mapping.sections_sections || '{}');
            const sections_subsections = JSON.parse(mapping.sections_subsections || '{}');
            const Tabs = JSON.parse(mapping.Tabs || '{}');
            const table_names = JSON.parse(mapping.table_names || '{}');
            
            const tableData = await fetchAssociatedData({ ...mapping, table_names });
            
            const structuredData = Object.entries(sections_sections)
              .filter(([_, isActive]) => isActive)
              .map(([sectionName]) => {
                const subsection = sections_subsections[sectionName];
                const tableName = table_names[sectionName]?.[0]; // Take first table if multiple
                
                return {
                  tab: Tabs.name,
                  section: sectionName,
                  subsection,
                  data: tableData[tableName] || []
                };
              });
              
            return {
              tabName: Tabs.name,
              tabOrder: Tabs.order,
              tabVisibility: Tabs.visibility,
              sections: structuredData
            };
          }));
      
          return processedData;
        } catch (error) {
          console.error('Error in getStructuredData:', error);
          return [];
        }
      };

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
        if (initializeRef.current) return;
        console.log('OverallView useEffect triggered');
    
        const initializeData = async () => {
            console.log('Initializing data...');
            initializeRef.current = true;
    
            const { processedMappings, defaultMainTab, defaultSubTab } = await fetchStructure();
            
            if (defaultMainTab && defaultSubTab) {
                console.log('Setting default tabs:', { defaultMainTab, defaultSubTab });
                setActiveMainTab(defaultMainTab);
                setActiveSubTab(defaultSubTab);
                await fetchAllData(defaultMainTab, defaultSubTab);
            }
            setLoading(false);
        };
    
        initializeData();
    
        const handleRefresh = () => {
            console.log('Refresh event triggered');
            if (activeMainTab && activeSubTab) {
                fetchAllData(activeMainTab, activeSubTab);
            }
        };
        
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
    }, [fetchStructure]); // Only depend on fetchStructure

    const processTabSections = useMemo(() => (selectedMainTab: string, selectedSubTab: string) => {
        // Initialize with default columns
        const processedSections = [
            {
              name: 'index',
              label: 'Index',
              categorizedFields: []
            },
            {
              name: 'missing-fields',
              label: 'Missing Fields',
              categorizedFields: [{
                category: '',
                fields: [{
                  name: 'missing_fields',
                  label: 'Missing Fields',
                  isSpecial: true // Add this flag to identify special columns
                }]
              }]
            },
            {
              name: 'company',
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
            item.Tabs?.name === selectedSubTab && item.main_tab === selectedMainTab
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
        return (
            <div className="h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
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
    {mainTabs.length > 0 ? mainTabs.map(tab => (
        <TabsTrigger
            key={tab}
            value={tab}
            className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
        >
            {tab}
        </TabsTrigger>
    )) : (
        <div>No tabs available</div>
    )}
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
    {(subTabs[activeMainTab] || []).map(tab => {
        // Make sure we're accessing the correct property
        const tabName = typeof tab === 'object' ? tab.name : tab;
        return (
            <TabsTrigger
                key={tabName}
                value={tabName}
                className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
            >
                {tabName}
            </TabsTrigger>
        );
    })}
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