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
    const [visibilityState, setVisibilityState] = useState<VisibilitySettings>({
        tabs: {},
        sections: {},
        subsections: {},
        fields: {}
    });

    const [orderState, setOrderState] = useState<OrderSettings>({
        tabs: {},
        sections: {},
        subsections: {},
        fields: {}
    });

    const fetchAllData = useCallback(async (activeMainTab: string, activeSubTab: string) => {
        try {
            if (!activeMainTab || !activeSubTab) {
                setData([]);
                return;
            }

            const { data: mapping, error: mappingError } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .eq('Tabs', activeSubTab)
                .eq('main_tab', activeMainTab)
                .single();

            if (mappingError) throw mappingError;

            // Get all unique tables from the structure
            const tables = new Set<string>();
            if (mapping?.structure?.sections) {
                mapping.structure.sections.forEach(section => {
                    if (section?.subsections) {
                        section.subsections.forEach(subsection => {
                            if (subsection?.tables) {
                                subsection.tables.forEach(table => tables.add(table));
                            }
                        });
                    }
                });
            }

            // Fetch data from all tables
            const [baseCompaniesResult, ...otherResults] = await Promise.all([
                supabase
                    .from('acc_portal_company_duplicate')
                    .select('*')
                    .order('id'),
                ...Array.from(tables)
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

            Array.from(tables)
                .filter(table => table !== 'acc_portal_company_duplicate')
                .forEach((tableName, index) => {
                    const result = otherResults[index];
                    if (!result.error) {
                        tableData[tableName.toString()] = result.data || [];
                    }
                });

            // Process relationships and merge data
            const companyDataMap = new Map();

            baseCompaniesResult.data.forEach(company => {
                const companyName = company.company_name?.toLowerCase();
                const companyId = company.company_id;
                const mergedData = { ...company };
                const additionalRows = [];

                Array.from(tables).forEach(tableName => {
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
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('main_tab')
                .order('Tabs');

            if (error) throw error;
            if (!mappings) throw new Error('No mappings found');

            // Process mappings to extract tabs, sections, etc.
            const mainTabsSet = new Set<string>();
            const subTabsMap: { [key: string]: string[] } = {};
            const sectionsSet = new Set<string>();
            const subsectionsSet = new Set<string>();

            mappings.forEach(mapping => {
                if (!mapping) return;

                // Add main tab
                if (mapping.main_tab) {
                    mainTabsSet.add(mapping.main_tab);
                }

                // Process sub tabs
                if (mapping.main_tab && mapping.Tabs) {
                    if (!subTabsMap[mapping.main_tab]) {
                        subTabsMap[mapping.main_tab] = [];
                    }
                    if (!subTabsMap[mapping.main_tab].includes(mapping.Tabs)) {
                        subTabsMap[mapping.main_tab].push(mapping.Tabs);
                    }
                }

                // Process sections and subsections
                if (mapping.structure?.sections) {
                    mapping.structure.sections.forEach(section => {
                        if (section?.name) {
                            sectionsSet.add(section.name);
                        }
                        if (section?.subsections) {
                            section.subsections.forEach(subsection => {
                                if (subsection?.name) {
                                    subsectionsSet.add(subsection.name);
                                }
                            });
                        }
                    });
                }
            });

            setStructure(mappings);
            setMainTabs(Array.from(mainTabsSet));
            setSubTabs(subTabsMap);
            setMainSections(Array.from(sectionsSet));
            setMainSubsections(Array.from(subsectionsSet));

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

    // Update the processTabSections function in OverallView.tsx

    const processTabSections = useMemo(() => (activeMainTab: string, activeSubTab: string) => {  // Initialize with default columns
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

        // Add the index field if not in company details tab
        if (activeMainTab.toLowerCase() !== 'company details') {
            processedSections[2].categorizedFields[0].fields.push({
                name: 'acc_portal_company_duplicate.index',
                label: 'Index',
                table: 'acc_portal_company_duplicate',
                column: 'index',
                subCategory: 'Company Info'
            });
        }

        const relevantMapping = structure.find(item =>
            item?.Tabs === activeSubTab  &&
            item?.main_tab === activeMainTab
        );

        if (relevantMapping?.structure?.sections) {
            const { sections } = relevantMapping.structure;

            // Process each section
            sections.forEach((section, index) => {
                // Only check visibility if it's explicitly set to false
                if (visibilityState.sections[section.name] === false) return;

                if (section?.subsections) {
                    const processedSubsections = [];

                    section.subsections.forEach(subsection => {
                        // Only check visibility if it's explicitly set to false
                        if (visibilityState.subsections[subsection.name] === false) return;

                        let fields = subsection?.fields
                            ?.filter(field => {
                                const fieldKey = `${field.table}.${field.name}`;
                                // Only filter out if explicitly set to false
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

                        // Sort fields by order if available
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

                        // Add separator after each section except the last one
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

        // Sort sections by order if available
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
