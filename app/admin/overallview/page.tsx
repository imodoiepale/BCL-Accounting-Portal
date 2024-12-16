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
import { handleExport } from './components/utility';

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

        return companies.map(company => {
            const relatedRecords = {};
            let allRows = [];

            // Process each related table
            Object.keys(tableData).forEach(tableName => {
                if (tableName !== 'acc_portal_company_duplicate') {
                    const records = tableData[tableName]?.filter(
                        (row: any) => row.company_id === company.id
                    ) || [];

                    if (records.length > 0) {
                        relatedRecords[`${tableName}_data`] = records;

                        // For tables with multiple records (banks, directors, etc.)
                        if (records.length > 1) {
                            records.forEach((record, idx) => {
                                allRows.push({
                                    id: record.id,
                                    company_name: idx === 0 ? company.company_name : '',
                                    index: idx + 1,
                                    isFirstRow: idx === 0,
                                    isAdditionalRow: idx > 0,
                                    sourceTable: tableName,
                                    ...record
                                });
                            });
                        }
                    }
                }
            });

            // If no multiple records exist, create single row with company info
            if (allRows.length === 0) {
                allRows.push({
                    id: company.id,
                    company_name: company.company_name,
                    index: 1,
                    isFirstRow: true,
                    ...company,
                    ...relatedRecords
                });
            }

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
    const [activeMainTab, setActiveMainTab] = useState<string>('');
    const [activeSubTab, setActiveSubTab] = useState<string>('');
    const [structure, setStructure] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Data Fetching
    const fetchAllData = async () => {
        try {
            setLoading(true);

            // Fetch mappings and main data
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

            const mappings = mappingsResponse.data;
            const companies = companiesResponse.data;

            if (!mappings || !companies) {
                throw new Error('No data found');
            }

            // Get all unique tables
            const tables = new Set(['acc_portal_company_duplicate']);
            mappings.forEach(mapping => {
                if (mapping.structure?.sections) {
                    mapping.structure.sections.forEach(section => {
                        section.subsections?.forEach(subsection => {
                            subsection.tables?.forEach(table => tables.add(table));
                        });
                    });
                }
            });

            // Fetch all table data in parallel
            const tableResponses = await Promise.all(
                Array.from(tables).map(table =>
                    supabase.from(table).select('*').order('id')
                )
            );

            // Combine all table data
            const allTableData = tableResponses.reduce((acc, response, index) => {
                acc[Array.from(tables)[index]] = response.data;
                return acc;
            }, {});

            // Process initial data
            const processedData = processTabData(allTableData, mappings[0]);
            setAllData(processedData);
            setVisibleData(processedData);
            // Process structure and tabs
            const mainTabsSet = new Set(mappings.map(m => m.main_tab));
            const subTabsMap = mappings.reduce((acc, m) => {
                if (!acc[m.main_tab]) acc[m.main_tab] = [];
                if (m.Tabs && !acc[m.main_tab].includes(m.Tabs)) {
                    acc[m.main_tab].push(m.Tabs);
                }
                return acc;
            }, {});
            
            // Sort tabs based on order from structure
            const mainTabOrder = mappings[0]?.structure?.order?.mainTabs || {};
            const sortedMainTabs = sortByOrder(Array.from(mainTabsSet), mainTabOrder);

            const sortedSubTabs = Object.fromEntries(
                Object.entries(subTabsMap).map(([mainTab, subTabsList]) => {
                    const subTabOrder = mappings.find(m => m.main_tab === mainTab)
                        ?.structure?.order?.subTabs || {};
                    return [mainTab, sortByOrder(subTabsList, subTabOrder)];
                })
            );

            setMainTabs(sortedMainTabs);
            setSubTabs(sortedSubTabs);
            setStructure(mappings);

            // Process sections and subsections
            const sectionsSet = new Set<string>();
            const subsectionsSet = new Set<string>();
            mappings.forEach(mapping => {
                mapping.structure?.sections?.forEach(section => {
                    if (section.name) sectionsSet.add(section.name);
                    section.subsections?.forEach(subsection => {
                        if (subsection.name) subsectionsSet.add(subsection.name);
                    });
                });
            });

            setMainSections(Array.from(sectionsSet));
            setMainSubsections(Array.from(subsectionsSet));

            // Set initial active tabs
            const firstMainTab = Array.from(mainTabsSet)[0];
            if (firstMainTab) {
                setActiveMainTab(firstMainTab);
                const firstSubTab = subTabsMap[firstMainTab]?.[0];
                if (firstSubTab) {
                    setActiveSubTab(firstSubTab);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Event Handlers
    const handleTabChange = useCallback((mainTab: string, subTab: string) => {
        setActiveMainTab(mainTab);
        setActiveSubTab(subTab);

        const relevantMapping = structure.find(m =>
            m.main_tab === mainTab && m.Tabs === subTab
        );

        if (relevantMapping) {
            const filteredData = allData.filter(item => {
                // Add any specific filtering logic here if needed
                return true;
            });
            setVisibleData(filteredData);
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

    // Effects
    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        const handleStructureUpdateEvent = () => {
            fetchAllData();
        };

        window.addEventListener('structure-updated', handleStructureUpdateEvent);
        return () => {
            window.removeEventListener('structure-updated', handleStructureUpdateEvent);
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
                        {mainTabs.map(tab => (
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
                            >
                                <TabsList className="w-full grid grid-cols-10 bg-gray-100 rounded-lg p-1">
                                    {(subTabs[activeMainTab] || []).map(tab => (
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
                                                    <div className="h-[890px] overflow-auto">
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