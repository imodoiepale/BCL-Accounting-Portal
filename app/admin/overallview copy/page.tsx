// OverallView.tsx
// @ts-nocheck
"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Settings, Upload, Download } from 'lucide-react';
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { handleExport, handleImport } from './components/utility';

// Dynamic imports
const Table = dynamic(() =>
    import('./components/overview/TableComponents').then(mod => mod.Table || mod.default), {
    ssr: false,
    loading: () => <div>Loading table...</div>
});

const SettingsDialog = dynamic(() =>
    import('./components/overview/Dialogs/settingsDialog').then(mod => mod.SettingsDialog || mod.default), {
    ssr: false,
    loading: () => <div>Loading settings...</div>
});

const MissingFieldsDialog = dynamic(() =>
    import('./components/missingFieldsDialog').then(mod => mod.MissingFieldsDialog || mod.default), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

const CompanyEditDialog = dynamic(() =>
    import('./components/overview/Dialogs/CompanyEditDialog').then(mod => mod.CompanyEditDialog || mod.default), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

const ImportDialog = dynamic(() =>
    import('./components/overview/Dialogs/ImportDialog').then(mod => mod.ImportDialog || mod.default), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

// Types
interface VisibilitySettings {
    tabs: Record<string, boolean>;
    sections: Record<string, boolean>;
    subsections: Record<string, boolean>;
    fields: Record<string, boolean>;
}

interface OrderSettings {
    tabs: Record<string, number>;
    sections: Record<string, number>;
    subsections: Record<string, number>;
    fields: Record<string, number>;
}

const processTabData = (tableData: any, mapping: any) => {
    try {
        const companies = tableData['acc_portal_company_duplicate'] || [];
        const relevantTables = new Set(['acc_portal_company_duplicate']);

        // Get relevant tables for this tab
        if (mapping?.structure?.sections) {
            mapping.structure.sections.forEach(section => {
                section.subsections?.forEach(subsection => {
                    subsection.tables?.forEach(table => {
                        relevantTables.add(table);
                    });
                });
            });
        }

        return companies.map(company => {
            const relatedRecords = {};
            const allRows = [];

            // Create base company row
            allRows.push({
                id: company.id,
                company_name: company.company_name,
                index: 1,
                isFirstRow: true,
                isAdditionalRow: false,
                sourceTable: 'acc_portal_company_duplicate',
                ...company
            });

            // Process related tables
            Object.keys(tableData).forEach(tableName => {
                if (!relevantTables.has(tableName) || tableName === 'acc_portal_company_duplicate') return;

                const records = tableData[tableName]?.filter(
                    row => row.company_id === company.id
                ) || [];

                if (records.length > 0) {
                    relatedRecords[`${tableName}_data`] = records;

                    records.forEach((record, idx) => {
                        allRows.push({
                            id: record.id,
                            company_name: company.company_name,
                            index: idx + 1,
                            isFirstRow: false,
                            isAdditionalRow: true,
                            sourceTable: tableName,
                            [`${tableName}_data`]: record,
                            ...record
                        });
                    });
                }
            });

            // Add related records to the first row
            allRows[0] = {
                ...allRows[0],
                ...relatedRecords
            };

            return {
                company: company,
                rows: allRows,
                rowSpan: allRows.length
            };
        });
    } catch (error) {
        console.error('Error processing tab data:', error);
        return [];
    }
};

const OverallView: React.FC = () => {
    // State Management
    const [allData, setAllData] = useState<any[]>([]);
    const [visibleData, setVisibleData] = useState([]);
    const [mappings, setMappings] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [activeMainTab, setActiveMainTab] = useState<string>('');
    const [activeSubTab, setActiveSubTab] = useState<string>('');
    const [structure, setStructure] = useState<any[]>([]);
    const [processedStructure, setProcessedStructure] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visibilityState, setVisibilityState] = useState({});
    const [orderState, setOrderState] = useState({});
    const [mainTabs, setMainTabs] = useState<string[]>([]);
    const [subTabs, setSubTabs] = useState<{ [key: string]: string[] }>({});
    const [mainSections, setMainSections] = useState<any[]>([]);
    const [mainSubsections, setMainSubsections] = useState<any[]>([]);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedMissingFields, setSelectedMissingFields] = useState(null);
    const sortByOrder = (items: string[], orderMapping: Record<string, number>) => {
        return [...items].sort((a, b) => (orderMapping[a] || 0) - (orderMapping[b] || 0));
    };

    const getVisibilityFromStructure = (structure) => {
        const visibility = {
            mainTabs: {},
            subTabs: {},
            sections: {},
            subsections: {},
            fields: {}
        };

        // Extract main tab visibility
        if (structure?.visibility?.tabs) {
            Object.entries(structure.visibility.tabs).forEach(([tab, isVisible]) => {
                if (tab === structure.main_tab) {
                    visibility.mainTabs[tab] = isVisible;
                } else {
                    visibility.subTabs[tab] = isVisible;
                }
            });
        }

        return visibility;
    };

    // Data Fetching
    const fetchAllData = async () => {
        try {
            setLoading(true);
    
            // 1. Fetch mappings and companies data in parallel
            const [mappingsResponse, companiesResponse] = await Promise.all([
                supabase
                    .from('profile_category_table_mapping_2')
                    .select('*')
                    .order('main_tab')
                    .order('Tabs'),
                supabase
                    .from('acc_portal_company_duplicate')
                    .select('*')
                    .order('id')
            ]);
    
            const mappingsData = mappingsResponse.data || [];
            const companiesData = companiesResponse.data || [];
            
            setMappings(mappingsData);
            setCompanies(companiesData);
    
            if (!mappingsData || !companiesData) {
                throw new Error('No data found');
            }
    
            // 2. Get all unique tables from mappings
            const tables = new Set(['acc_portal_company_duplicate']);
            mappingsData.forEach(mapping => {
                if (mapping.structure?.sections) {
                    mapping.structure.sections.forEach(section => {
                        section.subsections?.forEach(subsection => {
                            subsection.tables?.forEach(table => tables.add(table));
                        });
                    });
                }
            });
    
            // 3. Fetch all table data in parallel
            const tableResponses = await Promise.all(
                Array.from(tables).map(table => {
                    console.log('Fetching data for table:', table);
                    return supabase.from(table).select('*').order('id');
                })
            );
    
            // 4. Combine all table data
            const rawTableData = tableResponses.reduce((acc, response, index) => {
                acc[Array.from(tables)[index]] = response.data;
                return acc;
            }, {});
    
            // 5. Store the raw table data
            setAllData(rawTableData);
    
            // 6. Process visibility settings
            const aggregatedVisibility = {
                tabs: {},
                sections: {},
                subsections: {},
                fields: {}
            };
    
            // 7. Process order settings
            const aggregatedOrder = {
                mainTabs: {},
                subTabs: {},
                sections: {},
                subsections: {},
                fields: {}
            };
    
            // 8. Process tabs mapping
            const mainTabsSet = new Set(mappingsData.map(m => m.main_tab));
            const subTabsMap = {};
    
            // 9. Process all mappings
            mappingsData.forEach(mapping => {
                // Process main tab visibility and order
                if (mapping.structure?.visibility?.tabs) {
                    aggregatedVisibility.tabs = {
                        ...aggregatedVisibility.tabs,
                        ...mapping.structure.visibility.tabs
                    };
                }
    
                if (mapping.structure?.order?.mainTabs) {
                    aggregatedOrder.mainTabs = {
                        ...aggregatedOrder.mainTabs,
                        ...mapping.structure.order.mainTabs
                    };
                }
    
                // Process sub tabs
                if (mapping.main_tab) {
                    if (!subTabsMap[mapping.main_tab]) {
                        subTabsMap[mapping.main_tab] = [];
                    }
                    if (mapping.Tabs && !subTabsMap[mapping.main_tab].includes(mapping.Tabs)) {
                        subTabsMap[mapping.main_tab].push(mapping.Tabs);
                        if (mapping.structure?.order?.subTabs) {
                            aggregatedOrder.subTabs[mapping.Tabs] = mapping.structure.order.subTabs[mapping.Tabs] || 0;
                        }
                    }
                }
    
                // Process sections, subsections, and fields
                if (mapping.structure?.sections) {
                    mapping.structure.sections.forEach(section => {
                        if (section.visible !== undefined) {
                            aggregatedVisibility.sections[section.name] = section.visible;
                        }
                        if (section.order !== undefined) {
                            aggregatedOrder.sections[section.name] = section.order;
                        }
    
                        section.subsections?.forEach(subsection => {
                            if (subsection.visible !== undefined) {
                                aggregatedVisibility.subsections[subsection.name] = subsection.visible;
                            }
                            if (subsection.order !== undefined) {
                                aggregatedOrder.subsections[subsection.name] = subsection.order;
                            }
    
                            subsection.fields?.forEach(field => {
                                const fieldKey = `${field.table}.${field.name}`;
                                if (field.visible !== undefined) {
                                    aggregatedVisibility.fields[fieldKey] = field.visible;
                                }
                                if (field.order !== undefined) {
                                    aggregatedOrder.fields[fieldKey] = field.order;
                                }
                            });
                        });
                    });
                }
            });
    
            // 10. Process main tabs with visibility and order
            const visibleMainTabs = Array.from(mainTabsSet)
                .filter(tab => aggregatedVisibility.tabs[tab] !== false)
                .sort((a, b) => (aggregatedOrder.mainTabs[a] || 0) - (aggregatedOrder.mainTabs[b] || 0));
    
            // 11. Process sub tabs with visibility and order
            const processedSubTabs = Object.entries(subTabsMap).reduce((acc, [mainTab, subTabsList]) => {
                const visibleSubTabs = subTabsList
                    .filter(tab => aggregatedVisibility.tabs[tab] !== false)
                    .sort((a, b) => (aggregatedOrder.subTabs[a] || 0) - (aggregatedOrder.subTabs[b] || 0));
    
                if (visibleSubTabs.length > 0) {
                    acc[mainTab] = visibleSubTabs;
                }
                return acc;
            }, {});
    
            // 12. Set processed data to state
            setMainTabs(visibleMainTabs);
            setSubTabs(processedSubTabs);
            setStructure(mappingsData);
            setVisibilityState(aggregatedVisibility);
            setOrderState(aggregatedOrder);
    
            // 13. Process sections and subsections
            const visibleSections = mappingsData.reduce((acc, mapping) => {
                if (mapping.structure?.sections) {
                    mapping.structure.sections
                        .filter(section => aggregatedVisibility.sections[section.name] !== false)
                        .forEach(section => {
                            acc.add(section.name);
                            section.subsections
                                ?.filter(subsection => aggregatedVisibility.subsections[subsection.name] !== false)
                                .forEach(subsection => {
                                    acc.add(subsection.name);
                                });
                        });
                }
                return acc;
            }, new Set());
    
            setMainSections(Array.from(visibleSections));
    
            // 14. Set initial active tabs if needed
            if (!activeMainTab && visibleMainTabs.length > 0) {
                const firstMainTab = visibleMainTabs[0];
                setActiveMainTab(firstMainTab);
    
                const firstSubTab = processedSubTabs[firstMainTab]?.[0];
                if (firstSubTab) {
                    setActiveSubTab(firstSubTab);
                }
            }
    
            // 15. Process data for current tab
            const currentMapping = mappingsData.find(m => 
                m.main_tab === activeMainTab && m.Tabs === activeSubTab
            );
            
            if (currentMapping) {
                const processedData = processTabData(rawTableData, currentMapping);
                setVisibleData(processedData);
            }
    
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Add helper function for structure processing
    const processStructureForUI = (structure) => {
        return {
            sections: structure.sections.map(section => ({
                ...section,
                subsections: section.subsections
                    .filter(subsection =>
                        structure.visibility?.subsections?.[subsection.name] !== false
                    )
                    .sort((a, b) =>
                        (structure.order?.subsections?.[a.name] || 0) -
                        (structure.order?.subsections?.[b.name] || 0)
                    )
                    .map(subsection => ({
                        ...subsection,
                        fields: subsection.fields
                            .filter(field =>
                                structure.visibility?.fields?.[`${field.table}.${field.name}`] !== false
                            )
                            .sort((a, b) =>
                                (structure.order?.fields?.[`${a.table}.${a.name}`] || 0) -
                                (structure.order?.fields?.[`${b.table}.${b.name}`] || 0)
                            )
                    }))
            }))
                .filter(section =>
                    structure.visibility?.sections?.[section.name] !== false
                )
                .sort((a, b) =>
                    (structure.order?.sections?.[a.name] || 0) -
                    (structure.order?.sections?.[b.name] || 0)
                ),
            visibility: structure.visibility || {},
            order: structure.order || {},
            relationships: structure.relationships || {}
        };
    };

    // Event Handlers
    const handleTabChange = useCallback((mainTab: string, subTab: string) => {
        setActiveMainTab(mainTab);
        setActiveSubTab(subTab);
    
        const relevantMapping = structure.find(m =>
            m.main_tab === mainTab && m.Tabs === subTab
        );
    
        if (relevantMapping && allData) {
            // Process the stored raw data for the new tab
            const processedData = processTabData(allData, relevantMapping);
            setVisibleData(processedData);
        }
    }, [allData, structure]);

    const handleCompanyClick = useCallback((company: any) => {
        setSelectedCompany({
            company: company,
            rows: company.rows,
            activeTab: activeSubTab,
        });
        setIsEditDialogOpen(true);
    }, [activeSubTab]);

    // Structure Processing
    const processTabSections = useCallback((mainTab: string | undefined | null, subTab: string) => {
        if (!mainTab) return [];

        const mainTabLower = mainTab.toLowerCase();
        const isSpecialView = ['employee details', 'customer details', 'supplier details'].includes(mainTabLower);

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
            item?.Tabs === subTab &&
            item?.main_tab === mainTab
        );

        if (relevantMapping?.structure?.sections) {
            const { sections } = relevantMapping.structure;

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
    }, [structure, visibilityState, orderState]);

    // Structure Update Handler
    const handleStructureUpdate = async () => {
        try {
            setLoading(true);
            const { data: mappings } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('main_tab')
                .order('Tabs');

            if (!mappings) throw new Error('No data found');

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

            setStructure(mappings);
            setMainTabs(Array.from(mainTabsSet));
            setSubTabs(subTabsMap);
            setMainSections(Array.from(sectionsSet));
            setMainSubsections(Array.from(subsectionsSet));

        } catch (error) {
            console.error('Error updating structure:', error);
            toast.error('Failed to update structure');
        } finally {
            setLoading(false);
        }
    };

    // Overview Page Updates
    const [localOrder, setLocalOrder] = useState({});
    const [localVisibility, setLocalVisibility] = useState({});

    useEffect(() => {
        const fetchMainTabs = async () => {
            const { data, error } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*');
            if (data) {
                trackPositions(data);
                trackVisibility(data);
            }
        };
        fetchMainTabs();
    }, []);

    const trackPositions = (items) => {
        const newOrder = {};
        items.forEach((item, index) => {
            newOrder[item.mainTab] = index;
        });
        setLocalOrder(newOrder);
    };

    const trackVisibility = (items) => {
        const newVisibility = {};
        items.forEach((item) => {
            if (item.structure?.visibility) {
                newVisibility[item.mainTab] = item.structure.visibility;
            }
        });
        setLocalVisibility(newVisibility);
    };

    const handleReorder = (itemId, direction) => {
        const currentIndex = localOrder[itemId];
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= mainTabs.length) return;

        // Swap positions
        const newOrder = { ...localOrder };
        const items = Object.keys(newOrder);
        [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

        // Update order numbers
        items.forEach((item, index) => {
            newOrder[item] = index;
        });

        setLocalOrder(newOrder);
        // Update database with new order
        updateOrderInDatabase(newOrder);
    };

    const updateOrderInDatabase = async (newOrder) => {
        try {
            await supabase
                .from('profile_category_table_mapping_2')
                .update({ order: newOrder })
                .eq('main_tab', itemId);
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const handleVisibilityChange = (itemId, newState) => {
        const newVisibility = { ...localVisibility };
        newVisibility[itemId] = newState;
        setLocalVisibility(newVisibility);
        // Update database with new visibility
        updateVisibilityInDatabase(newVisibility);
    };

    const updateVisibilityInDatabase = async (newVisibility) => {
        try {
            await supabase
                .from('profile_category_table_mapping_2')
                .update({ visibility: newVisibility })
                .eq('main_tab', itemId);
        } catch (error) {
            console.error('Error updating visibility:', error);
        }
    };

    // Effects
    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        const handleStructureUpdate = () => {
            fetchAllData();
        };

        window.addEventListener('structure-updated', handleStructureUpdate);
        return () => {
            window.removeEventListener('structure-updated', handleStructureUpdate);
        };
    }, []);

    useEffect(() => {
        const handleVisibilityUpdate = () => {
            fetchAllData();
        };

        window.addEventListener('visibility-updated', handleVisibilityUpdate);
        return () => {
            window.removeEventListener('visibility-updated', handleVisibilityUpdate);
        };
    }, []);

    // Table Wrapper
    const TableWrapper = useMemo(() => (
        <Table
            data={visibleData}
            virtualizedRowHeight={50}
            visibleRowsCount={20}
            processedSections={processTabSections(activeMainTab, activeSubTab)}
            activeMainTab={activeMainTab}
            activeSubTab={activeSubTab}
            handleCompanyClick={handleCompanyClick}
            onMissingFieldsClick={(company) => {
                setSelectedMissingFields(company);
                setIsMissingFieldsOpen(true);
            }}
            refreshData={fetchAllData}
        />
    ), [visibleData, activeMainTab, activeSubTab, processTabSections, handleCompanyClick]);

    return (
        <div className="h-[1100px] flex flex-col">
            <Tabs defaultValue={mainTabs[0]} value={activeMainTab} className="h-full flex flex-col">
                {mainTabs.length > 0 ? (
                    <TabsList className="w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] grid bg-gray-100 rounded-lg p-1">
                        {mainTabs
                            .filter(tab => visibilityState.tabs[tab] !== false)
                            .map(tab => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    disabled={loading}
                                    onClick={() => {
                                        const firstSubTab = subTabs[tab]?.[0] || '';
                                        handleTabChange(tab, firstSubTab);
                                    }}
                                    className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                    </TabsList>
                ) : (
                    <div>No tabs available</div>
                )}

                <TabsContent value={activeMainTab} className="h-full">
                    <div className="h-full flex flex-col">
                        <div className="flex gap-4 p-6">
                            <Suspense fallback={<div>Loading settings...</div>}>
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
                            </Suspense>

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
                            <Tabs
                                defaultValue={subTabs[activeMainTab]?.[0]}
                                value={activeSubTab}
                                className="h-full flex flex-col"
                            > <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
                                    {(subTabs[activeMainTab] || [])
                                        .filter(tab => visibilityState.tabs[tab] !== false)
                                        .map(tab => (
                                            <TabsTrigger
                                                key={tab}
                                                value={tab}
                                                disabled={loading}
                                                onClick={() => handleTabChange(activeMainTab, tab)}
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
                                                {loading ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <h3 className="text-lg font-medium">Loading data...</h3>
                                                            <p className="text-gray-500 mt-2">Please wait</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`h-[890px] ${(activeMainTab === activeMainTab === "Directors Details" || activeMainTab === "Bank Details" || "Company Details" ) ? "overflow-auto" : ""}`}>
                                                        <div className="min-w-max">
                                                            {TableWrapper}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Suspense fallback={null}>
                {isImportDialogOpen && (
                    <ImportDialog
                        isOpen={true}
                        onClose={() => setIsImportDialogOpen(false)}
                        onImport={(file) => handleImport(file, activeMainTab, activeSubTab)}
                    />
                )}

                {isEditDialogOpen && (
                    <CompanyEditDialog
                        isOpen={true}
                        onClose={() => setIsEditDialogOpen(false)}
                        companyData={selectedCompany}
                        processedSections={processTabSections(activeMainTab, activeSubTab)}
                        onSave={handleSave}
                        mainActiveTab={activeMainTab}
                    />
                )}

                {isMissingFieldsOpen && (
                    <MissingFieldsDialog
                        isOpen={true}
                        onClose={() => setIsMissingFieldsOpen(false)}
                        companyData={selectedMissingFields}
                        processedSections={processTabSections(activeMainTab, activeSubTab)}
                        onSave={handleSave}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default OverallView;