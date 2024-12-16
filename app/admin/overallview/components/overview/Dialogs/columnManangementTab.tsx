// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrderManagement from './orderManagement';

interface ColumnManagementProps {
  structure: any;
  structureId: number;
  onUpdate: () => Promise<void>;
  supabase: any;
  activeMainTab: string;
}
interface OrderState {
  tabs: { [key: string]: number };
  sections: { [key: string]: number };
  subsections: { [key: string]: number };
  fields: { [key: string]: number };
}

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure,
  structureId,
  onUpdate,
  supabase,
  activeMainTab,
  mainTabs,
  subTabs,
}) => {
  const [loading, setLoading] = useState(false);
  const [lastMovedItem, setLastMovedItem] = useState<string | null>(null);
  const [allTabsData, setAllTabsData] = useState<any[]>([]);
  const [selectedMainTab, setSelectedMainTab] = useState(activeMainTab);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('');
  const [orderState, setOrderState] = useState<OrderState>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });
  // Fetch all tabs data
  useEffect(() => {
    const fetchAllTabs = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_category_table_mapping_2')
          .select('*')
          .order('main_tab', { ascending: true })
          .order('Tabs', { ascending: true });

        if (error) throw error;
        setAllTabsData(data || []);

        // Set initial sub tab
        if (data?.length > 0) {
          const firstSubTab = data.find(item => item.main_tab === selectedMainTab)?.Tabs;
          if (firstSubTab) setSelectedSubTab(firstSubTab);
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
        toast.error('Failed to load tabs data');
      }
    };

    fetchAllTabs();
  }, [supabase, selectedMainTab]);

  const handleReorder = async (
    type: 'tabs' | 'sections' | 'subsections' | 'fields',
    itemId: string,
    direction: 'up' | 'down',
    parentId?: string
  ) => {
    try {
      setLoading(true);
      const currentTab = allTabsData.find(
        tab => tab.main_tab === selectedMainTab && tab.Tabs === selectedSubTab
      );
      if (!currentTab) return;

      const updatedStructure = { ...currentTab.structure };
      let items: any[];
      let parentItems: any[];

      switch (type) {
        case 'tabs':
          items = allTabsData.filter(tab => tab.main_tab === selectedMainTab);
          break;
        case 'sections':
          items = updatedStructure.sections;
          break;
        case 'subsections':
          parentItems = updatedStructure.sections;
          items = parentItems.find(s => s.name === parentId)?.subsections || [];
          break;
        case 'fields':
          const section = updatedStructure.sections.find(s =>
            s.subsections.some(sub => sub.name === parentId)
          );
          items = section?.subsections.find(sub => sub.name === parentId)?.fields || [];
          break;
      }

      const currentIndex = items.findIndex(item =>
        type === 'fields' ? `${item.table}.${item.name}` === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      // Update order properties
      items.forEach((item, index) => {
        item.order = index + 1;
      });

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTab.id);

      if (error) throw error;

      // Update local state
      setAllTabsData(prev => prev.map(tab =>
        tab.id === currentTab.id ? { ...tab, structure: updatedStructure } : tab
      ));

      setLastMovedItem(itemId);
      setTimeout(() => setLastMovedItem(null), 2000);

      // Trigger updates
      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('refreshTable'));

    } catch (error) {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
    } finally {
      setLoading(false);
    }
  };
  // // Group tabs by main tab
  // const mainTabs = React.useMemo(() => {
  //   const groups = allTabsData.reduce((acc, tab) => {
  //     if (!acc[tab.main_tab]) acc[tab.main_tab] = [];
  //     acc[tab.main_tab].push(tab.Tabs);
  //     return acc;
  //   }, {});
  //   return groups;
  // }, [allTabsData]);

  const handleVisibilityToggle = async (
    type: 'sections' | 'subsections' | 'fields',
    parentId: string,
    itemId: string
  ) => {
    try {
      setLoading(true);
      const currentTab = allTabsData.find(
        tab => tab.main_tab === selectedMainTab && tab.Tabs === selectedSubTab
      );
      if (!currentTab) return;

      const updatedStructure = { ...currentTab.structure };
      let item;
      let cascadeUpdates = {};

      if (type === 'sections') {
        item = updatedStructure.sections.find(s => s.name === itemId);
        if (item) {
          const newVisibility = !item.visible;
          item.visible = newVisibility;

          // Cascade to all subsections and fields in this section
          item.subsections.forEach(subsection => {
            subsection.visible = newVisibility;
            subsection.fields.forEach(field => {
              field.visible = newVisibility;
              cascadeUpdates[`${field.table}.${field.name}`] = newVisibility;
            });
          });
        }
      } else if (type === 'subsections') {
        const section = updatedStructure.sections.find(s => s.name === parentId);
        item = section?.subsections.find(sub => sub.name === itemId);
        if (item) {
          const newVisibility = !item.visible;
          item.visible = newVisibility;

          // Cascade to all fields in this subsection
          item.fields.forEach(field => {
            field.visible = newVisibility;
            cascadeUpdates[`${field.table}.${field.name}`] = newVisibility;
          });
        }
      } else {
        const section = updatedStructure.sections.find(s =>
          s.subsections.some(sub => sub.name === parentId)
        );
        const subsection = section?.subsections.find(sub => sub.name === parentId);
        item = subsection?.fields.find(f => `${f.table}.${f.name}` === itemId);
        if (item) {
          item.visible = !item.visible;
        }
      }

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTab.id);

      if (error) throw error;

      // Update local state
      setAllTabsData(prev => prev.map(tab =>
        tab.id === currentTab.id ? { ...tab, structure: updatedStructure } : tab
      ));

      // Trigger updates
      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('refreshTable'));
      window.dispatchEvent(new CustomEvent('visibility-updated'));

    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (
    type: 'sections' | 'subsections' | 'fields',
    parentId: string,
    item: any,
    level: number = 0,
    index: number,
    totalItems: number
  ) => {
    const itemId = type === 'fields' ? `${item.table}.${item.name}` : item.name;
    const displayName = type === 'fields' ? item.display : item.name;
    const isHighlighted = lastMovedItem === itemId;
    const uniqueKey = `${type}-${parentId}-${itemId}-${index}`;

    return (
      <motion.div

        key={uniqueKey}
        initial={isHighlighted ? { backgroundColor: '#e3f2fd' } : {}}
        animate={isHighlighted ? { backgroundColor: '#ffffff' } : {}}
        transition={{ duration: 2 }}
        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors ${level > 0 ? `ml-${level * 4}` : ''
          }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{index + 1}.</span>
          <span className="flex-1 font-medium text-gray-700">{displayName}</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReorder(type, itemId, 'up', parentId)}
              disabled={index === 0 || loading}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReorder(type, itemId, 'down', parentId)}
              disabled={index === totalItems - 1 || loading}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Switch
            checked={item.visible}
            onCheckedChange={() => handleVisibilityToggle(type, parentId, itemId)}
            disabled={loading}
          />
        </div>
      </motion.div>
    );
  };

  const currentTabData = allTabsData.find(
    tab => tab.main_tab === selectedMainTab && tab.Tabs === selectedSubTab
  );

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <OrderManagement
            mainTabs={mainTabs}
            subTabs={subTabs}
            activeMainTab={activeMainTab}
            onReorder={onUpdate}
            supabase={supabase}
          />

          <Tabs value={selectedMainTab} onValueChange={setSelectedMainTab}>
            <TabsList>
              {Object.keys(mainTabs).map(tab => (
                <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(mainTabs).map(([mainTab, subTabs]) => (
              <TabsContent key={mainTab} value={mainTab}>
                <Tabs value={selectedSubTab} onValueChange={setSelectedSubTab}>
                  <TabsList>
                    {subTabs.map(tab => (
                      <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>

          <ScrollArea className="h-[600px]">
            {currentTabData?.structure?.sections
              .sort((a, b) => a.order - b.order)
              .map((section, sIndex, sections) => (

                <div key={`section-${section.name}-${sIndex}`} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow mb-4">
                  {renderItem('sections', '', section, 0, sIndex, sections.length)}
                  <div className="pl-4 space-y-3">
                    {section.subsections
                      .sort((a, b) => a.order - b.order)
                      .map((subsection, subIndex, subsections) => (

                        <div key={`subsection-${section.name}-${subsection.name}-${subIndex}`} className="bg-gray-50 rounded-md p-3">
                          {renderItem('subsections', section.name, subsection, 1, subIndex, subsections.length)}
                          <div className="pl-4 space-y-2 mt-2">
                            {subsection.fields
                              .sort((a, b) => a.order - b.order)
                              .map((field, fieldIndex, fields) =>
                                renderItem('fields', subsection.name, field, 2, fieldIndex, fields.length)
                              )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};