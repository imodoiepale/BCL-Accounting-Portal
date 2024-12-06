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
import { cacheUtils as redisCache } from '@/lib/redis';

const safeJSONParse = (jsonString: string, defaultValue = {}) => {
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
    const [allData, setAllData] = useState(new Map());
    const [currentData, setCurrentData] = useState([]);
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
    const [visibilityState, setVisibilityState] = useState<VisibilitySettings>({
        tabs: {},
        sections: {},
        subsections: {},
        fields: {}
    });
    const dataCache = useRef(new Map());
    const [fetchError, setFetchError] = useState(null);
    const [orderState, setOrderState] = useState<OrderSettings>({
        tabs: {},
        sections: {},
        subsections: {},
        fields: {}
    });

    const clientCacheUtils = {
        async get(key: string) {
            try {
                const response = await fetch(`/api/cache?key=${encodeURIComponent(key)}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Cache get error:', error);
                return null;
            }
        },

        async set(key: string, data: any) {
            try {
                await fetch('/api/cache', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, data })
                });
            } catch (error) {
                console.error('Cache set error:', error);
            }
        },

        async invalidate(pattern: string) {
            try {
                await fetch(`/api/cache?pattern=${encodeURIComponent(pattern)}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Cache invalidate error:', error);
            }
        },

        async getAllData() {
            try {
                const response = await fetch('/api/cache?key=all_tabs_data');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Cache getAllData error:', error);
                return null;
            }
        }
    };

    // Replace the existing cacheUtils constant with:
    const cacheUtils = {
        ...clientCacheUtils,
        ...(typeof window !== 'undefined' ? window.cacheUtils : {})
    };


    const memoizedCurrentData = useMemo(() => currentData, [currentData]);
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);

                // Single fetch for all data and structure
                const { data: mappings } = await supabase
                    .from('profile_category_table_mapping_2')
                    .select('*')
                    .order('main_tab')
                    .order('Tabs');

                if (!mappings) throw new Error('No data found');

                // Process structure data in one pass
                const mainTabsSet = new Set<string>();
                const subTabsMap: { [key: string]: string[] } = {};
                const sectionsSet = new Set<string>();
                const subsectionsSet = new Set<string>();
                const allTables = new Set(['acc_portal_company_duplicate']);

                mappings.forEach(mapping => {
                    if (!mapping) return;

                    if (mapping.main_tab) mainTabsSet.add(mapping.main_tab);
                    if (mapping.main_tab && mapping.Tabs) {
                        if (!subTabsMap[mapping.main_tab]) subTabsMap[mapping.main_tab] = [];
                        if (!subTabsMap[mapping.main_tab].includes(mapping.Tabs)) {
                            subTabsMap[mapping.main_tab].push(mapping.Tabs);
                        }
                    }

                    if (mapping?.structure?.sections) {
                        mapping.structure.sections.forEach(section => {
                            if (section?.name) sectionsSet.add(section.name);
                            section.subsections?.forEach(subsection => {
                                if (subsection?.name) subsectionsSet.add(subsection.name);
                                subsection.tables?.forEach(table => allTables.add(table));
                            });
                        });
                    }
                });

                // Fetch all table data at once
                const tableResponses = await Promise.all(
                    Array.from(allTables).map(tableName =>
                        supabase.from(tableName).select('*').order('id')
                    )
                );

                const tableData = {};
                Array.from(allTables).forEach((tableName, index) => {
                    tableData[tableName] = tableResponses[index].data || [];
                });

                // Process all tab data at once and keep in memory
                const processedData = new Map();
                mappings.forEach(mapping => {
                    const mainTab = mapping.main_tab;
                    const subTab = mapping.Tabs;
                    const key = `${mainTab}:${subTab}`;
                    const tabData = processTabData(tableData, mapping);
                    processedData.set(key, tabData);
                });

                // Set all state at once
                const defaultMainTab = Array.from(mainTabsSet)[0] || '';
                const defaultSubTab = subTabsMap[defaultMainTab]?.[0] || '';

                setStructure(mappings);
                setMainTabs(Array.from(mainTabsSet));
                setSubTabs(subTabsMap);
                setMainSections(Array.from(sectionsSet));
                setMainSubsections(Array.from(subsectionsSet));
                setAllData(processedData);
                setActiveMainTab(defaultMainTab);
                setActiveSubTab(defaultSubTab);
                setCurrentData(processedData.get(`${defaultMainTab}:${defaultSubTab}`) || []);

                setLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setFetchError(error);
                setLoading(false);
            }
        };

        initializeData();
    }, []);
    // Helper function to process tab data
    const processTabData = (tableData, mapping) => {
        const companyDataMap = new Map();

        tableData['acc_portal_company_duplicate'].forEach(company => {
            const companyName = company.company_name?.toLowerCase();
            const companyId = company.company_id;
            const mergedData = { ...company };
            const additionalRows = [];

            // Get relevant tables for this mapping
            const relevantTables = new Set();
            if (mapping?.structure?.sections) {
                mapping.structure.sections.forEach(section => {
                    section.subsections?.forEach(subsection => {
                        subsection.tables?.forEach(table => relevantTables.add(table));
                    });
                });
            }

            // Process each relevant table
            relevantTables.forEach(tableName => {
                if (tableName === 'acc_portal_company_duplicate') return;

                const relatedRecords = tableData[tableName]?.filter(record => {
                    return record.company_name?.toLowerCase() === companyName ||
                        record.company_id === companyId;
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

            const entry = {
                company: mergedData,
                rows: [
                    { ...mergedData, isFirstRow: true },
                    ...additionalRows
                ],
                rowSpan: 1 + additionalRows.length
            };

            companyDataMap.set(companyName, entry);
        });

        return Array.from(companyDataMap.values());
    };

    // Add cache clearing on data updates
    const clearCache = useCallback(() => {
        dataCache.current.clear();
    }, []);



    const handleSave = async (updatedData: any) => {
        try {
            // Update local state
            const newAllData = new Map(allData);
            const key = `${activeMainTab}:${activeSubTab}`;
            const currentTabData = newAllData.get(key) || [];

            const updatedTabData = currentTabData.map(item => {
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

            newAllData.set(key, updatedTabData);
            setAllData(newAllData);
            setCurrentData(updatedTabData);

            // Invalidate Redis cache
            await cacheUtils.invalidate('all_tabs_data');

            // Refetch all data
            await fetchAllTabsData();

        } catch (error) {
            console.error('Error saving data:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleStructureUpdate = async () => {
        try {
            setLoading(true);

            // Fetch new structure
            const { data: mappings } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('main_tab')
                .order('Tabs');

            if (!mappings) throw new Error('No data found');

            // Process structure data
            const mainTabsSet = new Set<string>();
            const subTabsMap: { [key: string]: string[] } = {};
            const sectionsSet = new Set<string>();
            const subsectionsSet = new Set<string>();

            mappings.forEach(mapping => {
                if (!mapping) return;

                if (mapping.main_tab) mainTabsSet.add(mapping.main_tab);
                if (mapping.main_tab && mapping.Tabs) {
                    if (!subTabsMap[mapping.main_tab]) subTabsMap[mapping.main_tab] = [];
                    if (!subTabsMap[mapping.main_tab].includes(mapping.Tabs)) {
                        subTabsMap[mapping.main_tab].push(mapping.Tabs);
                    }
                }

                if (mapping?.structure?.sections) {
                    mapping.structure.sections.forEach(section => {
                        if (section?.name) sectionsSet.add(section.name);
                        section.subsections?.forEach(subsection => {
                            if (subsection?.name) subsectionsSet.add(subsection.name);
                        });
                    });
                }
            });

            // Update structure state
            setStructure(mappings);
            setMainTabs(Array.from(mainTabsSet));
            setSubTabs(subTabsMap);
            setMainSections(Array.from(sectionsSet));
            setMainSubsections(Array.from(subsectionsSet));

            setLoading(false);
        } catch (error) {
            console.error('Error updating structure:', error);
            toast.error('Failed to update structure');
            setLoading(false);
        }
    };

    const processTabSections = useMemo(() => (activeMainTab: string, activeSubTab: string) => {
        const isSpecialView = ['employee details', 'customer details', 'supplier details'].includes(activeMainTab?.toLowerCase());

        // Initialize with basic columns
        const processedSections = [
            {
                name: 'index',
                label: 'Index',
                categorizedFields: []
            },
            {
                isSeparator: true,
                name: 'company-name-separator'
            }
        ];

        // Only add default columns if not in special view
        if (!isSpecialView) {
            processedSections.push({
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
                    }, {
                        name: 'acc_portal_company_duplicate.index',
                        label: 'Index',
                        table: 'acc_portal_company_duplicate',
                        column: 'index',
                        subCategory: 'Company Info'
                    }]
                }]
            });
        }

        const relevantMapping = structure.find(item =>
            item?.Tabs === activeSubTab &&
            item?.main_tab === activeMainTab
        );

        if (relevantMapping?.structure?.sections) {
            const { sections } = relevantMapping.structure;

            // Process each section
            sections.forEach((section, index) => {
                if (visibilityState.sections[section.name] === false) return;

                if (section?.subsections) {
                    const processedSubsections = [];

                    section.subsections.forEach(subsection => {
                        if (visibilityState.subsections[subsection.name] === false) return;

                        let fields = subsection?.fields
                            ?.filter(field => {
                                const fieldKey = `${field.table}.${field.name}`;
                                return visibilityState.fields[fieldKey] !== false;
                            })
                            .map(field => ({
                                name: `${field.table}.${field.name}`,
                                label: field.display,
                                table: field.table,
                                column: field.name,
                                dropdownOptions: field.dropdownOptions || [],
                                subCategory: subsection.name
                            })) || [];

                        if (fields.length > 0) {
                            fields = fields.sort((a, b) => {
                                const orderA = orderState.fields[`${a.table}.${a.column}`] || 0;
                                const orderB = orderState.fields[`${b.table}.${b.column}`] || 0;
                                return orderA - orderB;
                            });

                            processedSubsections.push({
                                category: subsection.name,
                                fields: fields
                            });
                        }
                    });

                    if (processedSubsections.length > 0) {
                        processedSections.push({
                            name: section.name,
                            label: section.name,
                            categorizedFields: processedSubsections
                        });

                        if (index < sections.length - 1) {
                            processedSections.push({
                                isSeparator: true,
                                name: `${section.name}-separator`
                            });
                        }
                    }
                }
            });
        }

        return processedSections.sort((a, b) => {
            if (a.isSeparator || b.isSeparator) return 0;
            const orderA = orderState.sections[a.name] || 0;
            const orderB = orderState.sections[b.name] || 0;
            return orderA - orderB;
        });
    }, [structure, visibilityState, orderState, activeMainTab, activeSubTab]);


    // Add this useEffect to initialize visibility and order states when structure changes
    useEffect(() => {
        if (structure.length > 0) {
            const relevantMapping = structure.find(item =>
                item?.Tabs === activeSubTab &&
                item?.main_tab === activeMainTab
            );

            if (relevantMapping?.structure) {
                const newVisibilityState = {
                    tabs: {},
                    sections: {},
                    subsections: {},
                    fields: {}
                };

                const newOrderState = {
                    tabs: {},
                    sections: {},
                    subsections: {},
                    fields: {}
                };

                // Process visibility and order states from the structure
                relevantMapping.structure.sections.forEach((section, sectionIndex) => {
                    newVisibilityState.sections[section.name] = section.visible !== false;
                    newOrderState.sections[section.name] = section.order || sectionIndex;

                    section.subsections?.forEach((subsection, subsectionIndex) => {
                        newVisibilityState.subsections[subsection.name] = subsection.visible !== false;
                        newOrderState.subsections[subsection.name] = subsection.order || subsectionIndex;

                        subsection.fields?.forEach((field, fieldIndex) => {
                            const fieldKey = `${field.table}.${field.name}`;
                            newVisibilityState.fields[fieldKey] = field.visible !== false;
                            newOrderState.fields[fieldKey] = field.order || fieldIndex;
                        });
                    });
                });

                setVisibilityState(newVisibilityState);
                setOrderState(newOrderState);
            }
        }
    }, [structure, activeMainTab, activeSubTab]);

    const handleCompanyClick = useCallback((company: any) => {
        console.log('Selected company data:', company);
        const selectedCompanyData = {
            company: company,
            rows: company.rows,
            activeTab: activeSubTab,
        };
        console.log('Prepared company data:', selectedCompanyData);
        setSelectedCompany(selectedCompanyData);
        setIsEditDialogOpen(true);
    }, [activeSubTab]);

    const handleMainTabChange = useCallback((tabValue) => {
        if (tabValue === activeMainTab) return;

        const newSubTab = subTabs[tabValue]?.[0] || '';
        setActiveMainTab(tabValue);
        setActiveSubTab(newSubTab);
        setCurrentData(allData.get(`${tabValue}:${newSubTab}`) || []);
    }, [activeMainTab, subTabs, allData]);

    const handleSubTabChange = useCallback((tabValue) => {
        if (tabValue === activeSubTab) return;

        setActiveSubTab(tabValue);
        setCurrentData(allData.get(`${activeMainTab}:${tabValue}`) || []);
    }, [activeMainTab, activeSubTab, allData]);


    if (loading || !structure.length || !mainTabs.length) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h3 className="text-lg font-medium">Loading data...</h3>
                    <p className="text-gray-500 mt-2">Please wait while we fetch your data</p>
                </div>
            </div>
        );
    }

    if (!currentData.length && !loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-yellow-600">No data available</h3>
                    <p className="text-gray-500 mt-2">Try selecting a different tab or refreshing the page</p>
                    <Button
                        onClick={() => fetchAllTabsData()}
                        className="mt-4"
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>
        );
    }

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

            // Call handleStructureUpdate instead of fetchStructure
            await handleStructureUpdate();
        } catch (error) {
            console.error('Error toggling tab visibility:', error);
            toast.error('Failed to toggle tab visibility');
        }
    };
    if (fetchError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-red-600">Error loading data</h3>
                    <p className="text-gray-500 mt-2">{fetchError.message}</p>
                    <Button
                        onClick={() => {
                            setFetchError(null);
                            fetchAllData(activeMainTab, activeSubTab);
                        }}
                        className="mt-4"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }
    return (
        <div className="h-[1100px] flex flex-col">
            <Tabs defaultValue={mainTabs[0]} value={activeMainTab} onValueChange={handleMainTabChange} className="h-full flex flex-col">
                <TabsList className="w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] grid bg-gray-100 rounded-lg p-1">
                    {mainTabs.map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            disabled={loading}
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
                                onStructureChange={handleStructureUpdate}
                                activeMainTab={activeMainTab}
                                activeSubTab={activeSubTab}
                                subTabs={subTabs[activeMainTab] || []}
                                processedSections={processTabSections(activeMainTab, activeSubTab)}
                                visibilityState={visibilityState}
                                orderState={orderState}
                                onVisibilityChange={setVisibilityState}
                                onOrderChange={setOrderState}
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
                            <Tabs defaultValue={subTabs[activeMainTab]?.[0]} value={activeSubTab} onValueChange={handleSubTabChange} className="h-full flex flex-col">
                                <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
                                    {(subTabs[activeMainTab] || []).map(tab => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            disabled={loading}
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
                                        <Card className="h-[890px] flex flex-col">
                                            <CardContent className="flex-1 p-0 overflow-hidden">
                                                <div className="h-[890px] overflow-auto">
                                                    <div className="min-w-max">
                                                        <Table
                                                            data={memoizedCurrentData}
                                                            handleCompanyClick={handleCompanyClick}
                                                            onMissingFieldsClick={(company) => {
                                                                const processedSections = processTabSections(activeMainTab, activeSubTab);
                                                                setSelectedMissingFields(company);
                                                                setIsMissingFieldsOpen(true);
                                                            }}
                                                            processedSections={processTabSections(activeMainTab, activeSubTab)}
                                                            activeMainTab={activeMainTab}
                                                            activeSubTab={activeSubTab}
                                                            
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
