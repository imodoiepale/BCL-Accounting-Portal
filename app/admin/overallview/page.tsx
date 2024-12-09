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

// Lazy load heavy components using dynamic import
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

// Add this function before the OverallView component
const processTabData = (tableData: any, mapping: any) => {
    try {
      // Always get companies from acc_portal_company_duplicate
      const companies = tableData['acc_portal_company_duplicate'] || [];
      
      return companies.map(company => ({
        company: company,
        rows: [{
          id: company.id,
          company_name: company.company_name, // Always include company_name
          isFirstRow: true,
          ...Object.keys(tableData).reduce((acc, tableName) => {
            if (tableName !== 'acc_portal_company_duplicate') {
              acc[`${tableName}_data`] = tableData[tableName]?.find(
                (row: any) => row.company_id === company.id
              );
            }
            return acc;
          }, {})
        }]
      }));
    } catch (error) {
      console.error('Error processing tab data:', error);
      return [];
    }
  };
  

const OverallView: React.FC = () => {
    const [allTabsData, setAllTabsData] = useState<Map<string, any>>(new Map());
    const [cachedData, setCachedData] = useState<Map<string, any>>(new Map());
    const [visibleData, setVisibleData] = useState([]);
    const dataCache = useRef<Map<string, any>>(new Map());
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
    })
    const [mainTabs, setMainTabs] = useState<string[]>([]);
    const [subTabs, setSubTabs] = useState<{ [key: string]: string[] }>({});
    const [mainSections, setMainSections] = useState<any[]>([]);
    const [mainSubsections, setMainSubsections] = useState<any[]>([]);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);
    // Cache management
    const cacheKey = useCallback((mainTab: string, subTab: string) => `${mainTab}:${subTab}`, []);
    const [mappedData, setMappedData] = useState({
        mainTabs: [],
        subTabs: {},
        currentData: []
      });

    const preloadAdjacentTabs = useCallback(async (mainTab: string, subTab: string) => {
        const currentTabs = structure.filter(s => s.main_tab === mainTab);
        const currentIndex = currentTabs.findIndex(t => t.Tabs === subTab);

        // Preload next and previous tabs
        [-1, 1].forEach(async (offset) => {
            const targetTab = currentTabs[currentIndex + offset];
            if (targetTab && !dataCache.current.has(cacheKey(mainTab, targetTab.Tabs))) {
                const data = await fetchTabData(mainTab, targetTab.Tabs);
                dataCache.current.set(cacheKey(mainTab, targetTab.Tabs), data);
            }
        });
    }, [structure, cacheKey]);

    // Add console logs in useEffect after data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
              setLoading(true);
              const { data: mappings } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('main_tab')
                .order('Tabs');
          
              if (!mappings) throw new Error('No data found');
          
              // Process and organize the data
              const mainTabsSet = new Set(mappings.map(m => m.main_tab));
              const subTabsMap = mappings.reduce((acc, m) => {
                if (!acc[m.main_tab]) acc[m.main_tab] = [];
                if (!acc[m.main_tab].includes(m.Tabs)) {
                  acc[m.main_tab].push(m.Tabs);
                }
                return acc;
              }, {});
          
              setMainTabs(Array.from(mainTabsSet));
              setSubTabs(subTabsMap);
              setStructure(mappings);
          
              // Set initial active tabs
              if (mainTabsSet.size > 0) {
                const firstMainTab = Array.from(mainTabsSet)[0];
                setActiveMainTab(firstMainTab);
                if (subTabsMap[firstMainTab]?.length > 0) {
                  setActiveSubTab(subTabsMap[firstMainTab][0]);
                }
              }
          
            } catch (error) {
              console.error('Error:', error);
              toast.error('Failed to load initial data');
            } finally {
              setLoading(false);
            }
          };

        fetchInitialData();
    }, []);
