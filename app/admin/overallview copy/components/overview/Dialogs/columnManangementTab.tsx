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
import { supabase } from '@/lib/supabase';

export const ColumnManagement = ({
  structure = [],
  onUpdate,
  supabase,
  mainTabs = [],
  subTabs = {},
  visibilityState = {},
  activeMainTab
}) => {
  const [loading, setLoading] = useState(false);
  const [mainTabsData, setMainTabsData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [localOrder, setLocalOrder] = useState({});
  const [localVisibility, setLocalVisibility] = useState({});

  useEffect(() => {
    fetchMainTabs();
  }, [supabase]);

  useEffect(() => {
    const handleStateChange = (event) => {
      const { newState } = event.detail;
      setLocalOrder(newState);
    };

    window.addEventListener('state-changed', handleStateChange);
    return () => {
      window.removeEventListener('state-changed', handleStateChange);
    };
  }, []);

  useEffect(() => {
    const fetchStructure = async () => {
      const { data, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');
      if (data) {
        trackPositions(data);
        trackVisibility(data);
      }
    };
    fetchStructure();
  }, []);

  const trackPositions = (items) => {
    const newOrder = {};
    items.forEach((item, index) => {
      newOrder[item.mainTab] = index;
      item.sections.forEach((section, sectionIndex) => {
        newOrder[section.name] = sectionIndex;
        section.subsections.forEach((subsection, subsectionIndex) => {
          newOrder[subsection.name] = subsectionIndex;
        });
      });
    });
    setLocalOrder(newOrder);
  };

  const trackVisibility = (items) => {
    const newVisibility = {};
    items.forEach((item) => {
      newVisibility[item.mainTab] = item.structure?.visibility[item.mainTab] || true;
      item.sections.forEach((section) => {
        newVisibility[section.name] = section.visible;
        section.subsections.forEach((subsection) => {
          newVisibility[subsection.name] = subsection.visible;
        });
      });
    });
    setLocalVisibility(newVisibility);
  };

  const handleReorder = (itemId, direction) => {
    const currentIndex = localOrder[itemId];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= Object.keys(localOrder).length) return;

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
            fields: {},
            order: item.structure.order || {},
            visibility: item.structure.visibility || {}
          };
        }

        acc[mainTab].tabs.push(item.Tabs);
        acc[mainTab].structures.push(item.structure);

        // Process sections and subsections with order and visibility
        item.structure.sections?.forEach(section => {
          if (!acc[mainTab].sections.includes(section.name)) {
            acc[mainTab].sections.push(section.name);
          }
          
          acc[mainTab].subsections[section.name] = section.subsections?.map(sub => ({
            name: sub.name,
            fields: sub.fields,
            order: sub.order,
            visible: sub.visible
          })) || [];

          // Process fields with order and visibility
          section.subsections?.forEach(sub => {
            sub.fields?.forEach(field => {
              const fieldKey = `${field.table}-${field.name}`;
              acc[mainTab].fields[fieldKey] = {
                ...field,
                order: field.order,
                visible: field.visible
              };
            });
          });
        });

        return acc;
      }, {});

      const mainTabsArray = Object.values(groupedMainTabs);
      
      // Sort mainTabs based on order from structure
      mainTabsArray.sort((a, b) => {
        const orderA = a.order?.main_tab || 0;
        const orderB = b.order?.main_tab || 0;
        return orderA - orderB;
      });

      setMainTabsData(mainTabsArray);
      
      // Initialize local state with actual order values
      const orderState = {};
      const visibilityState = {};
      
      mainTabsArray.forEach(tab => {
        orderState[tab.mainTab] = tab.order?.main_tab || 0;
        visibilityState[tab.mainTab] = tab.visibility?.mainTab?.[tab.mainTab] ?? true;
      });

      setLocalOrder(orderState);
      setLocalVisibility(visibilityState);

    } catch (error) {
      console.error('Error fetching main tabs:', error);
      toast.error('Failed to fetch structure');
    }
  };

  const updateStructure = async (mainTab, newOrder, newVisibility) => {
    try {
      const updates = mainTabsData.map(async (tab) => {
        // Create updated structure with new order and visibility
        const updatedStructure = {
          ...tab.structures[0],
          order: {
            ...tab.structures[0].order,
            main_tab: newOrder
          },
          visibility: {
            ...tab.structures[0].visibility,
            mainTab: {
              ...tab.structures[0].visibility?.mainTab,
              [mainTab]: newVisibility[mainTab]
            }
          }
        };

        const { error } = await supabase
          .from('profile_category_table_mapping_2')
          .update({ structure: updatedStructure })
          .eq('main_tab', tab.mainTab);

        if (error) throw error;
      });

      await Promise.all(updates);
      
      // Emit event to trigger overview page update
      window.dispatchEvent(new Event('structure-updated'));
      
      return true;
    } catch (error) {
      console.error('Error updating structure:', error);
      return false;
    }
  };

  // const handleReorder = async (type, itemId, direction) => {
  //   const currentIndex = Object.values(localOrder).indexOf(localOrder[itemId]);
  //   const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  //   if (newIndex >= 0 && newIndex < mainTabsData.length) {
  //     // Optimistic update
  //     const newOrder = { ...localOrder };
  //     const items = Object.keys(newOrder);
  //     [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
      
  //     // Update order numbers to match physical position
  //     items.forEach((item, index) => {
  //       newOrder[item] = index;
  //     });
      
  //     setLocalOrder(newOrder);

  //     try {
  //       const success = await updateStructure(itemId, newOrder, localVisibility);
  //       if (success) {
  //         toast.success('Order updated successfully');
  //       } else {
  //         throw new Error('Update failed');
  //       }
  //     } catch (error) {
  //       setLocalOrder(prevOrder => ({ ...prevOrder }));
  //       toast.error('Failed to update order');
  //     }
  //   }
  // };

  const handleVisibilityToggle = async (type, itemId) => {
    const newVisibility = {
      ...localVisibility,
      [itemId]: !localVisibility[itemId]
    };
    
    setLocalVisibility(newVisibility);

    try {
      const success = await updateStructure(itemId, localOrder, newVisibility);
      if (success) {
        toast.success('Visibility updated successfully');
      } else {
        throw new Error('Update failed');
      }
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
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorder('subsection', subsection.name, 'up')}
                                      disabled={localOrder[subsection.name] === 0}
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorder('subsection', subsection.name, 'down')}
                                      disabled={localOrder[subsection.name] === mainTab.subsections[section].length - 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Switch
                                    checked={localVisibility[subsection.name]}
                                    onCheckedChange={() => handleVisibilityToggle('subsection', subsection.name)}
                                    disabled={loading}
                                  />
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
