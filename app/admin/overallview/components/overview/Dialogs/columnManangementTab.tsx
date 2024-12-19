// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const ColumnManagement = ({
  structure = [],
  onUpdate,
  supabase,
  mainTabs = [],
  subTabs = {},
  visibilityState = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [mainTabsData, setMainTabsData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [localOrder, setLocalOrder] = useState({});
  const [localVisibility, setLocalVisibility] = useState({});

  useEffect(() => {
    fetchMainTabs();
  }, [supabase]);

  const fetchMainTabs = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('main_tab, "Tabs", structure')
        .order('main_tab');

      if (error) throw error;

      const groupedMainTabs = data.reduce((acc, item) => {
        const mainTab = item.main_tab;
        if (!acc[mainTab]) {
          acc[mainTab] = {
            mainTab,
            tabs: [],
            structures: [],
            sections: [],
            subsections: {},
            columnMappings: {}
          };
        }
        acc[mainTab].tabs.push(item.Tabs);
        acc[mainTab].structures.push(item.structure);

        // Process sections and subsections
        item.structure.sections?.forEach(section => {
          if (!acc[mainTab].sections.includes(section.name)) {
            acc[mainTab].sections.push(section.name);
          }
          
          acc[mainTab].subsections[section.name] = section.subsections?.map(sub => ({
            name: sub.name,
            fields: sub.fields
          })) || [];
        });

        return acc;
      }, {});

      const mainTabsArray = Object.values(groupedMainTabs);
      setMainTabsData(mainTabsArray);
      
      // Initialize local state
      const orderState = {};
      const visibilityState = {};
      mainTabsArray.forEach((tab, index) => {
        orderState[tab.mainTab] = index;
        visibilityState[tab.mainTab] = tab.structures[0]?.visibility?.mainTab?.[tab.mainTab] ?? true;
      });
      setLocalOrder(orderState);
      setLocalVisibility(visibilityState);
    } catch (error) {
      console.error('Error fetching main tabs:', error);
      toast.error('Failed to fetch structure');
    }
  };

  const handleReorder = async (type, itemId, direction) => {
    const currentIndex = Object.values(localOrder).indexOf(localOrder[itemId]);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < mainTabsData.length) {
      // Optimistic update
      const newOrder = { ...localOrder };
      const items = Object.keys(newOrder);
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
      items.forEach((item, index) => {
        newOrder[item] = index;
      });
      setLocalOrder(newOrder);

      try {
        const updates = mainTabsData.map(async (tab) => {
          const updatedStructure = {
            ...tab.structures[0],
            order: {
              ...tab.structures[0].order,
              main_tab: newOrder
            }
          };

          return supabase
            .from('profile_category_table_mapping_2')
            .update({ structure: updatedStructure })
            .eq('main_tab', tab.mainTab);
        });

        await Promise.all(updates);
        toast.success('Order updated successfully');
      } catch (error) {
        setLocalOrder(prevOrder => ({ ...prevOrder }));
        toast.error('Failed to update order');
      }
    }
  };

  const handleVisibilityToggle = async (type, itemId) => {
    setLocalVisibility(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));

    try {
      const relevantTab = mainTabsData.find(tab => tab.mainTab === itemId);
      if (!relevantTab) return;

      const updatedStructure = {
        ...relevantTab.structures[0],
        visibility: {
          ...relevantTab.structures[0].visibility,
          mainTab: {
            ...relevantTab.structures[0].visibility?.mainTab,
            [itemId]: !localVisibility[itemId]
          }
        }
      };

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('main_tab', itemId);

      if (error) throw error;
      toast.success('Visibility updated successfully');
    } catch (error) {
      setLocalVisibility(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
      toast.error('Failed to update visibility');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px]">
          <AnimatePresence>
            {mainTabsData.map((mainTab) => (
              <motion.div
                key={mainTab.mainTab}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="border rounded-lg p-4 mb-4"
              >
                {/* Main Tab Header */}
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedItems(prev => ({
                        ...prev,
                        [mainTab.mainTab]: !prev[mainTab.mainTab]
                      }))}
                      className="p-0 h-6 w-6"
                    >
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${
                          expandedItems[mainTab.mainTab] ? 'rotate-90' : ''
                        }`}
                      />
                    </Button>
                    <span className="font-semibold">{mainTab.mainTab}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('main_tab', mainTab.mainTab, 'up')}
                        disabled={localOrder[mainTab.mainTab] === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('main_tab', mainTab.mainTab, 'down')}
                        disabled={localOrder[mainTab.mainTab] === mainTabsData.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Switch
                      checked={localVisibility[mainTab.mainTab]}
                      onCheckedChange={() => handleVisibilityToggle('main_tab', mainTab.mainTab)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedItems[mainTab.mainTab] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 mt-2 space-y-4"
                    >
                      {/* Tabs Section */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Tabs</h4>
                        {mainTab.tabs.map((tab, index) => (
                          <motion.div
                            key={tab}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="p-2 hover:bg-gray-50 rounded"
                          >
                            {tab}
                          </motion.div>
                        ))}
                      </div>

                      {/* Sections and Subsections */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Sections & Subsections</h4>
                        {mainTab.sections.map((section, sectionIndex) => (
                          <motion.div
                            key={section}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: sectionIndex * 0.05 }}
                            className="pl-2 border-l-2 border-gray-200"
                          >
                            <div className="p-2 font-medium">{section}</div>
                            <div className="ml-4 space-y-1">
                              {mainTab.subsections[section]?.map((subsection, subIndex) => (
                                <motion.div
                                  key={subsection.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: subIndex * 0.03 }}
                                  className="p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{subsection.name}</span>
                                  </div>
                                  <div className="ml-4 mt-1 text-sm text-gray-600">
                                    {(subsection.fields && Array.isArray(subsection.fields)) ? subsection.fields.map(field => (
                                      <div key={`${field.table}-${field.name}`} className="py-1">
                                        {field.display || `${field.table}.${field.name}`}
                                      </div>
                                    )) : null}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
