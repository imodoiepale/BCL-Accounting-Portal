'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@supabase/supabase-js';

interface TabData {
  id: number;
  main_tab: string;
  Tabs: string;
  structure: {
    order: {
      tab?: number;
      sections?: { [key: string]: number };
    };
    sections: Array<{
      name: string;
      order: number;
      visible: boolean;
      subsections: Array<{
        name: string;
        order: number;
        fields: Array<{
          name: string;
          order: number;
          table: string;
          display: string;
          visible: boolean;
          verification: {
            is_verified: boolean;
            verified_at: string | null;
            verified_by: string | null;
          };
          dropdownOptions: string[];
        }>;
        tables: string[];
        visible: boolean;
      }>;
    }>;
    visibility: {
      tab?: boolean;
      sections?: { [key: string]: boolean };
    };
    verification: {
      verified_at: string | null;
      verified_by: string | null;
      field_verified: boolean;
    };
    relationships: any;
  };
  created_at: string;
  updated_at: string;
  verification_status: {
    row_verifications: any;
    field_verifications: any;
    section_verifications: any;
  };
}

export default function ColumnManagementTab() {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await fetch('/api/profile-management/sidebar-tabs');
        if (!response.ok) {
          throw new Error('Failed to fetch tabs');
        }
        const data = await response.json();
        setTabs(data);
        
        if (data.length > 0) {
          const firstTab = data[0];
          setSelectedTab(firstTab.main_tab);
          if (firstTab.Tabs) {
            setSelectedSubTab(firstTab.Tabs);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tabs');
      } finally {
        setLoading(false);
      }
    };

    fetchTabs();
  }, []);

  const handleTabChange = (mainTab: string, subTab?: string) => {
    setSelectedTab(mainTab);
    if (subTab) {
      setSelectedSubTab(subTab);
    }
  };

  if (loading) {
    return <div className="p-4">Loading column management...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Group tabs by main_tab
  const groupedTabs = tabs.reduce((acc: { [key: string]: TabData[] }, tab: TabData) => {
    if (!acc[tab.main_tab]) {
      acc[tab.main_tab] = [];
    }
    acc[tab.main_tab].push(tab);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Column Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(groupedTabs).map(([mainTab, subTabs]) => (
              <AccordionItem key={mainTab} value={mainTab}>
                <AccordionTrigger
                  className={`px-4 py-2 text-left hover:bg-gray-100 ${
                    selectedTab === mainTab ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                  onClick={() => handleTabChange(mainTab)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{mainTab}</span>
                    <Badge variant="outline">
                      {subTabs.length} {subTabs.length === 1 ? 'tab' : 'tabs'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {subTabs.map((tab) => (
                      <Card key={`${tab.main_tab}-${tab.Tabs}`} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            <div className="flex items-center justify-between">
                              <span>{tab.Tabs}</span>
                              <Switch
                                checked={tab.structure.visibility?.tab ?? true}
                                aria-label={`Toggle ${tab.Tabs} visibility`}
                              />
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {tab.structure.sections.map((section) => (
                              <div key={section.name} className="border-l-2 border-l-gray-200 pl-4">
                                <Label className="flex items-center justify-between">
                                  <span>{section.name}</span>
                                  <Switch
                                    checked={section.visible}
                                    aria-label={`Toggle ${section.name} visibility`}
                                  />
                                </Label>
                                <div className="mt-2 space-y-2">
                                  {section.subsections.map((subsection) => (
                                    <div key={subsection.name} className="pl-4">
                                      <Label className="flex items-center justify-between text-sm">
                                        <span>{subsection.name}</span>
                                        <Switch
                                          checked={subsection.visible}
                                          aria-label={`Toggle ${subsection.name} visibility`}
                                        />
                                      </Label>
                                      <div className="mt-2 space-y-2">
                                        {subsection.fields.map((field) => (
                                          <div
                                            key={field.name}
                                            className="flex items-center justify-between pl-4 text-sm"
                                          >
                                            <span>{field.display || field.name}</span>
                                            <div className="flex items-center gap-2">
                                              {field.verification.is_verified && (
                                                <Badge variant="outline" className="bg-green-50">
                                                  Verified
                                                </Badge>
                                              )}
                                              <Switch
                                                checked={field.visible}
                                                aria-label={`Toggle ${field.display || field.name} visibility`}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