// Create function to fetch all data initially
const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [mappingsResponse, ...tableResponses] = await Promise.all([
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
      if (!mappings) throw new Error('No mappings found');
  
      // Fetch all tables data in parallel
      const allTables = new Set(['acc_portal_company_duplicate']);
      mappings.forEach(mapping => {
        mapping.structure?.sections?.forEach(section => {
          section.subsections?.forEach(subsection => {
            subsection.tables?.forEach(table => allTables.add(table));
          });
        });
      });
  
      const additionalTableResponses = await Promise.all(
        Array.from(allTables).slice(1).map(table =>
          supabase.from(table).select('*').order('id')
        )
      );
  
      const tableData = [tableResponses[0], ...additionalTableResponses];
  
      // Process and cache data for each tab
      const dataCache = new Map();
      mappings.forEach(mapping => {
        const key = `${mapping.main_tab}:${mapping.Tabs}`;
        const tabData = processTabData(
          tableData.reduce((acc, {data}, i) => {
            acc[Array.from(allTables)[i]] = data;
            return acc;
          }, {}),
          mapping
        );
        dataCache.set(key, tabData);
      });
  
      setAllTabsData(dataCache);
      setStructure(mappings);
      
      // Set initial tabs
      const mainTabsSet = new Set(mappings.map(m => m.main_tab));
      setMainTabs(Array.from(mainTabsSet));
      
      const subTabsMap = mappings.reduce((acc, m) => {
        if (!acc[m.main_tab]) acc[m.main_tab] = [];
        acc[m.main_tab].push(m.Tabs);
        return acc;
      }, {});
      setSubTabs(subTabsMap);
  
    } catch (error) {
      console.error('Error fetching all data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  // Call fetchAllData on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

    useEffect(() => {
        if (mainTabs.length > 0 && !activeMainTab) {
            setActiveMainTab(mainTabs[0]);
            if (subTabs[mainTabs[0]]?.length > 0) {
                setActiveSubTab(subTabs[mainTabs[0]][0]);
            }
        }
    }, [mainTabs, subTabs]);
    useEffect(() => {
        console.log('Cache status:', {
          cacheSize: allTabsData.size,
          currentTab: `${activeMainTab}:${activeSubTab}`,
          hasData: allTabsData.has(`${activeMainTab}:${activeSubTab}`)
        });
      }, [allTabsData, activeMainTab, activeSubTab]);
      
    useEffect(() => {
        console.log('Data state updated:', {
          mainTabs,
          activeMainTab,
          subTabs: subTabs[activeMainTab],
          dataLength: visibleData?.length
        });
      }, [mainTabs, activeMainTab, subTabs, visibleData]);

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

    const handleTabChange = useCallback((mainTab: string, subTab: string) => {
        const key = `${mainTab}:${subTab}`;
        const cachedData = allTabsData.get(key);
        
        if (cachedData) {
          setVisibleData(cachedData);
          setActiveMainTab(mainTab);
          setActiveSubTab(subTab);
        }
      }, [allTabsData]);

    const processTabSections = useCallback(() => (mainTab: string | undefined | null, subTab: string) => {
        // Ensure mainTab has a value
        if (!mainTab) {
            return []; // Return empty array if no mainTab
        }

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

    // Virtualized table rendering
    const TableWrapper = useMemo(() => (
        <Table
            data={visibleData}
            virtualizedRowHeight={50}
            visibleRowsCount={20}
            processedSections={processTabSections()(activeMainTab || '', activeSubTab || '')} // Add fallback
            activeMainTab={activeMainTab || ''} 
            activeSubTab={activeSubTab || ''}
            handleCompanyClick={handleCompanyClick}
            onMissingFieldsClick={(company) => {
                const processedSections = processTabSections()(activeMainTab || '', activeSubTab || '');
                setSelectedMissingFields(company);
                setIsMissingFieldsOpen(true);
            }}
        />
    ), [visibleData, activeMainTab, activeSubTab]);
    
    useEffect(() => {
        if (mainTabs.length > 0 && !activeMainTab) {
            const initialMainTab = mainTabs[0] || '';
            setActiveMainTab(initialMainTab);
            if (subTabs[initialMainTab]?.length > 0) {
                setActiveSubTab(subTabs[initialMainTab][0] || '');
            }
        }
    }, [mainTabs, subTabs]);
    
    return (
        <div className="h-[1100px] flex flex-col">
            <Tabs defaultValue={mainTabs[0]} value={activeMainTab} className="h-full flex flex-col">
                {mainTabs.length > 0 ? (
                    <TabsList className="w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] grid bg-gray-100 rounded-lg p-1">
                        {mainTabs.map(tab => (
                            // In your TabsTrigger onClick
<TabsTrigger
  key={tab}
  value={tab}
  disabled={loading}
  onClick={() => handleTabChange(tab, subTabs[tab]?.[0] || '')}
  className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
>
  {tab}
</TabsTrigger>

                        ))}

                    </TabsList>
                ) : (
                    <div>No tabs available</div> // Debug message
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
                                    {(subTabs[activeMainTab] || []).map(tab => {
                                        console.log('Rendering subtab:', tab); // Debug log
                                        return (
                                  // In your TabsTrigger onClick
<TabsTrigger
  key={tab}
  value={tab}
  disabled={loading}
  onClick={() => handleTabChange(tab, subTabs[tab]?.[0] || '')}
  className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
>
  {tab}
</TabsTrigger>

                                        );
                                    })}
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
