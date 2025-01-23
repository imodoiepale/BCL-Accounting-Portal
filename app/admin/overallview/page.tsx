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
import { StructureService } from '@/services/structureService_v2';
import type { Structure, StructureMapping } from '@/types/structure_v2';
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

const processTabData = (tableData: any, structure: Structure | null) => {
    try {
        // Get base company data
        const companies = tableData['acc_portal_company_duplicate'] || [];
        const relevantTables = new Set(['acc_portal_company_duplicate']);
        const processedData = [];

        // Extract relevant tables from structure
        if (structure?.sections) {
            structure.sections.forEach(section => {
                section.subsections?.forEach(subsection => {
                    subsection.fields?.forEach(field => {
                        relevantTables.add(field.table);
                    });
                });
            });
        }

        // Process each company
        companies.forEach(company => {
            const companyGroup = {
                company,
                rows: [],
                rowSpan: 1,
                stats: {
                    totalFields: 0,
                    completedFields: 0,
                    missingFields: 0
                }
            };

            // Create base company row
            const baseRow = {
                id: company.id,
                company_name: company.company_name,
                index: 1,
                isFirstRow: true,
                isAdditionalRow: false,
                sourceTable: 'acc_portal_company_duplicate',
                verification_status: company.verification_status || {},
                ...company
            };

            companyGroup.rows.push(baseRow);

            // Process fields from structure
            if (structure?.sections) {
                structure.sections.forEach(section => {
                    if (structure.visibility.sections[section.name]) {
                        section.subsections.forEach(subsection => {
                            if (structure.visibility.subsections[subsection.name]) {
                                subsection.fields.forEach(field => {
                                    if (structure.visibility.fields[field.name]) {
                                        companyGroup.stats.totalFields++;
                                        const value = tableData[field.table]?.[field.column];
                                        if (value !== undefined && value !== null && value !== '') {
                                            companyGroup.stats.completedFields++;
                                        } else {
                                            companyGroup.stats.missingFields++;
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }

            processedData.push(companyGroup);
        });

        return processedData;
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
    const [structure, setStructure] = useState<Structure | null>(null);
    const [loading, setLoading] = useState(true);
    const [visibilityState, setVisibilityState] = useState({
        tabs: {},
        sections: {},
        subsections: {},
        fields: {}
    });
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
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [localOrder, setLocalOrder] = useState({});
    const [localVisibility, setLocalVisibility] = useState({});

    const sortByOrder = (items: string[], orderMapping: Record<string, number>) => {
        if (!Array.isArray(items)) {
            console.error('Expected an array for items:', items);
            return [];
        }
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
            console.log('Fetching data for:', { activeMainTab, activeSubTab });

            // Fetch companies data
            const { data: companies, error: companiesError } = await supabase
                .from('acc_portal_company_duplicate')
                .select('*')
                .order('company_name', { ascending: true });

            if (companiesError) throw companiesError;
            console.log('Fetched companies:', companies?.length);

            // Process the company data
            const processedData = companies.map(company => ({
                rows: [{
                    ...company,
                    acc_portal_company_duplicate_data: company
                }],
                rowSpan: 1
            }));

            // Update company data state
            setVisibleData(processedData);

            // If no tabs are selected, show only default columns
            if (!activeMainTab || !activeSubTab) {
                const defaultStructure = {
                    sections: [{
                        name: "Default",
                        isSeparator: false,
                        categorizedFields: [{
                            name: "Company Details",
                            isSeparator: false,
                            fields: [{
                                name: "acc_portal_company_duplicate.company_name",
                                label: "Company Name"
                            }]
                        }]
                    }]
                };
                setMainSections(defaultStructure.sections);
                return;
            }

            // Fetch mapping data for selected tabs
            const { data: mappingData, error: mappingError } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .eq('main_tab', activeMainTab)
                .eq('sub_tab', activeSubTab);

            if (mappingError) throw mappingError;
            console.log('Mapping data:', mappingData);

            if (mappingData && mappingData.length > 0 && mappingData[0].structure?.sections) {
                const processedStructure = processStructureForUI(mappingData[0].structure);
                setMainSections(processedStructure.sections);
                setStructure(mappingData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Helper function for structure processing
    const processStructureForUI = (structure) => {
        if (!structure) return { sections: [] };

        // Process the structure sections
        const processedSections = structure.sections.map(section => ({
            name: section.name,
            isSeparator: false,
            categorizedFields: section.subsections?.map(subsection => ({
                name: subsection.name,
                isSeparator: false,
                fields: subsection.fields?.map(field => ({
                    name: `${field.table}.${field.name}`,
                    label: field.label || field.name,
                    table: field.table,
                    type: field.type || 'text',
                    validation: field.validation || {}
                }))
            }))
        }));

        // Add company_name as the first field in the first category of the first section
        if (processedSections.length > 0 && 
            processedSections[0].categorizedFields && 
            processedSections[0].categorizedFields.length > 0) {
            
            processedSections[0].categorizedFields[0].fields = [
                {
                    name: 'acc_portal_company_duplicate.company_name',
                    label: 'Company Name',
                    table: 'acc_portal_company_duplicate',
                    type: 'text'
                },
                ...(processedSections[0].categorizedFields[0].fields || [])
            ];
        } else {
            // If no sections exist, create a default section with company_name
            processedSections.unshift({
                name: "Default",
                isSeparator: false,
                categorizedFields: [{
                    name: "Company Details",
                    isSeparator: false,
                    fields: [{
                        name: "acc_portal_company_duplicate.company_name",
                        label: "Company Name",
                        table: "acc_portal_company_duplicate",
                        type: "text"
                    }]
                }]
            });
        }

        return {
            sections: processedSections,
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
            m.main_tab === mainTab && m.sub_tab === subTab
        );

        if (relevantMapping && allData) {
            useEffect(() => {
                const processData = () => {
                    if (!allData) return;

                    const processedData = allData.map(company => ({
                        rows: company.rows.map(row => ({
                            ...row,
                            // Ensure company data is properly mapped
                            acc_portal_company_duplicate_data: {
                                ...row.acc_portal_company_duplicate_data,
                                company_name: row.company_name || row.acc_portal_company_duplicate_data?.company_name || ''
                            }
                        })),
                        rowSpan: company.rowSpan
                    }));

                    console.log('Processed Data:', JSON.stringify(processedData[0], null, 2));
                    setVisibleData(processedData);
                };

                if (allData) {
                    processData();
                }
            }, [allData]);
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
        // Always include the default section with company name
        const defaultSection = {
            name: 'Company Info',
            label: 'Company Info',
            isSeparator: false,
            categorizedFields: [{
                name: 'Basic Details',
                isSeparator: false,
                fields: [{
                    name: 'acc_portal_company_duplicate.company_name',
                    label: 'Company Name',
                    table: 'acc_portal_company_duplicate',
                    type: 'text',
                    column: 'company_name'
                }]
            }]
        };

        // If no main tab, return only default section
        if (!mainTab) {
            return [defaultSection];
        }

        const mainTabLower = mainTab.toLowerCase();
        const isSpecialView = ['employee details', 'customer details', 'supplier details'].includes(mainTabLower);

        // Start with the default section
        const processedSections = [defaultSection];

        // Add separator after default section
        processedSections.push({
            isSeparator: true,
            name: 'default-separator'
        });

        // If we have structure data, add it
        if (structure && structure.length > 0) {
            const relevantStructure = structure.find(s => 
                s.main_tab === mainTab && s.sub_tab === subTab
            );

            if (relevantStructure?.structure?.sections) {
                relevantStructure.structure.sections.forEach(section => {
                    if (!section.subsections || section.subsections.length === 0) return;

                    processedSections.push({
                        name: section.name,
                        label: section.name,
                        isSeparator: false,
                        categorizedFields: section.subsections.map(subsection => ({
                            name: subsection.name,
                            isSeparator: false,
                            fields: (subsection.fields || []).map(field => ({
                                name: `${field.table}.${field.name}`,
                                label: field.label || field.name,
                                table: field.table,
                                type: field.type || 'text',
                                column: field.name
                            }))
                        })).filter(cat => cat.fields && cat.fields.length > 0)
                    });

                    // Add separator between sections
                    processedSections.push({
                        isSeparator: true,
                        name: `${section.name}-separator`
                    });
                });
            }
        }

        // Remove the last separator if it exists
        if (processedSections.length > 0 && processedSections[processedSections.length - 1].isSeparator) {
            processedSections.pop();
        }

        console.log('Processed Sections:', JSON.stringify(processedSections, null, 2));
        return processedSections;
    }, [structure]);

    // Structure Update Handler
    const handleStructureUpdate = async () => {
        try {
            setLoading(true);
            const { data: mappings } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('main_tab');

            if (!mappings) throw new Error('No data found');

            const mainTabsSet = new Set<string>();
            const subTabsMap: { [key: string]: string[] } = {};
            const sectionsSet = new Set<string>();
            const subsectionsSet = new Set<string>();

            mappings.forEach(mapping => {
                if (!mapping) return;

                if (mapping.main_tab) mainTabsSet.add(mapping.main_tab);
                if (mapping.main_tab && mapping.sub_tab) {
                    if (!subTabsMap[mapping.main_tab]) subTabsMap[mapping.main_tab] = [];
                    if (!subTabsMap[mapping.main_tab].includes(mapping.sub_tab)) {
                        subTabsMap[mapping.main_tab].push(mapping.sub_tab);
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

    // Fetch structure data
    const fetchStructureData = useCallback(async () => {
        try {
            if (!activeMainTab && !activeSubTab) {
                // Set default structure for empty state
                setStructure([{
                    main_tab: '',
                    sub_tab: '',
                    structure: {
                        sections: [{
                            name: 'Company Info',
                            subsections: [{
                                name: 'Basic Details',
                                fields: [{
                                    name: 'company_name',
                                    label: 'Company Name',
                                    table: 'acc_portal_company_duplicate',
                                    type: 'text'
                                }]
                            }]
                        }]
                    }
                }]);
                return;
            }

            const { data: structureData, error } = await supabase
                .from('profile_category_table_mapping_2')
                .select('structure')
                .eq('main_tab', activeMainTab)
                .eq('sub_tab', activeSubTab)
                .single();

            if (error) throw error;

            if (structureData) {
                setStructure([structureData]);
            }
        } catch (error) {
            console.error('Error fetching structure:', error);
        }
    }, [activeMainTab, activeSubTab, supabase]);

    // Call fetchStructureData when tabs change
    useEffect(() => {
        fetchStructureData();
    }, [fetchStructureData, activeMainTab, activeSubTab]);

    // Initialize tabs
    useEffect(() => {
        const initializeTabs = async () => {
            try {
                const { data: tabData } = await supabase
                    .from('profile_category_table_mapping_2')
                    .select('main_tab, sub_tab, structure')
                    .order('main_tab');

                if (tabData) {
                    // Process main tabs and visibility
                    const uniqueMainTabs = [...new Set(tabData.map(item => item.main_tab))];
                    setMainTabs(uniqueMainTabs);

                    // Initialize visibility state from structure
                    const initialVisibility = {
                        tabs: {},
                        sections: {},
                        subsections: {},
                        fields: {}
                    };

                    tabData.forEach(item => {
                        if (item.structure?.visibility) {
                            // Merge maintabs visibility
                            if (item.structure.visibility.maintabs) {
                                Object.entries(item.structure.visibility.maintabs).forEach(([tab, visible]) => {
                                    initialVisibility.tabs[tab] = visible;
                                });
                            }
                            // Merge other visibility settings
                            if (item.structure.visibility.sections) {
                                Object.assign(initialVisibility.sections, item.structure.visibility.sections);
                            }
                            if (item.structure.visibility.subsections) {
                                Object.assign(initialVisibility.subsections, item.structure.visibility.subsections);
                            }
                            if (item.structure.visibility.fields) {
                                Object.assign(initialVisibility.fields, item.structure.visibility.fields);
                            }
                        }
                    });

                    setVisibilityState(initialVisibility);

                    // Process sub tabs
                    const subTabMap: { [key: string]: string[] } = {};
                    tabData.forEach(item => {
                        if (!subTabMap[item.main_tab]) {
                            subTabMap[item.main_tab] = [];
                        }
                        if (item.sub_tab && !subTabMap[item.main_tab].includes(item.sub_tab)) {
                            subTabMap[item.main_tab].push(item.sub_tab);
                        }
                    });
                    setSubTabs(subTabMap);

                    // Set initial active tabs
                    if (uniqueMainTabs.length > 0) {
                        const firstMainTab = uniqueMainTabs[0];
                        const firstSubTab = subTabMap[firstMainTab]?.[0] || '';
                        setActiveMainTab(firstMainTab);
                        setActiveSubTab(firstSubTab);
                    }
                }
            } catch (error) {
                console.error('Error fetching tabs:', error);
            }
        };

        initializeTabs();
    }, [supabase]);

    // Table Wrapper
    const TableWrapper = useMemo(() => {
        const sections = processTabSections(activeMainTab, activeSubTab);
        console.log('VisibleData:', visibleData);
        console.log('ProcessedSections:', sections);

        return (
            <Table
                data={visibleData}
                virtualizedRowHeight={50}
                visibleRowsCount={20}
                processedSections={sections}
                activeMainTab={activeMainTab}
                activeSubTab={activeSubTab}
                handleCompanyClick={handleCompanyClick}
                onMissingFieldsClick={(company) => {
                    setSelectedMissingFields(company);
                    setIsMissingFieldsOpen(true);
                }}
                refreshData={fetchAllData}
                onSettingsClick={() => setIsSettingsDialogOpen(true)}
            />
        );
    }, [visibleData, activeMainTab, activeSubTab, processTabSections, handleCompanyClick]);

    // Tabs rendering
    const renderTabs = useMemo(() => {
        return (
            <Tabs defaultValue={mainTabs[0]} value={activeMainTab} className="h-full flex flex-col">
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
                <TabsContent value={activeMainTab} className="h-full">
                    <div className="h-full flex flex-col">
                        <div className="flex gap-4 p-6">
                            <Button
                                className="flex items-center gap-2"
                                onClick={() => setIsSettingsDialogOpen(true)}
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
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

                        <div className="flex-1 overflow-hidden">
                            <Tabs
                                defaultValue={subTabs[activeMainTab]?.[0]}
                                value={activeSubTab}
                                className="h-full flex flex-col"
                            >
                                <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
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
                                <TabsContent value={activeSubTab} className="h-full data-[state=active]:flex-1">
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
                                                <div className={`h-[890px] ${(activeMainTab === "Directors Details" || activeMainTab === "Bank Details" || activeMainTab === "Company Details") ? "overflow-auto" : ""}`}>
                                                    <div className="min-w-max">
                                                        {TableWrapper}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        );
    }, [mainTabs, activeMainTab, visibilityState.tabs, subTabs, loading, activeSubTab, TableWrapper]);

    useEffect(() => {
        if (activeMainTab && activeSubTab) {
            fetchAllData();
        }
    }, [activeMainTab, activeSubTab]);

    useEffect(() => {
        fetchAllData();
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

    return (
        <>
            <div className="h-[1100px] flex flex-col">
                {renderTabs}
            </div>

            <Suspense>
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
                {isSettingsDialogOpen && (
                    <SettingsDialog
                        isOpen={isSettingsDialogOpen}
                        onClose={() => setIsSettingsDialogOpen(false)}
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
                )}
            </Suspense>
        </>
    );
};

export default OverallView;