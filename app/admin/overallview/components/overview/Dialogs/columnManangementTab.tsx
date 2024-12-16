// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColumnManagementProps {
  structure: any[];
  structureId: number;
  onUpdate: () => Promise<void>;
  supabase: any;
  activeMainTab: string;
  mainTabs?: string[];
  subTabs?: { [key: string]: string[] };
  visibilityState?: any;
}

interface OrderState {
  mainTabs: { [key: string]: number };
  sections: { [key: string]: number };
  subsections: { [key: string]: number };
  fields: { [key: string]: number };
}

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure = [],
  structureId,
  onUpdate,
  supabase,
  activeMainTab,
  mainTabs = [],
  subTabs = {},
  visibilityState = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [lastMovedItem, setLastMovedItem] = useState<string | null>(null);
  const [orderState, setOrderState] = useState<OrderState>({
    mainTabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });

  const handleReorder = async (
    type: 'mainTabs' | 'subTabs' | 'sections' | 'subsections' | 'fields',
    itemId: string,
    direction: 'up' | 'down',
    parentId?: string
  ) => {
    try {
      setLoading(true);

      // Get all relevant records
      const { data: allRecords, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (fetchError) throw fetchError;

      let items: any[];
      let recordToUpdate;

      switch (type) {
        case 'mainTabs':
          items = [...new Set(allRecords.map(r => r.main_tab))];
          break;
        case 'subTabs':
          items = allRecords
            .filter(r => r.main_tab === parentId)
            .map(r => r.Tabs);
          break;
        case 'sections':
          recordToUpdate = allRecords.find(r => r.main_tab === parentId);
          items = recordToUpdate?.structure?.sections || [];
          break;
        case 'subsections':
          recordToUpdate = allRecords.find(r => 
            r.structure?.sections?.some(s => s.name === parentId)
          );
          const section = recordToUpdate?.structure?.sections?.find(s => s.name === parentId);
          items = section?.subsections || [];
          break;
        case 'fields':
          recordToUpdate = allRecords.find(r => 
            r.structure?.sections?.some(s => 
              s.subsections?.some(sub => sub.name === parentId)
            )
          );
          const subsection = recordToUpdate?.structure?.sections
            ?.find(s => s.subsections?.some(sub => sub.name === parentId))
            ?.subsections?.find(sub => sub.name === parentId);
          items = subsection?.fields || [];
          break;
      }

      const currentIndex = items.findIndex(item => 
        type === 'fields' ? `${item.table}.${item.name}` === itemId : 
        typeof item === 'string' ? item === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      // Update order numbers
      items.forEach((item, index) => {
        if (typeof item !== 'string') {
          item.order = index + 1;
        }
      });

      // Update database based on type
      if (type === 'mainTabs' || type === 'subTabs') {
        // Update order in all affected records
        for (const record of allRecords) {
          const { error: updateError } = await supabase
            .from('profile_category_table_mapping_2')
            .update({
              order: items.indexOf(record[type === 'mainTabs' ? 'main_tab' : 'Tabs']) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

          if (updateError) throw updateError;
        }
      } else if (recordToUpdate) {
        // Update structure for sections/subsections/fields
        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: recordToUpdate.structure,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordToUpdate.id);

        if (updateError) throw updateError;
      }

      setLastMovedItem(itemId);
      setTimeout(() => setLastMovedItem(null), 2000);

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

  const handleVisibilityToggle = async (
    type: 'mainTabs' | 'subTabs' | 'sections' | 'subsections' | 'fields',
    itemId: string,
    parentId?: string
  ) => {
    try {
      setLoading(true);

      const { data: allRecords, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (fetchError) throw fetchError;

      let recordToUpdate;
      let newVisibility;

      switch (type) {
        case 'mainTabs':
        case 'subTabs':
          // Update visibility in all relevant records
          for (const record of allRecords) {
            if ((type === 'mainTabs' && record.main_tab === itemId) ||
                (type === 'subTabs' && record.Tabs === itemId)) {
              const updatedStructure = {
                ...record.structure,
                visibility: {
                  ...record.structure?.visibility,
                  [type]: {
                    ...record.structure?.visibility?.[type],
                    [itemId]: !record.structure?.visibility?.[type]?.[itemId]
                  }
                }
              };

              const { error: updateError } = await supabase
                .from('profile_category_table_mapping_2')
                .update({
                  structure: updatedStructure,
                  updated_at: new Date().toISOString()
                })
                .eq('id', record.id);

              if (updateError) throw updateError;
            }
          }
          break;

        default:
          recordToUpdate = allRecords.find(r => {
            if (type === 'sections') return r.structure?.sections?.some(s => s.name === itemId);
            if (type === 'subsections') return r.structure?.sections?.some(s => s.subsections?.some(sub => sub.name === itemId));
            return r.structure?.sections?.some(s => s.subsections?.some(sub => sub.fields?.some(f => `${f.table}.${f.name}` === itemId)));
          });

          if (recordToUpdate) {
            const updatedStructure = { ...recordToUpdate.structure };

            if (type === 'sections') {
              const section = updatedStructure.sections?.find(s => s.name === itemId);
              if (section) {
                section.visible = !section.visible;
                // Cascade visibility
                section.subsections?.forEach(sub => {
                  sub.visible = section.visible;
                  sub.fields?.forEach(f => f.visible = section.visible);
                });
              }
            } else if (type === 'subsections') {
              const section = updatedStructure.sections?.find(s => s.subsections?.some(sub => sub.name === itemId));
              const subsection = section?.subsections?.find(sub => sub.name === itemId);
              if (subsection) {
                subsection.visible = !subsection.visible;
                // Cascade visibility
                subsection.fields?.forEach(f => f.visible = subsection.visible);
              }
            } else {
              const section = updatedStructure.sections?.find(s => 
                s.subsections?.some(sub => sub.fields?.some(f => `${f.table}.${f.name}` === itemId))
              );
              const subsection = section?.subsections?.find(sub => 
                sub.fields?.some(f => `${f.table}.${f.name}` === itemId)
              );
              const field = subsection?.fields?.find(f => `${f.table}.${f.name}` === itemId);
              if (field) {
                field.visible = !field.visible;
              }
            }

            const { error: updateError } = await supabase
              .from('profile_category_table_mapping_2')
              .update({
                structure: updatedStructure,
                updated_at: new Date().toISOString()
              })
              .eq('id', recordToUpdate.id);

            if (updateError) throw updateError;
          }
      }

      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('visibility-updated'));

    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (
    type: 'mainTabs' | 'subTabs' | 'sections' | 'subsections' | 'fields',
    item: any,
    index: number,
    totalItems: number,
    parentId?: string,
    level: number = 0
  ) => {
    const itemId = type === 'fields' ? `${item.table}.${item.name}` : 
                   typeof item === 'string' ? item : item.name;
    const displayName = type === 'fields' ? item.display : 
                       typeof item === 'string' ? item : item.name;
    const isHighlighted = lastMovedItem === itemId;
    const isVisible = type === 'mainTabs' || type === 'subTabs' 
      ? !visibilityState?.[type]?.[itemId]
      : item.visible;

    return (
      <motion.div
        key={`${type}-${itemId}-${index}`}
        initial={isHighlighted ? { backgroundColor: '#e3f2fd' } : {}}
        animate={isHighlighted ? { backgroundColor: '#ffffff' } : {}}
        transition={{ duration: 2 }}
        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors ${
          level > 0 ? `ml-${level * 4}` : ''
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
            checked={isVisible}
            onCheckedChange={() => handleVisibilityToggle(type, itemId, parentId)}
            disabled={loading}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {/* Fully Nested Structure */}
            <div className="space-y-4">
              {mainTabs.map((mainTab, mainIndex) => (
                <div key={mainTab} className="border rounded-lg p-4">
                  {/* Main Tab */}
                  {renderItem('mainTabs', mainTab, mainIndex, mainTabs.length)}
                  
                  {/* Sub Tabs */}
                  <div className="ml-6 mt-2 space-y-4">
                    {(subTabs[mainTab] || []).map((subTab, subIndex) => {
                      const currentStructure = structure.find(
                        item => item.main_tab === mainTab && item.Tabs === subTab
                      );
                      const sections = currentStructure?.structure?.sections || [];

                      return (
                        <div key={subTab} className="border-l-2 pl-4 pb-2">
                          {/* Sub Tab */}
                          {renderItem('subTabs', subTab, subIndex, subTabs[mainTab].length, mainTab)}

                          {/* Sections */}
                          <div className="ml-6 mt-2 space-y-4">
                            {sections.map((section, sectionIndex) => (
                              <div key={section.name} className="border-l-2 pl-4 pb-2">
                                {/* Section */}
                                {renderItem('sections', section, sectionIndex, sections.length, mainTab)}

                                {/* Subsections */}
                                <div className="ml-6 mt-2 space-y-4">
                                  {(section.subsections || []).map((subsection, subsectionIndex) => (
                                    <div key={subsection.name} className="border-l-2 pl-4 pb-2">
                                      {/* Subsection */}
                                      {renderItem('subsections', subsection, subsectionIndex, section.subsections.length, section.name)}

                                      {/* Fields */}
                                      <div className="ml-6 mt-2 space-y-2">
                                        {(subsection.fields || []).map((field, fieldIndex) => (
                                          <div key={`${field.table}.${field.name}`} className="border-l-2 pl-4 pb-2">
                                            {renderItem('fields', field, fieldIndex, subsection.fields.length, subsection.name)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};